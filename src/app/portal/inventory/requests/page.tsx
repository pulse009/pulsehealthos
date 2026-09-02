import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import {
  listItemRequests,
  listInventoryItems,
} from '@/lib/inventory/inventory.service';
import { InventoryRequestsView } from '@/components/dashboard/inventory/InventoryRequestsView';

export const dynamic = 'force-dynamic';

export default async function InventoryRequestsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/appointments');
  }

  const [requests, items] = await Promise.all([
    listItemRequests(scope, clinicId),
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
      <InventoryRequestsView
        initialRequests={requests as any}
        availableItems={items as any}
        clinicName={user.clinicName || 'Clinic'}
        currentUserRole={user.role}
      />
    </Suspense>
  );
}
