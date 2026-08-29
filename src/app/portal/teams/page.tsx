import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { Users2, Stethoscope, UserCog, Mail, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/primitives';

export const metadata: Metadata = { title: 'Clinic Teams' };
export const dynamic = 'force-dynamic';

export default async function ClinicTeamsPage() {
  const { clinicId } = await requireClientUser();

  const [doctors, staff] = await Promise.all([
    prisma.doctor.findMany({
      where: { clinicId: clinicId! },
      orderBy: { name: 'asc' },
      include: {
        services: { include: { service: { select: { name: true } } } },
        schedules: true,
      },
    }),
    prisma.user.findMany({
      where: { clinicId: clinicId! },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    }),
  ]);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users2 className="size-6 text-blue-600" />
            Clinic Teams & Practitioners
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your clinic doctors, practitioners, and administrative staff.
          </p>
        </div>
      </div>

      {/* Doctors & Practitioners */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Stethoscope className="size-5 text-blue-600" />
          Doctors & Specialists ({doctors.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((d) => (
            <div
              key={d.id}
              className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Dr. {d.name}</h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mt-0.5">
                    {d.specialty || 'General Practitioner'}
                  </span>
                </div>
                <Badge tone={d.isActive ? 'success' : 'warning'} className="text-[11px]">
                  {d.isActive ? 'Accepting Appointments' : 'Inactive'}
                </Badge>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Clock className="size-3.5 text-slate-400" />
                  <span>Duration: {d.appointmentMinutes || 30} mins</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {d.services.slice(0, 3).map((s) => (
                    <span
                      key={s.serviceId}
                      className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-medium"
                    >
                      {s.service.name}
                    </span>
                  ))}
                  {d.services.length > 3 ? (
                    <span className="text-[10px] text-slate-400 font-medium">+{d.services.length - 3} more</span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Members */}
      <div className="surface rounded-2xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900 shadow-xs space-y-4 mt-8">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCog className="size-5 text-blue-600" />
          Clinic Staff & Administrators ({staff.length})
        </h2>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {staff.map((u) => {
            const initial = (u.name?.[0] || u.email?.[0] || 'U').toUpperCase();
            return (
              <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center">
                    {initial}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">{u.name || u.email}</span>
                    <span className="text-slate-400 flex items-center gap-1 mt-0.5">
                      <Mail className="size-3" />
                      {u.email}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={u.role === 'CLIENT' ? 'brand' : 'info'}>{u.role === 'CLIENT' ? 'Clinic Staff' : 'Admin'}</Badge>
                  <Badge tone={u.isActive ? 'success' : 'warning'}>{u.isActive ? 'Active' : 'Disabled'}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
