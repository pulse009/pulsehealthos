import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getDashboardMetrics, getTrend } from '@/lib/analytics/metrics';
import { listClinicOptions } from '@/lib/clinics/clinic.service';
import { analyticsRangeSchema } from '@/lib/validation/schemas';
import { Card, PageHeader } from '@/components/ui/primitives';
import { AnalyticsView } from '@/components/data/analytics-view';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string; days?: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const raw = await searchParams;

  const query = analyticsRangeSchema.parse({ clinicId: raw.clinicId, days: raw.days ?? 30 });
  const clinics = await listClinicOptions(scope);

  const [metrics, trend] = await Promise.all([
    getDashboardMetrics(scope, query.clinicId),
    getTrend(scope, query.clinicId, query.days),
  ]);

  const selectedClinic = clinics.find((c) => c.id === query.clinicId);

  return (
    <>
      <PageHeader
        title="Analytics"
        description={
          selectedClinic
            ? `${selectedClinic.name} · ${selectedClinic.timezone}`
            : 'Platform-wide across every clinic.'
        }
      />

      <Card className="mb-6 p-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label htmlFor="clinicId" className="text-muted text-xs">
            Clinic
          </label>
          <select
            id="clinicId"
            name="clinicId"
            defaultValue={query.clinicId ?? ''}
            className="h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
          >
            <option value="">All clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>

          <label htmlFor="days" className="text-muted ml-2 text-xs">
            Range
          </label>
          <select
            id="days"
            name="days"
            defaultValue={String(query.days)}
            className="h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>

          <button type="submit" className="hover:surface-muted rounded-lg border px-3 py-1.5 text-xs">
            Apply
          </button>
        </form>
      </Card>

      <AnalyticsView
        metrics={metrics}
        trend={trend}
        days={query.days}
        timezoneNote={
          selectedClinic
            ? `Bucketed by local days in ${selectedClinic.timezone}.`
            : 'Platform-wide totals are bucketed in UTC, since clinics span multiple timezones.'
        }
      />
    </>
  );
}
