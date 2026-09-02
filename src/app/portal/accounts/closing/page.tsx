import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listDayEndClosings } from '@/lib/accounts/accounts.service';
import { AccountsDayEndClosingView } from '@/components/dashboard/accounts/AccountsDayEndClosingView';

export const dynamic = 'force-dynamic';

export default async function AccountsClosingPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'DOCTOR') {
    redirect('/portal/accounts/doctor-payouts');
  }

  const closings = await listDayEndClosings(scope, clinicId);

  return (
    <Suspense
      fallback={
        <div className="flex h-full w-full items-center justify-center bg-white dark:bg-slate-900">
          <div className="size-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      }
    >
      <AccountsDayEndClosingView
        initialClosings={closings as any}
        clinicName={user.clinicName || 'Clinic'}
        userRole={user.role}
      />
    </Suspense>
  );
}
