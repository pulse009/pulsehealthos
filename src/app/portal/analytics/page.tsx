import type { Metadata } from 'next';
import Link from 'next/link';
import { requireClientUser } from '@/lib/auth/guards';
import { getDashboardMetrics, getTrend } from '@/lib/analytics/metrics';
import { getClinicProfileForPortal } from '@/lib/clinics/clinic.service';
import { analyticsRangeSchema } from '@/lib/validation/schemas';
import { Card, PageHeader, cn } from '@/components/ui/primitives';
import { AnalyticsView } from '@/components/data/analytics-view';

export const metadata: Metadata = { title: 'Analytics' };
export const dynamic = 'force-dynamic';

const RANGES = [7, 30, 90];

export default async function PortalAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { scope, clinicId } = await requireClientUser();
  const raw = await searchParams;

  // `clinicId` deliberately comes from the session, never the query string.
  const { days } = analyticsRangeSchema.parse({ days: raw.days ?? 30 });

  const [clinic, metrics, trend] = await Promise.all([
    getClinicProfileForPortal(scope, clinicId),
    getDashboardMetrics(scope, clinicId),
    getTrend(scope, clinicId, days),
  ]);

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${clinic.name} · bucketed by local days in ${clinic.timezone}`}
      />

      <Card className="mb-6 p-3">
        <div className="flex flex-wrap gap-1.5">
          {RANGES.map((range) => (
            <Link
              key={range}
              href={`/portal/analytics?days=${range}`}
              className={cn(
                'rounded-full border px-3 py-1 text-xs',
                days === range ? 'bg-[var(--color-brand-600)] text-white' : 'hover:surface-muted',
              )}
            >
              Last {range} days
            </Link>
          ))}
        </div>
      </Card>

      <AnalyticsView
        metrics={metrics}
        trend={trend}
        days={days}
        timezoneNote={`Bucketed by local days in ${clinic.timezone}.`}
      />
    </>
  );
}
