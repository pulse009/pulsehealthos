import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { SubscriptionPortalView } from '@/components/dashboard/SubscriptionPortalView';

export const metadata: Metadata = { title: 'Subscription & Plans' };
export const dynamic = 'force-dynamic';

export default async function SubscriptionPage() {
  const { clinicId } = await requireClientUser();

  const [clinic, doctorsCount, servicesCount] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: {
        id: true,
        name: true,
        slug: true,
        pulseHealthOS: true,
        pulseNow: true,
        createdAt: true,
      },
    }),
    prisma.doctor.count({
      where: { clinicId: clinicId!, isActive: true },
    }),
    prisma.service.count({
      where: { clinicId: clinicId!, isActive: true },
    }),
  ]);

  if (!clinic) return null;

  return (
    <SubscriptionPortalView
      clinic={{
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        pulseHealthOS: clinic.pulseHealthOS,
        pulseNow: clinic.pulseNow,
        doctorsCount,
        servicesCount,
        createdAt: clinic.createdAt.toISOString(),
      }}
    />
  );
}
