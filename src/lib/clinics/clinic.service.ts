import 'server-only';
import type { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { conflict, notFound } from '@/lib/errors';
import { recordAudit } from '@/lib/audit';
import { encryptOptional } from '@/lib/crypto';
import { assertPlatformScope, resolveClinicId, type TenantScope } from '@/lib/tenancy/scope';
import { resyncClinicReminders } from '@/lib/reminders/scheduler';
import { hashPassword } from '@/lib/auth/password';
import type {
  aiConfigSchema,
  clinicBasicsSchema,
  clinicHoursSchema,
  clinicSettingsSchema,
  faqSchema,
  holidaySchema,
  reminderRuleSchema,
  specialClosureSchema,
  whatsappConfigSchema,
} from '@/lib/validation/schemas';

/**
 * Clinic configuration.
 *
 * All mutations here are SUPER_ADMIN-only by design — the product model is that
 * our team configures a clinic and the client only ever reads reports. That is
 * enforced with `assertPlatformScope` on every writer rather than by hiding the
 * screens, so a CLIENT calling the API directly is refused too.
 */

export async function listClinics(scope: TenantScope, search?: string) {
  return prisma.clinic.findMany({
    where: {
      ...(scope.kind === 'PLATFORM' ? {} : { id: scope.clinicId }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { slug: { contains: search, mode: 'insensitive' as const } },
              { city: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      slug: true,
      city: true,
      country: true,
      timezone: true,
      isActive: true,
      pulseHealthOS: true,
      pulseNow: true,
      createdAt: true,
      whatsapp: { select: { isActive: true, displayPhoneNumber: true } },
      aiConfiguration: { select: { isEnabled: true, assistantName: true } },
      _count: { select: { doctors: true, services: true, leads: true, appointments: true } },
    },
  });
}

/**
 * Full configuration for the admin editor.
 *
 * Note what is *not* selected: no credential ciphertext ever leaves this
 * function. The WhatsApp block reports only whether each secret is present.
 */
export async function getClinicDetail(scope: TenantScope, clinicId: string) {
  const id = resolveClinicId(scope, clinicId);
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    include: {
      settings: true,
      aiConfiguration: true,
      hours: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
      holidays: { orderBy: { date: 'asc' } },
      specialClosures: { orderBy: { startDate: 'asc' } },
      faqs: { orderBy: { sortOrder: 'asc' } },
      reminderRules: { orderBy: { offsetMinutes: 'desc' } },
      whatsapp: {
        select: {
          id: true,
          phoneNumberId: true,
          wabaId: true,
          displayPhoneNumber: true,
          isActive: true,
          lastError: true,
          lastErrorAt: true,
          accessTokenCipher: true,
          appSecretCipher: true,
          verifyTokenCipher: true,
        },
      },
      doctors: {
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        include: {
          schedules: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
          breaks: { orderBy: [{ weekday: 'asc' }, { startMinute: 'asc' }] },
          timeOff: { orderBy: { startDate: 'asc' } },
          services: { select: { service: { select: { id: true, name: true } } } },
        },
      },
      services: {
        orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
        select: { id: true, name: true, durationMinutes: true, bufferMinutes: true, isActive: true },
      },
      users: {
        select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true, lastLoginAt: true },
        orderBy: { createdAt: 'desc' },
      },
      _count: { select: { doctors: true, services: true, leads: true, appointments: true } },
    },
  });
  if (!clinic) throw notFound('Clinic not found.');

  const { whatsapp, ...rest } = clinic;
  return {
    ...rest,
    whatsapp: whatsapp
      ? {
          id: whatsapp.id,
          phoneNumberId: whatsapp.phoneNumberId,
          wabaId: whatsapp.wabaId,
          displayPhoneNumber: whatsapp.displayPhoneNumber,
          isActive: whatsapp.isActive,
          lastError: whatsapp.lastError,
          lastErrorAt: whatsapp.lastErrorAt,
          // Presence flags only — never the values.
          hasAccessToken: Boolean(whatsapp.accessTokenCipher),
          hasAppSecret: Boolean(whatsapp.appSecretCipher),
          hasVerifyToken: Boolean(whatsapp.verifyTokenCipher),
        }
      : null,
  };
}

