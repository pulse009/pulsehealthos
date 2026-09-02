import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getFinancialMetrics } from '@/lib/accounts/accounts.service';
import { AccountsDashboardView } from '@/components/dashboard/accounts/AccountsDashboardView';

export const dynamic = 'force-dynamic';

export default async function AccountsDashboardPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/accounts/invoices');
  }

  if (user.role === 'DOCTOR') {
    redirect('/portal/accounts/doctor-payouts');
  }

  const metrics = await getFinancialMetrics(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AccountsDashboardView
        metrics={metrics as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
