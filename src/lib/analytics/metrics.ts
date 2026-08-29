import 'server-only';
import type { Prisma as PrismaTypes } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { clinicWhere, type TenantScope } from '@/lib/tenancy/scope';
import { addDaysToDateKey, startOfLocalDay, toDateKey } from '@/lib/time/timezone';

/**
 * Analytics.
 *
 * Every query is built from `clinicWhere(scope, …)`, so a portal request can
 * only ever aggregate its own tenant's rows — the same guard the transactional
 * reads use, rather than a parallel "reporting" path that could drift out of
 * sync with it.
 *
 * Day buckets are computed in the *clinic's* timezone. Grouping on raw UTC would
 * silently mis-assign evening appointments for any clinic east or west of UTC.
 */

export interface DashboardMetrics {
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    booked: number;
    lost: number;
  };
  appointments: {
    total: number;
    upcoming: number;
    confirmed: number;
    completed: number;
    cancelled: number;
    noShow: number;
    bookedToday: number;
  };
  conversations: { total: number; active: number; escalated: number };
  rates: { conversionRate: number; bookingRate: number; noShowRate: number };
}

const percent = (numerator: number, denominator: number): number =>
  denominator === 0 ? 0 : Math.round((numerator / denominator) * 1000) / 10;

export async function getDashboardMetrics(
  scope: TenantScope,
  clinicId?: string | null,
  now: Date = new Date(),
): Promise<DashboardMetrics> {
  const where = clinicWhere(scope, clinicId);

  // Resolve the timezone for "today". Platform-wide views have no single
  // timezone, so they fall back to UTC — documented in the UI as such.
  let timezone = 'UTC';
  if (where.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: where.clinicId },
      select: { timezone: true },
    });
    timezone = clinic?.timezone ?? 'UTC';
  }
  const todayKey = toDateKey(now, timezone);
  const todayStart = startOfLocalDay(todayKey, timezone);
  const tomorrowStart = startOfLocalDay(addDaysToDateKey(todayKey, 1, timezone), timezone);

  const [leadCounts, appointmentCounts, upcoming, bookedToday, conversationCounts] =
    await Promise.all([
      prisma.lead.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.appointment.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.appointment.count({
        where: { ...where, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gte: now } },
      }),
      prisma.appointment.count({
        where: { ...where, createdAt: { gte: todayStart, lt: tomorrowStart } },
      }),
      prisma.conversation.groupBy({ by: ['status'], where, _count: { _all: true } }),
    ]);

  const leadBy = (status: string) =>
    leadCounts.find((r) => r.status === status)?._count._all ?? 0;
  const apptBy = (status: string) =>
    appointmentCounts.find((r) => r.status === status)?._count._all ?? 0;
  const convBy = (status: string) =>
    conversationCounts.find((r) => r.status === status)?._count._all ?? 0;

  const totalLeads = leadCounts.reduce((sum, r) => sum + r._count._all, 0);
  const bookedLeads = leadBy('BOOKED');
  const engagedLeads = totalLeads - leadBy('NEW');
  const completed = apptBy('COMPLETED');
  const noShow = apptBy('NO_SHOW');

  return {
    leads: {
      total: totalLeads,
      new: leadBy('NEW'),
      contacted: leadBy('CONTACTED'),
      qualified: leadBy('QUALIFIED'),
      booked: bookedLeads,
      lost: leadBy('LOST'),
    },
    appointments: {
      total: appointmentCounts.reduce((sum, r) => sum + r._count._all, 0),
      upcoming,
      confirmed: apptBy('CONFIRMED'),
      completed,
      cancelled: apptBy('CANCELLED'),
      noShow,
      bookedToday,
    },
    conversations: {
      total: conversationCounts.reduce((sum, r) => sum + r._count._all, 0),
      active: convBy('ACTIVE'),
      escalated: convBy('ESCALATED'),
    },
    rates: {
      // Share of all leads that ended up booking.
      conversionRate: percent(bookedLeads, totalLeads),
      // Share of leads the assistant actually engaged that booked.
      bookingRate: percent(bookedLeads, engagedLeads),
      noShowRate: percent(noShow, completed + noShow),
    },
  };
}

export interface TrendPoint {
  date: string;
  leads: number;
  bookings: number;
}

/**
 * Daily lead and booking counts over a trailing window.
 *
 * Rows are bucketed in application code rather than SQL because the bucket
 * boundary depends on the clinic's timezone, which the database does not know.
 * The window is capped, so this reads a bounded number of rows.
 */
