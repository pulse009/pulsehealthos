import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Braces, Copy, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Clinic Variables' };
export const dynamic = 'force-dynamic';

export default async function VariablesPage() {
  const { clinicId } = await requireClientUser();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId! },
    select: { name: true, phone: true, city: true, country: true, timezone: true },
  });

  const variables = [
    { key: '{{clinic_name}}', value: clinic?.name || 'Reveal Clinic', description: 'Name of your clinic inserted into greetings and confirmations.' },
    { key: '{{clinic_phone}}', value: clinic?.phone || '+966115048687', description: 'Primary contact phone number provided to patients.' },
    { key: '{{clinic_city}}', value: clinic?.city || 'Riyadh', description: 'Clinic location city.' },
    { key: '{{clinic_timezone}}', value: clinic?.timezone || 'Asia/Riyadh', description: 'IANA Timezone used to convert UTC instants to local time.' },
    { key: '{{currency}}', value: 'SAR', description: 'Currency symbol used in pricing summaries.' },
    { key: '{{conversation_lang}}', value: 'auto (ar | en)', description: 'Detected conversation language (persisted across button clicks).' },
    { key: '{{default_slot_duration}}', value: '30 mins', description: 'Default duration when service does not specify.' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Braces className="size-6 text-blue-600" />
            Clinic Variables & Template Tags
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            System variables and dynamic placeholders used across WhatsApp messages, AI prompts, and booking flows.
          </p>
        </div>
      </div>

      {/* Variables Table */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {variables.map((v) => (
            <div key={v.key} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md">
                    {v.key}
                  </code>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{v.description}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                  {v.value}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
