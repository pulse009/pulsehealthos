'use server';

import { revalidatePath } from 'next/cache';
import { ZodError } from 'zod';
import { prisma } from '@/lib/db/prisma';
import { AppError, conflict } from '@/lib/errors';
import { recordAudit } from '@/lib/audit';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { checkPasswordPolicy, hashPassword } from '@/lib/auth/password';
import { createUserSchema } from '@/lib/validation/schemas';
import type { FormState } from '@/app/admin/clinics/actions';

/** Account provisioning. SUPER_ADMIN only — enforced per call, not per page. */
export async function createUserAction(_prev: FormState, form: FormData): Promise<FormState> {
  try {
    const { scope } = await requireSuperAdmin();

    const role = String(form.get('role') ?? 'CLIENT');
    const input = createUserSchema.parse({
      email: String(form.get('email') ?? ''),
      name: String(form.get('name') ?? ''),
      password: String(form.get('password') ?? ''),
      role,
      // A super admin is platform-wide, so any clinic selection is discarded
      // rather than silently binding them to a tenant.
      clinicId: role === 'SUPER_ADMIN' ? null : String(form.get('clinicId') ?? '') || null,
    });

    const policy = checkPasswordPolicy(input.password);
    if (!policy.ok) {
      return {
        status: 'error',
        message: 'Password does not meet the policy.',
        fieldErrors: { password: policy.problems.join(' ') },
      };
    }

    const existing = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) throw conflict('An account with that email already exists.');

    if (input.clinicId) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: input.clinicId },
        select: { id: true },
      });
      if (!clinic) {
        return {
          status: 'error',
          message: 'That clinic no longer exists.',
          fieldErrors: { clinicId: 'Select a valid clinic.' },
        };
      }
    }

    const user = await prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        clinicId: input.clinicId ?? null,
      },
      select: { id: true, email: true, role: true, clinicId: true },
    });

    await recordAudit(scope, {
      action: 'user.create',
      entityType: 'User',
      entityId: user.id,
      clinicId: user.clinicId,
      // The password is never in scope here; `recordAudit` would redact it anyway.
      metadata: { email: user.email, role: user.role },
    });

    revalidatePath('/admin/users');
    return { status: 'success', message: `Account created for ${user.email}.` };
  } catch (error) {
    if (error instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of error.issues) {
        const key = issue.path.join('.') || '_';
        fieldErrors[key] ??= issue.message;
      }
      return { status: 'error', message: 'Please correct the highlighted fields.', fieldErrors };
    }
    if (error instanceof AppError) return { status: 'error', message: error.message };
    return { status: 'error', message: 'Could not create the account.' };
  }
}

/**
 * Enable/disable an account. Bumping `sessionVersion` on disable invalidates
 * every issued token immediately rather than waiting for expiry.
 */
export async function setUserActiveAction(userId: string, isActive: boolean): Promise<void> {
  const { scope, user: actor } = await requireSuperAdmin();
  if (userId === actor.id) {
    throw new AppError('BAD_REQUEST', 'You cannot disable your own account.');
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { isActive, ...(isActive ? { failedLogins: 0, lockedUntil: null } : { sessionVersion: { increment: 1 } }) },
    select: { id: true, clinicId: true, email: true },
  });

  await recordAudit(scope, {
    action: isActive ? 'user.enable' : 'user.disable',
    entityType: 'User',
    entityId: user.id,
    clinicId: user.clinicId,
    metadata: { email: user.email },
  });
  revalidatePath('/admin/users');
}
