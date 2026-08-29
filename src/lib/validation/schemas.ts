import { z } from 'zod';
import { isValidTimezone } from '@/lib/time/timezone';

/**
 * Request validation.
 *
 * Every mutating entry point parses its input through one of these before the
 * service layer sees it. Shared here rather than inline so the admin UI, the
 * REST routes and the tests all agree on what a valid payload is.
 */

const trimmed = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v === '' ? undefined : v));

export const idSchema = z.string().min(1).max(64);

export const timezoneSchema = z
  .string()
  .min(1)
  .refine(isValidTimezone, 'Must be a valid IANA timezone, e.g. Europe/London');

export const dateKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be a date in YYYY-MM-DD format');

export const minuteOfDaySchema = z.coerce.number().int().min(0).max(1440);

export const weekdaySchema = z.coerce.number().int().min(1).max(7);

/** Digits-only E.164 without the leading '+', matching WhatsApp's format. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[^\d]/g, ''))
  .pipe(z.string().min(7, 'Too short to be a phone number').max(20));

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

// --- Auth ------------------------------------------------------------------

export const loginSchema = z.object({
  email: z.string().trim().min(1).max(200),
  password: z.string().min(1).max(200),
});

export const createUserSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(200),
    name: trimmed(120).min(1),
    password: z.string().min(12, 'Must be at least 12 characters').max(200),
    role: z.enum(['SUPER_ADMIN', 'CLIENT']),
    clinicId: idSchema.optional().nullable(),
  })
  .refine((v) => v.role === 'SUPER_ADMIN' || Boolean(v.clinicId), {
    message: 'Client accounts must be linked to a clinic.',
    path: ['clinicId'],
  });

export const updateUserSchema = z.object({
  name: trimmed(120).min(1).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(12).max(200).optional(),
});

// --- Clinic ----------------------------------------------------------------

export const clinicBasicsSchema = z.object({
  name: trimmed(160).min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9-]+$/, 'Use lowercase letters, digits and hyphens only'),
  description: optionalText(2_000),
  phone: optionalText(40),
  whatsappNumber: optionalText(40),
  email: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal('')),
  website: z.string().trim().url().max(300).optional().or(z.literal('')),
  addressLine: optionalText(300),
  city: optionalText(120),
  country: optionalText(120),
  timezone: timezoneSchema,
  isActive: z.boolean().default(true),
});

export const clinicSettingsSchema = z
  .object({
    defaultAppointmentMinutes: z.coerce.number().int().min(5).max(480),
    defaultBufferMinutes: z.coerce.number().int().min(0).max(240),
    slotGranularityMinutes: z.coerce.number().int().min(5).max(240),
    minAdvanceBookingMinutes: z.coerce.number().int().min(0).max(43_200),
    maxAdvanceBookingDays: z.coerce.number().int().min(1).max(365),
    cancellationCutoffHours: z.coerce.number().int().min(0).max(720),
    allowPatientCancellation: z.boolean(),
    allowPatientReschedule: z.boolean(),
    cancellationPolicy: optionalText(2_000),
    reschedulingPolicy: optionalText(2_000),
    maxSlotsOfferedToAI: z.coerce.number().int().min(1).max(10),
  })
  .refine((v) => v.slotGranularityMinutes <= v.defaultAppointmentMinutes, {
    message: 'Slot granularity cannot exceed the default appointment length.',
    path: ['slotGranularityMinutes'],
  });

const localWindow = z
  .object({ startMinute: minuteOfDaySchema, endMinute: minuteOfDaySchema })
  .refine((v) => v.endMinute > v.startMinute, {
    message: 'End time must be after start time.',
    path: ['endMinute'],
  });

export const clinicHoursSchema = z.object({
  hours: z
    .array(localWindow.and(z.object({ weekday: weekdaySchema, isClosed: z.boolean().default(false) })))
    .max(50),
});

export const holidaySchema = z.object({
  name: trimmed(160).min(1),
  date: dateKeySchema,
  isRecurringAnnually: z.boolean().default(false),
});

export const specialClosureSchema = z
  .object({
    reason: optionalText(300),
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    startMinute: minuteOfDaySchema.optional().nullable(),
    endMinute: minuteOfDaySchema.optional().nullable(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date cannot be before the start date.',
    path: ['endDate'],
  })
  .refine(
    (v) =>
      (v.startMinute === null || v.startMinute === undefined) ===
      (v.endMinute === null || v.endMinute === undefined),
    { message: 'Provide both a start and end time, or neither.', path: ['endMinute'] },
  );

// --- Doctors ---------------------------------------------------------------

export const doctorSchema = z.object({
  name: trimmed(160).min(2),
  specialty: optionalText(160),
  description: optionalText(2_000),
  email: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal('')),
  password: z.string().min(6).max(200).optional().or(z.literal('')),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  isActive: z.boolean().default(true),
  appointmentMinutes: z.coerce.number().int().min(5).max(480).optional().nullable(),
  bufferMinutes: z.coerce.number().int().min(0).max(240).optional().nullable(),
  coordinatorId: idSchema.optional().nullable(),
  serviceIds: z.array(idSchema).max(100).default([]),
  schedules: z
    .array(localWindow.and(z.object({ weekday: weekdaySchema })))
    .max(50)
    .default([]),
  breaks: z
    .array(localWindow.and(z.object({ weekday: weekdaySchema, label: optionalText(80) })))
    .max(50)
    .default([]),
});

export const clinicDoctorOperationalSchema = z.object({
  name: trimmed(160).min(2).optional(),
  specialty: optionalText(160),
  description: optionalText(2_000),
  imageUrl: z.string().trim().url().max(500).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  appointmentMinutes: z.coerce.number().int().min(5).max(480).optional().nullable(),
  bufferMinutes: z.coerce.number().int().min(0).max(240).optional().nullable(),
  coordinatorId: idSchema.optional().nullable(),
  serviceIds: z.array(idSchema).max(100).optional(),
  schedules: z
    .array(localWindow.and(z.object({ weekday: weekdaySchema })))
    .max(50)
    .optional(),
  breaks: z
    .array(localWindow.and(z.object({ weekday: weekdaySchema, label: optionalText(80) })))
    .max(50)
    .optional(),
});

export const createCoordinatorSchema = z.object({
  name: trimmed(120).min(1),
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8).max(200).optional(),
});

export const doctorTimeOffSchema = z
  .object({
    reason: optionalText(300),
    startDate: dateKeySchema,
    endDate: dateKeySchema,
    startMinute: minuteOfDaySchema.optional().nullable(),
    endMinute: minuteOfDaySchema.optional().nullable(),
  })
  .refine((v) => v.endDate >= v.startDate, {
    message: 'End date cannot be before the start date.',
    path: ['endDate'],
  });

// --- Services --------------------------------------------------------------

export const serviceSchema = z.object({
  name: trimmed(160).min(2),
  description: optionalText(2_000),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  bufferMinutes: z.coerce.number().int().min(0).max(240).optional().nullable(),
  /** Accepts a major-unit decimal from the form and stores minor units. */
  price: z.coerce.number().min(0).max(1_000_000).optional().nullable(),
  currency: z.string().trim().length(3).toUpperCase().optional().nullable().default('SAR'),
  isActive: z.boolean().default(true),
  doctorIds: z.array(idSchema).max(100).default([]),
});

