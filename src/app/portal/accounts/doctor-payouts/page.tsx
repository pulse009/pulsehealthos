import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { listDoctorPayouts } from '@/lib/accounts/accounts.service';
import { prisma } from '@/lib/db/prisma';
import { AccountsDoctorPayoutsView } from '@/components/dashboard/accounts/AccountsDoctorPayoutsView';

export const dynamic = 'force-dynamic';

export default async function AccountsDoctorPayoutsPage() {
  const { user, scope, clinicId } = await requireClientUser();

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/accounts/invoices');
  }

  let targetDoctorId: string | undefined = undefined;
  if (user.role === 'DOCTOR') {
    const myDoctor = await prisma.doctor.findFirst({
      where: { clinicId, userId: user.id },
      select: { id: true, name: true, specialty: true },
    });
    if (myDoctor) {
      targetDoctorId = myDoctor.id;
    }
  }

  const [payouts, doctors] = await Promise.all([
    listDoctorPayouts(scope, clinicId, targetDoctorId ? { doctorId: targetDoctorId } : {}),
    prisma.doctor.findMany({
      where: {
        clinicId,
        isActive: true,
        ...(targetDoctorId ? { id: targetDoctorId } : {}),
      },
      select: { id: true, name: true, specialty: true },
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
      <AccountsDoctorPayoutsView
        initialPayouts={payouts as any}
        doctors={doctors}
        clinicName={user.clinicName || 'Clinic'}
        userRole={user.role}
      />
    </Suspense>
  );
}
