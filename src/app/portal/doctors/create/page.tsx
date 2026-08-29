import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { DoctorCreatePortalView } from '@/components/dashboard/DoctorCreatePortalView';

export const metadata: Metadata = { title: 'Create Doctor' };
export const dynamic = 'force-dynamic';

export default async function CreateDoctorPortalPage() {
  const { clinicId } = await requireClientUser();

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
      where: { clinicId: clinicId!, isActive: true },
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
