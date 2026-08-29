import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { AppWindow, MessageSquare, Calendar, Webhook, Bot, CheckCircle2, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Installed Apps' };
export const dynamic = 'force-dynamic';

export default async function InstalledAppsPage() {
  const { clinicId } = await requireClientUser();

  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { clinicId: clinicId! },
    select: { isActive: true, phoneNumberId: true, displayPhoneNumber: true },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <AppWindow className="size-6 text-blue-600" />
            Installed Apps & Integrations
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect and configure messaging channels, calendar synchronizations, and external clinic webhooks.
          </p>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Cloud API */}
        <div className="surface rounded-2xl border-2 border-emerald-500/30 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <MessageSquare className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Meta WhatsApp Cloud API</h3>
                <span className="text-xs text-slate-500">Official Cloud Channel</span>
              </div>
            </div>
            <Badge tone={integration?.isActive ? 'success' : 'warning'} className="px-2.5 py-0.5 text-xs font-semibold">
              {integration?.isActive ? 'Connected' : 'Configured'}
            </Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Enables instant WhatsApp 2-way messaging, button menus, automated booking slot selection, and appointment confirmations.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 flex items-center justify-between">
            <span>Phone ID: {integration?.phoneNumberId || 'Configured'}</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
        </div>

        {/* OpenRouter AI Agent */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">OpenRouter AI Brain</h3>
                <span className="text-xs text-slate-500">Gemma-4-26B + Failover Engine</span>
              </div>
            </div>
            <Badge tone="success" className="px-2.5 py-0.5 text-xs font-semibold">Active</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Executes natural language understanding, clinic service recommendations, FAQ responses, and language detection.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-500 flex items-center justify-between">
            <span>Schema: Lowercase JSON Schema</span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
        </div>

        {/* PostgreSQL Availability Scheduler */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Calendar className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Zero-Conflict Calendar Engine</h3>
                <span className="text-xs text-slate-500">Real-Time Doctor Timetables</span>
              </div>
            </div>
            <Badge tone="success" className="px-2.5 py-0.5 text-xs font-semibold">Active</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Calculates minute-by-minute doctor shifts, prayer breaks, holiday closures, buffer times, and transaction locking.
          </p>
        </div>

        {/* Webhooks Dispatcher */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-xs">
                <Webhook className="size-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Inbound Webhook Receiver</h3>
                <span className="text-xs text-slate-500">Sub-50ms Fast Router</span>
              </div>
            </div>
            <Badge tone="success" className="px-2.5 py-0.5 text-xs font-semibold">Active</Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400">
            Processes Meta webhooks, button callbacks, and idempotency deduplication tokens.
          </p>
        </div>
      </div>
    </div>
  );
}
