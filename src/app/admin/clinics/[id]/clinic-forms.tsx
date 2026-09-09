'use client';

import { Field, Input, Select, Textarea, Checkbox, Badge } from '@/components/ui/primitives';
import { ActionForm } from '@/components/forms/action-form';
import type { FormState } from '@/app/admin/clinics/actions';
import {
  updateAiAction,
  updateBasicsAction,
  updateHoursAction,
  updateSettingsAction,
  updateWhatsAppAction,
  upsertReminderRuleAction,
  addHolidayAction,
  upsertFaqAction,
} from '@/app/admin/clinics/actions';
import { LuSparkles as Sparkles } from 'react-icons/lu';

/**
 * Configuration forms.
 *
 * Each form binds its clinic id at construction, so the id is never taken from
 * a hidden input the browser could tamper with — the server action closes over
 * the value the server itself rendered.
 */

const err = (state: FormState, field: string) => state.fieldErrors?.[field];

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

// --- Profile ---------------------------------------------------------------

export interface ClinicBasics {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  email: string | null;
  website: string | null;
  addressLine: string | null;
  city: string | null;
  country: string | null;
  timezone: string;
  isActive: boolean;
  pulseHealthOS: boolean;
  pulseNow: boolean;
}

export function BasicsForm({ clinic, timezones }: { clinic: ClinicBasics; timezones: string[] }) {
  return (
    <ActionForm action={updateBasicsAction.bind(null, clinic.id)}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Clinic name" htmlFor="name" error={err(state, 'name')}>
            <Input id="name" name="name" defaultValue={clinic.name} required />
          </Field>
          <Field
            label="Slug"
            htmlFor="slug"
            hint="Lowercase identifier used in internal URLs."
            error={err(state, 'slug')}
          >
            <Input id="slug" name="slug" defaultValue={clinic.slug} required />
          </Field>

          <Field label="Description" htmlFor="description" className="sm:col-span-2">
            <Textarea id="description" name="description" defaultValue={clinic.description ?? ''} />
          </Field>

          <Field label="Phone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={clinic.phone ?? ''} />
          </Field>
          <Field
            label="WhatsApp number"
            htmlFor="whatsappNumber"
            hint="Displayed to patients; the routing id is set on the WhatsApp tab."
          >
            <Input
              id="whatsappNumber"
              name="whatsappNumber"
              defaultValue={clinic.whatsappNumber ?? ''}
            />
          </Field>

          <Field label="Email" htmlFor="email" error={err(state, 'email')}>
            <Input id="email" name="email" type="email" defaultValue={clinic.email ?? ''} />
          </Field>
          <Field label="Website" htmlFor="website" error={err(state, 'website')}>
            <Input id="website" name="website" defaultValue={clinic.website ?? ''} />
          </Field>

          <Field label="Address" htmlFor="addressLine" className="sm:col-span-2">
            <Input id="addressLine" name="addressLine" defaultValue={clinic.addressLine ?? ''} />
          </Field>

          <Field label="City" htmlFor="city">
            <Input id="city" name="city" defaultValue={clinic.city ?? ''} />
          </Field>
          <Field label="Country" htmlFor="country">
            <Input id="country" name="country" defaultValue={clinic.country ?? ''} />
          </Field>

          <Field
            label="Timezone"
            htmlFor="timezone"
            hint="All appointment times are shown and reminded in this timezone."
            error={err(state, 'timezone')}
          >
            <Select id="timezone" name="timezone" defaultValue={clinic.timezone}>
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end pb-1">
            <Checkbox name="isActive" label="Clinic is active" defaultChecked={clinic.isActive} />
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
              Configure which portal modules and edition are enabled for this clinic tenant.
            </p>

            <div className="grid sm:grid-cols-2 gap-3">
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  name="pulseHealthOS"
                  value="true"
                  defaultChecked={clinic.pulseHealthOS ?? true}
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
                  defaultChecked={clinic.pulseNow ?? false}
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
        </div>
      )}
    </ActionForm>
  );
}

// --- Booking rules ---------------------------------------------------------

export interface ClinicSettingsValues {
  defaultAppointmentMinutes: number;
  defaultBufferMinutes: number;
  slotGranularityMinutes: number;
  minAdvanceBookingMinutes: number;
  maxAdvanceBookingDays: number;
  cancellationCutoffHours: number;
  allowPatientCancellation: boolean;
  allowPatientReschedule: boolean;
  cancellationPolicy: string | null;
  reschedulingPolicy: string | null;
  maxSlotsOfferedToAI: number;
}

