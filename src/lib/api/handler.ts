import 'server-only';
import { NextResponse } from 'next/server';
import { ZodError, type ZodTypeAny, type z } from 'zod';
import { AppError, toErrorResponse, validationError, rateLimited } from '@/lib/errors';
import { logger } from '@/lib/logger';
import { clientIp, enforce } from '@/lib/rate-limit';

/**
 * Shared plumbing for route handlers.
 *
 * The important guarantee: no unhandled throwable reaches the client. Anything
 * that is not an `AppError` becomes a generic 500 with no message, no stack and
 * no driver detail, while the real error is logged server-side with a
 * correlation id the operator can search for.
 */

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function errorResponse(error: unknown, requestId?: string): NextResponse {
  const { status, body } = toErrorResponse(error);

  if (!(error instanceof AppError)) {
    logger.error('api.unhandled', 'Unhandled error in route handler', {
      requestId,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack?.slice(0, 2_000) : undefined,
    });
  }

  return NextResponse.json(body, {
    status,
    headers: requestId ? { 'x-request-id': requestId } : undefined,
  });
}

/** Wrap a handler so every failure path is normalised. */
export function withErrorHandling(
  handler: (request: Request) => Promise<NextResponse>,
): (request: Request) => Promise<NextResponse> {
  return async (request: Request) => {
    const requestId = crypto.randomUUID();
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ZodError) {
        const issueMessages = error.issues
          .map((i) => `${i.path.length > 0 ? `${i.path.join('.')}: ` : ''}${i.message}`)
          .join(', ');
        return errorResponse(
          validationError(`Invalid payload: ${issueMessages}`, {
            issues: error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
          }),
          requestId,
        );
      }
      return errorResponse(error, requestId);
    }
  };
}

/** Parse and validate a JSON body. */
export async function parseJson<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    throw validationError('Request body must be valid JSON.');
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const issueMessages = parsed.error.issues
      .map((i) => `${i.path.length > 0 ? `${i.path.join('.')}: ` : ''}${i.message}`)
      .join(', ');
    throw validationError(`Invalid payload: ${issueMessages}`, {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return parsed.data;
}

/** Parse and validate query-string parameters. */
export function parseQuery<TSchema extends ZodTypeAny>(
  request: Request,
  schema: TSchema,
): z.infer<TSchema> {
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const parsed = schema.safeParse(params);
  if (!parsed.success) {
    throw validationError('The query parameters are invalid.', {
      issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }
  return parsed.data;
}

/** Apply a rate-limit policy keyed on caller IP; throws 429 when exceeded. */
export function limitByIp(
  request: Request,
  bucket: string,
  policy: { limit: number; windowSeconds: number },
): void {
  const ip = clientIp(request.headers);
  const result = enforce(`${bucket}:${ip}`, policy, { path: new URL(request.url).pathname });
  if (!result.allowed) throw rateLimited();
}
