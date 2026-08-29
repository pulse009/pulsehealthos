import 'server-only';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
  createHmac,
} from 'node:crypto';
import { env } from '@/env';
import { configurationError } from '@/lib/errors';

/**
 * Symmetric encryption for integration credentials at rest (WhatsApp access
 * tokens, app secrets, verify tokens).
 *
 * Format: base64( 12-byte IV | 16-byte auth tag | ciphertext ), prefixed with a
 * version marker so the scheme can be rotated later without ambiguity.
 */

const VERSION = 'v1';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function key(): Buffer {
  const buf = Buffer.from(env.ENCRYPTION_KEY, 'base64');
  if (buf.length !== 32) {
    throw configurationError('ENCRYPTION_KEY must decode to exactly 32 bytes.');
  }
  return buf;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION}.${Buffer.concat([iv, tag, ciphertext]).toString('base64')}`;
}

export function decryptSecret(payload: string): string {
  const [version, encoded] = payload.split('.', 2);
  if (version !== VERSION || !encoded) {
    throw configurationError('Unrecognised ciphertext format.');
  }
  const raw = Buffer.from(encoded, 'base64');
  if (raw.length <= IV_LENGTH + TAG_LENGTH) {
    throw configurationError('Ciphertext is truncated.');
  }
  const iv = raw.subarray(0, IV_LENGTH);
  const tag = raw.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = raw.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv('aes-256-gcm', key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
}

/** Nullable convenience wrappers for optional integration fields. */
export const encryptOptional = (v: string | null | undefined): string | null =>
  v && v.length > 0 ? encryptSecret(v) : null;

export function decryptOptional(v: string | null | undefined): string | null {
  if (!v) return null;
  try {
    return decryptSecret(v);
  } catch {
    // A credential encrypted under a rotated key should degrade to "not
    // configured" rather than crash the webhook path.
    return null;
  }
}

/** Constant-time string comparison; safe against length-mismatched inputs. */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) {
    // Still perform a comparison so timing does not reveal the length relation.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** Lowercase hex HMAC-SHA256, as used by Meta's `X-Hub-Signature-256`. */
export function hmacSha256Hex(secret: string, payload: string | Buffer): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Opaque, URL-safe random token (e.g. for webhook verify tokens). */
export const generateToken = (bytes = 32): string => randomBytes(bytes).toString('base64url');
