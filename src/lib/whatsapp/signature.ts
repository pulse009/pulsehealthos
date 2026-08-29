import 'server-only';
import { env } from '@/env';
import { hmacSha256Hex, safeEqual } from '@/lib/crypto';
import { logger } from '@/lib/logger';

/**
 * Webhook authenticity.
 *
 * Meta signs every webhook body with the app secret as
 * `X-Hub-Signature-256: sha256=<hex>`. The signature must be computed over the
 * *raw* request body — parsing and re-serialising changes byte-for-byte content
 * and will not verify.
 */

export interface SignatureCheck {
  valid: boolean;
  reason?: string;
}

export function verifyWebhookSignature(
  rawBody: string,
  headerValue: string | null,
  appSecret: string = env.WHATSAPP_APP_SECRET,
): SignatureCheck {
  if (!appSecret) {
    if (env.NODE_ENV === 'development') {
      return { valid: true };
    }
    return { valid: false, reason: 'app_secret_not_configured' };
  }
  if (!headerValue) {
    if (env.NODE_ENV === 'development') {
      return { valid: true };
    }
    return { valid: false, reason: 'missing_signature_header' };
  }

  const [algorithm, provided] = headerValue.split('=', 2);
  if (algorithm !== 'sha256' || !provided) {
    return { valid: false, reason: 'unsupported_signature_algorithm' };
  }

  const expected = hmacSha256Hex(appSecret, rawBody);
  const isMatch = safeEqual(expected, provided.toLowerCase());

  if (!isMatch && env.NODE_ENV === 'development') {
    logger.warn('whatsapp.signature.dev_bypass', 'Signature mismatch bypassed in development mode', {
      provided: provided.slice(0, 10) + '...',
    });
    return { valid: true };
  }

  return isMatch
    ? { valid: true }
    : { valid: false, reason: 'signature_mismatch' };
}

/**
 * Meta's subscription handshake: it calls the webhook URL with
 * `hub.mode=subscribe` and expects `hub.challenge` echoed back verbatim,
 * but only if `hub.verify_token` matches env.WHATSAPP_VERIFY_TOKEN.
 */
export function verifySubscription(params: URLSearchParams): string | null {
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) return null;
  if (!env.WHATSAPP_VERIFY_TOKEN) return null;
  return safeEqual(env.WHATSAPP_VERIFY_TOKEN, token) ? challenge : null;
}
