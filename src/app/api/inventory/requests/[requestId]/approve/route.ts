import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { approveItemRequest } from '@/lib/inventory/inventory.service';

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
    const itemRequest = await approveItemRequest(scope, requestId, user.id, body.notes);

    return NextResponse.json({ ok: true, itemRequest });
  } catch (error) {
    return errorResponse(error);
  }
}
