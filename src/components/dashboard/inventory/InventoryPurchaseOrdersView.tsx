'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Calendar,
  DollarSign,
  AlertCircle,
  X,
  ChevronRight,
  ArrowDownRight,
  Send,
  Ban,
} from 'lucide-react';

export interface PurchaseOrderRow {
  id: string;
  poNumber: string;
  orderDate: string | Date;
  expectedDate: string | Date | null;
  status: string;
  totalAmount: number;
  notes: string | null;
  createdAt: string | Date;
  supplier: { id: string; name: string; phone: string | null; email: string | null };
  createdBy: { id: string; name: string };
  items: Array<{
    id: string;
    itemId: string;
    quantity: number;
    receivedQuantity: number;
    unitCost: number;
    totalCost: number;
    item: { id: string; name: string; sku: string | null; unit: string; currentStock: number };
  }>;
}

export interface SupplierOption {
  id: string;
  name: string;
}

export interface ItemOption {
  id: string;
  name: string;
  sku: string | null;
  unit: string;
  defaultCost: number | null;
  supplierId: string | null;
}

interface InventoryPurchaseOrdersViewProps {
  initialPOs: PurchaseOrderRow[];
  suppliers: SupplierOption[];
  availableItems: ItemOption[];
  clinicName: string;
}

