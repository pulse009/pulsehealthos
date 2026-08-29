import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listLeads } from '@/lib/leads/lead.service';
import { leadListSchema } from '@/lib/validation/schemas';
import { Card, PageHeader, Pagination } from '@/components/ui/primitives';
import { LeadsTable, StatusFilter } from '@/components/data/tables';

export const metadata: Metadata = { title: 'Leads' };
export const dynamic = 'force-dynamic';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'BOOKED', 'LOST'];

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { scope } = await requireSuperAdmin();
  const raw = await searchParams;

  // Unparseable query params fall back to defaults rather than erroring the page.
  const query = leadListSchema.parse({
    page: raw.page ?? 1,
    pageSize: raw.pageSize ?? 25,
    status: STATUSES.includes(raw.status ?? '') ? raw.status : undefined,
    search: raw.search,
    clinicId: raw.clinicId,
  });

  const result = await listLeads(scope, query);

  return (
    <>
      <PageHeader title="Leads" description="Every patient who has contacted a clinic." />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter basePath="/admin/leads" current={query.status} options={STATUSES} />
          <form method="get" className="flex gap-2">
            {query.status ? <input type="hidden" name="status" value={query.status} /> : null}
            <input
              type="search"
              name="search"
              defaultValue={query.search}
              placeholder="Name, phone or email…"
              className="h-8 w-56 rounded-lg border bg-[var(--surface)] px-3 text-xs"
            />
            <button type="submit" className="hover:surface-muted rounded-lg border px-3 text-xs">
              Search
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <LeadsTable leads={result.items} hrefPrefix="/admin/leads" showClinic />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          basePath="/admin/leads"
          searchParams={{ status: query.status, search: query.search }}
        />
      </Card>
    </>
  );
}
