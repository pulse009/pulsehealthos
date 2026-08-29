import { prisma } from '@/lib/db/prisma';
import type { LogLevel } from '@prisma/client';

/**
 * Structured logging.
 *
 * Two sinks: stdout (always, JSON lines, picked up by the platform's log
 * aggregator) and the SystemLog table (for WARN/ERROR and explicitly durable
 * events, so operators can triage from the admin UI without shell access).
 *
 * Redaction is applied to every context object before either sink sees it.
 */

const REDACTED = '[redacted]';

/** Keys whose values must never appear in a log line, at any nesting depth. */
const SENSITIVE_KEY_PATTERN =
  /(password|passwordhash|secret|token|apikey|api_key|authorization|accesstoken|access_token|appsecret|verifytoken|cipher|encryptionkey|signature|cookie|session)/i;

export function redact(value: unknown, depth = 0): unknown {
  if (depth > 6) return '[depth-limit]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = SENSITIVE_KEY_PATTERN.test(k) ? REDACTED : redact(v, depth + 1);
    }
    return out;
  }
  return value;
}

export interface LogContext {
  clinicId?: string | null;
  [key: string]: unknown;
}

interface LogOptions {
  /** Also write a SystemLog row. Implied for WARN and ERROR. */
  persist?: boolean;
}

function writeStdout(level: LogLevel, event: string, message: string, context?: LogContext) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    message,
    ...(context ? { context: redact(context) } : {}),
  });
  if (level === 'ERROR') console.error(line);
  else if (level === 'WARN') console.warn(line);
  else console.log(line);
}

async function persistLog(level: LogLevel, event: string, message: string, context?: LogContext) {
  try {
    const { clinicId, ...rest } = context ?? {};
    await prisma.systemLog.create({
      data: {
        level,
        event,
        // Truncate so a runaway message cannot bloat the table.
        message: message.slice(0, 2_000),
        clinicId: clinicId ?? null,
        context: Object.keys(rest).length ? (redact(rest) as object) : undefined,
      },
    });
  } catch (err) {
    // Never let logging failures cascade into request failures.
    writeStdout('ERROR', 'logger.persist_failed', 'Failed to persist system log', {
      original: event,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

function log(level: LogLevel, event: string, message: string, context?: LogContext, opts?: LogOptions) {
  writeStdout(level, event, message, context);
  const shouldPersist = opts?.persist ?? (level === 'WARN' || level === 'ERROR');
  if (shouldPersist) {
    // Fire-and-forget: the caller's latency should not depend on the log sink.
    void persistLog(level, event, message, context);
  }
}

export const logger = {
  debug: (event: string, message: string, ctx?: LogContext, o?: LogOptions) =>
    log('DEBUG', event, message, ctx, o),
  info: (event: string, message: string, ctx?: LogContext, o?: LogOptions) =>
    log('INFO', event, message, ctx, o),
  warn: (event: string, message: string, ctx?: LogContext, o?: LogOptions) =>
    log('WARN', event, message, ctx, o),
  error: (event: string, message: string, ctx?: LogContext, o?: LogOptions) =>
    log('ERROR', event, message, ctx, o),
};

/** Canonical event names, so dashboards and alerts can key off stable strings. */
export const Events = {
  AUTH_LOGIN_SUCCESS: 'auth.login.success',
  AUTH_LOGIN_FAILED: 'auth.login.failed',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_LOCKED: 'auth.locked',

  WEBHOOK_RECEIVED: 'whatsapp.webhook.received',
  WEBHOOK_REJECTED: 'whatsapp.webhook.rejected',
  WEBHOOK_DUPLICATE: 'whatsapp.webhook.duplicate',
  WHATSAPP_TYPING_STARTED: 'whatsapp.typing.started',
  WHATSAPP_TYPING_SUCCESS: 'whatsapp.typing.success',
  WHATSAPP_TYPING_FAILED: 'whatsapp.typing.failed',
  WHATSAPP_SEND_STARTED: 'whatsapp.send.started',
  WHATSAPP_SEND_COMPLETED: 'whatsapp.send.completed',
  WHATSAPP_SEND_SUCCESS: 'whatsapp.send.success',
  WHATSAPP_SEND_FAILED: 'whatsapp.send.failed',

  ROUTER_COMPLETED: 'router.completed',

  AI_STARTED: 'ai.started',
  AI_COMPLETED: 'ai.completed',
  AI_REQUEST: 'ai.request',
  AI_RESPONSE: 'ai.response',
  TOOL_STARTED: 'ai.tool.started',
  TOOL_COMPLETED: 'ai.tool.completed',
  AI_TOOL_CALL: 'ai.tool.call',
  AI_TOOL_ERROR: 'ai.tool.error',
  AI_FAILED: 'ai.failed',
  AI_ESCALATED: 'ai.escalated',

  BOOKING_STARTED: 'booking.started',
  BOOKING_COMPLETED: 'booking.completed',
  APPOINTMENT_CREATED: 'appointment.created',
  APPOINTMENT_CONFLICT: 'appointment.conflict',
  APPOINTMENT_CANCELLED: 'appointment.cancelled',
  APPOINTMENT_RESCHEDULED: 'appointment.rescheduled',

  REMINDER_SCHEDULED: 'reminder.scheduled',
  REMINDER_SENT: 'reminder.sent',
  REMINDER_FAILED: 'reminder.failed',

  ADMIN_CHANGE: 'admin.change',
  RATE_LIMITED: 'security.rate_limited',
  TENANT_VIOLATION: 'security.tenant_violation',
} as const;
