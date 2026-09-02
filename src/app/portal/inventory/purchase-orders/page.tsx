import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import {
  listPurchaseOrders,
  listSuppliers,
  listInventoryItems,
} from '@/lib/inventory/inventory.service';
import { InventoryPurchaseOrdersView } from '@/components/dashboard/inventory/InventoryPurchaseOrdersView';

export const dynamic = 'force-dynamic';

export default async function InventoryPurchaseOrdersPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const [purchaseOrders, suppliers, items] = await Promise.all([
    listPurchaseOrders(scope, clinicId),
    listSuppliers(scope, clinicId),
    listInventoryItems(scope, clinicId, { isActive: true }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryPurchaseOrdersView
        initialPOs={purchaseOrders as any}
        suppliers={suppliers}
        availableItems={items as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
