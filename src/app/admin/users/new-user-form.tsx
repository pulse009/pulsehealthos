'use client';

import { useState } from 'react';
import { Field, Input, Select } from '@/components/ui/primitives';
import { ActionForm } from '@/components/forms/action-form';
import type { FormState } from '@/app/admin/clinics/actions';
import { createUserAction } from './actions';

const err = (state: FormState, field: string) => state.fieldErrors?.[field];

export function NewUserForm({ clinics }: { clinics: Array<{ id: string; name: string }> }) {
  const [role, setRole] = useState<'SUPER_ADMIN' | 'CLIENT'>('CLIENT');

  return (
    <ActionForm action={createUserAction} submitLabel="Create account">
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" error={err(state, 'name')}>
            <Input id="name" name="name" required />
          </Field>

          <Field label="Email address" htmlFor="email" error={err(state, 'email')}>
            <Input id="email" name="email" type="email" required autoComplete="off" />
          </Field>

          <Field
            label="Temporary password"
            htmlFor="password"
            hint="At least 12 characters, with upper case, lower case and a digit."
            error={err(state, 'password')}
          >
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={12}
            />
          </Field>

          <Field label="Role" htmlFor="role">
            <Select
              id="role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'SUPER_ADMIN' | 'CLIENT')}
            >
              <option value="CLIENT">Client — read-only portal for one clinic</option>
              <option value="SUPER_ADMIN">Super admin — full platform access</option>
            </Select>
          </Field>

          {/* Only rendered for CLIENT: a super admin is not tenant-bound. */}
          {role === 'CLIENT' ? (
            <Field
              label="Clinic"
              htmlFor="clinicId"
              hint="This account will never be able to see any other clinic."
              error={err(state, 'clinicId')}
              className="sm:col-span-2"
            >
              <Select id="clinicId" name="clinicId" required defaultValue="">
                <option value="" disabled>
                  Select a clinic…
                </option>
                {clinics.map((clinic) => (
                  <option key={clinic.id} value={clinic.id}>
                    {clinic.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Super admins can configure every clinic, read every conversation, and rotate
              integration credentials. Create these sparingly.
            </div>
          )}
        </div>
      )}
    </ActionForm>
  );
}
