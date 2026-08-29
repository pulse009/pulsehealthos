import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getClinicBreakdown, getPlatformMetrics } from '@/lib/analytics/metrics';
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  PageHeader,
  StatCard,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Dashboard' };
export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  await requireSuperAdmin();

  const [metrics, clinics] = await Promise.all([getPlatformMetrics(), getClinicBreakdown(20)]);

  return (
    <>
      <PageHeader
        title="Platform overview"
        description="Activity across every clinic on the platform."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Clinics"
          value={metrics.clinics.total}
          hint={`${metrics.clinics.active} active`}
        />
        <StatCard label="Total leads" value={metrics.leads.toLocaleString()} />
        <StatCard label="Total appointments" value={metrics.appointments.toLocaleString()} />
        <StatCard label="Booked today" value={metrics.bookingsToday} hint="Platform time (UTC)" />
        <StatCard label="AI conversations" value={metrics.conversations.toLocaleString()} />
        <StatCard
          label="Escalated"
          value={metrics.escalations}
          hint="Waiting on a human"
          tone={metrics.escalations > 0 ? 'negative' : 'default'}
        />
        <StatCard
          label="Failed messages"
          value={metrics.failedMessages}
          tone={metrics.failedMessages > 0 ? 'negative' : 'default'}
        />
        <StatCard
          label="Reminder failures"
          value={metrics.failedReminders}
          tone={metrics.failedReminders > 0 ? 'negative' : 'default'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Clinics"
          description="Newest first"
          action={
            <Link href="/admin/clinics" className="text-xs font-medium text-[var(--color-brand-600)]">
              View all
            </Link>
          }
        />
        {clinics.length === 0 ? (
          <EmptyState
            title="No clinics yet"
            description="Create your first clinic to start onboarding a client."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Clinic</Th>
                <Th>Status</Th>
                <Th>Timezone</Th>
                <Th className="text-right">Leads</Th>
                <Th className="text-right">Appointments</Th>
                <Th className="text-right">Conversations</Th>
              </tr>
            </thead>
            <tbody>
              {clinics.map((clinic) => (
                <tr key={clinic.id}>
                  <Td>
                    <Link
                      href={`/admin/clinics/${clinic.id}`}
                      className="font-medium hover:underline"
                    >
                      {clinic.name}
                    </Link>
                    <span className="text-subtle block text-xs">{clinic.slug}</span>
                  </Td>
                  <Td>
                    <Badge tone={clinic.isActive ? 'success' : 'neutral'}>
                      {clinic.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-muted text-xs">{clinic.timezone}</Td>
                  <Td className="text-right tabular-nums">{clinic._count.leads}</Td>
                  <Td className="text-right tabular-nums">{clinic._count.appointments}</Td>
                  <Td className="text-right tabular-nums">{clinic._count.conversations}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
