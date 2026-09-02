'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  DollarSign,
  CreditCard,
  User,
  X,
  AlertCircle,
  TrendingUp,
  FileCheck,
} from 'lucide-react';

export interface DayEndClosingRecord {
  id: string;
  closingNumber: string;
  closingDate: string;
  openingCash: number;
  expectedCash: number;
  countedCash: number;
  cashDifference: number;
  totalCardAmount: number;
  totalBankAmount: number;
  totalRevenue: number;
  status: string;
  notes: string | null;
  verifiedAt: string | Date | null;
  createdAt: string | Date;
  closedByUser: {
    id: string;
    name: string;
  };
  verifiedByUser?: {
    id: string;
    name: string;
  } | null;
}

export function AccountsDayEndClosingView({
  initialClosings,
  clinicName,
  userRole,
}: {
  initialClosings: DayEndClosingRecord[];
  clinicName: string;
  userRole?: string;
}) {
  const router = useRouter();
  const [closings, setClosings] = useState<DayEndClosingRecord[]>(initialClosings);

  // Perform Closing Modal
  const [isOpen, setIsOpen] = useState(false);
  const [closingDate, setClosingDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingCash, setOpeningCash] = useState(500);
  const [countedCash, setCountedCash] = useState(500);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Verify Modal
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [selectedClosing, setSelectedClosing] = useState<DayEndClosingRecord | null>(null);
  const [verifyNotes, setVerifyNotes] = useState('');

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCreateClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/accounts/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingDate,
          openingCash: Number(openingCash) || 0,
          countedCash: Number(countedCash) || 0,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit closing report');

      setIsOpen(false);
      router.refresh();
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClosing) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/accounts/closing/${selectedClosing.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: verifyNotes || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to verify closing');

      setIsVerifyOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = userRole === 'CLIENT' || userRole === 'SUPER_ADMIN';

  const verifiedCount = closings.filter((c) => c.status === 'VERIFIED').length;
  const pendingCount = closings.filter((c) => c.status !== 'VERIFIED').length;
  const totalRevenue = closings.reduce((sum, c) => sum + (c.totalRevenue || 0), 0);

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER TOOLBAR (Attached Border to Border) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">Cash Drawer &amp; Reconciliation</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Day-End Cash Shift Closing (Z-Report)
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Receptionist daily shift cash reconciliation: match physical cash in drawer and POS card slips against collected receipts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setErrorMsg(null);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Perform Day-End Closing</span>
        </button>
      </div>

      {/* 2. STATS ROW (Flush Border Attached with Border) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Closings */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Closings
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {closings.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                All-time Z-Reports
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <CalendarCheck className="size-4" />
          </div>
        </div>

        {/* Card 2: Verified */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Verified &amp; Signed
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {verifiedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Manager Audited
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Card 3: Pending Verification */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Sign-Off
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {pendingCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Awaiting Sign-Off
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 4: Net Shift Revenue */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Shift Revenue
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {formatSAR(totalRevenue)}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                Reconciled Cash &amp; Card
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <DollarSign className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. ATTACHED BORDER TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-6">Closing #</th>
                <th className="py-3 px-4">Shift Date</th>
                <th className="py-3 px-4">Cashier / Staff</th>
                <th className="py-3 px-4 text-right">Opening Float</th>
                <th className="py-3 px-4 text-right">Counted Cash</th>
                <th className="py-3 px-4 text-right">Expected Cash</th>
                <th className="py-3 px-4 text-right">Discrepancy</th>
                <th className="py-3 px-4 text-right">Total Shift Revenue</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {closings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-16 text-slate-400">
                    <CalendarCheck className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                      No day-end shift closings submitted yet.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Perform Day-End Closing" above to balance the drawer.
                    </p>
                  </td>
                </tr>
              ) : (
                closings.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-mono font-bold text-slate-900 dark:text-white">
                      {c.closingNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white font-mono text-[11px]">
                      {c.closingDate}
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                      {c.closedByUser.name}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatSAR(c.openingCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatSAR(c.countedCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {formatSAR(c.expectedCash)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      {c.cashDifference === 0 ? (
                        <span className="text-emerald-600 dark:text-emerald-400">0.00 (Balanced)</span>
                      ) : c.cashDifference > 0 ? (
                        <span className="text-teal-600 dark:text-teal-400">+{formatSAR(c.cashDifference)} (Over)</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">{formatSAR(c.cashDifference)} (Short)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatSAR(c.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {c.status === 'VERIFIED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                          <CheckCircle2 className="size-3" /> Verified by Owner
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                          <Clock className="size-3" /> Submitted
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {c.status !== 'VERIFIED' && isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedClosing(c);
                            setVerifyNotes('');
                            setIsVerifyOpen(true);
                            setErrorMsg(null);
                          }}
                          className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-2xs"
                        >
                          Sign-Off / Verify
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL: PERFORM DAY-END CLOSING */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-lg w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <CalendarCheck className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Day-End Shift Cash Reconciliation
                  </h3>
                  <p className="text-[10px] text-slate-400">Balance cash register drawer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateClosing} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Closing Shift Date *
                </label>
                <input
                  type="date"
                  required
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Opening Float Cash (SAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={openingCash}
                    onChange={(e) => setOpeningCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Cash in drawer at start of shift</p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Actual Counted Cash (SAR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={countedCash}
                    onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Physical notes/coins counted</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Cashier Remarks / Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional shift handover or register discrepancy explanation..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Z-Report Closing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL: VERIFY CLOSING */}
      {isVerifyOpen && selectedClosing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Verify Shift Closing</h3>
                  <p className="text-[10px] text-slate-400">Shift #{selectedClosing.closingNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleVerifyClosing} className="space-y-4">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[8px] border border-slate-200/80 dark:border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold">{selectedClosing.closingDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cashier:</span>
                  <span className="font-semibold">{selectedClosing.closedByUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Counted Cash:</span>
                  <span className="font-mono font-bold">{formatSAR(selectedClosing.countedCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Expected:</span>
                  <span className="font-mono">{formatSAR(selectedClosing.expectedCash)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold pt-1.5 border-t border-slate-200 dark:border-slate-700">
                  <span>Difference:</span>
                  <span className={selectedClosing.cashDifference < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                    {formatSAR(selectedClosing.cashDifference)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Manager Verification Sign-Off Notes
                </label>
                <input
                  type="text"
                  value={verifyNotes}
                  onChange={(e) => setVerifyNotes(e.target.value)}
                  placeholder="e.g. Verified by Dr. Clinic Owner - Drawer balanced"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsVerifyOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Signing...' : 'Sign-off & Verify'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
