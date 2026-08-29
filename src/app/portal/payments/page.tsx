import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { CreditCard, Receipt, Download, Plus, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Payments & Billing' };
export const dynamic = 'force-dynamic';

export default async function PaymentsPage() {
  await requireClientUser();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="size-6 text-blue-600" />
            Payments & Billing
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your payment methods, billing address, and download invoices.
          </p>
        </div>
      </div>

      {/* Payment Method & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Payment Method</h2>
            <Badge tone="success" className="text-xs">Valid</Badge>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-[#20293a] text-white flex items-center justify-center font-bold text-xs">
                CARD
              </div>
              <div>
                <span className="font-bold text-sm text-slate-900 dark:text-white block">Community Free Account</span>
                <span className="text-xs text-slate-500">No charge applied ($0.00)</span>
              </div>
            </div>
            <CheckCircle className="size-5 text-emerald-600" />
          </div>

          <button
            type="button"
            className="w-full border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 text-xs font-semibold py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="size-4" />
            Add Backup Payment Card
          </button>
        </div>

        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Billing Information</h2>
          <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
            <div>
              <span className="text-slate-400 block font-medium">Billing Entity</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">Clinic Client Account</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Tax Identifier</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">VAT exempt (Community Tier)</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Billing Period</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">Monthly auto-renewal (Active)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Receipt className="size-5 text-blue-600" />
          Billing History & Invoices
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-900 dark:text-white">INV-2026-08</span>
              <span className="text-slate-400">2026-08-01</span>
              <Badge tone="info">Free Plan</Badge>
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-slate-900 dark:text-white">$0.00</span>
              <button type="button" className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer">
                <Download className="size-3.5" /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
