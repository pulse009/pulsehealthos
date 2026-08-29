import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Bell, MessageSquare, Clock, CheckCircle2, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Notification Options' };
export const dynamic = 'force-dynamic';

export default async function NotificationOptionsPage() {
  const { clinicId } = await requireClientUser();

  const rules = await prisma.reminderRule.findMany({
    where: { clinicId: clinicId! },
    orderBy: { offsetMinutes: 'desc' },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bell className="size-6 text-blue-600" />
            Notification Options & Reminders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure automated WhatsApp reminder intervals, confirmation alerts, and staff notifications.
          </p>
        </div>
      </div>

      {/* Rules list */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <MessageSquare className="size-5 text-blue-600" />
          Automated WhatsApp Reminders
        </h2>

        <div className="space-y-3">
          {rules.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              Default automated reminders are active (24 hours and 2 hours before appointment start).
            </div>
          ) : (
            rules.map((r) => (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-blue-600" />
                  <div>
                    <span className="font-bold text-sm text-slate-900 dark:text-white block">
                      {Math.floor(r.offsetMinutes / 60)} Hours Before Appointment
                    </span>
                    <span className="text-xs text-slate-500">
                      Dispatches WhatsApp interactive confirmation message to patient
                    </span>
                  </div>
                </div>
                <Badge tone={r.isActive ? 'success' : 'warning'}>
                  {r.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Additional Alerts */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="size-5 text-blue-600" />
          Staff Alerts & Escalations
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">Human Handoff Alerts</span>
            <p className="text-slate-500">Instantly flags conversation as escalated in the inbox when patient asks for staff.</p>
            <Badge tone="success">Enabled</Badge>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <span className="font-bold text-slate-900 dark:text-white block">Booking Confirmation Alerts</span>
            <p className="text-slate-500">Real-time update on doctor schedule timetable whenever a new slot is confirmed.</p>
            <Badge tone="success">Enabled</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