/** Lightweight profile a CLIENT is allowed to see in their own portal. */
export async function getClinicProfileForPortal(scope: TenantScope, clinicId?: string | null) {
  const id = resolveClinicId(scope, clinicId);
  const clinic = await prisma.clinic.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      country: true,
      timezone: true,
      phone: true,
      email: true,
      website: true,
      isActive: true,
      pulseHealthOS: true,
      pulseNow: true,
      _count: { select: { doctors: true, services: true } },
    },
  });
  if (!clinic) throw notFound('Clinic not found.');
  return clinic;
}

export interface ClinicOwnerInput {
  name: string;
  email: string;
  passwordHash: string;
}

export async function createClinic(
  scope: TenantScope,
  input: z.input<typeof clinicBasicsSchema>,
  owner?: ClinicOwnerInput,
) {
  assertPlatformScope(scope, 'create clinics');

  const existing = await prisma.clinic.findUnique({ where: { slug: input.slug } });
  if (existing) throw conflict('A clinic with that slug already exists.');

  if (owner) {
    const emailTaken = await prisma.user.findUnique({ where: { email: owner.email } });
    if (emailTaken) throw conflict('A user with that email already exists.');
  }

  const clinic = await prisma.$transaction(async (tx) => {
    const created = await tx.clinic.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        phone: input.phone ?? null,
        whatsappNumber: input.whatsappNumber ?? null,
        email: input.email || null,
        website: input.website || null,
        addressLine: input.addressLine ?? null,
        city: input.city ?? null,
        country: input.country ?? null,
        timezone: input.timezone,
        isActive: input.isActive,
        pulseHealthOS: input.pulseHealthOS ?? true,
        pulseNow: input.pulseNow ?? false,
      },
    });

    // Every clinic gets a usable baseline so the agent is never asked to run
    // against missing configuration.
    await tx.clinicSettings.create({ data: { clinicId: created.id } });
    await tx.aIConfiguration.create({
      data: { clinicId: created.id, assistantName: `${created.name} Assistant` },
    });
    await tx.clinicHours.createMany({
      data: [1, 2, 3, 4, 5].map((weekday) => ({
        clinicId: created.id,
        weekday,
        startMinute: 9 * 60,
        endMinute: 17 * 60,
      })),
    });
    await tx.reminderRule.createMany({
      data: [
        { clinicId: created.id, offsetMinutes: 24 * 60 },
        { clinicId: created.id, offsetMinutes: 120 },
      ],
    });

    // Optionally create the clinic owner account in the same transaction so
    // the clinic and its primary user are always consistent.
    if (owner) {
      await tx.user.create({
        data: {
          name: owner.name,
          email: owner.email,
          passwordHash: owner.passwordHash,
          role: 'CLIENT',
          clinicId: created.id,
          isActive: true,
        },
      });
    }

    return created;
  });

  await recordAudit(scope, {
    action: 'clinic.create',
    entityType: 'Clinic',
    entityId: clinic.id,
    clinicId: clinic.id,
    metadata: { name: clinic.name, slug: clinic.slug, hasOwner: !!owner },
  });
  return clinic;
}

