import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { inventoryItemSchema } from '@/lib/validation/inventory.schemas';
import { listInventoryItems, createInventoryItem } from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    const categoryId = url.searchParams.get('categoryId');
    const supplierId = url.searchParams.get('supplierId');
    const status = url.searchParams.get('status') as any;
    const search = url.searchParams.get('search');
    const activeOnly = url.searchParams.get('activeOnly');

    const items = await listInventoryItems(scope, user.clinicId, {
      categoryId,
      supplierId,
      status,
      search,
      isActive: activeOnly === 'true' ? true : undefined,
    });

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await parseJson(request, inventoryItemSchema);
    const item = await createInventoryItem(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, item });
  } catch (error) {
    return errorResponse(error);
  }
}
