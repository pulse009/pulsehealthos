import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { rejectItemRequest } from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ requestId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { requestId } = await params;
    const body = await request.json().catch(() => ({}));
    const reason = body.reason || body.rejectionReason || 'Request rejected by clinic administrator.';

    const itemRequest = await rejectItemRequest(scope, requestId, user.id, reason);
    return NextResponse.json({ ok: true, itemRequest });
  } catch (error) {
    return errorResponse(error);
  }
}
