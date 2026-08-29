'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { requireSuperAdmin } from '@/lib/auth/guards';
import {
  saveDoctor,
  deleteDoctor,
  addDoctorTimeOff,
  deleteDoctorTimeOff,
} from '@/lib/directory/directory.service';
import { doctorSchema, doctorTimeOffSchema } from '@/lib/validation/schemas';
import { AppError } from '@/lib/errors';

export interface FormState {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
}

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

export async function saveDoctorAction(
  clinicId: string,
  doctorId: string | undefined,
  _prev: FormState,
  formData: FormData | Record<string, unknown>,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();

    let rawData: Record<string, unknown>;
    if (formData instanceof FormData) {
      const jsonStr = formData.get('payload');
      if (typeof jsonStr === 'string') {
        rawData = JSON.parse(jsonStr);
      } else {
        rawData = Object.fromEntries(formData.entries());
      }
    } else {
      rawData = formData;
    }

    const input = doctorSchema.parse(rawData);
    await saveDoctor(scope, clinicId, input, doctorId);

    revalidatePath('/admin/doctors');
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: doctorId ? 'Doctor schedule updated.' : 'Doctor created.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteDoctorAction(clinicId: string, doctorId: string): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    await deleteDoctor(scope, clinicId, doctorId);

    revalidatePath('/admin/doctors');
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Doctor deleted.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function addDoctorTimeOffAction(
  clinicId: string,
  doctorId: string,
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();
    const reason = form.get('reason') ? String(form.get('reason')) : undefined;
    const startDate = String(form.get('startDate') ?? '');
    const endDate = String(form.get('endDate') ?? '');
    const startMinuteRaw = form.get('startMinute');
    const endMinuteRaw = form.get('endMinute');

    const startMinute = startMinuteRaw ? Number(startMinuteRaw) : undefined;
    const endMinute = endMinuteRaw ? Number(endMinuteRaw) : undefined;

    const input = doctorTimeOffSchema.parse({
      reason,
      startDate,
      endDate,
      startMinute: Number.isNaN(startMinute) ? undefined : startMinute,
      endMinute: Number.isNaN(endMinute) ? undefined : endMinute,
    });

    await addDoctorTimeOff(scope, clinicId, doctorId, input);

    revalidatePath('/admin/doctors');
    revalidatePath(`/admin/clinics/${clinicId}`);
    return { status: 'success', message: 'Time off / date override added.' };
  } catch (error) {
    return toFormState(error);
  }
}

export async function deleteDoctorTimeOffAction(clinicId: string, timeOffId: string): Promise<void> {
  const { scope } = await requireSuperAdmin();
  await deleteDoctorTimeOff(scope, clinicId, timeOffId);

  revalidatePath('/admin/doctors');
  revalidatePath(`/admin/clinics/${clinicId}`);
}