export async function updateClinicBasics(
  scope: TenantScope,
  clinicId: string,
  input: z.input<typeof clinicBasicsSchema>,
) {
  assertPlatformScope(scope, 'edit clinic configuration');

  const clash = await prisma.clinic.findFirst({
    where: { slug: input.slug, NOT: { id: clinicId } },
    select: { id: true },
  });
  if (clash) throw conflict('A clinic with that slug already exists.');

  const clinic = await prisma.clinic.update({
    where: { id: clinicId },
    data: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      phone: input.phone ?? null,
      whatsappNumber: input.whatsappNumber ?? null,
      email: input.email || null,
      website: input.website || null,
      addressLine: input.addressLine ?? null,
      city: input.city ?? null,
      country: input.country ?? null,
      timezone: input.timezone,
      isActive: input.isActive,
      pulseHealthOS: input.pulseHealthOS ?? true,
      pulseNow: input.pulseNow ?? false,
    },
  });

  await recordAudit(scope, {
    action: 'clinic.update',
    entityType: 'Clinic',
    entityId: clinicId,
    clinicId,
    metadata: { name: input.name, timezone: input.timezone, isActive: input.isActive },
  });
  return clinic;
}

export async function updateClinicSettings(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof clinicSettingsSchema>,
) {
  assertPlatformScope(scope, 'edit clinic settings');
  const settings = await prisma.clinicSettings.upsert({
    where: { clinicId },
    create: { clinicId, ...input, cancellationPolicy: input.cancellationPolicy ?? null, reschedulingPolicy: input.reschedulingPolicy ?? null },
    update: { ...input, cancellationPolicy: input.cancellationPolicy ?? null, reschedulingPolicy: input.reschedulingPolicy ?? null },
  });
  await recordAudit(scope, {
    action: 'clinic.settings.update',
    entityType: 'ClinicSettings',
    entityId: settings.id,
    clinicId,
  });
  return settings;
}

export async function replaceClinicHours(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof clinicHoursSchema>,
) {
  assertPlatformScope(scope, 'edit opening hours');
  await prisma.$transaction([
    prisma.clinicHours.deleteMany({ where: { clinicId } }),
    prisma.clinicHours.createMany({
      data: input.hours.map((h) => ({
        clinicId,
        weekday: h.weekday,
        startMinute: h.startMinute,
        endMinute: h.endMinute,
        isClosed: h.isClosed,
      })),
    }),
  ]);
  await recordAudit(scope, {
    action: 'clinic.hours.replace',
    entityType: 'ClinicHours',
    entityId: clinicId,
    clinicId,
    metadata: { windows: input.hours.length },
  });
}

export async function addHoliday(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof holidaySchema>,
) {
  assertPlatformScope(scope, 'edit holidays');
  const holiday = await prisma.holiday.create({ data: { clinicId, ...input } });
  await recordAudit(scope, {
    action: 'clinic.holiday.create',
    entityType: 'Holiday',
    entityId: holiday.id,
    clinicId,
    metadata: { date: input.date, name: input.name },
  });
  return holiday;
}

export async function deleteHoliday(scope: TenantScope, clinicId: string, holidayId: string) {
  assertPlatformScope(scope, 'edit holidays');
  await prisma.holiday.deleteMany({ where: { id: holidayId, clinicId } });
  await recordAudit(scope, {
    action: 'clinic.holiday.delete',
    entityType: 'Holiday',
    entityId: holidayId,
    clinicId,
  });
}

export async function addSpecialClosure(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof specialClosureSchema>,
) {
  assertPlatformScope(scope, 'edit closures');
  const closure = await prisma.specialClosure.create({
    data: {
      clinicId,
      reason: input.reason ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      startMinute: input.startMinute ?? null,
      endMinute: input.endMinute ?? null,
    },
  });
  await recordAudit(scope, {
    action: 'clinic.closure.create',
    entityType: 'SpecialClosure',
    entityId: closure.id,
    clinicId,
  });
  return closure;
}

export async function deleteSpecialClosure(
  scope: TenantScope,
  clinicId: string,
  closureId: string,
) {
  assertPlatformScope(scope, 'edit closures');
  await prisma.specialClosure.deleteMany({ where: { id: closureId, clinicId } });
  await recordAudit(scope, {
    action: 'clinic.closure.delete',
    entityType: 'SpecialClosure',
    entityId: closureId,
    clinicId,
  });
}

