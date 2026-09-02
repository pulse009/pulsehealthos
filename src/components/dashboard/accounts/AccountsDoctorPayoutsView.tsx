'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  DollarSign,
  Calendar,
  X,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  FileCheck,
  Wallet,
} from 'lucide-react';

export interface DoctorPayoutRecord {
  id: string;
  payoutNumber: string;
  periodStart: string | Date;
  periodEnd: string | Date;
  totalRevenue: number;
  baseSalary: number;
  commissionAmount: number;
  deductions: number;
  netPayoutAmount: number;
  status: string;
  paidAt: string | Date | null;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string | Date;
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  };
  createdBy?: { name: string } | null;
}

export function AccountsDoctorPayoutsView({
  initialPayouts,
  doctors,
  clinicName,
  userRole,
}: {
  initialPayouts: DoctorPayoutRecord[];
  doctors: Array<{ id: string; name: string; specialty: string | null }>;
  clinicName: string;
  userRole?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlStatus = (searchParams.get('status') || 'ALL').toUpperCase();

  const [payouts, setPayouts] = useState<DoctorPayoutRecord[]>(initialPayouts);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync with initialPayouts when refreshed
  React.useEffect(() => {
    setPayouts(initialPayouts);
  }, [initialPayouts]);

  const isDoctor = userRole === 'DOCTOR';
  const isOwner = userRole === 'CLIENT' || userRole === 'SUPER_ADMIN';

  // Generate Modal State
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [deductions, setDeductions] = useState(0);
  const [notes, setNotes] = useState('');
  const [calculation, setCalculation] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Disburse Modal State
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<DoctorPayoutRecord | null>(null);
  const [disburseMethod, setDisburseMethod] = useState('BANK_TRANSFER');
  const [disburseNotes, setDisburseNotes] = useState('');

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handleCalculate = async () => {
    if (!selectedDoctorId || !periodStart || !periodEnd) {
      setErrorMsg('Please select a doctor and date range');
      return;
    }
    setIsCalculating(true);
    setErrorMsg(null);

    try {
      const res = await fetch(
        `/api/accounts/doctor-payouts?calculate=true&doctorId=${selectedDoctorId}&periodStart=${periodStart}&periodEnd=${periodEnd}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to calculate');

      setCalculation(data.calculation);
      setBaseSalary(data.calculation.baseSalary || 0);
    } catch (err: any) {
      setErrorMsg(err.message || 'Calculation error');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleCreatePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !periodStart || !periodEnd) {
      setErrorMsg('Doctor and period dates are required');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/accounts/doctor-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId: selectedDoctorId,
          periodStart,
          periodEnd,
          baseSalary: Number(baseSalary) || 0,
          deductions: Number(deductions) || 0,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate payout');

      setIsGenerateOpen(false);
      router.refresh();
      // Reset
      setSelectedDoctorId('');
      setPeriodStart('');
      setPeriodEnd('');
      setCalculation(null);
      setBaseSalary(0);
      setDeductions(0);
      setNotes('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create payout');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisburse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayout) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/accounts/doctor-payouts/${selectedPayout.id}/disburse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: disburseMethod,
          notes: disburseNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to disburse payout');

      setIsDisburseOpen(false);
      setSelectedPayout(null);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to disburse');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayouts = payouts.filter((p) => {
    const matchesStatus = urlStatus === 'ALL' || p.status === urlStatus;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.payoutNumber.toLowerCase().includes(q) ||
      p.doctor?.name.toLowerCase().includes(q) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  // KPI Computations
  const totalNet = payouts.reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0);
  const pendingNet = payouts
    .filter((p) => p.status === 'PENDING')
    .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0);
  const pendingCount = payouts.filter((p) => p.status === 'PENDING').length;
  const paidNet = payouts
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0);
  const paidCount = payouts.filter((p) => p.status === 'PAID').length;
  const totalRevenue = payouts.reduce((sum, p) => sum + (Number(p.totalRevenue) || 0), 0);

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER (FLUSH BORDER ATTACHED TO SIDEBAR) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-400 mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-teal-600 dark:text-teal-400 font-semibold">Accounts &amp; Finance</span>
            <span>•</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {isDoctor ? 'My Payouts' : 'Doctor Payouts'}
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            {isDoctor ? 'My Payouts' : 'Doctor & Staff Payouts'}
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            {isDoctor
              ? 'Track your monthly base compensation, treatment commissions, deductions, and payout vouchers.'
              : 'Automate commission calculations from doctor payment structures and disburse payout vouchers.'}
          </p>
        </div>

        {isOwner && (
          <button
            onClick={() => {
              setIsGenerateOpen(true);
              setErrorMsg(null);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
          >
            <Plus className="size-3.5" />
            <span>Generate Payout</span>
          </button>
        )}
      </div>

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, ATTACHED DIRECTLY TO BORDERS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Net */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Net Payouts
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {formatSAR(totalNet)}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                {payouts.length} total vouchers
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <Wallet className="size-4" />
          </div>
        </div>

        {/* Card 2: Pending Disbursement */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Pending Disbursement
            </span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none font-mono">
              {formatSAR(pendingNet)}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                {pendingCount} vouchers pending
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 3: Paid & Disbursed */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Paid &amp; Disbursed
            </span>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight leading-none font-mono">
              {formatSAR(paidNet)}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                {paidCount} vouchers paid
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        {/* Card 4: Treatment Revenue */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Treatment Revenue
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {formatSAR(totalRevenue)}
            </div>
            <div className="pt-0.5">
              <span className="bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-indigo-100 dark:border-indigo-900/50 inline-block">
                Completed procedures
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-indigo-50/80 dark:bg-indigo-950/60 text-indigo-500 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-100/70 dark:border-indigo-900/50 shadow-2xs">
            <TrendingUp className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN TABLE SECTION (ATTACHED BORDERS, SCROLLER INSIDE) */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Top Toolbar attached with border-b */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
          <div className="relative w-72 sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={isDoctor ? 'Search by voucher #, notes...' : 'Search by payout #, doctor name...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            {urlStatus === 'PENDING' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                <Clock className="size-3" />
                <span>Pending ({filteredPayouts.length})</span>
              </span>
            ) : urlStatus === 'PAID' ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                <CheckCircle2 className="size-3" />
                <span>Paid ({filteredPayouts.length})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                <FileCheck className="size-3 text-slate-400" />
                <span>All ({filteredPayouts.length})</span>
              </span>
            )}
          </div>
        </div>

        {/* Scrollable Table with flush attached borders and sticky header */}
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800">
              <tr className="text-slate-500 font-semibold">
                <th className="py-2.5 px-6 font-semibold">Payout Voucher #</th>
                {!isDoctor && <th className="py-2.5 px-4 font-semibold">Doctor</th>}
                <th className="py-2.5 px-4 font-semibold">Period</th>
                <th className="py-2.5 px-4 text-right font-semibold">Treatment Revenue</th>
                <th className="py-2.5 px-4 text-right font-semibold">Base Salary</th>
                <th className="py-2.5 px-4 text-right font-semibold">Commission</th>
                <th className="py-2.5 px-4 text-right font-semibold">Net Payout</th>
                <th className="py-2.5 px-4 text-center font-semibold">Status</th>
                <th className="py-2.5 px-6 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredPayouts.length === 0 ? (
                <tr>
                  <td colSpan={isDoctor ? 8 : 9} className="text-center py-16 text-slate-400 text-xs">
                    No payout vouchers found.
                  </td>
                </tr>
              ) : (
                filteredPayouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-6 font-mono font-bold text-slate-950 dark:text-white">
                      {p.payoutNumber}
                    </td>
                    {!isDoctor && (
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{p.doctor.name}</div>
                        <div className="text-[11px] text-slate-400">{p.doctor.specialty || 'General Practitioner'}</div>
                      </td>
                    )}
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(p.periodStart).toLocaleDateString()} – {new Date(p.periodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatSAR(p.totalRevenue)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                      {formatSAR(p.baseSalary)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      +{formatSAR(p.commissionAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {formatSAR(p.netPayoutAmount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
                          <CheckCircle2 className="size-3" /> Disbursed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60">
                          <Clock className="size-3" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      {p.status !== 'PAID' && isOwner && (
                        <button
                          onClick={() => {
                            setSelectedPayout(p);
                            setDisburseMethod('BANK_TRANSFER');
                            setDisburseNotes('');
                            setIsDisburseOpen(true);
                            setErrorMsg(null);
                          }}
                          className="px-2.5 py-1 rounded-[8px] text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all cursor-pointer shadow-2xs"
                        >
                          Disburse
                        </button>
                      )}
                      {p.status === 'PAID' && (
                        <span className="text-[11px] text-slate-400">
                          {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : 'Paid'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Generate Doctor Payout */}
      {isGenerateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="size-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Calculate &amp; Generate Payout</h3>
              </div>
              <button onClick={() => setIsGenerateOpen(false)} className="text-slate-400 p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePayout} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 text-xs">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Select Doctor *
                </label>
                <select
                  value={selectedDoctorId}
                  onChange={(e) => {
                    setSelectedDoctorId(e.target.value);
                    setCalculation(null);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} {d.specialty ? `(${d.specialty})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodStart}
                    onChange={(e) => {
                      setPeriodStart(e.target.value);
                      setCalculation(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodEnd}
                    onChange={(e) => {
                      setPeriodEnd(e.target.value);
                      setCalculation(null);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCalculate}
                disabled={isCalculating || !selectedDoctorId || !periodStart || !periodEnd}
                className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <RefreshCw className={`size-3.5 ${isCalculating ? 'animate-spin' : ''}`} />
                <span>{isCalculating ? 'Calculating from Payment Structure...' : 'Auto-Calculate Earnings'}</span>
              </button>

              {calculation && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Completed Appointments:</span>
                    <span className="font-bold">{calculation.totalAppointments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Total Collected Revenue:</span>
                    <span className="font-mono font-semibold">{formatSAR(calculation.totalCollectedRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Procedure Commission Share:</span>
                    <span className="font-mono font-semibold">+{formatSAR(calculation.procedureCommission)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Revenue Incentive Bonus:</span>
                    <span className="font-mono font-semibold">+{formatSAR(calculation.revenueIncentive)}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span>Total Calculated Commission:</span>
                    <span className="font-mono text-blue-600">{formatSAR(calculation.totalCommission)}</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Base Salary (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={baseSalary}
                    onChange={(e) => setBaseSalary(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deductions (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={deductions}
                    onChange={(e) => setDeductions(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Voucher Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional bonus or adjustment details..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGenerateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Payout Voucher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Disburse Payout */}
      {isDisburseOpen && selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Disburse Payout Voucher</h3>
              </div>
              <button onClick={() => setIsDisburseOpen(false)} className="text-slate-400 p-1">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleDisburse} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Voucher:</span>
                  <span className="font-bold">{selectedPayout.payoutNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Doctor:</span>
                  <span className="font-semibold">{selectedPayout.doctor.name}</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Net Amount to Disburse:</span>
                  <span className="text-emerald-600">{formatSAR(selectedPayout.netPayoutAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Disbursement Method *
                </label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold"
                >
                  <option value="BANK_TRANSFER">🏦 Bank Wire / Direct Deposit</option>
                  <option value="CHEQUE">📜 Bank Cheque</option>
                  <option value="CASH">💵 Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Reference / Notes
                </label>
                <input
                  type="text"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  placeholder="e.g. Wire Transfer Ref #TRX-9012"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDisburseOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Disbursement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
