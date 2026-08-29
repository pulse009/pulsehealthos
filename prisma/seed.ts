import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';

/**
 * Saudi Arabia Clinics Platform — Development & Demonstration Seed.
 *
 * Primary flagship tenant: Reveal Skin & Glow Care (Riyadh, Saudi Arabia).
 * Timezone: Asia/Riyadh (UTC+3).
 * Currency: Saudi Riyal (SAR).
 */

const prisma = new PrismaClient();

const generatePassword = (): string => `${randomBytes(9).toString('base64url')}Aa1`;

async function upsertUser(params: {
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'CLIENT';
  clinicId: string | null;
  password: string;
}) {
  const passwordHash = await bcrypt.hash(params.password, 12);
  return prisma.user.upsert({
    where: { email: params.email },
    create: {
      email: params.email,
      name: params.name,
      role: params.role,
      clinicId: params.clinicId,
      passwordHash,
    },
    update: { name: params.name, role: params.role, clinicId: params.clinicId },
    select: { id: true, email: true },
  });
}

interface ClinicSpec {
  slug: string;
  name: string;
  timezone: string;
  city: string;
  country: string;
  addressLine?: string;
  phone?: string;
  whatsappNumber?: string;
  currency: string;
  services: Array<{ name: string; duration: number; price: number; description: string }>;
  doctors: Array<{
    name: string;
    specialty: string;
    /** ISO weekdays this doctor works: 1=Mon..7=Sun. Sat=6, Sun=7, Mon=1, Tue=2, Wed=3, Thu=4. */
    days: number[];
    windows: Array<[number, number]>;
    breaks: Array<[number, number]>;
    services: string[];
  }>;
}

const CLINICS: ClinicSpec[] = [
  {
    slug: 'reveal-clinics',
    name: 'Reveal Skin & Glow Care',
    timezone: 'Asia/Riyadh',
    city: 'Riyadh',
    country: 'Saudi Arabia',
    addressLine: '2484 Muhammad Al Maqdimi, An Nafal, Riyadh 13312, Saudi Arabia',
    phone: '966115048687',
    whatsappNumber: '966115048687',
    currency: 'SAR',
    services: [
      {
        name: 'PicoWay Laser Rejuvenation',
        duration: 45,
        price: 560,
        description: 'Advanced laser treatment targeting pigmentation, acne scars, and skin tone.',
      },
      {
        name: 'Deep Cleansing & Relaxation Facial',
        duration: 60,
        price: 375,
        description: 'Hydrating facial to revive dull skin and unclog pores.',
      },
      {
        name: 'Laser Genesis & Skin Tightening',
        duration: 45,
        price: 675,
        description: 'Non-invasive laser therapy stimulating collagen for skin firming and radiance.',
      },
      {
        name: 'Medical Chemical Peel',
        duration: 30,
        price: 450,
        description: 'Controlled exfoliation for skin renewal and texture refinement.',
      },
      {
        name: 'Anti-Aging & Collagen Therapy',
        duration: 60,
        price: 750,
        description: 'Targeted anti-aging treatment reducing fine lines and restoring skin elasticity.',
      },
    ],
    doctors: [
      {
        name: 'Dr. Haitham Al-Gzlan',
        specialty: 'Consultant Dermatologist & Laser Specialist',
        days: [6, 7, 1, 2, 3, 4], // Sat - Thu
        windows: [[14 * 60, 22 * 60]], // 14:00 - 22:00
        breaks: [[17 * 60, 18 * 60]], // Prayer & rest break
        services: ['PicoWay Laser Rejuvenation', 'Laser Genesis & Skin Tightening'],
      },
      {
        name: 'Dr. Saud Al-Obaida',
        specialty: 'Consultant Dermatologist & Aesthetic Medicine',
        days: [6, 7, 1, 2, 3, 4],
        windows: [[14 * 60, 22 * 60]],
        breaks: [[17 * 60, 18 * 60]],
        services: ['Deep Cleansing & Relaxation Facial', 'Anti-Aging & Collagen Therapy'],
      },
      {
        name: 'Dr. Marwan Al-Haddad',
        specialty: 'Dermatology Specialist',
        days: [6, 7, 1, 2, 3, 4],
        windows: [[14 * 60, 22 * 60]],
        breaks: [[18 * 60, 19 * 60]],
        services: ['Medical Chemical Peel', 'PicoWay Laser Rejuvenation'],
      },
      {
        name: 'Dr. Abdulrahman Alhuzimi',
        specialty: 'Cosmetic & Laser Specialist',
        days: [6, 7, 1, 2, 3, 4],
        windows: [[14 * 60, 22 * 60]],
        breaks: [[17 * 60, 18 * 60]],
        services: ['PicoWay Laser Rejuvenation', 'Laser Genesis & Skin Tightening'],
      },
      {
        name: 'Dr. Hisham Alshaikh',
        specialty: 'Dermatology Specialist',
        days: [6, 7, 1, 2, 3, 4],
        windows: [[14 * 60, 22 * 60]],
        breaks: [[18 * 60, 19 * 60]],
        services: ['Deep Cleansing & Relaxation Facial', 'Medical Chemical Peel'],
      },
      {
        name: 'Dr. Ola Samman',
        specialty: 'Dermatology & Aesthetic Specialist',
        days: [6, 7, 1, 2, 3, 4],
        windows: [[14 * 60, 22 * 60]],
        breaks: [[17 * 60, 18 * 60]],
        services: ['Anti-Aging & Collagen Therapy', 'Deep Cleansing & Relaxation Facial'],
      },
    ],
  },
];

