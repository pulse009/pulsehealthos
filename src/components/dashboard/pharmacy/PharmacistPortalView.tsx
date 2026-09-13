'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  LuShoppingCart as ShoppingCart,
  LuMessageSquare as MessageSquare,
  LuSend as Send,
  LuSplit as Split,
  LuBan as Ban,
  LuPlus as Plus,
  LuTrash2 as Trash2,
  LuCreditCard as CreditCard,
  LuBanknote as Banknote,
  LuPercent as Percent,
  LuReceiptText as ReceiptText,
} from 'react-icons/lu';
import { FaUserDoctor as Stethoscope } from 'react-icons/fa6';
import { cn } from '@/components/ui/primitives';

export type MedicineFulfillmentStatus =
  | 'PENDING'
  | 'DISPENSED'
  | 'PARTIALLY_DISPENSED'
  | 'EXTERNAL_PURCHASE'
  | 'RESTOCK_REQUESTED'
  | 'ALTERNATIVE_REQUESTED';

export type PrescriptionStatus =
  | 'PENDING'
  | 'PARTIALLY_DISPENSED'
  | 'DISPENSED'
  | 'EXTERNAL_PURCHASE';

export interface PrescribedMedicine {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  dispensedQuantity?: number;
  remainingQuantity?: number;
  availableStock: number;
  unitPrice: number;
  route?: string;
  instructions?: string;
  batchNumber?: string;
  expiryDate?: string;
  isDispensed?: boolean;
  fulfillmentStatus?: MedicineFulfillmentStatus;
  doctorAlternativeNote?: string;
  restockNote?: string;
}

export interface PrescriptionOrder {
  id: string;
  prescriptionNumber: string;
  encounterId?: string;
  patientId: string;
  patientName: string;
  patientFileNumber?: number | null;
  patientPhone: string;
  isWalkIn?: boolean;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty?: string;
  diagnoses?: string[];
  createdAt: string;
  status: PrescriptionStatus;
  medicines: PrescribedMedicine[];
  totalAmount: number;
  notes?: string;
}

export interface InventoryBatchOption {
  id: string;
  batchNumber: string;
  expiryDate?: string | null;
  quantity: number;
  unitCost?: number;
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
  batches?: InventoryBatchOption[];
}

export interface PatientPrescriptionInfo {
  encounterId: string;
  doctorId?: string;
  doctorName: string;
  doctorSpecialty?: string;
  prescriptionNumber: string;
  date: string;
  medicines: PrescribedMedicine[];
}

export interface PatientOption {
  id: string;
  name: string;
  phone: string;
  fileNumber?: number | null;
  recentPrescriptions?: PatientPrescriptionInfo[];
}

export interface PharmacySaleItem {
  id: string;
  inventoryItemId?: string | null;
  name: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  availableStock: number;
  batchId?: string | null;
  batchNumber?: string;
  expiryDate?: string;
  isExternalPurchase: boolean;
  isPrescriptionItem?: boolean;
}

export interface PharmacyReceiptData {
  invoiceNumber: string;
  receiptDate: string;
  patientName: string;
  patientFileNumber?: number | null;
  patientPhone: string;
  doctorName?: string;
  pharmacistName: string;
  items: PharmacySaleItem[];
  subtotal: number;
  discountAmount: number;
  discountPercent?: number;
  totalAmount: number;
  paymentMethod: string;
  amountPaid: number;
  balance: number;
  notes?: string;
}

interface PharmacistPortalViewProps {
  clinicName: string;
  pharmacistName: string;
  initialPrescriptions: PrescriptionOrder[];
  inventoryItems: InventoryItemStock[];
  patients?: PatientOption[];
}

