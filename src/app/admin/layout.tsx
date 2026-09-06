import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/shell';
import { ADMIN_NAV } from '@/components/layout/nav';

export const dynamic = 'force-dynamic';

/**
 * Server-side gate for the whole admin area.
 *
 * Middleware already redirected anonymous traffic, but this is the check that
 * actually matters: it re-reads the session from the database, so a deactivated
 * account or a revoked session is refused here even with a valid-looking JWT.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/admin');
  if (user.role !== 'SUPER_ADMIN') redirect('/portal');

  return (
    <AppShell
      navItems={ADMIN_NAV}
      workspaceName="PULSEware"
      workspaceKind="Admin"
      userName={user.name}
      userEmail={user.email}
      homeHref="/admin"
    >
      {children}
    </AppShell>
  );
}
