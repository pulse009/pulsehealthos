import 'server-only';
import { z } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';
import { systemScope, type TenantScope } from '@/lib/tenancy/scope';
import type { FunctionDeclaration, GeminiSchema } from '@/lib/ai/gemini';
import {
  getAvailableSlots,
  decodeSlotToken,
  loadSchedulingConfig,
  type ResolvedSlot,
} from '@/lib/booking/availability.service';
import {
  createAppointment,
  cancelAppointment,
  rescheduleAppointment,
  listUpcomingAppointments,
} from '@/lib/booking/booking.service';
import { escalateConversation } from '@/lib/conversations/conversation.service';
import {
  addDaysToDateKey,
  formatInstant,
  formatLocalIso,
  formatTime,
  toDateKey,
  formatMinutes,
} from '@/lib/time/timezone';
import { ACTIVE_APPOINTMENT_STATUSES } from '@/lib/booking/constants';

/**
 * The AI's capability surface.
 *
 * This module is the whole reason the architecture is safe. The model never
 * touches Prisma, never sees a `clinicId` it could tamper with, and cannot
 * express an action that is not declared here. Every executor:
 *
 *   1. validates its arguments with Zod (the model's output is untrusted input),
 *   2. runs against a `SYSTEM` scope pinned to the conversation's clinic, so a
 *      hallucinated identifier from another tenant simply resolves to nothing,
 *   3. returns plain JSON that is safe to replay into the prompt.
 *
 * Nothing here returns secrets, internal ids the model does not need, or raw
 * error text. Failures come back as `{ ok: false, error }` so the model can
 * recover conversationally instead of the turn collapsing.
 */

export interface ToolContext {
  clinicId: string;
  patientId: string;
  leadId: string;
  conversationId: string;
  timezone: string;
  locale: string;
  /** Deterministic clock for tests. */
  now: Date;
  /**
   * Seed for per-call idempotency keys — derived from the inbound WhatsApp
   * message id, so a redelivered webhook that replays the same tool call
   * returns the original appointment instead of booking a second one.
   */
  idempotencySeed: string;
}

export type ToolResult = Record<string, unknown>;

interface ToolDefinition<TSchema extends z.ZodTypeAny> {
  name: string;
  description: string;
  parameters: GeminiSchema;
  schema: TSchema;
  execute: (args: z.infer<TSchema>, ctx: ToolContext) => Promise<ToolResult>;
}

/**
 * A tool with its argument type erased, so the registry can hold a
 * heterogeneous list. `defineTool` is the only way to build one, which keeps the
 * schema and the executor's parameter type checked against each other at the
 * definition site — the erasure never widens what an individual tool accepts.
 */
interface ErasedTool {
  name: string;
  description: string;
  parameters: GeminiSchema;
  schema: z.ZodTypeAny;
  execute: (args: unknown, ctx: ToolContext) => Promise<ToolResult>;
}

function defineTool<TSchema extends z.ZodTypeAny>(def: ToolDefinition<TSchema>): ErasedTool {
  return {
    name: def.name,
    description: def.description,
    parameters: def.parameters,
    schema: def.schema,
    // Safe: `executeTool` only ever calls this with output already validated by
    // `def.schema`, so the value really is `z.infer<TSchema>`.
    execute: (args, ctx) => def.execute(args as z.infer<TSchema>, ctx),
  };
}

const scopeOf = (ctx: ToolContext): TenantScope => systemScope(ctx.clinicId, 'ai-agent');

/** Compact, model-friendly rendering of a slot. */
function describeSlot(slot: ResolvedSlot, locale: string) {
  return {
    slot_token: slot.slotToken,
    doctor: slot.doctorName,
    service: slot.serviceName,
    when: formatInstant(slot.start, slot.timezone, { locale }),
    local_time: formatLocalIso(slot.start, slot.timezone),
    duration_minutes: slot.durationMinutes,
  };
}

// --- Tool: clinic information ---------------------------------------------

const clinicInfoSchema = z.object({
  topic: z
    .enum(['general', 'hours', 'location', 'policies', 'faq'])
    .optional()
    .describe('Which part of the clinic profile to read.'),
});

