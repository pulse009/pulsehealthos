import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { getLead } from '@/lib/leads/lead.service';
import { AppError } from '@/lib/errors';
import { PageHeader } from '@/components/ui/primitives';
import { LeadDetail } from '@/components/data/lead-detail';

export const metadata: Metadata = { title: 'Lead' };
export const dynamic = 'force-dynamic';

export default async function AdminLeadPage({ params }: { params: Promise<{ id: string }> }) {
  const { scope } = await requireSuperAdmin();
  const { id } = await params;

  let lead: Awaited<ReturnType<typeof getLead>>;
  try {
    lead = await getLead(scope, id);
  } catch (error) {
    if (error instanceof AppError && (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')) {
      notFound();
    }
    throw error;
  }

  return (
    <>
      <PageHeader
        title={lead.patient.name ?? lead.patient.phone}
        description={`${lead.clinic.name} · ${lead.patient.phone}`}
        action={
          <Link href="/admin/leads" className="text-muted text-xs hover:underline">
            Back to leads
          </Link>
        }
      />
      <LeadDetail lead={lead} conversationHrefPrefix="/admin/conversations" />
    </>
  );
}
