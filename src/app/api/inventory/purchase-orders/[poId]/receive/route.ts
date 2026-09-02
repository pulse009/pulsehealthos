import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { receivePurchaseOrderSchema } from '@/lib/validation/inventory.schemas';
import { receivePurchaseOrderGoods } from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ poId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { poId } = await params;
    const body = await parseJson(request, receivePurchaseOrderSchema);
    const purchaseOrder = await receivePurchaseOrderGoods(scope, poId, body, user.id);

    return NextResponse.json({ ok: true, purchaseOrder });
  } catch (error) {
    return errorResponse(error);
  }
}
