'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { ZodError } from 'zod';
import { AppError } from '@/lib/errors';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { hashPassword, checkPasswordPolicy } from '@/lib/auth/password';
import {
  addHoliday,
  createClinic,
  createClinicUser,
  deleteClinic,
  deleteFaq,
  deleteHoliday,
  deleteReminderRule,
  resetClinicUserPassword,
  setClinicActive,
  updateAiConfiguration,
  updateClinicBasics,
  updateClinicSettings,
  updateWhatsAppIntegration,
  upsertFaq,
  upsertReminderRule,
  replaceClinicHours,
} from '@/lib/clinics/clinic.service';
import {
  aiConfigSchema,
  clinicBasicsSchema,
  clinicSettingsSchema,
  faqSchema,
  holidaySchema,
  reminderRuleSchema,
  whatsappConfigSchema,
} from '@/lib/validation/schemas';

/**
 * Server actions for clinic configuration.
 *
 * Every action re-derives its scope with `requireSuperAdmin()`. Server actions
 * are routable POST endpoints, so treating the caller as trusted because the
 * form was only rendered on an admin page would be an authorization hole.
 *
 * Actions return a `FormState` instead of throwing, so validation problems land
 * next to the field rather than as an error page.
 */

export interface FormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

// NOTE: a "use server" module may only export async functions. Anything else
// (constants, objects) fails the build, so the idle state lives in the form
// component instead. `FormState` is a type and is erased at compile time, so
// exporting it here is fine.

/** Normalise anything thrown by validation or the service layer into FormState. */
function toFormState(error: unknown): FormState {
  if (error instanceof ZodError) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of error.issues) {
      const key = issue.path.join('.') || '_';
      fieldErrors[key] ??= issue.message;
    }
    return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors };
  }
  if (error instanceof AppError) {
    return { status: 'error', message: error.message };
  }
  return { status: 'error', message: 'Something went wrong. Please try again.' };
}

const bool = (form: FormData, key: string): boolean => form.get(key) === 'on' || form.get(key) === 'true';
const str = (form: FormData, key: string): string => String(form.get(key) ?? '');
const optional = (form: FormData, key: string): string | undefined => {
  const value = form.get(key);
  return value === null || value === '' ? undefined : String(value);
};

// --- Clinic lifecycle ------------------------------------------------------

export async function createClinicAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  let clinicId: string;
  try {
    const { scope } = await requireSuperAdmin();
    const input = clinicBasicsSchema.parse({
      name: str(form, 'name'),
      slug: str(form, 'slug'),
      description: optional(form, 'description'),
      phone: optional(form, 'phone'),
      whatsappNumber: optional(form, 'whatsappNumber'),
      email: str(form, 'email'),
      website: str(form, 'website'),
      addressLine: optional(form, 'addressLine'),
      city: optional(form, 'city'),
      country: optional(form, 'country'),
      timezone: str(form, 'timezone'),
      isActive: bool(form, 'isActive'),
    });

    // --- Portal account (optional) ---
    const ownerName = str(form, 'ownerName').trim();
    const ownerEmail = str(form, 'ownerEmail').trim();
    const ownerPassword = str(form, 'ownerPassword');
    const ownerPasswordConfirm = str(form, 'ownerPasswordConfirm');

    let owner: { name: string; email: string; passwordHash: string } | undefined;

    if (ownerEmail) {
      // Validate presence of companion fields
      if (!ownerName) {
        return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors: { ownerName: 'Owner name is required when creating a portal account.' } };
      }
      if (!ownerPassword) {
        return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors: { ownerPassword: 'Password is required when creating a portal account.' } };
      }
      if (ownerPassword !== ownerPasswordConfirm) {
        return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors: { ownerPasswordConfirm: 'Passwords do not match.' } };
      }
      const policy = checkPasswordPolicy(ownerPassword);
      if (!policy.ok) {
        return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors: { ownerPassword: policy.problems[0] ?? 'Password does not meet requirements.' } };

      }
      const passwordHash = await hashPassword(ownerPassword);
      owner = { name: ownerName, email: ownerEmail, passwordHash };
    }

    const clinic = await createClinic(scope, input, owner);
    clinicId = clinic.id;
  } catch (error) {
    return toFormState(error);
  }

  // `redirect` throws by design — it must be outside the try/catch or it would
  // be swallowed and reported as a failure.
  revalidatePath('/admin/clinics');
  redirect(`/admin/clinics/${clinicId}`);
}