const getClinicInformation: ToolDefinition<typeof clinicInfoSchema> = {
  name: 'get_clinic_information',
  description:
    'Look up factual information about the clinic: address, contact details, opening hours, policies, and answers to frequently asked questions. Use this instead of guessing any clinic detail.',
  parameters: {
    type: 'OBJECT',
    properties: {
      topic: {
        type: 'STRING',
        enum: ['general', 'hours', 'location', 'policies', 'faq'],
        description: 'Which part of the clinic profile to read. Defaults to general.',
      },
    },
  },
  schema: clinicInfoSchema,
  async execute(args, ctx) {
    const clinic = await prisma.clinic.findUnique({
      where: { id: ctx.clinicId },
      select: {
        name: true,
        description: true,
        phone: true,
        email: true,
        website: true,
        addressLine: true,
        city: true,
        country: true,
        timezone: true,
        hours: {
          select: { weekday: true, startMinute: true, endMinute: true, isClosed: true },
          orderBy: { weekday: 'asc' },
        },
        settings: {
          select: {
            cancellationPolicy: true,
            reschedulingPolicy: true,
            cancellationCutoffHours: true,
            minAdvanceBookingMinutes: true,
            maxAdvanceBookingDays: true,
          },
        },
        faqs: {
          where: { isActive: true },
          select: { question: true, answer: true, category: true },
          orderBy: { sortOrder: 'asc' },
          take: 40,
        },
      },
    });
    if (!clinic) return { ok: false, error: 'Clinic profile is unavailable.' };

    const weekdayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const topic = args.topic ?? 'general';

    const base = {
      ok: true,
      clinic_name: clinic.name,
      current_local_time: formatLocalIso(ctx.now, ctx.timezone),
      timezone: clinic.timezone,
    };

    if (topic === 'hours') {
      return {
        ...base,
        opening_hours: clinic.hours
          .filter((h) => !h.isClosed)
          .map((h) => ({
            day: weekdayNames[h.weekday],
            opens: formatMinutes(h.startMinute),
            closes: formatMinutes(h.endMinute),
          })),
        closed_days: weekdayNames
          .slice(1)
          .filter((_, i) => !clinic.hours.some((h) => h.weekday === i + 1 && !h.isClosed)),
      };
    }

    if (topic === 'location') {
      return {
        ...base,
        address: clinic.addressLine,
        city: clinic.city,
        country: clinic.country,
        phone: clinic.phone,
      };
    }

    if (topic === 'policies') {
      return {
        ...base,
        cancellation_policy: clinic.settings?.cancellationPolicy ?? null,
        rescheduling_policy: clinic.settings?.reschedulingPolicy ?? null,
        cancellation_cutoff_hours: clinic.settings?.cancellationCutoffHours ?? null,
        minimum_notice_minutes: clinic.settings?.minAdvanceBookingMinutes ?? null,
        maximum_days_ahead: clinic.settings?.maxAdvanceBookingDays ?? null,
      };
    }

    if (topic === 'faq') {
      return { ...base, faqs: clinic.faqs };
    }

    return {
      ...base,
      description: clinic.description,
      address: clinic.addressLine,
      city: clinic.city,
      country: clinic.country,
      phone: clinic.phone,
      email: clinic.email,
      website: clinic.website,
      faqs: clinic.faqs.slice(0, 10),
    };
  },
};

// --- Tool: services --------------------------------------------------------

const servicesSchema = z.object({
  search: z.string().max(120).optional().describe('Optional name filter.'),
});

