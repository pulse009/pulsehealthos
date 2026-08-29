import 'server-only';
import type { AppointmentSource, AppointmentStatus, Prisma as PrismaTypes } from '@prisma/client';
import {
  prisma,
  isSlotConflictError,
  isIdempotencyConflictError,
  type DbClient,
} from '@/lib/db/prisma';
import { badRequest, forbidden, notFound } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';
import { recordAudit } from '@/lib/audit';
import { assertOwned, resolveClinicId, type TenantScope } from '@/lib/tenancy/scope';
import {
  loadSchedulingConfig,
  resolveDurations,
  isSlotStillAvailable,
  getAvailableSlots,
  type ResolvedSlot,
} from '@/lib/booking/availability.service';
import { ACTIVE_APPOINTMENT_STATUSES, isActiveStatus } from '@/lib/booking/constants';
import { toDateKey, addDaysToDateKey, formatInstant } from '@/lib/time/timezone';
import { scheduleRemindersFor, cancelRemindersFor } from '@/lib/reminders/scheduler';
import { ensurePatientUserAccount } from '@/lib/auth/patient-account';

/**
 * The booking engine.
 *
 * Design rule: the database is the arbiter of whether a slot is free. The
 * availability re-check inside the transaction exists to produce a *good error
 * message* and to enforce rules the database cannot express (opening hours,
 * notice periods). It is not what prevents double booking — the exclusion
 * constraint is. Any code path that treats the pre-check as sufficient is wrong.
 *
 * Concretely, two concurrent requests for the same slot will both pass the
 * pre-check and both attempt the insert; exactly one commits and the other
 * receives SQLSTATE 23P01/23505, which surfaces here as `SLOT_TAKEN`.
 */

export interface AppointmentDetail {
  id: string;
  clinicId: string;
  appointmentNumber: number | null;
  fileNumber: number | null;
  patientCredentials?: {
    email: string;
    temporaryPassword?: string;
    isNewAccount: boolean;
  } | null;
  status: AppointmentStatus;
  startsAt: Date;
  endsAt: Date;
  timezone: string;
  doctorId: string;
  doctorName: string;
  serviceId: string;
  serviceName: string;
  patientId: string;
  patientName: string | null;
  patientPhone: string;
  patientEmail: string | null;
  notes: string | null;
}

export type BookingFailureReason =
  | 'SLOT_TAKEN'
  | 'OUTSIDE_AVAILABILITY'
  | 'TOO_SOON'
  | 'TOO_FAR'
  | 'IN_THE_PAST';

export type BookingResult =
  | { ok: true; appointment: AppointmentDetail; deduplicated: boolean }
  | { ok: false; reason: BookingFailureReason; message: string; alternatives: ResolvedSlot[] };

const APPOINTMENT_INCLUDE = {
  doctor: { select: { id: true, name: true } },
  service: { select: { id: true, name: true } },
  patient: { select: { id: true, name: true, phone: true, email: true, fileNumber: true } },
} satisfies PrismaTypes.AppointmentInclude;

type AppointmentRow = PrismaTypes.AppointmentGetPayload<{ include: typeof APPOINTMENT_INCLUDE }>;

function toDetail(
  row: AppointmentRow,
  patientCredentials?: { email: string; temporaryPassword?: string; isNewAccount: boolean } | null,
): AppointmentDetail {
  return {
    id: row.id,
    clinicId: row.clinicId,
    appointmentNumber: row.appointmentNumber ?? null,
    fileNumber: row.patient.fileNumber ?? null,
    patientCredentials: patientCredentials ?? null,
    status: row.status,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    timezone: row.timezone,
    doctorId: row.doctorId,
    doctorName: row.doctor.name,
    serviceId: row.serviceId,
    serviceName: row.service.name,
    patientId: row.patientId,
    patientName: row.patient.name,
    patientPhone: row.patient.phone,
    patientEmail: row.patient.email,
    notes: row.notes,
  };
}

