import type { Metadata } from 'next';
import Link from 'next/link';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { listDoctors } from '@/lib/directory/directory.service';
import { listClinicOptions } from '@/lib/clinics/clinic.service';
import { formatMinutes } from '@/lib/time/timezone';
import {
  Badge,
  Card,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Doctors' };
export const dynamic = 'force-dynamic';

const DAY_INITIALS = ['', 'M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ clinicId?: string }>;
}) {
  const { scope } = await requireSuperAdmin();
  const { clinicId } = await searchParams;

  const [doctors, clinics] = await Promise.all([
    listDoctors(scope, clinicId),
    listClinicOptions(scope),
  ]);

  return (
    <>
      <PageHeader
        title="Doctors"
        description="Each doctor carries their own schedule, breaks and service list."
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
        {doctors.length === 0 ? (
          <EmptyState
            title="No doctors configured"
            description="Add doctors from a clinic's configuration page before the assistant can offer appointments."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Doctor</Th>
                <Th>Clinic</Th>
                <Th>Services</Th>
                <Th>Working days</Th>
                <Th>Overrides</Th>
                <Th>Status</Th>
                <Th className="text-right">Appointments</Th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => {
                const days = [...new Set(doctor.schedules.map((s) => s.weekday))].sort();
                return (
                  <tr key={doctor.id}>
                    <Td>
                      <span className="font-medium">{doctor.name}</span>
                      <span className="text-subtle block text-xs">
                        {doctor.specialty ?? 'No specialty set'}
                      </span>
                    </Td>
                    <Td className="text-xs">
                      <Link
                        href={`/admin/clinics/${doctor.clinic.id}?tab=doctors`}
                        className="hover:underline text-[var(--color-brand-600)] font-medium"
                      >
                        {doctor.clinic.name}
                      </Link>
                    </Td>
                    <Td className="text-xs">
                      {doctor.services.length === 0 ? (
                        <Badge tone="warning">None assigned</Badge>
                      ) : (
                        doctor.services.map((s) => s.service.name).join(', ')
                      )}
                    </Td>
                    <Td>
                      {days.length === 0 ? (
                        <Badge tone="warning">No schedule</Badge>
                      ) : (
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                            <span
                              key={day}
                              title={
                                doctor.schedules
                                  .filter((s) => s.weekday === day)
                                  .map(
                                    (s) =>
                                      `${formatMinutes(s.startMinute)}–${formatMinutes(s.endMinute)}`,
                                  )
                                  .join(', ') || 'Not working'
                              }
                              className={`flex size-5 items-center justify-center rounded text-[10px] ${
                                days.includes(day)
                                  ? 'bg-[var(--color-brand-600)] text-white'
                                  : 'surface-muted text-[var(--text-subtle)]'
                              }`}
                            >
                              {DAY_INITIALS[day]}
                            </span>
                          ))}
                        </div>
                      )}
                    </Td>
                    <Td className="text-muted text-xs">
                      {doctor.appointmentMinutes ? `${doctor.appointmentMinutes}m slot` : '—'}
                      {doctor.bufferMinutes ? ` · ${doctor.bufferMinutes}m buffer` : ''}
                    </Td>
                    <Td>
                      <Badge tone={doctor.isActive ? 'success' : 'neutral'}>
                        {doctor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Td>
                    <Td className="text-right tabular-nums">{doctor._count.appointments}</Td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