const getServices: ToolDefinition<typeof servicesSchema> = {
  name: 'get_services',
  description:
    'List the services this clinic offers, with duration and price. Never invent a service, duration or price — only report what this returns.',
  parameters: {
    type: 'OBJECT',
    properties: { search: { type: 'STRING', description: 'Optional name filter.' } },
  },
  schema: servicesSchema,
  async execute(args, ctx) {
    const services = await prisma.service.findMany({
      where: {
        clinicId: ctx.clinicId,
        isActive: true,
        ...(args.search ? { name: { contains: args.search, mode: 'insensitive' } } : {}),
      },
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        priceMinor: true,
        currency: true,
        doctors: { select: { doctor: { select: { id: true, name: true, isActive: true } } } },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return {
      ok: true,
      services: services.map((s) => ({
        service_id: s.id,
        name: s.name,
        description: s.description,
        duration_minutes: s.durationMinutes,
        // Money is stored in minor units; present it only when configured.
        price:
          s.priceMinor === null
            ? null
            : `${s.currency ?? ''} ${(s.priceMinor / 100).toFixed(2)}`.trim(),
        doctors: s.doctors.filter((d) => d.doctor.isActive).map((d) => d.doctor.name),
      })),
    };
  },
};

// --- Tool: doctors ---------------------------------------------------------

const doctorsSchema = z.object({
  service_id: z.string().max(64).optional().describe('Only doctors offering this service.'),
});

const getDoctors: ToolDefinition<typeof doctorsSchema> = {
  name: 'get_doctors',
  description:
    'List the clinic’s doctors and their specialties. Never invent a doctor or a specialty.',
  parameters: {
    type: 'OBJECT',
    properties: {
      service_id: { type: 'STRING', description: 'Only doctors offering this service.' },
    },
  },
  schema: doctorsSchema,
  async execute(args, ctx) {
    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId: ctx.clinicId,
        isActive: true,
        ...(args.service_id ? { services: { some: { serviceId: args.service_id } } } : {}),
      },
      select: {
        id: true,
        name: true,
        specialty: true,
        description: true,
        services: {
          select: {
            service: {
              select: {
                id: true,
                name: true,
                durationMinutes: true,
                priceMinor: true,
                currency: true,
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
      take: 50,
    });

    return {
      ok: true,
      doctors: doctors.map((d) => ({
        doctor_id: d.id,
        name: d.name,
        specialty: d.specialty,
        about: d.description,
        appointment_types: d.services
          .filter((s) => s.service.isActive)
          .map((s) => ({
            service_id: s.service.id,
            name: s.service.name,
            duration_minutes: s.service.durationMinutes,
            price:
              s.service.priceMinor !== null
                ? `${s.service.currency ?? 'SAR'} ${(s.service.priceMinor / 100).toFixed(2)}`.trim()
                : null,
          })),
        services: d.services.filter((s) => s.service.isActive).map((s) => s.service.name),
      })),
    };
  },
};

// --- Tool: availability ----------------------------------------------------

const slotsSchema = z.object({
  service_id: z.string().min(1).max(64).describe('Service to book.'),
  doctor_id: z.string().max(64).optional().describe('Restrict to one doctor.'),
  from_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .optional(),
  to_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .optional(),
});

const getAvailableSlotsTool: ToolDefinition<typeof slotsSchema> = {
  name: 'get_available_slots',
  description:
    'Return real bookable appointment times. This is the ONLY source of availability — never state or imply that a time is available unless it appeared in this tool’s output. Each slot comes with a slot_token that must be passed to create_appointment.',
  parameters: {
    type: 'OBJECT',
    properties: {
      service_id: { type: 'STRING', description: 'Service to book (from get_services).' },
      doctor_id: { type: 'STRING', description: 'Optional: restrict to one doctor.' },
      from_date: { type: 'STRING', description: 'Start of search range, YYYY-MM-DD (clinic local date).' },
      to_date: { type: 'STRING', description: 'End of search range, YYYY-MM-DD. Defaults to 7 days after from_date.' },
    },
    required: ['service_id'],
  },
  schema: slotsSchema,
  async execute(args, ctx) {
    const scope = scopeOf(ctx);
    const config = await loadSchedulingConfig(scope, ctx.clinicId);
    const todayKey = toDateKey(ctx.now, ctx.timezone);
    const fromDate = args.from_date && args.from_date >= todayKey ? args.from_date : todayKey;
    const toDate = args.to_date ?? addDaysToDateKey(fromDate, 7, ctx.timezone);

    const slots = await getAvailableSlots(scope, {
      clinicId: ctx.clinicId,
      serviceId: args.service_id,
      doctorId: args.doctor_id,
      fromDateKey: fromDate,
      toDateKey: toDate,
      limit: config.settings.maxSlotsOfferedToAI,
      now: ctx.now,
    });

    if (slots.length === 0) {
      return {
        ok: true,
        slots: [],
        // Steer the model away from inventing a fallback time.
        note: 'No availability in this range. Offer to check a different date or doctor; do not suggest any specific time that is not listed here.',
      };
    }

    const buttons = slots.slice(0, 3).map((s) => ({
      id: `select_slot:${s.slotToken}`,
      title: formatTime(s.start, s.timezone, ctx.locale),
    }));

    return {
      ok: true,
      searched_from: fromDate,
      searched_to: toDate,
      slots: slots.map((s) => describeSlot(s, ctx.locale)),
      buttons,
    };
  },
};

// --- Tool: create appointment ---------------------------------------------

const createSchema = z.object({
  slot_token: z
    .string()
    .min(1)
    .describe('Exact slot_token from get_available_slots. Do not construct one yourself.'),
  patient_name: z.string().min(1).max(120).describe('Patient’s full name.'),
  gender: z.string().max(30).optional().describe('Patient’s gender (Male/Female).'),
  email: z.string().email().max(200).optional().describe('Patient’s email address.'),
  phone: z.string().max(30).optional().describe('Patient’s phone number.'),
  notes: z.string().max(500).optional(),
});

const createAppointmentTool: ToolDefinition<typeof createSchema> = {
  name: 'create_appointment',
  description:
    'Book an appointment for a slot returned by get_available_slots. Takes slot_token, full patient name, gender, and optional contact info. The booking is only real if this returns ok=true. If ok=false, offer the alternatives provided.',
  parameters: {
    type: 'OBJECT',
    properties: {
      slot_token: { type: 'STRING', description: 'Exact slot_token from get_available_slots.' },
      patient_name: { type: 'STRING', description: 'Patient’s full name.' },
      gender: { type: 'STRING', description: 'Patient’s gender (Male/Female).' },
      email: { type: 'STRING', description: 'Patient’s email address (optional).' },
      phone: { type: 'STRING', description: 'Patient’s phone number.' },
      notes: { type: 'STRING', description: 'Optional reason for visit.' },
    },
    required: ['slot_token', 'patient_name'],
  },
  schema: createSchema,
  async execute(args, ctx) {
    const scope = scopeOf(ctx);
    const { doctorId, serviceId, start } = decodeSlotToken(args.slot_token);

    // Save/update patient contact info (name, gender, email, phone)
    const trimmedName = args.patient_name.trim();
    const trimmedGender = args.gender?.trim();
    const trimmedEmail = args.email?.trim();
    const trimmedPhone = args.phone?.trim();

    if (trimmedName || trimmedGender || trimmedEmail || trimmedPhone) {
      await prisma.patient.update({
        where: { id: ctx.patientId },
        data: {
          ...(trimmedName ? { name: trimmedName } : {}),
          ...(trimmedGender ? { gender: trimmedGender } : {}),
          ...(trimmedEmail ? { email: trimmedEmail } : {}),
          ...(trimmedPhone ? { phone: trimmedPhone, whatsappNumber: trimmedPhone } : {}),
        },
      });
    }

    const result = await createAppointment(scope, {
      clinicId: ctx.clinicId,
      doctorId,
      serviceId,
      patientId: ctx.patientId,
      startsAt: start,
      notes: args.notes ?? null,
      source: 'AI_WHATSAPP',
      status: 'CONFIRMED',
      // Same inbound message + same slot ⇒ same key ⇒ at most one appointment.
      idempotencyKey: `wa:${ctx.idempotencySeed}:${doctorId}:${start.toISOString()}`,
      now: ctx.now,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.message,
        reason: result.reason,
        alternatives: result.alternatives.map((s) => describeSlot(s, ctx.locale)),
      };
    }

    return {
      ok: true,
      appointment_id: result.appointment.id,
      file_number: result.appointment.fileNumber
        ? `FR-${String(result.appointment.fileNumber).padStart(3, '0')}`
        : null,
      appointment_number: result.appointment.appointmentNumber
        ? `AP-${String(result.appointment.appointmentNumber).padStart(3, '0')}`
        : null,
      portal_account: result.appointment.patientCredentials
        ? {
            username:
              result.appointment.patientCredentials.username ||
              result.appointment.patientCredentials.email,
            email: result.appointment.patientCredentials.email,
            temporary_password: result.appointment.patientCredentials.temporaryPassword,
            is_new_account: result.appointment.patientCredentials.isNewAccount,
          }
        : null,
      confirmed_for: formatInstant(result.appointment.startsAt, result.appointment.timezone, {
        locale: ctx.locale,
      }),
      doctor: result.appointment.doctorName,
      service: result.appointment.serviceName,
      patient_name: result.appointment.patientName,
      patient_phone: result.appointment.patientPhone,
      already_existed: result.deduplicated,
      buttons: [
        { id: 'reschedule_appointment', title: 'Reschedule' },
        { id: 'cancel_appointment', title: 'Cancel Appointment' },
      ],
    };
  },
};

// --- Tool: read own appointments ------------------------------------------

const myAppointmentsSchema = z.object({});

const getMyAppointments: ToolDefinition<typeof myAppointmentsSchema> = {
  name: 'get_my_appointments',
  description:
    'List this patient’s upcoming appointments. Use before cancelling or rescheduling so you act on the right one.',
  parameters: { type: 'OBJECT', properties: {} },
  schema: myAppointmentsSchema,
  async execute(_args, ctx) {
    const appointments = await listUpcomingAppointments(scopeOf(ctx), {
      clinicId: ctx.clinicId,
      patientId: ctx.patientId,
      now: ctx.now,
      limit: 10,
    });

    return {
      ok: true,
      appointments: appointments.map((a) => ({
        appointment_id: a.id,
        when: formatInstant(a.startsAt, a.timezone, { locale: ctx.locale }),
        doctor: a.doctorName,
        service: a.serviceName,
        status: a.status,
      })),
      buttons:
        appointments.length > 0
          ? [
              { id: 'reschedule_appointment', title: 'Reschedule' },
              { id: 'cancel_appointment', title: 'Cancel' },
            ]
          : [{ id: 'book_new', title: 'Book Appointment' }],
    };
  },
};

// --- Tool: cancel ----------------------------------------------------------

const cancelSchema = z.object({
  appointment_id: z.string().min(1).max(64),
  reason: z.string().max(300).optional(),
});

const cancelAppointmentTool: ToolDefinition<typeof cancelSchema> = {
  name: 'cancel_appointment',
  description:
    'Cancel one of this patient’s appointments. Confirm with the patient which appointment they mean before calling this.',
  parameters: {
    type: 'OBJECT',
    properties: {
      appointment_id: { type: 'STRING', description: 'From get_my_appointments.' },
      reason: { type: 'STRING', description: 'Optional reason the patient gave.' },
    },
    required: ['appointment_id'],
  },
  schema: cancelSchema,
  async execute(args, ctx) {
    // Ownership check: the model must not be able to cancel a stranger's
    // appointment by guessing an id, even within the same clinic.
    const owned = await prisma.appointment.findFirst({
      where: {
        id: args.appointment_id,
        clinicId: ctx.clinicId,
        patientId: ctx.patientId,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
      select: { id: true },
    });
    if (!owned) {
      return { ok: false, error: 'No matching upcoming appointment was found for this patient.' };
    }

    const appointment = await cancelAppointment(scopeOf(ctx), {
      appointmentId: owned.id,
      reason: args.reason ?? 'Cancelled by patient over WhatsApp',
      enforcePolicy: true,
      now: ctx.now,
    });

    return {
      ok: true,
      cancelled: formatInstant(appointment.startsAt, appointment.timezone, { locale: ctx.locale }),
      buttons: [{ id: 'book_new', title: 'Book New Appointment' }],
    };
  },
};

// --- Tool: reschedule ------------------------------------------------------

const rescheduleSchema = z.object({
  appointment_id: z.string().min(1).max(64),
  slot_token: z.string().min(1).describe('New slot, from get_available_slots.'),
});

const rescheduleAppointmentTool: ToolDefinition<typeof rescheduleSchema> = {
  name: 'reschedule_appointment',
  description:
    'Move an existing appointment to a new slot obtained from get_available_slots. Only treat the move as done if this returns ok=true.',
  parameters: {
    type: 'OBJECT',
    properties: {
      appointment_id: { type: 'STRING', description: 'From get_my_appointments.' },
      slot_token: { type: 'STRING', description: 'New slot_token from get_available_slots.' },
    },
    required: ['appointment_id', 'slot_token'],
  },
  schema: rescheduleSchema,
  async execute(args, ctx) {
    const owned = await prisma.appointment.findFirst({
      where: {
        id: args.appointment_id,
        clinicId: ctx.clinicId,
        patientId: ctx.patientId,
        status: { in: [...ACTIVE_APPOINTMENT_STATUSES] },
      },
      select: { id: true },
    });
    if (!owned) {
      return { ok: false, error: 'No matching upcoming appointment was found for this patient.' };
    }

    const { doctorId, start } = decodeSlotToken(args.slot_token);
    const result = await rescheduleAppointment(scopeOf(ctx), {
      appointmentId: owned.id,
      newStartsAt: start,
      newDoctorId: doctorId,
      enforcePolicy: true,
      idempotencyKey: `wa:${ctx.idempotencySeed}:resched:${owned.id}:${start.toISOString()}`,
      now: ctx.now,
    });

    if (!result.ok) {
      return {
        ok: false,
        error: result.message,
        reason: result.reason,
        alternatives: result.alternatives.map((s) => describeSlot(s, ctx.locale)),
      };
    }

    return {
      ok: true,
      appointment_id: result.appointment.id,
      moved_to: formatInstant(result.appointment.startsAt, result.appointment.timezone, {
        locale: ctx.locale,
      }),
      doctor: result.appointment.doctorName,
      buttons: [
        { id: 'reschedule_appointment', title: 'Reschedule Again' },
        { id: 'cancel_appointment', title: 'Cancel Appointment' },
      ],
    };
  },
};

// --- Tool: lead capture ----------------------------------------------------

const updateLeadSchema = z.object({
  patient_name: z.string().max(120).optional(),
  gender: z.string().max(30).optional(),
  email: z.string().email().max(200).optional(),
  phone: z.string().max(30).optional(),
  interest: z.string().max(300).optional().describe('What the patient is asking about.'),
  qualified: z
    .boolean()
    .optional()
    .describe('True once the patient has expressed clear intent to book.'),
});

const updateLead: ToolDefinition<typeof updateLeadSchema> = {
  name: 'update_lead',
  description:
    'Record details the patient volunteered (name, gender, email, phone, what they need). Call this as soon as you learn the patient’s contact details.',
  parameters: {
    type: 'OBJECT',
    properties: {
      patient_name: { type: 'STRING', description: 'Patient’s name.' },
      gender: { type: 'STRING', description: 'Patient’s gender (Male/Female).' },
      email: { type: 'STRING', description: 'Email address.' },
      phone: { type: 'STRING', description: 'Phone number.' },
      interest: { type: 'STRING', description: 'What they are asking about.' },
      qualified: { type: 'BOOLEAN', description: 'True when they clearly intend to book.' },
    },
  },
  schema: updateLeadSchema,
  async execute(args, ctx) {
    const now = ctx.now;

    if (args.patient_name || args.gender || args.email || args.phone) {
      await prisma.patient.update({
        where: { id: ctx.patientId },
        data: {
          ...(args.patient_name ? { name: args.patient_name.trim() } : {}),
          ...(args.gender ? { gender: args.gender.trim() } : {}),
          ...(args.email ? { email: args.email.trim() } : {}),
          ...(args.phone ? { phone: args.phone.trim(), whatsappNumber: args.phone.trim() } : {}),
        },
      });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: ctx.leadId },
      select: { status: true },
    });

    // Only ever advance the funnel; never demote a BOOKED lead back to CONTACTED.
    const shouldQualify = args.qualified && lead?.status !== 'BOOKED';
    await prisma.lead.update({
      where: { id: ctx.leadId },
      data: {
        lastContactAt: now,
        ...(shouldQualify
          ? { status: 'QUALIFIED', qualifiedAt: now }
          : lead?.status === 'NEW'
            ? { status: 'CONTACTED' }
            : {}),
        ...(args.interest ? { notes: args.interest.slice(0, 300) } : {}),
      },
    });

    return { ok: true, recorded: true };
  },
};

// --- Tool: escalate --------------------------------------------------------

const escalateSchema = z.object({
  reason: z.string().min(1).max(300).describe('Why a human is needed.'),
});

const escalateToHuman: ToolDefinition<typeof escalateSchema> = {
  name: 'escalate_to_human',
  description:
    'Hand the conversation to clinic staff. Use for medical advice requests, emergencies, complaints, billing disputes, or anything you cannot resolve with the other tools. After calling this, tell the patient a team member will follow up — do not keep trying to solve it yourself.',
  parameters: {
    type: 'OBJECT',
    properties: { reason: { type: 'STRING', description: 'Why a human is needed.' } },
    required: ['reason'],
  },
  schema: escalateSchema,
  async execute(args, ctx) {
    await escalateConversation(ctx.clinicId, ctx.conversationId, args.reason);
    return { ok: true, escalated: true };
  },
};

// --- Registry --------------------------------------------------------------

const ALL_TOOLS: ErasedTool[] = [
  defineTool(getClinicInformation),
  defineTool(getServices),
  defineTool(getDoctors),
  defineTool(getAvailableSlotsTool),
  defineTool(createAppointmentTool),
  defineTool(getMyAppointments),
  defineTool(cancelAppointmentTool),
  defineTool(rescheduleAppointmentTool),
  defineTool(updateLead),
  defineTool(escalateToHuman),
];

export const toolDeclarations: FunctionDeclaration[] = ALL_TOOLS.map((t) => ({
  name: t.name,
  description: t.description,
  parameters: t.parameters,
}));

export const toolNames = ALL_TOOLS.map((t) => t.name);

/**
 * Execute a model-requested tool call.
 *
 * Always resolves — a thrown error would abort the whole turn and leave the
 * patient with silence. Errors become `{ ok: false, error }`, which the model
 * can read and respond to.
 */
export async function executeTool(
  name: string,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext,
): Promise<ToolResult> {
  const tool = ALL_TOOLS.find((t) => t.name === name);
  if (!tool) {
    logger.warn(Events.AI_TOOL_ERROR, 'Model requested an unknown tool', {
      clinicId: ctx.clinicId,
      tool: name,
    });
    return { ok: false, error: `Unknown tool: ${name}` };
  }

  const parsed = tool.schema.safeParse(rawArgs ?? {});
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    logger.warn(Events.AI_TOOL_ERROR, 'Tool arguments failed validation', {
      clinicId: ctx.clinicId,
      tool: name,
      problems,
    });
    return { ok: false, error: `Invalid arguments — ${problems}` };
  }

  const startedAt = Date.now();
  logger.info(Events.TOOL_STARTED, 'Tool execution started', {
    clinicId: ctx.clinicId,
    conversationId: ctx.conversationId,
    tool: name,
  });

  try {
    const result = await tool.execute(parsed.data, ctx);
    const duration = Date.now() - startedAt;
    logger.info(Events.TOOL_COMPLETED, 'Tool execution completed', {
      clinicId: ctx.clinicId,
      conversationId: ctx.conversationId,
      tool: name,
      ms: duration,
      ok: result.ok !== false,
    });
    return result;
  } catch (error) {
    // AppError messages are already written for humans and carry no internals.
    const message =
      error instanceof AppError ? error.message : 'That could not be completed right now.';
    logger.error(Events.AI_TOOL_ERROR, 'Tool execution failed', {
      clinicId: ctx.clinicId,
      tool: name,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false, error: message };
  }
}
