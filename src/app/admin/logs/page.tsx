import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { formatInstant } from '@/lib/time/timezone';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { StatusFilter } from '@/components/data/tables';

export const metadata: Metadata = { title: 'System Logs' };
export const dynamic = 'force-dynamic';

const LEVELS = ['DEBUG', 'INFO', 'WARN', 'ERROR'] as const;
type Level = (typeof LEVELS)[number];

const LEVEL_TONES = {
  DEBUG: 'neutral',
  INFO: 'info',
  WARN: 'warning',
  ERROR: 'danger',
} as const;

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireSuperAdmin();
  const { status } = await searchParams;
  const level = LEVELS.includes(status as Level) ? (status as Level) : undefined;

  const [logs, audits] = await Promise.all([
    prisma.systemLog.findMany({
      where: level ? { level } : {},
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        level: true,
        event: true,
        message: true,
        createdAt: true,
        clinic: { select: { name: true } },
      },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        actorLabel: true,
        createdAt: true,
        actor: { select: { name: true, email: true } },
        clinic: { select: { name: true } },
      },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="System logs"
        description="Structured events and the audit trail. Secrets are redacted before anything is written."
      />

      <Card className="mb-4 p-3">
        <StatusFilter basePath="/admin/logs" current={level} options={[...LEVELS]} />
      </Card>

      <Card className="mb-6">
        <CardHeader title="Events" description="Most recent 100" />
        {logs.length === 0 ? (
          <EmptyState title="No log entries" description="Warnings and errors are persisted here." />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Level</Th>
                <Th>Event</Th>
                <Th>Message</Th>
                <Th>Clinic</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <Td>
                    <Badge tone={LEVEL_TONES[log.level]}>{log.level}</Badge>
                  </Td>
                  <Td className="font-mono text-xs">{log.event}</Td>
                  <Td className="max-w-md truncate text-xs">{log.message}</Td>
                  <Td className="text-muted text-xs">{log.clinic?.name ?? '—'}</Td>
                  <Td className="text-muted text-xs whitespace-nowrap">
                    {formatInstant(log.createdAt, 'UTC', { withZone: true })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Card>
        <CardHeader title="Audit trail" description="Who changed what" />
        {audits.length === 0 ? (
          <EmptyState title="No audit entries yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th>Actor</Th>
                <Th>Clinic</Th>
                <Th>When</Th>
              </tr>
            </thead>
            <tbody>
              {audits.map((audit) => (
                <tr key={audit.id}>
                  <Td className="font-mono text-xs">{audit.action}</Td>
                  <Td className="text-xs">
                    {audit.entityType}
                    {audit.entityId ? (
                      <span className="text-subtle block font-mono">
                        {audit.entityId.slice(0, 8)}…
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-xs">
                    {audit.actor?.name ?? audit.actorLabel ?? 'System'}
                    {audit.actor ? (
                      <span className="text-subtle block">{audit.actor.email}</span>
                    ) : null}
                  </Td>
                  <Td className="text-muted text-xs">{audit.clinic?.name ?? '—'}</Td>
                  <Td className="text-muted text-xs whitespace-nowrap">
                    {formatInstant(audit.createdAt, 'UTC', { withZone: true })}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
