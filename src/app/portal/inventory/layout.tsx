import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/portal/inventory');
  if (user.pulseNow) {
    redirect('/portal');
  }

  return <>{children}</>;
}
