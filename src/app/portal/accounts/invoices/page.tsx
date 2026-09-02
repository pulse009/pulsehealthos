import { Suspense } from 'react';
import { requireClientUser } from '@/lib/auth/guards';
import { listInvoices } from '@/lib/accounts/accounts.service';
import { prisma } from '@/lib/db/prisma';
import { AccountsInvoicesView } from '@/components/dashboard/accounts/AccountsInvoicesView';

export const dynamic = 'force-dynamic';

export default async function AccountsInvoicesPage() {
  const { user, scope, clinicId } = await requireClientUser();

  const [invoices, patients, doctors, services] = await Promise.all([
    listInvoices(scope, clinicId),
    prisma.patient.findMany({
      where: { clinicId },
      select: { id: true, name: true, phone: true, fileNumber: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.doctor.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    }),
    prisma.service.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true, priceMinor: true },
      orderBy: { name: 'asc' },
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
      <AccountsInvoicesView
        initialInvoices={invoices as any}
        patients={patients}
        doctors={doctors}
        services={services}
        clinicName={user.clinicName || 'Clinic'}
      />
    </Suspense>
  );
}
