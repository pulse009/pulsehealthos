import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function AccountsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/portal/accounts');
  if (user.pulseNow) {
    redirect('/portal');
  }

  return <>{children}</>;
}
