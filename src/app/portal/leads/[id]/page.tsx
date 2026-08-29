import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { getLead } from '@/lib/leads/lead.service';
import { AppError } from '@/lib/errors';
import { LeadDetailView } from '@/components/dashboard/LeadDetailView';

export const metadata: Metadata = { title: 'Patient Lead Details' };
export const dynamic = 'force-dynamic';

export default async function PortalLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { scope } = await requireClientUser();
  const { id } = await params;

  let rawLead: Awaited<ReturnType<typeof getLead>>;
  try {
    rawLead = await getLead(scope, id);
  } catch (error) {
    if (error instanceof AppError && (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')) {
      notFound();
    }
    throw error;
  }

  const formattedLead = {
    id: rawLead.id,
    clinicId: rawLead.clinicId,
    status: rawLead.status as any,
    source: rawLead.source,
    notes: rawLead.notes,
    tags: rawLead.tags,
    lostReason: rawLead.lostReason,
    firstContactAt: rawLead.firstContactAt.toISOString(),
    lastContactAt: rawLead.lastContactAt.toISOString(),
    qualifiedAt: rawLead.qualifiedAt ? rawLead.qualifiedAt.toISOString() : null,
    bookedAt: rawLead.bookedAt ? rawLead.bookedAt.toISOString() : null,
    clinic: {
      name: rawLead.clinic.name,
      timezone: rawLead.clinic.timezone,
    },
    patient: {
      id: rawLead.patient.id,
      name: rawLead.patient.name,
      phone: rawLead.patient.phone,
      email: rawLead.patient.email,
      fileNumber: rawLead.patient.fileNumber,
      notes: rawLead.patient.notes,
      tags: rawLead.patient.tags,
      conversations: rawLead.patient.conversations.map((conv) => ({
        id: conv.id,
        status: conv.status,
        lastMessageAt: conv.lastMessageAt.toISOString(),
        lastMessagePreview: conv.lastMessagePreview,
        messages: (conv as any).messages
          ? (conv as any).messages.map((m: any) => ({
              id: m.id,
              sender: m.sender,
              direction: m.direction,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            }))
          : [],
      })),
    },
    appointments: rawLead.appointments.map((app) => ({
      id: app.id,
      appointmentNumber: app.appointmentNumber,
      startsAt: app.startsAt.toISOString(),
      status: app.status,
      timezone: app.timezone,
      doctor: app.doctor,
      service: app.service,
    })),
  };

  return (
    <LeadDetailView
      lead={formattedLead}
      conversationHrefPrefix="/portal/conversations"
      backHref="/portal/leads"
    />
  );
}
