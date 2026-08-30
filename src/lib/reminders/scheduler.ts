import 'server-only';
import { prisma, type DbClient } from '@/lib/db/prisma';
import { logger, Events } from '@/lib/logger';
import { isActiveStatus } from '@/lib/booking/constants';

/**
 * Reminder scheduling.
 *
 * Idempotency is structural: `Reminder` carries a unique key on
 * (appointmentId, offsetMinutes), so re-running the scheduler for an
 * appointment — after a retry, a redelivered webhook, or an operator changing
 * the rules — converges on the same row set instead of stacking duplicates.
 */

/**
 * Create the reminder rows implied by the clinic's active rules.
 * Safe to call repeatedly. Runs inside the booking transaction so an
 * appointment is never committed without its reminders.
 */
export async function scheduleRemindersFor(
  appointmentId: string,
  db: DbClient = prisma,
  now: Date = new Date(),
): Promise<number> {
  const appointment = await db.appointment.findUnique({
    where: { id: appointmentId },
    select: { id: true, clinicId: true, startsAt: true, status: true },
  });
  if (!appointment || !isActiveStatus(appointment.status)) return 0;

  const rules = await db.reminderRule.findMany({
    where: { clinicId: appointment.clinicId, isActive: true },
    select: { id: true, offsetMinutes: true },
  });

  const ruleOffsets = rules.map((r) => r.offsetMinutes);
  const effectiveRules: Array<{ ruleId: string | null; offsetMinutes: number }> = rules.map((r) => ({
    ruleId: r.id,
    offsetMinutes: r.offsetMinutes,
  }));
  // Always ensure a 2-hour (120 min) prior reminder is scheduled for all scenarios
  if (!ruleOffsets.includes(120)) {
    effectiveRules.push({ ruleId: null, offsetMinutes: 120 });
  }

  const rows = effectiveRules
    .map((rule) => ({
      clinicId: appointment.clinicId,
      appointmentId: appointment.id,
      ruleId: rule.ruleId,
      offsetMinutes: rule.offsetMinutes,
      scheduledFor: new Date(appointment.startsAt.getTime() - rule.offsetMinutes * 60_000),
    }))
    // A reminder whose moment has already passed (e.g. a same-day booking made
    // inside the 2h window) is simply not created.
    .filter((r) => r.scheduledFor.getTime() > now.getTime());

  if (rows.length === 0) return 0;

  const result = await db.reminder.createMany({ data: rows, skipDuplicates: true });

  if (result.count > 0) {
    logger.info(Events.REMINDER_SCHEDULED, 'Reminders scheduled', {
      clinicId: appointment.clinicId,
      appointmentId: appointment.id,
      count: result.count,
    });
  }
  return result.count;
}

/**
 * Stand down every not-yet-sent reminder for an appointment.
 * Already-sent reminders are left alone: they are history, not intent.
 */
export async function cancelRemindersFor(
  appointmentId: string,
  db: DbClient = prisma,
): Promise<number> {
  const { count } = await db.reminder.updateMany({
    where: { appointmentId, status: 'SCHEDULED' },
    data: { status: 'CANCELLED' },
  });
  return count;
}

/**
 * Re-derive reminders for every future appointment of a clinic. Used after an
 * operator edits the reminder rules, so existing bookings pick up the change.
 */
export async function resyncClinicReminders(
  clinicId: string,
  now: Date = new Date(),
): Promise<{ scheduled: number; cancelled: number }> {
  const activeRules = await prisma.reminderRule.findMany({
    where: { clinicId, isActive: true },
    select: { offsetMinutes: true },
  });
  const activeOffsets = activeRules.map((r) => r.offsetMinutes);

  // Drop pending reminders whose rule was removed or deactivated.
  const { count: cancelled } = await prisma.reminder.updateMany({
    where: {
      clinicId,
      status: 'SCHEDULED',
      scheduledFor: { gt: now },
      ...(activeOffsets.length > 0 ? { offsetMinutes: { notIn: activeOffsets } } : {}),
    },
    data: { status: 'CANCELLED' },
  });

  const upcoming = await prisma.appointment.findMany({
    where: { clinicId, status: { in: ['PENDING', 'CONFIRMED'] }, startsAt: { gt: now } },
    select: { id: true },
    take: 5_000,
  });

  let scheduled = 0;
  for (const appointment of upcoming) {
    scheduled += await scheduleRemindersFor(appointment.id, prisma, now);
  }
  return { scheduled, cancelled };
}