export function InventoryPurchaseOrdersView({
  initialPOs,
  suppliers,
  availableItems,
  clinicName,
}: InventoryPurchaseOrdersViewProps) {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderRow[]>(initialPOs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('ALL');

  // Modals
  const [isNewPOModalOpen, setIsNewPOModalOpen] = useState(false);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderRow | null>(null);

  // New PO Form State
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<
    Array<{ itemId: string; quantity: number; unitCost: number }>
  >([{ itemId: availableItems[0]?.id || '', quantity: 10, unitCost: availableItems[0]?.defaultCost || 0 }]);

  // Receive Goods Form State (Multi-item received)
  const [receiveItems, setReceiveItems] = useState<
    Array<{
      poItemId: string;
      itemId: string;
      itemName: string;
      unit: string;
      orderedQty: number;
      alreadyReceivedQty: number;
      receiveQty: number;
      batchNumber: string;
      expiryDate: string;
    }>
  >([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      if (selectedStatus !== 'ALL' && po.status !== selectedStatus) return false;
      if (selectedSupplier !== 'ALL' && po.supplier?.id !== selectedSupplier) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        po.poNumber.toLowerCase().includes(q) ||
        (po.supplier?.name || '').toLowerCase().includes(q) ||
        po.items.some((i) => i.item.name.toLowerCase().includes(q))
      );
    });
  }, [purchaseOrders, searchQuery, selectedStatus, selectedSupplier]);

  const issuedCount = useMemo(
    () => purchaseOrders.filter((po) => po.status === 'ISSUED' || po.status === 'DRAFT').length,
    [purchaseOrders],
  );
  const partiallyReceivedCount = useMemo(
    () => purchaseOrders.filter((po) => po.status === 'PARTIALLY_RECEIVED').length,
    [purchaseOrders],
  );
  const completedCount = useMemo(
    () => purchaseOrders.filter((po) => po.status === 'RECEIVED').length,
    [purchaseOrders],
  );

  const handleAddPOItemRow = () => {
    const first = availableItems[0];
    if (!first) return;
    setPoItems((prev) => [
      ...prev,
      {
        itemId: first.id,
        quantity: 10,
        unitCost: first.defaultCost || 0,
      },
    ]);
  };

  const handleRemovePOItemRow = (index: number) => {
    setPoItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePOItemChange = (index: number, itemId: string) => {
    const item = availableItems.find((i) => i.id === itemId);
    setPoItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              itemId,
              unitCost: item?.defaultCost || row.unitCost,
            }
          : row,
      ),
    );
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId) {
      setErrorMsg('Please select a supplier.');
      return;
    }
    if (poItems.length === 0) {
      setErrorMsg('Please add at least one item to this purchase order.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/inventory/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          expectedDate: expectedDate || undefined,
          notes: poNotes.trim() || undefined,
          items: poItems.map((pi) => ({
            itemId: pi.itemId,
            quantity: pi.quantity,
            unitCost: pi.unitCost,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to create purchase order.');

      setPurchaseOrders((prev) => [data.purchaseOrder, ...prev]);
      setIsNewPOModalOpen(false);
      setSuccessMsg(`Purchase Order #${data.purchaseOrder.poNumber} created.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating purchase order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReceiveModal = (po: PurchaseOrderRow) => {
    setSelectedPO(po);
    const initialReceiveRows = po.items.map((pi) => {
      const remaining = Math.max(0, pi.quantity - pi.receivedQuantity);
      return {
        poItemId: pi.id,
        itemId: pi.itemId,
        itemName: pi.item.name,
        unit: pi.item.unit,
        orderedQty: pi.quantity,
        alreadyReceivedQty: pi.receivedQuantity,
        receiveQty: remaining,
        batchNumber: '',
        expiryDate: '',
      };
    });
    setReceiveItems(initialReceiveRows);
    setErrorMsg(null);
    setIsReceiveModalOpen(true);
  };

  const handleConfirmReceive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPO) return;

    // Filter only items with receiveQty > 0
    const itemsToReceive = receiveItems
      .filter((r) => r.receiveQty > 0)
      .map((r) => ({
        poItemId: r.poItemId,
        itemId: r.itemId,
        quantityToReceive: Number(r.receiveQty),
        batchNumber: r.batchNumber?.trim() || undefined,
        expiryDate: r.expiryDate || undefined,
      }));

    if (itemsToReceive.length === 0) {
      setErrorMsg('Please specify a received quantity greater than 0 for at least one item.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/inventory/purchase-orders/${selectedPO.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivedItems: itemsToReceive,
          notes: `Goods received for PO #${selectedPO.poNumber}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        let msg = 'Failed to receive goods.';
        if (typeof data.error === 'string') {
          msg = data.error;
        } else if (data.error?.message) {
          msg = data.error.message;
        } else if (data.message) {
          msg = data.message;
        }
        throw new Error(msg);
      }

      setPurchaseOrders((prev) =>
        prev.map((po) =>
          po.id === selectedPO.id
            ? {
                ...po,
                ...data.purchaseOrder,
                supplier: data.purchaseOrder?.supplier || po.supplier,
                createdBy: data.purchaseOrder?.createdBy || po.createdBy,
              }
            : po,
        ),
      );

      setIsReceiveModalOpen(false);
      setSuccessMsg(`Goods received & inventory updated for PO #${selectedPO.poNumber}.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      const errText = typeof err?.message === 'string' ? err.message : 'Error receiving PO goods.';
      setErrorMsg(errText);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePOStatus = async (poId: string, newStatus: 'SENT' | 'CANCELLED' | 'DRAFT') => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/inventory/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: poId,
          status: newStatus,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to update PO status.');

      setPurchaseOrders((prev) =>
        prev.map((po) => (po.id === poId ? { ...po, status: newStatus } : po)),
      );
      if (selectedPO?.id === poId) {
        setSelectedPO((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
      setSuccessMsg(
        newStatus === 'SENT'
          ? 'Purchase order marked as Sent to Supplier.'
          : newStatus === 'CANCELLED'
            ? 'Purchase order cancelled.'
            : 'Purchase order updated.',
      );
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating PO status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP HEADER */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <span>Purchase Orders &amp; Sourcing</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Supplier procurement, PO lifecycle, and goods receiving for{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{clinicName}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSupplierId(suppliers[0]?.id || '');
            setExpectedDate('');
            setPoNotes('');
            setPoItems([
              {
                itemId: availableItems[0]?.id || '',
                quantity: 10,
                unitCost: availableItems[0]?.defaultCost || 0,
              },
            ]);
            setErrorMsg(null);
            setIsNewPOModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Plus className="size-3.5" />
          <span>New Purchase Order</span>
        </button>
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
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Purchase Orders
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {purchaseOrders.length}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                All-time POs
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <FileText className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Issued / Pending
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {issuedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-blue-100 dark:border-blue-900/50 inline-block">
                Awaiting supplier delivery
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-blue-50/80 dark:bg-blue-950/60 text-blue-500 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100/70 dark:border-blue-900/50 shadow-2xs">
            <Truck className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Partially Received
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {partiallyReceivedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-100 dark:border-amber-900/50 inline-block">
                Partial delivery logged
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/80 dark:bg-amber-950/60 text-amber-500 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-100/70 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Completed / Fully Received
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
              {completedCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-100 dark:border-emerald-900/50 inline-block">
                Stock fully in inventory
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/80 dark:bg-emerald-950/60 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100/70 dark:border-emerald-900/50 shadow-2xs">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR */}
      <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All PO Statuses</option>
            <option value="ISSUED">Issued (Pending)</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Fully Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium focus:outline-hidden cursor-pointer"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search PO #, supplier, item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* 4. TABLE */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="flex-1 overflow-auto min-h-0">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 bg-slate-50/90 dark:bg-slate-850 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-800 z-10">
              <tr>
                <th className="py-2.5 px-6">PO Number</th>
                <th className="py-2.5 px-4">Supplier</th>
                <th className="py-2.5 px-4">Order Date</th>
                <th className="py-2.5 px-4">Items Summary</th>
                <th className="py-2.5 px-4">Total Amount</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    <Truck className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      No purchase orders found.
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Click "New Purchase Order" above to create supply orders with vendors.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const canReceive =
                    po.status === 'DRAFT' ||
                    po.status === 'SENT' ||
                    po.status === 'ISSUED' ||
                    po.status === 'PARTIALLY_RECEIVED';

                  return (
                    <tr
                      key={po.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        #{po.poNumber}
                      </td>

                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        {po.supplier?.name || 'Supplier'}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(po.orderDate).toLocaleDateString()}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          {po.items.map((i) => (
                            <div key={i.id} className="text-xs text-slate-700 dark:text-slate-300">
                              <span>{i.item.name}:</span>{' '}
                              <strong className="font-mono">
                                {i.receivedQuantity}/{i.quantity} {i.item.unit}
                              </strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        ${po.totalAmount.toFixed(2)}
                      </td>

                      <td className="py-3 px-4">
                        {po.status === 'RECEIVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800">
                            Fully Received
                          </span>
                        ) : po.status === 'PARTIALLY_RECEIVED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                            Partially Received
                          </span>
                        ) : po.status === 'SENT' || po.status === 'ISSUED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800">
                            Sent to Supplier
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Draft
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {po.status === 'DRAFT' && (
                            <button
                              type="button"
                              onClick={() => handleUpdatePOStatus(po.id, 'SENT')}
                              disabled={isSubmitting}
                              className="px-2.5 py-1 text-[10px] font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1 disabled:opacity-50"
                              title="Mark as Sent to Supplier"
                            >
                              <Send className="size-3" />
                              <span>Send to Supplier</span>
                            </button>
                          )}
                          {canReceive && (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiveModal(po)}
                              className="px-2.5 py-1 text-[10px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[6px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                            >
                              <ArrowDownRight className="size-3" />
                              <span>Receive Goods</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPO(po);
                              setIsDetailModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-[6px] transition-colors cursor-pointer"
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

      {/* MODAL 1: NEW PURCHASE ORDER */}
      {isNewPOModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-xl w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">New Purchase Order</h3>
                  <p className="text-[10px] text-slate-400">Create supply order with vendor</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewPOModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Select Supplier *
                  </label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white font-medium"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Order Items Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Ordered Line Items *
                  </label>
                  <button
                    type="button"
                    onClick={handleAddPOItemRow}
                    className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="size-3" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2 border border-slate-100 dark:border-slate-800 p-2.5 rounded-[8px] bg-slate-50/50 dark:bg-slate-850">
                  {poItems.map((row, idx) => {
                    const selItem = availableItems.find((i) => i.id === row.itemId);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <select
                          value={row.itemId}
                          onChange={(e) => handlePOItemChange(idx, e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                        >
                          {availableItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>

                        <div className="w-20 shrink-0">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) =>
                              setPoItems((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, quantity: parseInt(e.target.value, 10) || 1 } : r,
                                ),
                              )
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-1.5 text-xs text-slate-900 dark:text-white text-center font-bold"
                          />
                        </div>

                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Cost"
                            value={row.unitCost}
                            onChange={(e) =>
                              setPoItems((prev) =>
                                prev.map((r, i) =>
                                  i === idx ? { ...r, unitCost: parseFloat(e.target.value) || 0 } : r,
                                ),
                              )
                            }
                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-1.5 text-xs text-slate-900 dark:text-white text-right"
                          />
                        </div>

                        {poItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemovePOItemRow(idx)}
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

              <div>
                <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Notes / Payment Terms
                </label>
                <textarea
                  rows={2}
                  placeholder="Special instructions or vendor terms..."
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPOModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[8px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-[#0f172a] hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-[8px] shadow-xs transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Purchase Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RECEIVE GOODS */}
      {isReceiveModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-2xl w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
                  <ArrowDownRight className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Receive Goods (PO #{selectedPO.poNumber})
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Vendor: {selectedPO.supplier?.name || 'Supplier'} • Stock will increase upon confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiveModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-4">
              {errorMsg && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-[8px] flex items-center gap-2 text-red-700 dark:text-red-300 text-xs">
                  <AlertCircle className="size-3.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                {receiveItems.map((r, idx) => (
                  <div
                    key={r.poItemId}
                    className="p-3 bg-slate-50 dark:bg-slate-850 rounded-[8px] border border-slate-200/80 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {r.itemName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Ordered: {r.orderedQty} | Prev Received: {r.alreadyReceivedQty}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Received Qty ({r.unit})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={r.orderedQty - r.alreadyReceivedQty}
                          value={r.receiveQty}
                          onChange={(e) =>
                            setReceiveItems((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, receiveQty: parseInt(e.target.value, 10) || 0 } : item,
                              ),
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-1 text-xs text-slate-900 dark:text-white font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Batch / Lot # (optional)
                        </label>
                        <input
                          type="text"
                          placeholder="LOT-XXX"
                          value={r.batchNumber}
                          onChange={(e) =>
                            setReceiveItems((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, batchNumber: e.target.value } : item,
                              ),
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-1 text-xs text-slate-900 dark:text-white font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                          Expiry Date (optional)
                        </label>
                        <input
                          type="date"
                          value={r.expiryDate}
                          onChange={(e) =>
                            setReceiveItems((prev) =>
                              prev.map((item, i) =>
                                i === idx ? { ...item, expiryDate: e.target.value } : item,
                              ),
                            )
                          }
                          className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[6px] px-2 py-1 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                  {isSubmitting ? 'Receiving Goods...' : 'Confirm Goods Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: PO DETAILS */}
      {isDetailModalOpen && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] shadow-2xl max-w-lg w-full p-5 relative text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-[6px] bg-blue-50 dark:bg-blue-950 text-blue-600">
                  <FileText className="size-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                    Purchase Order #{selectedPO.poNumber}
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Supplier: {selectedPO.supplier?.name || 'Supplier'} • Status: {selectedPO.status}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="p-1 rounded-[6px] text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-[8px] overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-center">Ordered</th>
                      <th className="p-2 text-center">Received</th>
                      <th className="p-2 text-right">Cost</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedPO.items.map((i) => (
                      <tr key={i.id}>
                        <td className="p-2 font-medium text-slate-800 dark:text-white">{i.item.name}</td>
                        <td className="p-2 text-center font-bold text-blue-600">{i.quantity} {i.item.unit}</td>
                        <td className="p-2 text-center font-bold text-emerald-600">{i.receivedQuantity} {i.item.unit}</td>
                        <td className="p-2 text-right text-slate-600 dark:text-slate-400">${i.unitCost.toFixed(2)}</td>
                        <td className="p-2 text-right font-bold text-slate-900 dark:text-white">${i.totalCost.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-[8px]">
                <span className="font-bold text-slate-600 dark:text-slate-400">Total Purchase Order Cost:</span>
                <span className="font-mono font-black text-sm text-slate-900 dark:text-white">
                  ${selectedPO.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
              <div className="flex items-center gap-2">
                {selectedPO.status === 'DRAFT' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdatePOStatus(selectedPO.id, 'SENT');
                    }}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-[8px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="size-3.5" />
                    <span>Send to Supplier</span>
                  </button>
                )}

                {(selectedPO.status === 'DRAFT' || selectedPO.status === 'SENT' || selectedPO.status === 'PARTIALLY_RECEIVED') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailModalOpen(false);
                      handleOpenReceiveModal(selectedPO);
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                  >
                    <ArrowDownRight className="size-3.5" />
                    <span>Receive Goods</span>
                  </button>
                )}

                {selectedPO.status !== 'RECEIVED' && selectedPO.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Cancel Purchase Order #${selectedPO.poNumber}?`)) {
                        handleUpdatePOStatus(selectedPO.id, 'CANCELLED');
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-[8px] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel Order
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-[8px] cursor-pointer"
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
