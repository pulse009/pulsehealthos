import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { formatInstant } from '@/lib/time/timezone';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
  humanise,
  statusTone,
} from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Reminders' };
export const dynamic = 'force-dynamic';

export default async function AdminRemindersPage() {
  await requireSuperAdmin();
  const now = new Date();

  const [counts, upcoming, failures, rules] = await Promise.all([
    prisma.reminder.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.reminder.findMany({
      where: { status: 'SCHEDULED', scheduledFor: { gte: now } },
      orderBy: { scheduledFor: 'asc' },
      take: 20,
      select: {
        id: true,
        scheduledFor: true,
        offsetMinutes: true,
        appointment: {
          select: {
            startsAt: true,
            timezone: true,
            patient: { select: { name: true, phone: true } },
            doctor: { select: { name: true } },
          },
        },
        clinic: { select: { name: true, timezone: true } },
      },
    }),
    prisma.reminder.findMany({
      where: { status: 'FAILED' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        scheduledFor: true,
        attempts: true,
        lastError: true,
        clinic: { select: { name: true, timezone: true } },
        appointment: { select: { patient: { select: { phone: true } } } },
      },
    }),
    prisma.reminderRule.findMany({
      orderBy: [{ clinic: { name: 'asc' } }, { offsetMinutes: 'desc' }],
      select: {
        id: true,
        offsetMinutes: true,
        isActive: true,
        clinic: { select: { id: true, name: true } },
        _count: { select: { reminders: true } },
      },
    }),
  ]);

  const countBy = (status: string) =>
    counts.find((c) => c.status === status)?._count._all ?? 0;

  return (
    <>
      <PageHeader
        title="Reminders"
        description="Dispatched by the cron job at /api/cron/reminders. Each reminder is claimed before sending, so retries cannot duplicate one."
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Scheduled" value={countBy('SCHEDULED')} />
        <StatCard label="Sent" value={countBy('SENT')} />
        <StatCard
          label="Failed"
          value={countBy('FAILED')}
          tone={countBy('FAILED') > 0 ? 'negative' : 'default'}
        />
        <StatCard label="Cancelled" value={countBy('CANCELLED')} hint="Includes stood-down reminders" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Next to send" description="Soonest first" />
          {upcoming.length === 0 ? (
            <EmptyState title="Nothing queued" description="No reminders are currently scheduled." />
          ) : (
            <Table className="min-w-[520px]">
              <thead>
                <tr>
                  <Th>Patient</Th>
                  <Th>Sends at</Th>
                  <Th>Appointment</Th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((reminder) => (
                  <tr key={reminder.id}>
                    <Td>
                      <span className="text-sm">
                        {reminder.appointment.patient.name ?? reminder.appointment.patient.phone}
                      </span>
                      <span className="text-subtle block text-xs">{reminder.clinic.name}</span>
                    </Td>
                    <Td className="text-xs whitespace-nowrap">
                      {formatInstant(reminder.scheduledFor, reminder.clinic.timezone)}
                    </Td>
                    <Td className="text-xs whitespace-nowrap">
                      {formatInstant(
                        reminder.appointment.startsAt,
                        reminder.appointment.timezone,
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>

        <Card>
          <CardHeader title="Failures" description="Exhausted retries; needs attention" />
          {failures.length === 0 ? (
            <EmptyState title="No failures" description="Every reminder has been delivered." />
          ) : (
            <Table className="min-w-[520px]">
              <thead>
                <tr>
                  <Th>Recipient</Th>
                  <Th className="text-right">Attempts</Th>
                  <Th>Error</Th>
                </tr>
              </thead>
              <tbody>
                {failures.map((reminder) => (
                  <tr key={reminder.id}>
                    <Td className="font-mono text-xs">
                      {reminder.appointment.patient.phone}
                      <span className="text-subtle block font-sans">{reminder.clinic.name}</span>
                    </Td>
                    <Td className="text-right tabular-nums">{reminder.attempts}</Td>
                    <Td className="max-w-xs truncate text-xs text-red-600 dark:text-red-400">
                      {reminder.lastError ?? 'Unknown'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Rules by clinic" description="Edit on each clinic's Reminders tab." />
        {rules.length === 0 ? (
          <EmptyState title="No reminder rules" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Clinic</Th>
                <Th>Offset</Th>
                <Th>Status</Th>
                <Th className="text-right">Reminders created</Th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <Td>
                    <Link
                      href={`/admin/clinics/${rule.clinic.id}?tab=reminders`}
                      className="font-medium hover:underline"
                    >
                      {rule.clinic.name}
                    </Link>
                  </Td>
                  <Td className="text-sm">
                    {rule.offsetMinutes % 1440 === 0
                      ? `${rule.offsetMinutes / 1440} day(s) before`
                      : rule.offsetMinutes % 60 === 0
                        ? `${rule.offsetMinutes / 60} hour(s) before`
                        : `${rule.offsetMinutes} minutes before`}
                  </Td>
                  <Td>
                    <Badge tone={statusTone(rule.isActive ? 'CONFIRMED' : 'NEUTRAL')}>
                      {rule.isActive ? 'Active' : 'Paused'}
                    </Badge>
                  </Td>
                  <Td className="text-right tabular-nums">{rule._count.reminders}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="mt-6">
        <CardHeader title="Scheduling the job" />
        <CardBody className="space-y-2 text-sm">
          <p className="text-muted">
            Call the endpoint every few minutes with the shared secret. Overlapping runs are safe.
          </p>
          <pre className="surface-muted scroll-x rounded-lg border p-3 font-mono text-xs">
{`*/5 * * * *  curl -fsS -X POST \\
  -H "Authorization: Bearer $CRON_SECRET" \\
  https://your-domain/api/cron/reminders`}
          </pre>
          <p className="text-subtle text-xs">
            Statuses shown above: {humanise('SCHEDULED')} → claimed → {humanise('SENT')}, or{' '}
            {humanise('FAILED')} after {3} attempts.
          </p>
        </CardBody>
      </Card>
    </>
  );
}
