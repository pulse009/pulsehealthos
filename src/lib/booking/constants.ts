import type { AppointmentStatus } from '@prisma/client';

/**
 * Statuses that occupy a doctor's calendar.
 *
 * MUST stay in sync with the predicate on `Appointment_no_overlap_per_doctor`
 * and `Appointment_doctor_start_active_key` in
 * prisma/migrations/20260101000100_booking_integrity/migration.sql.
 * A drift here means the availability engine and the database disagree about
 * what "free" means, which shows up as either phantom conflicts or offered
 * slots that fail at insert time.
 */
export const BLOCKING_APPOINTMENT_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'NO_SHOW',
] as const satisfies readonly AppointmentStatus[];

/** Statuses that release the slot for rebooking. */
export const RELEASING_APPOINTMENT_STATUSES = [
  'CANCELLED',
  'RESCHEDULED',
] as const satisfies readonly AppointmentStatus[];

/** Statuses a patient-facing flow is allowed to act on. */
export const ACTIVE_APPOINTMENT_STATUSES = ['PENDING', 'CONFIRMED'] as const satisfies
  readonly AppointmentStatus[];

export const isBlockingStatus = (s: AppointmentStatus): boolean =>
  (BLOCKING_APPOINTMENT_STATUSES as readonly AppointmentStatus[]).includes(s);

export const isActiveStatus = (s: AppointmentStatus): boolean =>
  (ACTIVE_APPOINTMENT_STATUSES as readonly AppointmentStatus[]).includes(s);
