import 'server-only';
import type { MessageSender, Prisma as PrismaTypes } from '@prisma/client';
import { prisma, Prisma, type DbClient } from '@/lib/db/prisma';
import { notFound } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';
import { assertOwned, clinicWhere, type TenantScope } from '@/lib/tenancy/scope';
import { normalizePhone, sendText, sendInteractiveButtons, type WhatsAppButton } from '@/lib/whatsapp/client';

/**
 * Conversation, patient and lead lifecycle for the WhatsApp channel.
 *
 * Every inbound message resolves to exactly one (Patient, Lead, Conversation)
 * triple per clinic, keyed on the sender's phone number. The uniqueness of
 * (clinicId, phone) means the same person messaging two different clinics is
 * two independent records — tenants never share a patient row.
 */

export interface ResolvedContact {
  patientId: string;
  leadId: string;
  conversationId: string;
  isNewPatient: boolean;
}

/**
 * Idempotent upsert of the contact triple.
 *
 * `upsert` on the (clinicId, phone) unique index makes two webhooks arriving
 * simultaneously for a first-time sender converge on one patient rather than
 * racing to create two.
 */
export async function resolveContact(
  clinicId: string,
  rawPhone: string,
  profileName?: string | null,
  db: DbClient = prisma,
): Promise<ResolvedContact> {
  const phone = normalizePhone(rawPhone);
  const now = new Date();

  const existing = await db.patient.findUnique({
    where: { clinicId_phone: { clinicId, phone } },
    select: { id: true },
  });

  const patient = await db.patient.upsert({
    where: { clinicId_phone: { clinicId, phone } },
    create: {
      clinicId,
      phone,
      whatsappNumber: phone,
      // Only trust the WhatsApp profile name as an initial guess; the agent
      // confirms the real name during the conversation.
      name: profileName?.trim() || null,
    },
    update: {},
    select: { id: true, name: true },
  });

  const lead = await db.lead.upsert({
    where: { patientId: patient.id },
    create: {
      clinicId,
      patientId: patient.id,
      status: 'NEW',
      source: 'whatsapp',
      firstContactAt: now,
      lastContactAt: now,
    },
    update: { lastContactAt: now },
    select: { id: true },
  });

  const openConversation = await db.conversation.findFirst({
    where: { clinicId, patientId: patient.id, status: { in: ['ACTIVE', 'ESCALATED'] } },
    orderBy: { lastMessageAt: 'desc' },
    select: { id: true },
  });

  const conversationId =
    openConversation?.id ??
    (
      await db.conversation.create({
        data: { clinicId, patientId: patient.id, lastMessageAt: now },
        select: { id: true },
      })
    ).id;

  return {
    patientId: patient.id,
    leadId: lead.id,
    conversationId,
    isNewPatient: !existing,
  };
}

export interface InboundMessageInput {
  clinicId: string;
  conversationId: string;
  body: string;
  externalId?: string | null;
  mediaUrl?: string | null;
}

/**
 * Persist an inbound message.
 *
 * Returns null when the provider's message id has already been stored — the
 * de-duplication that keeps a redelivered webhook from producing a second AI
 * reply. The unique index on (clinicId, externalId) is what makes this safe
 * under concurrent delivery, not the preceding read.
 */
export async function recordInboundMessage(
  input: InboundMessageInput,
  db: DbClient = prisma,
): Promise<{ id: string } | null> {
  try {
    const message = await db.message.create({
      data: {
        clinicId: input.clinicId,
        conversationId: input.conversationId,
        direction: 'INBOUND',
        sender: 'PATIENT',
        body: input.body,
        mediaUrl: input.mediaUrl ?? null,
        status: 'DELIVERED',
        externalId: input.externalId ?? null,
      },
      select: { id: true },
    });

    // When patient sends an inbound message / clicks button, all prior outbound messages in this thread are seen (READ)
    await db.message.updateMany({
      where: {
        conversationId: input.conversationId,
        direction: 'OUTBOUND',
        status: { not: 'READ' },
      },
      data: {
        status: 'READ',
      },
    });

    await db.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: input.body.slice(0, 160) },
    });

    return message;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      logger.info(Events.WEBHOOK_DUPLICATE, 'Duplicate inbound message ignored', {
        clinicId: input.clinicId,
        externalId: input.externalId,
      });
      return null;
    }
    throw error;
  }
}

