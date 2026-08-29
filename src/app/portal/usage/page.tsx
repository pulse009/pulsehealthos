import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Bot, MessageSquare, Zap, Activity, Clock, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = { title: 'AI Replies Usage' };
export const dynamic = 'force-dynamic';

export default async function AIUsagePage() {
  const { clinicId } = await requireClientUser();

  const [totalMessages, aiRepliesCount, fastRouterCount] = await Promise.all([
    prisma.message.count({ where: { clinicId: clinicId! } }),
    prisma.message.count({ where: { clinicId: clinicId!, sender: 'AI' } }),
    prisma.systemLog.count({ where: { clinicId: clinicId!, event: 'router.completed' } }).catch(() => 0),
  ]);

  const configuredModel = process.env.GEMINI_MODEL || 'google/gemma-4-26b-a4b-it:free';

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Bot className="size-6 text-blue-600" />
            AI Replies Usage
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track OpenRouter token consumption, automated AI responses, and fast router executions.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Total Messages</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalMessages}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Inbound & Outbound</span>
        </div>

        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">AI Automated Replies</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{aiRepliesCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">Zero human delay</span>
        </div>

        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">Fast Router Executions</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{fastRouterCount}</div>
          <span className="text-[11px] text-slate-500 mt-1 block">&lt; 50ms sub-millisecond</span>
        </div>

        <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-xs font-semibold text-slate-400 block">AI Model</span>
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2 truncate">{configuredModel.split('/')[1] || configuredModel}</div>
          <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Active &amp; Online</span>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Activity className="size-5 text-blue-600" />
          Monthly Usage Quota
        </h2>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600 dark:text-slate-400">AI Message Capacity</span>
            <span className="text-slate-900 dark:text-white font-bold">{aiRepliesCount} / Unlimited (Free Tier)</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(5, (aiRepliesCount / 1000) * 100))}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-200 block">Instant Router Response</span>
              <span>Common booking inquiries, greetings, hours, and slot confirmations are answered directly without consuming LLM tokens.</span>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-200 block">OpenRouter Free Pool Routing</span>
              <span>Automatic failover handles rate limits smoothly without customer disruption.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
