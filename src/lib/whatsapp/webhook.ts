import 'server-only';
import { z } from 'zod';
import { prisma, isDuplicateEventError } from '@/lib/db/prisma';
import { logger, Events } from '@/lib/logger';
import { runAgentTurn } from '@/lib/ai/agent';
import { routeMessage } from '@/lib/router/fast-router';
import { sendTypingIndicator } from '@/lib/whatsapp/client';
import {
  resolveContact,
  recordInboundMessage,
  sendAndRecordOutbound,
} from '@/lib/conversations/conversation.service';

/**
 * Inbound WhatsApp processing.
 *
 * Two independent de-duplication layers, because Meta retries aggressively and
 * a duplicate here means either a duplicate AI reply or a duplicate booking:
 *
 *   1. `ProcessedEvent` — an insert-wins ledger keyed on the provider message
 *      id. The unique constraint, not the preceding read, is what makes this
 *      correct when two deliveries land concurrently.
 *   2. `Message.externalId` — unique per clinic, so even if the ledger were
 *      bypassed the transcript cannot gain a second copy.
 *
 * Beyond that, the message id also seeds tool idempotency keys, so a replay that
 * somehow reached the agent would still resolve to the same appointment.
 */

// Meta's payload, narrowed to the parts we act on. Unknown fields are ignored
// rather than rejected, so a platform-side addition cannot break ingestion.
const messageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string().optional(),
  type: z.string(),
  text: z.object({ body: z.string() }).optional(),
  button: z.object({ text: z.string().optional(), payload: z.string().optional() }).optional(),
  interactive: z
    .object({
      button_reply: z.object({ id: z.string().optional(), title: z.string().optional() }).optional(),
      list_reply: z.object({ id: z.string().optional(), title: z.string().optional() }).optional(),
    })
    .optional(),
});

const statusSchema = z.object({
  id: z.string(),
  status: z.string(),
  recipient_id: z.string().optional(),
  errors: z.array(z.object({ title: z.string().optional() })).optional(),
});

const valueSchema = z.object({
  messaging_product: z.string().optional(),
  metadata: z
    .object({ phone_number_id: z.string(), display_phone_number: z.string().optional() })
    .optional(),
  contacts: z
    .array(z.object({ wa_id: z.string(), profile: z.object({ name: z.string() }).optional() }))
    .optional(),
  messages: z.array(messageSchema).optional(),
  statuses: z.array(statusSchema).optional(),
});