async function seedClinic(spec: ClinicSpec) {
  const clinic = await prisma.clinic.upsert({
    where: { slug: spec.slug },
    create: {
      slug: spec.slug,
      name: spec.name,
      timezone: spec.timezone,
      city: spec.city,
      country: spec.country,
      addressLine: spec.addressLine ?? null,
      phone: spec.phone ?? null,
      whatsappNumber: spec.whatsappNumber ?? null,
      description: `${spec.name} — Premier Dermatology & Aesthetic Clinic in ${spec.city}, ${spec.country}.`,
      email: `info@${spec.slug}.com`,
      isActive: true,
    },
    update: { name: spec.name, timezone: spec.timezone, city: spec.city, country: spec.country },
    select: { id: true, name: true },
  });

  await prisma.clinicSettings.upsert({
    where: { clinicId: clinic.id },
    create: {
      clinicId: clinic.id,
      defaultAppointmentMinutes: 45,
      defaultBufferMinutes: 15,
      slotGranularityMinutes: 15,
      minAdvanceBookingMinutes: 60,
      maxAdvanceBookingDays: 60,
      cancellationCutoffHours: 4,
      cancellationPolicy: 'Appointments can be cancelled free of charge up to 4 hours prior to scheduled time.',
      reschedulingPolicy: 'Rescheduling is permitted up to 4 hours before the appointment.',
    },
    update: {},
  });

  await prisma.aIConfiguration.upsert({
    where: { clinicId: clinic.id },
    create: {
      clinicId: clinic.id,
      assistantName: 'Reveal Beauty Assistant',
      greeting: `Ahlan wa Sahlan! Welcome to ${clinic.name} in Riyadh. How can I assist with your skin and glow care today?`,
      tone: 'warm, professional, luxurious, reassuring',
      primaryLanguage: 'ar',
      supportedLanguages: ['ar', 'en'],
      customInstructions:
        'You are the AI booking assistant for Reveal Clinics in Riyadh, Saudi Arabia. Assist patients with inquiries regarding PicoWay lasers, facials, skincare consultations, and doctor booking. Maintain a welcoming, premium tone.',
      isEnabled: true,
    },
    update: {},
  });

  // Saudi Opening Hours: Saturday through Thursday (6, 7, 1, 2, 3, 4) 14:00 - 22:00 (Friday closed)
  await prisma.clinicHours.deleteMany({ where: { clinicId: clinic.id } });
  await prisma.clinicHours.createMany({
    data: [6, 7, 1, 2, 3, 4].map((weekday) => ({
      clinicId: clinic.id,
      weekday,
      startMinute: 14 * 60,
      endMinute: 22 * 60,
      isClosed: false,
    })),
  });

  await prisma.reminderRule.upsert({
    where: { clinicId_offsetMinutes: { clinicId: clinic.id, offsetMinutes: 1440 } },
    create: { clinicId: clinic.id, offsetMinutes: 1440 },
    update: {},
  });

  const serviceIds = new Map<string, string>();
  for (const service of spec.services) {
    const row = await prisma.service.upsert({
      where: { clinicId_name: { clinicId: clinic.id, name: service.name } },
      create: {
        clinicId: clinic.id,
        name: service.name,
        durationMinutes: service.duration,
        priceMinor: service.price * 100,
        currency: spec.currency,
        description: service.description,
      },
      update: { durationMinutes: service.duration, currency: spec.currency },
      select: { id: true },
    });
    serviceIds.set(service.name, row.id);
  }

  for (const doctorSpec of spec.doctors) {
    const existing = await prisma.doctor.findFirst({
      where: { clinicId: clinic.id, name: doctorSpec.name },
      select: { id: true },
    });

    const doctor =
      existing ??
      (await prisma.doctor.create({
        data: {
          clinicId: clinic.id,
          name: doctorSpec.name,
          specialty: doctorSpec.specialty,
          description: `${doctorSpec.specialty} at ${clinic.name}.`,
        },
        select: { id: true },
      }));

    await prisma.doctorSchedule.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorSchedule.createMany({
      data: doctorSpec.days.flatMap((weekday) =>
        doctorSpec.windows.map(([startMinute, endMinute]) => ({
          doctorId: doctor.id,
          clinicId: clinic.id,
          weekday,
          startMinute,
          endMinute,
        })),
      ),
    });

    await prisma.doctorBreak.deleteMany({ where: { doctorId: doctor.id } });
    if (doctorSpec.breaks.length > 0) {
      await prisma.doctorBreak.createMany({
        data: doctorSpec.days.flatMap((weekday) =>
          doctorSpec.breaks.map(([startMinute, endMinute]) => ({
            doctorId: doctor.id,
            clinicId: clinic.id,
            weekday,
            startMinute,
            endMinute,
            label: 'Prayer & Rest',
          })),
        ),
      });
    }

    await prisma.doctorService.deleteMany({ where: { doctorId: doctor.id } });
    await prisma.doctorService.createMany({
      data: doctorSpec.services
        .map((name) => serviceIds.get(name))
        .filter((id): id is string => Boolean(id))
        .map((serviceId) => ({ doctorId: doctor.id, serviceId, clinicId: clinic.id })),
    });
  }

  await prisma.fAQ.deleteMany({ where: { clinicId: clinic.id } });
  await prisma.fAQ.createMany({
    data: [
      {
        clinicId: clinic.id,
        question: 'What treatments does Reveal Clinics specialize in?',
        answer: 'We specialize in PicoWay laser pigmentation removal, Laser Genesis, relaxation facials, chemical peels, and anti-aging dermatology care.',
        category: 'Services',
        sortOrder: 1,
      },
      {
        clinicId: clinic.id,
        question: 'Where is Reveal Clinics located in Riyadh?',
        answer: 'We are located at 2484 Muhammad Al Maqdimi, An Nafal, Riyadh 13312, Saudi Arabia.',
        category: 'Location',
        sortOrder: 2,
      },
      {
        clinicId: clinic.id,
        question: 'What are your clinic working hours?',
        answer: 'We are open Saturday through Thursday from 2:00 PM to 10:00 PM (14:00 - 22:00). We are closed on Fridays.',
        category: 'Hours',
        sortOrder: 3,
      },
    ],
  });

  return clinic;
}

async function main() {
  const credentials: Array<{ email: string; password: string; role: string }> = [];

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL ?? 'samiullahqureshi@gmail.com';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD || 'SAMI@1234';
  await upsertUser({
    email: adminEmail,
    name: 'Saudi Platform Administrator',
    role: 'SUPER_ADMIN',
    clinicId: null,
    password: adminPassword,
  });
  credentials.push({ email: adminEmail, password: adminPassword, role: 'SUPER_ADMIN' });

  for (const spec of CLINICS) {
    const clinic = await seedClinic(spec);
    const email = `owner@${spec.slug}.com`;
    const password = 'SaudiClinic@1234';
    await upsertUser({
      email,
      name: `${clinic.name} Owner`,
      role: 'CLIENT',
      clinicId: clinic.id,
      password,
    });
    credentials.push({ email, password, role: 'CLIENT' });
    console.log(`Seeded Saudi Clinic: ${clinic.name} (${spec.timezone})`);
  }

  console.log('\n--- Saudi Arabia Seeded Accounts ---');
  for (const cred of credentials) {
    console.log(`  ${cred.role.padEnd(11)} Email: ${cred.email} | Password: ${cred.password}`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
