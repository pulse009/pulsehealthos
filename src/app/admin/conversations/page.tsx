import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listConversations } from '@/lib/conversations/conversation.service';
import { Card, PageHeader, Pagination } from '@/components/ui/primitives';
import { ConversationsTable, StatusFilter } from '@/components/data/tables';

export const metadata: Metadata = { title: 'Conversations' };
export const dynamic = 'force-dynamic';

const STATUSES = ['ACTIVE', 'ESCALATED', 'CLOSED'];

export default async function AdminConversationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { scope } = await requireSuperAdmin();
  const raw = await searchParams;

  const status = STATUSES.includes(raw.status ?? '')
    ? (raw.status as 'ACTIVE' | 'ESCALATED' | 'CLOSED')
    : undefined;
  const page = Number(raw.page ?? 1) || 1;

  const result = await listConversations(scope, { status, search: raw.search, page });

  return (
    <>
      <PageHeader
        title="Conversations"
        description="Full WhatsApp transcripts, including every tool the assistant called."
      />

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilter basePath="/admin/conversations" current={status} options={STATUSES} />
          <form method="get" className="flex gap-2">
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <input
              type="search"
              name="search"
              defaultValue={raw.search}
              placeholder="Patient name or phone…"
              className="h-8 w-56 rounded-lg border bg-[var(--surface)] px-3 text-xs"
            />
            <button type="submit" className="hover:surface-muted rounded-lg border px-3 text-xs">
              Search
            </button>
          </form>
        </div>
      </Card>

      <Card>
        <ConversationsTable
          conversations={result.items}
          hrefPrefix="/admin/conversations"
          showClinic
        />
        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          total={result.total}
          basePath="/admin/conversations"
          searchParams={{ status, search: raw.search }}
        />
      </Card>
    </>
  );
}