export function SettingsForm({
  clinicId,
  settings,
}: {
  clinicId: string;
  settings: ClinicSettingsValues;
}) {
  return (
    <ActionForm action={updateSettingsAction.bind(null, clinicId)}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Default appointment length"
            htmlFor="defaultAppointmentMinutes"
            hint="Minutes. Used when a service has no duration."
            error={err(state, 'defaultAppointmentMinutes')}
          >
            <Input
              id="defaultAppointmentMinutes"
              name="defaultAppointmentMinutes"
              type="number"
              min={5}
              max={480}
              defaultValue={settings.defaultAppointmentMinutes}
            />
          </Field>
          <Field
            label="Buffer between appointments"
            htmlFor="defaultBufferMinutes"
            hint="Minutes of protected gap after each appointment."
          >
            <Input
              id="defaultBufferMinutes"
              name="defaultBufferMinutes"
              type="number"
              min={0}
              max={240}
              defaultValue={settings.defaultBufferMinutes}
            />
          </Field>
          <Field
            label="Slot granularity"
            htmlFor="slotGranularityMinutes"
            hint="Offered start times land on this lattice."
            error={err(state, 'slotGranularityMinutes')}
          >
            <Input
              id="slotGranularityMinutes"
              name="slotGranularityMinutes"
              type="number"
              min={5}
              max={240}
              defaultValue={settings.slotGranularityMinutes}
            />
          </Field>

          <Field
            label="Minimum notice"
            htmlFor="minAdvanceBookingMinutes"
            hint="Minutes before the earliest bookable slot."
          >
            <Input
              id="minAdvanceBookingMinutes"
              name="minAdvanceBookingMinutes"
              type="number"
              min={0}
              defaultValue={settings.minAdvanceBookingMinutes}
            />
          </Field>
          <Field label="Booking horizon" htmlFor="maxAdvanceBookingDays" hint="Days ahead.">
            <Input
              id="maxAdvanceBookingDays"
              name="maxAdvanceBookingDays"
              type="number"
              min={1}
              max={365}
              defaultValue={settings.maxAdvanceBookingDays}
            />
          </Field>
          <Field
            label="Cancellation cutoff"
            htmlFor="cancellationCutoffHours"
            hint="Hours before the appointment."
          >
            <Input
              id="cancellationCutoffHours"
              name="cancellationCutoffHours"
              type="number"
              min={0}
              defaultValue={settings.cancellationCutoffHours}
            />
          </Field>

          <Field
            label="Slots offered per message"
            htmlFor="maxSlotsOfferedToAI"
            hint="How many times the assistant offers at once."
          >
            <Input
              id="maxSlotsOfferedToAI"
              name="maxSlotsOfferedToAI"
              type="number"
              min={1}
              max={10}
              defaultValue={settings.maxSlotsOfferedToAI}
            />
          </Field>

          <div className="flex flex-col justify-end gap-2 pb-1 sm:col-span-2">
            <Checkbox
              name="allowPatientCancellation"
              label="Patients may cancel via WhatsApp"
              defaultChecked={settings.allowPatientCancellation}
            />
            <Checkbox
              name="allowPatientReschedule"
              label="Patients may reschedule via WhatsApp"
              defaultChecked={settings.allowPatientReschedule}
            />
          </div>

          <Field label="Cancellation policy" htmlFor="cancellationPolicy" className="sm:col-span-3">
            <Textarea
              id="cancellationPolicy"
              name="cancellationPolicy"
              defaultValue={settings.cancellationPolicy ?? ''}
              placeholder="Shown to patients when they ask about cancelling."
            />
          </Field>
          <Field label="Rescheduling policy" htmlFor="reschedulingPolicy" className="sm:col-span-3">
            <Textarea
              id="reschedulingPolicy"
              name="reschedulingPolicy"
              defaultValue={settings.reschedulingPolicy ?? ''}
            />
          </Field>
        </div>
      )}
    </ActionForm>
  );
}

// --- Opening hours ---------------------------------------------------------

