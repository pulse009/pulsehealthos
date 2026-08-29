import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  addPatient,
  disconnect,
  hasTestDatabase,
  resetDatabase,
  seedFixture,
  testDb,
  type Fixture,
} from './helpers/db';
import { systemScope, clinicScope, platformScope } from '@/lib/tenancy/scope';
import {
  cancelAppointment,
  createAppointment,
  rescheduleAppointment,
} from '@/lib/booking/booking.service';
import { getAvailableSlots } from '@/lib/booking/availability.service';
import { requireLocalMinutesToInstant } from '@/lib/time/timezone';
import { dispatchDueReminders } from '@/lib/reminders/dispatcher';
import { scheduleRemindersFor } from '@/lib/reminders/scheduler';

/**
 * Integration tests for the booking engine.
 *
 * These require a real PostgreSQL database with the migrations applied,
 * because the properties under test are database properties: the exclusion
 * constraint is what makes double booking impossible, and no amount of mocking
 * can demonstrate that.
 *
 * Run with:
 *   createdb clinic_ai_test
 *   TEST_DATABASE_URL=postgresql://.../clinic_ai_test npx prisma migrate deploy
 *   TEST_DATABASE_URL=postgresql://.../clinic_ai_test npm test
 */

const enabled = hasTestDatabase();
const suite = enabled ? describe : describe.skip;

if (!enabled) {
  // Make the skip visible rather than silently reporting a green run.
  console.warn(
    '\n[skip] Booking integration tests need TEST_DATABASE_URL (a database whose name contains "test").\n',
  );
}

// A Monday, comfortably inside the seeded schedule.
const DATE = '2026-06-01';

