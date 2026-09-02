import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import {
  listInventoryItems,
  listInventoryCategories,
  listSuppliers,
} from '@/lib/inventory/inventory.service';
import { InventoryItemsView } from '@/components/dashboard/inventory/InventoryItemsView';

export const dynamic = 'force-dynamic';

export default async function InventoryItemsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const [items, categories, suppliers] = await Promise.all([
    listInventoryItems(scope, clinicId),
    listInventoryCategories(scope, clinicId),
    listSuppliers(scope, clinicId),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryItemsView
        initialItems={items as any}
        categories={categories}
        suppliers={suppliers}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
