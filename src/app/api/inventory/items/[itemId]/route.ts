import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { updateInventoryItemSchema } from '@/lib/validation/inventory.schemas';
import {
  getInventoryItemDetail,
  updateInventoryItem,
  deleteInventoryItem,
} from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { itemId } = await params;

    const item = await getInventoryItemDetail(scope, itemId);
    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { itemId } = await params;
    const body = await parseJson(request, updateInventoryItemSchema);
    const item = await updateInventoryItem(scope, itemId, body, user.id);

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { itemId } = await params;
    await deleteInventoryItem(scope, itemId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
