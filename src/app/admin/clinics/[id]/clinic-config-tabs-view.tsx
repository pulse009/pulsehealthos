'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ClipboardList,
  MessageCircle,
  Bot,
  UserCheck,
  Calendar,
  Clock,
  Sparkles,
  BellRing,
  HelpCircle,
  Trash2,
  ArrowLeft,
  Key,
} from 'lucide-react';
import { Badge, Card, CardBody, CardHeader, EmptyState, Table, Td, Th } from '@/components/ui/primitives';
import { ConfirmButton } from '@/components/forms/action-form';
import { formatMinutes } from '@/lib/time/timezone';
import {
  AiForm,
  BasicsForm,
  FaqForm,
  HolidayForm,
  HoursForm,
  ReminderRuleForm,
  SettingsForm,
  WhatsAppForm,
} from './clinic-forms';
import { deleteClinicAction, deleteFaqAction, deleteHolidayAction, deleteReminderRuleAction } from '../actions';
import { ClinicDoctorsTab } from './clinic-doctors-tab';
import { ClinicUsersTab } from './clinic-users-tab';

const TABS = [
  { key: 'profile', label: 'Profile', icon: UserCheck },
  { key: 'users', label: 'Portal Users', icon: Key },
  { key: 'booking', label: 'Booking rules', icon: Calendar },
  { key: 'doctors', label: 'Doctors & Schedules', icon: Stethoscope },
  { key: 'hours', label: 'Hours & closures', icon: Clock },
  { key: 'ai', label: 'AI assistant', icon: Sparkles },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'reminders', label: 'Reminders', icon: BellRing },
  { key: 'knowledge', label: 'Knowledge', icon: HelpCircle },
] as const;

