import 'server-only';
import { env } from '@/env';
import { prisma } from '@/lib/db/prisma';
import { hmacSha256Hex, safeEqual, decryptSecret } from '@/lib/crypto';
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

/**
 * Verify webhook signature using the clinic App Secret stored in the database.
 */
export async function verifyWebhookSignature(
  rawBody: string,
  headerValue: string | null,
  appSecretOverride?: string,
): Promise<SignatureCheck> {
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

  const cleanProvided = provided.toLowerCase();

  // If a specific override secret is passed (e.g. in tests)
  if (appSecretOverride !== undefined) {
    if (!appSecretOverride) {
      return { valid: false, reason: 'app_secret_not_configured' };
    }
    const expected = hmacSha256Hex(appSecretOverride, rawBody);
    return safeEqual(expected, cleanProvided)
      ? { valid: true }
      : { valid: false, reason: 'signature_mismatch' };
  }

  // 1. Primary: Check all App Secrets stored in database by Master Admin
  try {
    const integrations = await prisma.whatsAppIntegration.findMany({
      where: { appSecretCipher: { not: null } },
      select: { appSecretCipher: true, clinicId: true },
    });

    for (const integ of integrations) {
      if (integ.appSecretCipher) {
        try {
          const decryptedSecret = decryptSecret(integ.appSecretCipher);
          if (decryptedSecret) {
            const expected = hmacSha256Hex(decryptedSecret, rawBody);
            if (safeEqual(expected, cleanProvided)) {
              return { valid: true };
            }
          }
        } catch (decryptErr) {
          logger.warn('whatsapp.signature.decrypt_error', 'Failed to decrypt app secret', {
            clinicId: integ.clinicId,
          });
        }
      }
    }
  } catch (dbErr) {
    logger.warn('whatsapp.signature.db_error', 'Failed to query app secrets from DB', {
      error: String(dbErr),
    });
  }

  // 2. Secondary fallback: check env.WHATSAPP_APP_SECRET if present
  if (env.WHATSAPP_APP_SECRET) {
    const expected = hmacSha256Hex(env.WHATSAPP_APP_SECRET, rawBody);
    if (safeEqual(expected, cleanProvided)) {
      return { valid: true };
    }
  }

  if (env.NODE_ENV === 'development') {
    logger.warn('whatsapp.signature.dev_bypass', 'Signature mismatch bypassed in development mode', {
      provided: cleanProvided.slice(0, 10) + '...',
    });
    return { valid: true };
  }

  return { valid: false, reason: 'signature_mismatch' };
}

/**
 * Meta's subscription handshake: Meta calls the webhook URL with
 * `hub.mode=subscribe` and expects `hub.challenge` echoed back verbatim,
 * if `hub.verify_token` matches the Verify Token stored in the database for that clinic.
 */
export async function verifySubscription(params: URLSearchParams): Promise<string | null> {
  const mode = params.get('hub.mode');
  const token = params.get('hub.verify_token');
  const challenge = params.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) return null;

  // 1. Primary: Check Verify Token stored in database by Master Admin
  try {
    const integrations = await prisma.whatsAppIntegration.findMany({
      where: { verifyTokenCipher: { not: null } },
      select: { verifyTokenCipher: true, clinicId: true },
    });

    for (const integ of integrations) {
      if (integ.verifyTokenCipher) {
        try {
          const decrypted = decryptSecret(integ.verifyTokenCipher);
          if (decrypted && safeEqual(decrypted, token)) {
            logger.info('whatsapp.verify.success', 'Verified webhook token from database for clinic', {
              clinicId: integ.clinicId,
            });
            return challenge;
          }
        } catch (decryptErr) {
          logger.warn('whatsapp.verify.decrypt_error', 'Failed to decrypt verify token', {
            clinicId: integ.clinicId,
          });
        }
      }
    }
  } catch (dbErr) {
    logger.warn('whatsapp.verify.db_error', 'Failed to query verify tokens from DB', {
      error: String(dbErr),
    });
  }

  // 2. Secondary fallback: Check global env.WHATSAPP_VERIFY_TOKEN if set
  if (env.WHATSAPP_VERIFY_TOKEN && safeEqual(env.WHATSAPP_VERIFY_TOKEN, token)) {
    return challenge;
  }

  return null;
}
