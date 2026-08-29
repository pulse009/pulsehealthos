import type { Metadata } from 'next';
import Link from 'next/link';
import { env } from '@/env';
import { requireSuperAdmin } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { isGeminiConfigured } from '@/lib/ai/gemini';
import { toolNames } from '@/lib/ai/tools';
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

export const metadata: Metadata = { title: 'AI Configuration' };
export const dynamic = 'force-dynamic';

export default async function AdminAiPage() {
  await requireSuperAdmin();

  const configs = await prisma.aIConfiguration.findMany({
    orderBy: { clinic: { name: 'asc' } },
    select: {
      id: true,
      assistantName: true,
      model: true,
      temperature: true,
      historyWindow: true,
      isEnabled: true,
      primaryLanguage: true,
      supportedLanguages: true,
      customInstructions: true,
      clinic: { select: { id: true, name: true, isActive: true } },
    },
  });

  const geminiReady = isGeminiConfigured();

  return (
    <>
      <PageHeader
        title="AI configuration"
        description="Per-clinic assistant settings. Editing happens on each clinic's AI tab."
      />

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Provider" />
          <CardBody className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted">Gemini API key</span>
              <Badge tone={geminiReady ? 'success' : 'danger'}>
                {geminiReady ? 'Configured' : 'Missing'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted">Default model</span>
              <code className="font-mono text-xs">{env.GEMINI_MODEL}</code>
            </div>
            {!geminiReady ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Without <code className="font-mono">GEMINI_API_KEY</code>, inbound messages receive
                a neutral holding reply and are left for a human.
              </p>
            ) : null}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Available tools"
            description="The complete set of actions the assistant can take. Everything else is impossible for it to do."
          />
          <CardBody>
            <div className="flex flex-wrap gap-1.5">
              {toolNames.map((name) => (
                <Badge key={name} tone="info">
                  {name}
                </Badge>
              ))}
            </div>
            <p className="text-subtle mt-3 text-xs">
              Every call is validated server-side and scoped to the conversation&apos;s clinic. The
              model cannot query the database directly or reach another tenant&apos;s data.
            </p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Per-clinic assistants" />
        {configs.length === 0 ? (
          <EmptyState
            title="No assistants configured"
            description="Creating a clinic provisions an assistant profile automatically."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Clinic</Th>
                <Th>Assistant</Th>
                <Th>Model</Th>
                <Th className="text-right">Temp</Th>
                <Th className="text-right">History</Th>
                <Th>Languages</Th>
                <Th>Instructions</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {configs.map((config) => (
                <tr key={config.id}>
                  <Td>
                    <Link
                      href={`/admin/clinics/${config.clinic.id}?tab=ai`}
                      className="font-medium hover:underline"
                    >
                      {config.clinic.name}
                    </Link>
                  </Td>
                  <Td className="text-sm">{config.assistantName}</Td>
                  <Td className="font-mono text-xs">{config.model}</Td>
                  <Td className="text-right tabular-nums">{config.temperature}</Td>
                  <Td className="text-right tabular-nums">{config.historyWindow}</Td>
                  <Td className="text-xs">{config.supportedLanguages.join(', ')}</Td>
                  <Td>
                    {/* Never render the prompt itself in a list view. */}
                    <Badge tone={config.customInstructions ? 'brand' : 'neutral'}>
                      {config.customInstructions ? 'Customised' : 'Default'}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={config.isEnabled && config.clinic.isActive ? 'success' : 'neutral'}>
                      {config.isEnabled ? (config.clinic.isActive ? 'Live' : 'Clinic off') : 'Disabled'}
                    </Badge>
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
