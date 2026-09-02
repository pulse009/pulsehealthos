'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  Package,
  Calendar,
  XCircle,
  Truck,
  Plus,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export interface LowStockItemRow {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  currentStock: number;
  minimumStock: number;
  defaultCost: number | null;
  category?: { name: string } | null;
  supplier?: { id: string; name: string } | null;
}

export interface ExpiringBatchRow {
  id: string;
  batchNumber: string;
  expiryDate: string | Date | null;
  quantity: number;
  item: { id: string; name: string; sku: string | null; unit: string };
  receivedDate: string | Date;
}

interface InventoryLowStockViewProps {
  lowStockItems: LowStockItemRow[];
  expiringBatches: ExpiringBatchRow[];
  clinicName: string;
}

export function InventoryLowStockView({
  lowStockItems,
  expiringBatches,
  clinicName,
}: InventoryLowStockViewProps) {
  const [activeTab, setActiveTab] = useState<'low-stock' | 'expiring'>('low-stock');

  const now = new Date();

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-500" />
            <span>Low Stock &amp; Expiry Monitor</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Safety threshold alerts and consumable expiration warnings for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/inventory/purchase-orders"
            className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            <Truck className="size-3.5" />
            <span>Create Purchase Order</span>
          </Link>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {lowStockItems.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Below safety threshold
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Batches Expiring Soon
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {expiringBatches.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-purple-100 dark:border-purple-900/50 inline-block">
                Within next 90 days
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-purple-50/80 dark:bg-purple-950/60 text-purple-500 dark:text-purple-400 flex items-center justify-center shrink-0 border border-purple-100/70 dark:border-purple-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TABS */}
      <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('low-stock')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'low-stock'
              ? 'border-amber-500 text-amber-600 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Low Stock Items ({lowStockItems.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('expiring')}
          className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'expiring'
              ? 'border-purple-500 text-purple-600 dark:text-purple-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Expiring Batches ({expiringBatches.length})
        </button>
      </div>

      {/* 4. CONTENT */}
      <div className="p-6">
        {activeTab === 'low-stock' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-6">Item Name</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Current Stock</th>
                  <th className="py-2.5 px-4">Min. Threshold</th>
                  <th className="py-2.5 px-4">Deficit</th>
                  <th className="py-2.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lowStockItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center text-slate-400">
                      <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No low stock items!
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        All supplies and consumables meet or exceed minimum safety levels.
                      </p>
                    </td>
                  </tr>
                ) : (
                  lowStockItems.map((item) => {
                    const isZero = item.currentStock <= 0;
                    const deficit = item.minimumStock - item.currentStock;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                          <Link
                            href={`/portal/inventory/items/${item.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {item.name}
                          </Link>
                          {item.sku && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              SKU: {item.sku}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {item.category?.name || '—'}
                        </td>

                        <td className="py-3 px-4 font-black">
                          <span
                            className={
                              isZero
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }
                          >
                            {item.currentStock} {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-500 font-medium">
                          {item.minimumStock} {item.unit}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-rose-600">
                          -{deficit > 0 ? deficit : 0} {item.unit}
                        </td>

                        <td className="py-3 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href="/portal/inventory/purchase-orders"
                              className="px-2.5 py-1 text-[10px] font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[6px] transition-colors"
                            >
                              Reorder
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
        )}

        {activeTab === 'expiring' && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-6">Item Name</th>
                  <th className="py-2.5 px-4">Batch / Lot #</th>
                  <th className="py-2.5 px-4">Batch Quantity</th>
                  <th className="py-2.5 px-4">Expiry Date</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expiringBatches.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-16 text-center text-slate-400">
                      <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        No expiring batches found!
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        All batch lots are well within their valid expiry periods.
                      </p>
                    </td>
                  </tr>
                ) : (
                  expiringBatches.map((b) => {
                    const expiryDate = b.expiryDate ? new Date(b.expiryDate) : null;
                    const isExpired = expiryDate ? expiryDate < now : false;

                    return (
                      <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 font-bold text-slate-900 dark:text-white">
                          <Link
                            href={`/portal/inventory/items/${b.item.id}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {b.item.name}
                          </Link>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {b.batchNumber}
                        </td>

                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                          {b.quantity} {b.item.unit}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {expiryDate ? expiryDate.toLocaleDateString() : 'N/A'}
                        </td>

                        <td className="py-3 px-4">
                          {isExpired ? (
                            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              Expired
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Expiring Soon
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
