import { afterEach, describe, expect, it, vi } from 'vitest';
import { decryptOptional, decryptSecret, encryptSecret, hmacSha256Hex, safeEqual } from '@/lib/crypto';
import { verifyWebhookSignature } from '@/lib/whatsapp/signature';
import { redact } from '@/lib/logger';
import { __resetRateLimits, rateLimit } from '@/lib/rate-limit';
import { toErrorResponse, AppError, notFound } from '@/lib/errors';
import { webhookPayloadSchema } from '@/lib/whatsapp/webhook';
import { isSlotConflictError, Prisma } from '@/lib/db/prisma';

describe('secret encryption', () => {
  it('round-trips a value', () => {
    const plaintext = 'EAAG-super-secret-access-token';
    expect(decryptSecret(encryptSecret(plaintext))).toBe(plaintext);
  });

  it('produces different ciphertext each time (random IV)', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'));
  });

  it('rejects tampered ciphertext rather than returning garbage', () => {
    const payload = encryptSecret('sensitive');
    // Flip a character in the body; GCM authentication must catch it.
    const [version, body] = payload.split('.', 2);
    const flipped = `${version}.${body!.slice(0, -2)}${body!.slice(-2) === 'AA' ? 'BB' : 'AA'}`;
    expect(() => decryptSecret(flipped)).toThrow();
  });

  it('degrades to null rather than throwing on an undecryptable value', () => {
    // A credential encrypted under a rotated key must read as "not configured",
    // not crash the webhook path.
    expect(decryptOptional('v1.bm90LXJlYWxseS1jaXBoZXJ0ZXh0')).toBeNull();
    expect(decryptOptional(null)).toBeNull();
  });
});

describe('constant-time comparison', () => {
  it('matches identical strings', () => {
    expect(safeEqual('abc123', 'abc123')).toBe(true);
  });

  it('rejects different strings, including different lengths', () => {
    expect(safeEqual('abc123', 'abc124')).toBe(false);
    expect(safeEqual('short', 'much-longer-value')).toBe(false);
    expect(safeEqual('', 'x')).toBe(false);
  });
});

describe('webhook signature verification', () => {
  const secret = 'meta-app-secret';
  const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const valid = `sha256=${hmacSha256Hex(secret, body)}`;

  it('accepts a correctly signed body', () => {
    expect(verifyWebhookSignature(body, valid, secret).valid).toBe(true);
  });

  it('rejects a body that has been modified after signing', () => {
    expect(verifyWebhookSignature(`${body} `, valid, secret).valid).toBe(false);
  });

  it('rejects a signature made with a different secret', () => {
    const forged = `sha256=${hmacSha256Hex('wrong-secret', body)}`;
    expect(verifyWebhookSignature(body, forged, secret).valid).toBe(false);
  });

  it('rejects a missing header', () => {
    const result = verifyWebhookSignature(body, null, secret);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('missing_signature_header');
  });

  it('rejects an unsupported algorithm prefix', () => {
    expect(verifyWebhookSignature(body, `sha1=${hmacSha256Hex(secret, body)}`, secret).valid).toBe(
      false,
    );
  });

  it('fails closed when no app secret is configured', () => {
    // An unset secret must never be read as "every signature is valid".
    const result = verifyWebhookSignature(body, valid, '');
    expect(result.valid).toBe(false);
    expect(result.reason).toBe('app_secret_not_configured');
  });
});

describe('log redaction', () => {
  it('removes secret-shaped keys at any depth', () => {
    const redacted = redact({
      clinicId: 'clinic-1',
      accessToken: 'EAAG-secret',
      nested: { appSecret: 'shh', apiKey: 'k', safe: 'visible' },
      list: [{ password: 'hunter2' }],
    }) as Record<string, unknown>;

    expect(JSON.stringify(redacted)).not.toContain('EAAG-secret');
    expect(JSON.stringify(redacted)).not.toContain('hunter2');
    expect(JSON.stringify(redacted)).not.toContain('shh');
    expect(redacted.clinicId).toBe('clinic-1');
    expect((redacted.nested as Record<string, unknown>).safe).toBe('visible');
  });

  it('does not recurse without bound on a cyclic structure', () => {
    const cyclic: Record<string, unknown> = { name: 'x' };
    cyclic.self = cyclic;
    expect(() => redact(cyclic)).not.toThrow();
  });
});

