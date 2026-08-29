import { PrismaClient } from '@prisma/client';

/**
 * Integration-test harness.
 *
 * DB-backed suites only run when TEST_DATABASE_URL is set, and they refuse to
 * run against anything that does not look like a test database — truncating a
 * developer's real data because of a stray env var is not an acceptable failure
 * mode.
 */

export const TEST_DB_URL = process.env.TEST_DATABASE_URL ?? '';

export const hasTestDatabase = (): boolean => {
  if (!TEST_DB_URL) return false;
  const looksLikeTestDb = /test|_ci\b/i.test(TEST_DB_URL);
  if (!looksLikeTestDb) {
    throw new Error(
      'TEST_DATABASE_URL does not contain "test". Refusing to run destructive integration tests against it.',
    );
  }
  return true;
};

let client: PrismaClient | null = null;

export function testDb(): PrismaClient {
  client ??= new PrismaClient({ datasources: { db: { url: TEST_DB_URL } } });
  return client;
}

export async function disconnect(): Promise<void> {
  await client?.$disconnect();
  client = null;
}

/** Wipe every table. Order matters only where FKs are RESTRICT rather than CASCADE. */
export async function resetDatabase(): Promise<void> {
  const db = testDb();
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Reminder", "Appointment", "Message", "Conversation", "Lead", "Patient",
      "DoctorService", "DoctorBreak", "DoctorSchedule", "DoctorTimeOff", "Doctor",
      "Service", "FAQ", "Holiday", "SpecialClosure", "ClinicHours",
      "ReminderRule", "WhatsAppIntegration", "AIConfiguration", "ClinicSettings",
      "AuditLog", "SystemLog", "ProcessedEvent", "User", "Clinic"
    RESTART IDENTITY CASCADE
  `);
}

export interface Fixture {
  clinicId: string;
  doctorId: string;
  serviceId: string;
  patientId: string;
  timezone: string;
}

/**
 * A clinic open Mon–Fri 09:00–19:00 with one doctor working a split shift and a
 * single 30-minute service. Mirrors the scenario in the brief.
 */
export async function seedFixture(options: {
  slug: string;
  timezone?: string;
  bufferMinutes?: number;
  serviceDuration?: number;
  phone?: string;
}): Promise<Fixture> {
  const db = testDb();
  const timezone = options.timezone ?? 'Europe/London';

  const clinic = await db.clinic.create({
    data: {
      slug: options.slug,
      name: `Clinic ${options.slug}`,
      timezone,
      settings: {
        create: {
          defaultAppointmentMinutes: 30,
          defaultBufferMinutes: options.bufferMinutes ?? 0,
          slotGranularityMinutes: 30,
          // No minimum notice, so tests can book close to "now" deterministically.
          minAdvanceBookingMinutes: 0,
          maxAdvanceBookingDays: 365,
          cancellationCutoffHours: 0,
        },
      },
      hours: {
        create: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
          weekday,
          startMinute: 9 * 60,
          endMinute: 19 * 60,
        })),
      },
    },
    select: { id: true },
  });

  const service = await db.service.create({
    data: {
      clinicId: clinic.id,
      name: 'General Consultation',
      durationMinutes: options.serviceDuration ?? 30,
    },
    select: { id: true },
  });

  const doctor = await db.doctor.create({
    data: {
      clinicId: clinic.id,
      name: 'Dr. Test',
      schedules: {
        create: [1, 2, 3, 4, 5, 6, 7].flatMap((weekday) => [
          { clinicId: clinic.id, weekday, startMinute: 9 * 60, endMinute: 13 * 60 },
          { clinicId: clinic.id, weekday, startMinute: 15 * 60, endMinute: 19 * 60 },
        ]),
      },
      services: { create: [{ serviceId: service.id, clinicId: clinic.id }] },
    },
    select: { id: true },
  });

  const patient = await db.patient.create({
    data: {
      clinicId: clinic.id,
      phone: options.phone ?? `4477${Math.floor(Math.random() * 100_000_000)}`,
      name: 'Test Patient',
      lead: { create: { clinicId: clinic.id, status: 'NEW' } },
    },
    select: { id: true },
  });

  return {
    clinicId: clinic.id,
    doctorId: doctor.id,
    serviceId: service.id,
    patientId: patient.id,
    timezone,
  };
}

/** Adds a second patient to an existing clinic, for concurrency scenarios. */
export async function addPatient(clinicId: string, phone: string): Promise<string> {
  const patient = await testDb().patient.create({
    data: {
      clinicId,
      phone,
      name: 'Second Patient',
      lead: { create: { clinicId, status: 'NEW' } },
    },
    select: { id: true },
  });
  return patient.id;
}
