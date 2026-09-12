'use client';

import React, { useState, useMemo } from 'react';
import {
  LuPill as Pill,
  LuSearch as Search,
  LuCircleCheck as CheckCircle2,
  LuClock as Clock,
  LuTriangleAlert as AlertTriangle,
  LuUser as User,
  LuBoxes as Boxes,
  LuClipboardCheck as ClipboardCheck,
  LuX as X,
  LuRefreshCw as RefreshCw,
  LuPrinter as Printer,
  LuFileText as FileText,
  LuCalendar as Calendar,
  LuPackagePlus as PackagePlus,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  availableStock: number;
  unitPrice: number;
  batchNumber?: string;
  expiryDate?: string;
  isDispensed?: boolean;
}

export interface PrescriptionOrder {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientFileNumber?: number | null;
  patientPhone: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnoses?: string[];
  createdAt: string;
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'DISPENSED';
  medicines: PrescribedMedicine[];
  totalAmount: number;
  notes?: string;
}

export interface InventoryItemStock {
  id: string;
  sku: string;
  name: string;
  categoryName: string;
  unit: string;
  currentStock: number;
  reorderLevel: number;
  salePrice: number;
  batchesCount: number;
  nextExpiry?: string | null;
}

interface PharmacistPortalViewProps {
  clinicName: string;
  pharmacistName: string;
  initialPrescriptions: PrescriptionOrder[];
  inventoryItems: InventoryItemStock[];
}