export interface CreateAppointmentInput {
  clinicId?: string | null;
  doctorId: string;
  serviceId: string;
  patientId: string;
  /** Exact UTC instant of the appointment start. */
  startsAt: Date;
  notes?: string | null;
  email?: string | null;
  source?: AppointmentSource;
  status?: Extract<AppointmentStatus, 'PENDING' | 'CONFIRMED'>;
  /**
   * De-duplication token. A retried tool call or redelivered webhook carrying
   * the same key returns the original appointment instead of booking twice.
   */
  idempotencyKey?: string | null;
  createdByUserId?: string | null;
  /** Injected for deterministic tests. */
  now?: Date;
  /** How many alternative slots to return on failure. */
  alternativesLimit?: number;
}

export async function createAppointment(
  scope: TenantScope,
  input: CreateAppointmentInput,
): Promise<BookingResult> {
  const bookingStart = Date.now();
  logger.info(Events.BOOKING_STARTED, 'Appointment creation started', {
    doctorId: input.doctorId,
    serviceId: input.serviceId,
    patientId: input.patientId,
    startsAt: input.startsAt.toISOString(),
  });

  const config = await loadSchedulingConfig(scope, input.clinicId);
  const clinicId = config.clinicId;
  const now = input.now ?? new Date();

  // --- Idempotency: an identical retry must not create a second booking ----
  if (input.idempotencyKey) {
    const existing = await prisma.appointment.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: APPOINTMENT_INCLUDE,
    });
    if (existing) {
      assertOwned(scope, existing, 'Appointment');
      return { ok: true, appointment: toDetail(existing), deduplicated: true };
    }
  }

  const [doctor, service, patient] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: input.doctorId },
      select: {
        id: true,
        clinicId: true,
        name: true,
        isActive: true,
        appointmentMinutes: true,
        bufferMinutes: true,
      },
    }),
    prisma.service.findUnique({
      where: { id: input.serviceId },
      select: {
        id: true,
        clinicId: true,
        name: true,
        isActive: true,
        durationMinutes: true,
        bufferMinutes: true,
      },
    }),
    prisma.patient.findUnique({
      where: { id: input.patientId },
      select: {
        id: true,
        clinicId: true,
        name: true,
        phone: true,
        email: true,
        fileNumber: true,
        lead: { select: { id: true } },
      },
    }),
  ]);

  // Every referenced row must belong to the same tenant as the scope. This is
  // what stops a caller from stitching Clinic A's doctor onto Clinic B's patient.
  if (!doctor || doctor.clinicId !== clinicId) throw notFound('Doctor not found.');
  if (!service || service.clinicId !== clinicId) throw notFound('Service not found.');
  if (!patient || patient.clinicId !== clinicId) throw notFound('Patient not found.');
  if (!doctor.isActive) throw badRequest('That doctor is not currently accepting appointments.');
  if (!service.isActive) throw badRequest('That service is not currently offered.');

  const offersService = await prisma.doctorService.findUnique({
    where: { doctorId_serviceId: { doctorId: doctor.id, serviceId: service.id } },
    select: { doctorId: true },
  });
  if (!offersService) throw badRequest('That doctor does not offer the selected service.');

  const { durationMinutes, bufferMinutes } = resolveDurations(config, service, doctor);
  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const blockEndsAt = new Date(endsAt.getTime() + bufferMinutes * 60_000);

  // --- Booking-window rules (cheap rejections with precise messages) -------
  const minStart = new Date(now.getTime() + config.settings.minAdvanceBookingMinutes * 60_000);
  const horizonKey = addDaysToDateKey(
    toDateKey(now, config.timezone),
    config.settings.maxAdvanceBookingDays,
    config.timezone,
  );

  const fail = async (
    reason: BookingFailureReason,
    message: string,
  ): Promise<BookingResult> => ({
    ok: false,
    reason,
    message,
    alternatives: await findAlternatives(scope, {
      clinicId,
      serviceId: service.id,
      doctorId: doctor.id,
      around: startsAt,
      timezone: config.timezone,
      limit: input.alternativesLimit ?? config.settings.maxSlotsOfferedToAI,
      now,
    }),
  });

  if (startsAt.getTime() <= now.getTime()) {
    return fail('IN_THE_PAST', 'That time is in the past.');
  }
  if (startsAt.getTime() < minStart.getTime()) {
    return fail(
      'TOO_SOON',
      `Appointments need at least ${config.settings.minAdvanceBookingMinutes} minutes' notice.`,
    );
  }
  if (toDateKey(startsAt, config.timezone) > horizonKey) {
    return fail(
      'TOO_FAR',
      `Appointments can only be booked up to ${config.settings.maxAdvanceBookingDays} days ahead.`,
    );
  }

  // --- Advisory pre-check: catches "not a valid slot at all" -------------
  const available = await isSlotStillAvailable(scope, {
    clinicId,
    doctorId: doctor.id,
    serviceId: service.id,
    start: startsAt,
    now,
  });
  if (!available) {
    return fail('OUTSIDE_AVAILABILITY', 'That time is not available.');
  }

  // --- Authoritative write ------------------------------------------------
  try {
    const { appointment: created, credentials } = await prisma.$transaction(async (tx) => {
      // 1. Assign sequential fileNumber if patient does not have one yet
      let currentFileNumber = patient.fileNumber;
      if (!currentFileNumber) {
        const lastPatient = await tx.patient.findFirst({
          where: { clinicId, fileNumber: { not: null } },
          orderBy: { fileNumber: 'desc' },
          select: { fileNumber: true },
        });
        const nextFileNumber = (lastPatient?.fileNumber ?? 0) + 1;
        await tx.patient.update({
          where: { id: patient.id },
          data: { fileNumber: nextFileNumber },
        });
        currentFileNumber = nextFileNumber;
      }

      // 2. Assign sequential appointmentNumber for this clinic
      const lastAppointment = await tx.appointment.findFirst({
        where: { clinicId },
        orderBy: { appointmentNumber: 'desc' },
        select: { appointmentNumber: true },
      });
      const nextAppointmentNumber = (lastAppointment?.appointmentNumber ?? 0) + 1;

      // 3. Provision Patient Portal User Account if patient has email
      let patientCredentials: { email: string; temporaryPassword?: string; isNewAccount: boolean } | null = null;
      const targetEmail = input.email ?? patient.email;
      if (targetEmail) {
        patientCredentials = await ensurePatientUserAccount(
          clinicId,
          patient.id,
          targetEmail,
          patient.name,
          currentFileNumber,
          tx,
        );
      }

      const appointment = await tx.appointment.create({
        data: {
          clinicId,
          appointmentNumber: nextAppointmentNumber,
          doctorId: doctor.id,
          serviceId: service.id,
          patientId: patient.id,
          leadId: patient.lead?.id ?? null,
          startsAt,
          endsAt,
          bufferMinutes,
          blockStartsAt: startsAt,
          blockEndsAt,
          timezone: config.timezone,
          status: input.status ?? 'CONFIRMED',
          source: input.source ?? 'AI_WHATSAPP',
          notes: input.notes ?? null,
          idempotencyKey: input.idempotencyKey ?? null,
          createdByUserId: input.createdByUserId ?? null,
          confirmedAt: (input.status ?? 'CONFIRMED') === 'CONFIRMED' ? new Date() : null,
        },
        include: APPOINTMENT_INCLUDE,
      });

      if (patient.lead?.id) {
        await tx.lead.update({
          where: { id: patient.lead.id },
          data: { status: 'BOOKED', bookedAt: new Date(), lastContactAt: new Date() },
        });
      }

      await scheduleRemindersFor(appointment.id, tx);
      return { appointment, credentials: patientCredentials };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    logger.info(Events.APPOINTMENT_CREATED, 'Appointment created', {
      clinicId,
      appointmentId: created.id,
      doctorId: doctor.id,
      startsAt: created.startsAt.toISOString(),
      source: created.source,
    });

    await recordAudit(scope, {
      action: 'appointment.create',
      entityType: 'Appointment',
      entityId: created.id,
      clinicId,
      metadata: {
        startsAt: created.startsAt.toISOString(),
        doctorId: doctor.id,
        serviceId: service.id,
      },
    });

    logger.info(Events.BOOKING_COMPLETED, 'Appointment creation completed', {
      clinicId,
      appointmentId: created.id,
      ms: Date.now() - bookingStart,
    });

    return { ok: true, appointment: toDetail(created, credentials), deduplicated: false };
  } catch (error) {
    // A concurrent request created the same appointment under the same key.
    if (isIdempotencyConflictError(error) && input.idempotencyKey) {
      const existing = await prisma.appointment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: APPOINTMENT_INCLUDE,
      });
      if (existing) {
        assertOwned(scope, existing, 'Appointment');
        return { ok: true, appointment: toDetail(existing), deduplicated: true };
      }
    }

    if (isSlotConflictError(error)) {
      logger.warn(Events.APPOINTMENT_CONFLICT, 'Slot taken concurrently', {
        clinicId,
        doctorId: doctor.id,
        startsAt: startsAt.toISOString(),
      });
      return fail('SLOT_TAKEN', 'That slot was just booked by someone else.');
    }
    throw error;
  }
}