export interface OutboundMessageInput {
  clinicId: string;
  conversationId: string;
  body: string;
  sender: MessageSender;
  sentByUserId?: string | null;
  toolCalls?: unknown;
  buttons?: WhatsAppButton[];
}

/**
 * Send a WhatsApp message (text or interactive buttons) and record it.
 *
 * The row is written first with PENDING status so a send that fails is still
 * visible in the conversation view — a message that vanished on error would be
 * indistinguishable from one that was never attempted.
 */
export async function sendAndRecordOutbound(
  input: OutboundMessageInput,
  db: DbClient = prisma,
): Promise<{ id: string; delivered: boolean }> {
  console.log('\n🟣 [SEND] sendAndRecordOutbound called');
  console.log('🟣 [SEND] clinicId:', input.clinicId, '| conversationId:', input.conversationId);
  console.log('🟣 [SEND] sender:', input.sender, '| body preview:', input.body?.slice(0, 100));
  if (input.buttons && input.buttons.length > 0) {
    console.log('🟣 [SEND] with buttons:', JSON.stringify(input.buttons));
  }

  const conversation = await db.conversation.findUnique({
    where: { id: input.conversationId },
    select: { id: true, clinicId: true, patient: { select: { phone: true } } },
  });
  console.log('🟣 [SEND] Conversation found:', conversation ? `patient.phone=${conversation.patient?.phone}` : 'NOT FOUND');

  if (!conversation || conversation.clinicId !== input.clinicId) {
    console.log('🔴 [SEND] Conversation not found or clinicId mismatch — throwing notFound');
    throw notFound('Conversation not found.');
  }

  console.log('🟣 [SEND] Creating PENDING outbound message in DB...');
  const toolCallsPayload =
    (input.toolCalls as PrismaTypes.InputJsonValue) ??
    (input.buttons && input.buttons.length > 0 ? { buttons: input.buttons } : undefined);

  const message = await db.message.create({
    data: {
      clinicId: input.clinicId,
      conversationId: input.conversationId,
      direction: 'OUTBOUND',
      sender: input.sender,
      sentByUserId: input.sentByUserId ?? null,
      body: input.body,
      status: 'PENDING',
      toolCalls: toolCallsPayload,
    },
    select: { id: true },
  });
  console.log('🟣 [SEND] Outbound message created in DB, id:', message.id);
  const sendStart = Date.now();
  logger.info(Events.WHATSAPP_SEND_STARTED, 'Sending outbound WhatsApp message', {
    clinicId: input.clinicId,
    conversationId: input.conversationId,
    hasButtons: Boolean(input.buttons && input.buttons.length > 0),
  });

  try {
    let externalId: string | null = null;
    if (input.buttons && input.buttons.length > 0) {
      console.log('🟣 [SEND] Calling sendInteractiveButtons to WhatsApp API...');
      const res = await sendInteractiveButtons(
        input.clinicId,
        conversation.patient.phone,
        input.body,
        input.buttons,
      );
      externalId = res.externalId;
    } else {
      console.log('🟣 [SEND] Calling sendText to WhatsApp API...');
      console.log('🟣 [SEND] Recipient phone:', conversation.patient.phone);
      const res = await sendText(input.clinicId, conversation.patient.phone, input.body);
      externalId = res.externalId;
    }

    const sendDuration = Date.now() - sendStart;
    console.log('✅ [SEND] Outbound send succeeded! externalId:', externalId, 'in', sendDuration, 'ms');
    logger.info(Events.WHATSAPP_SEND_COMPLETED, 'WhatsApp message delivered to provider', {
      clinicId: input.clinicId,
      conversationId: input.conversationId,
      externalId,
      ms: sendDuration,
    });

    await db.message.update({
      where: { id: message.id },
      data: { status: 'SENT', externalId },
    });
    await db.conversation.update({
      where: { id: input.conversationId },
      data: { lastMessageAt: new Date(), lastMessagePreview: input.body.slice(0, 160) },
    });
    console.log('✅ [SEND] Message marked SENT in DB');
    return { id: message.id, delivered: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown send failure';
    console.log('🔴 [SEND] Outbound send FAILED! Reason:', reason);
    console.error('🔴 [SEND] Full send error:', error);
    await db.message.update({
      where: { id: message.id },
      data: { status: 'FAILED', error: reason.slice(0, 500) },
    });
    logger.error(Events.WHATSAPP_SEND_FAILED, 'Outbound message failed', {
      clinicId: input.clinicId,
      conversationId: input.conversationId,
      reason,
    });
    return { id: message.id, delivered: false };
  }
}

/** Hand the thread to a human and stop the agent from replying further. */
export async function escalateConversation(
  clinicId: string,
  conversationId: string,
  reason: string,
  db: DbClient = prisma,
): Promise<void> {
  await db.conversation.update({
    where: { id: conversationId },
    data: {
      status: 'ESCALATED',
      escalatedAt: new Date(),
      escalationReason: reason.slice(0, 500),
      aiEnabled: false,
    },
  });
  logger.warn(Events.AI_ESCALATED, 'Conversation escalated to human', {
    clinicId,
    conversationId,
    reason,
  });
}

/** Recent turns, oldest-first, for replay into the model. */
export async function loadRecentMessages(
  conversationId: string,
  limit: number,
  db: DbClient = prisma,
) {
  const rows = await db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { direction: true, sender: true, body: true, createdAt: true },
  });
  return rows.reverse();
}

