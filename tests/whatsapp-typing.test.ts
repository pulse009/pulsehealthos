import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { sendTypingIndicator } from '@/lib/whatsapp/client';
import { processWebhookPayload, type WebhookPayload } from '@/lib/whatsapp/webhook';
import { logger, Events } from '@/lib/logger';
import { prisma, Prisma } from '@/lib/db/prisma';
import * as cryptoModule from '@/lib/crypto';
import * as clientModule from '@/lib/whatsapp/client';
import * as convService from '@/lib/conversations/conversation.service';

const originalFetch = global.fetch;

describe('WhatsApp Typing Indicator', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.systemLog, 'create').mockResolvedValue({} as any);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('1. Sends correct payload to Meta Cloud API /messages endpoint', async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    global.fetch = mockPost;

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      phoneNumberId: '10987654321',
      accessTokenCipher: 'cipher_123',
      isActive: true,
    } as any);
    vi.spyOn(cryptoModule, 'decryptOptional').mockReturnValue('EAAB_test_access_token_secret_123');

    const infoSpy = vi.spyOn(logger, 'info');

    await sendTypingIndicator('clinic-test-1', 'wamid.HBgLM123');

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [url, requestInit] = mockPost.mock.calls[0] as [string, RequestInit];
    expect(url).toContain('/10987654321/messages');
    expect(requestInit.method).toBe('POST');
    expect((requestInit.headers as Record<string, string>).Authorization).toBe('Bearer EAAB_test_access_token_secret_123');

    const parsedBody = JSON.parse(String(requestInit.body));
    expect(parsedBody).toEqual({
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: 'wamid.HBgLM123',
      typing_indicator: {
        type: 'text',
      },
    });

    expect(infoSpy).toHaveBeenCalledWith(
      Events.WHATSAPP_TYPING_STARTED,
      expect.any(String),
      expect.objectContaining({
        clinicId: 'clinic-test-1',
        messageId: 'wamid.HBgLM123',
      }),
    );
    expect(infoSpy).toHaveBeenCalledWith(
      Events.WHATSAPP_TYPING_SUCCESS,
      expect.any(String),
      expect.objectContaining({
        clinicId: 'clinic-test-1',
        messageId: 'wamid.HBgLM123',
        durationMs: expect.any(Number),
      }),
    );
  });

  it('2. Gracefully handles Meta API failure without throwing', async () => {
    const mockPost = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'Invalid wamid' } }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    global.fetch = mockPost;

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      phoneNumberId: '10987654321',
      accessTokenCipher: 'cipher_123',
      isActive: true,
    } as any);
    vi.spyOn(cryptoModule, 'decryptOptional').mockReturnValue('EAAB_test_access_token_secret_123');

    const warnSpy = vi.spyOn(logger, 'warn');

    await expect(sendTypingIndicator('clinic-test-1', 'wamid.invalid')).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      Events.WHATSAPP_TYPING_FAILED,
      expect.any(String),
      expect.objectContaining({
        clinicId: 'clinic-test-1',
        messageId: 'wamid.invalid',
        durationMs: expect.any(Number),
        status: 400,
      }),
    );
  });

  it('3. Gracefully handles network exceptions without throwing and logs failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network connection timeout'));

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      phoneNumberId: '10987654321',
      accessTokenCipher: 'cipher_123',
      isActive: true,
    } as any);
    vi.spyOn(cryptoModule, 'decryptOptional').mockReturnValue('EAAB_test_access_token_secret_123');

    const errorSpy = vi.spyOn(logger, 'error');

    await expect(sendTypingIndicator('clinic-test-1', 'wamid.network_error')).resolves.not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(
      Events.WHATSAPP_TYPING_FAILED,
      expect.any(String),
      expect.objectContaining({
        clinicId: 'clinic-test-1',
        messageId: 'wamid.network_error',
        durationMs: expect.any(Number),
        error: expect.stringContaining('Network connection timeout'),
      }),
    );
  });

  it('4. Handles unconfigured clinic without throwing', async () => {
    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue(null);
    const warnSpy = vi.spyOn(logger, 'warn');

    await expect(sendTypingIndicator('clinic-unconfigured', 'wamid.123')).resolves.not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(
      Events.WHATSAPP_TYPING_FAILED,
      expect.any(String),
      expect.objectContaining({
        clinicId: 'clinic-unconfigured',
        messageId: 'wamid.123',
        durationMs: expect.any(Number),
        reason: 'no_credentials',
      }),
    );
  });

  it('5. Inbound webhook message triggers typing indicator before reply', async () => {
    const typingSpy = vi.spyOn(clientModule, 'sendTypingIndicator').mockResolvedValue();

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      clinicId: 'clinic-1',
      isActive: true,
      clinic: { isActive: true },
    } as any);

    vi.spyOn(prisma.processedEvent, 'create').mockResolvedValue({} as any);
    vi.spyOn(convService, 'resolveContact').mockResolvedValue({
      patientId: 'patient-1',
      leadId: 'lead-1',
      conversationId: 'conversation-1',
      isNewPatient: false,
    });
    vi.spyOn(convService, 'recordInboundMessage').mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conversation-1',
      body: 'Hello! What are your opening hours?',
      externalId: 'wamid.test_inbound_123',
    } as any);
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conversation-1',
      aiEnabled: true,
      status: 'ACTIVE',
    } as any);
    vi.spyOn(convService, 'sendAndRecordOutbound').mockResolvedValue({ externalId: 'wamid.out.1' } as any);

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry_1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '10987654321' },
                contacts: [{ wa_id: '966500000000', profile: { name: 'Ahmad' } }],
                messages: [
                  {
                    id: 'wamid.test_inbound_123',
                    from: '966500000000',
                    type: 'text',
                    text: { body: 'Hello! What are your opening hours?' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const summary = await processWebhookPayload(payload);
    expect(summary.handled).toBe(1);
    expect(typingSpy).toHaveBeenCalledWith('clinic-1', 'wamid.test_inbound_123');
  });

  it('6. Does not send typing indicator for delivery status updates', async () => {
    const typingSpy = vi.spyOn(clientModule, 'sendTypingIndicator').mockResolvedValue();

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      clinicId: 'clinic-1',
      isActive: true,
      clinic: { isActive: true },
    } as any);
    vi.spyOn(prisma.message, 'updateMany').mockResolvedValue({ count: 1 });

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry_1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '10987654321' },
                statuses: [
                  {
                    id: 'wamid.outbound_status_123',
                    status: 'delivered',
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWebhookPayload(payload);
    expect(typingSpy).not.toHaveBeenCalled();
  });

  it('7. Does not send typing indicator for duplicate message webhook', async () => {
    const typingSpy = vi.spyOn(clientModule, 'sendTypingIndicator').mockResolvedValue();

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      clinicId: 'clinic-1',
      isActive: true,
      clinic: { isActive: true },
    } as any);

    // Duplicate message: claimEvent fails with PrismaClientKnownRequestError P2002
    vi.spyOn(prisma.processedEvent, 'create').mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '6.0.0',
        meta: { target: ['scope', 'key'] },
      }),
    );

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry_1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '10987654321' },
                messages: [
                  {
                    id: 'wamid.duplicate_msg_123',
                    from: '966500000000',
                    type: 'text',
                    text: { body: 'Hello again' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const summary = await processWebhookPayload(payload);
    expect(summary.duplicates).toBe(1);
    expect(typingSpy).not.toHaveBeenCalled();
  });

  it('8. Does not send typing indicator for escalated/human takeover conversations', async () => {
    const typingSpy = vi.spyOn(clientModule, 'sendTypingIndicator').mockResolvedValue();

    vi.spyOn(prisma.whatsAppIntegration, 'findUnique').mockResolvedValue({
      clinicId: 'clinic-1',
      isActive: true,
      clinic: { isActive: true },
    } as any);

    vi.spyOn(prisma.processedEvent, 'create').mockResolvedValue({} as any);
    vi.spyOn(convService, 'resolveContact').mockResolvedValue({
      patientId: 'patient-1',
      leadId: 'lead-1',
      conversationId: 'conversation-escalated-1',
      isNewPatient: false,
    });
    vi.spyOn(convService, 'recordInboundMessage').mockResolvedValue({
      id: 'msg-1',
      conversationId: 'conversation-escalated-1',
      body: 'I need human help',
      externalId: 'wamid.escalated_123',
    } as any);
    // Escalated conversation
    vi.spyOn(prisma.conversation, 'findUnique').mockResolvedValue({
      id: 'conversation-escalated-1',
      aiEnabled: true,
      status: 'ESCALATED',
    } as any);

    const payload: WebhookPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'entry_1',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '10987654321' },
                contacts: [{ wa_id: '966500000000', profile: { name: 'Ahmad' } }],
                messages: [
                  {
                    id: 'wamid.escalated_123',
                    from: '966500000000',
                    type: 'text',
                    text: { body: 'I need human help' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await processWebhookPayload(payload);
    expect(typingSpy).not.toHaveBeenCalled();
  });
});
