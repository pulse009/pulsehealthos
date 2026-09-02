'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Percent,
  RefreshCw,
  Filter,
} from 'lucide-react';

export interface PnLReportData {
  period: {
    startDate: string;
    endDate: string;
  };
  revenue: {
    totalRevenue: number;
    paymentCount: number;
  };
  costs: {
    totalOperatingExpenses: number;
    expenseByCategory: Record<string, number>;
    doctorCommissions: number;
    estimatedCOGS: number;
    totalCosts: number;
  };
  netIncome: number;
  profitMarginPercent: number;
}

export function AccountsReportsView({
  initialReport,
  clinicName,
}: {
  initialReport: PnLReportData;
  clinicName: string;
}) {
  const router = useRouter();
  const [report, setReport] = useState<PnLReportData>(initialReport);
  const [startDate, setStartDate] = useState(initialReport.period.startDate.split('T')[0]);
  const [endDate, setEndDate] = useState(initialReport.period.endDate.split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch(`/api/accounts/reports/pnl?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (data.ok && data.report) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load PnL report:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER TOOLBAR (Attached Border to Border) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 no-print">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">Financial Statements</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Profit &amp; Loss (P&amp;L) Statement
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Comprehensive income statement detailing clinical revenue, direct costs, overheads, and net margins.
          </p>
        </div>

        {/* Date Filter & Print Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <form onSubmit={handleFilter} className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
            />
            <span className="text-[10px] text-slate-400 font-semibold uppercase">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Filter className="size-3.5" />
              <span>{isLoading ? 'Updating...' : 'Filter'}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-[8px] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <Printer className="size-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* 2. STATS ROW (Flush Border Attached with Border) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 no-print">
        {/* Card 1: Gross Income */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Gross Income
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {formatSAR(report.revenue.totalRevenue)}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                {report.revenue.paymentCount} payments collected
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <DollarSign className="size-4" />
          </div>
        </div>

        {/* Card 2: Total Costs & OPEX */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider">
              Total Costs &amp; OPEX
            </span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
              {formatSAR(report.costs.totalCosts)}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-rose-100 dark:border-rose-900/50 inline-block">
                Overheads + COGS
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-900/50 shadow-2xs">
            <TrendingDown className="size-4" />
          </div>
        </div>

        {/* Card 3: Net Operating Income */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Net Operating Income
            </span>
            <div
              className={`text-xl font-black tracking-tight leading-none ${
                report.netIncome >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatSAR(report.netIncome)}
            </div>
            <div className="pt-0.5">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border inline-block ${
                  report.netIncome >= 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50'
                    : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                }`}
              >
                EBITDA Margin
              </span>
            </div>
          </div>
          <div
            className={`size-9 rounded-[8px] flex items-center justify-center shrink-0 shadow-2xs border ${
              report.netIncome >= 0
                ? 'bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 border-emerald-100/70 dark:border-emerald-900/50'
                : 'bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 border-rose-100/70 dark:border-rose-900/50'
            }`}
          >
            <TrendingUp className="size-4" />
          </div>
        </div>

        {/* Card 4: Profit Margin */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Profit Margin
            </span>
            <div
              className={`text-xl font-black tracking-tight leading-none ${
                report.profitMarginPercent >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {report.profitMarginPercent}%
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                Return on Revenue
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Percent className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. STATEMENT DOCUMENT BODY (Attached Border Container) */}
      <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/50 dark:bg-slate-950 p-6 print:p-0">
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xs overflow-hidden print:border-none print:shadow-none print:p-0">
          {/* Statement Header */}
          <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 text-center bg-slate-50/60 dark:bg-slate-850/60 space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {clinicName}
            </h2>
            <h3 className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Statement of Profit and Loss (Income Statement)
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">
              For the period: {new Date(report.period.startDate).toLocaleDateString()} to{' '}
              {new Date(report.period.endDate).toLocaleDateString()}
            </p>
          </div>

          {/* 1. Operating Revenue */}
          <div>
            <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <span>1. Operating Revenue</span>
              <span>Amount (SAR)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="px-6 py-2.5 flex justify-between text-slate-600 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                <span>Patient Consultation &amp; Procedure Fees (Collected)</span>
                <span className="font-mono font-semibold">{formatSAR(report.revenue.totalRevenue)}</span>
              </div>
              <div className="px-6 py-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 flex justify-between font-bold text-emerald-700 dark:text-emerald-400 border-b border-slate-200 dark:border-slate-800">
                <span>Total Gross Revenue</span>
                <span className="font-mono">{formatSAR(report.revenue.totalRevenue)}</span>
              </div>
            </div>
          </div>

          {/* 2. Direct Costs (COGS & Commissions) */}
          <div>
            <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <span>2. Direct Service Costs &amp; Commissions</span>
              <span>Amount (SAR)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              <div className="px-6 py-2.5 flex justify-between text-slate-600 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                <span>Doctor &amp; Staff Commission Payouts Disbursed</span>
                <span className="font-mono">{formatSAR(report.costs.doctorCommissions)}</span>
              </div>
              <div className="px-6 py-2.5 flex justify-between text-slate-600 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors">
                <span>Cost of Goods Sold (Medical Supplies / Consumables Issued)</span>
                <span className="font-mono">{formatSAR(report.costs.estimatedCOGS)}</span>
              </div>
              <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 flex justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
                <span>Total Direct Costs</span>
                <span className="font-mono">
                  {formatSAR(report.costs.doctorCommissions + report.costs.estimatedCOGS)}
                </span>
              </div>
            </div>
          </div>

          {/* 3. Operating Overheads (OPEX) */}
          <div>
            <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              <span>3. Clinic Operating Expenses (OPEX)</span>
              <span>Amount (SAR)</span>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {Object.keys(report.costs.expenseByCategory).length === 0 ? (
                <div className="px-6 py-3 text-slate-400 italic">
                  No categorized expenses recorded in this period.
                </div>
              ) : (
                Object.entries(report.costs.expenseByCategory).map(([cat, val]) => (
                  <div
                    key={cat}
                    className="px-6 py-2.5 flex justify-between text-slate-600 dark:text-slate-300 hover:bg-slate-50/60 dark:hover:bg-slate-850/40 transition-colors"
                  >
                    <span>{cat.replace('_', ' ')} Overheads</span>
                    <span className="font-mono">{formatSAR(val)}</span>
                  </div>
                ))
              )}
              <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/40 flex justify-between font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
                <span>Total Operating Expenses</span>
                <span className="font-mono">{formatSAR(report.costs.totalOperatingExpenses)}</span>
              </div>
            </div>
          </div>

          {/* 4. Net Operating Profit Summary Footer */}
          <div className="px-6 py-4 bg-[#0f172a] text-white dark:bg-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Net Operating Income (EBITDA Net Profit)
              </span>
              <div className="text-xl font-black text-emerald-400 tracking-tight font-mono mt-0.5">
                {formatSAR(report.netIncome)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Net Profit Margin:</span>
              <span
                className={`text-xs font-black font-mono px-2.5 py-1 rounded-[6px] border ${
                  report.profitMarginPercent >= 0
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-rose-950/80 text-rose-300 border-rose-800'
                }`}
              >
                {report.profitMarginPercent}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
