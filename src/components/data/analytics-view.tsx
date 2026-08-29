import { Card, CardBody, CardHeader, StatCard } from '@/components/ui/primitives';
import { FunnelChart, StatusBreakdownChart, TrendChart } from '@/components/data/charts';
import type { DashboardMetrics, TrendPoint } from '@/lib/analytics/metrics';

/**
 * Shared analytics rendering for the admin panel and the client portal.
 *
 * The portal passes a clinic-scoped metrics object and the admin panel passes
 * either a clinic-scoped or platform-wide one — the component itself never
 * queries, so there is no path by which it could widen a tenant's view.
 */
export function AnalyticsView({
  metrics,
  trend,
  days,
  timezoneNote,
}: {
  metrics: DashboardMetrics;
  trend: TrendPoint[];
  days: number;
  timezoneNote?: string;
}) {
  const funnel = [
    { name: 'New', value: metrics.leads.new },
    { name: 'Contacted', value: metrics.leads.contacted },
    { name: 'Qualified', value: metrics.leads.qualified },
    { name: 'Booked', value: metrics.leads.booked },
    { name: 'Lost', value: metrics.leads.lost },
  ];

  const statuses = [
    { name: 'Confirmed', value: metrics.appointments.confirmed },
    { name: 'Completed', value: metrics.appointments.completed },
    { name: 'Cancelled', value: metrics.appointments.cancelled },
    { name: 'No show', value: metrics.appointments.noShow },
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total leads" value={metrics.leads.total.toLocaleString()} />
        <StatCard label="New leads" value={metrics.leads.new} hint="Not yet engaged" />
        <StatCard label="Booked" value={metrics.leads.booked} />
        <StatCard
          label="Conversion rate"
          value={`${metrics.rates.conversionRate}%`}
          hint="Leads that became bookings"
          tone={metrics.rates.conversionRate > 0 ? 'positive' : 'default'}
        />
        <StatCard label="Upcoming appointments" value={metrics.appointments.upcoming} />
        <StatCard label="Completed" value={metrics.appointments.completed} />
        <StatCard
          label="Cancelled"
          value={metrics.appointments.cancelled}
          tone={metrics.appointments.cancelled > 0 ? 'negative' : 'default'}
        />
        <StatCard
          label="No-show rate"
          value={`${metrics.rates.noShowRate}%`}
          hint="Of completed + no-show"
          tone={metrics.rates.noShowRate > 0 ? 'negative' : 'default'}
        />
      </div>

      <Card className="mt-6">
        <CardHeader
          title={`Leads and bookings — last ${days} days`}
          description={timezoneNote ?? 'Bucketed by the clinic’s local day.'}
        />
        <CardBody>
          <TrendChart data={trend} />
        </CardBody>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lead funnel" description="Current status of every lead." />
          <CardBody>
            <FunnelChart data={funnel} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Appointment outcomes" />
          <CardBody>
            <StatusBreakdownChart data={statuses} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Conversations" value={metrics.conversations.total} />
        <StatCard label="Active threads" value={metrics.conversations.active} />
        <StatCard
          label="Escalated"
          value={metrics.conversations.escalated}
          hint="Waiting on a human"
          tone={metrics.conversations.escalated > 0 ? 'negative' : 'default'}
        />
        <StatCard
          label="Booking rate"
          value={`${metrics.rates.bookingRate}%`}
          hint="Of engaged leads"
        />
      </div>
    </>
  );
}