function humaniseOffset(minutes: number): string {
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `${days} day${days === 1 ? '' : 's'} before`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hour${hours === 1 ? '' : 's'} before`;
  }
  return `${minutes} minutes before`;
}

export function ClinicConfigTabsView({
  clinic,
  timezones,
  webhookUrl,
  initialTab,
}: {
  clinic: any;
  timezones: string[];
  webhookUrl: string;
  initialTab: string;
}) {
  const [activeTab, setActiveTab] = useState<string>(
    TABS.some((t) => t.key === initialTab) ? initialTab : 'profile'
  );

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // Instant 0ms silent URL update without blocking server roundtrip
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', `/admin/clinics/${clinic.id}?tab=${key}`);
    }
  };

  return (
    <div className="w-full flex flex-col min-h-full bg-white dark:bg-slate-900">
      {/* 1. FLUSH HEADER BAR (Attached directly to sidebar border) */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {clinic.name}
            </h1>
            <Badge tone={clinic.isActive ? 'success' : 'neutral'} className="font-bold text-xs px-2.5 py-0.5">
              {clinic.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {clinic.slug} · Timezone: <span className="font-semibold text-slate-700 dark:text-slate-300">{clinic.timezone}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ConfirmButton
            confirmMessage={`Are you sure you want to delete clinic "${clinic.name}"? This action cannot be undone.`}
            onConfirm={deleteClinicAction.bind(null, clinic.id)}
          >
            <span className="inline-flex items-center gap-1.5 text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer">
              <Trash2 className="size-4" /> Delete clinic
            </span>
          </ConfirmButton>
          <Link
            href="/admin/clinics"
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all"
          >
            <ArrowLeft className="size-3.5" /> Back to clinics
          </Link>
        </div>
      </div>

      {/* 2. FLUSH STATUS KPI BAR WITH VERTICAL DIVIDER LINES (|) */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 divide-x divide-slate-200 dark:divide-slate-800 shrink-0">
        {/* Doctors KPI Column */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center shrink-0">
              <Stethoscope className="size-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Doctors</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{clinic._count.doctors} Specialists</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clinic._count.doctors > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {clinic._count.doctors > 0 ? 'Configured' : 'Needs setup'}
          </span>
        </div>

        {/* Services KPI Column */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
              <ClipboardList className="size-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Services</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{clinic._count.services} Catalogue items</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clinic._count.services > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {clinic._count.services > 0 ? 'Configured' : 'Needs setup'}
          </span>
        </div>

        {/* WhatsApp KPI Column */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center shrink-0">
              <MessageCircle className="size-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">WhatsApp</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Cloud API</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clinic.whatsapp?.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {clinic.whatsapp?.isActive ? 'Active' : 'Needs setup'}
          </span>
        </div>

        {/* AI Assistant KPI Column */}
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-sky-50 dark:bg-sky-950 text-sky-600 flex items-center justify-center shrink-0">
              <Bot className="size-4.5" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">Assistant</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Gemini 2.5 Flash</span>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${clinic.aiConfiguration?.isEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
            {clinic.aiConfiguration?.isEnabled ? 'Configured' : 'Disabled'}
          </span>
        </div>
      </div>

      {/* 3. FLUSH TAB NAVIGATION BAR WITH BORDER INDICATOR */}
      <nav className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex gap-1 overflow-x-auto shrink-0 scrollbar-none" aria-label="Configuration sections">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = activeTab === t.key;
          return (
            <button
              type="button"
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap transition-all border-b-2 cursor-pointer ${
                active
                  ? 'border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 dark:bg-blue-950/40'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <Icon className={`size-4 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* 4. FLUSH CONTENT SECTION (NO CARD MARGINS, ROUNDED-NONE, ATTACHED DIRECTLY) */}
      <div className="w-full flex-1 bg-white dark:bg-slate-900">
        {activeTab === 'profile' ? (
          <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
            <CardHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800" title="Clinic profile" description="Contact details, address, and primary timezone." />
            <CardBody className="px-6 py-6">
              <BasicsForm clinic={clinic} timezones={timezones} />
            </CardBody>
          </Card>
        ) : null}

        {activeTab === 'users' ? (
          <div className="p-6">
            <ClinicUsersTab clinicId={clinic.id} users={clinic.users ?? []} />
          </div>
        ) : null}

        {activeTab === 'booking' ? (
          <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
            <CardHeader
              className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
              title="Booking rules"
              description="Drives the availability engine and what the assistant is allowed to offer."
            />
            <CardBody className="px-6 py-6">
              <SettingsForm
                clinicId={clinic.id}
                settings={
                  clinic.settings ?? {
                    defaultAppointmentMinutes: 30,
                    defaultBufferMinutes: 0,
                    slotGranularityMinutes: 15,
                    minAdvanceBookingMinutes: 60,
                    maxAdvanceBookingDays: 60,
                    cancellationCutoffHours: 4,
                    allowPatientCancellation: true,
                    allowPatientReschedule: true,
                    cancellationPolicy: null,
                    reschedulingPolicy: null,
                    maxSlotsOfferedToAI: 5,
                  }
                }
              />
            </CardBody>
          </Card>
        ) : null}

        {activeTab === 'doctors' ? (
          <div className="p-6">
            <ClinicDoctorsTab
              clinicId={clinic.id}
              clinicName={clinic.name}
              doctors={clinic.doctors}
              services={clinic.services}
            />
          </div>
        ) : null}

        {activeTab === 'hours' ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
              <CardHeader
                className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
                title="Opening hours"
                description="The outer boundary; a doctor can never be booked outside these."
              />
              <CardBody className="px-6 py-6">
                <HoursForm clinicId={clinic.id} hours={clinic.hours} />
              </CardBody>
            </Card>

            <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
              <CardHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800" title="Holidays & closures" description="Whole-day clinic closures." />
              <CardBody className="px-6 py-6">
                <HolidayForm clinicId={clinic.id} />
              </CardBody>
              {clinic.holidays.length > 0 ? (
                <Table>
                  <thead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Date</Th>
                      <Th>Repeats</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {clinic.holidays.map((holiday: any) => (
                      <tr key={holiday.id}>
                        <Td className="font-bold">{holiday.name}</Td>
                        <Td className="tabular-nums font-semibold">{holiday.date}</Td>
                        <Td>{holiday.isRecurringAnnually ? 'Annually' : 'One-off'}</Td>
                        <Td className="text-right">
                          <ConfirmButton
                            confirmMessage={`Remove the holiday "${holiday.name}"?`}
                            onConfirm={deleteHolidayAction.bind(null, clinic.id, holiday.id)}
                          >
                            Remove
                          </ConfirmButton>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : null}
            </Card>
          </div>
        ) : null}

        {activeTab === 'ai' ? (
          <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
            <CardHeader
              className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
              title="AI assistant configuration"
              description="Configure Gemini 2.5 Flash assistant personality, custom instructions, and escalation rules."
            />
            <CardBody className="px-6 py-6">
              <AiForm
                clinicId={clinic.id}
                config={
                  clinic.aiConfiguration ?? {
                    assistantName: 'Assistant',
                    greeting: null,
                    tone: 'professional, warm, concise',
                    personality: null,
                    primaryLanguage: 'en',
                    supportedLanguages: ['en'],
                    customInstructions: null,
                    escalationRules: null,
                    escalationKeywords: [],
                    model: 'gemini-3.6-flash',
                    temperature: 0.3,
                    maxOutputTokens: 1024,
                    historyWindow: 20,
                    isEnabled: true,
                  }
                }
              />
            </CardBody>
          </Card>
        ) : null}

        {activeTab === 'whatsapp' ? (
          <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
            <CardHeader
              className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
              title="WhatsApp integration"
              description="Credentials are encrypted at rest and never displayed after saving."
            />
            <CardBody className="px-6 py-6">
              <WhatsAppForm
                clinicId={clinic.id}
                integration={clinic.whatsapp}
                webhookUrl={webhookUrl}
              />
            </CardBody>
          </Card>
        ) : null}

        {activeTab === 'reminders' ? (
          <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
            <CardHeader
              className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
              title="Reminder rules"
              description="Saving a rule reschedules reminders for every future booking."
            />
            <CardBody className="px-6 py-6">
              <ReminderRuleForm clinicId={clinic.id} />
            </CardBody>
            {clinic.reminderRules.length === 0 ? (
              <EmptyState
                title="No reminder rules"
                description="Add a rule above — 1440 minutes for a 24-hour reminder."
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>When</Th>
                    <Th>Template</Th>
                    <Th>Status</Th>
                    <Th />
                  </tr>
                </thead>
                <tbody>
                  {clinic.reminderRules.map((rule: any) => (
                    <tr key={rule.id}>
                      <Td className="font-bold">{humaniseOffset(rule.offsetMinutes)}</Td>
                      <Td className="text-muted max-w-md truncate text-xs">
                        {rule.template ?? 'Default template'}
                      </Td>
                      <Td>
                        <Badge tone={rule.isActive ? 'success' : 'neutral'}>
                          {rule.isActive ? 'Active' : 'Paused'}
                        </Badge>
                      </Td>
                      <Td className="text-right">
                        <ConfirmButton
                          confirmMessage="Delete this reminder rule? Scheduled reminders using it will be cancelled."
                          onConfirm={deleteReminderRuleAction.bind(null, clinic.id, rule.id)}
                        >
                          Delete
                        </ConfirmButton>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Card>
        ) : null}

        {activeTab === 'knowledge' ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
              <CardHeader
                className="px-6 py-4 border-b border-slate-200 dark:border-slate-800"
                title="Frequently asked questions"
                description="The assistant answers from these instead of guessing."
              />
              <CardBody className="px-6 py-6">
                <FaqForm clinicId={clinic.id} />
              </CardBody>
              {clinic.faqs.length === 0 ? (
                <EmptyState
                  title="No FAQs yet"
                  description="Anything not captured here, the assistant will hand to a human."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th>Question</Th>
                      <Th>Answer</Th>
                      <Th>Category</Th>
                      <Th />
                    </tr>
                  </thead>
                  <tbody>
                    {clinic.faqs.map((faq: any) => (
                      <tr key={faq.id}>
                        <Td className="max-w-xs font-bold">{faq.question}</Td>
                        <Td className="text-muted max-w-md truncate text-xs">{faq.answer}</Td>
                        <Td className="text-xs font-semibold">{faq.category ?? '—'}</Td>
                        <Td className="text-right">
                          <ConfirmButton
                            confirmMessage="Delete this FAQ?"
                            onConfirm={deleteFaqAction.bind(null, clinic.id, faq.id)}
                          >
                            Delete
                          </ConfirmButton>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Card>

            <Card className="rounded-none border-0 shadow-none bg-white dark:bg-slate-900">
              <CardHeader className="px-6 py-4 border-b border-slate-200 dark:border-slate-800" title="Current opening hours" description="Read-only summary." />
              <CardBody className="px-6 py-6">
                {clinic.hours.filter((h: any) => !h.isClosed).length === 0 ? (
                  <p className="text-muted text-sm">No opening hours configured.</p>
                ) : (
                  <ul className="space-y-1.5 text-sm font-medium">
                    {clinic.hours
                      .filter((h: any) => !h.isClosed)
                      .map((h: any) => (
                        <li key={h.id} className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {
                              ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][
                                h.weekday
                              ]
                            }
                          </span>
                          <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-400">
                            {formatMinutes(h.startMinute)}–{formatMinutes(h.endMinute)}
                          </span>
                        </li>
                      ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
