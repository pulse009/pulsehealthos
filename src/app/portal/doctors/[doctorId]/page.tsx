import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { getClinicDoctorDetail } from '@/lib/directory/directory.service';
import { DoctorDetailPortalView } from '@/components/dashboard/DoctorDetailPortalView';

export const metadata: Metadata = { title: 'Doctor Profile & Management' };
export const dynamic = 'force-dynamic';

export default async function PortalDoctorDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>;
}) {
  const { clinicId, scope } = await requireClientUser();
  const { doctorId } = await params;

  try {
    const [rawDoctor, availableServices, availableStaff] = await Promise.all([
      getClinicDoctorDetail(scope, doctorId),
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

    const doctor = {
      ...rawDoctor,
      appointments: rawDoctor.appointments.map((a) => ({
        id: a.id,
        appointmentNumber: a.appointmentNumber,
        startsAt: a.startsAt.toISOString(),
        status: a.status,
        timezone: a.timezone,
        service: a.service,
        patient: a.patient,
      })),
    };

    return (
      <DoctorDetailPortalView
        doctor={doctor}
        availableServices={availableServices}
        availableStaff={availableStaff}
        backHref="/portal/doctors"
      />
    );
  } catch (error) {
    notFound();
  }
}
