'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  ChevronDown,
  Check,
  Tag,
  Truck,
  TrendingDown,
  RefreshCw,
  Building2,
  Pill,
  Stethoscope,
  FlaskConical,
  Share2,
  MoreVertical,
  Eye,
} from 'lucide-react';
import { cn } from '@/components/ui/primitives';

export type InventoryScopeType = 'PHARMACY' | 'CLINIC' | 'LABORATORY' | 'SHARED';

export interface InventoryItemRow {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  description: string | null;
  inventoryScope?: InventoryScopeType;
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

  // Dynamic Categories & Suppliers
  const [categoryList, setCategoryList] = useState<CategoryOption[]>(categories);
  const [supplierList, setSupplierList] = useState<SupplierOption[]>(suppliers);

  // Searchable Category Dropdown State
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Searchable Supplier Dropdown State
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierPhone, setNewSupplierPhone] = useState('');
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);

  // Refs for click outside handling
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false);
        setIsCreatingCategory(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
        setIsCreatingSupplier(false);
      }
      const target = event.target as HTMLElement;
      if (!target.closest('.action-menu-dropdown') && !target.closest('.action-menu-trigger')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Category List for Searchable Dropdown
  const filteredCategoryOptions = useMemo(() => {
    if (!categorySearchQuery.trim()) return categoryList;
    const q = categorySearchQuery.toLowerCase().trim();
    return categoryList.filter((c) => c.name.toLowerCase().includes(q));
  }, [categoryList, categorySearchQuery]);

  // Filtered Supplier List for Searchable Dropdown
  const filteredSupplierOptions = useMemo(() => {
    if (!supplierSearchQuery.trim()) return supplierList;
    const q = supplierSearchQuery.toLowerCase().trim();
    return supplierList.filter((s) => s.name.toLowerCase().includes(q));
  }, [supplierList, supplierSearchQuery]);

  // Quick Create Category on the fly
  const handleQuickCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create category');
      }
      const created = data.category;
      setCategoryList((prev) => [...prev, { id: created.id, name: created.name }]);
      setCategoryId(created.id);
      setIsCreatingCategory(false);
      setNewCategoryName('');
      setCategorySearchQuery('');
      setIsCategoryDropdownOpen(false);
    } catch (err: any) {
      alert(`Error creating category: ${err.message}`);
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Quick Create Supplier on the fly
  const handleQuickCreateSupplier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newSupplierName.trim()) return;

    setIsSavingSupplier(true);
    try {
      const res = await fetch('/api/inventory/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSupplierName.trim(),
          phone: newSupplierPhone.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }
      const created = data.supplier;
      setSupplierList((prev) => [...prev, { id: created.id, name: created.name }]);
      setSupplierId(created.id);
      setIsCreatingSupplier(false);
      setNewSupplierName('');
      setNewSupplierPhone('');
      setSupplierSearchQuery('');
      setIsSupplierDropdownOpen(false);
    } catch (err: any) {
      alert(`Error creating supplier: ${err.message}`);
    } finally {
      setIsSavingSupplier(false);
    }
  };

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<'ALL' | InventoryScopeType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<InventoryItemRow | null>(null);

  // Add/Edit Item Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [inventoryScope, setInventoryScope] = useState<InventoryScopeType>('SHARED');
  const [unit, setUnit] = useState('PCS');
  const [description, setDescription] = useState('');
  const [minimumStock, setMinimumStock] = useState('5');
  const [defaultCost, setDefaultCost] = useState('0');
  const [initialStock, setInitialStock] = useState('0');
  const [trackExpiry, setTrackExpiry] = useState(false);
  const [trackBatch, setTrackBatch] = useState(false);

  // Quick Receive Form State
  const [receiveItemId, setReceiveItemId] = useState('');
  const [receiveScope, setReceiveScope] = useState<InventoryScopeType>('SHARED');
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

  // Department breakdown counts
  const scopeCounts = useMemo(() => {
    return {
      all: items.length,
      pharmacy: items.filter((i) => i.inventoryScope === 'PHARMACY').length,
      clinic: items.filter((i) => i.inventoryScope === 'CLINIC').length,
      laboratory: items.filter((i) => i.inventoryScope === 'LABORATORY').length,
      shared: items.filter((i) => i.inventoryScope === 'SHARED' || !i.inventoryScope).length,
    };
  }, [items]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const itemScope = item.inventoryScope || 'SHARED';
      if (selectedScope !== 'ALL' && itemScope !== selectedScope) {
        return false;
      }
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
        (item.description && item.description.toLowerCase().includes(q)) ||
        itemScope.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, selectedScope, selectedCategory, selectedStatus, selectedSupplier]);

  // Statistics
  const inStockCount = useMemo(() => items.filter((i) => i.currentStock > i.minimumStock).length, [items]);
  const lowStockCount = useMemo(() => items.filter((i) => i.currentStock > 0 && i.currentStock <= i.minimumStock).length, [items]);
  const outOfStockCount = useMemo(() => items.filter((i) => i.currentStock <= 0).length, [items]);

  const handleOpenAddModal = () => {
    setSelectedItem(null);
    setName('');
    setSku('');
    setCategoryId('');
    setSupplierId('');
    setIsCategoryDropdownOpen(false);
    setCategorySearchQuery('');
    setIsCreatingCategory(false);
    setNewCategoryName('');
    setIsSupplierDropdownOpen(false);
    setSupplierSearchQuery('');
    setIsCreatingSupplier(false);
    setNewSupplierName('');
    setNewSupplierPhone('');
    setInventoryScope(selectedScope !== 'ALL' ? selectedScope : 'SHARED');
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
          inventoryScope,
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
      setSuccessMsg(`Item "${name}" created for ${inventoryScope} department.`);
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
    setReceiveScope(target.inventoryScope || 'SHARED');
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
          inventoryScope: receiveScope,
          notes: receiveNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to receive stock.');
      }

      // Update local state
      setItems((prev) =>
        prev.map((i) =>
          i.id === receiveItemId
            ? { ...i, currentStock: data.newStock, inventoryScope: receiveScope }
            : i
        ),
      );

      setIsReceiveModalOpen(false);
      setSuccessMsg(`Successfully received ${qty} units of stock for ${receiveScope}.`);
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

  const handleOpenDeleteModal = (item: InventoryItemRow) => {
    setSelectedItem(item);
    setErrorMsg(null);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/items/${selectedItem.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to cancel/remove item.');
      }

      setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
      setIsDeleteModalOpen(false);
      setSuccessMsg(`"${selectedItem.name}" has been removed from inventory.`);
      setTimeout(() => setSuccessMsg(null), 4000);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing item.');
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
            <span>Inventory Items &amp; Department Stocks</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Full item catalog, department stock segregation (Pharmacy, Clinic, Lab, Shared) for{' '}
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
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {items.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3]/80 dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                All Departments
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
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
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
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
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
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
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

      {/* 3. DEPARTMENT STOCK SEGREGATION TABS */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center gap-1.5 overflow-x-auto shrink-0">
        {[
          { id: 'ALL', label: `All Inventory (${scopeCounts.all})`, icon: Boxes },
          { id: 'PHARMACY', label: `Pharmacy Stock (${scopeCounts.pharmacy})`, icon: Pill },
          { id: 'CLINIC', label: `Clinic Stock (${scopeCounts.clinic})`, icon: Stethoscope },
          { id: 'LABORATORY', label: `Laboratory Stock (${scopeCounts.laboratory})`, icon: FlaskConical },
          { id: 'SHARED', label: `Shared Stock (${scopeCounts.shared})`, icon: Share2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedScope === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedScope(tab.id as any)}
              className={cn(
                'px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5',
                isActive
                  ? 'bg-[#0d6157] text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/70 dark:border-slate-700'
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. TOOLBAR & FILTERS */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
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
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:border-[#0d8276] focus:ring-2 focus:ring-[#0d8276]/10 cursor-pointer shadow-2xs"
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
            placeholder="Search items, SKU, department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* 5. MAIN ITEMS TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6 whitespace-nowrap">Item &amp; SKU</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Stock For (Dept)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Category</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Unit</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Current Stock</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Min. Level</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Cost (SAR)</th>
                <th className="py-2.5 px-4 whitespace-nowrap">Status</th>
                <th className="py-2.5 px-6 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Package className="size-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No inventory items found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {searchQuery
                        ? 'Try adjusting your search or department filter.'
                        : 'Click "Add Item" above to add products to your inventory.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.currentStock <= 0;
                  const isLowStock = item.currentStock > 0 && item.currentStock <= item.minimumStock;
                  const scope = item.inventoryScope || 'SHARED';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-[#f0f9f7]/60 dark:hover:bg-[#0d6157]/10 transition-colors"
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                        <Link
                          href={`/portal/inventory/items/${item.id}`}
                          className="font-bold text-xs hover:text-[#0d6157] dark:hover:text-teal-300 transition-colors inline-block"
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
                            <span className="text-[#0d6157] dark:text-teal-400 font-medium whitespace-nowrap" title="Expiry tracking enabled">
                              • Expiry Tracked
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Stock For (Department Badge) */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {scope === 'PHARMACY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-teal-50 text-[#0d6157] border border-teal-200 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-300">
                            <Pill className="size-3" /> Pharmacy
                          </span>
                        ) : scope === 'CLINIC' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300">
                            <Stethoscope className="size-3" /> Clinic
                          </span>
                        ) : scope === 'LABORATORY' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300">
                            <FlaskConical className="size-3" /> Laboratory
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">
                            <Share2 className="size-3" /> Shared
                          </span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.category ? (
                          <span className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-[6px] text-[11px] font-medium inline-block whitespace-nowrap">
                            {item.category.name}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Unit */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700 dark:text-slate-300 text-[11px] whitespace-nowrap">
                        {item.unit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`font-black font-mono text-xs ${
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
                      <td className="py-3 px-4 text-slate-500 font-mono font-medium text-[11px] whitespace-nowrap">
                        {item.minimumStock}
                      </td>

                      {/* Cost */}
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-mono font-medium whitespace-nowrap">
                        SAR {item.defaultCost ? item.defaultCost.toFixed(2) : '0.00'}
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800 whitespace-nowrap">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 whitespace-nowrap">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 whitespace-nowrap">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-6 text-right whitespace-nowrap relative">
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === item.id ? null : item.id);
                            }}
                            className="action-menu-trigger p-1.5 rounded-[8px] hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                            title="Actions"
                          >
                            <MoreVertical className="size-4" />
                          </button>
                        </div>

                        {/* Three Dots Dropdown Menu */}
                        {activeMenuId === item.id && (
                          <div
                            className="action-menu-dropdown absolute right-6 top-10 w-44 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-1.5 z-40 text-left animate-in fade-in zoom-in-95 duration-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenReceiveModal(item);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                            >
                              <Plus className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                              <span>Receive Stock</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenAdjustModal(item);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                            >
                              <RefreshCw className="size-3.5 text-amber-600 dark:text-amber-400" />
                              <span>Adjust Stock</span>
                            </button>
                            <Link
                              href={`/portal/inventory/items/${item.id}`}
                              onClick={() => setActiveMenuId(null)}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-left"
                            >
                              <Eye className="size-3.5 text-[#0d6157] dark:text-teal-400" />
                              <span>View Details</span>
                            </Link>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuId(null);
                                handleOpenDeleteModal(item);
                              }}
                              className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
                            >
                              <Trash2 className="size-3.5" />
                              <span>Cancel / Delete Item</span>
                            </button>
                          </div>
                        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full relative text-xs max-h-[90vh] flex flex-col overflow-hidden">
            {/* Fixed / Pinned Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d6157] dark:text-teal-300">
                  <Package className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Add Inventory Item</h3>
                  <p className="text-[10px] text-slate-400">Add medical supplies, drugs, or lab reagents</p>
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

            {/* Form with Scrollable Body and Fixed Footer */}
            <form onSubmit={handleCreateItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
                {errorMsg && (
                  <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                    <AlertCircle className="size-3.5 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* 1. Item Name */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Panadol Extra 500mg, EDTA Blood Tube, Latex Gloves"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] font-medium"
                  />
                </div>

              {/* 2. Stock For: Department Allocation (REQUIRED) */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[10px] border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="size-3.5 text-[#0d6157]" />
                    <span>Stock For (Department) *</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Independent of Category</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
                  {[
                    { id: 'PHARMACY', label: 'Pharmacy', icon: Pill, desc: 'Prescribed Drugs' },
                    { id: 'CLINIC', label: 'Clinic', icon: Stethoscope, desc: 'Clinical Supplies' },
                    { id: 'LABORATORY', label: 'Laboratory', icon: FlaskConical, desc: 'Tubes & Reagents' },
                    { id: 'SHARED', label: 'Shared', icon: Share2, desc: 'Gloves & General' },
                  ].map((dept) => {
                    const Icon = dept.icon;
                    const isSelected = inventoryScope === dept.id;
                    return (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setInventoryScope(dept.id as any)}
                        className={cn(
                          'p-2 rounded-[8px] border text-center transition-all cursor-pointer flex flex-col items-center gap-1',
                          isSelected
                            ? 'bg-[#0d6157] text-white border-[#0d6157] shadow-2xs font-bold'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        )}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="text-[11px] leading-none">{dept.label}</span>
                        <span className={cn('text-[9px]', isSelected ? 'text-teal-100' : 'text-slate-400')}>
                          {dept.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. SKU & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Item Code / SKU
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MED-PAN-500"
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
                    placeholder="e.g. BOX, PCS, VIAL, ML"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white uppercase font-mono focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  />
                </div>
              </div>

              {/* 4. Category & Supplier (Searchable & Scrollable Dropdowns with Quick Create) */}
              <div className="grid grid-cols-2 gap-3">
                {/* Searchable Category Dropdown */}
                <div className="relative" ref={categoryDropdownRef}>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Category (Product Type)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCategoryDropdownOpen((prev) => !prev);
                      setIsSupplierDropdownOpen(false);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] cursor-pointer"
                  >
                    <span className={cn("truncate font-medium", !categoryId && "text-slate-400")}>
                      {categoryList.find((c) => c.id === categoryId)?.name || '-- No Category --'}
                    </span>
                    <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-1.5" />
                  </button>

                  {/* Dropdown Panel */}
                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {!isCreatingCategory ? (
                        <div className="p-2 space-y-1.5">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              value={categorySearchQuery}
                              onChange={(e) => setCategorySearchQuery(e.target.value)}
                              placeholder="Search categories..."
                              className="w-full pl-7 pr-6 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                              autoFocus
                            />
                            {categorySearchQuery && (
                              <button
                                type="button"
                                onClick={() => setCategorySearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>

                          {/* List (shows up to 5 items + smooth scrollbar) */}
                          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setCategoryId('');
                                setIsCategoryDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                                !categoryId && "bg-[#e6f6f3] text-[#0d6157] font-bold dark:bg-teal-950/40 dark:text-teal-300"
                              )}
                            >
                              <span>-- No Category --</span>
                              {!categoryId && <Check className="size-3 text-[#0d6157] dark:text-teal-300" />}
                            </button>

                            {filteredCategoryOptions.length === 0 ? (
                              <div className="p-2.5 text-center text-xs text-slate-400">
                                No category matching &ldquo;{categorySearchQuery}&rdquo;
                              </div>
                            ) : (
                              filteredCategoryOptions.map((cat) => (
                                <button
                                  key={cat.id}
                                  type="button"
                                  onClick={() => {
                                    setCategoryId(cat.id);
                                    setIsCategoryDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                                    categoryId === cat.id && "bg-[#e6f6f3] text-[#0d6157] font-bold dark:bg-teal-950/40 dark:text-teal-300"
                                  )}
                                >
                                  <span className="truncate">{cat.name}</span>
                                  {categoryId === cat.id && <Check className="size-3 text-[#0d6157] dark:text-teal-300" />}
                                </button>
                              ))
                            )}
                          </div>

                          {/* Action Button: Create New Category */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingCategory(true);
                                setNewCategoryName(categorySearchQuery);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#0d6157] dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 rounded-[6px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>+ Create New Category</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Inline Quick Create Form */
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                            <span>Create New Category</span>
                            <button
                              type="button"
                              onClick={() => setIsCreatingCategory(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="e.g. Antibiotics, Surgical Supplies"
                            className="w-full px-2.5 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickCreateCategory();
                              }
                            }}
                          />
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCreatingCategory(false)}
                              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickCreateCategory()}
                              disabled={isSavingCategory || !newCategoryName.trim()}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[6px] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              {isSavingCategory ? <RefreshCw className="size-3 animate-spin" /> : <Check className="size-3" />}
                              <span>Save &amp; Select</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Searchable Supplier Dropdown */}
                <div className="relative" ref={supplierDropdownRef}>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Default Supplier
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSupplierDropdownOpen((prev) => !prev);
                      setIsCategoryDropdownOpen(false);
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276] cursor-pointer"
                  >
                    <span className={cn("truncate font-medium", !supplierId && "text-slate-400")}>
                      {supplierList.find((s) => s.id === supplierId)?.name || '-- No Supplier --'}
                    </span>
                    <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-1.5" />
                  </button>

                  {/* Dropdown Panel */}
                  {isSupplierDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {!isCreatingSupplier ? (
                        <div className="p-2 space-y-1.5">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
                            <input
                              type="text"
                              value={supplierSearchQuery}
                              onChange={(e) => setSupplierSearchQuery(e.target.value)}
                              placeholder="Search suppliers..."
                              className="w-full pl-7 pr-6 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                              autoFocus
                            />
                            {supplierSearchQuery && (
                              <button
                                type="button"
                                onClick={() => setSupplierSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                              >
                                <X className="size-3" />
                              </button>
                            )}
                          </div>

                          {/* List (shows up to 5 items + smooth scrollbar) */}
                          <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setSupplierId('');
                                setIsSupplierDropdownOpen(false);
                              }}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                                !supplierId && "bg-[#e6f6f3] text-[#0d6157] font-bold dark:bg-teal-950/40 dark:text-teal-300"
                              )}
                            >
                              <span>-- No Supplier --</span>
                              {!supplierId && <Check className="size-3 text-[#0d6157] dark:text-teal-300" />}
                            </button>

                            {filteredSupplierOptions.length === 0 ? (
                              <div className="p-2.5 text-center text-xs text-slate-400">
                                No supplier matching &ldquo;{supplierSearchQuery}&rdquo;
                              </div>
                            ) : (
                              filteredSupplierOptions.map((sup) => (
                                <button
                                  key={sup.id}
                                  type="button"
                                  onClick={() => {
                                    setSupplierId(sup.id);
                                    setIsSupplierDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full text-left px-2.5 py-1.5 rounded flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                                    supplierId === sup.id && "bg-[#e6f6f3] text-[#0d6157] font-bold dark:bg-teal-950/40 dark:text-teal-300"
                                  )}
                                >
                                  <span className="truncate">{sup.name}</span>
                                  {supplierId === sup.id && <Check className="size-3 text-[#0d6157] dark:text-teal-300" />}
                                </button>
                              ))
                            )}
                          </div>

                          {/* Action Button: Create New Supplier */}
                          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingSupplier(true);
                                setNewSupplierName(supplierSearchQuery);
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-bold text-[#0d6157] dark:text-teal-400 bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 rounded-[6px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="size-3.5" />
                              <span>+ Create New Supplier</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Inline Quick Create Form */
                        <div className="p-3 space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-white">
                            <span>Create New Supplier</span>
                            <button
                              type="button"
                              onClick={() => setIsCreatingSupplier(false)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                          <input
                            type="text"
                            value={newSupplierName}
                            onChange={(e) => setNewSupplierName(e.target.value)}
                            placeholder="Supplier Name (e.g. Novartis, Gulf Med)"
                            className="w-full px-2.5 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={newSupplierPhone}
                            onChange={(e) => setNewSupplierPhone(e.target.value)}
                            placeholder="Contact Phone (Optional)"
                            className="w-full px-2.5 py-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleQuickCreateSupplier();
                              }
                            }}
                          />
                          <div className="flex items-center justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setIsCreatingSupplier(false)}
                              className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuickCreateSupplier()}
                              disabled={isSavingSupplier || !newSupplierName.trim()}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[6px] disabled:opacity-50 cursor-pointer flex items-center gap-1"
                            >
                              {isSavingSupplier ? <RefreshCw className="size-3 animate-spin" /> : <Check className="size-3" />}
                              <span>Save &amp; Select</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 5. Stock Levels & Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Min Reorder Level
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
                    Unit Cost / Sale Price (SAR)
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

              {/* Informative Note: Zero Opening Stock */}
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 rounded-[8px] flex items-center gap-2 text-blue-700 dark:text-blue-300 text-[11px]">
                <Boxes className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>
                  Items are registered with <strong>0 stock (Out of Stock)</strong>. Use <strong>&ldquo;Receive Stock&rdquo;</strong> to record physical batches and incoming stock.
                </span>
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
                    Track Expiry Dates (for medications, reagents &amp; consumables)
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
                  Description / Usage Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional specifications or clinical usage notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                />
              </div>
            </div>

            {/* Fixed / Pinned Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => {
                  const form = (e.currentTarget.closest('div.bg-white') as HTMLElement)?.querySelector('form');
                  if (form) form.requestSubmit();
                }}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full relative text-xs max-h-[90vh] flex flex-col overflow-hidden">
            {/* Fixed / Pinned Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Plus className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Receive Stock</h3>
                  <p className="text-[10px] text-slate-400">Add physical inventory &amp; allocate department</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Form Body & Fixed Footer */}
            <form onSubmit={handleReceiveStock} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
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
                      if (sel) {
                        setReceiveScope(sel.inventoryScope || 'SHARED');
                        if (sel.defaultCost) setReceiveUnitCost(sel.defaultCost.toString());
                      }
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-[#0d8276]/10 focus:border-[#0d8276]"
                  >
                    {items.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} [{i.inventoryScope || 'SHARED'}] (Stock: {i.currentStock} {i.unit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Stock For: Department Selection in Receive Modal */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Stock For (Target Department) *
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'PHARMACY', label: 'Pharmacy' },
                      { id: 'CLINIC', label: 'Clinic' },
                      { id: 'LABORATORY', label: 'Lab' },
                      { id: 'SHARED', label: 'Shared' },
                    ].map((dept) => (
                      <button
                        key={dept.id}
                        type="button"
                        onClick={() => setReceiveScope(dept.id as any)}
                        className={cn(
                          'py-1.5 px-2 rounded-[6px] border text-center text-[11px] font-bold transition-all cursor-pointer',
                          receiveScope === dept.id
                            ? 'bg-[#0d6157] text-white border-[#0d6157]'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        )}
                      >
                        {dept.label}
                      </button>
                    ))}
                  </div>
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
                      Unit Cost (SAR)
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
              </div>

              {/* Fixed / Pinned Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsReceiveModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full relative text-xs max-h-[90vh] flex flex-col overflow-hidden">
            {/* Fixed / Pinned Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
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
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Body & Fixed Footer */}
            <form onSubmit={handleAdjustStock} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
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
                    <strong className="text-slate-800 dark:text-white font-mono">
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
              </div>

              {/* Fixed / Pinned Footer */}
              <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0d6157] hover:bg-[#0a4e46] text-white rounded-[8px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Apply Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: DELETE / CANCEL ITEM CONFIRMATION */}
      {isDeleteModalOpen && selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full relative text-xs max-h-[90vh] flex flex-col overflow-hidden">
            {/* Fixed / Pinned Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[8px] bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Cancel &amp; Remove Item</h3>
                  <p className="text-[10px] text-slate-400">Confirmation required</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-5 overflow-y-auto space-y-3.5 flex-1 custom-scrollbar">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 rounded-xl space-y-1">
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Are you sure you want to cancel / remove this item?
                </p>
                <p className="text-[11px] text-rose-700/90 dark:text-rose-300/80 leading-relaxed">
                  This action will archive or remove <strong>{selectedItem.name}</strong> from the active inventory catalog.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-[8px] border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Item Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedItem.name}</span>
                </div>
                {selectedItem.sku && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">SKU:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{selectedItem.sku}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Stock For:</span>
                  <span className="font-bold text-[#0d6157] dark:text-teal-400">{selectedItem.inventoryScope || 'SHARED'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Current Stock:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {selectedItem.currentStock} {selectedItem.unit}
                  </span>
                </div>
              </div>

              {selectedItem.currentStock > 0 && (
                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-[8px] flex items-center gap-2 text-amber-800 dark:text-amber-300 text-[11px]">
                  <AlertTriangle className="size-3.5 shrink-0 text-amber-600" />
                  <span>Notice: This item currently has <strong>{selectedItem.currentStock} units</strong> in stock.</span>
                </div>
              )}
            </div>

            {/* Fixed / Pinned Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 z-10">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px] cursor-pointer"
              >
                Keep Item
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-[8px] shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Cancelling...' : 'Yes, Cancel / Delete Item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
