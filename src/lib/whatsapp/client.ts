import 'server-only';
import { env } from '@/env';
import { prisma } from '@/lib/db/prisma';
import { decryptOptional } from '@/lib/crypto';
import { configurationError, integrationError } from '@/lib/errors';
import { logger, Events } from '@/lib/logger';

/**
 * Meta WhatsApp Cloud API client.
 *
 * Credentials are per-clinic and stored encrypted; they are decrypted here, used
 * for a single request, and never returned to any caller. The platform-level
 * env vars act only as a fallback for a shared number during development.
 */

export interface WhatsAppCredentials {
  phoneNumberId: string;
  accessToken: string;
}

export interface SendResult {
  /** Provider message id (`wamid.…`), stored for delivery-status correlation. */
  externalId: string | null;
}

/** Loads and decrypts a clinic's credentials. Returns null when unconfigured. */
export async function loadCredentials(clinicId: string): Promise<WhatsAppCredentials | null> {
  const integration = await prisma.whatsAppIntegration.findUnique({
    where: { clinicId },
    select: { phoneNumberId: true, accessTokenCipher: true, isActive: true },
  });
  if (!integration || !integration.isActive) return null;

  const accessToken = decryptOptional(integration.accessTokenCipher);
  if (!accessToken) return null;

  return { phoneNumberId: integration.phoneNumberId, accessToken };
}

/** Digits-only E.164, as the Cloud API expects (no '+', no separators). */
export function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '');
}

