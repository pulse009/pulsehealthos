import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  DoctorsPortalDashboard,
  type DoctorCardItem,
} from '@/components/dashboard/DoctorsPortalDashboard';

export const metadata: Metadata = { title: 'Doctors & Specialists' };
export const dynamic = 'force-dynamic';

export default async function PortalDoctorsPage() {
  const { clinicId } = await requireClientUser();

  const now = new Date();

  const [clinic, rawDoctors, services, staff] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId! },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        specialty: true,
        description: true,
        imageUrl: true,
        isActive: true,
        appointmentMinutes: true,
        bufferMinutes: true,
        coordinator: {
          select: { id: true, name: true, email: true },
        },
        services: {
          select: {
            service: { select: { id: true, name: true } },
          },
        },
        schedules: {
          select: { weekday: true, startMinute: true, endMinute: true },
          orderBy: { weekday: 'asc' },
        },
        _count: {
          select: {
            appointments: {
              where: {
                startsAt: { gte: now },
                status: { notIn: ['CANCELLED', 'NO_SHOW'] },
              },
            },
          },
        },
      },
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

  const doctors: DoctorCardItem[] = rawDoctors.map((doc) => ({
    id: doc.id,
    name: doc.name,
    specialty: doc.specialty,
    description: doc.description,
    imageUrl: doc.imageUrl,
    isActive: doc.isActive,
    appointmentMinutes: doc.appointmentMinutes,
    bufferMinutes: doc.bufferMinutes,
    coordinator: doc.coordinator,
    services: doc.services.map((s) => ({ id: s.service.id, name: s.service.name })),
    schedules: doc.schedules,
    upcomingAppointmentsCount: doc._count.appointments,
  }));

  const specialties = Array.from(
    new Set(doctors.map((d) => d.specialty).filter(Boolean) as string[])
  );

  return (
    <DoctorsPortalDashboard
      clinicName={clinic?.name || 'Clinic'}
      timezone={clinic?.timezone || 'Asia/Riyadh'}
      initialDoctors={doctors}
      specialties={specialties}
      availableServices={services}
      availableStaff={staff}
    />
  );
}
