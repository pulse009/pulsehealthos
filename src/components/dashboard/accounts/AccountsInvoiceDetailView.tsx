'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ReceiptText,
  ArrowLeft,
  Printer,
  CreditCard,
  CheckCircle2,
  Clock,
  Plus,
  AlertCircle,
  X,
  User,
  Calendar,
  Building,
} from 'lucide-react';

export interface InvoiceDetailRecord {
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
  createdAt: string | Date;
  patient: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
    fileNumber: number | null;
  };
  doctor: {
    id: string;
    name: string;
    specialty: string | null;
  } | null;
  appointment: {
    id: string;
    appointmentNumber: number | null;
    startsAt: string | Date;
  } | null;
  items: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    service?: { name: string } | null;
    inventoryItem?: { name: string; sku: string | null; unit: string } | null;
  }>;
  transactions: Array<{
    id: string;
    amount: number;
    method: string;
    reference: string | null;
    notes: string | null;
    paymentDate: string | Date;
    receivedBy?: { name: string } | null;
  }>;
  createdBy?: { name: string } | null;
}

export function AccountsInvoiceDetailView({
  invoice,
  clinicName,
}: {
  invoice: InvoiceDetailRecord;
  clinicName: string;
}) {
  const router = useRouter();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState(invoice.totalAmount - invoice.paidAmount);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const formatSAR = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (payAmount <= 0) {
      setErrorMsg('Payment amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/accounts/invoices/${invoice.id}/pay`, {
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
      if (!res.ok) throw new Error(data.error || 'Payment failed');

      setIsPayOpen(false);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment recording failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-6 space-y-6">
      {/* 1. Top Action Navigation */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/portal/accounts/invoices"
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          <ArrowLeft className="size-4" />
          <span>Back to Invoices</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <Printer className="size-3.5" />
            <span>Print Invoice</span>
          </button>

          {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                setPayAmount(balance);
                setIsPayOpen(true);
                setErrorMsg(null);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs cursor-pointer"
            >
              <CreditCard className="size-3.5" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Official Printable Invoice Paper */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-8 max-w-4xl mx-auto space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                +
              </div>
              <h1 className="text-xl font-bold text-slate-950 dark:text-white tracking-tight">
                {clinicName}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Official Medical Invoice &amp; Tax Receipt
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
              {invoice.invoiceNumber}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Issue Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(invoice.issueDate).toLocaleDateString()}</span>
            </div>
            {invoice.dueDate && (
              <div className="text-xs text-slate-500">
                Due Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{new Date(invoice.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Patient & Doctor Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50/75 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Billed To (Patient)</span>
            <div className="text-sm font-bold text-slate-950 dark:text-white mt-1">
              {invoice.patient?.name || 'Unnamed Patient'}
            </div>
            <div className="text-slate-500 mt-0.5">
              Phone: <span className="font-mono text-slate-700 dark:text-slate-300">{invoice.patient?.phone}</span>
            </div>
            {invoice.patient?.fileNumber && (
              <div className="text-slate-500">
                Medical File: <span className="font-mono font-semibold text-blue-600">PID-{invoice.patient.fileNumber.toString().padStart(4, '0')}</span>
              </div>
            )}
          </div>

          <div>
            <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Clinical Service Provider</span>
            <div className="text-sm font-bold text-slate-950 dark:text-white mt-1">
              {invoice.doctor?.name || 'Clinic Department'}
            </div>
            {invoice.doctor?.specialty && (
              <div className="text-slate-500 mt-0.5">
                Specialty: {invoice.doctor.specialty}
              </div>
            )}
            {invoice.appointment && (
              <div className="text-slate-500">
                Appointment: #{invoice.appointment.appointmentNumber}
              </div>
            )}
          </div>
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Unit Price</th>
                <th className="py-2.5 px-2 text-right">Total Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td className="py-3 px-2">
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {item.description}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center font-mono">{item.quantity}</td>
                  <td className="py-3 px-2 text-right font-mono">{formatSAR(item.unitPrice)}</td>
                  <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                    {formatSAR(item.totalPrice)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Calculation */}
        <div className="flex flex-col sm:flex-row justify-between gap-6 border-t border-slate-200 dark:border-slate-700 pt-6">
          <div className="text-xs text-slate-500 max-w-sm">
            {invoice.notes && (
              <div>
                <span className="font-bold text-slate-700 dark:text-slate-300">Notes / Remarks:</span>
                <p className="mt-1 italic">{invoice.notes}</p>
              </div>
            )}
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatSAR(invoice.subtotal)}</span>
            </div>
            {invoice.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600">
                <span>Discount:</span>
                <span className="font-mono">- {formatSAR(invoice.discountAmount)}</span>
              </div>
            )}
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Tax / VAT:</span>
                <span className="font-mono">+ {formatSAR(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold text-slate-950 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
              <span>Total Amount:</span>
              <span className="font-mono text-blue-600 dark:text-blue-400">{formatSAR(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between font-semibold text-emerald-600">
              <span>Paid Amount:</span>
              <span className="font-mono">{formatSAR(invoice.paidAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-600 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span>Balance Due:</span>
              <span className="font-mono">{formatSAR(balance)}</span>
            </div>
          </div>
        </div>

        {/* Payment Transactions Ledger */}
        {invoice.transactions.length > 0 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Payment Transaction History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 font-semibold">
                    <th className="py-2 px-3">Date</th>
                    <th className="py-2 px-3">Method</th>
                    <th className="py-2 px-3">Reference #</th>
                    <th className="py-2 px-3">Received By</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoice.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 px-3">{new Date(tx.paymentDate).toLocaleString()}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800">
                          {tx.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-500">{tx.reference || '—'}</td>
                      <td className="py-2.5 px-3">{tx.receivedBy?.name || 'Staff'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                        +{formatSAR(tx.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. Record Payment Modal */}
      {isPayOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 no-print">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="size-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-950 dark:text-white">Record Payment</h3>
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
                  Reference # (e.g. POS Auth code / Transaction ID)
                </label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. POS-AUTH-8821"
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
