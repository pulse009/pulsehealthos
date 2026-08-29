import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { getSessionUser } from '@/lib/auth/session';
import { AppShell } from '@/components/layout/shell';
import { PORTAL_NAV } from '@/components/layout/nav';

export const dynamic = 'force-dynamic';

/**
 * Client portal gate.
 *
 * Super admins are bounced to /admin rather than being shown a portal: the
 * portal's queries assume a single tenant, and letting a platform-scoped
 * principal through would produce cross-clinic aggregates on a page designed to
 * show one clinic.
 */
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect('/login?next=/portal');
  if (user.role === 'SUPER_ADMIN') redirect('/admin');
  if (!user.clinicId) redirect('/login');

  return (
    <AppShell
      navItems={PORTAL_NAV}
      workspaceName={user.clinicName || 'Clinic'}
      workspaceKind="Clinic"
      userName={user.name}
      userEmail={user.email}
      homeHref="/portal"
    >
      {children}
    </AppShell>
  );
}
