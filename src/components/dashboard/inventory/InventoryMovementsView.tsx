'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  Search,
  ArrowDownRight,
  ArrowUpRight,
  RefreshCw,
  Package,
} from 'lucide-react';

export interface MovementRow {
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
  item: { id: string; name: string; sku: string | null; unit: string };
  batch?: { id: string; batchNumber: string; expiryDate: string | Date | null } | null;
  createdBy?: { id: string; name: string } | null;
}

interface InventoryMovementsViewProps {
  initialMovements: MovementRow[];
  clinicName: string;
}

export function InventoryMovementsView({
  initialMovements,
  clinicName,
}: InventoryMovementsViewProps) {
  const [movements] = useState<MovementRow[]>(initialMovements);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (selectedType !== 'ALL' && m.type !== selectedType) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        m.item.name.toLowerCase().includes(q) ||
        (m.item.sku && m.item.sku.toLowerCase().includes(q)) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q)) ||
        (m.createdBy?.name && m.createdBy.name.toLowerCase().includes(q))
      );
    });
  }, [movements, searchQuery, selectedType]);

  const receivedCount = useMemo(
    () => movements.filter((m) => m.type === 'STOCK_RECEIVED').length,
    [movements],
  );
  const issuedCount = useMemo(
    () => movements.filter((m) => m.type === 'STOCK_ISSUED').length,
    [movements],
  );
  const adjustedCount = useMemo(
    () => movements.filter((m) => m.type === 'STOCK_ADJUSTMENT').length,
    [movements],
  );

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Activity className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Stock Movements Ledger</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Complete immutable audit log of every stock change, receipt, and issue for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Logged Movements
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {movements.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                All transactions
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Activity className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Stock Inbound (Received)
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {receivedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                POs &amp; Inbound receipts
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <ArrowDownRight className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Stock Outbound (Issued)
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {issuedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/25 inline-block">
                Released item requests
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/25 shadow-2xs">
            <ArrowUpRight className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Adjustments &amp; Audits
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {adjustedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Manual reconcile
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <RefreshCw className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Movement Types</option>
            <option value="STOCK_RECEIVED">Stock Received (Inbound)</option>
            <option value="STOCK_ISSUED">Stock Issued (Outbound)</option>
            <option value="STOCK_ADJUSTMENT">Manual Adjustment</option>
            <option value="STOCK_RETURN">Stock Return</option>
          </select>
        </div>

        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search movements, item, ref #, user..."
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
                <th className="py-2.5 px-6">Date &amp; Time</th>
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4">Movement Type</th>
                <th className="py-2.5 px-4">Quantity</th>
                <th className="py-2.5 px-4">Stock Ledger</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-6">Reference / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Activity className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No stock movements found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Transactions will automatically log here as items are received, issued, or adjusted.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                    >
                      <td className="py-3 px-6 text-slate-500 font-mono text-[11px]">
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                        <Link
                          href={`/portal/inventory/items/${m.item.id}`}
                          className="font-bold hover:text-[#0d6157] dark:hover:text-teal-300 transition-colors"
                        >
                          {m.item.name}
                        </Link>
                        {m.item.sku && (
                          <span className="block text-[10px] text-slate-400 font-mono">
                            SKU: {m.item.sku}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold ${
                            m.type === 'STOCK_RECEIVED'
                              ? 'bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/20'
                              : m.type === 'STOCK_ISSUED'
                                ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                          }`}
                        >
                          {m.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold">
                        <span
                          className={
                            isPositive
                              ? 'text-[#0d6157] dark:text-teal-300'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.item.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {m.previousStock} → <strong className="text-slate-900 dark:text-white">{m.newStock}</strong>
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {m.createdBy?.name || 'System Auto'}
                      </td>
                      <td className="py-3 px-6 text-slate-600 dark:text-slate-400 text-xs">
                        {m.referenceId && (
                          <span className="font-mono font-semibold text-[#0d5c56] dark:text-teal-400 mr-1.5">
                            #{m.referenceId}
                          </span>
                        )}
                        <span>{m.notes || '—'}</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