/** Slots near a failed request, so the caller can offer something useful. */
async function findAlternatives(
  scope: TenantScope,
  params: {
    clinicId: string;
    serviceId: string;
    doctorId?: string;
    around: Date;
    timezone: string;
    limit: number;
    now: Date;
  },
): Promise<ResolvedSlot[]> {
  try {
    const dateKey = toDateKey(params.around, params.timezone);
    const sameDay = await getAvailableSlots(scope, {
      clinicId: params.clinicId,
      serviceId: params.serviceId,
      doctorId: params.doctorId,
      fromDateKey: dateKey,
      toDateKey: dateKey,
      limit: params.limit,
      now: params.now,
    });
    if (sameDay.length >= params.limit) return sameDay;

    // Widen to the following week rather than leaving the patient with nothing.
    const widened = await getAvailableSlots(scope, {
      clinicId: params.clinicId,
      serviceId: params.serviceId,
      doctorId: params.doctorId,
      fromDateKey: dateKey,
      toDateKey: addDaysToDateKey(dateKey, 7, params.timezone),
      limit: params.limit,
      now: params.now,
    });
    return widened;
  } catch {
    // Alternatives are a nicety; never let them turn a clean failure into a 500.
    return [];
  }
}

// --- Lifecycle transitions -------------------------------------------------