suite('booking engine (database-backed)', () => {
  let fixture: Fixture;

  beforeAll(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await resetDatabase();
    fixture = await seedFixture({ slug: `clinic-${Date.now()}` });
  });

  const scope = () => systemScope(fixture.clinicId, 'test');
  const at = (minutes: number) =>
    requireLocalMinutesToInstant(DATE, minutes, fixture.timezone);
  // "Now" is fixed well before the test date so booking-window rules are stable.
  const NOW = new Date('2026-05-25T08:00:00Z');

  const book = (startMinutes: number, patientId?: string, idempotencyKey?: string) =>
    createAppointment(scope(), {
      clinicId: fixture.clinicId,
      doctorId: fixture.doctorId,
      serviceId: fixture.serviceId,
      patientId: patientId ?? fixture.patientId,
      startsAt: at(startMinutes),
      now: NOW,
      idempotencyKey,
    });

  describe('happy path', () => {
    it('books an available slot', async () => {
      const result = await book(15 * 60);
      expect(result.ok).toBe(true);
      if (!result.ok) return;

      expect(result.appointment.status).toBe('CONFIRMED');
      expect(result.appointment.startsAt.toISOString()).toBe(at(15 * 60).toISOString());
      // endsAt reflects the 30-minute service duration.
      expect(result.appointment.endsAt.getTime() - result.appointment.startsAt.getTime()).toBe(
        30 * 60_000,
      );
    });

    it('moves the lead to BOOKED', async () => {
      await book(15 * 60);
      const lead = await testDb().lead.findFirst({
        where: { patientId: fixture.patientId },
        select: { status: true, bookedAt: true },
      });
      expect(lead?.status).toBe('BOOKED');
      expect(lead?.bookedAt).not.toBeNull();
    });
  });

  describe('double-booking prevention', () => {
    it('refuses a slot that is already taken', async () => {
      expect((await book(15 * 60)).ok).toBe(true);

      const second = await book(15 * 60, await addPatient(fixture.clinicId, '447700900002'));
      expect(second.ok).toBe(false);
      if (second.ok) return;
      expect(['SLOT_TAKEN', 'OUTSIDE_AVAILABILITY']).toContain(second.reason);
    });

    it('lets exactly one of two simultaneous requests win', async () => {
      const patientB = await addPatient(fixture.clinicId, '447700900003');

      // Both requests pass their availability pre-check before either inserts;
      // the exclusion constraint is what breaks the tie.
      const [a, b] = await Promise.all([book(16 * 60), book(16 * 60, patientB)]);

      const successes = [a, b].filter((r) => r.ok);
      expect(successes).toHaveLength(1);

      const stored = await testDb().appointment.count({
        where: {
          doctorId: fixture.doctorId,
          startsAt: at(16 * 60),
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'] },
        },
      });
      expect(stored).toBe(1);
    });

    it('holds under a burst of concurrent requests for the same slot', async () => {
      const patients = await Promise.all(
        Array.from({ length: 8 }, (_, i) =>
          addPatient(fixture.clinicId, `44770090010${i}`),
        ),
      );

      const results = await Promise.all(patients.map((p) => book(17 * 60, p)));
      expect(results.filter((r) => r.ok)).toHaveLength(1);

      const stored = await testDb().appointment.count({
        where: {
          doctorId: fixture.doctorId,
          startsAt: at(17 * 60),
          status: { in: ['PENDING', 'CONFIRMED', 'COMPLETED', 'NO_SHOW'] },
        },
      });
      expect(stored).toBe(1);
    });

    it('rejects a partially overlapping appointment, not just an exact clash', async () => {
      // Seed a clinic whose service is 60 minutes so a 30-minute grid produces
      // genuine partial overlaps.
      await resetDatabase();
      fixture = await seedFixture({ slug: 'overlap-clinic', serviceDuration: 60 });

      expect((await book(15 * 60)).ok).toBe(true); // 15:00–16:00
      const overlapping = await book(
        15 * 60 + 30,
        await addPatient(fixture.clinicId, '447700900004'),
      );
      expect(overlapping.ok).toBe(false);
    });

    it('enforces buffer time at the database level', async () => {
      await resetDatabase();
      fixture = await seedFixture({ slug: 'buffer-clinic', bufferMinutes: 30 });

      expect((await book(15 * 60)).ok).toBe(true); // occupies 15:00–15:30 (+30m buffer)

      // 15:30 is free by appointment times, but inside the buffer.
      const tooSoon = await book(15 * 60 + 30, await addPatient(fixture.clinicId, '447700900005'));
      expect(tooSoon.ok).toBe(false);

      // 16:00 clears the buffer.
      const ok = await book(16 * 60, await addPatient(fixture.clinicId, '447700900006'));
      expect(ok.ok).toBe(true);
    });
  });

  describe('availability reflects existing bookings', () => {
    it('stops offering a slot once it is booked', async () => {
      const before = await getAvailableSlots(scope(), {
        clinicId: fixture.clinicId,
        serviceId: fixture.serviceId,
        fromDateKey: DATE,
        now: NOW,
      });
      expect(before.some((s) => s.start.getTime() === at(15 * 60).getTime())).toBe(true);

      await book(15 * 60);

      const after = await getAvailableSlots(scope(), {
        clinicId: fixture.clinicId,
        serviceId: fixture.serviceId,
        fromDateKey: DATE,
        now: NOW,
      });
      expect(after.some((s) => s.start.getTime() === at(15 * 60).getTime())).toBe(false);
      // The rest of the day is unaffected.
      expect(after.some((s) => s.start.getTime() === at(15 * 60 + 30).getTime())).toBe(true);
    });

    it('never offers a time inside the doctor’s 13:00–15:00 gap', async () => {
      const slots = await getAvailableSlots(scope(), {
        clinicId: fixture.clinicId,
        serviceId: fixture.serviceId,
        fromDateKey: DATE,
        now: NOW,
      });
      const localHours = slots.map((s) =>
        Number(
          new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            hour12: false,
            timeZone: fixture.timezone,
          }).format(s.start),
        ),
      );
      expect(localHours.filter((h) => h === 13 || h === 14)).toEqual([]);
    });
  });

  describe('cancellation', () => {
    it('releases the slot for rebooking', async () => {
      const first = await book(15 * 60);
      expect(first.ok).toBe(true);
      if (!first.ok) return;

      await cancelAppointment(scope(), {
        appointmentId: first.appointment.id,
        reason: 'Changed my mind',
        now: NOW,
      });

      const rebooked = await book(15 * 60, await addPatient(fixture.clinicId, '447700900007'));
      expect(rebooked.ok).toBe(true);
    });

    it('cancels pending reminders so a cancelled appointment is never reminded about', async () => {
      await testDb().reminderRule.create({
        data: { clinicId: fixture.clinicId, offsetMinutes: 1440 },
      });

      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);
      const scheduled = await testDb().reminder.count({
        where: { appointmentId: booked.appointment.id, status: 'SCHEDULED' },
      });
      expect(scheduled).toBeGreaterThan(0);

      await cancelAppointment(scope(), { appointmentId: booked.appointment.id, now: NOW });

      const remaining = await testDb().reminder.count({
        where: { appointmentId: booked.appointment.id, status: 'SCHEDULED' },
      });
      expect(remaining).toBe(0);
    });
  });

  describe('rescheduling', () => {
    it('moves an appointment and frees the original slot', async () => {
      const original = await book(15 * 60);
      expect(original.ok).toBe(true);
      if (!original.ok) return;

      const moved = await rescheduleAppointment(scope(), {
        appointmentId: original.appointment.id,
        newStartsAt: at(16 * 60),
        now: NOW,
      });
      expect(moved.ok).toBe(true);
      if (!moved.ok) return;

      expect(moved.appointment.startsAt.toISOString()).toBe(at(16 * 60).toISOString());

      const previous = await testDb().appointment.findUnique({
        where: { id: original.appointment.id },
        select: { status: true },
      });
      expect(previous?.status).toBe('RESCHEDULED');

      // The vacated 15:00 slot is bookable again.
      const other = await book(15 * 60, await addPatient(fixture.clinicId, '447700900008'));
      expect(other.ok).toBe(true);
    });

    it('allows a small shift that would otherwise collide with itself', async () => {
      // 15:00 → 15:30 for a 30-minute service: the new interval abuts the old.
      // This only works because the original is released inside the same
      // transaction, before the new row is inserted.
      const original = await book(15 * 60);
      expect(original.ok).toBe(true);
      if (!original.ok) return;

      const moved = await rescheduleAppointment(scope(), {
        appointmentId: original.appointment.id,
        newStartsAt: at(15 * 60 + 30),
        now: NOW,
      });
      expect(moved.ok).toBe(true);
    });

    it('refuses to move onto a slot someone else holds', async () => {
      const mine = await book(15 * 60);
      const theirs = await book(16 * 60, await addPatient(fixture.clinicId, '447700900009'));
      expect(mine.ok && theirs.ok).toBe(true);
      if (!mine.ok) return;

      const clash = await rescheduleAppointment(scope(), {
        appointmentId: mine.appointment.id,
        newStartsAt: at(16 * 60),
        now: NOW,
      });
      expect(clash.ok).toBe(false);

      // The original booking must survive a failed move.
      const still = await testDb().appointment.findUnique({
        where: { id: mine.appointment.id },
        select: { status: true },
      });
      expect(still?.status).toBe('CONFIRMED');
    });
  });

  describe('idempotency', () => {
    it('returns the original appointment when the same key is replayed', async () => {
      const key = 'wa:wamid.ABC:doctor:slot';
      const first = await book(15 * 60, undefined, key);
      const replay = await book(15 * 60, undefined, key);

      expect(first.ok && replay.ok).toBe(true);
      if (!first.ok || !replay.ok) return;

      expect(replay.appointment.id).toBe(first.appointment.id);
      expect(replay.deduplicated).toBe(true);
      expect(await testDb().appointment.count()).toBe(1);
    });

    it('deduplicates even when replays arrive concurrently', async () => {
      const key = 'wa:wamid.RACE:doctor:slot';
      const results = await Promise.all([
        book(18 * 60, undefined, key),
        book(18 * 60, undefined, key),
        book(18 * 60, undefined, key),
      ]);

      const ids = new Set(results.filter((r) => r.ok).map((r) => (r.ok ? r.appointment.id : '')));
      expect(ids.size).toBe(1);
      expect(await testDb().appointment.count()).toBe(1);
    });
  });

  describe('tenant isolation', () => {
    it('refuses to book one clinic’s doctor for another clinic’s patient', async () => {
      const other = await seedFixture({ slug: 'other-clinic', phone: '447700900555' });

      await expect(
        createAppointment(systemScope(fixture.clinicId, 'test'), {
          clinicId: fixture.clinicId,
          doctorId: fixture.doctorId,
          serviceId: fixture.serviceId,
          // Patient belongs to a different tenant.
          patientId: other.patientId,
          startsAt: at(15 * 60),
          now: NOW,
        }),
      ).rejects.toThrow();
    });

    it('hides another clinic’s appointment from a client scope', async () => {
      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      const other = await seedFixture({ slug: 'nosy-clinic', phone: '447700900556' });
      const intruder = clinicScope(other.clinicId, 'user-other');

      const { getAppointment } = await import('@/lib/booking/booking.service');
      await expect(getAppointment(intruder, booked.appointment.id)).rejects.toThrow();
    });

    it('lets a platform scope read across clinics', async () => {
      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      const { getAppointment } = await import('@/lib/booking/booking.service');
      const found = await getAppointment(platformScope('admin'), booked.appointment.id);
      expect(found.id).toBe(booked.appointment.id);
    });

    it('scopes availability queries to the requesting tenant', async () => {
      const other = await seedFixture({ slug: 'separate-clinic', phone: '447700900557' });

      // Asking for another clinic's service from a tenant-bound scope must fail
      // rather than quietly returning that clinic's calendar.
      await expect(
        getAvailableSlots(clinicScope(fixture.clinicId, 'u'), {
          clinicId: other.clinicId,
          serviceId: other.serviceId,
          fromDateKey: DATE,
          now: NOW,
        }),
      ).rejects.toThrow();
    });
  });

  describe('reminders', () => {
    it('creates one reminder per active rule and no duplicates on re-run', async () => {
      await testDb().reminderRule.createMany({
        data: [
          { clinicId: fixture.clinicId, offsetMinutes: 1440 },
          { clinicId: fixture.clinicId, offsetMinutes: 120 },
        ],
      });

      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);
      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);
      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);

      const reminders = await testDb().reminder.findMany({
        where: { appointmentId: booked.appointment.id },
        select: { offsetMinutes: true, scheduledFor: true },
      });
      expect(reminders).toHaveLength(2);

      // Scheduled for exactly the configured offset before the appointment.
      const byOffset = new Map(reminders.map((r) => [r.offsetMinutes, r.scheduledFor]));
      expect(byOffset.get(1440)?.getTime()).toBe(
        booked.appointment.startsAt.getTime() - 1440 * 60_000,
      );
      expect(byOffset.get(120)?.getTime()).toBe(
        booked.appointment.startsAt.getTime() - 120 * 60_000,
      );
    });

    it('does not schedule a reminder whose moment has already passed', async () => {
      await testDb().reminderRule.create({
        data: { clinicId: fixture.clinicId, offsetMinutes: 1440 },
      });
      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      // "Now" is only an hour before the appointment: the 24h reminder is moot.
      const lateNow = new Date(booked.appointment.startsAt.getTime() - 60 * 60_000);
      await testDb().reminder.deleteMany({ where: { appointmentId: booked.appointment.id } });
      const created = await scheduleRemindersFor(booked.appointment.id, testDb(), lateNow);
      expect(created).toBe(0);
    });

    it('does not dispatch a reminder for a cancelled appointment', async () => {
      await testDb().reminderRule.create({
        data: { clinicId: fixture.clinicId, offsetMinutes: 60 },
      });
      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);
      // Cancel *after* reminders exist, then force them due.
      await testDb().appointment.update({
        where: { id: booked.appointment.id },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });
      await testDb().reminder.updateMany({
        where: { appointmentId: booked.appointment.id },
        data: { status: 'SCHEDULED', scheduledFor: new Date(Date.now() - 60_000) },
      });

      const summary = await dispatchDueReminders({ clinicId: fixture.clinicId });
      expect(summary.sent).toBe(0);
      expect(summary.skipped).toBeGreaterThan(0);
    });

    it('claims a reminder so concurrent dispatch runs cannot both send it', async () => {
      await testDb().reminderRule.create({
        data: { clinicId: fixture.clinicId, offsetMinutes: 60 },
      });
      const booked = await book(15 * 60);
      expect(booked.ok).toBe(true);
      if (!booked.ok) return;

      await scheduleRemindersFor(booked.appointment.id, testDb(), NOW);
      await testDb().reminder.updateMany({
        where: { appointmentId: booked.appointment.id },
        data: { status: 'SCHEDULED', scheduledFor: new Date(Date.now() - 60_000) },
      });

      // WhatsApp is unconfigured in tests, so delivery fails — but the claim
      // still has to be exclusive. Exactly one run may take the reminder.
      const [first, second] = await Promise.all([
        dispatchDueReminders({ clinicId: fixture.clinicId }),
        dispatchDueReminders({ clinicId: fixture.clinicId }),
      ]);
      expect(first.claimed + second.claimed).toBeLessThanOrEqual(1);
    });
  });
});
