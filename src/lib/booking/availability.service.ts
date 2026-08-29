import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { clinicWhere, resolveClinicId, type TenantScope } from '@/lib/tenancy/scope';
import { BLOCKING_APPOINTMENT_STATUSES } from '@/lib/booking/constants';
import {
  computeAvailableSlots,
  type AvailabilityRequest,
  type BusyInterval,
  type LocalWindow,
} from '@/lib/booking/availability-core';
import {
  addDaysToDateKey,
  dateKeyInRange,
  dateKeyRange,
  endOfLocalDay,
  sameMonthAndDay,
  startOfLocalDay,
  toDateKey,
  weekdayOf,
} from '@/lib/time/timezone';

/**
 * Availability, resolved against the database.
 *
 * This module's only job is to assemble the inputs the pure engine needs and
 * hand them over. All scheduling rules live in `availability-core`; anything
 * that looks like a rule in here is a bug.
 */

export interface SlotQuery {
  clinicId?: string | null;
  serviceId: string;
  /** Omit to search every doctor who offers the service. */
  doctorId?: string | null;
  /** Inclusive local date range. Defaults to `fromDateKey` only. */
  fromDateKey: string;
  toDateKey?: string;
  /** Cap on returned slots (the AI is given a small number to offer). */
  limit?: number;
  /** Injected for deterministic tests. */
  now?: Date;
}

export interface ResolvedSlot {
  start: Date;
  end: Date;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  bufferMinutes: number;
  timezone: string;
  /** Stable token the AI echoes back when booking, so it cannot invent a time. */
  slotToken: string;
}

/** Opaque-ish handle for a slot; parsed and re-validated server-side on booking. */
export const encodeSlotToken = (doctorId: string, serviceId: string, start: Date): string =>
  `${doctorId}:${serviceId}:${start.toISOString()}`;

export function decodeSlotToken(token: string): {
  doctorId: string;
  serviceId: string;
  start: Date;
} {
  const parts = token.split(':');
  // The ISO timestamp itself contains colons, so rejoin the tail.
  if (parts.length < 3) throw badRequest('Malformed slot reference.');
  const [doctorId, serviceId, ...rest] = parts;
  const iso = rest.join(':');
  const start = new Date(iso);
  if (!doctorId || !serviceId || Number.isNaN(start.getTime())) {
    throw badRequest('Malformed slot reference.');
  }
  return { doctorId, serviceId, start };
}

// --- Configuration assembly ----------------------------------------------

export interface SchedulingConfig {
  clinicId: string;
  timezone: string;
  settings: {
    defaultAppointmentMinutes: number;
    defaultBufferMinutes: number;
    slotGranularityMinutes: number;
    minAdvanceBookingMinutes: number;
    maxAdvanceBookingDays: number;
    cancellationCutoffHours: number;
    allowPatientCancellation: boolean;
    allowPatientReschedule: boolean;
    maxSlotsOfferedToAI: number;
  };
}

const DEFAULT_SETTINGS: SchedulingConfig['settings'] = {
  defaultAppointmentMinutes: 30,
  defaultBufferMinutes: 0,
  slotGranularityMinutes: 15,
  minAdvanceBookingMinutes: 60,
  maxAdvanceBookingDays: 60,
  cancellationCutoffHours: 4,
  allowPatientCancellation: true,
  allowPatientReschedule: true,
  maxSlotsOfferedToAI: 5,
};

export async function loadSchedulingConfig(
  scope: TenantScope,
  requestedClinicId?: string | null,
  db: DbClient = prisma,
): Promise<SchedulingConfig> {
  const clinicId = resolveClinicId(scope, requestedClinicId);
  const clinic = await db.clinic.findUnique({
    where: { id: clinicId },
    select: { id: true, timezone: true, isActive: true, settings: true },
  });
  if (!clinic) throw notFound('Clinic not found.');

  return {
    clinicId: clinic.id,
    timezone: clinic.timezone,
    settings: clinic.settings
      ? {
          defaultAppointmentMinutes: clinic.settings.defaultAppointmentMinutes,
          defaultBufferMinutes: clinic.settings.defaultBufferMinutes,
          slotGranularityMinutes: clinic.settings.slotGranularityMinutes,
          minAdvanceBookingMinutes: clinic.settings.minAdvanceBookingMinutes,
          maxAdvanceBookingDays: clinic.settings.maxAdvanceBookingDays,
          cancellationCutoffHours: clinic.settings.cancellationCutoffHours,
          allowPatientCancellation: clinic.settings.allowPatientCancellation,
          allowPatientReschedule: clinic.settings.allowPatientReschedule,
          maxSlotsOfferedToAI: clinic.settings.maxSlotsOfferedToAI,
        }
      : DEFAULT_SETTINGS,
  };
}

