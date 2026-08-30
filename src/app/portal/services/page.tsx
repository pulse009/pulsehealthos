import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  ServicesPortalDashboard,
  type ServiceItem,
} from '@/components/dashboard/ServicesPortalDashboard';

export const metadata: Metadata = { title: 'Services & Treatments' };
export const dynamic = 'force-dynamic';

export default async function PortalServicesPage() {
  const { user, clinicId } = await requireClientUser();

  if (user.role === 'COORDINATOR' || user.role === 'RECEPTIONIST') {
    if (user.role === 'RECEPTIONIST') {
      redirect('/portal/appointments');
    }
    redirect('/portal');
  }

  const [clinic, rawServices, doctors] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.service.findMany({
      where: { clinicId: clinicId! },
      orderBy: [{ isActive: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        durationMinutes: true,
        bufferMinutes: true,
        priceMinor: true,
        currency: true,
        isActive: true,
        doctors: {
          select: {
            doctor: { select: { id: true, name: true } },
          },
        },
        _count: {
          select: { appointments: true },
        },
      },
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const services: ServiceItem[] = rawServices.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    durationMinutes: s.durationMinutes,
    bufferMinutes: s.bufferMinutes,
    priceMinor: s.priceMinor,
    currency: s.currency,
    isActive: s.isActive,
    doctors: s.doctors,
    appointmentsCount: s._count.appointments,
  }));

  return (
    <ServicesPortalDashboard
      clinicName={clinic?.name || 'Clinic'}
      timezone={clinic?.timezone || 'Asia/Riyadh'}
      initialServices={services}
      availableDoctors={doctors}
    />
  );
}
