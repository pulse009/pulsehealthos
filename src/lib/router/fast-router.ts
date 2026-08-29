import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger, Events } from '@/lib/logger';
import { systemScope } from '@/lib/tenancy/scope';
import {
  decodeSlotToken,
  getAvailableSlots,
  type ResolvedSlot,
} from '@/lib/booking/availability.service';
import {
  createAppointment,
  cancelAppointment,
  listUpcomingAppointments,
} from '@/lib/booking/booking.service';
import { escalateConversation } from '@/lib/conversations/conversation.service';
import { formatInstant, formatMinutes, formatTime, toDateKey } from '@/lib/time/timezone';
import type { WhatsAppButton } from '@/lib/whatsapp/client';
import {
  i18n,
  formatDateButtonLabel,
  formatServiceButtonTitle,
  translateServiceName,
  translateDoctorName,
  translateSpecialty,
  type SupportedLocale,
} from '@/lib/router/i18n';
import {
  resolveLanguage,
  detectTextLanguage,
  isButtonOrPayloadMessage,
} from '@/lib/router/language-state';

export type { SupportedLocale };
export const detectLanguage = detectTextLanguage;

// In-memory cache for pending slot token during patient details collection
const pendingBookingSlots = new Map<string, string>();

export interface FastRouterInput {
  clinicId: string;
  conversationId: string;
  patientId: string;
  leadId: string;
  message: string;
  idempotencySeed: string;
  now?: Date;
}

export interface FastRouterResult {
  handled: boolean;
  reply?: string;
  buttons?: WhatsAppButton[];
  escalated?: boolean;
  intent?: string;
  locale: SupportedLocale;
}

/**
 * Fast deterministic router.
 * Evaluates messages in 1–5ms. Dispatches common intents directly from DB,
 * eliminating unnecessary OpenRouter LLM roundtrips and tool cycles.
 *
 * Persists and respects the conversation language throughout every single step.
 */
