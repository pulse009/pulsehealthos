import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  PharmacistPortalView,
  type PrescriptionOrder,
  type InventoryItemStock,
} from '@/components/dashboard/pharmacy/PharmacistPortalView';

export const metadata: Metadata = { title: 'Pharmacy Station - Prescriptions & Formulary' };
export const dynamic = 'force-dynamic';

export default async function PharmacyStationPage() {
  const { user, clinicId } = await requireClientUser();

  const [clinic, rawInventoryItems, rawInvoices] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.inventoryItem.findMany({
      where: { clinicId: clinicId! },
      include: {
        category: { select: { name: true } },
        batches: { select: { batchNumber: true, expiryDate: true, quantity: true } },
      },
      orderBy: { name: 'asc' },
      take: 50,
    }),
    prisma.invoice.findMany({
      where: { clinicId: clinicId! },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        patient: { select: { id: true, name: true, phone: true, fileNumber: true } },
        items: true,
      },
    }),
  ]);

  // Transform inventory items
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
      salePrice: Number(item.defaultCost || 0),
      batchesCount: item.batches?.length || 0,
      nextExpiry,
    };
  });

  // Map real prescriptions from DB invoices (or empty if none)
  const initialPrescriptions: PrescriptionOrder[] = rawInvoices
    .filter((inv) => inv.items.length > 0)
    .map((inv) => {
      const dateStr = new Date(inv.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      return {
        id: inv.id,
        prescriptionNumber: inv.invoiceNumber || `RX-${inv.id.slice(-4).toUpperCase()}`,
        patientId: inv.patientId,
        patientName: inv.patient?.name || 'Patient',
        patientFileNumber: inv.patient?.fileNumber,
        patientPhone: inv.patient?.phone || 'N/A',
        doctorName: 'Attending Physician',
        createdAt: `Today at ${dateStr}`,
        status: inv.status === 'PAID' ? 'DISPENSED' : 'PENDING',
        medicines: inv.items.map((it) => ({
          id: it.id,
          name: it.description,
          dosage: 'Standard',
          frequency: 'As prescribed',
          duration: 'Standard',
          quantity: it.quantity,
          availableStock: 10,
          unitPrice: Number(it.unitPrice),
          isDispensed: inv.status === 'PAID',
        })),
        totalAmount: Number(inv.totalAmount),
      };
    });

  return (
    <PharmacistPortalView
      clinicName={clinic?.name || 'Clinic'}
      pharmacistName={user.name || user.email || 'Lead Pharmacist'}
      initialPrescriptions={initialPrescriptions}
      inventoryItems={inventoryItems}
    />
  );
}