describe('error sanitisation', () => {
  it('passes through an AppError message', () => {
    const { status, body } = toErrorResponse(notFound('Appointment not found.'));
    expect(status).toBe(404);
    expect(body.error.message).toBe('Appointment not found.');
  });

  it('never leaks an unexpected error message or stack to the client', () => {
    const leaky = new Error('connect ECONNREFUSED 10.0.0.5:5432 — password=hunter2');
    const { status, body } = toErrorResponse(leaky);
    expect(status).toBe(500);
    expect(body.error.message).toBe('An unexpected error occurred.');
    expect(JSON.stringify(body)).not.toContain('hunter2');
    expect(JSON.stringify(body)).not.toContain('ECONNREFUSED');
  });

  it('maps a slot conflict to 409', () => {
    expect(toErrorResponse(new AppError('SLOT_UNAVAILABLE', 'Taken.')).status).toBe(409);
  });
});

describe('rate limiting', () => {
  afterEach(() => {
    __resetRateLimits();
    vi.useRealTimers();
  });

  it('allows up to the limit then blocks', () => {
    for (let i = 0; i < 5; i += 1) {
      expect(rateLimit('key', 5, 60).allowed).toBe(true);
    }
    const blocked = rateLimit('key', 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('keeps separate counters per key', () => {
    rateLimit('a', 1, 60);
    expect(rateLimit('a', 1, 60).allowed).toBe(false);
    expect(rateLimit('b', 1, 60).allowed).toBe(true);
  });

  it('resets after the window elapses', () => {
    vi.useFakeTimers();
    rateLimit('windowed', 1, 60);
    expect(rateLimit('windowed', 1, 60).allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rateLimit('windowed', 1, 60).allowed).toBe(true);
  });
});

describe('database error classification', () => {
  /**
   * Regression guard. Prisma reports an exclusion-constraint violation as
   * `PrismaClientUnknownRequestError` with no structured code — the SQLSTATE
   * only appears inside the message. Before this was handled, a genuine
   * double-booking race surfaced as a 500 instead of a graceful "that slot has
   * just gone, here are some alternatives".
   */
  const exclusionViolation = new Prisma.PrismaClientUnknownRequestError(
    'Invalid `tx.appointment.create()` invocation\n' +
      'Error occurred during query execution:\n' +
      'ConnectorError(ConnectorError { kind: QueryError(PostgresError { code: "23P01", ' +
      'message: "conflicting key value violates exclusion constraint ' +
      '\\"Appointment_no_overlap_per_doctor\\"", severity: "ERROR" }) })',
    { clientVersion: '6.0.0' },
  );

  it('recognises an exclusion-constraint violation as a slot conflict', () => {
    expect(isSlotConflictError(exclusionViolation)).toBe(true);
  });

  it('recognises a unique violation on the booking index', () => {
    const uniqueViolation = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on Appointment_doctor_start_active_key',
      { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['doctorId', 'startsAt'] } },
    );
    expect(isSlotConflictError(uniqueViolation)).toBe(true);
  });

  it('does not mistake an unrelated unique violation for a slot conflict', () => {
    // A duplicate idempotency key must take the de-duplication path, not the
    // "someone took your slot" path.
    const idempotencyClash = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed on the fields: (`idempotencyKey`)',
      { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['idempotencyKey'] } },
    );
    expect(isSlotConflictError(idempotencyClash)).toBe(false);
  });

  it('does not treat an ordinary error as a slot conflict', () => {
    expect(isSlotConflictError(new Error('connection reset'))).toBe(false);
    expect(isSlotConflictError(null)).toBe(false);
  });
});

describe('webhook payload parsing', () => {
  it('accepts a realistic Cloud API message payload', () => {
    const parsed = webhookPayloadSchema.safeParse({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '1234',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { phone_number_id: '5555', display_phone_number: '+44...' },
                contacts: [{ wa_id: '447700900000', profile: { name: 'Sam' } }],
                messages: [
                  {
                    id: 'wamid.ABC',
                    from: '447700900000',
                    timestamp: '1770000000',
                    type: 'text',
                    text: { body: 'Can I book for tomorrow?' },
                  },
                ],
              },
            },
          ],
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('tolerates unknown fields rather than dropping the delivery', () => {
    const parsed = webhookPayloadSchema.safeParse({
      object: 'whatsapp_business_account',
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: '5555' },
                some_future_field: { anything: true },
                messages: [{ id: 'wamid.X', from: '4477', type: 'text', text: { body: 'hi' } }],
              },
            },
          ],
        },
      ],
    });
    expect(parsed.success).toBe(true);
  });

  it('rejects a payload missing required message fields', () => {
    const parsed = webhookPayloadSchema.safeParse({
      entry: [{ changes: [{ value: { messages: [{ from: '4477' }] } }] }],
    });
    expect(parsed.success).toBe(false);
  });
});