export function HoursForm({
  clinicId,
  hours,
}: {
  clinicId: string;
  hours: Array<{ weekday: number; startMinute: number; endMinute: number; isClosed: boolean }>;
}) {
  const byDay = new Map(hours.filter((h) => !h.isClosed).map((h) => [h.weekday, h]));

  return (
    <ActionForm action={updateHoursAction.bind(null, clinicId)} submitLabel="Save opening hours">
      {(state) => (
        <div className="space-y-2">
          {WEEKDAYS.map((day) => {
            const existing = byDay.get(day.value);
            return (
              <div
                key={day.value}
                className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border px-3 py-2"
              >
                <Checkbox
                  name={`open-${day.value}`}
                  label={day.label}
                  defaultChecked={Boolean(existing)}
                />
                <Input
                  name={`start-${day.value}`}
                  type="time"
                  defaultValue={toTime(existing?.startMinute ?? 9 * 60)}
                  className="w-32"
                  aria-label={`${day.label} opening time`}
                />
                <Input
                  name={`end-${day.value}`}
                  type="time"
                  defaultValue={toTime(existing?.endMinute ?? 17 * 60)}
                  className="w-32"
                  aria-label={`${day.label} closing time`}
                />
                {err(state, `end-${day.value}`) ? (
                  <p className="col-span-3 text-xs text-red-600">{err(state, `end-${day.value}`)}</p>
                ) : null}
              </div>
            );
          })}
          <p className="text-subtle text-xs">
            Unchecked days are treated as closed. For a split day (e.g. a lunch break), configure the
            break on the doctor instead — clinic hours are the outer boundary.
          </p>
        </div>
      )}
    </ActionForm>
  );
}

// --- AI --------------------------------------------------------------------

export interface AiConfigValues {
  assistantName: string;
  greeting: string | null;
  tone: string;
  personality: string | null;
  primaryLanguage: string;
  supportedLanguages: string[];
  customInstructions: string | null;
  escalationRules: string | null;
  escalationKeywords: string[];
  model: string;
  temperature: number;
  maxOutputTokens: number;
  historyWindow: number;
  isEnabled: boolean;
}

export function AiForm({ clinicId, config }: { clinicId: string; config: AiConfigValues }) {
  return (
    <ActionForm action={updateAiAction.bind(null, clinicId)}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* ── WhatsApp & AI Chatbot Interaction Mode (Master Admin Setting) ── */}
          <div className="sm:col-span-2 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-[#0d6157] dark:text-teal-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  WhatsApp &amp; AI Chatbot Interaction Mode
                </span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/25">
                Master Admin Controlled
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure how this clinic tenant handles patient WhatsApp conversations and appointment scheduling.
            </p>

            <div className="grid gap-2.5">
              {/* Option 1: After-Hours AI */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0d8276]/40 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="interactionMode"
                  value="AFTER_HOURS"
                  defaultChecked={true}
                  className="mt-0.5 text-[#0d6157] focus:ring-[#0d8276] size-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">🌙 After Working Hours Only (Recommended)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      Hybrid Workflow
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    Human staff manages all patient discussions during clinic working hours. AI Chatbot automatically takes over outside working hours to respond to inquiries and book appointments 24/7.
                  </p>
                </div>
              </label>

              {/* Option 2: Human Only */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0d8276]/40 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="interactionMode"
                  value="HUMAN_ONLY"
                  className="mt-0.5 text-[#0d6157] focus:ring-[#0d8276] size-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">👤 Human Managed Only (No AI Chatbot)</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      Manual Staff
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    All WhatsApp discussions and appointment bookings are handled 100% directly by clinic human coordinators. AI chatbot is completely disabled.
                  </p>
                </div>
              </label>

              {/* Option 3: 24/7 AI */}
              <label className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-[#0d8276]/40 transition-colors cursor-pointer">
                <input
                  type="radio"
                  name="interactionMode"
                  value="ALWAYS_AI"
                  className="mt-0.5 text-[#0d6157] focus:ring-[#0d8276] size-4"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">🤖 24/7 Full AI Assistant</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                      Automated
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    AI assistant manages inquiries and automated bookings around the clock, with manual handover available for staff at any time.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <Field label="Assistant name" htmlFor="assistantName" error={err(state, 'assistantName')}>
            <Input id="assistantName" name="assistantName" defaultValue={config.assistantName} />
          </Field>
          <Field
            label="Tone"
            htmlFor="tone"
            hint="e.g. professional, warm, concise"
            error={err(state, 'tone')}
          >
            <Input id="tone" name="tone" defaultValue={config.tone} />
          </Field>

          <Field
            label="Greeting"
            htmlFor="greeting"
            className="sm:col-span-2"
            hint="Used for the opening message of a new conversation."
          >
            <Textarea id="greeting" name="greeting" defaultValue={config.greeting ?? ''} />
          </Field>

          <Field label="Personality" htmlFor="personality" className="sm:col-span-2">
            <Input id="personality" name="personality" defaultValue={config.personality ?? ''} />
          </Field>

          <Field label="Primary language" htmlFor="primaryLanguage" hint="ISO code, e.g. en">
            <Input
              id="primaryLanguage"
              name="primaryLanguage"
              defaultValue={config.primaryLanguage}
            />
          </Field>
          <Field
            label="Supported languages"
            htmlFor="supportedLanguages"
            hint="Comma separated, e.g. en, ur, ar"
          >
            <Input
              id="supportedLanguages"
              name="supportedLanguages"
              defaultValue={config.supportedLanguages.join(', ')}
            />
          </Field>

          <Field
            label="Clinic-specific instructions"
            htmlFor="customInstructions"
            className="sm:col-span-2"
            hint="Appended to the system prompt. Never include credentials here."
          >
            <Textarea
              id="customInstructions"
              name="customInstructions"
              defaultValue={config.customInstructions ?? ''}
              className="min-h-32"
            />
          </Field>

          <Field label="Escalation rules" htmlFor="escalationRules" className="sm:col-span-2">
            <Textarea
              id="escalationRules"
              name="escalationRules"
              defaultValue={config.escalationRules ?? ''}
              placeholder="Describe situations that must go to a human."
            />
          </Field>

          <Field
            label="Escalation keywords"
            htmlFor="escalationKeywords"
            hint="Comma separated."
            className="sm:col-span-2"
          >
            <Input
              id="escalationKeywords"
              name="escalationKeywords"
              defaultValue={config.escalationKeywords.join(', ')}
            />
          </Field>

          <Field label="Model" htmlFor="model" hint="Overrides GEMINI_MODEL for this clinic.">
            <Input id="model" name="model" defaultValue={config.model} />
          </Field>
          <Field
            label="Temperature"
            htmlFor="temperature"
            hint="Lower is more deterministic."
            error={err(state, 'temperature')}
          >
            <Input
              id="temperature"
              name="temperature"
              type="number"
              step="0.1"
              min={0}
              max={2}
              defaultValue={config.temperature}
            />
          </Field>
          <Field label="Max output tokens" htmlFor="maxOutputTokens">
            <Input
              id="maxOutputTokens"
              name="maxOutputTokens"
              type="number"
              min={64}
              max={8192}
              defaultValue={config.maxOutputTokens}
            />
          </Field>
          <Field
            label="History window"
            htmlFor="historyWindow"
            hint="Messages replayed into the model."
          >
            <Input
              id="historyWindow"
              name="historyWindow"
              type="number"
              min={2}
              max={100}
              defaultValue={config.historyWindow}
            />
          </Field>

          <div className="flex items-end pb-1 sm:col-span-2">
            <Checkbox
              name="isEnabled"
              label="Assistant is enabled for this clinic"
              defaultChecked={config.isEnabled}
            />
          </div>
        </div>
      )}
    </ActionForm>
  );
}

