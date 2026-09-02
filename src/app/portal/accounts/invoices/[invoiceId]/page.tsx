import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getInvoiceDetail } from '@/lib/accounts/accounts.service';
import { AccountsInvoiceDetailView } from '@/components/dashboard/accounts/AccountsInvoiceDetailView';

export const dynamic = 'force-dynamic';

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ invoiceId: string }>;
}) {
  const { user, scope } = await requireClientUser();
  const { invoiceId } = await params;

  let invoice;
  try {
    invoice = await getInvoiceDetail(scope, invoiceId);
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
      <AccountsInvoiceDetailView
        invoice={invoice as any}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
