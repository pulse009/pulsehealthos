import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { DoctorCreatePortalView } from '@/components/dashboard/DoctorCreatePortalView';

export const metadata: Metadata = { title: 'Create Doctor' };
export const dynamic = 'force-dynamic';

export default async function CreateDoctorPortalPage() {
  const { user, clinicId } = await requireClientUser();

  if (user.role === 'COORDINATOR' || user.role === 'RECEPTIONIST') {
    if (user.role === 'RECEPTIONIST') {
      redirect('/portal/appointments');
    }
    redirect('/portal/doctors');
  }

  const [clinic, services, staff] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.service.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.user.findMany({
      where: { clinicId: clinicId!, isActive: true, role: 'COORDINATOR' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  return (
    <DoctorCreatePortalView
      clinicName={clinic?.name || 'Clinic'}
      timezone={clinic?.timezone || 'Asia/Riyadh'}
      availableServices={services}
      availableStaff={staff}
      backHref="/portal/doctors"
    />
  );
}
