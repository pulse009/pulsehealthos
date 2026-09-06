import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger, Events } from '@/lib/logger';
import type { SupportedLocale } from '@/lib/router/i18n';

// Fast in-memory LRU / Map store for instant sub-millisecond lookups
const conversationLocaleCache = new Map<string, { locale: SupportedLocale; updatedAt: number }>();
const patientLocaleCache = new Map<string, { locale: SupportedLocale; updatedAt: number }>();

const ARABIC_UNICODE_REGEX =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const ARABIC_SWITCH_REGEX =
  /(بالعربي|عربي|العربية|اللغة\s*العربية|حول\s*للعربي|تحدث\s*بالعربي|اريد\s*عربي|أريد\s*عربي|arabic)/i;

const ENGLISH_SWITCH_REGEX =
  /(in\s*english|switch\s*to\s*english|english\s*please|speak\s*english|change\s*to\s*english|انجليزي|انكليزي|اللغة\s*الانجليزية)/i;

/** Check if text is a machine payload or button click wrapper */
export function isButtonOrPayloadMessage(text: string): boolean {
  const trimmed = text.trim();
  if (
    trimmed.startsWith('[Button Click:') ||
    trimmed.startsWith('select_language:') ||
    trimmed.startsWith('set_language:') ||
    trimmed.startsWith('select_service:') ||
    trimmed.startsWith('select_doctor:') ||
    trimmed.startsWith('select_date:') ||
    trimmed.startsWith('select_slot:') ||
    trimmed.startsWith('more_slots:') ||
    trimmed.startsWith('more_doctors:') ||
    trimmed.startsWith('confirm_booking:') ||
    trimmed === 'confirm_booking' ||
    trimmed === 'cancel_booking' ||
    trimmed === 'cancel' ||
    trimmed === 'book_appointment' ||
    trimmed === 'book_new' ||
    trimmed === 'select_service_menu' ||
    trimmed === 'get_services' ||
    trimmed === 'get_doctors' ||
    trimmed === 'get_hours' ||
    trimmed === 'cancel_appointment' ||
    trimmed === 'keep_appointment' ||
    trimmed === 'reschedule_appointment' ||
    trimmed.startsWith('visited_before:') ||
    trimmed.startsWith('confirm_cancel:')
  ) {
    return true;
  }
  return false;
}

/** Detect language purely from text content without DB or state */
export function detectTextLanguage(
  text: string,
  defaultLocale: SupportedLocale = 'en',
): SupportedLocale {
  if (!text) return defaultLocale;

  // Check explicit switch phrases
  if (ARABIC_SWITCH_REGEX.test(text)) return 'ar';
  if (ENGLISH_SWITCH_REGEX.test(text)) return 'en';

  // Check Arabic characters
  if (ARABIC_UNICODE_REGEX.test(text)) return 'ar';

  // Check Latin characters
  if (/[a-zA-Z]/.test(text)) return 'en';

  return defaultLocale;
}

export interface ResolveLocaleInput {
  clinicId: string;
  conversationId?: string;
  patientId?: string;
  message: string;
  defaultLocale?: SupportedLocale;
}

/**
 * Resolve language with persistence.
 *
 * Rules:
 * 1. Explicit language switch commands immediately change and persist the language.
 * 2. Button clicks and machine payloads preserve the existing conversation/patient language.
 * 3. Free-text with Arabic characters sets/updates the language to Arabic.
 * 4. Free-text with Latin characters (and no Arabic) sets/updates the language to English.
 * 5. Ambiguous inputs use the persisted conversation/patient state or DB tags.
 */
