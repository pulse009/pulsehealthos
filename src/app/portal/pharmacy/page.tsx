import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  PharmacistPortalView,
  type PrescriptionOrder,
  type PrescribedMedicine,
  type InventoryItemStock,
  type PatientOption,
  type PatientPrescriptionInfo,
} from '@/components/dashboard/pharmacy/PharmacistPortalView';

export const metadata: Metadata = { title: 'Pharmacy Station - Prescriptions & Formulary' };
export const dynamic = 'force-dynamic';

// Helper: Check if an item is a consultation charge or lab investigation
function isConsultationOrLabItem(description: string, serviceId?: string | null): boolean {
  if (serviceId) return true;
  const desc = description.toLowerCase().trim();
  if (
    desc.startsWith('consultation') ||
    desc.includes('doctor consultation') ||
    desc.includes('follow-up') ||
    desc.includes('consult') ||
    desc.includes('checkup') ||
    desc.includes('examination')
  ) {
    return true;
  }
  if (
    desc.startsWith('lab') ||
    desc.includes('investigation') ||
    desc.includes('pathology') ||
    desc.includes('radiology') ||
    desc.includes('panel') ||
    desc.includes('blood count') ||
    desc.includes('x-ray') ||
    desc.includes('ultrasound') ||
    desc.includes('ecg') ||
    desc.includes('biochemistry') ||
    desc.includes('urine routine') ||
    desc.includes('lipid profile') ||
    desc.includes('lft') ||
    desc.includes('rft') ||
    desc.includes('hba1c') ||
    desc.includes('fbs')
  ) {
    return true;
  }
  return false;
}

// Helper: Calculate standard quantity from dosage frequency and duration
function parseQuantityFromPrescription(frequency?: string, duration?: string): number {
  if (!frequency && !duration) return 10;

  let days = 5;
  const durLower = (duration || '').toLowerCase();
  if (durLower.includes('3 day')) days = 3;
  else if (durLower.includes('5 day')) days = 5;
  else if (durLower.includes('7 day') || durLower.includes('1 week')) days = 7;
  else if (durLower.includes('10 day')) days = 10;
  else if (durLower.includes('14 day') || durLower.includes('2 week')) days = 14;
  else if (durLower.includes('30 day') || durLower.includes('1 month')) days = 30;
  else {
    const numMatch = durLower.match(/\d+/);
    if (numMatch) {
      const parsed = parseInt(numMatch[0], 10);
      if (!isNaN(parsed) && parsed > 0) days = parsed;
    }
  }

  let dosesPerDay = 2;
  const freqLower = (frequency || '').toLowerCase();
  if (freqLower.includes('1-1-1') || freqLower.includes('thrice') || freqLower.includes('tid') || freqLower.includes('three times')) {
    dosesPerDay = 3;
  } else if (freqLower.includes('1-0-1') || freqLower.includes('twice') || freqLower.includes('bid') || freqLower.includes('two times')) {
    dosesPerDay = 2;
  } else if (freqLower.includes('1-0-0') || freqLower.includes('0-0-1') || freqLower.includes('once') || freqLower.includes('qd') || freqLower.includes('daily')) {
    dosesPerDay = 1;
  } else if (freqLower.includes('q6h') || freqLower.includes('4 times') || freqLower.includes('qid')) {
    dosesPerDay = 4;
  } else if (freqLower.includes('prn') || freqLower.includes('needed') || freqLower.includes('sos')) {
    dosesPerDay = 1;
  }

  return Math.max(1, days * dosesPerDay);
}