export async function routeMessage(input: FastRouterInput): Promise<FastRouterResult> {
  const startedAt = Date.now();
  const rawText = input.message.trim();

  // 1. Resolve language with cross-turn conversation persistence
  const locale = await resolveLanguage({
    clinicId: input.clinicId,
    conversationId: input.conversationId,
    patientId: input.patientId,
    message: rawText,
    defaultLocale: 'en',
  });

  const now = input.now ?? new Date();

  console.log(`\n⚡ [FAST ROUTER] Evaluating message: "${rawText.slice(0, 80)}" | Locale: ${locale}`);

  // 2. Check for interactive button click payloads
  const buttonMatch = rawText.match(/^\[Button Click:\s*(.+?)\s*\|\s*(?:ID|Payload):\s*(.+?)\]$/i);
  const actionPayload = buttonMatch ? buttonMatch[2]?.trim() : rawText;

  // -------------------------------------------------------------------------
  // INTERACTIVE BUTTON PAYLOAD DISPATCH (Deterministic, Sub-50ms)
  // -------------------------------------------------------------------------

  // Action: Onboarding - Have you visited before?
  if (actionPayload === 'visited_before:yes' || actionPayload === 'visited_before:no') {
    return handleVisitedBeforeResponse(input, actionPayload === 'visited_before:yes', locale, startedAt);
  }

  // Action: Step 6 - Confirm Booking
  if (actionPayload?.startsWith('confirm_booking:') || actionPayload === 'confirm_booking') {
    const slotToken = actionPayload.startsWith('confirm_booking:')
      ? actionPayload.replace('confirm_booking:', '').trim()
      : null;

    if (slotToken) {
      return handleDirectBooking(input, slotToken, locale, now, startedAt);
    }
  }

  // Action: Step 5 - Select Slot -> Check patient contact details -> Show Booking Summary
  if (actionPayload?.startsWith('select_slot:')) {
    const slotToken = actionPayload.replace('select_slot:', '').trim();
    return handleSlotSelection(input, slotToken, locale, now, startedAt);
  }

  // Action: Step 4 - Select Date or More Slots -> Fetch and Show Available Slots
  if (actionPayload?.startsWith('select_date:') || actionPayload?.startsWith('more_slots:')) {
    const isMore = actionPayload.startsWith('more_slots:');
    const parts = (isMore ? actionPayload.replace('more_slots:', '') : actionPayload.replace('select_date:', ''))
      .trim()
      .split(':');
    const serviceId = parts[0] ?? '';
    const doctorId = parts[1] ?? 'any';
    const dateKey = parts[2] ?? toDateKey(now, 'Asia/Riyadh');
    const offset = isMore ? parseInt(parts[3] ?? '0', 10) : 0;
    return handleFetchSlotsForDate(input, serviceId, doctorId, dateKey, locale, now, startedAt, offset);
  }

  // Action: Step 3 - Select Doctor -> Show Date Options
  if (actionPayload?.startsWith('select_doctor:')) {
    const parts = actionPayload.replace('select_doctor:', '').trim().split(':');
    const serviceId = parts[0] ?? '';
    const doctorId = parts[1] ?? 'any';
    return handleShowDatesForDoctor(input, serviceId, doctorId, locale, now, startedAt);
  }

  // Action: Step 2 - Select Service -> Show Doctor Selection (or advance to date)
  if (actionPayload?.startsWith('select_service:')) {
    const serviceId = actionPayload.replace('select_service:', '').trim();
    return handleShowDoctorsForService(input, serviceId, locale, now, startedAt);
  }

  // Action: Step 1 - Start Booking -> Show Services Selection
  if (
    actionPayload === 'book_appointment' ||
    actionPayload === 'book_new' ||
    actionPayload === 'select_service_menu' ||
    isBookIntent(rawText)
  ) {
    return handleShowServicesForBooking(input, locale, startedAt);
  }

  // -------------------------------------------------------------------------
  // PATIENT DETAILS (Full Name & Gender) EXTRACTION & RESUME BOOKING
  // -------------------------------------------------------------------------
  const pendingToken =
    pendingBookingSlots.get(input.conversationId) || pendingBookingSlots.get(input.patientId);

  if (pendingToken && rawText.trim().length >= 2) {
    let extractedGender: string | null = null;
    let textToParse = rawText;

    // Detect gender
    if (/\b(female|woman|girl|mrs|ms|miss)\b|أنثى|انثى|سيدة|آنسة|بنت/i.test(rawText)) {
      extractedGender = 'Female';
      textToParse = textToParse.replace(/\b(female|woman|girl|mrs|ms|miss)\b|أنثى|انثى|سيدة|آنسة|بنت/gi, ' ');
    } else if (/\b(male|man|boy|mr)\b|ذكر|رجل|ولد|سيد/i.test(rawText)) {
      extractedGender = 'Male';
      textToParse = textToParse.replace(/\b(male|man|boy|mr)\b|ذكر|رجل|ولد|سيد/gi, ' ');
    }

    // Also extract email if user happens to send one
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    let extractedEmail: string | null = null;
    if (emailMatch) {
      extractedEmail = emailMatch[0].trim().toLowerCase();
      textToParse = textToParse.replace(emailMatch[0], ' ');
    }

    const cleanedName = textToParse
      .replace(/[,:;\-\n/]/g, ' ')
      .replace(/(my name is|name is|name:|gender:|email:|اسمي|الاسم|الجنس|النوع|البريد|ايميلي|إيميلي)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    const updateData: any = {};
    if (cleanedName.length >= 2 && cleanedName.length <= 80 && !/^[\d\W]+$/.test(cleanedName)) {
      updateData.name = cleanedName;
    }
    if (extractedGender) {
      updateData.gender = extractedGender;
    }
    if (extractedEmail) {
      updateData.email = extractedEmail;
    }

    if (Object.keys(updateData).length > 0) {
      try {
        await prisma.patient.update({
          where: { id: input.patientId },
          data: updateData,
        });
      } catch {
        // ignore
      }

      pendingBookingSlots.delete(input.conversationId);
      pendingBookingSlots.delete(input.patientId);
      return handleSlotSelection(input, pendingToken, locale, now, startedAt);
    }
  }

  // -------------------------------------------------------------------------
  // FILE NUMBER LOOKUP FOR RETURNING PATIENTS
  // -------------------------------------------------------------------------
  let isAwaitingFileNumber = false;
  try {
    const currentPatient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      select: { tags: true },
    });
    isAwaitingFileNumber = (currentPatient?.tags ?? []).includes('awaiting:file_number');
  } catch {
    // ignore
  }

  const explicitFileMatch = rawText.match(/(?:file|ملف|رقم\s*الملف|#)\s*(\d+)/i);
  const plainDigitMatch =
    isAwaitingFileNumber && /^\s*#?\s*(\d+)\s*$/.test(rawText) ? rawText.match(/^\s*#?\s*(\d+)\s*$/) : null;
  const fileMatch = explicitFileMatch || plainDigitMatch;

  if (fileMatch && fileMatch[1]) {
    const fileNum = parseInt(fileMatch[1], 10);
    if (!isNaN(fileNum)) {
      return handleFileNumberLookup(input, fileNum, locale, startedAt);
    }
  }

  // Action: Cancel Booking (Before Confirmation)
  if (actionPayload === 'cancel_booking' || actionPayload === 'cancel') {
    logger.info(Events.ROUTER_COMPLETED, 'Fast router handled cancel_booking', {
      clinicId: input.clinicId,
      intent: 'CANCEL_BOOKING',
      ms: Date.now() - startedAt,
    });
    return {
      handled: true,
      locale,
      intent: 'CANCEL_BOOKING',
      reply: i18n[locale].booking_cancelled,
      buttons: [
        { id: 'book_appointment', title: i18n[locale].btn_book_appointment },
        { id: 'get_services', title: i18n[locale].btn_services },
      ],
    };
  }

  // Action: Request Appointment Cancellation (Prompt for confirmation)
  if (actionPayload === 'cancel_appointment' || isCancellationIntent(rawText)) {
    return handleCancelPrompt(input, locale, now, startedAt);
  }

  // Action: Confirm Cancellation
  if (actionPayload?.startsWith('confirm_cancel:')) {
    const appointmentId = actionPayload.replace('confirm_cancel:', '').trim();
    return handleDirectCancellation(input, appointmentId, locale, now, startedAt);
  }

  // Action: Keep Appointment
  if (actionPayload === 'keep_appointment') {
    logger.info(Events.ROUTER_COMPLETED, 'Fast router handled keep_appointment', {
      clinicId: input.clinicId,
      intent: 'KEEP_APPOINTMENT',
      ms: Date.now() - startedAt,
    });
    return {
      handled: true,
      locale,
      intent: 'KEEP_APPOINTMENT',
      reply: i18n[locale].appointment_kept,
    };
  }

  // Action: Reschedule Appointment
  if (actionPayload === 'reschedule_appointment' || isRescheduleIntent(rawText)) {
    return handleReschedulePrompt(input, locale, now, startedAt);
  }

  // -------------------------------------------------------------------------
  // DETERMINISTIC TEXT PATTERN MATCHING (Zero LLM roundtrips)
  // -------------------------------------------------------------------------

  const clean = rawText
    .replace(/[!?.,;،؟]/g, '')
    .trim()
    .toLowerCase();

  // 1. GREETING
  if (isGreeting(clean)) {
    return handleGreeting(input, locale, startedAt);
  }

  // 2. LOCATION / ADDRESS
  if (isLocationQuery(clean)) {
    return handleLocation(input, locale, startedAt);
  }

  // 3. WORKING HOURS / TIMINGS
  if (isHoursQuery(clean)) {
    return handleHours(input, locale, startedAt);
  }

  // 4. SERVICES
  if (actionPayload === 'get_services' || isServicesQuery(clean)) {
    return handleServices(input, locale, startedAt);
  }

  // 5. DOCTORS
  if (actionPayload === 'get_doctors' || isDoctorsQuery(clean)) {
    return handleDoctors(input, locale, startedAt);
  }

  // 6. MY APPOINTMENTS
  if (isMyAppointmentsQuery(clean)) {
    return handleMyAppointments(input, locale, now, startedAt);
  }

  // 7. HUMAN / STAFF ESCALATION
  if (actionPayload === 'human_escalation' || isHumanHandoffQuery(clean)) {
    return handleHumanEscalation(input, locale, startedAt);
  }

  // If not deterministically handled, delegate to AI Agent
  logger.info(Events.ROUTER_COMPLETED, 'Fast router delegating to AI Agent', {
    clinicId: input.clinicId,
    intent: 'COMPLEX_AI_QUERY',
    ms: Date.now() - startedAt,
  });

  return { handled: false, locale, intent: 'COMPLEX_AI_QUERY' };
}

// ---------------------------------------------------------------------------
// BOOKING FLOW STEP HANDLERS (Step 1 -> Step 2 -> Step 3 -> Step 4 -> Step 5 -> Step 6)
// ---------------------------------------------------------------------------

/**
 * STEP 1: Show available services for the user to select.
 * (Never jumps directly to slots).
 */
async function handleShowServicesForBooking(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let services: Array<{ id: string; name: string; durationMinutes: number; priceMinor: number | null; currency: string | null }> = [];
  try {
    services = await prisma.service.findMany({
      where: { clinicId: input.clinicId, isActive: true },
      orderBy: { name: 'asc' },
      take: 10,
      select: { id: true, name: true, durationMinutes: true, priceMinor: true, currency: true },
    });
  } catch {
    services = [];
  }

  if (services.length === 0) {
    services = [
      { id: 'srv-1', name: dict.general_consultation, durationMinutes: 30, priceMinor: 10000, currency: 'SAR' },
      { id: 'srv-2', name: dict.checkup_followup, durationMinutes: 20, priceMinor: 5000, currency: 'SAR' },
    ];
  }

  // WhatsApp allows up to 3 quick reply buttons. For more, list text + top service buttons.
  const serviceButtons: WhatsAppButton[] = services.slice(0, 3).map((s) => ({
    id: `select_service:${s.id}`,
    title: formatServiceButtonTitle(s.name, locale),
  }));

  const list = services
    .map((s, idx) => {
      const localizedName = translateServiceName(s.name, locale);
      return `${idx + 1}. *${localizedName}* (${s.durationMinutes} ${dict.minutes_label})`;
    })
    .join('\n');

  const reply = `${dict.step1_title}\n\n${dict.step1_subtitle}\n\n${list}`;

  logger.info(Events.ROUTER_COMPLETED, 'Fast router presented service selection', {
    clinicId: input.clinicId,
    intent: 'SELECT_SERVICE',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons: serviceButtons, locale, intent: 'SELECT_SERVICE' };
}

/**
 * STEP 2: Service selected -> Show relevant doctors (or advance if only 1 doctor).
 */
async function handleShowDoctorsForService(
  input: FastRouterInput,
  serviceId: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let service: { id: string; name: string } | null = null;
  let doctors: Array<{ id: string; name: string; specialty: string | null }> = [];

  try {
    service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, name: true },
    });

    // Find doctors linked specifically to this service
    const linked = await prisma.doctorService.findMany({
      where: { serviceId, doctor: { isActive: true } },
      select: { doctor: { select: { id: true, name: true, specialty: true } } },
    });

    if (linked.length > 0) {
      doctors = linked.map((l) => l.doctor);
    } else {
      // Fallback: all active clinic doctors
      doctors = await prisma.doctor.findMany({
        where: { clinicId: input.clinicId, isActive: true },
        select: { id: true, name: true, specialty: true },
      });
    }
  } catch {
    doctors = [];
  }

  const serviceName = translateServiceName(service?.name, locale);

  // If only 1 doctor exists, automatically proceed to date selection for that doctor!
  if (doctors.length === 1) {
    const singleDoc = doctors[0]!;
    return handleShowDatesForDoctor(input, serviceId, singleDoc.id, locale, now, startedAt);
  }

  // If 0 doctors found, proceed with 'any' doctor to date selection
  if (doctors.length === 0) {
    return handleShowDatesForDoctor(input, serviceId, 'any', locale, now, startedAt);
  }

  // If multiple doctors exist, present doctor choices:
  const doctorButtons: WhatsAppButton[] = doctors.slice(0, 2).map((d) => ({
    id: `select_doctor:${serviceId}:${d.id}`,
    title: translateDoctorName(d.name, locale).slice(0, 20),
  }));

  // Add "Any Doctor" option
  doctorButtons.push({
    id: `select_doctor:${serviceId}:any`,
    title: dict.any_doctor,
  });

  const reply = `${dict.step2_title}\n\n• *${dict.service_label}:* ${serviceName}\n${dict.step2_subtitle}`;

  logger.info(Events.ROUTER_COMPLETED, 'Fast router presented doctor selection', {
    clinicId: input.clinicId,
    serviceId,
    intent: 'SELECT_DOCTOR',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons: doctorButtons, locale, intent: 'SELECT_DOCTOR' };
}