// --- WhatsApp --------------------------------------------------------------

export interface WhatsAppValues {
  phoneNumberId: string;
  wabaId: string | null;
  displayPhoneNumber: string | null;
  isActive: boolean;
  hasAccessToken: boolean;
  hasAppSecret: boolean;
  hasVerifyToken: boolean;
  lastError: string | null;
}

export function WhatsAppForm({
  clinicId,
  integration,
  webhookUrl,
}: {
  clinicId: string;
  integration: WhatsAppValues | null;
  webhookUrl: string;
}) {
  return (
    <ActionForm action={updateWhatsAppAction.bind(null, clinicId)}>
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-muted sm:col-span-2 rounded-lg border p-3 text-xs">
            <p className="font-medium">Webhook URL</p>
            <code className="mt-1 block break-all font-mono">{webhookUrl}</code>
            <p className="text-muted mt-2">
              Configure this in the Meta app dashboard and subscribe to the{' '}
              <code className="font-mono">messages</code> field.
            </p>
          </div>

          <Field
            label="Phone number ID"
            htmlFor="phoneNumberId"
            hint="From the Meta dashboard. Routes inbound webhooks to this clinic."
            error={err(state, 'phoneNumberId')}
          >
            <Input
              id="phoneNumberId"
              name="phoneNumberId"
              defaultValue={integration?.phoneNumberId ?? ''}
              required
            />
          </Field>
          <Field label="WABA ID" htmlFor="wabaId">
            <Input id="wabaId" name="wabaId" defaultValue={integration?.wabaId ?? ''} />
          </Field>

          <Field
            label="Display phone number"
            htmlFor="displayPhoneNumber"
            className="sm:col-span-2"
          >
            <Input
              id="displayPhoneNumber"
              name="displayPhoneNumber"
              defaultValue={integration?.displayPhoneNumber ?? ''}
            />
          </Field>

          <Field
            label="Access token"
            htmlFor="accessToken"
            hint={
              integration?.hasAccessToken
                ? 'A token is stored. Leave blank to keep it, or paste a new one to rotate.'
                : 'Not set. Paste the permanent access token.'
            }
            className="sm:col-span-2"
          >
            <Input
              id="accessToken"
              name="accessToken"
              type="password"
              autoComplete="off"
              placeholder={integration?.hasAccessToken ? '•••••••• (unchanged)' : ''}
            />
          </Field>

          <Field
            label="App secret"
            htmlFor="appSecret"
            hint={
              integration?.hasAppSecret
                ? 'Stored. Used to verify inbound webhook signatures.'
                : 'Not set. Required for webhook signature verification.'
            }
          >
            <Input id="appSecret" name="appSecret" type="password" autoComplete="off" />
          </Field>
          <Field
            label="Verify token"
            htmlFor="verifyToken"
            hint={integration?.hasVerifyToken ? 'Stored.' : 'Used during Meta’s handshake.'}
          >
            <Input id="verifyToken" name="verifyToken" type="password" autoComplete="off" />
          </Field>

          {integration?.lastError ? (
            <div className="sm:col-span-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              Last send error: {integration.lastError}
            </div>
          ) : null}

          <div className="flex items-end pb-1 sm:col-span-2">
            <Checkbox
              name="isActive"
              label="Integration is active"
              defaultChecked={integration?.isActive ?? false}
            />
          </div>
        </div>
      )}
    </ActionForm>
  );
}

