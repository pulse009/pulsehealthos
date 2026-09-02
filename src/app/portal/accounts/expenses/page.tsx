import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listClinicExpenses } from '@/lib/accounts/accounts.service';
import { AccountsExpensesView } from '@/components/dashboard/accounts/AccountsExpensesView';

export const dynamic = 'force-dynamic';

export default async function AccountsExpensesPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST' || user.role === 'DOCTOR') {
    redirect('/portal/accounts/doctor-payouts');
  }

  const expenses = await listClinicExpenses(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AccountsExpensesView
        initialExpenses={expenses as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