export function PharmacistPortalView({
  clinicName,
  pharmacistName,
  initialPrescriptions,
  inventoryItems,
}: PharmacistPortalViewProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(initialPrescriptions);
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'INVENTORY' | 'DISPENSED'>('QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionOrder | null>(null);
  const [isDispenseModalOpen, setIsDispenseModalOpen] = useState(false);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);

  // Filtered prescriptions
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
      if (activeTab === 'QUEUE' && rx.status === 'DISPENSED') return false;
      if (activeTab === 'DISPENSED' && rx.status !== 'DISPENSED') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = rx.patientName.toLowerCase().includes(q);
        const matchesRxNum = rx.prescriptionNumber.toLowerCase().includes(q);
        const matchesPhone = rx.patientPhone.toLowerCase().includes(q);
        const matchesDoctor = rx.doctorName.toLowerCase().includes(q);
        if (!matchesName && !matchesRxNum && !matchesPhone && !matchesDoctor) return false;
      }
      return true;
    });
  }, [prescriptions, activeTab, searchQuery]);

  // Filtered inventory
  const filteredInventory = useMemo(() => {
    if (!searchQuery.trim()) return inventoryItems;
    const q = searchQuery.toLowerCase();
    return inventoryItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.categoryName.toLowerCase().includes(q)
    );
  }, [inventoryItems, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const pendingCount = prescriptions.filter((p) => p.status !== 'DISPENSED').length;
    const dispensedTodayCount = prescriptions.filter((p) => p.status === 'DISPENSED').length;
    const lowStockCount = inventoryItems.filter((i) => i.currentStock <= i.reorderLevel).length;
    const totalInventoryCount = inventoryItems.length;

    return { pendingCount, dispensedTodayCount, lowStockCount, totalInventoryCount };
  }, [prescriptions, inventoryItems]);

  const handleOpenDispenseModal = (rx: PrescriptionOrder) => {
    setSelectedPrescription(rx);
    setIsDispenseModalOpen(true);
  };

  const handleConfirmDispense = () => {
    if (!selectedPrescription) return;

    setPrescriptions((prev) =>
      prev.map((rx) => {
        if (rx.id === selectedPrescription.id) {
          return {
            ...rx,
            status: 'DISPENSED',
            medicines: rx.medicines.map((m) => ({ ...m, isDispensed: true })),
          };
        }
        return rx;
      })
    );

    setIsDispenseModalOpen(false);
    setDispenseSuccessMessage(`Prescription ${selectedPrescription.prescriptionNumber} for ${selectedPrescription.patientName} was dispensed successfully!`);
    setTimeout(() => setDispenseSuccessMessage(null), 4000);
    setSelectedPrescription(null);
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Pharmacy &amp; Formulary</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Pill className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Pharmacy Station &amp; Dispensing Hub</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Lead Pharmacist: <span className="font-semibold text-slate-700 dark:text-slate-200">{pharmacistName}</span> • Doctor prescriptions fulfillment, drug catalog, and stock balance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3.5 py-1.5 rounded-[8px] shadow-2xs transition-all cursor-pointer"
          >
            <RefreshCw className="size-3.5" />
            <span>Refresh Rx</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {dispenseSuccessMessage && (
        <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-950/50 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-emerald-800 dark:text-emerald-300 text-xs font-medium shrink-0 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{dispenseSuccessMessage}</span>
          </div>
          <button onClick={() => setDispenseSuccessMessage(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {/* 2. STAT CARDS ROW (COMPACT, FLAT, DIVIDED) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        {/* Card 1: Prescriptions to Dispense */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              Pending Dispense
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.pendingCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-amber-200/80 dark:border-amber-900/50 inline-block">
                Awaiting Fulfillment
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-amber-50/90 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/80 dark:border-amber-900/50 shadow-2xs">
            <Clock className="size-4" />
          </div>
        </div>

        {/* Card 2: Dispensed Today */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Dispensed Today
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.dispensedTodayCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Verified &amp; Issued
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <ClipboardCheck className="size-4" />
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
              Low Stock Drugs
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.lowStockCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-rose-200/80 dark:border-rose-900/50 inline-block">
                Below Reorder Point
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        {/* Card 4: Formulary Catalog */}
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Formulary Catalog
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.totalInventoryCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                Active Drug SKUs
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Boxes className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW (SEGMENTED TABS & SEARCH) */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'QUEUE', label: `Prescription Queue (${stats.pendingCount})` },
            { id: 'INVENTORY', label: `Drug Stock & Formulary (${stats.totalInventoryCount})` },
            { id: 'DISPENSED', label: `Dispensed History (${stats.dispensedTodayCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0d6157] text-white shadow-2xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-64 sm:w-80 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeTab === 'INVENTORY' ? 'Search medication, SKU, category...' : 'Search Rx#, patient, phone, doctor...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50/90 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-[8px] pl-8.5 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
          />
        </div>
      </div>

      {/* 4. MAIN DATA TABLE SECTION */}
      <div className="w-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900 overflow-hidden">
        {activeTab !== 'INVENTORY' ? (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[980px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Rx Number / Date</th>
                  <th className="py-3 px-6">Patient Details</th>
                  <th className="py-3 px-6">Prescribing Doctor</th>
                  <th className="py-3 px-6">Prescribed Medicines</th>
                  <th className="py-3 px-6">Total Price</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Pill className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No prescriptions in this view</p>
                      <p className="text-xs text-slate-400 mt-0.5">Doctor prescriptions issued from consultation will sync here</p>
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => {
                    const isFullyDispensed = rx.status === 'DISPENSED';

                    return (
                      <tr key={rx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">{rx.prescriptionNumber}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {rx.createdAt}
                          </p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white">{rx.patientName}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            MRN #{rx.patientFileNumber || '---'} • {rx.patientPhone}
                          </p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{rx.doctorName}</p>
                          <p className="text-[11px] text-slate-500">{rx.doctorSpecialty || 'Consultant'}</p>
                        </td>

                        <td className="py-3 px-6">
                          <div className="space-y-1 max-w-[320px]">
                            {rx.medicines.map((med) => (
                              <div key={med.id} className="flex items-center justify-between gap-2 p-1.5 rounded-[6px] bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-[11px]">
                                <div>
                                  <span className="font-bold text-slate-900 dark:text-white">{med.name}</span>{' '}
                                  <span className="text-slate-500">({med.dosage})</span>
                                  <p className="text-[10px] text-slate-400">{med.frequency} for {med.duration}</p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">Qty: {med.quantity}</span>
                                  <p className={cn('text-[9.5px] font-bold', med.availableStock >= med.quantity ? 'text-emerald-600' : 'text-rose-600')}>
                                    {med.availableStock >= med.quantity ? '✓ In Stock' : '⚠️ Low Stock'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">
                            SAR {rx.totalAmount.toFixed(2)}
                          </p>
                          <p className="text-[10px] text-slate-400">{rx.medicines.length} item(s)</p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          {isFullyDispensed ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-[#e6f6f3] text-[#0d6157] border border-[#0d8276]/30 dark:bg-teal-950/40 dark:border-teal-700/50">
                              <CheckCircle2 className="size-3" /> Dispensed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
                              <Clock className="size-3" /> Ready to Dispense
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap">
                          {isFullyDispensed ? (
                            <button
                              onClick={() => handleOpenDispenseModal(rx)}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <Printer className="size-3.5" />
                              <span>View / Label</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenDispenseModal(rx)}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Pill className="size-3.5" />
                              <span>Dispense Rx</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Item Name / SKU</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Current Stock</th>
                  <th className="py-3 px-6">Reorder Point</th>
                  <th className="py-3 px-6">Retail Price</th>
                  <th className="py-3 px-6">Batch / Expiry</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <Boxes className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No inventory items found</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">SKU: {item.sku}</p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-[6px] text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.categoryName}
                          </span>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className={cn('font-bold font-mono text-sm', isLow ? 'text-rose-600' : 'text-slate-900 dark:text-white')}>
                            {item.currentStock} {item.unit}
                          </span>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="text-slate-500 font-mono">{item.reorderLevel} {item.unit}</span>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <span className="font-bold font-mono text-slate-900 dark:text-white">SAR {item.salePrice.toFixed(2)}</span>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-medium text-slate-700 dark:text-slate-300">{item.batchesCount} Active Batch(es)</p>
                          <p className="text-[10px] text-slate-400">{item.nextExpiry ? `Next Exp: ${item.nextExpiry}` : 'No expiry set'}</p>
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                              <AlertTriangle className="size-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3" /> Adequate
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

      {/* Dispense Verification Modal */}
      {isDispenseModalOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[8px] max-w-xl w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Pill className="size-5 text-[#0d6157]" />
                  Verify &amp; Dispense Prescription
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Rx: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPrescription.prescriptionNumber}</span> • Patient: <span className="font-bold">{selectedPrescription.patientName}</span>
                </p>
              </div>
              <button
                onClick={() => setIsDispenseModalOpen(false)}
                className="p-1 rounded-[8px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Medications to Deduct &amp; Issue:</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selectedPrescription.medicines.map((med, index) => (
                  <div key={index} className="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{med.name} ({med.dosage})</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{med.frequency} • Total Qty: <span className="font-bold font-mono">{med.quantity}</span></p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 dark:text-white font-mono">SAR {(med.unitPrice * med.quantity).toFixed(2)}</span>
                      <p className="text-[10px] text-emerald-600 font-semibold">Stock: {med.availableStock} available</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-[#e6f6f3] dark:bg-[#0d6157]/20 border border-[#0d8276]/30 rounded-[8px] flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Pharmacist Verification:</span>
                  <p className="font-bold text-[#0d6157] dark:text-teal-300">{pharmacistName}</p>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Total Prescription Bill:</span>
                  <p className="text-sm font-bold text-[#0d6157] dark:text-teal-300 font-mono">SAR {selectedPrescription.totalAmount.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDispenseModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispense}
                className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-4" />
                <span>Confirm &amp; Issue Medications</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