export async function updateBasicsAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = clinicBasicsSchema.parse({
      name: str(form, 'name'),
      slug: str(form, 'slug'),
      description: optional(form, 'description'),
      phone: optional(form, 'phone'),
      whatsappNumber: optional(form, 'whatsappNumber'),
      email: str(form, 'email'),
      website: str(form, 'website'),
      addressLine: optional(form, 'addressLine'),
      city: optional(form, 'city'),
      country: optional(form, 'country'),
      timezone: str(form, 'timezone'),
      isActive: bool(form, 'isActive'),
    });
    await updateClinicBasics(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Clinic profile saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function updateSettingsAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = clinicSettingsSchema.parse({
      defaultAppointmentMinutes: str(form, 'defaultAppointmentMinutes'),
      defaultBufferMinutes: str(form, 'defaultBufferMinutes'),
      slotGranularityMinutes: str(form, 'slotGranularityMinutes'),
      minAdvanceBookingMinutes: str(form, 'minAdvanceBookingMinutes'),
      maxAdvanceBookingDays: str(form, 'maxAdvanceBookingDays'),
      cancellationCutoffHours: str(form, 'cancellationCutoffHours'),
      allowPatientCancellation: bool(form, 'allowPatientCancellation'),
      allowPatientReschedule: bool(form, 'allowPatientReschedule'),
      cancellationPolicy: optional(form, 'cancellationPolicy'),
      reschedulingPolicy: optional(form, 'reschedulingPolicy'),
      maxSlotsOfferedToAI: str(form, 'maxSlotsOfferedToAI'),
    });
    await updateClinicSettings(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Booking rules saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

/**
 * Opening hours arrive as one row per weekday. A day with `open` unchecked is
 * simply omitted, which is how "closed on Sunday" is represented — the
 * availability engine treats an absent window as shut.
 */
export async function updateHoursAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const hours: Array<{ weekday: number; startMinute: number; endMinute: number; isClosed: boolean }> = [];

    for (let weekday = 1; weekday <= 7; weekday += 1) {
      if (form.get(`open-${weekday}`) !== 'on') continue;
      const start = parseTimeInput(str(form, `start-${weekday}`));
      const end = parseTimeInput(str(form, `end-${weekday}`));
      if (start === null || end === null) continue;
      if (end <= start) {
        return {
          status: 'error',
          message: 'Closing time must be after opening time.',
          fieldErrors: { [`end-${weekday}`]: 'Must be after the opening time.' },
        };
      }
      hours.push({ weekday, startMinute: start, endMinute: end, isClosed: false });
    }

    await replaceClinicHours(scope, clinicId, { hours });
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Opening hours saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

function parseTimeInput(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 24 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export async function updateAiAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = aiConfigSchema.parse({
      assistantName: str(form, 'assistantName'),
      greeting: optional(form, 'greeting'),
      tone: str(form, 'tone'),
      personality: optional(form, 'personality'),
      primaryLanguage: str(form, 'primaryLanguage'),
      supportedLanguages: splitList(str(form, 'supportedLanguages')),
      customInstructions: optional(form, 'customInstructions'),
      escalationRules: optional(form, 'escalationRules'),
      escalationKeywords: splitList(str(form, 'escalationKeywords')),
      model: str(form, 'model'),
      temperature: str(form, 'temperature'),
      maxOutputTokens: str(form, 'maxOutputTokens'),
      historyWindow: str(form, 'historyWindow'),
      isEnabled: bool(form, 'isEnabled'),
    });
    await updateAiConfiguration(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Assistant configuration saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

export async function updateWhatsAppAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = whatsappConfigSchema.parse({
      phoneNumberId: str(form, 'phoneNumberId'),
      wabaId: optional(form, 'wabaId'),
      displayPhoneNumber: optional(form, 'displayPhoneNumber'),
      // Blank means "leave the stored credential alone".
      accessToken: optional(form, 'accessToken'),
      appSecret: optional(form, 'appSecret'),
      verifyToken: optional(form, 'verifyToken'),
      isActive: bool(form, 'isActive'),
    });
    await updateWhatsAppIntegration(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'WhatsApp integration saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function upsertReminderRuleAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = reminderRuleSchema.parse({
      offsetMinutes: str(form, 'offsetMinutes'),
      template: optional(form, 'template'),
      isActive: bool(form, 'isActive'),
    });
    await upsertReminderRule(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Reminder rule saved and existing bookings resynced.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteReminderRuleAction(clinicId: string, ruleId: string): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await deleteReminderRule(scope, clinicId, ruleId);
  revalidatePath(`/admin/clinics/${clinicId}`);
}

export async function addHolidayAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = holidaySchema.parse({
      name: str(form, 'name'),
      date: str(form, 'date'),
      isRecurringAnnually: bool(form, 'isRecurringAnnually'),
    });
    await addHoliday(scope, clinicId, input);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Holiday added.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteHolidayAction(clinicId: string, holidayId: string): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await deleteHoliday(scope, clinicId, holidayId);
  revalidatePath(`/admin/clinics/${clinicId}`);
}

export async function upsertFaqAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const input = faqSchema.parse({
      question: str(form, 'question'),
      answer: str(form, 'answer'),
      category: optional(form, 'category'),
      sortOrder: str(form, 'sortOrder') || '0',
      isActive: bool(form, 'isActive'),
    });
    await upsertFaq(scope, clinicId, input, optional(form, 'faqId'));
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'FAQ saved.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteFaqAction(clinicId: string, faqId: string): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await deleteFaq(scope, clinicId, faqId);
  revalidatePath(`/admin/clinics/${clinicId}`);
}

export async function toggleClinicActiveAction(
  clinicId: string,
  isActive: boolean,
): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await setClinicActive(scope, clinicId, isActive);
  revalidatePath('/admin/clinics');
  revalidatePath(`/admin/clinics/${clinicId}`);
}