// --- AI & integrations -----------------------------------------------------

export const aiConfigSchema = z.object({
  assistantName: trimmed(80).min(1),
  greeting: optionalText(1_000),
  tone: trimmed(200).min(1),
  personality: optionalText(1_000),
  primaryLanguage: trimmed(10).min(2),
  supportedLanguages: z.array(z.string().trim().min(2).max(10)).max(20).default(['en']),
  customInstructions: optionalText(8_000),
  escalationRules: optionalText(4_000),
  escalationKeywords: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  model: trimmed(80).min(1),
  temperature: z.coerce.number().min(0).max(2),
  maxOutputTokens: z.coerce.number().int().min(64).max(8_192),
  historyWindow: z.coerce.number().int().min(2).max(100),
  isEnabled: z.boolean().default(true),
});

export const whatsappConfigSchema = z.object({
  phoneNumberId: trimmed(64).min(1),
  wabaId: optionalText(64),
  displayPhoneNumber: optionalText(40),
  /** Blank means "leave the stored credential unchanged". */
  accessToken: z.string().max(1_000).optional(),
  appSecret: z.string().max(500).optional(),
  verifyToken: z.string().max(500).optional(),
  isActive: z.boolean().default(false),
});

export const reminderRuleSchema = z.object({
  offsetMinutes: z.coerce.number().int().min(5).max(20_160),
  template: optionalText(1_000),
  isActive: z.boolean().default(true),
});