export const webhookPayloadSchema = z.object({
  object: z.string().optional(),
  entry: z
    .array(z.object({ id: z.string().optional(), changes: z.array(z.object({ value: valueSchema })).optional() }))
    .optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

export interface ProcessSummary {
  handled: number;
  duplicates: number;
  ignored: number;
  failed: number;
}

/** Extract user-visible text and button actions from the message shapes we support. */
function extractText(message: z.infer<typeof messageSchema>): string | null {
  if (message.type === 'text' && message.text?.body) return message.text.body;
  if (message.type === 'button') {
    const text = message.button?.text;
    const payload = message.button?.payload;
    if (payload && payload !== text) {
      return `[Button Click: ${text || 'Action'} | Payload: ${payload}]`;
    }
    return text ?? payload ?? null;
  }
  if (message.type === 'interactive') {
    const item = message.interactive?.button_reply ?? message.interactive?.list_reply;
    if (item) {
      if (item.id && item.id !== item.title) {
        return `[Button Click: ${item.title || 'Action'} | ID: ${item.id}]`;
      }
      return item.title ?? item.id ?? null;
    }
  }
  return null;
}

/**
 * Claim an event id. Returns false when it has already been claimed, which is
 * the signal to skip all downstream work.
 */
async function claimEvent(scope: string, key: string): Promise<boolean> {
  try {
    await prisma.processedEvent.create({ data: { scope, key } });
    return true;
  } catch (error) {
    if (isDuplicateEventError(error)) return false;
    throw error;
  }
}

export async function processWebhookPayload(payload: WebhookPayload): Promise<ProcessSummary> {
  console.log('\n🟡 [PROCESS] processWebhookPayload called at', new Date().toISOString());
  const summary: ProcessSummary = { handled: 0, duplicates: 0, ignored: 0, failed: 0 };

  for (const entry of payload.entry ?? []) {
    console.log('🟡 [PROCESS] Processing entry id:', entry.id, '| changes:', entry.changes?.length ?? 0);
    for (const change of entry.changes ?? []) {
      const value = change.value;
      const phoneNumberId = value.metadata?.phone_number_id;
      console.log('🟡 [PROCESS] phone_number_id from payload:', phoneNumberId);
      console.log('🟡 [PROCESS] messages count:', value.messages?.length ?? 0);
      console.log('🟡 [PROCESS] statuses count:', value.statuses?.length ?? 0);

      if (!phoneNumberId) {
        console.log('🔴 [PROCESS] No phone_number_id — ignoring change');
        summary.ignored += 1;
        continue;
      }

      let integration = await prisma.whatsAppIntegration.findUnique({
        where: { phoneNumberId },
        select: { clinicId: true, isActive: true, clinic: { select: { isActive: true } } },
      });
      console.log('🟡 [PROCESS] Exact integration match:', integration ? `clinicId=${integration.clinicId} isActive=${integration.isActive}` : 'NOT FOUND');

      if (!integration || !integration.isActive || !integration.clinic.isActive) {
        console.log('🟡 [PROCESS] Exact match missing/inactive — trying fallback findFirst...');
        integration = await prisma.whatsAppIntegration.findFirst({
          where: { isActive: true, clinic: { isActive: true } },
          select: { clinicId: true, isActive: true, clinic: { select: { isActive: true } } },
        });
        console.log('🟡 [PROCESS] Fallback integration:', integration ? `clinicId=${integration.clinicId}` : 'NONE FOUND');
      }

      if (!integration || !integration.isActive || !integration.clinic.isActive) {
        console.log('🔴 [PROCESS] No active integration found — ignoring webhook');
        logger.warn(Events.WEBHOOK_REJECTED, 'Webhook for unknown or inactive number', { phoneNumberId });
        summary.ignored += 1;
        continue;
      }
      const clinicId = integration.clinicId;
      console.log('✅ [PROCESS] Routed to clinicId:', clinicId);

      // --- Delivery receipts ---------------------------------------------
      for (const status of value.statuses ?? []) {
        console.log('🟡 [PROCESS] Processing delivery status:', status.id, status.status);
        try {
          const mapped =
            status.status === 'delivered'
              ? 'DELIVERED'
              : status.status === 'read'
                ? 'READ'
                : status.status === 'failed'
                  ? 'FAILED'
                  : null;
          if (!mapped) continue;
          await prisma.message.updateMany({
            where: { clinicId, externalId: status.id },
            data: {
              status: mapped,
              ...(mapped === 'FAILED'
                ? { error: status.errors?.[0]?.title?.slice(0, 500) ?? 'Delivery failed' }
                : {}),
            },
          });
          console.log('✅ [PROCESS] Delivery status updated:', status.id, '->', mapped);
        } catch (error) {
          console.log('🔴 [PROCESS] Error updating delivery status:', error instanceof Error ? error.message : String(error));
          logger.error(Events.WEBHOOK_REJECTED, 'Failed to apply delivery status', {
            clinicId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // --- Inbound messages ----------------------------------------------
      for (const message of value.messages ?? []) {
        console.log('\n🟡 [PROCESS] Inbound message id:', message.id);
        console.log('🟡 [PROCESS] From:', message.from, '| Type:', message.type, '| Body:', message.text?.body ?? '[no text]');

        const claimed = await claimEvent('whatsapp:message', message.id);
        console.log('🟡 [PROCESS] claimEvent result:', claimed ? 'CLAIMED (new)' : 'ALREADY CLAIMED (duplicate)');

        if (!claimed) {
          logger.info(Events.WEBHOOK_DUPLICATE, 'Duplicate webhook delivery ignored', { clinicId, externalId: message.id });
          summary.duplicates += 1;
          continue;
        }

        try {
          console.log('🟡 [PROCESS] Calling handleInboundMessage...');
          await handleInboundMessage(clinicId, value, message);
          summary.handled += 1;
          console.log('✅ [PROCESS] handleInboundMessage completed successfully');
        } catch (error) {
          summary.failed += 1;
          console.log('🔴 [PROCESS] handleInboundMessage THREW:', error instanceof Error ? error.message : String(error));
          console.error('🔴 [PROCESS] Full error:', error);
          logger.error(Events.WEBHOOK_REJECTED, 'Failed to process inbound message', {
            clinicId,
            externalId: message.id,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  console.log('✅ [PROCESS] Summary:', JSON.stringify(summary));
  return summary;
}

async function handleInboundMessage(
  clinicId: string,
  value: z.infer<typeof valueSchema>,
  message: z.infer<typeof messageSchema>,
): Promise<void> {
  console.log('\n🟠 [HANDLE] handleInboundMessage start');
  console.log('🟠 [HANDLE] clinicId:', clinicId);
  console.log('🟠 [HANDLE] message.from:', message.from, '| message.id:', message.id);

  const profileName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name ?? null;
  console.log('🟠 [HANDLE] profileName:', profileName);

  console.log('🟠 [HANDLE] Calling resolveContact...');
  const contact = await resolveContact(clinicId, message.from, profileName);
  console.log('🟠 [HANDLE] resolveContact result:', JSON.stringify(contact));

  const text = extractText(message);
  console.log('🟠 [HANDLE] extractText result:', text ?? '[null — unsupported message type]');

  if (!text) {
    console.log('🟠 [HANDLE] Unsupported message type, sending generic reply...');
    await recordInboundMessage({
      clinicId,
      conversationId: contact.conversationId,
      body: `[unsupported message type: ${message.type}]`,
      externalId: message.id,
    });
    await sendAndRecordOutbound({
      clinicId,
      conversationId: contact.conversationId,
      body: "Thanks for that. I can only read text messages — could you type your question instead?",
      sender: 'SYSTEM',
    });
    return;
  }

  console.log('🟠 [HANDLE] Calling recordInboundMessage...');
  const stored = await recordInboundMessage({
    clinicId,
    conversationId: contact.conversationId,
    body: text,
    externalId: message.id,
  });
  console.log('🟠 [HANDLE] recordInboundMessage result:', stored ? `stored id=${stored.id}` : 'NULL (duplicate — skipping AI)');

  // Already in the transcript — a second reply would be a duplicate.
  if (!stored) return;

  // A conversation a human has taken over must not get an AI reply on top.
  const conversation = await prisma.conversation.findUnique({
    where: { id: contact.conversationId },
    select: { aiEnabled: true, status: true },
  });
  console.log('🟠 [HANDLE] conversation aiEnabled:', conversation?.aiEnabled, '| status:', conversation?.status);

  if (!conversation?.aiEnabled || conversation.status === 'ESCALATED') {
    console.log('🟠 [HANDLE] AI disabled or escalated — skipping AI reply');
    logger.info(Events.AI_ESCALATED, 'Skipping AI reply on escalated conversation', {
      clinicId,
      conversationId: contact.conversationId,
    });
    return;
  }

  // 0. WHATSAPP TYPING INDICATOR: Trigger immediately so patient sees "typing..." indicator
  // while backend/AI prepares the response. Failures are non-blocking and swallowed inside sendTypingIndicator.
  await sendTypingIndicator(clinicId, message.id);

  // 1. FAST ROUTER: Evaluate deterministic intents and button actions directly (sub-50ms)
  const fastRoute = await routeMessage({
    clinicId,
    conversationId: contact.conversationId,
    patientId: contact.patientId,
    leadId: contact.leadId,
    message: text,
    idempotencySeed: message.id,
  });

  if (fastRoute.handled && fastRoute.reply) {
    console.log('⚡ [HANDLE] Fast router handled message directly. Reply:', fastRoute.reply.slice(0, 100));
    const sent = await sendAndRecordOutbound({
      clinicId,
      conversationId: contact.conversationId,
      body: fastRoute.reply,
      sender: 'AI',
      buttons: fastRoute.buttons && fastRoute.buttons.length > 0 ? fastRoute.buttons : undefined,
    });
    console.log('✅ [HANDLE] Fast router reply delivered:', JSON.stringify(sent));
    return;
  }

  // 2. AI AGENT: Fallback to LLM for complex natural language queries and general conversation
  console.log('🤖 [HANDLE] Delegating to AI Agent for complex query...');
  const turn = await runAgentTurn({
    clinicId,
    conversationId: contact.conversationId,
    patientId: contact.patientId,
    leadId: contact.leadId,
    message: text,
    idempotencySeed: message.id,
    locale: fastRoute.locale,
  });
  console.log('🤖 [HANDLE] runAgentTurn result:', JSON.stringify({ reply: turn.reply?.slice(0, 100), escalated: turn.escalated, usedFallback: turn.usedFallback, toolCalls: turn.toolCalls, buttons: turn.buttons }));

  console.log('🤖 [HANDLE] Calling sendAndRecordOutbound for AI reply...');
  const sent = await sendAndRecordOutbound({
    clinicId,
    conversationId: contact.conversationId,
    body: turn.reply,
    sender: turn.usedFallback ? 'SYSTEM' : 'AI',
    toolCalls: turn.toolCalls.length > 0 ? turn.toolCalls : undefined,
    buttons: turn.buttons && turn.buttons.length > 0 ? turn.buttons : undefined,
  });
  console.log('🟠 [HANDLE] sendAndRecordOutbound result:', JSON.stringify(sent));
  console.log('✅ [HANDLE] handleInboundMessage complete');
}

