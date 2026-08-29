import Link from 'next/link';
import { Badge, EmptyState, Table, Td, Th, humanise, statusTone } from '@/components/ui/primitives';
import { formatInstant } from '@/lib/time/timezone';

/**
 * Shared list renderings.
 *
 * Admin and portal render the same tables from the same data shapes; only the
 * link prefix differs. Keeping one implementation means a column added for
 * admins cannot accidentally leak a field the portal should not show — the
 * shapes below are the contract, and they contain no configuration or secrets.
 */

export interface LeadRow {
  id: string;
  status: string;
  source: string;
  firstContactAt: Date;
  lastContactAt: Date;
  clinic: { id?: string; name: string; timezone: string };
  patient: {
    name: string | null;
    phone: string;
    appointments: Array<{ startsAt: Date; timezone: string }>;
  };
}

export function LeadsTable({
  leads,
  hrefPrefix,
  showClinic = false,
}: {
  leads: LeadRow[];
  hrefPrefix: string;
  showClinic?: boolean;
}) {
  if (leads.length === 0) {
    return (
      <EmptyState
        title="No leads yet"
        description="Leads appear here as soon as someone messages the clinic on WhatsApp."
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Patient</Th>
          {showClinic ? <Th>Clinic</Th> : null}
          <Th>Status</Th>
          <Th>First contact</Th>
          <Th>Next appointment</Th>
          <Th>Last activity</Th>
        </tr>
      </thead>
      <tbody>
        {leads.map((lead) => {
          const next = lead.patient.appointments[0];
          return (
            <tr key={lead.id}>
              <Td>
                <Link href={`${hrefPrefix}/${lead.id}`} className="font-medium hover:underline">
                  {lead.patient.name ?? 'Unknown'}
                </Link>
                <span className="text-subtle block font-mono text-xs">{lead.patient.phone}</span>
              </Td>
              {showClinic ? <Td className="text-xs">{lead.clinic.name}</Td> : null}
              <Td>
                <Badge tone={statusTone(lead.status)}>{humanise(lead.status)}</Badge>
              </Td>
              <Td className="text-muted text-xs whitespace-nowrap">
                {formatInstant(lead.firstContactAt, lead.clinic.timezone)}
              </Td>
              <Td className="text-xs whitespace-nowrap">
                {next ? formatInstant(next.startsAt, next.timezone) : '—'}
              </Td>
              <Td className="text-muted text-xs whitespace-nowrap">
                {formatInstant(lead.lastContactAt, lead.clinic.timezone)}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

export interface AppointmentRow {
  id: string;
  appointmentNumber?: number | null;
  startsAt: Date;
  status: string;
  timezone: string;
  source?: string;
  clinic?: { name: string };
  doctor: { name: string };
  service: { name: string };
  patient: { name: string | null; phone: string; fileNumber?: number | null };
}

export function AppointmentsTable({
  appointments,
  showClinic = false,
  emptyTitle = 'No appointments',
  emptyDescription = 'Bookings made by the assistant or by staff will show up here.',
}: {
  appointments: AppointmentRow[];
  showClinic?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (appointments.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Patient</Th>
          {showClinic ? <Th>Clinic</Th> : null}
          <Th>Doctor</Th>
          <Th>Service</Th>
          <Th>When</Th>
          <Th>Status</Th>
          <Th>Source</Th>
        </tr>
      </thead>
      <tbody>
        {appointments.map((appointment) => (
          <tr key={appointment.id}>
            <Td>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-medium">{appointment.patient.name ?? 'Unknown'}</span>
                {typeof appointment.patient.fileNumber === 'number' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="File Number">
                    File #{appointment.patient.fileNumber}
                  </span>
                )}
                {typeof appointment.appointmentNumber === 'number' && (
                  <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800" title="Appointment Number">
                    Appt #{appointment.appointmentNumber}
                  </span>
                )}
              </div>
              <span className="text-subtle block font-mono text-xs">
                {appointment.patient.phone}
              </span>
            </Td>
            {showClinic ? <Td className="text-xs">{appointment.clinic?.name ?? '—'}</Td> : null}
            <Td className="text-sm">{appointment.doctor.name}</Td>
            <Td className="text-sm">{appointment.service.name}</Td>
            <Td className="text-xs whitespace-nowrap">
              {/* Always rendered in the clinic's own timezone, never the viewer's. */}
              {formatInstant(appointment.startsAt, appointment.timezone)}
            </Td>
            <Td>
              <Badge tone={statusTone(appointment.status)}>{humanise(appointment.status)}</Badge>
            </Td>
            <Td className="text-muted text-xs">
              {appointment.source ? humanise(appointment.source) : '—'}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export interface ConversationRow {
  id: string;
  status: string;
  lastMessageAt: Date;
  lastMessagePreview: string | null;
  escalationReason: string | null;
  aiEnabled: boolean;
  clinic: { name: string; timezone: string };
  patient: { name: string | null; phone: string; lead: { status: string } | null };
  _count: { messages: number };
}

export function ConversationsTable({
  conversations,
  hrefPrefix,
  showClinic = false,
}: {
  conversations: ConversationRow[];
  hrefPrefix: string;
  showClinic?: boolean;
}) {
  if (conversations.length === 0) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Every inbound WhatsApp thread is recorded here."
      />
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          <Th>Patient</Th>
          {showClinic ? <Th>Clinic</Th> : null}
          <Th>Last message</Th>
          <Th>Status</Th>
          <Th>Lead</Th>
          <Th className="text-right">Messages</Th>
          <Th>Updated</Th>
        </tr>
      </thead>
      <tbody>
        {conversations.map((conversation) => (
          <tr key={conversation.id}>
            <Td>
              <Link
                href={`${hrefPrefix}/${conversation.id}`}
                className="font-medium hover:underline"
              >
                {conversation.patient.name ?? 'Unknown'}
              </Link>
              <span className="text-subtle block font-mono text-xs">
                {conversation.patient.phone}
              </span>
            </Td>
            {showClinic ? <Td className="text-xs">{conversation.clinic.name}</Td> : null}
            <Td className="text-muted max-w-xs truncate text-xs">
              {conversation.lastMessagePreview ?? '—'}
            </Td>
            <Td>
              <Badge tone={statusTone(conversation.status)}>{humanise(conversation.status)}</Badge>
              {!conversation.aiEnabled ? (
                <Badge tone="warning" className="ml-1">
                  AI off
                </Badge>
              ) : null}
            </Td>
            <Td>
              {conversation.patient.lead ? (
                <Badge tone={statusTone(conversation.patient.lead.status)}>
                  {humanise(conversation.patient.lead.status)}
                </Badge>
              ) : (
                '—'
              )}
            </Td>
            <Td className="text-right tabular-nums">{conversation._count.messages}</Td>
            <Td className="text-muted text-xs whitespace-nowrap">
              {formatInstant(conversation.lastMessageAt, conversation.clinic.timezone)}
            </Td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

/** Status filter rendered as links, so filtering works without client JS. */
export function StatusFilter({
  basePath,
  current,
  options,
  paramName = 'status',
}: {
  basePath: string;
  current?: string;
  options: string[];
  paramName?: string;
}) {
  const href = (value?: string) =>
    value ? `${basePath}?${paramName}=${encodeURIComponent(value)}` : basePath;

  return (
    <div className="flex flex-wrap gap-1.5">
      <Link
        href={href()}
        className={`rounded-full border px-3 py-1 text-xs ${
          !current ? 'bg-[var(--color-brand-600)] text-white' : 'hover:surface-muted'
        }`}
      >
        All
      </Link>
      {options.map((option) => (
        <Link
          key={option}
          href={href(option)}
          className={`rounded-full border px-3 py-1 text-xs ${
            current === option ? 'bg-[var(--color-brand-600)] text-white' : 'hover:surface-muted'
          }`}
        >
          {humanise(option)}
        </Link>
      ))}
    </div>
  );
}
