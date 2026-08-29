import type { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/env';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
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

export const metadata: Metadata = { title: 'WhatsApp' };
export const dynamic = 'force-dynamic';

export default async function AdminWhatsAppPage() {
  await requireSuperAdmin();

  const [integrations, failedCount] = await Promise.all([
    prisma.whatsAppIntegration.findMany({
      orderBy: { clinic: { name: 'asc' } },
      select: {
        id: true,
        phoneNumberId: true,
        displayPhoneNumber: true,
        isActive: true,
        lastError: true,
        lastErrorAt: true,
        accessTokenCipher: true,
        appSecretCipher: true,
        clinic: { select: { id: true, name: true, isActive: true } },
      },
    }),
    prisma.message.count({ where: { status: 'FAILED' } }),
  ]);

  const webhookUrl = `${env.APP_URL}/api/webhooks/whatsapp`;
  const platformSecretSet = Boolean(env.WHATSAPP_APP_SECRET);

  return (
    <>
      <PageHeader
        title="WhatsApp"
        description="One Meta phone number id per clinic; that id is what routes an inbound webhook to a tenant."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Shared webhook endpoint" />
          <CardBody className="space-y-3 text-sm">
            <div>
              <p className="text-muted text-xs">Callback URL</p>
              <code className="mt-1 block break-all font-mono text-xs">{webhookUrl}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Signature verification</span>
              <Badge tone={platformSecretSet ? 'success' : 'danger'}>
                {platformSecretSet ? 'Enabled' : 'Not configured'}
              </Badge>
            </div>
            {!platformSecretSet ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                <code className="font-mono">WHATSAPP_APP_SECRET</code> is unset, so every inbound
                webhook is rejected. This fails closed on purpose — an unset secret must never be
                read as &ldquo;all signatures valid&rdquo;.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Delivery health" />
          <CardBody className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Failed outbound messages</span>
              <Badge tone={failedCount > 0 ? 'danger' : 'success'}>{failedCount}</Badge>
            </div>
            <p className="text-subtle text-xs">
              Failures are recorded against the message row, so they stay visible in the
              conversation transcript rather than only in logs.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Clinic integrations" />
        {integrations.length === 0 ? (
          <EmptyState
            title="No WhatsApp integrations"
            description="Connect a number from a clinic's WhatsApp tab."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Clinic</Th>
                <Th>Number</Th>
                <Th>Phone number ID</Th>
                <Th>Access token</Th>
                <Th>App secret</Th>
                <Th>Status</Th>
                <Th>Last error</Th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((integration) => (
                <tr key={integration.id}>
                  <Td>
                    <Link
                      href={`/admin/clinics/${integration.clinic.id}?tab=whatsapp`}
                      className="font-medium hover:underline"
                    >
                      {integration.clinic.name}
                    </Link>
                  </Td>
                  <Td className="text-xs">{integration.displayPhoneNumber ?? '—'}</Td>
                  <Td className="font-mono text-xs">{integration.phoneNumberId}</Td>
                  <Td>
                    {/* Presence only — the value is never read back out of the database. */}
                    <Badge tone={integration.accessTokenCipher ? 'success' : 'warning'}>
                      {integration.accessTokenCipher ? 'Stored' : 'Missing'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={integration.appSecretCipher ? 'success' : 'warning'}>
                      {integration.appSecretCipher ? 'Stored' : 'Missing'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={integration.isActive ? 'success' : 'neutral'}>
                      {integration.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Td>
                  <Td className="text-muted max-w-xs truncate text-xs">
                    {integration.lastError
                      ? `${integration.lastError}${
                          integration.lastErrorAt
                            ? ` · ${formatInstant(integration.lastErrorAt, 'UTC')}`
                            : ''
                        }`
                      : '—'}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
