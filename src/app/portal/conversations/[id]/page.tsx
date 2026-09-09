import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  ConversationsPortalDashboard,
  type ConversationItem,
} from '@/components/dashboard/ConversationsPortalDashboard';

export const metadata: Metadata = { title: 'WhatsApp Conversation' };
export const dynamic = 'force-dynamic';

export default async function PortalConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { clinicId } = await requireClientUser();
  const { id } = await params;

  const [clinic, rawConversations] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.conversation.findMany({
      where: { clinicId: clinicId! },
      orderBy: { lastMessageAt: 'desc' },
      take: 100,
      select: {
        id: true,
        patientId: true,
        status: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        escalationReason: true,
        aiEnabled: true,
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            fileNumber: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 50,
          select: {
            id: true,
            sender: true,
            direction: true,
            body: true,
            status: true,
            toolCalls: true,
            createdAt: true,
          },
        },
        _count: { select: { messages: true } },
      },
    }),
  ]);

  const timezone = clinic?.timezone ?? 'Asia/Riyadh';

  const initialConversations: ConversationItem[] = rawConversations.map((c) => {
    const unreadMessagesCount = c.messages.filter(
      (m) => m.direction === 'INBOUND' && m.status !== 'READ'
    ).length;

    return {
      id: c.id,
      patientId: c.patientId,
      patientName: c.patient.name || 'Guest Patient',
      phone: c.patient.phone,
      email: c.patient.email,
      fileNumber: c.patient.fileNumber,
      status: c.status,
      lastMessageAt: c.lastMessageAt.toISOString(),
      lastMessagePreview: c.lastMessagePreview,
      escalationReason: c.escalationReason,
      aiEnabled: c.aiEnabled,
      messageCount: c._count.messages,
      unreadCount: unreadMessagesCount,
      messages: c.messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        direction: m.direction,
        body: m.body,
        status: m.status,
        toolCalls: m.toolCalls,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  });

  return (
    <ConversationsPortalDashboard
      clinicName={clinic?.name ?? 'Clinic'}
      timezone={timezone}
      initialConversations={initialConversations}
      defaultSelectedId={id}
    />
  );
}
