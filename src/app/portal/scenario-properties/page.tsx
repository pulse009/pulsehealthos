import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Sliders, ShieldCheck, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Scenario Properties' };
export const dynamic = 'force-dynamic';

export default async function ScenarioPropertiesPage() {
  const { clinicId } = await requireClientUser();

  const settings = await prisma.clinicSettings.findUnique({
    where: { clinicId: clinicId! },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Sliders className="size-6 text-blue-600" />
            Scenario Properties & Booking Rules
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure appointment buffer times, minimum advance notice, cancellation cutoff windows, and slot granularity.
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Booking Window Rules */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="size-5 text-blue-600" />
            Booking Window Controls
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Min Advance Booking</span>
                <span className="text-slate-500">Notice required before patient can book a slot</span>
              </div>
              <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                {settings?.minAdvanceBookingMinutes ?? 60} mins
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Max Advance Horizon</span>
                <span className="text-slate-500">Furthest date in future patients can schedule</span>
              </div>
              <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                {settings?.maxAdvanceBookingDays ?? 60} days
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Slot Granularity</span>
                <span className="text-slate-500">Step interval for offered start times</span>
              </div>
              <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                {settings?.slotGranularityMinutes ?? 15} mins
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation & Policy Rules */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="size-5 text-blue-600" />
            Cancellation &amp; Policy Guards
          </h2>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Cancellation Cutoff</span>
                <span className="text-slate-500">Cutoff hours before appointment start</span>
              </div>
              <span className="font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-lg">
                {settings?.cancellationCutoffHours ?? 4} hours
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Patient Self-Cancellation</span>
                <span className="text-slate-500">Allow WhatsApp button cancellation</span>
              </div>
              <Badge tone={settings?.allowPatientCancellation !== false ? 'success' : 'warning'}>
                {settings?.allowPatientCancellation !== false ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Patient Self-Reschedule</span>
                <span className="text-slate-500">Allow WhatsApp button rescheduling</span>
              </div>
              <Badge tone={settings?.allowPatientReschedule !== false ? 'success' : 'warning'}>
                {settings?.allowPatientReschedule !== false ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
