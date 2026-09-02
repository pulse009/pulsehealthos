import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listInventoryItems } from '@/lib/inventory/inventory.service';
import { prisma } from '@/lib/db/prisma';
import { InventoryLowStockView } from '@/components/dashboard/inventory/InventoryLowStockView';

export const dynamic = 'force-dynamic';

export default async function InventoryLowStockPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  // Expiring in next 90 days
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);

  const [items, expiringBatches] = await Promise.all([
    listInventoryItems(scope, clinicId),
    prisma.inventoryBatch.findMany({
      where: {
        item: { clinicId },
        quantity: { gt: 0 },
        expiryDate: { lte: ninetyDaysFromNow },
      },
      include: {
        item: {
          select: { id: true, name: true, sku: true, unit: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    }),
  ]);

  const lowStockItems = items.filter((i: any) => i.currentStock <= i.minimumStock);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryLowStockView
        lowStockItems={lowStockItems as any}
        expiringBatches={expiringBatches as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
