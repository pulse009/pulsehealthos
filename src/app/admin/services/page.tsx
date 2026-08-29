import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listServices } from '@/lib/directory/directory.service';
import { listClinicOptions } from '@/lib/clinics/clinic.service';
import { Badge, Card, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Services' };
export const dynamic = 'force-dynamic';

/** Money is stored in minor units; present it only when a price is configured. */
function formatPrice(priceMinor: number | null, currency: string | null): string {
  if (priceMinor === null) return '—';
  return `${currency ?? ''} ${(priceMinor / 100).toFixed(2)}`.trim();
}

export default async function AdminServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const { clinicId } = await searchParams;

  const [services, clinics] = await Promise.all([
    listServices(scope, clinicId),
    listClinicOptions(scope),
  ]);

  return (
    <>
      <PageHeader
        title="Services"
        description="Duration drives slot length; only doctors assigned to a service can be booked for it."
      />

      <Card className="mb-4 p-3">
        <form method="get" className="flex flex-wrap items-center gap-2">
          <label htmlFor="clinicId" className="text-muted text-xs">
            Clinic
          </label>
          <select
            id="clinicId"
            name="clinicId"
            defaultValue={clinicId ?? ''}
            className="h-8 rounded-lg border bg-[var(--surface)] px-2 text-xs"
          >
            <option value="">All clinics</option>
            {clinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>
                {clinic.name}
              </option>
            ))}
          </select>
          <button type="submit" className="hover:surface-muted rounded-lg border px-3 py-1.5 text-xs">
            Apply
          </button>
        </form>
      </Card>

      <Card>
        {services.length === 0 ? (
          <EmptyState
            title="No services configured"
            description="A clinic needs at least one active service with an assigned doctor before booking can work."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Service</Th>
                <Th>Clinic</Th>
                <Th className="text-right">Duration</Th>
                <Th className="text-right">Buffer</Th>
                <Th className="text-right">Price</Th>
                <Th>Doctors</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <Td>
                    <span className="font-medium">{service.name}</span>
                    {service.description ? (
                      <span className="text-subtle block max-w-xs truncate text-xs">
                        {service.description}
                      </span>
                    ) : null}
                  </Td>
                  <Td className="text-xs">
                    <Link href={`/admin/clinics/${service.clinic.id}`} className="hover:underline">
                      {service.clinic.name}
                    </Link>
                  </Td>
                  <Td className="text-right tabular-nums">{service.durationMinutes}m</Td>
                  <Td className="text-muted text-right tabular-nums">
                    {service.bufferMinutes === null ? 'default' : `${service.bufferMinutes}m`}
                  </Td>
                  <Td className="text-right tabular-nums">
                    {formatPrice(service.priceMinor, service.currency)}
                  </Td>
                  <Td className="text-xs">
                    {service.doctors.length === 0 ? (
                      <Badge tone="warning">Unbookable — no doctors</Badge>
                    ) : (
                      service.doctors.map((d) => d.doctor.name).join(', ')
                    )}
                  </Td>
                  <Td>
                    <Badge tone={service.isActive ? 'success' : 'neutral'}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </Badge>
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
