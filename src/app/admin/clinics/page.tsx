import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listClinics } from '@/lib/clinics/clinic.service';
import {
  Badge,
  EmptyState,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { ConfirmButton } from '@/components/forms/action-form';
import { deleteClinicAction } from './actions';

export const metadata: Metadata = { title: 'Clinics' };
export const dynamic = 'force-dynamic';

export default async function ClinicsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const { q } = await searchParams;
  const clinics = await listClinics(scope, q);

  return (
    <div className="w-full flex flex-col min-h-full bg-white dark:bg-slate-900">
      {/* 1. FLUSH PAGE HEADER */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Clinics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Every tenant on the platform and its configuration status.
          </p>
        </div>

        <Link
          href="/admin/clinics/new"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="size-4" />
          <span>New clinic</span>
        </Link>
      </div>

      {/* 2. FLUSH SEARCH BAR CONTAINER */}
      <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3.5 shrink-0">
        <form method="get" className="flex items-center gap-2 max-w-xl">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="size-4" />
            </div>
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Search by name, slug or city…"
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 dark:text-slate-100"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Search
          </button>
        </form>
      </div>

      {/* 3. FLUSH TABLE CONTAINER */}
      <div className="w-full flex-1 bg-white dark:bg-slate-900">
        {clinics.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={q ? 'No clinics match that search' : 'No clinics yet'}
              description={
                q
                  ? 'Try a different name, slug or city.'
                  : 'Create a clinic to configure its doctors, services and AI assistant.'
              }
              action={
                q ? null : (
                  <Link
                    href="/admin/clinics/new"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                  >
                    <Plus className="size-4" />
                    <span>New clinic</span>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <Table>
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <Th className="pl-6 font-bold text-slate-700 dark:text-slate-300 text-xs">Clinic</Th>
                <Th className="font-bold text-slate-700 dark:text-slate-300 text-xs">Status</Th>
                <Th className="font-bold text-slate-700 dark:text-slate-300 text-xs">WhatsApp</Th>
                <Th className="font-bold text-slate-700 dark:text-slate-300 text-xs">Assistant</Th>
                <Th className="font-bold text-slate-700 dark:text-slate-300 text-xs">Timezone</Th>
                <Th className="text-right font-bold text-slate-700 dark:text-slate-300 text-xs">Doctors</Th>
                <Th className="text-right font-bold text-slate-700 dark:text-slate-300 text-xs">Services</Th>
                <Th className="text-right font-bold text-slate-700 dark:text-slate-300 text-xs">Leads</Th>
                <Th className="text-right pr-6 font-bold text-slate-700 dark:text-slate-300 text-xs">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  <Td className="pl-6">
                    <Link
                      href={`/admin/clinics/${clinic.id}`}
                      className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-sm transition-colors block"
                    >
                      {clinic.name}
                    </Link>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
                      {[clinic.city, clinic.country].filter(Boolean).join(', ') || clinic.slug}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={clinic.isActive ? 'success' : 'neutral'} className="font-bold text-[10px] px-2.5 py-0.5">
                      {clinic.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td>
                    {clinic.whatsapp?.isActive ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
                        <span className="size-1.5 rounded-full bg-emerald-500"></span>
                        {clinic.whatsapp.displayPhoneNumber ?? 'Connected'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                        <span className="size-1.5 rounded-full bg-amber-500"></span>
                        Not connected
                      </span>
                    )}
                  </Td>
                  <Td>
                    {clinic.aiConfiguration?.isEnabled ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800">
                        <span className="size-1.5 rounded-full bg-sky-500"></span>
                        {clinic.aiConfiguration.assistantName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400">
                        Disabled
                      </span>
                    )}
                  </Td>
                  <Td className="text-xs font-semibold text-slate-600 dark:text-slate-400">{clinic.timezone}</Td>
                  <Td className="text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">{clinic._count.doctors}</Td>
                  <Td className="text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">{clinic._count.services}</Td>
                  <Td className="text-right tabular-nums font-bold text-slate-800 dark:text-slate-200">{clinic._count.leads}</Td>
                  <Td className="text-right pr-6">
                    <ConfirmButton
                      confirmMessage={`Are you sure you want to delete clinic "${clinic.name}"? This action is permanent.`}
                      onConfirm={deleteClinicAction.bind(null, clinic.id)}
                    >
                      <span className="inline-flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold text-xs cursor-pointer">
                        <Trash2 className="size-3.5" /> Delete
                      </span>
                    </ConfirmButton>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
