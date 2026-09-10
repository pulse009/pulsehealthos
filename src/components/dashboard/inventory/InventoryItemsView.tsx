'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Boxes,
  ArrowUpDown,
  Edit2,
  Trash2,
  Clock,
  Layers,
  X,
  AlertCircle,
  ChevronRight,
  TrendingDown,
  RefreshCw,
} from 'lucide-react';

export interface InventoryItemRow {
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
  category?: { id: string; name: string } | null;
  supplier?: { id: string; name: string; phone: string | null } | null;
  _count?: { movements: number; batches: number };
}

export interface CategoryOption {
  id: string;
  name: string;
}

export interface SupplierOption {
  id: string;
  name: string;
}

interface InventoryItemsViewProps {
  initialItems: InventoryItemRow[];
  categories: CategoryOption[];
  suppliers: SupplierOption[];
  clinicName: string;
}

export function InventoryItemsView({
  initialItems,
  categories,
  suppliers,
  clinicName,
}: InventoryItemsViewProps) {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItemRow[]>(initialItems);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState<InventoryItemRow | null>(null);

  // Add/Edit Item Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [unit, setUnit] = useState('PCS');
  const [description, setDescription] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [defaultCost, setDefaultCost] = useState('0');
  const [initialStock, setInitialStock] = useState('0');
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackBatch, setTrackBatch] = useState(false);

  // Quick Receive Form State
  const [receiveItemId, setReceiveItemId] = useState('');
  const [receiveQuantity, setReceiveQuantity] = useState('10');
  const [receiveUnitCost, setReceiveUnitCost] = useState('0');
  const [receiveBatchNumber, setReceiveBatchNumber] = useState('');
  const [receiveExpiryDate, setReceiveExpiryDate] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');

  // Quick Adjust Form State
  const [adjustItemId, setAdjustItemId] = useState('');
  const [adjustQuantity, setAdjustQuantity] = useState('0');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'ALL' && item.category?.id !== selectedCategory) {
        return false;
      }
      if (selectedSupplier !== 'ALL' && item.supplier?.id !== selectedSupplier) {
        return false;
      }
      if (selectedStatus === 'OUT_OF_STOCK' && item.currentStock > 0) return false;
      if (selectedStatus === 'LOW_STOCK' && (item.currentStock <= 0 || item.currentStock > item.minimumStock)) return false;
      if (selectedStatus === 'IN_STOCK' && item.currentStock <= item.minimumStock) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.sku && item.sku.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    });
  }, [items, searchQuery, selectedCategory, selectedStatus, selectedSupplier]);

  // Statistics
  const inStockCount = useMemo(() => items.filter((i) => i.currentStock > i.minimumStock).length, [items]);
  const lowStockCount = useMemo(() => items.filter((i) => i.currentStock > 0 && i.currentStock <= i.minimumStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter((i) => i.currentStock <= 0).length, [items]);

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setName('');
    setSku('');
    setCategoryId(categories[0]?.id || '');
    setSupplierId(suppliers[0]?.id || '');
    setUnit('PCS');
    setDescription('');
    setMinimumStock('5');
    setDefaultCost('0');
    setInitialStock('0');
    setTrackExpiry(false);
    setTrackBatch(false);
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Item name is required.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim() || undefined,
          categoryId: categoryId || undefined,
          supplierId: supplierId || undefined,
          unit: unit.trim() || 'PCS',
          description: description.trim() || undefined,
          minimumStock: parseInt(minimumStock, 10) || 0,
          defaultCost: parseFloat(defaultCost) || 0,
          initialStock: parseInt(initialStock, 10) || 0,
          trackExpiry,
          trackBatch,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create item.');
      }

      setItems((prev) => [data.item, ...prev]);
      setIsAddModalOpen(false);
      setSuccessMsg(`Item "${name}" created successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating item.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiveModal = (item?: InventoryItemRow) => {
    const target = item || items[0];
    if (!target) return;
    setReceiveItemId(target.id);
    setReceiveQuantity('10');
    setReceiveUnitCost(target.defaultCost ? target.defaultCost.toString() : '0');
    setReceiveBatchNumber('');
    setReceiveExpiryDate('');
    setReceiveNotes('');
    setErrorMsg(null);
    setIsReceiveModalOpen(true);
  };

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
          itemId: receiveItemId,
          quantity: qty,
          unitCost: parseFloat(receiveUnitCost) || 0,
          batchNumber: receiveBatchNumber.trim() || undefined,
          expiryDate: receiveExpiryDate || undefined,
          notes: receiveNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to receive stock.');
      }

      // Update local state
      setItems((prev) =>
        prev.map((i) => (i.id === receiveItemId ? { ...i, currentStock: data.newStock } : i)),
      );

      setIsReceiveModalOpen(false);
      setSuccessMsg(`Successfully received ${qty} units of stock.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error receiving stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenAdjustModal = (item: InventoryItemRow) => {
    setSelectedItem(item);
    setAdjustItemId(item.id);
    setAdjustQuantity('0');
    setAdjustNotes('');
    setErrorMsg(null);
    setIsAdjustModalOpen(true);
  };

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseInt(adjustQuantity, 10);
    if (!qty || qty === 0) {
      setErrorMsg('Adjustment quantity cannot be 0.');
      return;
    }
    if (!adjustNotes.trim()) {
      setErrorMsg('Please specify a reason/note for this adjustment.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: adjustItemId,
          quantity: qty,
          notes: adjustNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to adjust stock.');
      }

      setItems((prev) =>
        prev.map((i) => (i.id === adjustItemId ? { ...i, currentStock: data.newStock } : i)),
      );

      setIsAdjustModalOpen(false);
      setSuccessMsg(`Stock adjusted successfully.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adjusting stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/items/${selectedItem.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to delete item.');
      }

      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      setIsDeleteModalOpen(false);
      setSuccessMsg(`Item "${selectedItem.name}" deleted.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting item.');
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
            <Package className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Inventory Items &amp; Stock</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Full item catalog, live stock levels, and safety thresholds for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleOpenReceiveModal()}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] transition-all cursor-pointer shadow-2xs"
          >
            <Plus className="size-3.5" />
            <span>Receive Stock</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            <Plus className="size-3.5" />
            <span>Add Item</span>
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

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-400 tracking-wider uppercase">
              Total Items
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {items.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Catalog total
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Package className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">
              In Stock
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {inStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Adequate stock
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 tracking-wider uppercase">
              Low Stock
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {lowStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Reorder suggested
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase">
              Out of Stock
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {outOfStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-100 dark:border-rose-900/50 inline-block">
                Zero units
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/80 dark:bg-rose-950/60 text-rose-500 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100/70 dark:border-rose-900/50 shadow-2xs">
            <XCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR & FILTERS */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock</option>
            <option value="LOW_STOCK">Low Stock</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Supplier Filter */}
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Field */}
        <div className="relative w-64 sm:w-72 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items, SKU, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 4. MAIN ITEMS TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6">Item &amp; SKU</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Unit</th>
                <th className="py-2.5 px-4">Current Stock</th>
                <th className="py-2.5 px-4">Min. Level</th>
                <th className="py-2.5 px-4">Cost</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Package className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No inventory items found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search criteria.'
                        : 'Click "Add Item" above to add products to your inventory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock = item.currentStock > 0 && item.currentStock <= item.minimumStock;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-white">
                        <Link
                          href={`/portal/inventory/items/${item.id}`}
                          className="font-bold text-xs hover:text-[#0d6157] dark:hover:text-teal-300 transition-colors block"
                        >
                          {item.name}
                        </Link>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          {item.sku && (
                            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-[4px]">
                              {item.sku}
                            </span>
                          )}
                          {item.trackExpiry && (
                            <span className="text-[#0d6157] dark:text-teal-400 font-medium" title="Expiry tracking enabled">
                              • Expiry Tracked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {item.category ? (
                          <span className="bg-[#e6f6f3] text-[#0d5c56] dark:bg-[#0d6157]/20 dark:text-teal-300 border border-[#0d8276]/20 px-2 py-0.5 rounded-[6px] text-[11px] font-medium inline-block">
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px]">
                        {item.unit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4">
                        <span
                          className={`font-black text-xs ${
                            isOutOfStock
                              ? 'text-rose-600 dark:text-rose-400'
                              : isLowStock
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                      </td>

                      {/* Minimum Stock */}
                      <td className="py-3 px-4 text-slate-500 font-medium text-[11px]">
                        {item.minimumStock}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        ${item.defaultCost ? item.defaultCost.toFixed(2) : '0.00'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenReceiveModal(item)}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
                            title="Receive Stock"
                          >
                            Receive
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenAdjustModal(item)}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[8px] transition-colors cursor-pointer shadow-2xs"
                            title="Adjust Stock"
                          >
                            Adjust
                          </button>
                          <Link
                            href={`/portal/inventory/items/${item.id}`}
                            className="px-3 py-1 text-[10px] font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] transition-all shadow-xs"
                          >
                            Detail
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

      {/* MODAL 1: ADD ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300">
                  <Package className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Add Inventory Item</h3>
                  <p className="text-[10px] text-slate-400">Add medical supplies or consumable product</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateItem} className="space-y-3">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Item Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Latex Examination Gloves (M)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GLV-MED-01"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Unit of Measure *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BOX, PCS, ML, VIAL"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  >
                    <option value="">-- No Category --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default Supplier
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  >
                    <option value="">-- No Supplier --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Min Stock Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minimumStock}
                    onChange={(e) => setMinimumStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={defaultCost}
                    onChange={(e) => setDefaultCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              {/* Tracking Flags */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[8px] space-y-2 border border-slate-200/60 dark:border-slate-700/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackExpiry}
                    onChange={(e) => setTrackExpiry(e.target.checked)}
                    className="rounded text-[#0d6157] focus:ring-[#0d8276]"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Track Expiry Dates (for medicines &amp; skincare)
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={trackBatch}
                    onChange={(e) => setTrackBatch(e.target.checked)}
                    className="rounded text-[#0d6157] focus:ring-[#0d8276]"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    Track Batch / Lot Numbers
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Description / Usage Instructions
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or specifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUICK RECEIVE STOCK */}
      {isReceiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Plus className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Receive Stock</h3>
                  <p className="text-[10px] text-slate-400">Add physical inventory &amp; log movement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Select Item *
                </label>
                <select
                  value={receiveItemId}
                  onChange={(e) => {
                    setReceiveItemId(e.target.value);
                    const sel = items.find((i) => i.id === e.target.value);
                    if (sel?.defaultCost) setReceiveUnitCost(sel.defaultCost.toString());
                  }}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Quantity Received *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={receiveQuantity}
                    onChange={(e) => setReceiveQuantity(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
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
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Notes / Supplier Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Delivery Challan #DC-881"
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
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
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Receiving...' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QUICK ADJUST STOCK */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-5 relative text-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <RefreshCw className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Adjust Stock Level</h3>
                  <p className="text-[10px] text-slate-400">{selectedItem.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
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
                  {selectedItem.currentStock} {selectedItem.unit}
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
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  New stock will be:{' '}
                  <strong className="text-slate-800 dark:text-white">
                    {selectedItem.currentStock + (parseInt(adjustQuantity, 10) || 0)} {selectedItem.unit}
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
                  placeholder="e.g. Damage in clinic, physical audit discrepancy, return to vendor..."
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
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
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
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