export const faqSchema = z.object({
  question: trimmed(500).min(3),
  answer: trimmed(4_000).min(1),
  category: optionalText(80),
  sortOrder: z.coerce.number().int().min(0).max(9_999).default(0),
  isActive: z.boolean().default(true),
});

// --- Appointments ----------------------------------------------------------

export const createAppointmentSchema = z.object({
  clinicId: z.string().trim().max(120).optional().nullable(),
  doctorId: z.string().trim().min(1, 'Doctor is required').max(120),
  serviceId: z.string().trim().min(1, 'Service is required').max(120),
  patientType: z.enum(['EXISTING', 'NEW']).optional().default('NEW'),
  fileNumber: z.coerce.number().int().optional().nullable(),
  patientId: z.string().trim().max(120).optional().nullable(),
  title: optionalText(30),
  gender: optionalText(30),
  nationality: optionalText(80),
  patientName: optionalText(120),
  patientPhone: optionalText(40),
  pendingPayment: optionalText(100),
  startsAt: z.coerce.date({ invalid_type_error: 'Valid appointment date and time required' }),
  notes: optionalText(1_000),
  status: z.enum(['PENDING', 'CONFIRMED']).default('CONFIRMED'),
  idempotencyKey: z.string().max(200).optional(),
});

export const rescheduleSchema = z.object({
  newStartsAt: z.coerce.date(),
  newDoctorId: idSchema.optional().nullable(),
  reason: optionalText(300),
});

export const cancelSchema = z.object({ reason: optionalText(300) });

export const availabilityQuerySchema = z.object({
  clinicId: idSchema.optional(),
  serviceId: idSchema,
  doctorId: idSchema.optional(),
  fromDate: dateKeySchema,
  toDate: dateKeySchema.optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});

// --- Patients & leads ------------------------------------------------------

export const patientSchema = z.object({
  name: optionalText(160),
  phone: phoneSchema,
  email: z.string().trim().toLowerCase().email().max(200).optional().or(z.literal('')),
  notes: optionalText(2_000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
});

export const leadUpdateSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'BOOKED', 'LOST']).optional(),
  notes: optionalText(2_000),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  lostReason: optionalText(300),
});

export const leadListSchema = paginationSchema.extend({
  clinicId: idSchema.optional(),
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'BOOKED', 'LOST']).optional(),
  search: z.string().trim().max(120).optional(),
});

export const appointmentListSchema = paginationSchema.extend({
  clinicId: idSchema.optional(),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'])
    .optional(),
  doctorId: idSchema.optional(),
  from: dateKeySchema.optional(),
  to: dateKeySchema.optional(),
  search: z.string().trim().max(120).optional(),
});

export const analyticsRangeSchema = z.object({
  clinicId: idSchema.optional(),
  days: z.coerce.number().int().min(1).max(365).default(30),
});