/**
 * STEP 3: Doctor selected -> Show next valid booking dates.
 */
async function handleShowDatesForDoctor(
  input: FastRouterInput,
  serviceId: string,
  doctorId: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let clinicTimezone = 'Asia/Riyadh';
  let serviceName = dict.service_label;
  let doctorName = doctorId === 'any' ? dict.any_available_doctor : dict.doctor_label;

  try {
    const [clinic, service, doctor] = await Promise.all([
      prisma.clinic.findUnique({ where: { id: input.clinicId }, select: { timezone: true } }),
      prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } }),
      doctorId !== 'any' ? prisma.doctor.findUnique({ where: { id: doctorId }, select: { name: true } }) : null,
    ]);
    if (clinic?.timezone) clinicTimezone = clinic.timezone;
    if (service?.name) serviceName = translateServiceName(service.name, locale);
    if (doctor?.name) doctorName = translateDoctorName(doctor.name, locale);
  } catch {
    // fallback
  }

  // Generate the next 3 consecutive dates
  const dateButtons: WhatsAppButton[] = [];
  for (let i = 0; i < 3; i++) {
    const targetDate = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const dateKey = toDateKey(targetDate, clinicTimezone);
    const label = formatDateButtonLabel(targetDate, clinicTimezone, locale, i);

    dateButtons.push({
      id: `select_date:${serviceId}:${doctorId}:${dateKey}`,
      title: label,
    });
  }

  const reply = `${dict.step3_title}\n\n• *${dict.service_label}:* ${serviceName}\n• *${dict.doctor_label}:* ${doctorName}\n\n${dict.step3_subtitle}`;

  logger.info(Events.ROUTER_COMPLETED, 'Fast router presented date selection', {
    clinicId: input.clinicId,
    serviceId,
    doctorId,
    intent: 'SELECT_DATE',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons: dateButtons, locale, intent: 'SELECT_DATE' };
}