/**
 * Effective appointment length and buffer for a doctor+service pairing.
 * Precedence: doctor override → service value → clinic default.
 */
export function resolveDurations(
  config: SchedulingConfig,
  service: { durationMinutes: number; bufferMinutes: number | null },
  doctor: { appointmentMinutes: number | null; bufferMinutes: number | null },
): { durationMinutes: number; bufferMinutes: number } {
  return {
    durationMinutes:
      doctor.appointmentMinutes ??
      service.durationMinutes ??
      config.settings.defaultAppointmentMinutes,
    bufferMinutes:
      doctor.bufferMinutes ?? service.bufferMinutes ?? config.settings.defaultBufferMinutes,
  };
}

// --- Main query -----------------------------------------------------------

export async function getAvailableSlots(
  scope: TenantScope,
  query: SlotQuery,
  db: DbClient = prisma,
): Promise<ResolvedSlot[]> {
  const config = await loadSchedulingConfig(scope, query.clinicId, db);
  const { clinicId, timezone } = config;
  const now = query.now ?? new Date();

  const service = await db.service.findFirst({
    where: { id: query.serviceId, clinicId, isActive: true },
    select: { id: true, name: true, durationMinutes: true, bufferMinutes: true },
  });
  if (!service) throw notFound('Service not found or inactive.');

  const doctors = await db.doctor.findMany({
    where: {
      clinicId,
      isActive: true,
      ...(query.doctorId ? { id: query.doctorId } : {}),
      services: { some: { serviceId: service.id } },
    },
    select: {
      id: true,
      name: true,
      appointmentMinutes: true,
      bufferMinutes: true,
      schedules: { select: { weekday: true, startMinute: true, endMinute: true } },
      breaks: { select: { weekday: true, startMinute: true, endMinute: true } },
      timeOff: {
        select: { startDate: true, endDate: true, startMinute: true, endMinute: true },
      },
    },
  });
  if (doctors.length === 0) return [];

  // Clamp the requested range to the clinic's booking horizon before doing work.
  const todayKey = toDateKey(now, timezone);
  const horizonKey = addDaysToDateKey(todayKey, config.settings.maxAdvanceBookingDays, timezone);
  const fromKey = query.fromDateKey < todayKey ? todayKey : query.fromDateKey;
  const requestedToKey = query.toDateKey ?? query.fromDateKey;
  const toKey = requestedToKey > horizonKey ? horizonKey : requestedToKey;
  if (toKey < fromKey) return [];

  const dateKeys = dateKeyRange(fromKey, toKey, timezone, 120);
  if (dateKeys.length === 0) return [];

  const rangeStart = startOfLocalDay(dateKeys[0]!, timezone);
  const rangeEnd = endOfLocalDay(dateKeys[dateKeys.length - 1]!, timezone);

  const [clinicHours, holidays, closures, appointments] = await Promise.all([
    db.clinicHours.findMany({
      where: { clinicId },
      select: { weekday: true, startMinute: true, endMinute: true, isClosed: true },
    }),
    db.holiday.findMany({
      where: { clinicId },
      select: { date: true, isRecurringAnnually: true },
    }),
    db.specialClosure.findMany({
      where: { clinicId, startDate: { lte: toKey }, endDate: { gte: fromKey } },
      select: { startDate: true, endDate: true, startMinute: true, endMinute: true },
    }),
    db.appointment.findMany({
      where: {
        clinicId,
        doctorId: { in: doctors.map((d) => d.id) },
        status: { in: [...BLOCKING_APPOINTMENT_STATUSES] },
        // Overlap test against the queried range, on the occupied interval.
        blockStartsAt: { lt: rangeEnd },
        blockEndsAt: { gt: rangeStart },
      },
      select: { doctorId: true, blockStartsAt: true, blockEndsAt: true },
    }),
  ]);

  const busyByDoctor = new Map<string, BusyInterval[]>();
  for (const a of appointments) {
    const list = busyByDoctor.get(a.doctorId) ?? [];
    list.push({ start: a.blockStartsAt, end: a.blockEndsAt });
    busyByDoctor.set(a.doctorId, list);
  }

  const earliestStart = new Date(now.getTime() + config.settings.minAdvanceBookingMinutes * 60_000);
  const latestStart = endOfLocalDay(horizonKey, timezone);

  const results: ResolvedSlot[] = [];

  for (const dateKey of dateKeys) {
    const weekday = weekdayOf(dateKey, timezone);

    const isHoliday = holidays.some((h) =>
      h.isRecurringAnnually ? sameMonthAndDay(h.date, dateKey) : h.date === dateKey,
    );

    const todaysClosures = closures.filter((c) =>
      dateKeyInRange(dateKey, c.startDate, c.endDate),
    );
    const closedAllDayByClosure = todaysClosures.some(
      (c) => c.startMinute === null || c.endMinute === null,
    );
    const partialClosureWindows: LocalWindow[] = todaysClosures
      .filter((c) => c.startMinute !== null && c.endMinute !== null)
      .map((c) => ({ startMinute: c.startMinute!, endMinute: c.endMinute! }));

    const clinicWindows: LocalWindow[] = clinicHours
      .filter((h) => h.weekday === weekday && !h.isClosed)
      .map((h) => ({ startMinute: h.startMinute, endMinute: h.endMinute }));

    for (const doctor of doctors) {
      const { durationMinutes, bufferMinutes } = resolveDurations(config, service, doctor);

      const doctorWindows: LocalWindow[] = doctor.schedules
        .filter((s) => s.weekday === weekday)
        .map((s) => ({ startMinute: s.startMinute, endMinute: s.endMinute }));

      const breakWindows: LocalWindow[] = doctor.breaks
        .filter((b) => b.weekday === weekday)
        .map((b) => ({ startMinute: b.startMinute, endMinute: b.endMinute }));

      const todaysTimeOff = doctor.timeOff.filter((t) =>
        dateKeyInRange(dateKey, t.startDate, t.endDate),
      );
      const doctorOffAllDay = todaysTimeOff.some(
        (t) => t.startMinute === null || t.endMinute === null,
      );
      const partialTimeOff: LocalWindow[] = todaysTimeOff
        .filter((t) => t.startMinute !== null && t.endMinute !== null)
        .map((t) => ({ startMinute: t.startMinute!, endMinute: t.endMinute! }));

      const request: AvailabilityRequest = {
        timezone,
        dateKey,
        clinicWindows,
        doctorWindows,
        blockedWindows: [...breakWindows, ...partialClosureWindows, ...partialTimeOff],
        isClosedAllDay: isHoliday || closedAllDayByClosure || doctorOffAllDay,
        serviceDurationMinutes: durationMinutes,
        bufferMinutes,
        granularityMinutes: config.settings.slotGranularityMinutes,
        busy: busyByDoctor.get(doctor.id) ?? [],
        earliestStart,
        latestStart,
      };

      for (const slot of computeAvailableSlots(request)) {
        results.push({
          start: slot.start,
          end: slot.end,
          doctorId: doctor.id,
          doctorName: doctor.name,
          serviceId: service.id,
          serviceName: service.name,
          durationMinutes,
          bufferMinutes,
          timezone,
          slotToken: encodeSlotToken(doctor.id, service.id, slot.start),
        });
      }
    }
  }

  results.sort((a, b) => a.start.getTime() - b.start.getTime() || a.doctorId.localeCompare(b.doctorId));
  return typeof query.limit === 'number' ? results.slice(0, Math.max(0, query.limit)) : results;
}

