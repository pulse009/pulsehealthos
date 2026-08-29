/**
 * Application error taxonomy.
 *
 * Every error that reaches an HTTP boundary is converted by `toErrorResponse`,
 * which guarantees that only `AppError` instances leak their message. Unknown
 * throwables collapse to a generic 500 so stack traces and driver internals
 * never reach a client.
 */

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'SLOT_UNAVAILABLE'
  | 'RATE_LIMITED'
  | 'INTEGRATION_ERROR'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SLOT_UNAVAILABLE: 409,
  RATE_LIMITED: 429,
  INTEGRATION_ERROR: 502,
  CONFIGURATION_ERROR: 500,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  /** Safe to serialise to the client. Never put secrets or SQL in here. */
  readonly details?: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
  }
}

export const badRequest = (m: string, d?: Record<string, unknown>) =>
  new AppError('BAD_REQUEST', m, d);
export const validationError = (m: string, d?: Record<string, unknown>) =>
  new AppError('VALIDATION_ERROR', m, d);
export const unauthenticated = (m = 'Authentication required.') =>
  new AppError('UNAUTHENTICATED', m);
export const forbidden = (m = 'You do not have access to this resource.') =>
  new AppError('FORBIDDEN', m);
export const notFound = (m = 'Resource not found.') => new AppError('NOT_FOUND', m);
export const conflict = (m: string, d?: Record<string, unknown>) => new AppError('CONFLICT', m, d);
export const slotUnavailable = (m: string, d?: Record<string, unknown>) =>
  new AppError('SLOT_UNAVAILABLE', m, d);
export const rateLimited = (m = 'Too many requests. Please slow down.') =>
  new AppError('RATE_LIMITED', m);
export const integrationError = (m: string, d?: Record<string, unknown>) =>
  new AppError('INTEGRATION_ERROR', m, d);
export const configurationError = (m: string, d?: Record<string, unknown>) =>
  new AppError('CONFIGURATION_ERROR', m, d);

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

export interface ErrorResponseBody {
  error: { code: ErrorCode; message: string; details?: Record<string, unknown> };
}

/**
 * Convert any throwable into a client-safe body + status.
 * Unknown errors are deliberately opaque.
 */
export function toErrorResponse(error: unknown): { status: number; body: ErrorResponseBody } {
  if (isAppError(error)) {
    return {
      status: error.status,
      body: {
        error: { code: error.code, message: error.message, ...(error.details && { details: error.details }) },
      },
    };
  }
  return {
    status: 500,
    body: {
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred.' },
    },
  };
}
