import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getInventoryMetrics } from '@/lib/inventory/inventory.service';
import { InventoryDashboardView } from '@/components/dashboard/inventory/InventoryDashboardView';

export const dynamic = 'force-dynamic';

export default async function InventoryDashboardPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/appointments');
  }

  if (user.role === 'DOCTOR') {
    redirect('/portal/inventory/requests');
  }

  const metrics = await getInventoryMetrics(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryDashboardView
        metrics={metrics as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