/**
 * STEP 4: Date selected -> Call availability engine and show interactive slot buttons.
 */
async function handleFetchSlotsForDate(
  input: FastRouterInput,
  serviceId: string,
  doctorId: string,
  dateKey: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
  offset = 0,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];
  let slots: ResolvedSlot[] = [];

  try {
    slots = await getAvailableSlots(scope, {
      clinicId: input.clinicId,
      serviceId,
      doctorId: doctorId !== 'any' ? doctorId : undefined,
      fromDateKey: dateKey,
      toDateKey: dateKey,
      limit: 10,
      now,
    });
  } catch {
    slots = [];
  }

  let serviceName = dict.service_label;
  let doctorName = doctorId === 'any' ? dict.any_available_doctor : '';
  try {
    const [srv, doc] = await Promise.all([
      prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } }),
      doctorId !== 'any' ? prisma.doctor.findUnique({ where: { id: doctorId }, select: { name: true } }) : null,
    ]);
    if (srv?.name) serviceName = translateServiceName(srv.name, locale);
    if (doc?.name) doctorName = translateDoctorName(doc.name, locale);
  } catch {
    // fallback
  }

  // If slots are available on this date:
  if (slots.length > 0) {
    // Deduplicate slots by unique start timestamp so each offered button is a distinct time
    const uniqueSlotsMap = new Map<number, ResolvedSlot>();
    for (const s of slots) {
      const key = s.start.getTime();
      if (!uniqueSlotsMap.has(key)) {
        uniqueSlotsMap.set(key, s);
      }
    }
    const uniqueSlots = Array.from(uniqueSlotsMap.values());

    const availableSlice = uniqueSlots.slice(offset);
    const visibleSlots = availableSlice.slice(0, 2);
    const hasMore = availableSlice.length > 2;

    const slotButtons: WhatsAppButton[] = visibleSlots.map((s) => ({
      id: `select_slot:${s.slotToken}`,
      title: formatTime(s.start, s.timezone, locale),
    }));

    if (hasMore) {
      slotButtons.push({
        id: `more_slots:${serviceId}:${doctorId}:${dateKey}:${offset + 2}`,
        title: dict.btn_more_times,
      });
    } else if (slotButtons.length < 3 && availableSlice.length === 3) {
      const third = availableSlice[2]!;
      slotButtons.push({
        id: `select_slot:${third.slotToken}`,
        title: formatTime(third.start, third.timezone, locale),
      });
    }

    const heading = doctorName ? `${serviceName} — ${doctorName}` : serviceName;
    const reply = `${dict.step4_title(heading, dateKey)}\n\n${dict.step4_subtitle}`;

    logger.info(Events.ROUTER_COMPLETED, 'Fast router presented available slots', {
      clinicId: input.clinicId,
      serviceId,
      dateKey,
      offset,
      slotsCount: uniqueSlots.length,
      intent: 'SELECT_SLOT',
      ms: Date.now() - startedAt,
    });

    return { handled: true, reply, buttons: slotButtons, locale, intent: 'SELECT_SLOT' };
  }

  // If NO slots are available on this specific date:
  // Fetch nearest alternative dates
  let altDatesButtons: WhatsAppButton[] = [];
  try {
    const nextSlots = await getAvailableSlots(scope, {
      clinicId: input.clinicId,
      serviceId,
      doctorId: doctorId !== 'any' ? doctorId : undefined,
      fromDateKey: dateKey,
      limit: 10,
      now,
    });
    if (nextSlots.length > 0) {
      const uniqueNextMap = new Map<number, ResolvedSlot>();
      for (const s of nextSlots) {
        const key = s.start.getTime();
        if (!uniqueNextMap.has(key)) {
          uniqueNextMap.set(key, s);
        }
      }
      altDatesButtons = Array.from(uniqueNextMap.values())
        .slice(0, 3)
        .map((s) => ({
          id: `select_slot:${s.slotToken}`,
          title: formatTime(s.start, s.timezone, locale),
        }));
    }
  } catch {
    altDatesButtons = [];
  }

  if (altDatesButtons.length > 0) {
    const reply = dict.no_slots_alternatives(dateKey);

    return {
      handled: true,
      reply,
      buttons: altDatesButtons,
      locale,
      intent: 'NO_SLOTS_OFFER_ALTERNATIVES',
    };
  }

  const reply = dict.no_slots_date(serviceName);

  const buttons: WhatsAppButton[] = [
    { id: `select_doctor:${serviceId}:${doctorId}`, title: dict.btn_change_date },
    { id: 'book_appointment', title: dict.btn_other_services },
  ];

  return { handled: true, reply, buttons, locale, intent: 'NO_SLOTS' };
}

/**
 * STEP 5: Slot selected -> Present Booking Summary with Confirm and Cancel buttons.
 * If the patient has not provided their name and email yet, prompt for them first.
 */
