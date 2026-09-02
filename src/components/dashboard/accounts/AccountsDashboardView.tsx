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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Paid
          </span>
        );
      case 'PARTIALLY_PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
            <Clock className="size-3" /> Partial
          </span>
        );
      case 'ISSUED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
            <Clock className="size-3" /> Issued
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">Finance &amp; Treasury</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
            Accounts &amp; Financial Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Monitor real-time patient revenue, operating expenses, doctor commissions, and net profit margins.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/portal/accounts/invoices"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>New Invoice</span>
          </Link>

          <Link
            href="/portal/accounts/expenses"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 transition-all shadow-xs"
          >
            <Plus className="size-3.5" />
            <span>Record Expense</span>
          </Link>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Revenue (This Month)</span>
            <div className="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <TrendingUp className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">
            {formatSAR(metrics.monthlyRevenue)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>All-time:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatSAR(metrics.allTimeRevenue)}</span>
          </div>
        </div>

        {/* Monthly Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Operating Expenses</span>
            <div className="size-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">
            {formatSAR(metrics.monthlyExpenseTotal)}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>All-time:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{formatSAR(metrics.allTimeExpenseTotal)}</span>
          </div>
        </div>

        {/* Monthly Net Profit */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Net Profit (Month)</span>
            <div className={`size-8 rounded-xl flex items-center justify-center ${
              metrics.monthlyNetProfit >= 0
                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              <DollarSign className="size-4" />
            </div>
          </div>
          <div className={`text-2xl font-bold ${metrics.monthlyNetProfit >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {formatSAR(metrics.monthlyNetProfit)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revenue minus OPEX overheads
          </div>
        </div>

        {/* Accounts Receivable (Unpaid Invoices) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Accounts Receivable</span>
            <div className="size-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-950 dark:text-white">
            {formatSAR(metrics.totalAccountsReceivable)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pending patient balances
          </div>
        </div>
      </div>

      {/* 3. Secondary Obligations Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Doctor Payables</span>
            <div className="text-xl font-bold text-slate-950 dark:text-white mt-1">
              {formatSAR(metrics.totalDoctorPayables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Accrued commissions awaiting disbursement</p>
          </div>
          <Link
            href="/portal/accounts/doctor-payouts"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Supplier Bills (A/P)</span>
            <div className="text-xl font-bold text-slate-950 dark:text-white mt-1">
              {formatSAR(metrics.totalSupplierPayables)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Unpaid inventory procurement bills</p>
          </div>
          <Link
            href="/portal/accounts/bills"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Financial Reports</span>
            <div className="text-base font-bold text-slate-950 dark:text-white mt-1">
              P&amp;L Statements
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">Real-time Income &amp; Cash Flow reports</p>
          </div>
          <Link
            href="/portal/accounts/reports"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all"
          >
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* 4. Recent Invoices and Recent Payments Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText className="size-4.5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Recent Invoices</h2>
            </div>
            <Link
              href="/portal/accounts/invoices"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View All →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.recentInvoices.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No invoices created yet.
              </div>
            ) : (
              metrics.recentInvoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-950 dark:text-white font-mono">
                        {inv.invoiceNumber}
                      </span>
                      {getStatusBadge(inv.status)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {inv.patient?.name || 'Patient'} {inv.doctor?.name ? `• ${inv.doctor.name}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-950 dark:text-white">
                      {formatSAR(inv.totalAmount)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Paid: {formatSAR(inv.paidAmount)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Payments Received */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4.5 text-slate-800 dark:text-slate-200" />
              <h2 className="text-sm font-bold text-slate-950 dark:text-white">Recent Payments Received</h2>
            </div>
            <Link
              href="/portal/accounts/closing"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Day-End Closing →
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {metrics.recentPayments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No payments recorded yet.
              </div>
            ) : (
              metrics.recentPayments.map((pmt) => (
                <div key={pmt.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        +{formatSAR(pmt.amount)}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {pmt.method}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {pmt.patient?.name || 'Patient'} • {pmt.invoice?.invoiceNumber || 'Invoice'}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400">
                    {new Date(pmt.paymentDate).toLocaleDateString()}
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
