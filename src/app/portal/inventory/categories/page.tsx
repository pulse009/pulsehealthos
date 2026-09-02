import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listInventoryCategories } from '@/lib/inventory/inventory.service';
import { InventoryCategoriesView } from '@/components/dashboard/inventory/InventoryCategoriesView';

export const dynamic = 'force-dynamic';

export default async function InventoryCategoriesPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const categories = await listInventoryCategories(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryCategoriesView
        initialCategories={categories as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