export async function getTrend(
  scope: TenantScope,
  clinicId?: string | null,
  days = 30,
  now: Date = new Date(),
): Promise<TrendPoint[]> {
  const where = clinicWhere(scope, clinicId);
  const window = Math.min(365, Math.max(1, days));

  let timezone = 'UTC';
  if (where.clinicId) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: where.clinicId },
      select: { timezone: true },
    });
    timezone = clinic?.timezone ?? 'UTC';
  }

  const todayKey = toDateKey(now, timezone);
  const firstKey = addDaysToDateKey(todayKey, -(window - 1), timezone);
  const from = startOfLocalDay(firstKey, timezone);

  const [leads, appointments] = await Promise.all([
    prisma.lead.findMany({
      where: { ...where, createdAt: { gte: from } },
      select: { createdAt: true },
      take: 50_000,
    }),
    prisma.appointment.findMany({
      where: { ...where, createdAt: { gte: from } },
      select: { createdAt: true },
      take: 50_000,
    }),
  ]);

  const buckets = new Map<string, TrendPoint>();
  for (let i = 0; i < window; i += 1) {
    const key = addDaysToDateKey(firstKey, i, timezone);
    buckets.set(key, { date: key, leads: 0, bookings: 0 });
  }

  for (const lead of leads) {
    const bucket = buckets.get(toDateKey(lead.createdAt, timezone));
    if (bucket) bucket.leads += 1;
  }
  for (const appointment of appointments) {
    const bucket = buckets.get(toDateKey(appointment.createdAt, timezone));
    if (bucket) bucket.bookings += 1;
  }

  return [...buckets.values()];
}

export interface PlatformMetrics {
  clinics: { total: number; active: number };
  leads: number;
  appointments: number;
  bookingsToday: number;
  conversations: number;
  failedMessages: number;
  failedReminders: number;
  escalations: number;
}

/** Platform-wide roll-up for the internal admin dashboard. */
export async function getPlatformMetrics(now: Date = new Date()): Promise<PlatformMetrics> {
  const todayStart = startOfLocalDay(toDateKey(now, 'UTC'), 'UTC');

  const [
    totalClinics,
    activeClinics,
    leads,
    appointments,
    bookingsToday,
    conversations,
    failedMessages,
    failedReminders,
    escalations,
  ] = await Promise.all([
    prisma.clinic.count(),
    prisma.clinic.count({ where: { isActive: true } }),
    prisma.lead.count(),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.conversation.count(),
    prisma.message.count({ where: { status: 'FAILED' } }),
    prisma.reminder.count({ where: { status: 'FAILED' } }),
    prisma.conversation.count({ where: { status: 'ESCALATED' } }),
  ]);

  return {
    clinics: { total: totalClinics, active: activeClinics },
    leads,
    appointments,
    bookingsToday,
    conversations,
    failedMessages,
    failedReminders,
    escalations,
  };
}

/** Per-clinic breakdown for the platform dashboard table. */
export async function getClinicBreakdown(limit = 50) {
  const clinics = await prisma.clinic.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      timezone: true,
      _count: { select: { leads: true, appointments: true, conversations: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return clinics;
}

// --- Table feeds -----------------------------------------------------------

export async function getRecentLeads(scope: TenantScope, clinicId?: string | null, limit = 10) {
  return prisma.lead.findMany({
    where: clinicWhere(scope, clinicId),
    orderBy: { lastContactAt: 'desc' },
    take: limit,
    select: {
      id: true,
      status: true,
      source: true,
      firstContactAt: true,
      lastContactAt: true,
      clinic: { select: { name: true, timezone: true } },
      patient: {
        select: {
          name: true,
          phone: true,
          appointments: {
            where: { status: { in: ['PENDING', 'CONFIRMED'] } },
            orderBy: { startsAt: 'asc' },
            take: 1,
            select: { startsAt: true, timezone: true },
          },
        },
      },
    },
  });
}

export async function getUpcomingAppointmentsTable(
  scope: TenantScope,
  clinicId?: string | null,
  limit = 10,
  now: Date = new Date(),
) {
  const where: PrismaTypes.AppointmentWhereInput = {
    ...clinicWhere(scope, clinicId),
    status: { in: ['PENDING', 'CONFIRMED'] },
    startsAt: { gte: now },
  };
  return prisma.appointment.findMany({
    where,
    orderBy: { startsAt: 'asc' },
    take: limit,
    select: {
      id: true,
      startsAt: true,
      status: true,
      timezone: true,
      doctor: { select: { name: true } },
      service: { select: { name: true } },
      patient: { select: { name: true, phone: true } },
      clinic: { select: { name: true } },
    },
  });
}
