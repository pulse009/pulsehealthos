'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Wallet,
  ReceiptText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Building,
  Calendar,
  CreditCard,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';

export interface AccountsMetricsData {
  monthlyRevenue: number;
  allTimeRevenue: number;
  monthlyExpenseTotal: number;
  allTimeExpenseTotal: number;
  totalAccountsReceivable: number;
  totalDoctorPayables: number;
  totalSupplierPayables: number;
  monthlyNetProfit: number;
  recentInvoices: Array<{
    id: string;
    invoiceNumber: string;
    totalAmount: number;
    paidAmount: number;
    status: string;
    createdAt: string | Date;
    patient?: { name: string; phone: string } | null;
    doctor?: { name: string } | null;
  }>;
  recentExpenses: Array<{
    id: string;
    expenseNumber: string;
    category: string;
    title: string;
    amount: number;
    paymentMethod: string;
    expenseDate: string | Date;
  }>;
  recentPayments: Array<{
    id: string;
    amount: number;
    method: string;
    paymentDate: string | Date;
    patient?: { name: string } | null;
    invoice?: { invoiceNumber: string } | null;
  }>;
}

export function AccountsDashboardView({
  metrics,
  clinicName,
}: {
  metrics: AccountsMetricsData;
  clinicName: string;
}) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Paid
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
            <Clock className="size-3" /> Partial
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#e6f6f3] text-[#0d6157] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/30">
            <Clock className="size-3" /> Issued
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto font-sans">
      {/* 1. TOP HEADER TOOLBAR (Flush Border Attached to Sidebar) */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Finance &amp; Treasury</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Wallet className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Accounts &amp; Financial Overview</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time patient revenue, operating expenses, doctor commissions, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/portal/accounts/invoices"
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="size-3.5" />
            <span>New Invoice</span>
          </Link>

          <Link
            href="/portal/accounts/expenses"
            className="inline-flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="size-3.5" />
            <span>Record Expense</span>
          </Link>
        </div>
      </div>

      {/* 2. PRIMARY KPI STAT CARDS ROW (Flush Divided Borders) */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Revenue (This Month) */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Revenue (This Month)
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {formatSAR(metrics.monthlyRevenue)}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                All-time: {formatSAR(metrics.allTimeRevenue)}
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <TrendingUp className="size-4" />
          </div>
        </div>

        {/* Card 2: Operating Expenses */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              Operating Expenses
            </span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none font-mono">
              {formatSAR(metrics.monthlyExpenseTotal)}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block">
                All-time: {formatSAR(metrics.allTimeExpenseTotal)}
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <TrendingDown className="size-4" />
          </div>
        </div>

        {/* Card 3: Net Profit (Month) */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Net Profit (Month)
            </span>
            <div className={`text-xl font-black tracking-tight leading-none font-mono ${
              metrics.monthlyNetProfit >= 0 ? 'text-[#0d6157] dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatSAR(metrics.monthlyNetProfit)}
            </div>
            <div className="pt-0.5">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border inline-block ${
                metrics.monthlyNetProfit >= 0
                  ? 'bg-[#e6f6f3] text-[#0d5c56] border-[#0d8276]/20 dark:bg-[#0d6157]/20 dark:text-teal-300'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                Revenue minus OPEX
              </span>
            </div>
          </div>
          <div className={`size-9 rounded-[8px] flex items-center justify-center shrink-0 shadow-2xs border ${
            metrics.monthlyNetProfit >= 0
              ? 'bg-[#e6f6f3] text-[#0d5c56] border-[#0d8276]/20 dark:bg-[#0d6157]/20 dark:text-teal-300'
              : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400'
          }`}>
            <DollarSign className="size-4" />
          </div>
        </div>

        {/* Card 4: Accounts Receivable */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              Accounts Receivable
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {formatSAR(metrics.totalAccountsReceivable)}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                Pending patient balances
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. SECONDARY OBLIGATIONS & QUICK HUBS ROW (Flush Divided Borders) */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Doctor Payables */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Doctor Payables (Accrued)
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {formatSAR(metrics.totalDoctorPayables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accrued commissions awaiting disbursement</p>
          </div>
          <Link
            href="/portal/accounts/doctor-payouts"
            className="size-8 rounded-[8px] bg-slate-100 hover:bg-[#0d6157] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0d6157] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            title="View Doctor Payouts"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {/* Supplier Bills */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Supplier Bills (A/P)
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
              {formatSAR(metrics.totalSupplierPayables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Unpaid inventory procurement bills</p>
          </div>
          <Link
            href="/portal/accounts/bills"
            className="size-8 rounded-[8px] bg-slate-100 hover:bg-[#0d6157] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0d6157] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            title="View Supplier Bills"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        {/* Financial Reports */}
        <div className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div>
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Financial Statements
            </span>
            <div className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
              P&amp;L Statements
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time Income &amp; Cash Flow reports</p>
          </div>
          <Link
            href="/portal/accounts/reports"
            className="size-8 rounded-[8px] bg-slate-100 hover:bg-[#0d6157] hover:text-white dark:bg-slate-800 dark:hover:bg-[#0d6157] text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs shrink-0"
            title="View P&L Statements"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* 4. RECENT INVOICES & PAYMENTS SECTION (Flush Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900 flex-1 min-h-0">
        {/* Recent Invoices Column */}
        <div className="flex flex-col min-h-0">
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <ReceiptText className="size-4 text-[#0d6157] dark:text-teal-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Invoices
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-[8px] bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {metrics.recentInvoices.length}
              </span>
            </div>
            <Link
              href="/portal/accounts/invoices"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d6157] dark:text-teal-400 hover:underline"
            >
              <span>View All</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {metrics.recentInvoices.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <ReceiptText className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No invoices created yet.</p>
              </div>
            ) : (
              metrics.recentInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                        {inv.invoiceNumber}
                      </span>
                      {getStatusBadge(inv.status)}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {inv.patient?.name || 'Patient'}
                      {inv.doctor?.name ? ` • Dr. ${inv.doctor.name}` : ''}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(inv.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      •{' '}
                      {new Date(inv.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono">
                      {formatSAR(inv.totalAmount)}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Paid: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatSAR(inv.paidAmount)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments Column */}
        <div className="flex flex-col min-h-0">
          <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40 shrink-0">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-[#0d6157] dark:text-teal-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Payments Received
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-[8px] bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                {metrics.recentPayments.length}
              </span>
            </div>
            <Link
              href="/portal/accounts/closing"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#0d6157] dark:text-teal-400 hover:underline"
            >
              <span>Day-End Closing</span>
              <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto">
            {metrics.recentPayments.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                <CreditCard className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                <p className="font-semibold text-slate-600 dark:text-slate-400">No payments recorded yet.</p>
              </div>
            ) : (
              metrics.recentPayments.map((pmt) => (
                <div
                  key={pmt.id}
                  className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                        +{formatSAR(pmt.amount)}
                      </span>
                      <span className="px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {pmt.method}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {pmt.patient?.name || 'Patient'}
                      {pmt.invoice?.invoiceNumber ? ` • ${pmt.invoice.invoiceNumber}` : ''}
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-slate-400 shrink-0 font-medium">
                    {new Date(pmt.paymentDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    •{' '}
                    {new Date(pmt.paymentDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