export async function resolveLanguage(input: ResolveLocaleInput): Promise<SupportedLocale> {
  const { clinicId, conversationId, patientId, message, defaultLocale = 'en' } = input;
  const rawText = message.trim();

  // 0. Explicit language selection button or payload
  if (
    rawText.includes('select_language:ar') ||
    rawText.includes('set_language:ar') ||
    /^(🇸🇦\s*)?(arabic|عربي|العربية)$/i.test(rawText)
  ) {
    await persistLocale(clinicId, conversationId, patientId, 'ar', true);
    return 'ar';
  }
  if (
    rawText.includes('select_language:en') ||
    rawText.includes('set_language:en') ||
    /^(🇬🇧\s*)?(english|انجليزي|انكليزي)$/i.test(rawText)
  ) {
    await persistLocale(clinicId, conversationId, patientId, 'en', true);
    return 'en';
  }

  // 1. Check explicit language switch commands in free text
  if (ARABIC_SWITCH_REGEX.test(rawText)) {
    await persistLocale(clinicId, conversationId, patientId, 'ar', true);
    return 'ar';
  }
  if (ENGLISH_SWITCH_REGEX.test(rawText)) {
    await persistLocale(clinicId, conversationId, patientId, 'en', true);
    return 'en';
  }

  // 2. Free-text language detection (Arabic vs Latin characters):
  if (!isButtonOrPayloadMessage(rawText)) {
    if (ARABIC_UNICODE_REGEX.test(rawText)) {
      setCache(conversationId, patientId, 'ar');
      return 'ar';
    }
    if (/[a-zA-Z]/.test(rawText)) {
      setCache(conversationId, patientId, 'en');
      return 'en';
    }
  }

  // 3. For button clicks / machine payloads: retrieve persisted conversation/patient locale
  const persisted = await getPersistedLocale(clinicId, conversationId, patientId);
  if (persisted) {
    return persisted;
  }

  // 4. Default
  return defaultLocale;
}

/** Retrieve persisted locale from Cache -> DB */
export async function getPersistedLocale(
  clinicId: string,
  conversationId?: string,
  patientId?: string,
): Promise<SupportedLocale | null> {
  if (conversationId && conversationLocaleCache.has(conversationId)) {
    return conversationLocaleCache.get(conversationId)!.locale;
  }

  if (patientId && patientLocaleCache.has(patientId)) {
    return patientLocaleCache.get(patientId)!.locale;
  }

  // Check DB Patient.tags
  if (patientId) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { tags: true },
      });
      if (patient?.tags) {
        if (patient.tags.includes('lang:ar')) {
          setCache(conversationId, patientId, 'ar');
          return 'ar';
        }
        if (patient.tags.includes('lang:en')) {
          setCache(conversationId, patientId, 'en');
          return 'en';
        }
      }
    } catch {
      // ignore db errors in lookup
    }
  }

  return null;
}

/** Persist locale in Memory cache and DB Patient tags */
export async function persistLocale(
  clinicId: string,
  conversationId: string | undefined,
  patientId: string | undefined,
  locale: SupportedLocale,
  isExplicitChoice: boolean = false,
): Promise<void> {
  setCache(conversationId, patientId, locale);

  if (patientId) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { tags: true },
      });
      if (patient) {
        const cleanTags = patient.tags.filter((t) => !t.startsWith('lang:'));
        cleanTags.push(`lang:${locale}`);
        if (isExplicitChoice) {
          cleanTags.push('lang:chosen');
        }
        await prisma.patient.update({
          where: { id: patientId },
          data: { tags: Array.from(new Set(cleanTags)) },
        });
      }
    } catch {
      // non-blocking
    }
  }
}

function setCache(
  conversationId: string | undefined,
  patientId: string | undefined,
  locale: SupportedLocale,
) {
  const now = Date.now();
  if (conversationId) {
    conversationLocaleCache.set(conversationId, { locale, updatedAt: now });
  }
  if (patientId) {
    patientLocaleCache.set(patientId, { locale, updatedAt: now });
  }
}

/** Clear language cache for testing */
export function clearLanguageCache(): void {
  conversationLocaleCache.clear;
  conversationLocaleCache.clear();
  patientLocaleCache.clear();
}
