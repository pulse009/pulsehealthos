import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { logger, Events } from '@/lib/logger';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, withErrorHandling } from '@/lib/api/handler';
import { verifySubscription, verifyWebhookSignature } from '@/lib/whatsapp/signature';
import { processWebhookPayload, webhookPayloadSchema } from '@/lib/whatsapp/webhook';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Meta's subscription handshake. */
export const GET = withErrorHandling(async (request: Request) => {
  const url = new URL(request.url);
  const challenge = await verifySubscription(url.searchParams);

  if (!challenge) {
    logger.warn(Events.WEBHOOK_REJECTED, 'Webhook verification failed', {
      mode: url.searchParams.get('hub.mode'),
      verifyToken: url.searchParams.get('hub.verify_token'),
    });
    return new NextResponse('Forbidden', { status: 403 });
  }

  return new NextResponse(challenge, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });
});

export const POST = withErrorHandling(async (request: Request) => {
  console.log('\n\n🔵 ============================================================');
  console.log('🔵 [WEBHOOK] Incoming POST at', new Date().toISOString());
  console.log('🔵 ============================================================');

  limitByIp(request, 'webhook', RateLimits.WEBHOOK);

  const rawBody = await request.text();
  console.log('🔵 [WEBHOOK] Raw body length:', rawBody.length, 'bytes');
  console.log('🔵 [WEBHOOK] Raw body preview:', rawBody.slice(0, 300));

  const signatureHeader = request.headers.get('x-hub-signature-256');
  console.log('🔵 [WEBHOOK] x-hub-signature-256 header:', signatureHeader ?? 'MISSING');

  const signature = await verifyWebhookSignature(rawBody, signatureHeader);
  console.log('🔵 [WEBHOOK] Signature valid:', signature.valid, signature.reason ?? '');

  if (!signature.valid) {
    logger.warn(Events.WEBHOOK_REJECTED, 'Rejected webhook with invalid signature', {
      reason: signature.reason,
    });
    console.log('🔴 [WEBHOOK] REJECTED — invalid signature. Reason:', signature.reason);
    return new NextResponse('Forbidden', { status: 403 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
    console.log('🔵 [WEBHOOK] Parsed JSON payload:', JSON.stringify(payload, null, 2));
  } catch {
    logger.warn(Events.WEBHOOK_REJECTED, 'Webhook body was not valid JSON');
    console.log('🔴 [WEBHOOK] REJECTED — body is not valid JSON');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const parsed = webhookPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    console.log('🔴 [WEBHOOK] REJECTED — schema validation failed:', JSON.stringify(parsed.error.issues));
    logger.warn(Events.WEBHOOK_REJECTED, 'Webhook payload did not match expected shape', {
      issues: parsed.error.issues.slice(0, 5).map((i) => i.path.join('.')),
    });
    return NextResponse.json({ received: true }, { status: 200 });
  }

  console.log('✅ [WEBHOOK] Schema valid. Entries count:', parsed.data.entry?.length ?? 0);
  logger.info(Events.WEBHOOK_RECEIVED, 'WhatsApp webhook received', {
    entries: parsed.data.entry?.length ?? 0,
  });

  // Respond to Meta immediately, process in background to avoid 20s timeout
  after(async () => {
    console.log('\n🟡 [BACKGROUND] Starting background processing at', new Date().toISOString());
    try {
      const summary = await processWebhookPayload(parsed.data);
      console.log('✅ [BACKGROUND] Processing complete:', JSON.stringify(summary));
    } catch (error) {
      console.log('🔴 [BACKGROUND] Processing threw:', error instanceof Error ? error.message : String(error));
      console.error('🔴 [BACKGROUND] Full error:', error);
      logger.error(Events.WEBHOOK_REJECTED, 'Webhook processing threw', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
    console.log('🟡 [BACKGROUND] Background task finished at', new Date().toISOString());
  });

  console.log('✅ [WEBHOOK] Returning 200 OK to Meta immediately');
  return NextResponse.json({ received: true }, { status: 200 });
});
