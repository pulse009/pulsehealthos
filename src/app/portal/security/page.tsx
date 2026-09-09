import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { SecurityPortalView } from '@/components/dashboard/SecurityPortalView';

export const metadata: Metadata = { title: 'Security & 2FA Settings' };
export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const { user, clinicId } = await requireClientUser();

  const [dbUser, clinic] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        lastLoginAt: true,
        createdAt: true,
      },
    }),
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
  ]);

  if (!dbUser) return null;

  return (
    <SecurityPortalView
      user={{
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        lastLoginAt: dbUser.lastLoginAt?.toISOString() || null,
        createdAt: dbUser.createdAt.toISOString(),
      }}
      clinicName={clinic?.name || 'Clinic'}
    />
  );
}
