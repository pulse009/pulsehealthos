import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listAppointments } from '@/lib/leads/lead.service';
import { appointmentListSchema } from '@/lib/validation/schemas';
import { Card, PageHeader, Pagination } from '@/components/ui/primitives';
import { AppointmentsTable, StatusFilter } from '@/components/data/tables';

export const metadata: Metadata = { title: 'Appointments' };
export const dynamic = 'force-dynamic';

const STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'];

export default async function AdminAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { scope } = await requireSuperAdmin();
  const raw = await searchParams;

  const query = appointmentListSchema.parse({
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 25,
    status: STATUSES.includes(raw.status ?? '') ? raw.status : undefined,
    search: raw.search,
    from: raw.from,
    to: raw.to,
  });

  const result = await listAppointments(scope, query);

  return (
    <>
      <PageHeader
        title="Appointments"
        description="All bookings across the platform, shown in each clinic's own timezone."
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter basePath="/admin/appointments" current={query.status} options={STATUSES} />
          <form method="get" className="flex flex-wrap items-center gap-2">
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            <input
              type="date"
              name="from"
              defaultValue={query.from}
              aria-label="From date"
              className="h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
            />
            <input
              type="date"
              name="to"
              defaultValue={query.to}
              aria-label="To date"
              className="h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
            />
            <input
              type="search"
              name="search"
              defaultValue={query.search}
              placeholder="Patient name or phone…"
              className="h-8 w-48 rounded-lg border bg-[var(--surface)] px-3 text-xs"
            />
            <button type="submit" className="hover:surface-muted rounded-lg border px-3 text-xs">
              Filter
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <AppointmentsTable appointments={result.items} showClinic />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          basePath="/admin/appointments"
          searchParams={{
            status: query.status,
            search: query.search,
            from: query.from,
            to: query.to,
          }}
        />
      </Card>
    </>
  );
}