export function PharmacistPortalView({
  clinicName,
  pharmacistName,
  initialPrescriptions,
  inventoryItems: initialInventory,
  patients = [],
}: PharmacistPortalViewProps) {
  const [prescriptions, setPrescriptions] = useState<PrescriptionOrder[]>(initialPrescriptions);
  const [inventoryItems, setInventoryItems] = useState<InventoryItemStock[]>(initialInventory);
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'DISPENSED'>('INVENTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [dispenseSuccessMessage, setDispenseSuccessMessage] = useState<string | null>(null);

  // --- PHARMACY SALE MODAL STATE ---
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [customerType, setCustomerType] = useState<'CLINIC_PATIENT' | 'WALK_IN'>('WALK_IN');
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [isPatientDropdownOpen, setIsPatientDropdownOpen] = useState(false);
  const [saleEncounterId, setSaleEncounterId] = useState<string | null>(null);
  const [salePrescriptionNumber, setSalePrescriptionNumber] = useState<string>('');
  const [salePatientId, setSalePatientId] = useState<string>('');
  const [salePatientName, setSalePatientName] = useState<string>('');
  const [salePatientPhone, setSalePatientPhone] = useState<string>('');
  const [salePatientFileNumber, setSalePatientFileNumber] = useState<number | null | undefined>(null);
  const [saleDoctorId, setSaleDoctorId] = useState<string | null>(null);
  const [saleDoctorName, setSaleDoctorName] = useState<string>('');
  const [saleItems, setSaleItems] = useState<PharmacySaleItem[]>([]);
  const [discountType, setDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'INSURANCE' | 'ONLINE'>('CASH');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  // Search & add extra items inside Sale Modal
  const [itemSearchQuery, setItemSearchQuery] = useState('');
  const [isAddingItemOpen, setIsAddingItemOpen] = useState(false);

  // Live real-time synchronized patient list
  const [patientList, setPatientList] = useState<PatientOption[]>(patients);

  // --- REAL-TIME LIVE SYNC ENGINE (ClickUp / Jira style) ---
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date>(new Date());

  const syncPharmacyData = useCallback(async (isManual = false) => {
    if (isLiveSyncing) return;
    try {
      setIsLiveSyncing(true);
      const res = await fetch('/api/pharmacy/sales');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.prescriptions)) {
            setPrescriptions(data.prescriptions);
          }
          if (Array.isArray(data.inventoryItems)) {
            setInventoryItems(data.inventoryItems);
          }
          if (Array.isArray(data.patients)) {
            setPatientList(data.patients);
          }
          setLastSyncedAt(new Date());
        }
      }
    } catch (err) {
      console.error('Real-time sync error:', err);
    } finally {
      setIsLiveSyncing(false);
    }
  }, [isLiveSyncing]);

  // Real-time background sync loop every 8s + window focus + tab visibility
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isSaleModalOpen && !isSubmittingSale) {
        syncPharmacyData(false);
      }
    }, 8000);

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !isSaleModalOpen) {
        syncPharmacyData(false);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [isSaleModalOpen, isSubmittingSale, syncPharmacyData]);

  // Filtered patients for search by Unique ID, MRN, Name, Phone
  const searchedPatients = useMemo(() => {
    if (!patientSearchTerm.trim()) return patientList.slice(0, 15);
    const q = patientSearchTerm.toLowerCase().trim();
    return patientList.filter((p) => {
      const matchName = p.name.toLowerCase().includes(q);
      const matchPhone = p.phone ? p.phone.toLowerCase().includes(q) : false;
      const matchFile = p.fileNumber ? String(p.fileNumber).includes(q) : false;
      const matchId = p.id.toLowerCase().includes(q);
      return matchName || matchPhone || matchFile || matchId;
    });
  }, [patientList, patientSearchTerm]);

  // --- PHARMACY RECEIPT MODAL STATE ---
  const [activeReceipt, setActiveReceipt] = useState<PharmacyReceiptData | null>(null);

  // Sub-modal state for actions inside Drawer
  const [activeActionModal, setActiveActionModal] = useState<
    | null
    | { type: 'DOCTOR_ALT'; medId: string; medName: string }
    | { type: 'RESTOCK'; medId: string; medName: string; neededQty: number }
    | { type: 'PARTIAL_DISPENSE'; medId: string; medName: string; available: number; required: number }
  >(null);

  const [doctorAltNoteInput, setDoctorAltNoteInput] = useState('');
  const [restockQtyInput, setRestockQtyInput] = useState(50);
  const [restockNoteInput, setRestockNoteInput] = useState('Urgent clinic outpatient restock');
  const [partialDispenseQtyInput, setPartialDispenseQtyInput] = useState(1);
  const [partialRemainderActionInput, setPartialRemainderActionInput] = useState<'EXTERNAL' | 'RESTOCK'>('EXTERNAL');

  // Filtered prescriptions (for Dispensed Sales & Receipts History)
  const filteredPrescriptions = useMemo(() => {
    return prescriptions.filter((rx) => {
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
  }, [prescriptions, searchQuery]);

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
    const dispensedTodayCount = prescriptions.length;
    const lowStockCount = inventoryItems.filter((i) => i.currentStock <= i.reorderLevel).length;
    const totalInventoryCount = inventoryItems.length;
    const totalStockUnits = inventoryItems.reduce((sum, i) => sum + (i.currentStock || 0), 0);

    return { dispensedTodayCount, lowStockCount, totalInventoryCount, totalStockUnits };
  }, [prescriptions, inventoryItems]);

  const handleViewReceipt = (rx: PrescriptionOrder) => {
    const isWalkIn = rx.isWalkIn || !rx.patientFileNumber;
    const receiptData: PharmacyReceiptData = {
      invoiceNumber: rx.prescriptionNumber,
      receiptDate: rx.createdAt,
      patientName: rx.patientName,
      patientFileNumber: isWalkIn ? null : rx.patientFileNumber,
      patientPhone: rx.patientPhone && !rx.patientPhone.startsWith('walkin') ? rx.patientPhone : '',
      doctorName: rx.doctorName || (isWalkIn ? 'Direct Pharmacy Sale' : 'Attending Physician'),
      pharmacistName,
      items: rx.medicines.map((m, idx) => ({
        id: m.id || `rec-item-${idx}`,
        inventoryItemId: null,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        quantity: m.quantity,
        unitPrice: m.unitPrice,
        totalPrice: m.unitPrice * m.quantity,
        availableStock: m.availableStock,
        batchNumber: m.batchNumber || 'Batch 1',
        expiryDate: m.expiryDate || 'N/A',
        isExternalPurchase: m.fulfillmentStatus === 'EXTERNAL_PURCHASE',
        isPrescriptionItem: true,
      })),
      subtotal: rx.totalAmount,
      discountAmount: 0,
      totalAmount: rx.totalAmount,
      paymentMethod: 'CASH',
      amountPaid: rx.totalAmount,
      balance: 0,
      notes: rx.notes,
    };
    setActiveReceipt(receiptData);
  };

  const handleOpenDrawer = (rx: PrescriptionOrder) => {
    setSelectedPrescription(rx);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveActionModal(null);
  };

  // Helper: Match name with inventory
  const matchInventoryItem = (name: string) => {
    if (!name) return null;
    const nameLower = name.toLowerCase().trim();
    return (
      inventoryItems.find((inv) => {
        const invLower = inv.name.toLowerCase().trim();
        return (
          invLower === nameLower ||
          invLower.includes(nameLower) ||
          nameLower.includes(invLower) ||
          invLower.split(' ')[0] === nameLower.split(' ')[0]
        );
      }) || null
    );
  };

  // ─── IMPORT DOCTOR PRESCRIPTION FOR A PATIENT ─────────────────────────────
  const handleImportPrescription = (rxInfo: PatientPrescriptionInfo) => {
    setSaleEncounterId(rxInfo.encounterId);
    setSalePrescriptionNumber(rxInfo.prescriptionNumber);
    setSaleDoctorId(rxInfo.doctorId || null);
    setSaleDoctorName(rxInfo.doctorName);

    const items: PharmacySaleItem[] = rxInfo.medicines.map((m, idx) => {
      const matched = matchInventoryItem(m.name);
      const availableStock = matched ? matched.currentStock : m.availableStock;
      const unitPrice = m.unitPrice > 0 ? m.unitPrice : (matched?.salePrice || 15);
      const firstBatch = matched?.batches?.[0];

      return {
        id: m.id || `sale-item-${idx}`,
        inventoryItemId: matched?.id || null,
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        duration: m.duration,
        instructions: m.instructions,
        quantity: m.quantity || 1,
        unitPrice,
        totalPrice: unitPrice * (m.quantity || 1),
        availableStock,
        batchId: firstBatch?.id || null,
        batchNumber: firstBatch?.batchNumber || m.batchNumber || 'Default Batch',
        expiryDate: firstBatch?.expiryDate || m.expiryDate || 'N/A',
        isExternalPurchase: m.fulfillmentStatus === 'EXTERNAL_PURCHASE',
        isPrescriptionItem: true,
      };
    });

    setSaleItems(items);
    const subtotal = items.reduce((s, it) => (it.isExternalPurchase ? s : s + it.totalPrice), 0);
    setAmountPaidInput(subtotal.toFixed(2));
  };

  // ─── OPEN PHARMACY SALE CHECKOUT MODAL ──────────────────────────────────────
  const handleOpenCreateSaleModal = (rx?: PrescriptionOrder | null) => {
    if (rx) {
      setCustomerType('CLINIC_PATIENT');
      setSaleEncounterId(rx.encounterId || rx.id);
      setSalePrescriptionNumber(rx.prescriptionNumber);
      setSalePatientId(rx.patientId);
      setSalePatientName(rx.patientName);
      setSalePatientPhone(rx.patientPhone);
      setSalePatientFileNumber(rx.patientFileNumber);
      setSaleDoctorId(rx.doctorId || null);
      setSaleDoctorName(rx.doctorName);
      setPatientSearchTerm(`${rx.patientName} (MRN #${rx.patientFileNumber || '---'})`);
      setIsPatientDropdownOpen(false);

      // Convert prescribed medicines into sale items
      const items: PharmacySaleItem[] = rx.medicines.map((m, idx) => {
        const matched = matchInventoryItem(m.name);
        const availableStock = matched ? matched.currentStock : m.availableStock;
        const unitPrice = m.unitPrice > 0 ? m.unitPrice : (matched?.salePrice || 15);
        const firstBatch = matched?.batches?.[0];

        return {
          id: m.id || `sale-item-${idx}`,
          inventoryItemId: matched?.id || null,
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions,
          quantity: m.quantity || 1,
          unitPrice,
          totalPrice: unitPrice * (m.quantity || 1),
          availableStock,
          batchId: firstBatch?.id || null,
          batchNumber: firstBatch?.batchNumber || m.batchNumber || 'Default Batch',
          expiryDate: firstBatch?.expiryDate || m.expiryDate || 'N/A',
          isExternalPurchase: m.fulfillmentStatus === 'EXTERNAL_PURCHASE',
          isPrescriptionItem: true,
        };
      });

      setSaleItems(items);
      const subtotal = items.reduce((s, it) => (it.isExternalPurchase ? s : s + it.totalPrice), 0);
      setAmountPaidInput(subtotal.toFixed(2));
    } else {
      // Direct Sale without pre-loaded Rx -> Default to Walk-in Customer
      setCustomerType('WALK_IN');
      setSaleEncounterId(null);
      setSalePrescriptionNumber(`POS-${Date.now().toString().slice(-5)}`);
      setSalePatientId('walk-in-customer');
      setSalePatientName('Walk-in Customer');
      setSalePatientPhone('');
      setSalePatientFileNumber(null);
      setSaleDoctorId(null);
      setSaleDoctorName('Direct OTC Counter Sale');
      setPatientSearchTerm('');
      setIsPatientDropdownOpen(false);
      setSaleItems([]);
      setAmountPaidInput('0.00');
    }

    setDiscountType('FIXED');
    setDiscountValue(0);
    setPaymentMethod('CASH');
    setSaleNotes('');
    setIsDrawerOpen(false);
    setIsSaleModalOpen(true);
  };

  // ─── SALE FINANCIALS CALCULATION ──────────────────────────────────────────
  const saleFinancials = useMemo(() => {
    const subtotal = saleItems.reduce((sum, item) => {
      if (item.isExternalPurchase) return sum;
      return sum + Number(item.unitPrice || 0) * Number(item.quantity || 0);
    }, 0);

    let discountAmount = 0;
    if (discountType === 'FIXED') {
      discountAmount = Math.min(subtotal, Math.max(0, Number(discountValue) || 0));
    } else {
      const pct = Math.min(100, Math.max(0, Number(discountValue) || 0));
      discountAmount = (subtotal * pct) / 100;
    }

    const totalAmount = Math.max(0, subtotal - discountAmount);
    const amountPaid = Number(amountPaidInput) || 0;
    const balance = Math.max(0, totalAmount - amountPaid);
    const change = Math.max(0, amountPaid - totalAmount);

    return {
      subtotal,
      discountAmount,
      totalAmount,
      amountPaid,
      balance,
      change,
    };
  }, [saleItems, discountType, discountValue, amountPaidInput]);

  // Update Item Quantity
  const handleUpdateItemQuantity = (id: string, newQty: number) => {
    const validQty = Math.max(1, newQty);
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const totalPrice = item.unitPrice * validQty;
          return { ...item, quantity: validQty, totalPrice };
        }
        return item;
      })
    );
  };

  // Update Item Unit Price
  const handleUpdateItemPrice = (id: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const totalPrice = validPrice * item.quantity;
          return { ...item, unitPrice: validPrice, totalPrice };
        }
        return item;
      })
    );
  };

  // Select Batch for an item
  const handleSelectItemBatch = (itemId: string, batchId: string) => {
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId && item.inventoryItemId) {
          const inv = inventoryItems.find((i) => i.id === item.inventoryItemId);
          const batch = inv?.batches?.find((b) => b.id === batchId);
          if (batch) {
            return {
              ...item,
              batchId: batch.id,
              batchNumber: batch.batchNumber,
              expiryDate: batch.expiryDate || 'N/A',
            };
          }
        }
        return item;
      })
    );
  };

  // Toggle External Purchase for an item
  const handleToggleExternalPurchase = (id: string) => {
    setSaleItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const isExternal = !item.isExternalPurchase;
          return {
            ...item,
            isExternalPurchase: isExternal,
          };
        }
        return item;
      })
    );
  };

  // Remove Item from Sale
  const handleRemoveSaleItem = (id: string) => {
    setSaleItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Extra Item from Inventory to Sale
  const handleAddInventoryItemToSale = (inv: InventoryItemStock) => {
    const existing = saleItems.find((it) => it.inventoryItemId === inv.id);
    if (existing) {
      handleUpdateItemQuantity(existing.id, existing.quantity + 1);
    } else {
      const firstBatch = inv.batches?.[0];
      const newItem: PharmacySaleItem = {
        id: `extra-item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        inventoryItemId: inv.id,
        name: inv.name,
        dosage: 'OTC / Standard',
        frequency: 'As needed',
        duration: 'Standard',
        instructions: '',
        quantity: 1,
        unitPrice: inv.salePrice || 15,
        totalPrice: inv.salePrice || 15,
        availableStock: inv.currentStock,
        batchId: firstBatch?.id || null,
        batchNumber: firstBatch?.batchNumber || 'Batch 1',
        expiryDate: firstBatch?.expiryDate || 'N/A',
        isExternalPurchase: false,
        isPrescriptionItem: false,
      };
      setSaleItems((prev) => [...prev, newItem]);
    }
    setIsAddingItemOpen(false);
    setItemSearchQuery('');
  };

  // ─── COMPLETE SALE & DISPENSE HANDLER ──────────────────────────────────────
  const handleCompleteSaleAndDispense = async () => {
    if (!salePatientId) {
      alert('Please select or specify a patient for this pharmacy sale.');
      return;
    }

    if (saleItems.length === 0) {
      alert('Please add at least one medication or pharmacy item.');
      return;
    }

    // Check if any in-house dispensed item is out of stock / not received
    const outOfStockItems = saleItems.filter(
      (it) => !it.isExternalPurchase && it.inventoryItemId && it.availableStock < it.quantity
    );

    if (outOfStockItems.length > 0) {
      const names = outOfStockItems.map((i) => `• ${i.name} (In Stock: ${i.availableStock}, Required: ${i.quantity})`).join('\n');
      alert(`Cannot dispense in-house stock:\n\n${names}\n\nStock has not been received for these items yet. Please click "Receive Stock" in the Inventory module first, or toggle "Patient will buy externally" if the patient is purchasing elsewhere.`);
      return;
    }

    setIsSubmittingSale(true);
    try {
      const isWalkIn = customerType === 'WALK_IN';
      const payload = {
        patientId: salePatientId,
        patientName: salePatientName,
        patientPhone: salePatientPhone,
        customerType,
        doctorId: saleDoctorId,
        encounterId: saleEncounterId,
        prescriptionNumber: salePrescriptionNumber,
        items: saleItems.map((it) => ({
          id: it.id,
          inventoryItemId: it.inventoryItemId,
          batchId: it.batchId,
          name: it.name,
          dosage: it.dosage,
          frequency: it.frequency,
          duration: it.duration,
          instructions: it.instructions,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          totalPrice: it.totalPrice,
          isExternalPurchase: it.isExternalPurchase,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
        })),
        subtotal: saleFinancials.subtotal,
        discountAmount: saleFinancials.discountAmount,
        discountPercent: discountType === 'PERCENT' ? Number(discountValue) : undefined,
        totalAmount: saleFinancials.totalAmount,
        paymentMethod,
        amountPaid: saleFinancials.amountPaid,
        balance: saleFinancials.balance,
        notes: saleNotes,
      };

      const response = await fetch('/api/pharmacy/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || resData.message || 'Failed to complete pharmacy sale');
      }

      // Deduct inventory in local state immediately
      setInventoryItems((prev) =>
        prev.map((inv) => {
          const soldItem = saleItems.find((it) => it.inventoryItemId === inv.id && !it.isExternalPurchase);
          if (soldItem) {
            return {
              ...inv,
              currentStock: Math.max(0, inv.currentStock - soldItem.quantity),
            };
          }
          return inv;
        })
      );

      const newInvoiceNumber = resData.invoice?.invoiceNumber || salePrescriptionNumber || `PHARM-${Date.now().toString().slice(-6)}`;
      const nowTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Create new prescription order record and prepend immediately to prescriptions state (Real-Time update)
      const newSaleRecord: PrescriptionOrder = {
        id: resData.invoice?.id || `pharm-inv-${Date.now()}`,
        prescriptionNumber: newInvoiceNumber,
        encounterId: saleEncounterId || undefined,
        patientId: resData.invoice?.patientId || salePatientId,
        patientName: salePatientName || (isWalkIn ? 'Walk-in Customer' : 'Patient'),
        patientFileNumber: isWalkIn ? null : (salePatientFileNumber || null),
        patientPhone: salePatientPhone || '',
        isWalkIn,
        doctorId: saleDoctorId || undefined,
        doctorName: saleDoctorName || (isWalkIn ? 'Direct Pharmacy Sale' : 'Attending Physician'),
        doctorSpecialty: isWalkIn ? 'Point of Sale' : 'Consultant Physician',
        createdAt: `Today at ${nowTimeStr}`,
        status: saleItems.every((it) => it.isExternalPurchase) ? 'EXTERNAL_PURCHASE' : 'DISPENSED',
        medicines: saleItems.map((it, idx) => ({
          id: it.id || `sale-med-${idx}`,
          name: it.name,
          dosage: it.dosage || 'Standard',
          frequency: it.frequency || 'As prescribed',
          duration: it.duration || 'Standard',
          quantity: it.quantity,
          availableStock: it.availableStock,
          unitPrice: it.unitPrice,
          batchNumber: it.batchNumber,
          expiryDate: it.expiryDate,
          isDispensed: true,
          fulfillmentStatus: it.isExternalPurchase ? 'EXTERNAL_PURCHASE' : 'DISPENSED',
        })),
        totalAmount: saleFinancials.totalAmount,
        notes: saleNotes,
      };

      setPrescriptions((prev) => {
        const remaining = prev.filter(
          (p) =>
            p.id !== newSaleRecord.id &&
            p.prescriptionNumber !== newSaleRecord.prescriptionNumber &&
            (!saleEncounterId || p.encounterId !== saleEncounterId)
        );
        return [newSaleRecord, ...remaining];
      });

      // Prepare receipt data
      const receiptData: PharmacyReceiptData = {
        invoiceNumber: newInvoiceNumber,
        receiptDate: new Date().toLocaleString(),
        patientName: salePatientName || (isWalkIn ? 'Walk-in Customer' : 'Patient'),
        patientFileNumber: isWalkIn ? null : salePatientFileNumber,
        patientPhone: salePatientPhone || '',
        doctorName: saleDoctorName || (isWalkIn ? 'Direct Pharmacy Sale' : 'Attending Physician'),
        pharmacistName,
        items: [...saleItems],
        subtotal: saleFinancials.subtotal,
        discountAmount: saleFinancials.discountAmount,
        discountPercent: discountType === 'PERCENT' ? Number(discountValue) : undefined,
        totalAmount: saleFinancials.totalAmount,
        paymentMethod,
        amountPaid: saleFinancials.amountPaid,
        balance: saleFinancials.balance,
        notes: saleNotes,
      };

      setIsSaleModalOpen(false);
      setActiveReceipt(receiptData);
      setDispenseSuccessMessage(`Pharmacy Sale & Dispense recorded successfully! Invoice: ${receiptData.invoiceNumber}`);
      setTimeout(() => setDispenseSuccessMessage(null), 6000);
    } catch (err: any) {
      alert(`Error completing sale: ${err.message}`);
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // ─── ACTION 1: Mark as Patient Buys Externally ────────────────────────
  const handleMarkExternalPurchase = (medId: string) => {
    if (!selectedPrescription) return;

    const updatedMeds: PrescribedMedicine[] = selectedPrescription.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          fulfillmentStatus: 'EXTERNAL_PURCHASE',
          dispensedQuantity: 0,
          remainingQuantity: m.quantity,
          isDispensed: true,
        };
      }
      return m;
    });

    const newTotal = updatedMeds.reduce((sum, m) => {
      if (m.fulfillmentStatus === 'EXTERNAL_PURCHASE') return sum;
      const qty = typeof m.dispensedQuantity === 'number' ? m.dispensedQuantity : m.quantity;
      return sum + m.unitPrice * qty;
    }, 0);

    const updatedRx: PrescriptionOrder = {
      ...selectedPrescription,
      medicines: updatedMeds,
      totalAmount: newTotal,
    };

    setSelectedPrescription(updatedRx);
    setPrescriptions((prev) => prev.map((rx) => (rx.id === updatedRx.id ? updatedRx : rx)));
    setDispenseSuccessMessage(`Marked item as External Purchase (No clinic inventory deducted, SAR 0 billed).`);
    setTimeout(() => setDispenseSuccessMessage(null), 4000);
  };

  // ─── ACTION 2: Request Restock ─────────────────────────────────────────
  const handleOpenRestockModal = (med: PrescribedMedicine) => {
    setRestockQtyInput(Math.max(20, med.quantity * 2));
    setRestockNoteInput(`Urgent restock for Rx #${selectedPrescription?.prescriptionNumber}`);
    setActiveActionModal({
      type: 'RESTOCK',
      medId: med.id,
      medName: med.name,
      neededQty: med.quantity,
    });
  };

  const handleConfirmRestock = () => {
    if (!selectedPrescription || !activeActionModal || activeActionModal.type !== 'RESTOCK') return;

    const medId = activeActionModal.medId;
    const updatedMeds: PrescribedMedicine[] = selectedPrescription.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          fulfillmentStatus: 'RESTOCK_REQUESTED',
          restockNote: `${restockQtyInput} units requested - ${restockNoteInput}`,
        };
      }
      return m;
    });

    const updatedRx: PrescriptionOrder = {
      ...selectedPrescription,
      medicines: updatedMeds,
    };

    setSelectedPrescription(updatedRx);
    setPrescriptions((prev) => prev.map((rx) => (rx.id === updatedRx.id ? updatedRx : rx)));
    setActiveActionModal(null);
    setDispenseSuccessMessage(`Restock requisition for ${activeActionModal.medName} (${restockQtyInput} units) submitted!`);
    setTimeout(() => setDispenseSuccessMessage(null), 4000);
  };

  // ─── ACTION 3: Request Doctor Alternative ──────────────────────────────
  const handleOpenDoctorAltModal = (med: PrescribedMedicine) => {
    setDoctorAltNoteInput(`Medication ${med.name} (${med.dosage}) is unavailable. Please approve alternative formulation or brand.`);
    setActiveActionModal({
      type: 'DOCTOR_ALT',
      medId: med.id,
      medName: med.name,
    });
  };

  const handleConfirmDoctorAlternative = () => {
    if (!selectedPrescription || !activeActionModal || activeActionModal.type !== 'DOCTOR_ALT') return;

    const medId = activeActionModal.medId;
    const updatedMeds: PrescribedMedicine[] = selectedPrescription.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          fulfillmentStatus: 'ALTERNATIVE_REQUESTED',
          doctorAlternativeNote: doctorAltNoteInput,
        };
      }
      return m;
    });

    const updatedRx: PrescriptionOrder = {
      ...selectedPrescription,
      medicines: updatedMeds,
    };

    setSelectedPrescription(updatedRx);
    setPrescriptions((prev) => prev.map((rx) => (rx.id === updatedRx.id ? updatedRx : rx)));
    setActiveActionModal(null);
    setDispenseSuccessMessage(`Alternative drug request routed to Dr. ${selectedPrescription.doctorName}. Awaiting physician sign-off.`);
    setTimeout(() => setDispenseSuccessMessage(null), 5000);
  };

  // ─── ACTION 4: Partial Dispense ────────────────────────────────────────
  const handleOpenPartialDispenseModal = (med: PrescribedMedicine) => {
    setPartialDispenseQtyInput(med.availableStock);
    setPartialRemainderActionInput('EXTERNAL');
    setActiveActionModal({
      type: 'PARTIAL_DISPENSE',
      medId: med.id,
      medName: med.name,
      available: med.availableStock,
      required: med.quantity,
    });
  };

  const handleConfirmPartialDispense = () => {
    if (!selectedPrescription || !activeActionModal || activeActionModal.type !== 'PARTIAL_DISPENSE') return;

    const medId = activeActionModal.medId;
    const dispensedQty = Math.min(partialDispenseQtyInput, activeActionModal.available);
    const remainder = Math.max(0, activeActionModal.required - dispensedQty);

    const updatedMeds: PrescribedMedicine[] = selectedPrescription.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          fulfillmentStatus: 'PARTIALLY_DISPENSED',
          dispensedQuantity: dispensedQty,
          remainingQuantity: remainder,
          isDispensed: true,
          restockNote: partialRemainderActionInput === 'EXTERNAL' ? `Remaining ${remainder} units will be bought externally` : `Remaining ${remainder} units awaiting restock`,
        };
      }
      return m;
    });

    // Deduct stock from inventory
    setInventoryItems((prev) =>
      prev.map((item) => {
        if (item.name.toLowerCase().includes(activeActionModal.medName.toLowerCase())) {
          return { ...item, currentStock: Math.max(0, item.currentStock - dispensedQty) };
        }
        return item;
      })
    );

    const newTotal = updatedMeds.reduce((sum, m) => {
      if (m.fulfillmentStatus === 'EXTERNAL_PURCHASE') return sum;
      const qty = typeof m.dispensedQuantity === 'number' ? m.dispensedQuantity : m.quantity;
      return sum + m.unitPrice * qty;
    }, 0);

    const updatedRx: PrescriptionOrder = {
      ...selectedPrescription,
      status: 'PARTIALLY_DISPENSED',
      medicines: updatedMeds,
      totalAmount: newTotal,
    };

    setSelectedPrescription(updatedRx);
    setPrescriptions((prev) => prev.map((rx) => (rx.id === updatedRx.id ? updatedRx : rx)));
    setActiveActionModal(null);
    setDispenseSuccessMessage(`Partially dispensed ${dispensedQty} units of ${activeActionModal.medName}. Remaining: ${remainder} units (${partialRemainderActionInput === 'EXTERNAL' ? 'Patient will buy outside' : 'Awaiting restock'}).`);
    setTimeout(() => setDispenseSuccessMessage(null), 5000);
  };

  // Reset Item Action
  const handleResetItemAction = (medId: string) => {
    if (!selectedPrescription) return;

    const updatedMeds: PrescribedMedicine[] = selectedPrescription.medicines.map((m) => {
      if (m.id === medId) {
        return {
          ...m,
          fulfillmentStatus: 'PENDING',
          dispensedQuantity: undefined,
          remainingQuantity: undefined,
          isDispensed: false,
          doctorAlternativeNote: undefined,
          restockNote: undefined,
        };
      }
      return m;
    });

    const newTotal = updatedMeds.reduce((sum, m) => {
      const qty = typeof m.dispensedQuantity === 'number' ? m.dispensedQuantity : m.quantity;
      return sum + m.unitPrice * qty;
    }, 0);

    const updatedRx: PrescriptionOrder = {
      ...selectedPrescription,
      medicines: updatedMeds,
      totalAmount: newTotal,
    };

    setSelectedPrescription(updatedRx);
    setPrescriptions((prev) => prev.map((rx) => (rx.id === updatedRx.id ? updatedRx : rx)));
  };

  return (
    <div className="h-full flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans">
      {/* 1. TOP COMPACT HEADER */}
      <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 shrink-0 sticky top-0 z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            <span>{clinicName}</span>
            <span>•</span>
            <span className="text-[#0d6157] dark:text-teal-400 font-semibold">Pharmacy Point of Sale &amp; Formulary</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight flex items-center gap-2">
            <Pill className="size-5 text-[#0d6157] dark:text-teal-400" />
            <span>Pharmacy Station &amp; Dispensing Hub</span>
          </h1>
          <p className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
            Lead Pharmacist: <span className="font-semibold text-slate-700 dark:text-slate-200">{pharmacistName}</span> • Prescription fulfillment, POS checkout, stock balance, and receipts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live Real-time Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
            <span className="relative flex size-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
            </span>
            <span>Live Real-Time Sync</span>
          </div>

          <button
            type="button"
            onClick={() => handleOpenCreateSaleModal(null)}
            className="inline-flex items-center justify-center gap-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs px-4 py-2 rounded-[8px] shadow-sm transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Pharmacy Sale</span>
          </button>

          <button
            type="button"
            onClick={() => syncPharmacyData(true)}
            disabled={isLiveSyncing}
            className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-xs px-3 py-2 rounded-[8px] shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            title="Real-time synchronized with point-of-sale and clinical records"
          >
            <RefreshCw className={cn("size-3.5", isLiveSyncing && "animate-spin text-[#0d6157]")} />
            <span>{isLiveSyncing ? 'Syncing...' : 'Sync Now'}</span>
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

      {/* 2. STAT CARDS ROW */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-[#0d6157] dark:text-teal-400 uppercase tracking-wider">
              Formulary Catalog
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.totalInventoryCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-[#0d8276]/20 inline-block">
                Active Drug SKUs
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-[#e6f6f3] dark:bg-[#0d6157]/20 text-[#0d5c56] dark:text-teal-300 flex items-center justify-center shrink-0 border border-[#0d8276]/20 shadow-2xs">
            <Boxes className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Total Stock Units
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.totalStockUnits}
            </div>
            <div className="pt-0.5">
              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-slate-200 dark:border-slate-700 inline-block">
                Units on Shelf
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <Pill className="size-4" />
          </div>
        </div>

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
                Below Reorder Level
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-rose-50/90 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs">
            <AlertTriangle className="size-4" />
          </div>
        </div>

        <div className="px-5 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
          <div className="space-y-0.5">
            <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Dispensed Sales
            </span>
            <div className="text-xl font-black text-slate-900 dark:text-white tracking-tight leading-none font-mono">
              {stats.dispensedTodayCount}
            </div>
            <div className="pt-0.5">
              <span className="bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold px-2 py-0.5 rounded-[8px] border border-emerald-200/80 dark:border-emerald-900/50 inline-block">
                Paid &amp; Stock Issued
              </span>
            </div>
          </div>
          <div className="size-9 rounded-[8px] bg-emerald-50/90 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/80 dark:border-emerald-900/50 shadow-2xs">
            <ClipboardCheck className="size-4" />
          </div>
        </div>
      </div>

      {/* 3. TOOLBAR ROW */}
      <div className="px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto">
          {[
            { id: 'INVENTORY', label: `Drug Stock & Formulary (${stats.totalInventoryCount})` },
            { id: 'DISPENSED', label: `Sales & Dispensed Receipts (${stats.dispensedTodayCount})` },
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
            placeholder={activeTab === 'INVENTORY' ? 'Search medication, SKU, category...' : 'Search Rx#, invoice#, patient, phone...'}
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
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/90 backdrop-blur-xs z-10 border-b border-slate-200 dark:border-slate-800">
                <tr className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-6">Sale / Receipt #</th>
                  <th className="py-3 px-6">Patient Details</th>
                  <th className="py-3 px-6">Dispensed Items</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      <ReceiptText className="size-8 mx-auto mb-2 opacity-30" />
                      <p className="font-semibold text-sm">No pharmacy sales recorded yet</p>
                      <p className="text-xs text-slate-400 mt-0.5">Click &ldquo;Create Pharmacy Sale&rdquo; above to process a patient sale</p>
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => {
                    return (
                      <tr
                        key={rx.id}
                        onClick={() => handleViewReceipt(rx)}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">{rx.prescriptionNumber}</p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="size-3" />
                            {rx.createdAt}
                          </p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold text-slate-900 dark:text-white">{rx.patientName}</p>
                            {rx.isWalkIn || !rx.patientFileNumber ? (
                              <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40 flex items-center gap-0.5">
                                <User className="size-2.5" /> Walk-in
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-[5px] text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40 flex items-center gap-0.5">
                                <Stethoscope className="size-2.5" /> Patient
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {rx.isWalkIn || !rx.patientFileNumber
                              ? `Retail / OTC • ${rx.patientPhone && !rx.patientPhone.startsWith('walkin') ? rx.patientPhone : 'No Contact Phone'}`
                              : `MRN #${rx.patientFileNumber} • ${rx.patientPhone || 'No Phone'}`}
                          </p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          <p className="font-bold text-slate-900 dark:text-white font-mono">
                            {rx.medicines.length} Medication(s)
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {rx.medicines.map((m) => m.name).slice(0, 2).join(', ')}
                            {rx.medicines.length > 2 ? '...' : ''}
                          </p>
                        </td>

                        <td className="py-3 px-6 whitespace-nowrap">
                          {rx.status === 'PARTIALLY_DISPENSED' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
                              <Split className="size-3" /> Partially Dispensed
                            </span>
                          ) : rx.status === 'EXTERNAL_PURCHASE' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40">
                              <ShoppingCart className="size-3" /> External Purchase
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-[8px] text-[11px] font-semibold bg-[#e6f6f3] text-[#0d6157] border border-[#0d8276]/30 dark:bg-teal-950/40 dark:border-teal-700/50">
                              <CheckCircle2 className="size-3" /> Dispensed &amp; Paid
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-6 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewReceipt(rx)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer inline-flex items-center gap-1"
                            >
                              <FileText className="size-3.5" />
                              <span>View Receipt</span>
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

      {/* ─── MODAL: DEDICATED PHARMACY SALE & DISPENSE CHECKOUT FORM ─────────────────── */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-[10px] bg-[#0d6157]/15 dark:bg-[#0d6157]/30 border border-[#0d6157]/30 flex items-center justify-center text-[#0d6157] dark:text-teal-300">
                  <ShoppingCart className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Pharmacy Sale &amp; Dispensing Checkout
                    </h2>
                    <span className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-mono font-bold bg-[#0d6157]/10 text-[#0d6157] dark:text-teal-300 border border-[#0d6157]/20">
                      {salePrescriptionNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select medication batches, adjust quantities, verify prices, and record point-of-sale payment.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSaleModalOpen(false)}
                className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* 1. Customer Type Selector (Clinic Patient vs Walk-in Normal Customer) */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Customer / Patient Type
                  </span>
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-[8px]">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('WALK_IN');
                        setSalePatientId('walk-in-customer');
                        setSalePatientName(salePatientName.startsWith('Walk-in') ? salePatientName : 'Walk-in Customer');
                        setSalePatientPhone('');
                        setSalePatientFileNumber(null);
                        setSaleDoctorId(null);
                        setSaleDoctorName('Direct OTC Counter Sale');
                      }}
                      className={cn(
                        "px-3 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        customerType === 'WALK_IN'
                          ? "bg-white dark:bg-slate-900 text-[#0d6157] dark:text-teal-300 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <User className="size-3.5" />
                      <span>Walk-in / Normal Customer (Retail)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('CLINIC_PATIENT');
                        setPatientSearchTerm('');
                        setIsPatientDropdownOpen(true);
                        if (patients.length > 0 && patients[0]) {
                          const p = patients[0];
                          setSalePatientId(p.id);
                          setSalePatientName(p.name);
                          setSalePatientPhone(p.phone);
                          setSalePatientFileNumber(p.fileNumber);
                          if (p.recentPrescriptions && p.recentPrescriptions.length > 0 && p.recentPrescriptions[0]) {
                            setSaleDoctorId(p.recentPrescriptions[0].doctorId || null);
                            setSaleDoctorName(p.recentPrescriptions[0].doctorName);
                          } else {
                            setSaleDoctorId(null);
                            setSaleDoctorName('Direct Pharmacy Sale');
                          }
                        }
                      }}
                      className={cn(
                        "px-3 py-1 rounded-[6px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                        customerType === 'CLINIC_PATIENT'
                          ? "bg-white dark:bg-slate-900 text-[#0d6157] dark:text-teal-300 shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      )}
                    >
                      <Stethoscope className="size-3.5" />
                      <span>Registered Clinic Patient (Find by ID / MRN)</span>
                    </button>
                  </div>
                </div>

                {/* 2. Customer Details Card depending on mode */}
                {customerType === 'CLINIC_PATIENT' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[10px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                          Search Clinic Patient (Unique ID / MRN #)
                        </span>
                        {salePatientId && salePatientId !== 'walk-in-customer' && (
                          <span className="text-[10.5px] text-emerald-600 font-bold flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Patient Selected
                          </span>
                        )}
                      </div>

                      {/* Fast Patient Lookup Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          value={patientSearchTerm}
                          onChange={(e) => {
                            setPatientSearchTerm(e.target.value);
                            setIsPatientDropdownOpen(true);
                          }}
                          onFocus={() => setIsPatientDropdownOpen(true)}
                          placeholder="Search patient by MRN #, File ID, Name, Phone..."
                          className="w-full pl-8.5 pr-8 py-2 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6157]/20 focus:border-[#0d6157]"
                        />
                        {patientSearchTerm && (
                          <button
                            type="button"
                            onClick={() => {
                              setPatientSearchTerm('');
                              setIsPatientDropdownOpen(false);
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}

                        {/* Dropdown Results */}
                        {isPatientDropdownOpen && (
                          <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[10px] shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                            {searchedPatients.length === 0 ? (
                              <div className="p-3 text-center text-xs text-slate-500">
                                No clinic patient matching &ldquo;{patientSearchTerm}&rdquo;
                              </div>
                            ) : (
                              searchedPatients.map((pt) => {
                                const hasRx = pt.recentPrescriptions && pt.recentPrescriptions.length > 0;
                                return (
                                  <div
                                    key={pt.id}
                                    onClick={() => {
                                      setSalePatientId(pt.id);
                                      setSalePatientName(pt.name);
                                      setSalePatientPhone(pt.phone);
                                      setSalePatientFileNumber(pt.fileNumber);
                                      setPatientSearchTerm(`${pt.name} (MRN #${pt.fileNumber || '---'})`);
                                      setIsPatientDropdownOpen(false);
                                      if (hasRx && pt.recentPrescriptions && pt.recentPrescriptions[0]) {
                                        setSaleDoctorId(pt.recentPrescriptions[0].doctorId || null);
                                        setSaleDoctorName(pt.recentPrescriptions[0].doctorName);
                                      } else {
                                        setSaleDoctorId(null);
                                        setSaleDoctorName('Direct Pharmacy Sale');
                                      }
                                    }}
                                    className="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer flex items-center justify-between transition-colors"
                                  >
                                    <div>
                                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                        <span>{pt.name}</span>
                                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 font-semibold">
                                          MRN #{pt.fileNumber || '---'}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-slate-500 mt-0.5">Phone: {pt.phone}</p>
                                    </div>
                                    {hasRx && (
                                      <span className="px-2 py-0.5 rounded-[6px] text-[10.5px] font-bold bg-emerald-50 text-[#0d6157] border border-emerald-200 flex items-center gap-1 shrink-0">
                                        <Stethoscope className="size-3" />
                                        <span>{pt.recentPrescriptions!.length} e-Rx Available</span>
                                      </span>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Patient Mini Card */}
                      {salePatientId && salePatientId !== 'walk-in-customer' && (
                        <div className="mt-2 p-2.5 rounded-[8px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{salePatientName}</p>
                            <p className="text-[11px] text-slate-500">MRN #{salePatientFileNumber || '---'} • {salePatientPhone}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setPatientSearchTerm('');
                              setIsPatientDropdownOpen(true);
                            }}
                            className="text-[11px] font-bold text-[#0d6157] hover:underline cursor-pointer"
                          >
                            Change Patient
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Physician / Origin
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {saleDoctorName || 'Direct Pharmacy Sale'}
                      </p>
                      <p className="text-xs text-[#0d6157] dark:text-teal-300 mt-0.5 font-medium">
                        Dispensing Pharmacist: {pharmacistName}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-[10px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Customer / Buyer Name
                        </label>
                        <input
                          type="text"
                          value={salePatientName}
                          onChange={(e) => setSalePatientName(e.target.value)}
                          placeholder="e.g. Walk-in Customer or Customer Name"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 font-bold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                        />
                      </div>

                      <div>
                        <label className="block text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Contact Phone (Optional)
                        </label>
                        <input
                          type="text"
                          value={salePatientPhone === 'N/A' ? '' : salePatientPhone}
                          onChange={(e) => setSalePatientPhone(e.target.value)}
                          placeholder="e.g. 05XXXXXXXX (Optional for receipt)"
                          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                        />
                      </div>
                    </div>

                    <div>
                      <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Sale Category / Origin
                      </span>
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-[8px] border border-slate-200 dark:border-slate-700 space-y-1">
                        <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <ShoppingCart className="size-3.5 text-[#0d6157]" />
                          <span>Walk-in / Retail Counter Sale</span>
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Direct OTC or non-clinic prescription sale.
                        </p>
                        <p className="text-[11px] text-[#0d6157] font-medium pt-1 border-t border-slate-100 dark:border-slate-800">
                          Pharmacist: {pharmacistName}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Doctor Prescription Available Quick Import Banner */}
              {customerType === 'CLINIC_PATIENT' && (() => {
                const currentPt = patients.find((p) => p.id === salePatientId);
                const rxList = currentPt?.recentPrescriptions || [];
                if (rxList.length === 0 || !rxList[0]) return null;
                const latestRx = rxList[0];
                return (
                  <div className="p-3.5 bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-[10px] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-[8px] bg-emerald-100 dark:bg-emerald-900/60 text-[#0d6157] dark:text-teal-300 flex items-center justify-center shrink-0">
                        <Stethoscope className="size-4" />
                      </div>
                      <div>
                        <p className="font-bold text-[#0d6157] dark:text-teal-300">
                          Doctor e-Prescription Available ({latestRx.prescriptionNumber})
                        </p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          Prescribed by Dr. {latestRx.doctorName} • {latestRx.medicines.length} medication(s) on {latestRx.date}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleImportPrescription(latestRx)}
                      className="px-3 py-1.5 bg-[#0d6157] hover:bg-[#0a4e46] text-white font-bold text-xs rounded-[6px] shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
                    >
                      <Plus className="size-3.5" />
                      <span>Import Prescribed Items</span>
                    </button>
                  </div>
                );
              })()}

              {/* Items Table Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="size-4 text-[#0d6157]" />
                    <span>Medications &amp; Pharmacy Items ({saleItems.length})</span>
                  </h3>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsAddingItemOpen(!isAddingItemOpen)}
                      className="px-3 py-1.5 text-xs font-bold text-[#0d6157] bg-[#e6f6f3] hover:bg-[#d8f0ec] dark:bg-teal-950/40 dark:text-teal-300 border border-[#0d8276]/30 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      <span>Add Extra Item / OTC</span>
                    </button>

                    {/* Popover to search & add inventory items */}
                    {isAddingItemOpen && (
                      <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-3 z-30 space-y-2">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search formulary drug or item..."
                            value={itemSearchQuery}
                            onChange={(e) => setItemSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[6px] pl-8 pr-2 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                            autoFocus
                          />
                        </div>

                        <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                          {inventoryItems
                            .filter(
                              (inv) =>
                                !itemSearchQuery.trim() ||
                                inv.name.toLowerCase().includes(itemSearchQuery.toLowerCase()) ||
                                inv.sku.toLowerCase().includes(itemSearchQuery.toLowerCase())
                            )
                            .slice(0, 8)
                            .map((inv) => (
                              <div
                                key={inv.id}
                                onClick={() => handleAddInventoryItemToSale(inv)}
                                className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 rounded cursor-pointer flex items-center justify-between"
                              >
                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white">{inv.name}</p>
                                  <p className="text-[10.5px] text-slate-400">
                                    Stock: {inv.currentStock} {inv.unit} • SAR {inv.salePrice.toFixed(2)}
                                  </p>
                                </div>
                                <Plus className="size-4 text-[#0d6157]" />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {saleItems.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-[10px] border border-dashed border-slate-200 dark:border-slate-700">
                    <Pill className="size-7 mx-auto text-slate-400 mb-1 opacity-50" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">No items selected</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Click "Add Extra Item / OTC" to add medications to this sale.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-slate-700 rounded-[10px] overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[650px]">
                        <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-[10.5px] font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="py-2.5 px-3">Item / Prescription</th>
                            <th className="py-2.5 px-3">Stock &amp; Batch</th>
                            <th className="py-2.5 px-3 text-center">Qty</th>
                            <th className="py-2.5 px-3">Unit Price (SAR)</th>
                            <th className="py-2.5 px-3">Total (SAR)</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {saleItems.map((item) => {
                            const matchedInv = item.inventoryItemId
                              ? inventoryItems.find((i) => i.id === item.inventoryItemId)
                              : matchInventoryItem(item.name);
                            const batches = matchedInv?.batches || [];
                            const isOut = (item.availableStock || 0) === 0;

                            return (
                              <tr
                                key={item.id}
                                className={cn(
                                  'hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors',
                                  item.isExternalPurchase && 'bg-blue-50/30 dark:bg-blue-950/20 opacity-75'
                                )}
                              >
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center gap-1.5">
                                    <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                                    {item.isPrescriptionItem && (
                                      <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#e6f6f3] text-[#0d6157] border border-[#0d8276]/20">
                                        Rx
                                      </span>
                                    )}
                                  </div>
                                  {item.dosage && (
                                    <p className="text-[10.5px] text-slate-400">
                                      {item.dosage} • {item.frequency} • {item.duration}
                                    </p>
                                  )}
                                  {item.isExternalPurchase && (
                                    <span className="inline-block mt-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                      * External Purchase (Patient buying outside - SAR 0)
                                    </span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      {isOut ? (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                          Out of Stock (0)
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          Stock: {item.availableStock}
                                        </span>
                                      )}
                                    </div>

                                    {batches.length > 0 && !item.isExternalPurchase && (
                                      <select
                                        value={item.batchId || batches[0]?.id}
                                        onChange={(e) => handleSelectItemBatch(item.id, e.target.value)}
                                        className="text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200"
                                      >
                                        {batches.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            Batch {b.batchNumber} (Exp: {b.expiryDate || 'N/A'} • Qty {b.quantity})
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  {item.isExternalPurchase ? (
                                    <span className="font-mono text-slate-400">0</span>
                                  ) : (
                                    <div className="inline-flex items-center border border-slate-200 dark:border-slate-700 rounded-[6px] overflow-hidden">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQuantity(item.id, item.quantity - 1)}
                                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                                      >
                                        -
                                      </button>
                                      <input
                                        type="number"
                                        min={1}
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                                        className="w-12 text-center text-xs font-mono font-bold bg-white dark:bg-slate-900 border-none focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                                        className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 font-bold"
                                      >
                                        +
                                      </button>
                                    </div>
                                  )}
                                </td>

                                <td className="py-2.5 px-3">
                                  {item.isExternalPurchase ? (
                                    <span className="font-mono text-slate-400">SAR 0.00</span>
                                  ) : (
                                    <div className="flex items-center gap-1 font-mono">
                                      <span>SAR</span>
                                      <input
                                        type="number"
                                        step="0.5"
                                        min={0}
                                        value={item.unitPrice}
                                        onChange={(e) => handleUpdateItemPrice(item.id, parseFloat(e.target.value) || 0)}
                                        className="w-16 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold"
                                      />
                                    </div>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 font-mono font-bold text-slate-900 dark:text-white">
                                  {item.isExternalPurchase ? 'SAR 0.00' : `SAR ${item.totalPrice.toFixed(2)}`}
                                </td>

                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleExternalPurchase(item.id)}
                                      className={cn(
                                        'px-2 py-1 rounded text-[10.5px] font-semibold transition-colors cursor-pointer',
                                        item.isExternalPurchase
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 hover:bg-slate-200'
                                      )}
                                      title="Mark as External Purchase if patient will buy elsewhere"
                                    >
                                      {item.isExternalPurchase ? 'External (Set)' : 'Mark External'}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSaleItem(item.id)}
                                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                                      title="Remove from sale"
                                    >
                                      <Trash2 className="size-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Checkout Financials & Payment Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-200 dark:border-slate-800">
                {/* Left: Payment Method & Notes */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'CASH', label: 'Cash', icon: Banknote },
                        { id: 'CARD', label: 'Card / POS', icon: CreditCard },
                        { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: ReceiptText },
                        { id: 'INSURANCE', label: 'Insurance', icon: CheckCircle2 },
                        { id: 'ONLINE', label: 'Online / App', icon: ShoppingCart },
                      ].map((pm) => {
                        const Icon = pm.icon;
                        const isSelected = paymentMethod === pm.id;
                        return (
                          <button
                            key={pm.id}
                            type="button"
                            onClick={() => setPaymentMethod(pm.id as any)}
                            className={cn(
                              'p-2.5 rounded-[8px] border text-left flex items-center gap-2 font-semibold transition-all cursor-pointer text-xs',
                              isSelected
                                ? 'bg-[#0d6157] text-white border-[#0d6157] shadow-2xs'
                                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100'
                            )}
                          >
                            <Icon className="size-4 shrink-0" />
                            <span>{pm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Pharmacist / Sale Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Advised patient to take after meals..."
                      value={saleNotes}
                      onChange={(e) => setSaleNotes(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[8px] px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0d6157]"
                    />
                  </div>
                </div>

                {/* Right: Subtotal, Discount, Total, Amount Paid, Balance */}
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Subtotal:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      SAR {saleFinancials.subtotal.toFixed(2)}
                    </span>
                  </div>

                  {/* Discount input row */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500 text-xs">Discount:</span>
                    <div className="flex items-center gap-1.5">
                      <div className="inline-flex rounded-[6px] border border-slate-200 dark:border-slate-700 overflow-hidden text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setDiscountType('FIXED')}
                          className={cn('px-2 py-0.5', discountType === 'FIXED' ? 'bg-[#0d6157] text-white' : 'bg-white dark:bg-slate-800 text-slate-600')}
                        >
                          SAR
                        </button>
                        <button
                          type="button"
                          onClick={() => setDiscountType('PERCENT')}
                          className={cn('px-2 py-0.5', discountType === 'PERCENT' ? 'bg-[#0d6157] text-white' : 'bg-white dark:bg-slate-800 text-slate-600')}
                        >
                          %
                        </button>
                      </div>
                      <input
                        type="number"
                        min={0}
                        max={discountType === 'PERCENT' ? 100 : saleFinancials.subtotal}
                        value={discountValue}
                        onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                        className="w-16 px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono font-bold text-right"
                      />
                    </div>
                  </div>

                  {saleFinancials.discountAmount > 0 && (
                    <div className="flex justify-between items-center text-xs text-emerald-600 font-medium">
                      <span>Discount Applied:</span>
                      <span className="font-mono">- SAR {saleFinancials.discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Net Total Amount */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Net Total Amount:
                    </span>
                    <span className="text-lg font-black text-[#0d6157] dark:text-teal-300 font-mono">
                      SAR {saleFinancials.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Amount Paid & Balance */}
                  <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount Paid:</span>
                        <button
                          type="button"
                          onClick={() => setAmountPaidInput(saleFinancials.totalAmount.toFixed(2))}
                          className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300"
                        >
                          Exact
                        </button>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold">
                        <span>SAR</span>
                        <input
                          type="number"
                          step="0.5"
                          min={0}
                          value={amountPaidInput}
                          onChange={(e) => setAmountPaidInput(e.target.value)}
                          className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[6px] text-xs font-mono font-bold text-right text-slate-900 dark:text-white focus:ring-1 focus:ring-[#0d6157]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      {saleFinancials.change > 0 ? (
                        <>
                          <span className="font-semibold text-emerald-600">Change Due to Patient:</span>
                          <span className="font-mono font-bold text-emerald-600">
                            SAR {saleFinancials.change.toFixed(2)}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className={cn('font-semibold', saleFinancials.balance > 0 ? 'text-amber-600' : 'text-slate-500')}>
                            Remaining Balance:
                          </span>
                          <span className={cn('font-mono font-bold', saleFinancials.balance > 0 ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300')}>
                            SAR {saleFinancials.balance.toFixed(2)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isSubmittingSale}
                onClick={handleCompleteSaleAndDispense}
                className="px-6 py-2.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-sm transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmittingSale ? (
                  <>
                    <RefreshCw className="size-4 animate-spin" />
                    <span>Processing Sale...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-4" />
                    <span>Complete Sale &amp; Dispense</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: PRINTABLE PHARMACY RECEIPT ────────────────────────────────────────── */}
      {activeReceipt && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150 my-auto">
            {/* Action Bar Header */}
            <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ReceiptText className="size-4 text-[#0d6157]" />
                <span className="font-bold text-xs text-slate-800 dark:text-white">Pharmacy Sale Receipt</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[6px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="size-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReceipt(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div id="printable-pharmacy-receipt" className="p-6 overflow-y-auto space-y-4 font-mono text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
              {/* Receipt Clinic Title */}
              <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                <h2 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  {clinicName}
                </h2>
                <p className="text-[11px] text-slate-500">Pharmacy Station &amp; Outpatient Dispensary</p>
                <p className="text-[10px] text-slate-400">Official Point-of-Sale Dispensing Voucher</p>
              </div>

              {/* Receipt Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px] py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block">Receipt / Invoice #:</span>
                  <span className="font-bold font-mono">{activeReceipt.invoiceNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Date &amp; Time:</span>
                  <span>{activeReceipt.receiptDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Customer / Patient:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{activeReceipt.patientName}</span>
                    {activeReceipt.patientFileNumber && activeReceipt.patientFileNumber !== 9999 ? (
                      <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        MRN #{activeReceipt.patientFileNumber}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Walk-in Retail
                      </span>
                    )}
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {activeReceipt.patientPhone && !activeReceipt.patientPhone.startsWith('walkin') && activeReceipt.patientPhone !== '0000000000'
                      ? `Tel: ${activeReceipt.patientPhone}`
                      : 'Retail OTC Sale'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Attending Doctor:</span>
                  <span>{activeReceipt.doctorName || 'Direct Pharmacy'}</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="space-y-1.5 py-2 border-b border-dashed border-slate-300 dark:border-slate-700">
                <div className="flex justify-between text-[10.5px] font-bold text-slate-400 uppercase pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span>Item Description</span>
                  <span>Qty × Price = Total</span>
                </div>

                {activeReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-start text-[11px]">
                    <div>
                      <p className="font-bold">{it.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {it.batchNumber ? `Batch: ${it.batchNumber}` : ''} {it.expiryDate ? `• Exp: ${it.expiryDate}` : ''}
                      </p>
                      {it.isExternalPurchase && (
                        <p className="text-[10px] text-blue-600 font-semibold">* External Purchase</p>
                      )}
                    </div>
                    <div className="text-right">
                      {it.isExternalPurchase ? (
                        <span>SAR 0.00</span>
                      ) : (
                        <span>
                          {it.quantity} × {it.unitPrice.toFixed(2)} = SAR {it.totalPrice.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals Breakdown */}
              <div className="space-y-1 pt-1 text-right text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>SAR {activeReceipt.subtotal.toFixed(2)}</span>
                </div>
                {activeReceipt.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount:</span>
                    <span>- SAR {activeReceipt.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <span>Total Amount:</span>
                  <span>SAR {activeReceipt.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Payment Method ({activeReceipt.paymentMethod}):</span>
                  <span>SAR {activeReceipt.amountPaid.toFixed(2)}</span>
                </div>
                {activeReceipt.balance > 0 && (
                  <div className="flex justify-between text-amber-600 font-bold">
                    <span>Balance Due:</span>
                    <span>SAR {activeReceipt.balance.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Footer Note */}
              <div className="text-center pt-4 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[10.5px] text-slate-400">
                <p>Dispensed by: {activeReceipt.pharmacistName}</p>
                <p>Thank you for choosing {clinicName}. Please take medications strictly as directed by your physician.</p>
              </div>
            </div>

            {/* Receipt Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-[8px] hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PRESCRIPTION SLIDE-OVER DETAILS DRAWER ──────────────────────────────── */}
      {isDrawerOpen && selectedPrescription && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={handleCloseDrawer}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg md:max-w-xl bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-300">
              {/* Drawer Header */}
              <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-[10px] bg-[#0d6157]/10 dark:bg-[#0d6157]/20 border border-[#0d6157]/20 flex items-center justify-center text-[#0d6157] dark:text-teal-300">
                    <Pill className="size-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                        {selectedPrescription.prescriptionNumber}
                      </h2>
                      {selectedPrescription.status === 'DISPENSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#e6f6f3] text-[#0d6157] border border-[#0d8276]/30 dark:bg-teal-950/40 dark:border-teal-700/50">
                          <CheckCircle2 className="size-3" /> Dispensed
                        </span>
                      ) : selectedPrescription.status === 'PARTIALLY_DISPENSED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
                          <Split className="size-3" /> Partially Dispensed
                        </span>
                      ) : selectedPrescription.status === 'EXTERNAL_PURCHASE' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40">
                          <ShoppingCart className="size-3" /> External Purchase
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800/40">
                          <Clock className="size-3" /> Pending Dispense
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <Calendar className="size-3 text-slate-400" />
                      Prescribed on {selectedPrescription.createdAt}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDrawer}
                  className="p-1.5 rounded-[8px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
                {/* 1. Patient & Prescriber Quick Card */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-[8px]">
                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                      <User className="size-3" />
                      <span>Patient</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{selectedPrescription.patientName}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                      MRN #{selectedPrescription.patientFileNumber || '---'} • {selectedPrescription.patientPhone}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] uppercase font-bold tracking-wider mb-1">
                      <Stethoscope className="size-3" />
                      <span>Prescribing Doctor</span>
                    </div>
                    <p className="font-bold text-slate-900 dark:text-white text-xs">{selectedPrescription.doctorName}</p>
                    <p className="text-[11px] text-[#0d6157] dark:text-teal-400 mt-0.5">
                      {selectedPrescription.doctorSpecialty || 'Attending Physician'}
                    </p>
                  </div>
                </div>

                {/* 2. Prescribed Medicines List with Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                      <Pill className="size-3.5 text-[#0d6157]" />
                      <span>Prescription Items ({selectedPrescription.medicines.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {selectedPrescription.medicines.map((med, idx) => {
                      const isZeroStock = med.availableStock === 0;
                      const isPartial = med.availableStock > 0 && med.availableStock < med.quantity;
                      const isExternal = med.fulfillmentStatus === 'EXTERNAL_PURCHASE';
                      const isPartiallyDispensed = med.fulfillmentStatus === 'PARTIALLY_DISPENSED';
                      const isAltRequested = med.fulfillmentStatus === 'ALTERNATIVE_REQUESTED';
                      const isRestockRequested = med.fulfillmentStatus === 'RESTOCK_REQUESTED';

                      return (
                        <div
                          key={med.id || idx}
                          className={cn(
                            'p-4 rounded-[8px] border transition-all space-y-2.5',
                            isExternal
                              ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50'
                              : isZeroStock
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                              : isPartial
                              ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-2xs'
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900 dark:text-white text-xs">{med.name}</span>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                                <span>Dosage: <strong className="text-slate-700 dark:text-slate-200">{med.dosage}</strong></span>
                                <span>•</span>
                                <span>Freq: <strong className="text-slate-700 dark:text-slate-200">{med.frequency}</strong></span>
                                <span>•</span>
                                <span>Duration: <strong className="text-slate-700 dark:text-slate-200">{med.duration}</strong></span>
                              </div>
                              {med.instructions && (
                                <p className="text-[10.5px] text-slate-500 italic mt-0.5">Note: "{med.instructions}"</p>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="block font-bold text-slate-900 dark:text-white font-mono text-xs">
                                {med.quantity} Units Prescribed
                              </span>
                              <span className="text-[10.5px] text-slate-400 font-mono">
                                SAR {(med.unitPrice * med.quantity).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Stock Status Pill */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                            <div className="flex items-center gap-1.5">
                              {isZeroStock ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200">
                                  <AlertTriangle className="size-3" /> OUT OF STOCK (0 in stock)
                                </span>
                              ) : isPartial ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200">
                                  <Split className="size-3" /> PARTIAL STOCK ({med.availableStock} of {med.quantity} available)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200">
                                  <CheckCircle2 className="size-3" /> IN STOCK ({med.availableStock} available)
                                </span>
                              )}
                            </div>

                            {med.batchNumber && (
                              <span className="text-[10px] text-slate-400 font-mono">
                                Batch: {med.batchNumber} {med.expiryDate ? `(Exp: ${med.expiryDate})` : ''}
                              </span>
                            )}
                          </div>

                          {/* Status Action Badges */}
                          {isExternal && (
                            <div className="p-2 rounded bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-1">
                                <ShoppingCart className="size-3.5" /> Patient Will Buy Externally (SAR 0.00 billed)
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetItemAction(med.id)}
                                className="text-[10px] underline font-bold cursor-pointer hover:text-blue-950"
                              >
                                Undo
                              </button>
                            </div>
                          )}

                          {isAltRequested && (
                            <div className="p-2 rounded bg-purple-100/70 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-[11px] flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-1">
                                <MessageSquare className="size-3.5" /> Doctor Alternative Requested: "{med.doctorAlternativeNote}"
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetItemAction(med.id)}
                                className="text-[10px] underline font-bold cursor-pointer hover:text-purple-950"
                              >
                                Undo
                              </button>
                            </div>
                          )}

                          {isRestockRequested && (
                            <div className="p-2 rounded bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] flex items-center justify-between">
                              <span className="font-semibold flex items-center gap-1">
                                <PackagePlus className="size-3.5" /> Restock Requested ({med.restockNote})
                              </span>
                              <button
                                type="button"
                                onClick={() => handleResetItemAction(med.id)}
                                className="text-[10px] underline font-bold cursor-pointer hover:text-amber-950"
                              >
                                Undo
                              </button>
                            </div>
                          )}

                          {/* Action Buttons for Out-of-Stock / Partial Stock */}
                          {!isExternal && !isAltRequested && !isRestockRequested && selectedPrescription.status !== 'DISPENSED' && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700/60">
                              {isZeroStock && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleMarkExternalPurchase(med.id)}
                                    className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <ShoppingCart className="size-3" />
                                    <span>Patient Buys Externally</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenDoctorAltModal(med)}
                                    className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <MessageSquare className="size-3" />
                                    <span>Request Alternative</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenRestockModal(med)}
                                    className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <PackagePlus className="size-3" />
                                    <span>Request Restock</span>
                                  </button>
                                </>
                              )}

                              {isPartial && !isPartiallyDispensed && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenPartialDispenseModal(med)}
                                    className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-semibold bg-[#0d6157]/10 text-[#0d6157] hover:bg-[#0d6157]/20 border border-[#0d8276]/30 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <Split className="size-3" />
                                    <span>Partial Dispense ({med.availableStock} Units)</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleMarkExternalPurchase(med.id)}
                                    className="px-2.5 py-1 rounded-[6px] text-[10.5px] font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer flex items-center gap-1"
                                  >
                                    <ShoppingCart className="size-3" />
                                    <span>Mark Full External</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Printer className="size-3.5" />
                  <span>Print Rx</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-[8px] transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  {selectedPrescription.status !== 'DISPENSED' && selectedPrescription.status !== 'EXTERNAL_PURCHASE' && (
                    <button
                      type="button"
                      onClick={() => handleOpenCreateSaleModal(selectedPrescription)}
                      className="px-5 py-2 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <ShoppingCart className="size-4" />
                      <span>Create Pharmacy Sale</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 1: REQUEST DOCTOR ALTERNATIVE ─────────────────────────── */}
      {activeActionModal && activeActionModal.type === 'DOCTOR_ALT' && selectedPrescription && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <MessageSquare className="size-4 text-purple-600" />
                  Request Doctor Alternative
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Medicine: <span className="font-bold text-slate-800 dark:text-slate-200">{activeActionModal.medName}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 rounded-[8px] text-[11px] text-purple-900 dark:text-purple-300">
              <span className="font-bold block mb-0.5">Clinical Protocol Reminder:</span>
              Pharmacists are legally restricted from substituting chemical entities or dosages without explicit attending physician authorization.
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Message / Suggested Alternative to Dr. {selectedPrescription.doctorName}:
              </label>
              <textarea
                rows={3}
                value={doctorAltNoteInput}
                onChange={(e) => setDoctorAltNoteInput(e.target.value)}
                className="w-full px-3 py-2 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                placeholder="State out-of-stock condition and recommend alternative formulation..."
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDoctorAlternative}
                className="px-4 py-1.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="size-3.5" />
                <span>Send to Doctor</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: REQUEST RESTOCK REQUISITION ────────────────────────── */}
      {activeActionModal && activeActionModal.type === 'RESTOCK' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <PackagePlus className="size-4 text-amber-600" />
                  Request Restock Requisition
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Medicine: <span className="font-bold text-slate-800 dark:text-slate-200">{activeActionModal.medName}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requisition Quantity (Units / Packs):
                </label>
                <input
                  type="number"
                  min={1}
                  value={restockQtyInput}
                  onChange={(e) => setRestockQtyInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Requisition Note / Priority:
                </label>
                <input
                  type="text"
                  value={restockNoteInput}
                  onChange={(e) => setRestockNoteInput(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <PackagePlus className="size-3.5" />
                <span>Submit Restock Requisition</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: PARTIAL DISPENSE CONFIGURATION ───────────────────────── */}
      {activeActionModal && activeActionModal.type === 'PARTIAL_DISPENSE' && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[10px] max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Split className="size-4 text-[#0d6157]" />
                  Partial Dispense Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Medicine: <span className="font-bold text-slate-800 dark:text-slate-200">{activeActionModal.medName}</span>
                </p>
              </div>
              <button
                onClick={() => setActiveActionModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-3 rounded-[8px] bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Prescribed Quantity:</span>
                <span className="font-bold font-mono text-slate-900 dark:text-white">{activeActionModal.required} Units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Available Clinic Stock:</span>
                <span className="font-bold font-mono text-emerald-600">{activeActionModal.available} Units</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Units to Dispense In-House Now (Max {activeActionModal.available}):
                </label>
                <input
                  type="number"
                  min={1}
                  max={activeActionModal.available}
                  value={partialDispenseQtyInput}
                  onChange={(e) => setPartialDispenseQtyInput(Math.min(activeActionModal.available, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-3 py-1.5 rounded-[8px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Remaining Balance ({Math.max(0, activeActionModal.required - partialDispenseQtyInput)} Units) Resolution:
                </label>
                <div className="space-y-2 text-xs">
                  <label className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="remainderAction"
                      checked={partialRemainderActionInput === 'EXTERNAL'}
                      onChange={() => setPartialRemainderActionInput('EXTERNAL')}
                    />
                    <span>Mark remaining for External Outpatient Purchase</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                    <input
                      type="radio"
                      name="remainderAction"
                      checked={partialRemainderActionInput === 'RESTOCK'}
                      onChange={() => setPartialRemainderActionInput('RESTOCK')}
                    />
                    <span>Await clinic inventory restock for remaining balance</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveActionModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPartialDispense}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[#0d6157] hover:bg-[#0a4e46] rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="size-3.5" />
                <span>Confirm Partial Dispense</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
