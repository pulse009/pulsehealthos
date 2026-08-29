-- Booking integrity constraints.
--
-- These are hand-written because Prisma's schema language cannot express
-- exclusion constraints or partial unique indexes. They are the *authoritative*
-- guarantee against double booking: application-level availability checks are an
-- optimisation and a UX affordance, but this file is what makes concurrent
-- bookings impossible.
--
-- NOTE for schema changes: `prisma migrate diff --from-empty` regenerates only
-- the init migration. This file is additive and must be preserved.

-- Required for an exclusion constraint that mixes an equality operator (on a
-- text column) with an overlap operator (on a range). Needs a role with
-- privileges to create extensions on first deploy.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ---------------------------------------------------------------------------
-- Which statuses occupy a slot.
-- ---------------------------------------------------------------------------
-- Occupying:     PENDING, CONFIRMED, COMPLETED, NO_SHOW
-- Releasing:     CANCELLED  (slot freed and rebookable)
--                RESCHEDULED (superseded by a newer row; slot freed)
--
-- COMPLETED and NO_SHOW stay blocking because those appointments really did
-- consume the doctor's time; releasing them would let history be overwritten.
-- Keep `BLOCKING_APPOINTMENT_STATUSES` in src/lib/booking/constants.ts in sync
-- with the predicate below.

-- ---------------------------------------------------------------------------
-- 1. Overlap prevention (the real guarantee).
-- ---------------------------------------------------------------------------
-- Rejects any two occupying appointments for the same doctor whose occupied
-- intervals intersect — including partial overlaps produced by services of
-- differing durations. Violations surface as SQLSTATE 23P01.
--
-- The constraint is on [blockStartsAt, blockEndsAt), not [startsAt, endsAt).
-- blockEndsAt = endsAt + bufferMinutes, so required gaps between appointments
-- are enforced here rather than only by the availability engine. Using plain
-- columns (instead of interval arithmetic over bufferMinutes) keeps the index
-- expression immutable, which an exclusion constraint requires.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_no_overlap_per_doctor"
  EXCLUDE USING gist (
    "doctorId" WITH =,
    tstzrange("blockStartsAt", "blockEndsAt", '[)') WITH &&
  )
  WHERE (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'));

-- The block interval must actually contain the appointment, or the constraint
-- above would be guarding the wrong window.
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_block_wraps_appointment"
  CHECK ("blockStartsAt" = "startsAt" AND "blockEndsAt" >= "endsAt");

ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_non_negative_buffer" CHECK ("bufferMinutes" >= 0);

-- ---------------------------------------------------------------------------
-- 2. Exact-start uniqueness (fast, cheap second line of defence).
-- ---------------------------------------------------------------------------
-- Redundant with the exclusion constraint for overlapping ranges, but it is a
-- btree index the planner can use for slot lookups, and it produces a clearer
-- SQLSTATE 23505 for the common "same slot requested twice" race.
CREATE UNIQUE INDEX "Appointment_doctor_start_active_key"
  ON "Appointment" ("doctorId", "startsAt")
  WHERE (status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'));

-- ---------------------------------------------------------------------------
-- 3. Sanity: an appointment must end after it starts.
-- ---------------------------------------------------------------------------
ALTER TABLE "Appointment"
  ADD CONSTRAINT "Appointment_ends_after_starts"
  CHECK ("endsAt" > "startsAt");

-- ---------------------------------------------------------------------------
-- 4. Local-time windows must be well-formed minute offsets.
-- ---------------------------------------------------------------------------
ALTER TABLE "ClinicHours"
  ADD CONSTRAINT "ClinicHours_valid_window"
  CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "ClinicHours"
  ADD CONSTRAINT "ClinicHours_valid_weekday" CHECK ("weekday" BETWEEN 1 AND 7);

ALTER TABLE "DoctorSchedule"
  ADD CONSTRAINT "DoctorSchedule_valid_window"
  CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "DoctorSchedule"
  ADD CONSTRAINT "DoctorSchedule_valid_weekday" CHECK ("weekday" BETWEEN 1 AND 7);

ALTER TABLE "DoctorBreak"
  ADD CONSTRAINT "DoctorBreak_valid_window"
  CHECK ("startMinute" >= 0 AND "endMinute" <= 1440 AND "startMinute" < "endMinute");

ALTER TABLE "DoctorBreak"
  ADD CONSTRAINT "DoctorBreak_valid_weekday" CHECK ("weekday" BETWEEN 1 AND 7);

-- ---------------------------------------------------------------------------
-- 5. Durations must be positive.
-- ---------------------------------------------------------------------------
ALTER TABLE "Service"
  ADD CONSTRAINT "Service_positive_duration" CHECK ("durationMinutes" > 0);

ALTER TABLE "ClinicSettings"
  ADD CONSTRAINT "ClinicSettings_positive_granularity"
  CHECK ("slotGranularityMinutes" > 0 AND "defaultAppointmentMinutes" > 0);

-- ---------------------------------------------------------------------------
-- 6. Reminder dispatch hot path.
-- ---------------------------------------------------------------------------
-- The dispatcher polls "everything SCHEDULED and due"; a partial index keeps
-- that scan proportional to the outstanding queue rather than to all history.
CREATE INDEX "Reminder_due_scheduled_idx"
  ON "Reminder" ("scheduledFor")
  WHERE (status = 'SCHEDULED');
