import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getInventoryItemDetail } from '@/lib/inventory/inventory.service';
import { InventoryItemDetailView } from '@/components/dashboard/inventory/InventoryItemDetailView';

export const dynamic = 'force-dynamic';

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ itemId: string }>;
}) {
  const { user, scope } = await requireClientUser();

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/appointments');
  }

  const { itemId } = await params;

  let item;
  try {
    item = await getInventoryItemDetail(scope, itemId);
  } catch {
    notFound();
  }

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <InventoryItemDetailView
        item={item as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
