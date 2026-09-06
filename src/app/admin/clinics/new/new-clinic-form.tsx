'use client';

import { useState } from 'react';
import { Checkbox, Field, Input, Select, Textarea } from '@/components/ui/primitives';
import { ActionForm } from '@/components/forms/action-form';
import { createClinicAction, type FormState } from '@/app/admin/clinics/actions';

const TIMEZONES = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Istanbul',
  'Africa/Cairo',
  'Africa/Lagos',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
];

/** "Smile Dental Care" → "smile-dental-care" */
const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const err = (state: FormState, field: string) => state.fieldErrors?.[field];

export function NewClinicForm() {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <ActionForm action={createClinicAction} submitLabel="Create clinic">
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">

          {/* ── Clinic Details ────────────────────────────────────────────── */}
          <Field label="Clinic name" htmlFor="name" error={err(state, 'name')}>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Smile Dental Care"
            />
          </Field>

          <Field
            label="Slug"
            htmlFor="slug"
            hint="Lowercase letters, digits and hyphens."
            error={err(state, 'slug')}
          >
            <Input
              id="slug"
              name="slug"
              required
              value={slug}
              onChange={(e) => {
                setSlugTouched(true);
                setSlug(e.target.value);
              }}
            />
          </Field>

          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" name="description" />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" />
          </Field>
          <Field label="WhatsApp number" htmlFor="whatsappNumber">
            <Input id="whatsappNumber" name="whatsappNumber" />
          </Field>

          <Field label="Email" htmlFor="email" error={err(state, 'email')}>
            <Input id="email" name="email" type="email" />
          </Field>
          <Field label="Website" htmlFor="website" error={err(state, 'website')}>
            <Input id="website" name="website" placeholder="https://" />
          </Field>

          <Field label="Address" htmlFor="addressLine" className="sm:col-span-2">
            <Input id="addressLine" name="addressLine" />
          </Field>

          <Field label="City" htmlFor="city">
            <Input id="city" name="city" />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input id="country" name="country" />
          </Field>

          <Field
            label="Timezone"
            htmlFor="timezone"
            hint="Cannot be inferred — every booking and reminder depends on this."
            error={err(state, 'timezone')}
          >
            <Select id="timezone" name="timezone" defaultValue="Asia/Riyadh">
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end pb-1">
            <Checkbox name="isActive" label="Activate immediately" defaultChecked />
          </div>

          {/* ── Platform Edition & Modules Access ─────────────────────────── */}
          <div className="sm:col-span-2 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Platform Edition &amp; Modules Access
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Select which portal modules and edition are enabled for this clinic tenant.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="pulseHealthOS"
                  value="true"
                  defaultChecked
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 size-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Pulse Health OS</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Full Suite
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Complete platform access including Appointments, Doctors, Services, Patients, Roles, Inventory, and Accounts &amp; Finance.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="pulseNow"
                  value="true"
                  className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500 size-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Pulse Now</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[6px] bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      Express Edition
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Lightweight clinic edition. Automatically hides <strong>Inventory</strong> and <strong>Accounts &amp; Finance</strong> modules from this clinic's portal.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* ── Portal Account ────────────────────────────────────────────── */}
          <div className="sm:col-span-2 pt-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                Portal Account
              </span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Optional — provide login credentials to the clinic owner so they can access their
              portal at <span className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">/login</span>.
            </p>
          </div>

          <Field label="Owner name" htmlFor="ownerName" error={err(state, 'ownerName')}>
            <Input id="ownerName" name="ownerName" placeholder="Dr. Sarah Ahmed" />
          </Field>

          <Field
            label="Login email"
            htmlFor="ownerEmail"
            error={err(state, 'ownerEmail')}
            hint="Must be unique across all users."
          >
            <Input
              id="ownerEmail"
              name="ownerEmail"
              type="email"
              placeholder="owner@clinic.com"
            />
          </Field>

          <Field
            label="Password"
            htmlFor="ownerPassword"
            error={err(state, 'ownerPassword')}
            hint="Min 12 chars · uppercase · lowercase · digit."
          >
            <div className="relative">
              <Input
                id="ownerPassword"
                name="ownerPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <Field
            label="Confirm password"
            htmlFor="ownerPasswordConfirm"
            error={err(state, 'ownerPasswordConfirm')}
          >
            <div className="relative">
              <Input
                id="ownerPasswordConfirm"
                name="ownerPasswordConfirm"
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••••••"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs select-none"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
        </div>
      )}
    </ActionForm>
  );
}
