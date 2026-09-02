'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Boxes,
  Package,
  AlertTriangle,
  XCircle,
  Clock,
  ClipboardList,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  TrendingDown,
  Calendar,
  CheckCircle2,
  DollarSign,
  Truck,
  ExternalLink,
  ChevronRight,
  Activity,
} from 'lucide-react';

export interface InventoryMetricsData {
  totalItems: number;
  totalStockQuantity: number;
  totalInventoryValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  expiringBatchesCount: number;
  pendingRequests: number;
  pendingPOs: number;
  lowStockItems: Array<{
    id: string;
    name: string;
    sku: string | null;
    unit: string;
    currentStock: number;
    minimumStock: number;
    defaultCost: number | null;
    category?: { name: string } | null;
  }>;
  recentMovements: Array<{
    id: string;
    type: string;
    quantity: number;
    previousStock: number;
    newStock: number;
    referenceType: string | null;
    referenceId: string | null;
    notes: string | null;
    createdAt: string | Date;
    item: { id: string; name: string; sku: string | null; unit: string };
    createdBy: { id: string; name: string } | null;
  }>;
}

interface InventoryDashboardViewProps {
  metrics: InventoryMetricsData;
  clinicName: string;
}

export function InventoryDashboardView({
  metrics,
  clinicName,
}: InventoryDashboardViewProps) {
  const router = useRouter();

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-y-auto font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Boxes className="size-5 text-blue-600 dark:text-blue-400" />
            <span>Clinic Inventory &amp; Stock Hub</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time supply levels, stock movements, and orders for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/portal/inventory/requests"
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs px-3 py-1.5 rounded-[8px] transition-all cursor-pointer"
          >
            <ClipboardList className="size-3.5" />
            <span>Item Requests</span>
          </Link>
          <Link
            href="/portal/inventory/items"
            className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer"
          >
            <Plus className="size-3.5" />
            <span>Manage Items</span>
          </Link>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS ROW (DIVIDED BORDER FORMAT) */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Total Items */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Catalog Items
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {metrics.totalItems}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                {metrics.totalStockQuantity} total units
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Package className="size-4" />
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              Low Stock Warnings
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {metrics.lowStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                Below min threshold
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        {/* Card 3: Out of Stock */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              Out of Stock
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {metrics.outOfStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block">
                Urgent reorder needed
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-900/50 shadow-2xs">
            <XCircle className="size-4" />
          </div>
        </div>

        {/* Card 4: Inventory Valuation & Pending Actions */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              Pending Requests / POs
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {metrics.pendingRequests} / {metrics.pendingPOs}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-200/80 dark:border-emerald-900/50 inline-block">
                Est. Value: ${metrics.totalInventoryValue.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <Truck className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CONTENT GRID */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: URGENT LOW STOCK / OUT OF STOCK MONITOR */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Low Stock &amp; Reorder Alerts
                </h3>
              </div>
              <Link
                href="/portal/inventory/low-stock"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>View all</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.lowStockItems.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    All inventory items are well-stocked!
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    No items currently below minimum safety thresholds.
                  </p>
                </div>
              ) : (
                metrics.lowStockItems.map((item) => {
                  const isZero = item.currentStock <= 0;
                  return (
                    <div
                      key={item.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <Link
                          href={`/portal/inventory/items/${item.id}`}
                          className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 truncate block"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {item.sku && <span>SKU: {item.sku}</span>}
                          {item.category && <span>• {item.category.name}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-xs font-bold ${
                              isZero
                                ? 'text-red-600 dark:text-red-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {item.currentStock} {item.unit}
                          </span>
                          <span className="block text-[10px] text-slate-400">
                            Min: {item.minimumStock}
                          </span>
                        </div>
                        <Link
                          href="/portal/inventory/purchase-orders"
                          className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[6px] transition-colors"
                        >
                          Reorder
                        </Link>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: RECENT STOCK MOVEMENTS LEDGER */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-[10px] bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-blue-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                  Recent Stock Movements
                </h3>
              </div>
              <Link
                href="/portal/inventory/movements"
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                <span>Full Ledger</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {metrics.recentMovements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <Package className="size-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">
                    No stock movements recorded yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Stock additions, issues, and adjustments will appear here.
                  </p>
                </div>
              ) : (
                metrics.recentMovements.map((mov) => {
                  const isPositive = mov.quantity > 0;
                  return (
                    <div
                      key={mov.id}
                      className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-2 rounded-full shrink-0 ${
                              mov.type === 'STOCK_RECEIVED'
                                ? 'bg-emerald-500'
                                : mov.type === 'STOCK_ISSUED'
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                            }`}
                          />
                          <Link
                            href={`/portal/inventory/items/${mov.item.id}`}
                            className="font-bold text-xs text-slate-900 dark:text-white hover:text-blue-600 truncate"
                          >
                            {mov.item.name}
                          </Link>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 pl-4">
                          <span>
                            {mov.type.replace(/_/g, ' ')}
                            {mov.referenceId ? ` (#${mov.referenceId})` : ''}
                          </span>
                          {mov.createdBy && <span>• By {mov.createdBy.name}</span>}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-mono font-bold ${
                            isPositive
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPositive ? `+${mov.quantity}` : mov.quantity} {mov.item.unit}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {mov.previousStock} → {mov.newStock}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* QUICK NAVIGATION TILES */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/portal/inventory/items"
            className="p-4 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-[6px] bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                <Package className="size-4" />
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Items &amp; Stock</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Catalog, SKUs, and live levels</p>
            </div>
          </Link>

          <Link
            href="/portal/inventory/requests"
            className="p-4 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-[6px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ClipboardList className="size-4" />
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Item Requests</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Doctor &amp; staff supply orders</p>
            </div>
          </Link>

          <Link
            href="/portal/inventory/purchase-orders"
            className="p-4 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-[6px] bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Truck className="size-4" />
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-purple-600 transition-colors" />
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Purchase Orders</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Supplier POs &amp; Goods Receipt</p>
            </div>
          </Link>

          <Link
            href="/portal/inventory/suppliers"
            className="p-4 rounded-[10px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col justify-between group"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-[6px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <DollarSign className="size-4" />
              </div>
              <ArrowUpRight className="size-3.5 text-slate-400 group-hover:text-amber-600 transition-colors" />
            </div>
            <div className="mt-3">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">Suppliers</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Vendor directory &amp; terms</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
