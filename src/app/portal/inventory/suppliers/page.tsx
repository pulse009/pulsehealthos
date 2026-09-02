import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listSuppliers } from '@/lib/inventory/inventory.service';
import { InventorySuppliersView } from '@/components/dashboard/inventory/InventorySuppliersView';

export const dynamic = 'force-dynamic';

export default async function InventorySuppliersPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const suppliers = await listSuppliers(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventorySuppliersView
        initialSuppliers={suppliers as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
