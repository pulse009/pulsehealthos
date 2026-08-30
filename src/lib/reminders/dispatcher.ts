import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger, Events } from '@/lib/logger';
import { formatInstant } from '@/lib/time/timezone';
import { isActiveStatus } from '@/lib/booking/constants';
import { resolveContact, sendAndRecordOutbound } from '@/lib/conversations/conversation.service';

/**
 * Reminder delivery.
 *
 * Duplicate suppression works by *claiming* rather than by checking. Each worker
 * issues a conditional `UPDATE … WHERE status = 'SCHEDULED'` and only proceeds
 * if it changed exactly one row; a second worker (or a retried cron invocation,
 * or an overlapping run) sees zero rows affected and skips. That makes the
 * whole job safe to run concurrently and safe to retry.
 *
 * The claim moves the row to SENT *before* the network call. If delivery then
 * fails, the row is moved to FAILED and picked up by the retry sweep. This
 * ordering deliberately biases towards "never send twice" over "never miss one",
 * which is the right trade-off for an appointment reminder.
 */

const MAX_ATTEMPTS = 3;
/** A reminder more than this far past due is stale — the appointment is imminent
 *  or over, and a late reminder is worse than none. */
const STALE_AFTER_MINUTES = 120;

export interface DispatchOptions {
  now?: Date;
  batchSize?: number;
  /** Restrict to one clinic (used by admin "send now" tooling). */
  clinicId?: string;
}

export interface DispatchSummary {
  claimed: number;
  sent: number;
  failed: number;
  skipped: number;
  stale: number;
}

function renderReminder(params: {
  template: string | null;
  patientName: string | null;
  doctorName: string;
  serviceName: string;
  startsAt: Date;
  timezone: string;
  clinicName: string;
  canSelfServe: boolean;
  offsetMinutes?: number;
}): string {
  const when = formatInstant(params.startsAt, params.timezone);

  if (params.template) {
    return params.template
      .replaceAll('{{patient}}', params.patientName ?? 'there')
      .replaceAll('{{doctor}}', params.doctorName)
      .replaceAll('{{service}}', params.serviceName)
      .replaceAll('{{datetime}}', when)
      .replaceAll('{{clinic}}', params.clinicName);
  }

  const greeting = params.patientName ? `Hi *${params.patientName}*, ` : 'Hi, ';
  const action = params.canSelfServe
    ? '\n\n_Reply CONFIRM to confirm, CANCEL to cancel, or RESCHEDULE to change it._'
    : '';

  if (params.offsetMinutes === 120) {
    return `⏰ *Appointment Reminder (2 Hours Ahead):*\n\n${greeting}this is a friendly reminder that your upcoming *${params.serviceName}* appointment with *${params.doctorName}* at *${params.clinicName}* is in *2 hours* (${when}).${action}`;
  }

  return `⏰ *Appointment Reminder:*\n\n${greeting}this is a reminder of your upcoming *${params.serviceName}* appointment with *${params.doctorName}* at *${params.clinicName}* on ${when}.${action}`;
}

export async function dispatchDueReminders(
  options: DispatchOptions = {},
): Promise<DispatchSummary> {
  const now = options.now ?? new Date();
  const batchSize = Math.min(500, options.batchSize ?? 100);
  const summary: DispatchSummary = { claimed: 0, sent: 0, failed: 0, skipped: 0, stale: 0 };

  const due = await prisma.reminder.findMany({
    where: {
      status: 'SCHEDULED',
      scheduledFor: { lte: now },
      ...(options.clinicId ? { clinicId: options.clinicId } : {}),
    },
    orderBy: { scheduledFor: 'asc' },
    take: batchSize,
    select: {
      id: true,
      clinicId: true,
      appointmentId: true,
      offsetMinutes: true,
      scheduledFor: true,
      rule: { select: { template: true } },
    },
  });

  for (const reminder of due) {
    const staleCutoff = new Date(reminder.scheduledFor.getTime() + STALE_AFTER_MINUTES * 60_000);
    if (now.getTime() > staleCutoff.getTime()) {
      await prisma.reminder.updateMany({
        where: { id: reminder.id, status: 'SCHEDULED' },
        data: { status: 'CANCELLED', lastError: 'Skipped: past the delivery window.' },
      });
      summary.stale += 1;
      continue;
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: reminder.appointmentId },
      select: {
        id: true,
        status: true,
        startsAt: true,
        timezone: true,
        clinicId: true,
        doctor: { select: { name: true } },
        service: { select: { name: true } },
        patient: { select: { id: true, name: true, phone: true } },
        clinic: {
          select: {
            name: true,
            settings: {
              select: { allowPatientCancellation: true, allowPatientReschedule: true },
            },
          },
        },
      },
    });

    // A cancelled, rescheduled or completed appointment must never be reminded about.
    if (!appointment || !isActiveStatus(appointment.status)) {
      await prisma.reminder.updateMany({
        where: { id: reminder.id, status: 'SCHEDULED' },
        data: {
          status: 'CANCELLED',
          lastError: `Appointment is ${appointment?.status ?? 'missing'}.`,
        },
      });
      summary.skipped += 1;
      continue;
    }

    // --- Claim ------------------------------------------------------------
    const claim = await prisma.reminder.updateMany({
      where: { id: reminder.id, status: 'SCHEDULED' },
      data: { status: 'SENT', sentAt: now, attempts: { increment: 1 } },
    });
    if (claim.count !== 1) {
      // Someone else owns this reminder.
      summary.skipped += 1;
      continue;
    }
    summary.claimed += 1;

    try {
      const contact = await resolveContact(
        appointment.clinicId,
        appointment.patient.phone,
        appointment.patient.name,
      );

      const body = renderReminder({
        template: reminder.rule?.template ?? null,
        patientName: appointment.patient.name,
        doctorName: appointment.doctor.name,
        serviceName: appointment.service.name,
        startsAt: appointment.startsAt,
        timezone: appointment.timezone,
        clinicName: appointment.clinic.name,
        canSelfServe:
          (appointment.clinic.settings?.allowPatientCancellation ?? true) ||
          (appointment.clinic.settings?.allowPatientReschedule ?? true),
        offsetMinutes: reminder.offsetMinutes,
      });

      const result = await sendAndRecordOutbound({
        clinicId: appointment.clinicId,
        conversationId: contact.conversationId,
        body,
        sender: 'SYSTEM',
      });

      if (!result.delivered) throw new Error('WhatsApp delivery failed.');

      summary.sent += 1;
      logger.info(Events.REMINDER_SENT, 'Reminder delivered', {
        clinicId: appointment.clinicId,
        reminderId: reminder.id,
        appointmentId: appointment.id,
        offsetMinutes: reminder.offsetMinutes,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown failure';
      const row = await prisma.reminder.findUnique({
        where: { id: reminder.id },
        select: { attempts: true },
      });
      // Return to SCHEDULED for a retry while attempts remain; otherwise park it
      // as FAILED for operator attention.
      const exhausted = (row?.attempts ?? MAX_ATTEMPTS) >= MAX_ATTEMPTS;
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: exhausted ? 'FAILED' : 'SCHEDULED',
          sentAt: null,
          lastError: message.slice(0, 500),
        },
      });
      summary.failed += 1;
      logger.error(Events.REMINDER_FAILED, 'Reminder delivery failed', {
        clinicId: reminder.clinicId,
        reminderId: reminder.id,
        attempt: row?.attempts ?? null,
        exhausted,
        message,
      });
    }
  }

  return summary;
}