async function handleSlotSelection(
  input: FastRouterInput,
  slotToken: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  try {
    const { doctorId, serviceId, start } = decodeSlotToken(slotToken);
    let doctorName = dict.on_duty_doctor;
    let serviceName = dict.general_consultation;
    let patientName = dict.guest_patient;
    let patientEmail: string | null = null;
    let timezone = 'Asia/Riyadh';

    try {
      const [doctor, service, patient, clinic] = await Promise.all([
        prisma.doctor.findUnique({ where: { id: doctorId }, select: { name: true } }),
        prisma.service.findUnique({ where: { id: serviceId }, select: { name: true } }),
        prisma.patient.findUnique({ where: { id: input.patientId }, select: { name: true, phone: true, email: true, gender: true } }),
        prisma.clinic.findUnique({ where: { id: input.clinicId }, select: { timezone: true } }),
      ]);
      if (doctor?.name) doctorName = translateDoctorName(doctor.name, locale);
      if (service?.name) serviceName = translateServiceName(service.name, locale);
      if (patient?.name) patientName = patient.name;
      if (patient?.email) patientEmail = patient.email;
      if (clinic?.timezone) timezone = clinic.timezone;
    } catch {
      // fallback
    }

    // Check if patient name is missing
    const isNameMissing = !patientName || patientName === 'Patient' || patientName === 'ضيف العيادة' || patientName === 'Guest';
    if (isNameMissing) {
      pendingBookingSlots.set(input.conversationId, slotToken);
      pendingBookingSlots.set(input.patientId, slotToken);

      logger.info(Events.ROUTER_COMPLETED, 'Fast router prompting for patient name and gender', {
        clinicId: input.clinicId,
        patientId: input.patientId,
        intent: 'ASK_NAME_GENDER',
        ms: Date.now() - startedAt,
      });

      return {
        handled: true,
        reply: dict.ask_name_and_gender || dict.ask_name_and_email,
        locale,
        intent: 'ASK_NAME_GENDER',
      };
    }

    const formattedTime = formatInstant(start, timezone, { locale });

    let reply = `${dict.step5_title}\n\n• *${dict.service_label}:* ${serviceName}\n• *${dict.doctor_label}:* ${doctorName}\n• *${dict.date_label}:* ${formattedTime}\n• *${dict.patient_label}:* ${patientName}`;
    try {
      const p = await prisma.patient.findUnique({ where: { id: input.patientId }, select: { gender: true } });
      if (p?.gender) {
        reply += `\n• *${dict.gender_label || 'Gender'}:* ${p.gender}`;
      }
    } catch {
      // ignore
    }
    reply += `\n\n${dict.step5_subtitle}`;

    const buttons: WhatsAppButton[] = [
      { id: `confirm_booking:${slotToken}`, title: dict.btn_confirm_booking },
      { id: 'cancel_booking', title: dict.btn_cancel },
    ];

    logger.info(Events.ROUTER_COMPLETED, 'Fast router presented booking confirmation summary', {
      clinicId: input.clinicId,
      intent: 'CONFIRM_BOOKING_PROMPT',
      ms: Date.now() - startedAt,
    });

    return { handled: true, reply, buttons, locale, intent: 'CONFIRM_BOOKING_PROMPT' };
  } catch (error) {
    logger.warn(Events.ROUTER_COMPLETED, 'Failed to decode slot token in router', { error: String(error) });
    return {
      handled: true,
      locale,
      intent: 'SLOT_ERROR',
      reply: dict.slot_error,
    };
  }
}

/**
 * STEP 6: Confirm clicked -> Transactionally create appointment with concurrency & availability check.
 */
async function handleDirectBooking(
  input: FastRouterInput,
  slotToken: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];

  logger.info(Events.BOOKING_STARTED, 'Fast router executing direct booking', {
    clinicId: input.clinicId,
    patientId: input.patientId,
  });

  try {
    const { doctorId, serviceId, start } = decodeSlotToken(slotToken);
    const result = await createAppointment(scope, {
      clinicId: input.clinicId,
      doctorId,
      serviceId,
      patientId: input.patientId,
      startsAt: start,
      source: 'AI_WHATSAPP',
      status: 'CONFIRMED',
      idempotencyKey: `wa:btn:${input.idempotencySeed}:${doctorId}:${start.toISOString()}`,
      now,
    });

    logger.info(Events.BOOKING_COMPLETED, 'Fast router booking completed', {
      clinicId: input.clinicId,
      ok: result.ok,
      ms: Date.now() - startedAt,
    });

    if (!result.ok) {
      let altButtons: WhatsAppButton[] = [];
      if (result.alternatives && result.alternatives.length > 0) {
        altButtons = result.alternatives.slice(0, 3).map((alt) => ({
          id: `select_slot:${alt.slotToken}`,
          title: formatTime(alt.start, alt.timezone, locale),
        }));
      }

      return {
        handled: true,
        reply: dict.slot_conflict,
        buttons: altButtons.length > 0 ? altButtons : [{ id: 'book_appointment', title: dict.btn_book_appointment }],
        locale,
        intent: 'SLOT_CONFLICT',
      };
    }

    const appt = result.appointment;
    const formattedDate = formatInstant(appt.startsAt, appt.timezone, { locale });

    const reply = dict.booking_confirmed(
      translateServiceName(appt.serviceName, locale),
      translateDoctorName(appt.doctorName, locale),
      formattedDate,
      appt.appointmentNumber,
      appt.fileNumber,
      appt.patientCredentials,
    );

    const buttons: WhatsAppButton[] = [
      { id: 'reschedule_appointment', title: dict.btn_reschedule },
      { id: 'cancel_appointment', title: dict.btn_cancel_appointment },
    ];

    return { handled: true, reply, buttons, locale, intent: 'BOOKING_CONFIRMED' };
  } catch (err) {
    logger.error(Events.AI_FAILED, 'Direct booking failed in fast router', { error: String(err) });
    return {
      handled: true,
      locale,
      intent: 'BOOKING_FAILED',
      reply: dict.booking_error,
    };
  }
}

// ---------------------------------------------------------------------------
// ONBOARDING & DETERMINISTIC HANDLERS (Visited before, Greetings, Location, Hours)
// ---------------------------------------------------------------------------

async function handleVisitedBeforeResponse(
  input: FastRouterInput,
  visitedBefore: boolean,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let clinicName = locale === 'ar' ? 'العيادة' : 'the clinic';

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: input.clinicId },
      select: { name: true },
    });
    if (clinic?.name) clinicName = clinic.name;

    const patient = await prisma.patient.findUnique({
      where: { id: input.patientId },
      select: { tags: true },
    });
    const currentTags = patient?.tags ?? [];
    const newTags = Array.from(
      new Set([
        ...currentTags,
        visitedBefore ? 'awaiting:file_number' : 'visited:done',
        visitedBefore ? 'visited:yes' : 'visited:no',
      ]),
    );
    await prisma.patient.update({
      where: { id: input.patientId },
      data: { tags: newTags },
    });
  } catch {
    // ignore
  }

  if (visitedBefore) {
    logger.info(Events.ROUTER_COMPLETED, 'Fast router asking returning patient for file number', {
      clinicId: input.clinicId,
      intent: 'ASK_FILE_NUMBER',
      ms: Date.now() - startedAt,
    });
    return {
      handled: true,
      locale,
      intent: 'ASK_FILE_NUMBER',
      reply: dict.ask_file_number,
    };
  }

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled new patient', {
    clinicId: input.clinicId,
    intent: 'VISITED_NEW_PATIENT',
    ms: Date.now() - startedAt,
  });
  return {
    handled: true,
    locale,
    intent: 'VISITED_NEW_PATIENT',
    reply: dict.welcome_new_patient(clinicName),
    buttons: [
      { id: 'book_appointment', title: dict.btn_book_appointment },
      { id: 'get_services', title: dict.btn_services },
    ],
  };
}