async function loadOwnedAppointment(scope: TenantScope, appointmentId: string) {
  const row = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: APPOINTMENT_INCLUDE,
  });
  if (!row) throw notFound('Appointment not found.');
  assertOwned(scope, row, 'Appointment');
  return row;
}

export interface CancelInput {
  appointmentId: string;
  reason?: string | null;
  /** Enforce the clinic's cancellation cutoff (true for patient-initiated). */
  enforcePolicy?: boolean;
  now?: Date;
}

export async function cancelAppointment(
  scope: TenantScope,
  input: CancelInput,
): Promise<AppointmentDetail> {
  const appointment = await loadOwnedAppointment(scope, input.appointmentId);
  const now = input.now ?? new Date();

  if (!isActiveStatus(appointment.status)) {
    throw badRequest(`This appointment is already ${appointment.status.toLowerCase()}.`);
  }

  if (input.enforcePolicy) {
    const config = await loadSchedulingConfig(scope, appointment.clinicId);
    if (!config.settings.allowPatientCancellation) {
      throw forbidden('This clinic does not allow appointments to be cancelled online.');
    }
    const cutoff = new Date(
      appointment.startsAt.getTime() - config.settings.cancellationCutoffHours * 3_600_000,
    );
    if (now.getTime() > cutoff.getTime()) {
      throw forbidden(
        `Appointments can only be cancelled at least ${config.settings.cancellationCutoffHours} hours in advance.`,
      );
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.appointment.update({
      where: { id: appointment.id },
      data: { status: 'CANCELLED', cancelledAt: now, cancelReason: input.reason ?? null },
      include: APPOINTMENT_INCLUDE,
    });
    // A cancelled appointment must never trigger a reminder.
    await cancelRemindersFor(appointment.id, tx);
    return row;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  logger.info(Events.APPOINTMENT_CANCELLED, 'Appointment cancelled', {
    clinicId: appointment.clinicId,
    appointmentId: appointment.id,
  });

  await recordAudit(scope, {
    action: 'appointment.cancel',
    entityType: 'Appointment',
    entityId: appointment.id,
    clinicId: appointment.clinicId,
    metadata: { reason: input.reason ?? null },
  });

  return toDetail(updated);
}

export interface RescheduleInput {
  appointmentId: string;
  newStartsAt: Date;
  /** Optionally move to a different doctor. */
  newDoctorId?: string | null;
  reason?: string | null;
  enforcePolicy?: boolean;
  idempotencyKey?: string | null;
  now?: Date;
  alternativesLimit?: number;
}

/**
 * Move an appointment.
 *
 * The old row is marked RESCHEDULED *inside the same transaction* and before the
 * new row is inserted, which releases its interval. Without that ordering, a
 * small shift (say 17:00 → 17:15 for a 30-minute service) would collide with
 * itself in the exclusion constraint.
 */
export async function rescheduleAppointment(
  scope: TenantScope,
  input: RescheduleInput,
): Promise<BookingResult> {
  const original = await loadOwnedAppointment(scope, input.appointmentId);
  const now = input.now ?? new Date();
  const clinicId = original.clinicId;

  if (!isActiveStatus(original.status)) {
    throw badRequest(`This appointment is ${original.status.toLowerCase()} and cannot be moved.`);
  }

  const config = await loadSchedulingConfig(scope, clinicId);

  if (input.enforcePolicy) {
    if (!config.settings.allowPatientReschedule) {
      throw forbidden('This clinic does not allow appointments to be rescheduled online.');
    }
    const cutoff = new Date(
      original.startsAt.getTime() - config.settings.cancellationCutoffHours * 3_600_000,
    );
    if (now.getTime() > cutoff.getTime()) {
      throw forbidden(
        `Appointments can only be rescheduled at least ${config.settings.cancellationCutoffHours} hours in advance.`,
      );
    }
  }

  const doctorId = input.newDoctorId ?? original.doctorId;
  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: {
      id: true,
      clinicId: true,
      isActive: true,
      appointmentMinutes: true,
      bufferMinutes: true,
    },
  });
  if (!doctor || doctor.clinicId !== clinicId) throw notFound('Doctor not found.');

  const service = await prisma.service.findUnique({
    where: { id: original.serviceId },
    select: {
      id: true,
      clinicId: true,
      durationMinutes: true,
      bufferMinutes: true,
      isActive: true,
    },
  });
  if (!service || service.clinicId !== clinicId) throw notFound('Service not found.');

  const { durationMinutes, bufferMinutes } = resolveDurations(config, service, doctor);
  const startsAt = input.newStartsAt;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
  const blockEndsAt = new Date(endsAt.getTime() + bufferMinutes * 60_000);

  const buildFailure = async (
    reason: BookingFailureReason,
    message: string,
  ): Promise<BookingResult> => ({
    ok: false,
    reason,
    message,
    alternatives: await findAlternatives(scope, {
      clinicId,
      serviceId: service.id,
      doctorId: doctor.id,
      around: startsAt,
      timezone: config.timezone,
      limit: input.alternativesLimit ?? config.settings.maxSlotsOfferedToAI,
      now,
    }),
  });

  if (startsAt.getTime() <= now.getTime()) {
    return buildFailure('IN_THE_PAST', 'That time is in the past.');
  }

  const available = await isSlotStillAvailable(scope, {
    clinicId,
    doctorId: doctor.id,
    serviceId: service.id,
    start: startsAt,
    now,
    excludeAppointmentId: original.id,
  });
  if (!available) {
    return buildFailure('OUTSIDE_AVAILABILITY', 'That time is not available.');
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // Release the old interval first — see the doc comment above.
      await tx.appointment.update({
        where: { id: original.id },
        data: { status: 'RESCHEDULED', cancelReason: input.reason ?? 'Rescheduled by patient' },
      });
      await cancelRemindersFor(original.id, tx);

      const lastAppointment = await tx.appointment.findFirst({
        where: { clinicId },
        orderBy: { appointmentNumber: 'desc' },
        select: { appointmentNumber: true },
      });
      const nextAppointmentNumber = (lastAppointment?.appointmentNumber ?? 0) + 1;

      const next = await tx.appointment.create({
        data: {
          clinicId,
          appointmentNumber: nextAppointmentNumber,
          doctorId: doctor.id,
          serviceId: service.id,
          patientId: original.patientId,
          leadId: original.leadId,
          startsAt,
          endsAt,
          bufferMinutes,
          blockStartsAt: startsAt,
          blockEndsAt,
          timezone: config.timezone,
          status: 'CONFIRMED',
          source: original.source,
          notes: original.notes,
          idempotencyKey: input.idempotencyKey ?? null,
          confirmedAt: new Date(),
          rescheduledFromId: original.id,
        },
        include: APPOINTMENT_INCLUDE,
      });

      await scheduleRemindersFor(next.id, tx);
      return next;
    }, {
      maxWait: 15000,
      timeout: 30000,
    });

    logger.info(Events.APPOINTMENT_RESCHEDULED, 'Appointment rescheduled', {
      clinicId,
      fromAppointmentId: original.id,
      toAppointmentId: created.id,
      startsAt: created.startsAt.toISOString(),
    });
    await recordAudit(scope, {
      action: 'appointment.reschedule',
      entityType: 'Appointment',
      entityId: created.id,
      clinicId,
      metadata: {
        from: original.startsAt.toISOString(),
        to: created.startsAt.toISOString(),
        previousAppointmentId: original.id,
      },
    });

    return { ok: true, appointment: toDetail(created), deduplicated: false };
  } catch (error) {
    if (isIdempotencyConflictError(error) && input.idempotencyKey) {
      const existing = await prisma.appointment.findUnique({
        where: { idempotencyKey: input.idempotencyKey },
        include: APPOINTMENT_INCLUDE,
      });
      if (existing) {
        assertOwned(scope, existing, 'Appointment');
        return { ok: true, appointment: toDetail(existing), deduplicated: true };
      }
    }
    if (isSlotConflictError(error)) {
      logger.warn(Events.APPOINTMENT_CONFLICT, 'Reschedule target taken concurrently', {
        clinicId,
        appointmentId: original.id,
        startsAt: startsAt.toISOString(),
      });
      return buildFailure('SLOT_TAKEN', 'That slot was just booked by someone else.');
    }
    throw error;
  }
}

