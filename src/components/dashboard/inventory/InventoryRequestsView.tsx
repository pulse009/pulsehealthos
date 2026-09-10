'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  AlertCircle,
} from 'lucide-react';

export interface ItemRequestRow {
  id: string;
  requestNumber: string;
  department: string | null;
  reason: string | null;
  status: string;
  notes: string | null;
  rejectionReason: string | null;
  createdAt: string | Date;
  approvedAt: string | Date | null;
  releasedAt: string | Date | null;
  requestedBy: { id: string; name: string; role: string };
  approvedBy?: { id: string; name: string } | null;
  releasedBy?: { id: string; name: string } | null;
  items: Array<{
    id: string;
    quantity: number;
    releasedQuantity: number;
    item: { id: string; name: string; sku: string | null; unit: string; currentStock: number };
  }>;
}

export interface ItemOption {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  currentStock: number;
}

interface InventoryRequestsViewProps {
  initialRequests: ItemRequestRow[];
  availableItems: ItemOption[];
  clinicName: string;
  currentUserRole: string;
}

export function InventoryRequestsView({
  initialRequests,
  availableItems,
  clinicName,
  currentUserRole,
}: InventoryRequestsViewProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<ItemRequestRow[]>(initialRequests);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ItemRequestRow | null>(null);

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // New Request Form State
  const [department, setDepartment] = useState('');
  const [reason, setReason] = useState('');
  const [requestItems, setRequestItems] = useState<Array<{ itemId: string; quantity: number }>>([
    { itemId: availableItems[0]?.id || '', quantity: 1 },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOwnerOrAdmin = currentUserRole === 'CLIENT' || currentUserRole === 'SUPER_ADMIN';

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedStatus !== 'ALL' && r.status !== selectedStatus) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        r.requestNumber.toLowerCase().includes(q) ||
        r.requestedBy.name.toLowerCase().includes(q) ||
        (r.department && r.department.toLowerCase().includes(q)) ||
        (r.reason && r.reason.toLowerCase().includes(q)) ||
        r.items.some((i) => i.item.name.toLowerCase().includes(q))
      );
    });
  }, [requests, searchQuery, selectedStatus]);

  const pendingCount = useMemo(() => requests.filter((r) => r.status === 'PENDING').length, [requests]);
  const approvedCount = useMemo(() => requests.filter((r) => r.status === 'APPROVED').length, [requests]);
  const releasedCount = useMemo(() => requests.filter((r) => r.status === 'RELEASED').length, [requests]);

  const handleAddItemRow = () => {
    const first = availableItems[0];
    if (!first) return;
    setRequestItems((prev) => [...prev, { itemId: first.id, quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setRequestItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, itemId: string) => {
    setRequestItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, itemId } : row)),
    );
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    setRequestItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, quantity: Math.max(1, quantity) } : row)),
    );
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestItems.length === 0) {
      setErrorMsg('Please select at least one item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: department.trim() || undefined,
          reason: reason.trim() || undefined,
          items: requestItems.map((ri) => ({
            itemId: ri.itemId,
            quantity: ri.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to submit request.');

      setRequests((prev) => [data.itemRequest, ...prev]);
      setIsNewRequestModalOpen(false);
      setDepartment('');
      setReason('');
      setRequestItems([{ itemId: availableItems[0]?.id || '', quantity: 1 }]);
      setSuccessMsg(`Request #${data.itemRequest.requestNumber} submitted successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating item request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (reqId: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/requests/${reqId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to approve request.');

      setRequests((prev) => prev.map((r) => (r.id === reqId ? data.itemRequest : r)));
      setSuccessMsg(`Request #${data.itemRequest.requestNumber} approved.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error approving request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReject = (req: ItemRequestRow) => {
    setSelectedRequest(req);
    setRejectReason('');
    setErrorMsg(null);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/requests/${selectedRequest.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to reject request.');

      setRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? data.itemRequest : r)));
      setIsRejectModalOpen(false);
      setSuccessMsg(`Request #${selectedRequest.requestNumber} rejected.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error rejecting request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async (reqId: string) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/requests/${reqId}/release`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to release items.');

      setRequests((prev) => prev.map((r) => (r.id === reqId ? data.itemRequest : r)));
      setSuccessMsg(`Items released & stock deducted for #${data.itemRequest.requestNumber}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error releasing items.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <ClipboardList className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Item Requests &amp; Dispatches</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Internal supply requisitions, approvals, and stock dispatches for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setIsNewRequestModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0 hover:scale-[1.01] active:scale-[0.99]"
        >
          <Plus className="size-3.5" />
          <span>New Request</span>
        </button>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Global Error Alert */}
      {errorMsg && (
        <div className="px-6 py-2 bg-rose-50 dark:bg-rose-950/50 border-b border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-800 dark:text-rose-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Requisitions
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {requests.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                All-time requisitions
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <ClipboardList className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Approval
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {pendingCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Requires review
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Approved (Awaiting Dispatch)
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {approvedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/25 inline-block">
                Ready to release
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/25 shadow-2xs">
            <Send className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Released &amp; Fulfilled
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {releasedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Stock deducted
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Request Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved (Awaiting Dispatch)</option>
            <option value="RELEASED">Released (Fulfilled)</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>

        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search request #, user, item, reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 4. TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6">Req. Number</th>
                <th className="py-2.5 px-4">Requested By</th>
                <th className="py-2.5 px-4">Items &amp; Quantities</th>
                <th className="py-2.5 px-4">Department / Reason</th>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <ClipboardList className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No item requests found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Staff and doctors can request medical supplies using "New Request".
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  return (
                    <tr
                      key={r.id}
                      className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                    >
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        #{r.requestNumber}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {r.requestedBy.name}
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                          {r.requestedBy.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {r.items.map((i) => (
                            <div key={i.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <span className="font-semibold">{i.item.name}:</span>{' '}
                              <strong className="font-mono text-[#0d5c56] dark:text-teal-400">
                                {i.quantity} {i.item.unit}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {r.department && (
                          <span className="block font-semibold text-slate-800 dark:text-slate-200">
                            {r.department}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">{r.reason || '—'}</span>
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        {r.status === 'PENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                            Pending
                          </span>
                        ) : r.status === 'APPROVED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/20">
                            Approved
                          </span>
                        ) : r.status === 'RELEASED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            Released
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOwnerOrAdmin && r.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleApprove(r.id)}
                                className="px-2.5 py-1 text-[10px] font-semibold bg-[#e6f6f3] hover:bg-[#d6f0ea] text-[#0d5c56] dark:bg-[#0d6157]/25 dark:hover:bg-[#0d6157]/40 dark:text-teal-300 rounded-[8px] border border-[#0d8276]/20 transition-colors cursor-pointer shadow-2xs"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                disabled={isSubmitting}
                                onClick={() => handleOpenReject(r)}
                                className="px-2.5 py-1 text-[10px] font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:hover:bg-rose-900 dark:text-rose-300 rounded-[8px] border border-rose-200/80 transition-colors cursor-pointer shadow-2xs"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isOwnerOrAdmin && r.status === 'APPROVED' && (
                            <button
                              type="button"
                              disabled={isSubmitting}
                              onClick={() => handleRelease(r.id)}
                              className="px-3 py-1 text-[10px] font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] transition-all cursor-pointer shadow-xs"
                            >
                              Release Stock
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRequest(r);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
                          >
                            Details
                          </button>
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

      {/* MODAL 1: NEW ITEM REQUEST */}
      {isNewRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300">
                  <ClipboardList className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">New Item Request</h3>
                  <p className="text-[10px] text-slate-400">Request consumables or medical products</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRequestModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Department / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Laser Room 2, Dental Unit 1"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Reason / Procedure
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Skin rejuvenation sessions"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Requested Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItemRow}
                    className="text-[10px] font-bold text-[#0d6157] dark:text-teal-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-[8px] bg-slate-50/50 dark:bg-slate-850">
                  {requestItems.map((row, idx) => {
                    const selItem = availableItems.find((i) => i.id === row.itemId);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={row.itemId}
                          onChange={(e) => handleItemChange(idx, e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                        >
                          {availableItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.currentStock} {item.unit} available)
                            </option>
                          ))}
                        </select>

                        <div className="w-24 shrink-0 flex items-center gap-1">
                          <input
                            type="number"
                            min="1"
                            value={row.quantity}
                            onChange={(e) => handleQuantityChange(idx, parseInt(e.target.value, 10) || 1)}
                            className="w-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-2 py-1.5 text-xs text-slate-900 dark:text-white text-center font-bold focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                          />
                          <span className="text-[10px] font-mono text-slate-400 truncate">
                            {selItem?.unit || 'Units'}
                          </span>
                        </div>

                        {requestItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-[4px]"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewRequestModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REASON */}
      {isRejectModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-red-50 dark:bg-red-950 text-red-600">
                  <XCircle className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Reject Requisition</h3>
                  <p className="text-[10px] text-slate-400">Request #{selectedRequest.requestNumber}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain why this request is being rejected..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Rejecting...' : 'Reject Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REQUEST DETAIL */}
      {isDetailModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300">
                  <ClipboardList className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Requisition #{selectedRequest.requestNumber}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Created {new Date(selectedRequest.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-[8px] border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Requested By</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedRequest.requestedBy.name}</span>
                  <span className="block text-[10px] text-slate-500">Role: {selectedRequest.requestedBy.role}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Status</span>
                  <span className="font-bold text-slate-800 dark:text-white">{selectedRequest.status}</span>
                  {selectedRequest.approvedBy && (
                    <span className="block text-[10px] text-slate-500">Approved by {selectedRequest.approvedBy.name}</span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Requested Items</h4>
                <div className="border border-slate-200/80 dark:border-slate-800 rounded-[8px] overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5 text-center">Requested</th>
                        <th className="p-2.5 text-center">Released</th>
                        <th className="p-2.5 text-center">Available in Stock</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedRequest.items.map((i) => (
                        <tr key={i.id}>
                          <td className="p-2.5 font-medium text-slate-800 dark:text-white">{i.item.name}</td>
                          <td className="p-2.5 text-center font-bold text-[#0d5c56] dark:text-teal-400">{i.quantity} {i.item.unit}</td>
                          <td className="p-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400">{i.releasedQuantity} {i.item.unit}</td>
                          <td className="p-2.5 text-center text-slate-500 font-mono">{i.item.currentStock} {i.item.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedRequest.rejectionReason && (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px]">
                  <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase block">Rejection Reason</span>
                  <p className="text-xs text-red-800 dark:text-red-200 mt-0.5">{selectedRequest.rejectionReason}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[8px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