export async function updateAiConfiguration(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof aiConfigSchema>,
) {
  assertPlatformScope(scope, 'edit AI configuration');
  const config = await prisma.aIConfiguration.upsert({
    where: { clinicId },
    create: {
      clinicId,
      ...input,
      greeting: input.greeting ?? null,
      personality: input.personality ?? null,
      customInstructions: input.customInstructions ?? null,
      escalationRules: input.escalationRules ?? null,
    },
    update: {
      ...input,
      greeting: input.greeting ?? null,
      personality: input.personality ?? null,
      customInstructions: input.customInstructions ?? null,
      escalationRules: input.escalationRules ?? null,
    },
  });
  await recordAudit(scope, {
    action: 'clinic.ai.update',
    entityType: 'AIConfiguration',
    entityId: config.id,
    clinicId,
    // Never log the prompt body; record only that it changed.
    metadata: { model: input.model, isEnabled: input.isEnabled },
  });
  return config;
}

/**
 * Update the WhatsApp integration.
 *
 * Secrets are write-only: a blank field means "keep what is stored", and no
 * code path returns a decrypted credential to a caller. The values are
 * encrypted here so plaintext exists only for the duration of this call.
 */
export async function updateWhatsAppIntegration(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof whatsappConfigSchema>,
) {
  assertPlatformScope(scope, 'edit WhatsApp configuration');

  const clash = await prisma.whatsAppIntegration.findFirst({
    where: { phoneNumberId: input.phoneNumberId, NOT: { clinicId } },
    select: { clinicId: true },
  });
  if (clash) {
    throw conflict('That WhatsApp phone number id is already linked to another clinic.');
  }

  const secretUpdates = {
    ...(input.accessToken ? { accessTokenCipher: encryptOptional(input.accessToken) } : {}),
    ...(input.appSecret ? { appSecretCipher: encryptOptional(input.appSecret) } : {}),
    ...(input.verifyToken ? { verifyTokenCipher: encryptOptional(input.verifyToken) } : {}),
  };

  const integration = await prisma.whatsAppIntegration.upsert({
    where: { clinicId },
    create: {
      clinicId,
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId ?? null,
      displayPhoneNumber: input.displayPhoneNumber ?? null,
      isActive: input.isActive,
      ...secretUpdates,
    },
    update: {
      phoneNumberId: input.phoneNumberId,
      wabaId: input.wabaId ?? null,
      displayPhoneNumber: input.displayPhoneNumber ?? null,
      isActive: input.isActive,
      ...secretUpdates,
    },
    select: { id: true },
  });

  await recordAudit(scope, {
    action: 'clinic.whatsapp.update',
    entityType: 'WhatsAppIntegration',
    entityId: integration.id,
    clinicId,
    metadata: {
      phoneNumberId: input.phoneNumberId,
      isActive: input.isActive,
      rotatedAccessToken: Boolean(input.accessToken),
      rotatedAppSecret: Boolean(input.appSecret),
    },
  });
  return integration;
}

export async function upsertReminderRule(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof reminderRuleSchema>,
) {
  assertPlatformScope(scope, 'edit reminder rules');
  const rule = await prisma.reminderRule.upsert({
    where: { clinicId_offsetMinutes: { clinicId, offsetMinutes: input.offsetMinutes } },
    create: { clinicId, ...input, template: input.template ?? null },
    update: { template: input.template ?? null, isActive: input.isActive },
  });
  // Existing future bookings pick up the change immediately.
  await resyncClinicReminders(clinicId);
  await recordAudit(scope, {
    action: 'clinic.reminder_rule.upsert',
    entityType: 'ReminderRule',
    entityId: rule.id,
    clinicId,
    metadata: { offsetMinutes: input.offsetMinutes, isActive: input.isActive },
  });
  return rule;
}