export default async function PharmacyStationPage() {
  const { user, clinicId } = await requireClientUser();

  const [clinic, rawInventoryItems, rawEncounters, rawInvoices, rawPatients] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.inventoryItem.findMany({
      where: {
        clinicId: clinicId!,
        inventoryScope: { in: ['PHARMACY', 'SHARED'] },
      },
      include: {
        category: { select: { name: true } },
        batches: {
          select: { id: true, batchNumber: true, expiryDate: true, quantity: true, unitCost: true },
          orderBy: { receivedDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
      take: 100,
    }),
    prisma.clinicalEncounter.findMany({
      where: {
        clinicId: clinicId!,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
      },
    }),
    prisma.invoice.findMany({
      where: {
        clinicId: clinicId!,
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        patient: { select: { id: true, name: true, phone: true, fileNumber: true, tags: true } },
        doctor: { select: { id: true, name: true, specialty: true } },
        items: {
          include: {
            inventoryItem: {
              include: {
                batches: true,
              },
            },
          },
        },
      },
    }),
    prisma.patient.findMany({
      where: { clinicId: clinicId! },
      orderBy: { name: 'asc' },
      take: 100,
      select: { id: true, name: true, phone: true, fileNumber: true, tags: true },
    }),
  ]);

  // Transform inventory items with their available batch details
  const inventoryItems: InventoryItemStock[] = rawInventoryItems.map((item) => {
    let nextExpiry: string | null = null;
    if (item.batches && item.batches.length > 0) {
      const validBatches = item.batches.filter((b) => b.expiryDate !== null);
      if (validBatches.length > 0) {
        const sorted = [...validBatches].sort(
          (a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime()
        );
        const firstBatch = sorted[0];
        if (firstBatch && firstBatch.expiryDate) {
          nextExpiry = new Date(firstBatch.expiryDate).toLocaleDateString();
        }
      }
    }

    return {
      id: item.id,
      sku: item.sku || 'N/A',
      name: item.name,
      categoryName: item.category?.name || 'General Medication',
      unit: item.unit,
      currentStock: item.currentStock,
      reorderLevel: item.minimumStock || 0,
      salePrice: Number(item.defaultCost || 15),
      batchesCount: item.batches?.length || 0,
      nextExpiry,
      batches: item.batches.map((b) => ({
        id: b.id,
        batchNumber: b.batchNumber,
        expiryDate: b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : null,
        quantity: b.quantity,
        unitCost: Number(b.unitCost || item.defaultCost || 0),
      })),
    };
  });

  // Helper to match medicine name with inventory item
  const findInventoryMatch = (medicineName: string) => {
    if (!medicineName) return null;
    const nameLower = medicineName.toLowerCase().trim();
    return (
      rawInventoryItems.find((inv) => {
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

  // Map unfulfilled doctor prescriptions by patient (available for manual import during Create Sale)
  const patientPrescriptionsMap = new Map<string, PatientPrescriptionInfo[]>();

  for (const enc of rawEncounters) {
    if (!enc.prescriptionsJson) continue;
    const rxList = Array.isArray(enc.prescriptionsJson) ? (enc.prescriptionsJson as any[]) : [];
    if (rxList.length === 0) continue;

    const dateStr = new Date(enc.createdAt).toLocaleDateString();

    const medicines: PrescribedMedicine[] = rxList.map((rx, idx) => {
      const matchedInv = findInventoryMatch(rx.medicineName);
      const availableStock = matchedInv ? matchedInv.currentStock : 0;
      const firstBatch = matchedInv?.batches?.[0];
      const batchNumber = firstBatch?.batchNumber || undefined;
      const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate).toLocaleDateString() : undefined;
      const unitPrice = Number(matchedInv?.defaultCost || 0);
      const qty = Number(rx.quantity) || parseQuantityFromPrescription(rx.frequency, rx.duration);
      const isDispensed = Boolean(rx.isDispensed);

      return {
        id: rx.id || `rx-med-${enc.id}-${idx}`,
        name: rx.medicineName || 'Medication',
        dosage: rx.dosage || 'Standard',
        frequency: rx.frequency || 'As prescribed',
        duration: rx.duration || 'Standard',
        route: rx.route || 'Oral',
        instructions: rx.instructions || '',
        quantity: qty,
        availableStock,
        unitPrice,
        batchNumber,
        expiryDate,
        isDispensed,
        fulfillmentStatus: rx.fulfillmentStatus || (isDispensed ? 'DISPENSED' : 'PENDING'),
      };
    });

    const isAllDispensed = medicines.every((m) => m.fulfillmentStatus === 'DISPENSED');
    if (!isAllDispensed && enc.patientId) {
      const existingList = patientPrescriptionsMap.get(enc.patientId) || [];
      existingList.push({
        encounterId: enc.id,
        doctorId: enc.doctorId || undefined,
        doctorName: enc.doctor?.name || 'Attending Physician',
        doctorSpecialty: enc.doctor?.specialty || 'Consultant',
        prescriptionNumber: `RX-${enc.id.slice(-6).toUpperCase()}`,
        date: dateStr,
        medicines,
      });
      patientPrescriptionsMap.set(enc.patientId, existingList);
    }
  }

  // Process completed direct Pharmacy Sales / Invoices only (for the Dispensed History tab)
  const initialPrescriptions: PrescriptionOrder[] = [];

  for (const inv of rawInvoices) {
    const pureMedItems = inv.items.filter((it) => !isConsultationOrLabItem(it.description, it.serviceId));
    if (pureMedItems.length === 0) continue;

    const dateStr = new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isDispensed = inv.status === 'PAID' || inv.invoiceNumber.startsWith('PHARM-') || Number(inv.paidAmount) >= Number(inv.totalAmount);
    const saleStatus = isDispensed ? 'DISPENSED' : inv.status === 'PARTIALLY_PAID' ? 'PARTIALLY_DISPENSED' : 'DISPENSED';
    const isWalkIn = !inv.patient?.fileNumber || Boolean(inv.patient?.tags?.includes('WALK_IN_CUSTOMER')) || Boolean(inv.patient?.phone?.startsWith('walkin'));
    const displayPhone = inv.patient?.phone && !inv.patient.phone.startsWith('walkin') ? inv.patient.phone : '';

    const medicines: PrescribedMedicine[] = pureMedItems.map((it, idx) => {
      const matchedInv = it.inventoryItem || findInventoryMatch(it.description);
      const availableStock = matchedInv ? matchedInv.currentStock : 0;
      const firstBatch = matchedInv?.batches?.[0];
      const batchNumber = firstBatch?.batchNumber || undefined;
      const expiryDate = firstBatch?.expiryDate ? new Date(firstBatch.expiryDate).toLocaleDateString() : undefined;
      const unitPrice = Number(it.unitPrice || matchedInv?.defaultCost || 0);

      return {
        id: it.id || `inv-item-${idx}`,
        name: it.description,
        dosage: 'Standard',
        frequency: 'As prescribed',
        duration: 'Standard',
        route: 'Oral',
        instructions: '',
        quantity: it.quantity || 1,
        availableStock,
        unitPrice,
        batchNumber,
        expiryDate,
        isDispensed: true,
        fulfillmentStatus: saleStatus,
      };
    });

    const totalAmount = medicines.reduce((sum, m) => sum + m.unitPrice * m.quantity, 0);

    initialPrescriptions.push({
      id: inv.id,
      prescriptionNumber: inv.invoiceNumber || `PHARM-${inv.id.slice(-4).toUpperCase()}`,
      patientId: inv.patientId,
      patientName: inv.patient?.name || (isWalkIn ? 'Walk-in Customer' : 'Patient'),
      patientFileNumber: isWalkIn ? null : (inv.patient?.fileNumber || null),
      patientPhone: displayPhone,
      isWalkIn,
      doctorId: inv.doctorId || undefined,
      doctorName: inv.doctor?.name || (isWalkIn ? 'Direct Pharmacy Sale' : 'Attending Physician'),
      doctorSpecialty: inv.doctor?.specialty || (isWalkIn ? 'Point of Sale' : 'Consultant Physician'),
      createdAt: `Today at ${dateStr}`,
      status: saleStatus,
      medicines,
      totalAmount,
    });
  }

  const patientOptions: PatientOption[] = rawPatients
    .filter((p) => !(p.tags && p.tags.includes('WALK_IN_CUSTOMER')) && !(p.phone && p.phone.startsWith('walkin')))
    .map((p) => ({
      id: p.id,
      name: p.name || 'Patient',
      phone: p.phone,
      fileNumber: p.fileNumber,
      recentPrescriptions: patientPrescriptionsMap.get(p.id) || [],
    }));

  return (
    <PharmacistPortalView
      clinicName={clinic?.name || 'Clinic'}
      pharmacistName={user.name || user.email || 'Lead Pharmacist'}
      initialPrescriptions={initialPrescriptions}
      inventoryItems={inventoryItems}
      patients={patientOptions}
    />
  );
}