// --- Reminders / holidays / FAQs -------------------------------------------

export function ReminderRuleForm({ clinicId }: { clinicId: string }) {
  return (
    <ActionForm
      action={upsertReminderRuleAction.bind(null, clinicId)}
      submitLabel="Save reminder rule"
    >
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field
            label="Send before appointment"
            htmlFor="offsetMinutes"
            hint="Minutes. 1440 = 24 hours."
            error={err(state, 'offsetMinutes')}
          >
            <Input
              id="offsetMinutes"
              name="offsetMinutes"
              type="number"
              min={5}
              defaultValue={1440}
            />
          </Field>
          <Field
            label="Message template"
            htmlFor="template"
            className="sm:col-span-2"
            hint="Placeholders: {{patient}} {{doctor}} {{service}} {{datetime}} {{clinic}}. Leave blank for the default."
          >
            <Input id="template" name="template" />
          </Field>
          <div className="flex items-end pb-1">
            <Checkbox name="isActive" label="Active" defaultChecked />
          </div>
        </div>
      )}
    </ActionForm>
  );
}

export function HolidayForm({ clinicId }: { clinicId: string }) {
  return (
    <ActionForm action={addHolidayAction.bind(null, clinicId)} submitLabel="Add holiday">
      {(state) => (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="name" error={err(state, 'name')}>
            <Input id="name" name="name" required placeholder="Eid al-Fitr" />
          </Field>
          <Field label="Date" htmlFor="date" error={err(state, 'date')}>
            <Input id="date" name="date" type="date" required />
          </Field>
          <div className="flex items-end pb-1">
            <Checkbox name="isRecurringAnnually" label="Repeats every year" />
          </div>
        </div>
      )}
    </ActionForm>
  );
}

export function FaqForm({ clinicId }: { clinicId: string }) {
  return (
    <ActionForm action={upsertFaqAction.bind(null, clinicId)} submitLabel="Add FAQ">
      {(state) => (
        <div className="grid gap-4">
          <Field label="Question" htmlFor="question" error={err(state, 'question')}>
            <Input id="question" name="question" required placeholder="Do you accept walk-ins?" />
          </Field>
          <Field label="Answer" htmlFor="answer" error={err(state, 'answer')}>
            <Textarea id="answer" name="answer" required />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Category" htmlFor="category">
              <Input id="category" name="category" placeholder="General" />
            </Field>
            <Field label="Sort order" htmlFor="sortOrder">
              <Input id="sortOrder" name="sortOrder" type="number" defaultValue={0} min={0} />
            </Field>
            <div className="flex items-end pb-1">
              <Checkbox name="isActive" label="Visible to the assistant" defaultChecked />
            </div>
          </div>
        </div>
      )}
    </ActionForm>
  );
}

export function ConfigStatus({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
      <span>{label}</span>
      <Badge tone={ready ? 'success' : 'warning'}>{ready ? 'Configured' : 'Needs setup'}</Badge>
    </div>
  );
}