async function postToGraph(
  credentials: WhatsAppCredentials,
  payload: Record<string, unknown>,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.WHATSAPP_TIMEOUT_MS);
  try {
    return await fetch(`${env.WHATSAPP_API_BASE_URL}/${credentials.phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function extractMetaErrorMessage(status: number, responseBody: string): string {
  try {
    const parsed = JSON.parse(responseBody);
    if (parsed?.error) {
      const { code, message, error_data, error_subcode } = parsed.error;
      const details = error_data?.details ? ` - ${error_data.details}` : '';
      const subcode = error_subcode ? ` (subcode ${error_subcode})` : '';
      return `[Code ${code || status}${subcode}] ${message || 'Unknown Meta error'}${details}`;
    }
  } catch {}
  return `[HTTP ${status}] ${responseBody.slice(0, 200)}`;
}

/**
 * Send a plain text message.
 *
 * Throws `integrationError` on any non-2xx; the caller is responsible for
 * persisting the failure against the outbound Message row so it is visible in
 * the admin conversation view rather than only in logs.
 */
export async function sendText(
  clinicId: string,
  to: string,
  body: string,
): Promise<SendResult> {
  console.log('\n💬 [WHATSAPP] sendText called | clinicId:', clinicId, '| to:', to);
  console.log('💬 [WHATSAPP] body preview:', body.slice(0, 100));

  const credentials = await loadCredentials(clinicId);
  console.log('💬 [WHATSAPP] credentials loaded:', credentials ? `phoneNumberId=${credentials.phoneNumberId} tokenPreview=${credentials.accessToken?.slice(0,15)}...` : 'NULL — NOT CONFIGURED');

  if (!credentials) {
    console.log('🔴 [WHATSAPP] No credentials — throwing configurationError');
    throw configurationError('WhatsApp is not configured for this clinic.');
  }

  const recipient = normalizePhone(to);
  console.log('💬 [WHATSAPP] normalizePhone result:', recipient ?? 'NULL — INVALID');
  if (!recipient) throw integrationError('Recipient phone number is invalid.');

  const requestBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'text',
    text: { preview_url: false, body: body.slice(0, 4_096) },
  };
  console.log('💬 [WHATSAPP] Sending to Graph API URL:', `${env.WHATSAPP_API_BASE_URL}/${credentials.phoneNumberId}/messages`);
  console.log('💬 [WHATSAPP] Request body:', JSON.stringify(requestBody));

  let response: Response;
  try {
    response = await postToGraph(credentials, requestBody);
    console.log('💬 [WHATSAPP] postToGraph HTTP status:', response.status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'network failure';
    console.log('🔴 [WHATSAPP] postToGraph network error:', message);
    logger.error(Events.WHATSAPP_SEND_FAILED, 'WhatsApp request failed', { clinicId, message });
    throw integrationError('Could not reach WhatsApp.');
  }

  const text = await response.text();
  console.log('💬 [WHATSAPP] Graph API response body:', text.slice(0, 500));

  if (!response.ok) {
    const metaError = extractMetaErrorMessage(response.status, text);
    console.log('🔴 [WHATSAPP] Graph API returned non-2xx:', response.status, metaError);
    logger.error(Events.WHATSAPP_SEND_FAILED, `WhatsApp rejected the message: ${metaError}`, {
      clinicId,
      status: response.status,
      metaError,
      body: text.slice(0, 500),
    });
    await prisma.whatsAppIntegration
      .update({
        where: { clinicId },
        data: { lastError: metaError.slice(0, 190), lastErrorAt: new Date() },
      })
      .catch(() => undefined);
    throw integrationError(`WhatsApp rejected the message: ${metaError}`);
  }

  let externalId: string | null = null;
  try {
    const parsed = JSON.parse(text) as { messages?: Array<{ id?: string }> };
    externalId = parsed.messages?.[0]?.id ?? null;
  } catch {
    externalId = null;
  }

  console.log('✅ [WHATSAPP] Message sent successfully! externalId:', externalId);
  logger.info(Events.WHATSAPP_SEND_SUCCESS, 'WhatsApp message sent', { clinicId, externalId });
  return { externalId };
}

export interface WhatsAppButton {
  id: string;
  title: string;
}

/**
 * Send an interactive quick-reply button message via WhatsApp Cloud API.
 * Falls back to sendText if buttons cannot be delivered or are empty.
 */
export async function sendInteractiveButtons(
  clinicId: string,
  to: string,
  body: string,
  buttons: WhatsAppButton[],
): Promise<SendResult> {
  if (!buttons || buttons.length === 0) {
    return sendText(clinicId, to, body);
  }

  console.log('\n🔘 [WHATSAPP] sendInteractiveButtons called | clinicId:', clinicId, '| to:', to);
  console.log('🔘 [WHATSAPP] buttons:', JSON.stringify(buttons));

  const credentials = await loadCredentials(clinicId);
  if (!credentials) {
    throw configurationError('WhatsApp is not configured for this clinic.');
  }

  const recipient = normalizePhone(to);
  if (!recipient) throw integrationError('Recipient phone number is invalid.');

  // Meta Cloud API allows max 3 reply buttons, title max 20 chars, id max 256 chars,
  // and strictly requires all button titles and IDs to be unique.
  const seenTitles = new Set<string>();
  const seenIds = new Set<string>();
  const formattedButtons: Array<{ type: 'reply'; reply: { id: string; title: string } }> = [];

  for (let idx = 0; idx < buttons.length && formattedButtons.length < 3; idx++) {
    const b = buttons[idx];
    if (!b) continue;
    let id = (b.id || `btn_${idx}`).trim().slice(0, 256);
    let title = (b.title || `Option ${idx + 1}`).trim().slice(0, 20);

    if (seenIds.has(id)) {
      id = `${id}_${idx}`.slice(0, 256);
    }

    if (seenTitles.has(title)) {
      const suffix = ` (${idx + 1})`;
      if (title.length + suffix.length <= 20) {
        title = `${title}${suffix}`;
      } else {
        title = `${title.slice(0, 20 - suffix.length)}${suffix}`;
      }
      if (seenTitles.has(title)) continue;
    }

    seenTitles.add(title);
    seenIds.add(id);
    formattedButtons.push({
      type: 'reply',
      reply: { id, title },
    });
  }

  if (formattedButtons.length === 0) {
    return sendText(clinicId, to, body);
  }

  const requestBody = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipient,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text: body.slice(0, 1024) },
      action: {
        buttons: formattedButtons,
      },
    },
  };

  console.log('🔘 [WHATSAPP] Sending interactive payload to Graph API:', JSON.stringify(requestBody));

  try {
    const response = await postToGraph(credentials, requestBody);
    const text = await response.text();
    console.log('🔘 [WHATSAPP] Interactive response status:', response.status, 'body:', text.slice(0, 300));

    if (!response.ok) {
      const metaError = extractMetaErrorMessage(response.status, text);
      console.warn(`⚠️ [WHATSAPP] Interactive message failed (${metaError}), falling back to text format`);
      const fallbackText = `${body}\n\n` + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
      return sendText(clinicId, to, fallbackText);
    }

    let externalId: string | null = null;
    try {
      const parsed = JSON.parse(text) as { messages?: Array<{ id?: string }> };
      externalId = parsed.messages?.[0]?.id ?? null;
    } catch {
      externalId = null;
    }

    logger.info(Events.WHATSAPP_SEND_SUCCESS, 'WhatsApp interactive message sent', { clinicId, externalId });
    return { externalId };
  } catch (error) {
    console.warn('⚠️ [WHATSAPP] Network error on interactive message, retrying with sendText fallback:', error);
    const fallbackText = `${body}\n\n` + buttons.map((b, i) => `${i + 1}. ${b.title}`).join('\n');
    return sendText(clinicId, to, fallbackText);
  }
}

/** Best-effort read receipt; failures are logged and swallowed. */
export async function markAsRead(clinicId: string, messageId: string): Promise<void> {
  const credentials = await loadCredentials(clinicId);
  if (!credentials) return;
  try {
    await postToGraph(credentials, {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });
  } catch {
    // Non-essential.
  }
}

/**
 * Send a read receipt AND typing indicator for an inbound message in one
 * credentials load. Uses a tight 4 s timeout so it never stalls the background
 * task — the main message processing runs in parallel and is never blocked.
 */
export async function sendReadAndTyping(
  clinicId: string,
  messageId: string,
): Promise<void> {
  const start = Date.now();
  const credentials = await loadCredentials(clinicId);
  if (!credentials) {
    console.warn('⚠️ [WHATSAPP] sendReadAndTyping: no credentials for clinic', clinicId);
    return;
  }

  // Use a tight 4s timeout specifically for these non-blocking indicator calls
  async function postQuick(payload: Record<string, unknown>): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4_000);
    try {
      await fetch(`${env.WHATSAPP_API_BASE_URL}/${credentials!.phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${credentials!.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch {
      // Swallow — non-essential
    } finally {
      clearTimeout(timer);
    }
  }

  try {
    // Step 1: Mark as read (double blue ticks on patient's screen)
    await postQuick({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    });

    // Step 2: Show typing bubble (patient sees "typing...")
    await postQuick({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: { type: 'text' },
    });

    console.log(`✅ [WHATSAPP] read + typing sent in ${Date.now() - start}ms`);
  } catch {
    // Non-essential — swallow silently
  }
}

/**
 * Send a typing indicator via WhatsApp Cloud API.
 *
 * Payload:
 * {
 *   "messaging_product": "whatsapp",
 *   "status": "read",
 *   "message_id": "<INBOUND_MESSAGE_ID>",
 *   "typing_indicator": {
 *     "type": "text"
 *   }
 * }
 *
 * Failures are non-fatal, logged with execution timing and swallowed.
 */
export async function sendTypingIndicator(
  clinicId: string,
  messageId: string,
): Promise<void> {
  const start = Date.now();
  console.log(`\n⏳ [WHATSAPP] sendTypingIndicator started | clinicId: ${clinicId} | messageId: ${messageId}`);
  logger.info(Events.WHATSAPP_TYPING_STARTED, 'Sending WhatsApp typing indicator', {
    clinicId,
    messageId,
  });

  try {
    const credentials = await loadCredentials(clinicId);
    if (!credentials) {
      const durationMs = Date.now() - start;
      console.warn('⚠️ [WHATSAPP] sendTypingIndicator skipped: no active credentials');
      logger.warn(Events.WHATSAPP_TYPING_FAILED, 'WhatsApp not configured for typing indicator', {
        clinicId,
        messageId,
        durationMs,
        reason: 'no_credentials',
      });
      return;
    }

    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
      typing_indicator: {
        type: 'text',
      },
    };

    const response = await postToGraph(credentials, payload);
    const durationMs = Date.now() - start;

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      console.warn(`⚠️ [WHATSAPP] typing indicator rejected (status: ${response.status}) in ${durationMs}ms:`, body.slice(0, 200));
      logger.warn(Events.WHATSAPP_TYPING_FAILED, 'WhatsApp rejected typing indicator', {
        clinicId,
        messageId,
        durationMs,
        status: response.status,
        body: body.slice(0, 300),
      });
      return;
    }

    console.log(`✅ [WHATSAPP] typing indicator sent successfully in ${durationMs}ms`);
    logger.info(Events.WHATSAPP_TYPING_SUCCESS, 'WhatsApp typing indicator sent', {
      clinicId,
      messageId,
      durationMs,
    });
  } catch (error) {
    const durationMs = Date.now() - start;
    console.warn(`⚠️ [WHATSAPP] typing indicator failed in ${durationMs}ms:`, error instanceof Error ? error.message : String(error));
    logger.error(Events.WHATSAPP_TYPING_FAILED, 'Failed to send WhatsApp typing indicator', {
      clinicId,
      messageId,
      durationMs,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

