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
