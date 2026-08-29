import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { Card, CardBody, CardHeader, PageHeader } from '@/components/ui/primitives';
import { NewClinicForm } from './new-clinic-form';

export const metadata: Metadata = { title: 'New clinic' };
export const dynamic = 'force-dynamic';

export default async function NewClinicPage() {
  await requireSuperAdmin();

  return (
    <>
      <PageHeader
        title="New clinic"
        description="Creates the tenant with sensible defaults: weekday 09:00–17:00 hours, a 24-hour and 2-hour reminder rule, and a disabled-by-default assistant profile."
        action={
          <Link href="/admin/clinics" className="text-muted text-xs hover:underline">
            Cancel
          </Link>
        }
      />

      <Card className="max-w-3xl">
        <CardHeader title="Clinic details" />
        <CardBody>
          <NewClinicForm />
        </CardBody>
      </Card>
    </>
  );
}
