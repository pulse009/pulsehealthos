import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getConversationDetail } from '@/lib/conversations/conversation.service';
import { AppError } from '@/lib/errors';
import { formatInstant } from '@/lib/time/timezone';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  PageHeader,
  humanise,
  statusTone,
} from '@/components/ui/primitives';
import { AppointmentMiniList, Transcript } from '@/components/data/transcript';

export const metadata: Metadata = { title: 'Conversation' };
export const dynamic = 'force-dynamic';

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const { id } = await params;

  let conversation: Awaited<ReturnType<typeof getConversationDetail>>;
  try {
    conversation = await getConversationDetail(scope, id);
  } catch (error) {
    if (error instanceof AppError && (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')) {
      notFound();
    }
    throw error;
  }

  const timezone = conversation.clinic.timezone;

  return (
    <>
      <PageHeader
        title={conversation.patient.name ?? conversation.patient.phone}
        description={`${conversation.clinic.name} · ${conversation.patient.phone}`}
        action={
          <Link href="/admin/conversations" className="text-muted text-xs hover:underline">
            Back to conversations
          </Link>
        }
      />

      {conversation.status === 'ESCALATED' ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
            Escalated to a human
            {conversation.escalatedAt
              ? ` on ${formatInstant(conversation.escalatedAt, timezone)}`
              : ''}
          </p>
          {conversation.escalationReason ? (
            <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
              {conversation.escalationReason}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            The assistant will not reply on this thread until it is re-enabled.
          </p>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="min-w-0">
          <CardHeader
            title="Transcript"
            description={`${conversation.messages.length} messages · times shown in ${timezone}`}
            action={
              <Badge tone={statusTone(conversation.status)}>
                {humanise(conversation.status)}
              </Badge>
            }
          />
          <Transcript messages={conversation.messages} timezone={timezone} />
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Patient" />
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-muted">Name</span>
                <span className="text-right font-medium">
                  {conversation.patient.name ?? 'Not given'}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-muted">Phone</span>
                <span className="font-mono text-xs">{conversation.patient.phone}</span>
              </div>
              {conversation.patient.email ? (
                <div className="flex justify-between gap-2">
                  <span className="text-muted">Email</span>
                  <span className="truncate text-xs">{conversation.patient.email}</span>
                </div>
              ) : null}
              {conversation.patient.lead ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted">Lead status</span>
                    <Badge tone={statusTone(conversation.patient.lead.status)}>
                      {humanise(conversation.patient.lead.status)}
                    </Badge>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted">First contact</span>
                    <span className="text-xs">
                      {formatInstant(conversation.patient.lead.firstContactAt, timezone)}
                    </span>
                  </div>
                </>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Appointments" />
            <CardBody>
              <AppointmentMiniList appointments={conversation.patient.appointments} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
