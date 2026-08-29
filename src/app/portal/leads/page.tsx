import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  LeadsPortalDashboard,
  type LeadItem,
} from '@/components/dashboard/LeadsPortalDashboard';

export const metadata: Metadata = { title: 'Patient Leads & Inquiries' };
export const dynamic = 'force-dynamic';

export default async function PortalLeadsPage() {
  const { clinicId } = await requireClientUser();

  const [clinic, rawLeads] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.lead.findMany({
      where: { clinicId: clinicId! },
      orderBy: { lastContactAt: 'desc' },
      take: 100,
      select: {
        id: true,
        patientId: true,
        status: true,
        source: true,
        notes: true,
        tags: true,
        firstContactAt: true,
        lastContactAt: true,
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            fileNumber: true,
            appointments: {
              orderBy: { startsAt: 'asc' },
              where: { status: { in: ['PENDING', 'CONFIRMED'] } },
              take: 1,
              select: { id: true, startsAt: true, status: true },
            },
            _count: { select: { appointments: true } },
          },
        },
      },
    }),
  ]);

  const initialLeads: LeadItem[] = rawLeads.map((lead) => {
    const nextAppt = lead.patient.appointments[0] || null;
    return {
      id: lead.id,
      patientId: lead.patientId,
      patientName: lead.patient.name || 'Guest Patient',
      phone: lead.patient.phone,
      email: lead.patient.email,
      fileNumber: lead.patient.fileNumber,
      status: lead.status,
      source: lead.source || 'WhatsApp',
      notes: lead.notes,
      tags: lead.tags,
      firstContactAt: lead.firstContactAt.toISOString(),
      lastContactAt: lead.lastContactAt.toISOString(),
      appointmentCount: lead.patient._count?.appointments ?? 0,
      nextAppointment: nextAppt
        ? {
            startsAt: nextAppt.startsAt.toISOString(),
            status: nextAppt.status,
          }
        : null,
    };
  });

  return (
    <LeadsPortalDashboard
      clinicName={clinic?.name ?? 'Clinic'}
      timezone={clinic?.timezone ?? 'Asia/Riyadh'}
      initialLeads={initialLeads}
    />
  );
}