export async function deleteClinicAction(clinicId: string): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await deleteClinic(scope, clinicId);
  revalidatePath('/admin/clinics');
}

export async function createClinicUserAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const name = str(form, 'name').trim();
    const email = str(form, 'email').trim();
    const password = str(form, 'password');
    const passwordConfirm = str(form, 'passwordConfirm');

    if (!name) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { name: 'Name is required.' } };
    }
    if (!email) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { email: 'Email is required.' } };
    }
    if (!password) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { password: 'Password is required.' } };
    }
    if (password !== passwordConfirm) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { passwordConfirm: 'Passwords do not match.' } };
    }

    const policy = checkPasswordPolicy(password);
    if (!policy.ok) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { password: policy.problems[0] ?? 'Password does not meet requirements.' } };
    }

    const passwordHash = await hashPassword(password);
    await createClinicUser(scope, clinicId, { name, email, passwordHash });
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Portal user created successfully.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function resetClinicUserPasswordAction(
  clinicId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const userId = str(form, 'userId');
    const password = str(form, 'password');
    const passwordConfirm = str(form, 'passwordConfirm');

    if (!password) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { password: 'New password is required.' } };
    }
    if (password !== passwordConfirm) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { passwordConfirm: 'Passwords do not match.' } };
    }

    const policy = checkPasswordPolicy(password);
    if (!policy.ok) {
      return { status: 'error', message: 'Please correct highlighted fields.', fieldErrors: { password: policy.problems[0] ?? 'Password does not meet requirements.' } };
    }

    const passwordHash = await hashPassword(password);
    await resetClinicUserPassword(scope, clinicId, userId, passwordHash);
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Password reset successfully.' };
  } catch (error) {
    return toFormState(error);
  }
}