async function handleFileNumberLookup(
  input: FastRouterInput,
  fileNumber: number,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];

  try {
    const existingPatient = await prisma.patient.findFirst({
      where: {
        clinicId: input.clinicId,
        fileNumber: fileNumber,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        fileNumber: true,
        tags: true,
      },
    });

    // Remove 'awaiting:file_number' tag from current patient
    try {
      const currentPatient = await prisma.patient.findUnique({
        where: { id: input.patientId },
        select: { tags: true },
      });
      const cleanTags = (currentPatient?.tags ?? []).filter((t) => t !== 'awaiting:file_number');
      cleanTags.push('visited:done', 'visited:yes');
      await prisma.patient.update({
        where: { id: input.patientId },
        data: { tags: Array.from(new Set(cleanTags)) },
      });
    } catch {
      // ignore
    }

    if (existingPatient) {
      // If current session was on placeholder patient, switch conversation to existing patient record
      if (input.patientId !== existingPatient.id) {
        try {
          await prisma.conversation.update({
            where: { id: input.conversationId },
            data: { patientId: existingPatient.id },
          });
          if (input.leadId) {
            await prisma.lead.updateMany({
              where: { id: input.leadId },
              data: { patientId: existingPatient.id },
            });
          }
          const exTags = Array.from(new Set([...(existingPatient.tags ?? []), 'visited:done', 'visited:yes']));
          await prisma.patient.update({
            where: { id: existingPatient.id },
            data: { tags: exTags },
          });
        } catch {
          // ignore
        }
      }

      const patientName = existingPatient.name || (locale === 'ar' ? 'عزيزي المراجع' : 'Valued Patient');
      const reply = dict.file_found_welcome(patientName, existingPatient.fileNumber ?? fileNumber);

      const buttons: WhatsAppButton[] = [
        { id: 'book_appointment', title: dict.btn_book_appointment },
        { id: 'get_services', title: dict.btn_services },
        { id: 'get_hours', title: dict.btn_hours },
      ];

      logger.info(Events.ROUTER_COMPLETED, 'Fast router matched existing patient file', {
        clinicId: input.clinicId,
        fileNumber,
        matchedPatientId: existingPatient.id,
        intent: 'FILE_NUMBER_MATCHED',
        ms: Date.now() - startedAt,
      });

      return {
        handled: true,
        reply,
        buttons,
        locale,
        intent: 'FILE_NUMBER_MATCHED',
      };
    } else {
      // File number not found in DB
      const reply = dict.file_not_found(fileNumber);
      const buttons: WhatsAppButton[] = [
        { id: 'book_new', title: dict.btn_book_as_new },
        { id: 'human_escalation', title: dict.btn_speak_to_staff },
      ];

      logger.info(Events.ROUTER_COMPLETED, 'Fast router file number not found', {
        clinicId: input.clinicId,
        fileNumber,
        intent: 'FILE_NUMBER_NOT_FOUND',
        ms: Date.now() - startedAt,
      });

      return {
        handled: true,
        reply,
        buttons,
        locale,
        intent: 'FILE_NUMBER_NOT_FOUND',
      };
    }
  } catch (error) {
    logger.error(Events.AI_FAILED, 'File number lookup failed in fast router', { error: String(error) });
    return {
      handled: true,
      locale,
      intent: 'FILE_LOOKUP_ERROR',
      reply: dict.file_not_found(fileNumber),
      buttons: [
        { id: 'book_new', title: dict.btn_book_as_new },
        { id: 'human_escalation', title: dict.btn_speak_to_staff },
      ],
    };
  }
}

async function handleGreeting(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let clinicName = locale === 'ar' ? 'العيادة' : 'the clinic';
  let isVisitedDone = false;

  try {
    const [clinic, patient] = await Promise.all([
      prisma.clinic.findUnique({
        where: { id: input.clinicId },
        select: { name: true },
      }),
      prisma.patient.findUnique({
        where: { id: input.patientId },
        select: { tags: true, appointments: { select: { id: true }, take: 1 } },
      }),
    ]);
    if (clinic?.name) clinicName = clinic.name;
    isVisitedDone = Boolean(
      (patient?.tags ?? []).includes('visited:done') ||
        (patient?.appointments && patient.appointments.length > 0),
    );
  } catch {
    // fallback
  }

  // 1. If this is a new caller who hasn't answered "Have you visited before?", prompt them:
  if (!isVisitedDone) {
    logger.info(Events.ROUTER_COMPLETED, 'Fast router prompting new patient onboarding', {
      clinicId: input.clinicId,
      intent: 'VISITED_BEFORE_PROMPT',
      ms: Date.now() - startedAt,
    });
    return {
      handled: true,
      reply: dict.visited_before_title(clinicName),
      buttons: [
        { id: 'visited_before:yes', title: dict.btn_visited_yes },
        { id: 'visited_before:no', title: dict.btn_visited_no },
      ],
      locale,
      intent: 'VISITED_BEFORE_PROMPT',
    };
  }

  const reply = dict.greeting(clinicName);

  const buttons: WhatsAppButton[] = [
    { id: 'book_appointment', title: dict.btn_book_appointment },
    { id: 'get_services', title: dict.btn_services },
    { id: 'get_hours', title: dict.btn_hours },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled greeting', {
    clinicId: input.clinicId,
    intent: 'GREETING',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'GREETING' };
}

async function handleLocation(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let locationText = locale === 'ar' ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia';
  let clinicName = locale === 'ar' ? 'العيادة' : 'Clinic';
  let phone = '';

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: input.clinicId },
      select: { name: true, addressLine: true, city: true, country: true, phone: true },
    });
    if (clinic) {
      if (clinic.name) clinicName = clinic.name;
      if (clinic.phone) phone = clinic.phone;
      const parts = [clinic.addressLine, clinic.city, clinic.country].filter(Boolean);
      if (parts.length > 0) locationText = parts.join(', ');
    }
  } catch {
    // fallback
  }

  const reply = dict.location(clinicName, locationText, phone || undefined);

  const buttons: WhatsAppButton[] = [
    { id: 'book_appointment', title: dict.btn_book_appointment },
    { id: 'get_hours', title: dict.btn_hours },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled location', {
    clinicId: input.clinicId,
    intent: 'LOCATION',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'LOCATION' };
}

