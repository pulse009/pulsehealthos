import { Badge, cn, humanise, statusTone } from '@/components/ui/primitives';
import { formatInstant } from '@/lib/time/timezone';

/**
 * Conversation transcript.
 *
 * Inbound on the left, outbound on the right, with the sender labelled so an
 * operator can tell at a glance whether the assistant, a human, or the system
 * (a reminder) produced a message. Tool traces are shown inline because "what
 * did the AI actually do" is the first question when a booking looks wrong.
 */

export interface TranscriptMessage {
  id: string;
  direction: 'INBOUND' | 'OUTBOUND';
  sender: 'PATIENT' | 'AI' | 'HUMAN' | 'SYSTEM';
  body: string;
  status: string;
  error: string | null;
  toolCalls: unknown;
  createdAt: Date;
  sentByUser: { name: string } | null;
}

const SENDER_LABELS: Record<TranscriptMessage['sender'], string> = {
  PATIENT: 'Patient',
  AI: 'Assistant',
  HUMAN: 'Staff',
  SYSTEM: 'System',
};

function parseToolCalls(value: unknown): Array<{ name: string; ok: boolean }> {
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry) => {
    if (typeof entry !== 'object' || entry === null) return [];
    const record = entry as Record<string, unknown>;
    if (typeof record.name !== 'string') return [];
    return [{ name: record.name, ok: record.ok !== false }];
  });
}

export function Transcript({
  messages,
  timezone,
}: {
  messages: TranscriptMessage[];
  timezone: string;
}) {
  if (messages.length === 0) {
    return <p className="text-muted px-5 py-10 text-center text-sm">No messages yet.</p>;
  }

  return (
    <ol className="space-y-4 p-5">
      {messages.map((message) => {
        const inbound = message.direction === 'INBOUND';
        const tools = parseToolCalls(message.toolCalls);

        return (
          <li key={message.id} className={cn('flex', inbound ? 'justify-start' : 'justify-end')}>
            <div className={cn('max-w-[min(36rem,85%)]', inbound ? 'items-start' : 'items-end')}>
              <div
                className={cn(
                  'mb-1 flex items-center gap-2 text-xs',
                  inbound ? 'justify-start' : 'justify-end',
                )}
              >
                <span className="font-medium">
                  {message.sender === 'HUMAN' && message.sentByUser
                    ? message.sentByUser.name
                    : SENDER_LABELS[message.sender]}
                </span>
                <span className="text-subtle">{formatInstant(message.createdAt, timezone)}</span>
                {message.status === 'FAILED' ? <Badge tone="danger">Failed</Badge> : null}
              </div>

              <div
                className={cn(
                  'rounded-xl border px-3.5 py-2.5 text-sm whitespace-pre-wrap',
                  inbound
                    ? 'surface'
                    : message.sender === 'AI'
                      ? 'border-[var(--color-brand-200)] bg-[var(--color-brand-50)] dark:border-[var(--color-brand-700)] dark:bg-[var(--color-brand-900)]/40'
                      : 'surface-muted',
                )}
              >
                {message.body}
              </div>

              {message.error ? (
                <p className="mt-1 text-xs text-red-600 dark:text-red-400">{message.error}</p>
              ) : null}

              {tools.length > 0 ? (
                <div
                  className={cn(
                    'mt-1.5 flex flex-wrap gap-1',
                    inbound ? 'justify-start' : 'justify-end',
                  )}
                >
                  {tools.map((tool, index) => (
                    <Badge key={`${tool.name}-${index}`} tone={tool.ok ? 'info' : 'danger'}>
                      {tool.name}
                      {tool.ok ? '' : ' failed'}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function AppointmentMiniList({
  appointments,
}: {
  appointments: Array<{
    id: string;
    startsAt: Date;
    status: string;
    timezone: string;
    doctor: { name: string };
    service: { name: string };
  }>;
}) {
  if (appointments.length === 0) {
    return <p className="text-muted text-sm">No appointments for this patient.</p>;
  }

  return (
    <ul className="space-y-2">
      {appointments.map((appointment) => (
        <li key={appointment.id} className="flex items-start justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="truncate font-medium">{appointment.service.name}</p>
            <p className="text-subtle text-xs">
              {appointment.doctor.name} ·{' '}
              {formatInstant(appointment.startsAt, appointment.timezone)}
            </p>
          </div>
          <Badge tone={statusTone(appointment.status)}>{humanise(appointment.status)}</Badge>
        </li>
      ))}
    </ul>
  );
}
