import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listStockMovements } from '@/lib/inventory/inventory.service';
import { InventoryMovementsView } from '@/components/dashboard/inventory/InventoryMovementsView';

export const dynamic = 'force-dynamic';

export default async function InventoryMovementsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const movements = await listStockMovements(scope, clinicId, { limit: 100 });

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryMovementsView
        initialMovements={movements as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
