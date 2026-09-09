import type { Metadata } from 'next';
import Link from 'next/link';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  Building2,
  MapPin,
  Phone,
  Clock,
  Globe,
  ShieldCheck,
  Mail,
  Lock,
  Stethoscope,
  ClipboardList,
  Sparkles,
  CheckCircle2,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Clinic Profile' };
export const dynamic = 'force-dynamic';

export default async function OrganizationPage() {
  const { clinicId } = await requireClientUser();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId! },
    include: {
      hours: { orderBy: { weekday: 'asc' } },
      doctors: { where: { isActive: true } },
      services: { where: { isActive: true } },
    },
  });

  if (!clinic) return null;

  const weekdayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const initials = (clinic.name || 'CP')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* ─── 1. TOP SUB-HEADER BAR (MATCHING EXACT REFERENCE STRUCTURE) ─── */}
      <div className="px-6 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/portal"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Back to Dashboard"
          >
            <ArrowLeft className="size-4.5" />
          </Link>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
              {clinic.name}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {clinic.isActive ? 'Active on WhatsApp' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
            <Lock className="size-3.5 text-[#0d8276]" />
            View-Only Profile
          </span>
        </div>
      </div>

      {/* ─── 2. SCROLLABLE PAGE CONTENT CONTAINER ─── */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 min-h-0 bg-white dark:bg-slate-950">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* ─── SECTION 1: CLINIC IDENTITY & STATUS ─── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="size-3.5" />
              </div>
              <span>CLINIC IDENTITY &amp; REGISTRATION OVERVIEW</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Core tenant configuration parameters and metadata for modern healthcare operations.
            </p>

            <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="size-16 rounded-2xl bg-gradient-to-tr from-[#0d6157] to-[#0d8276] text-white font-bold text-2xl flex items-center justify-center shadow-md shadow-teal-900/10 shrink-0 ring-4 ring-[#0d8276]/10">
                  {initials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                      {clinic.name}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                      ID: {clinic.slug}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                    {clinic.description || 'Premier medical clinic powered by Pulseware OS.'}
                  </p>
                </div>
              </div>

              {/* Quick Metrics Chips */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <Stethoscope className="size-4 text-[#0d8276]" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">{clinic.doctors.length}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Doctors</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700">
                  <ClipboardList className="size-4 text-[#0d8276]" />
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 dark:text-white block leading-tight">{clinic.services.length}</span>
                    <span className="text-[10px] text-slate-500 leading-tight">Services</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECTION 2: 2-COLUMN GRID (DETAILS & CONTACT) ─── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
            {/* 1. Clinic Parameters Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Globe className="size-3.5" />
                </div>
                <span>REGIONAL &amp; OPERATIONAL SETTINGS</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Registered Clinic Name
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm mt-0.5 block">
                    {clinic.name}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Timezone
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5 text-xs">
                      <Globe className="size-3.5 text-[#0d8276]" />
                      {clinic.timezone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Billing Currency
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block text-xs">
                      SAR (﷼)
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Platform Tenancy Scope
                  </span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 mt-1 flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="size-3.5 text-[#0d8276]" />
                    Pulse HealthOS Dedicated Tenant Instance
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Contact & Location Card */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <MapPin className="size-3.5" />
                </div>
                <span>LOCATION &amp; WHATSAPP CHANNELS</span>
              </div>

              <div className="p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                    Physical Clinic Location
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 text-xs leading-relaxed">
                    {clinic.addressLine || 'Main Clinic Road'}
                    {clinic.city ? `, ${clinic.city}` : ''}
                    {clinic.country ? `, ${clinic.country}` : ''}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Direct Telephone
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5 text-xs">
                      <Phone className="size-3.5 text-[#0d8276]" />
                      {clinic.phone || 'Not configured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      WhatsApp Booking Number
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 mt-0.5 text-xs">
                      <Mail className="size-3.5 text-[#0d8276]" />
                      {clinic.whatsappNumber || clinic.phone || 'Not configured'}
                    </span>
                  </div>
                </div>

                {clinic.email && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
                      Official Contact Email
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block mt-0.5 text-xs">
                      {clinic.email}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── SECTION 3: WEEKLY OPERATING SCHEDULE ─── */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <div className="size-5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="size-3.5" />
              </div>
              <span>WEEKLY WORKING HOURS &amp; SCHEDULE ({clinic.timezone || 'ASIA/RIYADH'})</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Weekly operating hours referenced by the WhatsApp booking agent for slot generation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-1">
              {clinic.hours.length > 0 ? (
                clinic.hours.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs flex flex-col justify-between shadow-2xs"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100 block mb-1">
                      {weekdayNames[h.weekday]}
                    </span>
                    {h.isClosed ? (
                      <span className="text-rose-500 font-bold text-[11px]">Closed</span>
                    ) : (
                      <span className="text-[#0d6157] dark:text-teal-300 font-semibold text-[11px]">
                        {Math.floor(h.startMinute / 60)}:{(h.startMinute % 60).toString().padStart(2, '0')} –{' '}
                        {Math.floor(h.endMinute / 60)}:{(h.endMinute % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-full text-xs text-slate-400 italic py-2">
                  Operating schedule standard: 14:00 – 22:00
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