/**
 * Re-check a single slot. Called inside the booking transaction, so the answer
 * reflects the state the insert will actually contend with.
 */
export async function isSlotStillAvailable(
  scope: TenantScope,
  params: {
    clinicId?: string | null;
    doctorId: string;
    serviceId: string;
    start: Date;
    now?: Date;
    /** Ignore this appointment when checking (used when rescheduling). */
    excludeAppointmentId?: string;
  },
  db: DbClient = prisma,
): Promise<boolean> {
  const config = await loadSchedulingConfig(scope, params.clinicId, db);
  const dateKey = toDateKey(params.start, config.timezone);

  const slots = await getAvailableSlots(
    scope,
    {
      clinicId: config.clinicId,
      serviceId: params.serviceId,
      doctorId: params.doctorId,
      fromDateKey: dateKey,
      toDateKey: dateKey,
      now: params.now,
    },
    db,
  );

  if (slots.some((s) => s.start.getTime() === params.start.getTime())) return true;

  // When rescheduling, the appointment being moved still occupies its own slot.
  // Treat "the only thing in the way is me" as available.
  if (params.excludeAppointmentId) {
    const self = await db.appointment.findUnique({
      where: { id: params.excludeAppointmentId },
      select: { id: true, clinicId: true, doctorId: true, startsAt: true },
    });
    if (
      self &&
      self.clinicId === config.clinicId &&
      self.doctorId === params.doctorId &&
      self.startsAt.getTime() === params.start.getTime()
    ) {
      return true;
    }
  }
  return false;
}

/** Doctor + service pairs a clinic can actually schedule — used by admin UIs. */
export async function listBookableCombinations(scope: TenantScope, clinicId?: string | null) {
  const where = clinicWhere(scope, clinicId);
  return prisma.doctorService.findMany({
    where,
    select: {
      doctor: { select: { id: true, name: true, isActive: true } },
      service: { select: { id: true, name: true, durationMinutes: true, isActive: true } },
    },
  });
}
