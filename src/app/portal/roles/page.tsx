import 'server-only';
import { redirect } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { listClinicStaff } from '@/lib/directory/directory.service';
import { RolesPortalView, StaffUser } from '@/components/dashboard/RolesPortalView';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';

export default async function RolesPage() {
  const { user, scope, clinicId } = await requireClientUser();

  // Roles page is strictly for Owner / Super Admin
  if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
    if (user.role === 'RECEPTIONIST') {
      redirect('/portal/appointments');
    }
    redirect('/portal');
  }

  const [rawStaff, rawDoctors, clinic] = await Promise.all([
    listClinicStaff(scope, clinicId),
    prisma.doctor.findMany({
      where: { clinicId, isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId },
      select: { name: true },
    }),
  ]);

  const staff: StaffUser[] = rawStaff.map((s) => ({
    id: s.id,
    name: s.name,
    username: s.username,
    email: s.email,
    role: s.role as 'COORDINATOR' | 'RECEPTIONIST',
    isActive: s.isActive,
    createdAt: s.createdAt,
    coordinatedDoctors: s.coordinatedDoctors,
  }));

  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading staff directory...</div>}>
      <RolesPortalView
        initialStaff={staff}
        doctors={rawDoctors}
        clinicName={clinic?.name || 'Clinic'}
      />
    </Suspense>
  );
}