async function handleHours(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let clinicName = locale === 'ar' ? 'العيادة' : 'Clinic';
  let hoursText = locale === 'ar' ? 'من السبت إلى الخميس: 9:00 ص – 9:00 م' : 'Saturday – Thursday: 9:00 AM – 9:00 PM';

  try {
    const clinic = await prisma.clinic.findUnique({
      where: { id: input.clinicId },
      select: {
        name: true,
        hours: {
          where: { isClosed: false },
          orderBy: { weekday: 'asc' },
          select: { weekday: true, startMinute: true, endMinute: true },
        },
      },
    });

    if (clinic) {
      if (clinic.name) clinicName = clinic.name;
      if (clinic.hours && clinic.hours.length > 0) {
        hoursText = clinic.hours
          .map((h) => `• ${dict.weekdays[h.weekday]}: ${formatMinutes(h.startMinute)} – ${formatMinutes(h.endMinute)}`)
          .join('\n');
      }
    }
  } catch {
    // fallback
  }

  const reply = dict.hours(clinicName, hoursText);

  const buttons: WhatsAppButton[] = [
    { id: 'book_appointment', title: dict.btn_book_appointment },
    { id: 'get_services', title: dict.btn_services },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled hours', {
    clinicId: input.clinicId,
    intent: 'WORKING_HOURS',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'WORKING_HOURS' };
}

async function handleServices(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let services: Array<{ id: string; name: string; durationMinutes: number; priceMinor: number | null; currency: string | null }> = [];
  try {
    services = await prisma.service.findMany({
      where: { clinicId: input.clinicId, isActive: true },
      orderBy: { name: 'asc' },
      take: 10,
      select: { id: true, name: true, durationMinutes: true, priceMinor: true, currency: true },
    });
  } catch {
    services = [];
  }

  if (services.length === 0) {
    return {
      handled: true,
      locale,
      intent: 'SERVICES',
      reply: dict.services_empty,
      buttons: [{ id: 'book_appointment', title: dict.btn_book_appointment }],
    };
  }

  const list = services
    .map((s, idx) => {
      const localizedName = translateServiceName(s.name, locale);
      return `${idx + 1}. *${localizedName}* (${s.durationMinutes} ${dict.minutes_label})`;
    })
    .join('\n');

  const reply = `${dict.services_title}\n\n${list}\n\n${dict.step1_subtitle}`;

  const buttons: WhatsAppButton[] = [
    { id: 'book_appointment', title: dict.btn_book_appointment },
    { id: 'get_doctors', title: dict.btn_doctors },
    { id: 'get_hours', title: dict.btn_hours },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled services', {
    clinicId: input.clinicId,
    intent: 'SERVICES',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'SERVICES' };
}

async function handleDoctors(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  let doctors: Array<{ id: string; name: string; specialty: string | null }> = [];
  try {
    doctors = await prisma.doctor.findMany({
      where: { clinicId: input.clinicId, isActive: true },
      orderBy: { name: 'asc' },
      take: 10,
      select: { id: true, name: true, specialty: true },
    });
  } catch {
    doctors = [];
  }

  if (doctors.length === 0) {
    return {
      handled: true,
      locale,
      intent: 'DOCTORS',
      reply: dict.doctors_empty,
      buttons: [{ id: 'book_appointment', title: dict.btn_book_appointment }],
    };
  }

  const list = doctors
    .map((d) => {
      const docName = translateDoctorName(d.name, locale);
      const specialty = translateSpecialty(d.specialty, locale);
      return `• *${docName}*${specialty ? ` — ${specialty}` : ''}`;
    })
    .join('\n');

  const reply = `${dict.doctors_title}\n\n${list}`;

  const buttons: WhatsAppButton[] = [
    { id: 'book_appointment', title: dict.btn_book_appointment },
    { id: 'get_services', title: dict.btn_services },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router handled doctors', {
    clinicId: input.clinicId,
    intent: 'DOCTORS',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'DOCTORS' };
}

async function handleCancelPrompt(
  input: FastRouterInput,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];
  let appointments: any[] = [];
  try {
    appointments = await listUpcomingAppointments(scope, {
      clinicId: input.clinicId,
      patientId: input.patientId,
      now,
      limit: 1,
    });
  } catch {
    appointments = [];
  }

  if (appointments.length === 0) {
    return {
      handled: true,
      locale,
      intent: 'NO_UPCOMING_APPOINTMENT',
      reply: dict.no_upcoming_to_cancel,
      buttons: [{ id: 'book_appointment', title: dict.btn_book_appointment }],
    };
  }

  const appt = appointments[0]!;
  const formattedTime = formatInstant(appt.startsAt, appt.timezone, { locale });

  const reply = dict.cancel_prompt(translateServiceName(appt.serviceName, locale), formattedTime);

  const buttons: WhatsAppButton[] = [
    { id: `confirm_cancel:${appt.id}`, title: dict.btn_confirm_cancel },
    { id: 'keep_appointment', title: dict.btn_keep_appointment },
  ];

  logger.info(Events.ROUTER_COMPLETED, 'Fast router sent cancel confirmation prompt', {
    clinicId: input.clinicId,
    intent: 'CANCEL_PROMPT',
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, buttons, locale, intent: 'CANCEL_PROMPT' };
}

async function handleDirectCancellation(
  input: FastRouterInput,
  appointmentId: string,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];
  try {
    await cancelAppointment(scope, {
      appointmentId,
      reason: 'Cancelled via WhatsApp quick action',
      enforcePolicy: true,
      now,
    });

    const reply = dict.booking_cancelled_success;

    const buttons: WhatsAppButton[] = [
      { id: 'book_appointment', title: dict.btn_book_new_appointment },
    ];

    logger.info(Events.ROUTER_COMPLETED, 'Fast router executed direct cancellation', {
      clinicId: input.clinicId,
      appointmentId,
      ms: Date.now() - startedAt,
    });

    return { handled: true, reply, buttons, locale, intent: 'CANCELLED_SUCCESS' };
  } catch (err) {
    logger.warn(Events.ROUTER_COMPLETED, 'Cancellation failed in fast router', { error: String(err) });
    return {
      handled: true,
      locale,
      intent: 'CANCEL_FAILED',
      reply: dict.cancel_failed,
    };
  }
}

