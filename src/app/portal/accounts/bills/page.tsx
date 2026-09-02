import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listSupplierBills } from '@/lib/accounts/accounts.service';
import { prisma } from '@/lib/db/prisma';
import { AccountsSupplierBillsView } from '@/components/dashboard/accounts/AccountsSupplierBillsView';

export const dynamic = 'force-dynamic';

export default async function AccountsSupplierBillsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/accounts/doctor-payouts');
  }

  const [bills, suppliers, purchaseOrders] = await Promise.all([
    listSupplierBills(scope, clinicId),
    prisma.supplier.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.purchaseOrder.findMany({
      where: { clinicId },
      select: { id: true, poNumber: true, supplierId: true, totalAmount: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AccountsSupplierBillsView
        initialBills={bills as any}
        suppliers={suppliers}
        purchaseOrders={purchaseOrders}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