export async function deleteReminderRule(scope: TenantScope, clinicId: string, ruleId: string) {
  assertPlatformScope(scope, 'edit reminder rules');
  await prisma.reminderRule.deleteMany({ where: { id: ruleId, clinicId } });
  await resyncClinicReminders(clinicId);
  await recordAudit(scope, {
    action: 'clinic.reminder_rule.delete',
    entityType: 'ReminderRule',
    entityId: ruleId,
    clinicId,
  });
}

export async function upsertFaq(
  scope: TenantScope,
  clinicId: string,
  input: z.infer<typeof faqSchema>,
  faqId?: string,
) {
  assertPlatformScope(scope, 'edit FAQs');
  const data = {
    clinicId,
    question: input.question,
    answer: input.answer,
    category: input.category ?? null,
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  };
  const faq = faqId
    ? await prisma.fAQ.update({ where: { id: faqId }, data })
    : await prisma.fAQ.create({ data });
  await recordAudit(scope, {
    action: faqId ? 'clinic.faq.update' : 'clinic.faq.create',
    entityType: 'FAQ',
    entityId: faq.id,
    clinicId,
  });
  return faq;
}

export async function deleteFaq(scope: TenantScope, clinicId: string, faqId: string) {
  assertPlatformScope(scope, 'edit FAQs');
  await prisma.fAQ.deleteMany({ where: { id: faqId, clinicId } });
  await recordAudit(scope, {
    action: 'clinic.faq.delete',
    entityType: 'FAQ',
    entityId: faqId,
    clinicId,
  });
}

export async function setClinicActive(scope: TenantScope, clinicId: string, isActive: boolean) {
  assertPlatformScope(scope, 'activate or deactivate clinics');
  const clinic = await prisma.clinic.update({ where: { id: clinicId }, data: { isActive } });
  await recordAudit(scope, {
    action: isActive ? 'clinic.activate' : 'clinic.deactivate',
    entityType: 'Clinic',
    entityId: clinicId,
    clinicId,
  });
  return clinic;
}

export async function deleteClinic(scope: TenantScope, clinicId: string) {
  assertPlatformScope(scope, 'delete clinics');
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { id: true, name: true } });
  if (!clinic) throw notFound('Clinic not found.');

  await recordAudit(scope, {
    action: 'clinic.delete',
    entityType: 'Clinic',
    entityId: clinicId,
    clinicId: null,
    metadata: { name: clinic.name, deletedClinicId: clinicId },
  });

  await prisma.clinic.delete({ where: { id: clinicId } });
}

/** Clinic options for admin filter dropdowns. */
export async function listClinicOptions(scope: TenantScope) {
  return prisma.clinic.findMany({
    // Clinic is the tenant root, so it is keyed on `id`, not `clinicId`.
    where: scope.kind === 'PLATFORM' ? {} : { id: scope.clinicId },
    select: { id: true, name: true, timezone: true, isActive: true },
    orderBy: { name: 'asc' },
  });
}

export async function createClinicUser(
  scope: TenantScope,
  clinicId: string,
  input: { name: string; email: string; passwordHash: string },
) {
  assertPlatformScope(scope, 'manage clinic users');
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw conflict('A user with that email already exists.');

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: 'CLIENT',
      clinicId,
      isActive: true,
    },
  });

  await recordAudit(scope, {
    action: 'clinic.user.create',
    entityType: 'User',
    entityId: user.id,
    clinicId,
    metadata: { email: user.email, name: user.name },
  });

  return user;
}

export async function resetClinicUserPassword(
  scope: TenantScope,
  clinicId: string,
  userId: string,
  passwordHash: string,
) {
  assertPlatformScope(scope, 'manage clinic users');
  const user = await prisma.user.findFirst({ where: { id: userId, clinicId } });
  if (!user) throw notFound('User not found in this clinic.');

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash, failedLogins: 0, lockedUntil: null },
  });

  await recordAudit(scope, {
    action: 'clinic.user.resetPassword',
    entityType: 'User',
    entityId: userId,
    clinicId,
  });
}

