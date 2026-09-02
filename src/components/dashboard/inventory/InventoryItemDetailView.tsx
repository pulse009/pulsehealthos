'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Plus,
  RefreshCw,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Calendar,
  Layers,
  Truck,
  Activity,
  DollarSign,
  Clock,
  X,
  AlertCircle,
} from 'lucide-react';

export interface ItemDetailData {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  description: string | null;
  currentStock: number;
  minimumStock: number;
  defaultCost: number | null;
  trackExpiry: boolean;
  trackBatch: boolean;
  isActive: boolean;
  createdAt: string | Date;
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string; phone: string | null; email: string | null } | null;
  batches: Array<{
    id: string;
    batchNumber: string;
    expiryDate: string | Date | null;
    quantity: number;
    unitCost: number | null;
    receivedDate: string | Date;
  }>;
  movements: Array<{
    id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    unitCost: number | null;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    createdAt: string | Date;
    createdBy: { id: string; name: string } | null;
  }>;
  poItems: Array<{
    id: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    purchaseOrder: {
      id: string;
      poNumber: string;
      orderDate: string | Date;
      status: string;
      supplier: { name: string };
    };
  }>;
}

interface InventoryItemDetailViewProps {
  item: ItemDetailData;
  clinicName: string;
}

export function InventoryItemDetailView({
  item: initialItem,
  clinicName,
}: InventoryItemDetailViewProps) {
  const router = useRouter();
  const [item, setItem] = useState<ItemDetailData>(initialItem);
  const [activeTab, setActiveTab] = useState<'overview' | 'batches' | 'movements' | 'purchases'>('overview');

  // Modals
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  const [receiveQuantity, setReceiveQuantity] = useState('10');
  const [receiveUnitCost, setReceiveUnitCost] = useState(item.defaultCost ? item.defaultCost.toString() : '0');
  const [receiveBatchNumber, setReceiveBatchNumber] = useState('');
  const [receiveExpiryDate, setReceiveExpiryDate] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  const [adjustQuantity, setAdjustQuantity] = useState('0');
  const [adjustNotes, setAdjustNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const isOutOfStock = item.currentStock <= 0;
  const isLowStock = item.currentStock > 0 && item.currentStock <= item.minimumStock;

  const handleReceiveStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(receiveQuantity, 10);
    if (!qty || qty <= 0) {
      setErrorMsg('Quantity must be greater than 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: qty,
          unitCost: parseFloat(receiveUnitCost) || 0,
          batchNumber: receiveBatchNumber.trim() || undefined,
          expiryDate: receiveExpiryDate || undefined,
          notes: receiveNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to receive stock.');

      setItem((prev) => ({
        ...prev,
        currentStock: data.newStock,
        movements: [data.movement, ...prev.movements],
      }));

      setIsReceiveModalOpen(false);
      setSuccessMsg(`Received ${qty} ${item.unit} successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error receiving stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustQuantity, 10);
    if (!qty || qty === 0) {
      setErrorMsg('Adjustment quantity cannot be 0.');
      return;
    }
    if (!adjustNotes.trim()) {
      setErrorMsg('Please specify reason/notes for this adjustment.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          quantity: qty,
          notes: adjustNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to adjust stock.');

      setItem((prev) => ({
        ...prev,
        currentStock: data.newStock,
        movements: [data.movement, ...prev.movements],
      }));

      setIsAdjustModalOpen(false);
      setSuccessMsg(`Stock adjusted to ${data.newStock} ${item.unit}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adjusting stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/inventory/items"
            className="p-1.5 rounded-[8px] bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {item.name}
              </h1>
              {item.sku && (
                <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-[6px] text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {item.sku}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {item.category?.name || 'Uncategorized'} • {clinicName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setReceiveQuantity('10');
              setReceiveUnitCost(item.defaultCost ? item.defaultCost.toString() : '0');
              setErrorMsg(null);
              setIsReceiveModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Receive Stock</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAdjustQuantity('0');
              setAdjustNotes('');
              setErrorMsg(null);
              setIsAdjustModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-[8px] transition-all cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Adjust Stock</span>
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Current Stock
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {item.currentStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
          </div>
          <div className="pt-1">
            {isOutOfStock ? (
              <span className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                ● Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                ● Low Stock Threshold
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                ● In Stock
              </span>
            )}
          </div>
        </div>

        <div className="px-5 py-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Minimum Safety Stock
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            {item.minimumStock} <span className="text-xs font-normal text-slate-500">{item.unit}</span>
          </div>
          <div className="pt-1">
            <span className="text-[10px] text-slate-400">Reorder trigger</span>
          </div>
        </div>

        <div className="px-5 py-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Default Unit Cost
          </span>
          <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
            ${item.defaultCost ? item.defaultCost.toFixed(2) : '0.00'}
          </div>
          <div className="pt-1">
            <span className="text-[10px] text-slate-400">
              Total Value: ${((item.defaultCost ?? 0) * item.currentStock).toFixed(2)}
            </span>
          </div>
        </div>

        <div className="px-5 py-3">
          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tracking Flags
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold border ${
                item.trackExpiry
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              Expiry: {item.trackExpiry ? 'ON' : 'OFF'}
            </span>
            <span
              className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold border ${
                item.trackBatch
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              Batch: {item.trackBatch ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. TABS NAVIGATION */}
      <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('batches')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'batches'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Batches &amp; Lots ({item.batches.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('movements')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'movements'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Stock Movements ({item.movements.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('purchases')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'purchases'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Purchase History ({item.poItems.length})
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      <div className="p-6 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Item Specifications
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Item Name:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{item.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SKU / Code:</span>
                  <span className="font-mono text-slate-800 dark:text-white">{item.sku || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {item.category?.name || 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit of Measure:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-white">{item.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Minimum Stock Level:</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {item.minimumStock} {item.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Default Cost:</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    ${item.defaultCost ? item.defaultCost.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>

              {item.description && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Description</span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-5 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Supplier &amp; Sourcing Details
              </h3>
              {item.supplier ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Primary Supplier:</span>
                    <span className="font-bold text-slate-800 dark:text-white">{item.supplier.name}</span>
                  </div>
                  {item.supplier.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contact Phone:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{item.supplier.phone}</span>
                    </div>
                  )}
                  {item.supplier.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{item.supplier.email}</span>
                    </div>
                  )}
                  <div className="pt-3">
                    <Link
                      href="/portal/inventory/purchase-orders"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] font-semibold text-xs transition-colors"
                    >
                      <Truck className="size-3.5" />
                      <span>Create Purchase Order</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p>No primary supplier assigned to this item.</p>
                  <Link
                    href="/portal/inventory/suppliers"
                    className="text-blue-600 dark:text-blue-400 font-semibold mt-2 inline-block hover:underline"
                  >
                    Manage Suppliers →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: BATCHES & LOTS */}
        {activeTab === 'batches' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-6">Batch / Lot #</th>
                  <th className="py-2.5 px-4">Expiry Date</th>
                  <th className="py-2.5 px-4">Received Date</th>
                  <th className="py-2.5 px-4">Available Qty</th>
                  <th className="py-2.5 px-4">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {item.batches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400">
                      No active batches recorded. Receive stock with a Batch # to track lot numbers and expiry.
                    </td>
                  </tr>
                ) : (
                  item.batches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {b.batchNumber}
                      </td>
                      <td className="py-3 px-4">
                        {b.expiryDate ? (
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(b.expiryDate).toLocaleDateString()}
                          </span>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(b.receivedDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {b.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        ${b.unitCost ? b.unitCost.toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: STOCK MOVEMENTS */}
        {activeTab === 'movements' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-6">Date &amp; Time</th>
                  <th className="py-2.5 px-4">Movement Type</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Stock Ledger</th>
                  <th className="py-2.5 px-4">User</th>
                  <th className="py-2.5 px-6">Reference / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {item.movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      No stock movement history for this item.
                    </td>
                  </tr>
                ) : (
                  item.movements.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 text-slate-500 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold ${
                              m.type === 'STOCK_RECEIVED'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : m.type === 'STOCK_ISSUED'
                                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {m.type.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold">
                          <span
                            className={
                              isPositive
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }
                          >
                            {isPositive ? `+${m.quantity}` : m.quantity} {item.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          {m.previousStock} → <strong>{m.newStock}</strong>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                          {m.createdBy?.name || 'System'}
                        </td>
                        <td className="py-3 px-6 text-slate-500 text-[11px]">
                          {m.notes || m.referenceId ? `${m.referenceId ? '#' + m.referenceId + ': ' : ''}${m.notes || ''}` : '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: PURCHASE HISTORY */}
        {activeTab === 'purchases' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-6">PO Number</th>
                  <th className="py-2.5 px-4">Supplier</th>
                  <th className="py-2.5 px-4">Order Date</th>
                  <th className="py-2.5 px-4">Ordered Qty</th>
                  <th className="py-2.5 px-4">Received Qty</th>
                  <th className="py-2.5 px-4">Unit Cost</th>
                  <th className="py-2.5 px-6">PO Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {item.poItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No purchase orders recorded for this item yet.
                    </td>
                  </tr>
                ) : (
                  item.poItems.map((poi) => (
                    <tr key={poi.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-6 font-mono font-bold text-blue-600 dark:text-blue-400">
                        <Link href={`/portal/inventory/purchase-orders`}>
                          #{poi.purchaseOrder.poNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-white">
                        {poi.purchaseOrder.supplier.name}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(poi.purchaseOrder.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {poi.quantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-600">
                        {poi.receivedQuantity} {item.unit}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        ${poi.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {poi.purchaseOrder.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: RECEIVE STOCK */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <Plus className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Receive Stock</h3>
                  <p className="text-[10px] text-slate-400">{item.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Quantity ({item.unit}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Unit Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={receiveUnitCost}
                    onChange={(e) => setReceiveUnitCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. LOT-2026-X"
                    value={receiveBatchNumber}
                    onChange={(e) => setReceiveBatchNumber(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="date"
                    value={receiveExpiryDate}
                    onChange={(e) => setReceiveExpiryDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="Optional reference / challan number..."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Receiving...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADJUST STOCK */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-amber-50 dark:bg-amber-950 text-amber-600">
                  <RefreshCw className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Adjust Stock</h3>
                  <p className="text-[10px] text-slate-400">{item.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[8px] flex items-center justify-between border border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500 font-medium">Current Stock:</span>
                <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  {item.currentStock} {item.unit}
                </span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Adjustment Units (+ to add, - to deduct) *
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. -2 or 5"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  New stock will be:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {item.currentStock + (parseInt(adjustQuantity, 10) || 0)} {item.unit}
                  </strong>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Reason for Adjustment *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Clinic audit adjustment, damaged pack..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
