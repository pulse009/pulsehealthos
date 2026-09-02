'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ReceiptText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  X,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  issueDate: string | Date;
  dueDate: string | Date | null;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  currency: string;
  notes: string | null;
  patient: {
    id: string;
    name: string | null;
    phone: string;
    fileNumber: number | null;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
}

export function AccountsInvoicesView({
  initialInvoices,
  patients,
  doctors,
  services,
  clinicName,
}: {
  initialInvoices: InvoiceRecord[];
  patients: Array<{ id: string; name: string | null; phone: string; fileNumber: number | null }>;
  doctors: Array<{ id: string; name: string; specialty: string | null }>;
  services: Array<{ id: string; name: string; priceMinor: number | null }>;
  clinicName: string;
}) {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(initialInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Create Invoice Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [invoiceNotes, setInvoiceNotes] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [lineItems, setLineItems] = useState<
    Array<{ serviceId?: string; description: string; quantity: number; unitPrice: number }>
  >([{ description: '', quantity: 1, unitPrice: 0 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quick Payment Modal State
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      (inv.patient?.name && inv.patient.name.toLowerCase().includes(q)) ||
      (inv.patient?.phone && inv.patient.phone.includes(q)) ||
      (inv.doctor?.name && inv.doctor.name.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  const handleAddLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const handleServiceSelect = (index: number, serviceId: string) => {
    const srv = services.find((s) => s.id === serviceId);
    if (!srv) return;
    const price = srv.priceMinor ? srv.priceMinor / 100 : 0;
    const next = [...lineItems];
    next[index] = {
      serviceId,
      description: srv.name,
      quantity: 1,
      unitPrice: price,
    };
    setLineItems(next);
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setErrorMsg('Please select a patient');
      return;
    }
    const validItems = lineItems.filter((i) => i.description.trim().length > 0);
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one valid line item');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/accounts/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          doctorId: selectedDoctorId || null,
          discountAmount: Number(discountAmount) || 0,
          taxAmount: Number(taxAmount) || 0,
          notes: invoiceNotes || null,
          items: validItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create invoice');

      setIsCreateOpen(false);
      router.refresh();
      // Reset
      setSelectedPatientId('');
      setSelectedDoctorId('');
      setInvoiceNotes('');
      setDiscountAmount(0);
      setTaxAmount(0);
      setLineItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayModal = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setPayAmount(inv.totalAmount - inv.paidAmount);
    setPayMethod('CASH');
    setPayRef('');
    setPayNotes('');
    setIsPayOpen(true);
    setErrorMsg(null);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    if (payAmount <= 0) {
      setErrorMsg('Payment amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/accounts/invoices/${selectedInvoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(payAmount),
          method: payMethod,
          reference: payRef || null,
          notes: payNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record payment');

      setIsPayOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
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

  const totalInvoicesCount = invoices.length;
  const pendingInvoicesCount = invoices.filter((i) => i.status !== 'PAID' && i.status !== 'CANCELLED').length;
  const totalReceivables = invoices
    .filter((i) => i.status !== 'CANCELLED')
    .reduce((sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER TOOLBAR (Attached Border to Border) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-blue-600 dark:text-blue-400">Billing &amp; Invoices</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
            Patient Invoices &amp; Billing
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Create clinical invoices, record multi-method payments, and track receivables.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setIsCreateOpen(true);
            setErrorMsg(null);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>Create Invoice</span>
        </button>
      </div>

      {/* 2. STATS ROW (Flush Border Attached with Border) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Invoices */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Invoices
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {totalInvoicesCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                All-time Invoices
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <FileText className="size-4" />
          </div>
        </div>

        {/* Card 2: Pending Invoices */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Invoices
            </span>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400 tracking-tight leading-none">
              {pendingInvoicesCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Awaiting Settlement
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 3: Total Receivables */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Receivables Balance
            </span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 tracking-tight leading-none">
              {formatSAR(totalReceivables)}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-rose-100 dark:border-rose-900/50 inline-block">
                Patient Outstanding
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-900/50 shadow-2xs">
            <DollarSign className="size-4" />
          </div>
        </div>

        {/* Card 4: Total Collected */}
        <div className="px-6 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {formatSAR(totalCollected)}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[6px] border border-slate-200 dark:border-slate-700 inline-block">
                Realized Revenue
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <TrendingUp className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR (Filter Pills & Search) */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {['ALL', 'ISSUED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL'
                ? 'All Invoices'
                : st === 'PARTIALLY_PAID'
                ? 'Partially Paid'
                : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by invoice #, patient, doctor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 4. ATTACHED BORDER TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] uppercase font-bold sticky top-0 z-10 backdrop-blur-xs">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-4">Patient</th>
                <th className="py-3 px-4">Doctor</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-16 text-slate-400">
                    <ReceiptText className="size-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-xs text-slate-600 dark:text-slate-400">
                      No invoices matching the current filter.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "Create Invoice" above to issue a new bill.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => {
                  const balance = inv.totalAmount - inv.paidAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        <Link
                          href={`/portal/accounts/invoices/${inv.id}`}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {inv.patient?.name || 'Unnamed Patient'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {inv.patient?.fileNumber
                            ? `PID-${inv.patient.fileNumber.toString().padStart(4, '0')}`
                            : inv.patient?.phone}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {inv.doctor?.name || '—'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                        {formatSAR(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                        {formatSAR(inv.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold font-mono text-rose-600 dark:text-rose-400">
                        {formatSAR(balance)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {getStatusBadge(inv.status)}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                            <button
                              type="button"
                              onClick={() => openPayModal(inv)}
                              className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-2xs"
                            >
                              Pay
                            </button>
                          )}
                          <Link
                            href={`/portal/accounts/invoices/${inv.id}`}
                            className="p-1 rounded-[6px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all inline-flex items-center justify-center"
                            title="View Invoice Detail"
                          >
                            <Eye className="size-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Create Invoice */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Create New Patient Invoice</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Select Patient *
                  </label>
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name || 'Unnamed'} ({p.fileNumber ? `PID-${p.fileNumber.toString().padStart(4, '0')}` : p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Attending Doctor
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Optional: Select Doctor --</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.specialty ? `(${d.specialty})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Invoice Line Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="size-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row gap-2 items-end">
                      <div className="flex-1 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Service Preset</label>
                        <select
                          value={item.serviceId || ''}
                          onChange={(e) => handleServiceSelect(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        >
                          <option value="">-- Manual Custom Item --</option>
                          {services.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({formatSAR(s.priceMinor ? s.priceMinor / 100 : 0)})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex-2 w-full sm:w-auto">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Description *</label>
                        <input
                          type="text"
                          required
                          value={item.description}
                          onChange={(e) => {
                            const next = [...lineItems];
                            if (next[idx]) {
                              next[idx] = { ...next[idx], description: e.target.value };
                              setLineItems(next);
                            }
                          }}
                          placeholder="e.g. Laser Consultation"
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                        />
                      </div>

                      <div className="w-20">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          required
                          value={item.quantity}
                          onChange={(e) => {
                            const next = [...lineItems];
                            if (next[idx]) {
                              next[idx] = { ...next[idx], quantity: Math.max(1, parseInt(e.target.value) || 1) };
                              setLineItems(next);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center"
                        />
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-1">Unit Price (SAR)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          value={item.unitPrice}
                          onChange={(e) => {
                            const next = [...lineItems];
                            if (next[idx]) {
                              next[idx] = { ...next[idx], unitPrice: Math.max(0, parseFloat(e.target.value) || 0) };
                              setLineItems(next);
                            }
                          }}
                          className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-right"
                        />
                      </div>

                      {lineItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(idx)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Discounts and Taxes */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Discount (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tax / VAT (SAR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Invoice Notes
                </label>
                <textarea
                  rows={2}
                  value={invoiceNotes}
                  onChange={(e) => setInvoiceNotes(e.target.value)}
                  placeholder="Optional patient payment terms or instructions..."
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Creating...' : 'Generate Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Modal: Quick Pay Invoice */}
      {isPayOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Record Invoice Payment</h3>
              </div>
              <button
                onClick={() => setIsPayOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Invoice:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.invoiceNumber}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Patient:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedInvoice.patient?.name}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Invoice Amount:</span>
                  <span className="font-bold">{formatSAR(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Already Paid:</span>
                  <span className="font-semibold text-emerald-600">{formatSAR(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Remaining Balance:</span>
                  <span className="font-bold text-rose-600">{formatSAR(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount (SAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Method *
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="CASH">💵 Cash (Physical Drawer)</option>
                  <option value="CARD">💳 Card / POS Machine</option>
                  <option value="BANK_TRANSFER">🏦 Bank Transfer</option>
                  <option value="INSURANCE">🛡️ Insurance</option>
                  <option value="ONLINE">🌐 Online Gateway</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Reference # (POS auth code / receipt #)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. POS-AUTH-9012"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPayOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
