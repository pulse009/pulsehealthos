import Link from 'next/link';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  humanise,
  statusTone,
} from '@/components/ui/primitives';
import { AppointmentMiniList } from '@/components/data/transcript';
import { formatInstant } from '@/lib/time/timezone';

/**
 * Lead detail panel, shared by admin and portal. Contains only funnel and
 * contact information — nothing about AI configuration or integrations.
 */

export interface LeadDetailData {
  id: string;
  status: string;
  source: string;
  notes: string | null;
  tags: string[];
  lostReason: string | null;
  firstContactAt: Date;
  lastContactAt: Date;
  qualifiedAt: Date | null;
  bookedAt: Date | null;
  clinic: { name: string; timezone: string };
  patient: {
    name: string | null;
    phone: string;
    email: string | null;
    notes: string | null;
    conversations: Array<{
      id: string;
      status: string;
      lastMessageAt: Date;
      lastMessagePreview: string | null;
    }>;
  };
  appointments: Array<{
    id: string;
    startsAt: Date;
    status: string;
    timezone: string;
    doctor: { name: string };
    service: { name: string };
  }>;
}

export function LeadDetail({
  lead,
  conversationHrefPrefix,
}: {
  lead: LeadDetailData;
  conversationHrefPrefix: string;
}) {
  const tz = lead.clinic.timezone;

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <div className="space-y-4">
        <Card>
          <CardHeader title="Contact" />
          <CardBody className="space-y-2 text-sm">
            <Row label="Name" value={lead.patient.name ?? 'Not given'} />
            <Row label="Phone" value={lead.patient.phone} mono />
            {lead.patient.email ? <Row label="Email" value={lead.patient.email} /> : null}
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted">Status</span>
              <Badge tone={statusTone(lead.status)}>{humanise(lead.status)}</Badge>
            </div>
            <Row label="Source" value={humanise(lead.source)} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Timeline" />
          <CardBody className="space-y-2 text-sm">
            <Row label="First contact" value={formatInstant(lead.firstContactAt, tz)} />
            <Row label="Last activity" value={formatInstant(lead.lastContactAt, tz)} />
            {lead.qualifiedAt ? (
              <Row label="Qualified" value={formatInstant(lead.qualifiedAt, tz)} />
            ) : null}
            {lead.bookedAt ? <Row label="Booked" value={formatInstant(lead.bookedAt, tz)} /> : null}
          </CardBody>
        </Card>

        {lead.notes || lead.tags.length > 0 || lead.lostReason ? (
          <Card>
            <CardHeader title="Notes" />
            <CardBody className="space-y-3">
              {lead.notes ? <p className="text-sm">{lead.notes}</p> : null}
              {lead.lostReason ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Lost: {lead.lostReason}
                </p>
              ) : null}
              {lead.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {lead.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </div>
              ) : null}
            </CardBody>
          </Card>
        ) : null}
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Appointments" description="Most recent first" />
          <CardBody>
            <AppointmentMiniList appointments={lead.appointments} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Conversations" />
          <CardBody>
            {lead.patient.conversations.length === 0 ? (
              <p className="text-muted text-sm">No conversations recorded.</p>
            ) : (
              <ul className="space-y-2">
                {lead.patient.conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`${conversationHrefPrefix}/${conversation.id}`}
                      className="hover:surface-muted flex items-start justify-between gap-3 rounded-lg border px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-muted truncate text-xs">
                          {conversation.lastMessagePreview ?? 'No preview'}
                        </p>
                        <p className="text-subtle mt-0.5 text-xs">
                          {formatInstant(conversation.lastMessageAt, tz)}
                        </p>
                      </div>
                      <Badge tone={statusTone(conversation.status)}>
                        {humanise(conversation.status)}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted shrink-0">{label}</span>
      <span className={`text-right ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