// --- Read APIs (admin & portal) -------------------------------------------

export interface ConversationListQuery {
  clinicId?: string | null;
  status?: 'ACTIVE' | 'ESCALATED' | 'CLOSED';
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listConversations(scope: TenantScope, query: ConversationListQuery = {}) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 25));

  const where: PrismaTypes.ConversationWhereInput = {
    ...clinicWhere(scope, query.clinicId),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search
      ? {
          patient: {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { phone: { contains: query.search } },
            ],
          },
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.conversation.findMany({
      where,
      orderBy: { lastMessageAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        status: true,
        lastMessageAt: true,
        lastMessagePreview: true,
        escalationReason: true,
        aiEnabled: true,
        clinic: { select: { id: true, name: true, timezone: true } },
        patient: {
          select: { id: true, name: true, phone: true, lead: { select: { status: true } } },
        },
        _count: { select: { messages: true } },
      },
    }),
    prisma.conversation.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getConversationDetail(scope: TenantScope, conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      clinicId: true,
      status: true,
      escalatedAt: true,
      escalationReason: true,
      aiEnabled: true,
      createdAt: true,
      clinic: { select: { id: true, name: true, timezone: true } },
      patient: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          lead: { select: { id: true, status: true, source: true, firstContactAt: true } },
          appointments: {
            orderBy: { startsAt: 'desc' },
            take: 10,
            select: {
              id: true,
              startsAt: true,
              status: true,
              timezone: true,
              doctor: { select: { name: true } },
              service: { select: { name: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 500,
        select: {
          id: true,
          direction: true,
          sender: true,
          body: true,
          status: true,
          error: true,
          toolCalls: true,
          createdAt: true,
          sentByUser: { select: { name: true } },
        },
      },
    },
  });

  if (!conversation) throw notFound('Conversation not found.');
  assertOwned(scope, conversation, 'Conversation');
  return conversation;
}
