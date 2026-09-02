import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
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
  const { user, clinicId, scope } = await requireClientUser();
  const { doctorId } = await params;

  if (user.role === 'RECEPTIONIST') {
    redirect('/portal/appointments');
  }

  try {
    const rawDoctor = await getClinicDoctorDetail(scope, doctorId);

    // If logged in as a coordinator or doctor, restrict access strictly to assigned doctor
    if (user.role === 'COORDINATOR' && rawDoctor.coordinatorId !== user.id) {
      notFound();
    }
    if (user.role === 'DOCTOR' && rawDoctor.userId !== user.id) {
      notFound();
    }

    const [availableServices, availableStaff] = await Promise.all([
      prisma.service.findMany({
        where: { clinicId: clinicId!, isActive: true },
        select: {
          id: true,
          name: true,
          durationMinutes: true,
          priceMinor: true,
          currency: true,
          description: true,
          isActive: true,
        },
        orderBy: { name: 'asc' },
      }),
      prisma.user.findMany({
        where: { clinicId: clinicId!, isActive: true, role: 'COORDINATOR' },
        select: {
          id: true,
          name: true,
          username: true,
          email: true,
          role: true,
          salary: true,
          commissionPercent: true,
          isActive: true,
          coordinatedDoctors: { select: { id: true, name: true } },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

    const doctor = {
      ...rawDoctor,
      paymentStructure: user.role === 'DOCTOR' ? null : rawDoctor.paymentStructure,
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

    const sanitizedStaff = availableStaff.map((s) => ({
      ...s,
      salary: user.role === 'DOCTOR' ? null : s.salary,
    }));

    return (
      <DoctorDetailPortalView
        doctor={doctor}
        availableServices={availableServices}
        availableStaff={sanitizedStaff}
        backHref="/portal/doctors"
        userRole={user.role}
      />
    );
  } catch (error) {
    notFound();
  }
}
