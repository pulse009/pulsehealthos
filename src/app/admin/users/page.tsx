import type { Metadata } from 'next';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { listClinicOptions } from '@/lib/clinics/clinic.service';
import { formatInstant } from '@/lib/time/timezone';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/ui/primitives';
import { NewUserForm } from './new-user-form';

export const metadata: Metadata = { title: 'Users' };
export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  const { scope, user: currentUser } = await requireSuperAdmin();

  const [users, clinics] = await Promise.all([
    prisma.user.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      // No passwordHash, ever — not even to a super admin.
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        lockedUntil: true,
        createdAt: true,
        clinic: { select: { id: true, name: true } },
      },
    }),
    listClinicOptions(scope),
  ]);

  const now = new Date();

  return (
    <>
      <PageHeader
        title="Users"
        description="Platform administrators and clinic portal accounts."
      />

      <Card className="mb-6">
        <CardHeader
          title="Create an account"
          description="Client accounts are permanently bound to one clinic and can only ever read that clinic's data."
        />
        <CardBody>
          <NewUserForm clinics={clinics} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="All users" />
        {users.length === 0 ? (
          <EmptyState title="No users" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Clinic</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const locked = user.lockedUntil && user.lockedUntil > now;
                return (
                  <tr key={user.id}>
                    <Td>
                      <span className="font-medium">{user.name}</span>
                      {user.id === currentUser.id ? (
                        <Badge tone="brand" className="ml-2">
                          You
                        </Badge>
                      ) : null}
                    </Td>
                    <Td className="text-xs">{user.email}</Td>
                    <Td>
                      <Badge tone={user.role === 'SUPER_ADMIN' ? 'brand' : 'info'}>
                        {user.role === 'SUPER_ADMIN' ? 'Super admin' : 'Client'}
                      </Badge>
                    </Td>
                    <Td className="text-xs">{user.clinic?.name ?? '—'}</Td>
                    <Td>
                      {locked ? (
                        <Badge tone="warning">Locked</Badge>
                      ) : (
                        <Badge tone={user.isActive ? 'success' : 'neutral'}>
                          {user.isActive ? 'Active' : 'Disabled'}
                        </Badge>
                      )}
                    </Td>
                    <Td className="text-muted text-xs whitespace-nowrap">
                      {user.lastLoginAt ? formatInstant(user.lastLoginAt, 'UTC') : 'Never'}
                    </Td>
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
