import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getProfitAndLossReport } from '@/lib/accounts/accounts.service';
import { AccountsReportsView } from '@/components/dashboard/accounts/AccountsReportsView';

export const dynamic = 'force-dynamic';

export default async function AccountsReportsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/accounts/doctor-payouts');
  }

  const report = await getProfitAndLossReport(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AccountsReportsView
        initialReport={report as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