async function handleReschedulePrompt(
  input: FastRouterInput,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];
  let appointments: any[] = [];
  try {
    appointments = await listUpcomingAppointments(scope, {
      clinicId: input.clinicId,
      patientId: input.patientId,
      now,
      limit: 1,
    });
  } catch {
    appointments = [];
  }

  if (appointments.length === 0) {
    return {
      handled: true,
      locale,
      intent: 'NO_UPCOMING_APPOINTMENT',
      reply: dict.no_upcoming_to_reschedule,
      buttons: [{ id: 'book_appointment', title: dict.btn_book_appointment }],
    };
  }

  const appt = appointments[0]!;
  return handleShowDatesForDoctor(input, appt.serviceId, appt.doctorId, locale, now, startedAt);
}

async function handleMyAppointments(
  input: FastRouterInput,
  locale: SupportedLocale,
  now: Date,
  startedAt: number,
): Promise<FastRouterResult> {
  const scope = systemScope(input.clinicId, 'fast-router');
  const dict = i18n[locale];
  let appointments: any[] = [];
  try {
    appointments = await listUpcomingAppointments(scope, {
      clinicId: input.clinicId,
      patientId: input.patientId,
      now,
      limit: 5,
    });
  } catch {
    appointments = [];
  }

  if (appointments.length === 0) {
    return {
      handled: true,
      locale,
      intent: 'MY_APPOINTMENTS',
      reply: dict.no_my_appointments,
      buttons: [{ id: 'book_appointment', title: dict.btn_book_appointment }],
    };
  }

  const list = appointments
    .map((a, i) => {
      const formatted = formatInstant(a.startsAt, a.timezone, { locale });
      const serviceName = translateServiceName(a.serviceName, locale);
      const doctorName = translateDoctorName(a.doctorName, locale);
      return `${i + 1}. *${serviceName}* ${locale === 'ar' ? 'مع' : 'with'} ${doctorName}\n   ⏰ ${formatted}`;
    })
    .join('\n\n');

  const reply = `${dict.my_appointments_title}\n\n${list}`;

  const buttons: WhatsAppButton[] = [
    { id: 'reschedule_appointment', title: dict.btn_reschedule },
    { id: 'cancel_appointment', title: dict.btn_cancel_appointment },
  ];

  return { handled: true, reply, buttons, locale, intent: 'MY_APPOINTMENTS' };
}

async function handleHumanEscalation(
  input: FastRouterInput,
  locale: SupportedLocale,
  startedAt: number,
): Promise<FastRouterResult> {
  const dict = i18n[locale];
  try {
    await escalateConversation(input.clinicId, input.conversationId, 'Patient requested human staff assistance');
  } catch {
    // fallback
  }

  const reply = dict.human_handoff;

  logger.info(Events.AI_ESCALATED, 'Fast router directly escalated to human', {
    clinicId: input.clinicId,
    conversationId: input.conversationId,
    ms: Date.now() - startedAt,
  });

  return { handled: true, reply, escalated: true, locale, intent: 'HUMAN_HANDOFF' };
}

// ---------------------------------------------------------------------------
// INTENT RECOGNITION PATTERNS
// ---------------------------------------------------------------------------

function isGreeting(text: string): boolean {
  return /^(hi|hello|hey|salam|hola|good\s*(morning|afternoon|evening)|مرحبا|مرحباً|السلام\s*عليكم|أهلا|اهلا|هلا|صباح\s*الخير|مساء\s*الخير|حيّاك|حياك)$/i.test(
    text.trim(),
  );
}

function isLocationQuery(text: string): boolean {
  return /(location|where\s*(is|are|to\s*find)|located|address|directions|map|موقع|عنوان|اين|أين|وين|خريطة)/i.test(
    text,
  );
}

function isHoursQuery(text: string): boolean {
  return /(opening\s*hours|working\s*hours|timings|when\s*are\s*you\s*open|when\s*do\s*you\s*close|schedule|أوقات|اوقات|ساعات|دوام|تفتحون|ساعاتكم|أوقاتكم)/i.test(
    text,
  );
}

function isServicesQuery(text: string): boolean {
  return /(services|what\s*services|treatments|service\s*list|prices|fees|الخدمات|خدماتكم|قائمة\s*الخدمات|الاسعار|الأسعار|ايش\s*تقدمون|ما\s*هي\s*الخدمات)/i.test(
    text,
  );
}

function isDoctorsQuery(text: string): boolean {
  return /(doctors|specialists|physicians|who\s*are\s*the\s*doctors|medical\s*staff|الأطباء|الدكاترة|الاطباء|من\s*هم\s*الأطباء|من\s*هم\s*الدكاترة|دكتور|طبيب)/i.test(
    text,
  );
}

function isMyAppointmentsQuery(text: string): boolean {
  return /(my\s*appointments|my\s*bookings|check\s*my\s*appointment|مواعيدي|حجوزاتي|موعدي|حجزي)/i.test(
    text,
  );
}

function isCancellationIntent(text: string): boolean {
  return /(cancel\s*appointment|cancel\s*booking|cancel\s*my\s*appointment|إلغاء\s*الموعد|الغاء\s*الموعد|الغاء\s*الحجز|إلغاء\s*الحجز|ابغى\s*الغي\s*الموعد)/i.test(
    text,
  );
}

function isRescheduleIntent(text: string): boolean {
  return /(reschedule|change\s*appointment|move\s*appointment|تعديل\s*الموعد|تغيير\s*الموعد|تأجيل\s*الموعد|تاجيل\s*الموعد|ابغى\s*اغير\s*الموعد)/i.test(
    text,
  );
}

function isBookIntent(text: string): boolean {
  return /^(book(\s*an?)?\s*appointment|book\s*now|new\s*booking|i\s*want\s*to\s*book|احجز|حجز\s*موعد|ابغى\s*احجز|اريد\s*حجز(\s*موعد)?|أريد\s*حجز(\s*موعد)?|حجز|حجز\s*جديد|حجز\s*موعد\s*جديد)$/i.test(
    text.trim(),
  );
}

function isHumanHandoffQuery(text: string): boolean {
  return /(speak\s*to\s*human|speak\s*with\s*staff|human\s*agent|customer\s*service|representative|talk\s*to\s*person|موظف|خدمة\s*العملاء|تحدث\s*مع\s*موظف|انسان|بشري|تواصل\s*مع\s*موظف)/i.test(
    text,
  );
}
