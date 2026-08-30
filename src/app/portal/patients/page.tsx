import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { PatientsPortalView, type PatientItem } from '@/components/dashboard/PatientsPortalView';

export const metadata: Metadata = { title: 'Patients Directory' };
export const dynamic = 'force-dynamic';

export default async function PortalPatientsPage() {
  const { user, clinicId } = await requireClientUser();

  const isCoordinator = user.role === 'COORDINATOR';
  const coordinatorPatientFilter = isCoordinator
    ? { appointments: { some: { doctor: { coordinatorId: user.id } } } }
    : {};

  const [clinic, rawPatients] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.patient.findMany({
      where: { clinicId: clinicId!, ...coordinatorPatientFilter },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileNumber: true,
        name: true,
        phone: true,
        email: true,
        gender: true,
        nationality: true,
        title: true,
        createdAt: true,
        _count: {
          select: { appointments: true },
        },
        appointments: {
          orderBy: { startsAt: 'desc' },
          take: 1,
          select: { startsAt: true },
        },
      },
    }),
  ]);

  const patients: PatientItem[] = rawPatients.map((p) => ({
    id: p.id,
    patientId: p.fileNumber
      ? `PID-${p.fileNumber.toString().padStart(4, '0')}`
      : `PID-${p.id.slice(0, 6).toUpperCase()}`,
    fileNumber: p.fileNumber,
    name: p.name || 'Patient',
    phone: p.phone,
    email: p.email,
    gender: p.gender,
    nationality: p.nationality,
    title: p.title,
    createdAt: p.createdAt.toISOString(),
    appointmentsCount: p._count.appointments,
    latestAppointmentDate: p.appointments[0]?.startsAt?.toISOString() || null,
  }));

  return (
    <PatientsPortalView
      clinicName={clinic?.name || 'Clinic'}
      initialPatients={patients}
    />
  );
}
