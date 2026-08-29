import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { CreditCard, Check, Sparkles, Zap, Shield, ArrowUpRight } from 'lucide-react';

export const metadata: Metadata = { title: 'Subscription Plan' };
export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const { clinicId } = await requireClientUser();

  const clinic = await prisma.clinic.findUnique({
    where: { id: clinicId! },
    select: { name: true, createdAt: true },
  });

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <CreditCard className="size-6 text-blue-600" />
            Subscription Plan
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Review your active plan, quotas, and subscription tier.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#20293a] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
            Free Plan
          </span>
        </div>
      </div>

      {/* Active Plan Card */}
      <div className="surface rounded-2xl border-2 border-blue-600/30 bg-gradient-to-br from-blue-50/40 via-white to-slate-50 dark:from-slate-900 dark:to-slate-900 p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-[#20293a] text-white text-xs font-semibold px-3 py-0.5 rounded-full">
                Active Tier
              </span>
              <span className="text-xs text-slate-400 font-medium">Standard Cloud Tier</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Community Free Tier</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Includes core WhatsApp AI booking engine, automated reminder cron jobs, multi-doctor availability management, and bilingual patient communication.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="size-4" />
              Upgrade to Pro
              <ArrowUpRight className="size-4" />
            </button>
          </div>
        </div>

        {/* Feature List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>Up to 5 Active Doctors</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>Unlimited Automated Booking</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>WhatsApp Cloud Integration</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>Bilingual Support (AR / EN)</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>Automated Cron Reminders</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>Zero Double-Booking Engine</span>
          </div>
        </div>
      </div>

      {/* Plan Comparison Grid */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">Available Plans</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Free</span>
            <span className="text-xs text-slate-400">Current</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            $0 <span className="text-xs font-normal text-slate-400">/ month</span>
          </div>
          <p className="text-xs text-slate-500">Perfect for single clinic launch & testing.</p>
        </div>

        {/* Pro Plan */}
        <div className="surface rounded-2xl border-2 border-blue-600 p-6 bg-white dark:bg-slate-900 shadow-md space-y-4 relative">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-blue-600">Professional</span>
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Recommended</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            $99 <span className="text-xs font-normal text-slate-400">/ month</span>
          </div>
          <p className="text-xs text-slate-500">For busy clinics requiring higher LLM throughput.</p>
        </div>

        {/* Enterprise */}
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">Enterprise</span>
            <span className="text-xs text-slate-400">Custom</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            $299 <span className="text-xs font-normal text-slate-400">/ month</span>
          </div>
          <p className="text-xs text-slate-500">For multi-branch hospital networks with dedicated SLA.</p>
        </div>
      </div>
    </div>
  );
}
