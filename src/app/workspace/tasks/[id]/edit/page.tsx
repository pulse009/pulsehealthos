import type { Metadata } from 'next';
import { WorkspaceTaskEditClient } from './WorkspaceTaskEditClient';

export const metadata: Metadata = { title: 'Edit Task | Project Space' };
export const dynamic = 'force-dynamic';

export default async function TaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <WorkspaceTaskEditClient taskId={id} />;
}
