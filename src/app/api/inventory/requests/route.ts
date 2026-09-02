import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createItemRequestSchema } from '@/lib/validation/inventory.schemas';
import {
  listItemRequests,
  createItemRequest,
} from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    const status = url.searchParams.get('status') as any;
    const requestedById = url.searchParams.get('requestedById');

    const requests = await listItemRequests(scope, user.clinicId, {
      status,
      requestedById,
    });
    return NextResponse.json({ ok: true, requests });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    const body = await parseJson(request, createItemRequestSchema);
    const itemRequest = await createItemRequest(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, itemRequest });
  } catch (error) {
    return errorResponse(error);
  }
}