/** Admin-only outcome transitions. */
export async function markAppointmentOutcome(
  scope: TenantScope,
  input: { appointmentId: string; outcome: 'COMPLETED' | 'NO_SHOW'; now?: Date },
): Promise<AppointmentDetail> {
  const appointment = await loadOwnedAppointment(scope, input.appointmentId);
  if (!isActiveStatus(appointment.status)) {
    throw badRequest(`Cannot mark a ${appointment.status.toLowerCase()} appointment.`);
  }
  const now = input.now ?? new Date();

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.appointment.update({
      where: { id: appointment.id },
      data: {
        status: input.outcome,
        ...(input.outcome === 'COMPLETED' ? { completedAt: now } : { noShowAt: now }),
      },
      include: APPOINTMENT_INCLUDE,
    });
    await cancelRemindersFor(appointment.id, tx);
    return row;
  }, {
    maxWait: 15000,
    timeout: 30000,
  });

  await recordAudit(scope, {
    action: `appointment.${input.outcome.toLowerCase()}`,
    entityType: 'Appointment',
    entityId: appointment.id,
    clinicId: appointment.clinicId,
  });
  return toDetail(updated);
}

// --- Reads ----------------------------------------------------------------

export async function getAppointment(
  scope: TenantScope,
  appointmentId: string,
): Promise<AppointmentDetail> {
  return toDetail(await loadOwnedAppointment(scope, appointmentId));
}

export interface UpcomingQuery {
  clinicId?: string | null;
  patientId?: string;
  limit?: number;
  now?: Date;
}

export async function listUpcomingAppointments(
  scope: TenantScope,
  query: UpcomingQuery = {},
  db: DbClient = prisma,
): Promise<AppointmentDetail[]> {
  const clinicId =
    scope.kind === 'PLATFORM' ? (query.clinicId ?? undefined) : resolveClinicId(scope, query.clinicId);
  const now = query.now ?? new Date();

  const rows = await db.appointment.findMany({
    where: {
      ...(clinicId ? { clinicId } : {}),
      ...(query.patientId ? { patientId: query.patientId } : {}),
      status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      startsAt: { gte: now },
    },
    include: APPOINTMENT_INCLUDE,
    orderBy: { startsAt: 'asc' },
    take: query.limit ?? 25,
  });
  return rows.map((r) => toDetail(r));
}

/** Human-readable confirmation line, rendered in the clinic's timezone. */
export function describeAppointment(appointment: AppointmentDetail, locale = 'en'): string {
  return `${appointment.serviceName} with ${appointment.doctorName} on ${formatInstant(
    appointment.startsAt,
    appointment.timezone,
    { locale },
  )}`;
}
