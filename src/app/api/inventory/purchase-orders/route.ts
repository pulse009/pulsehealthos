import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import {
  createPurchaseOrderSchema,
  updatePurchaseOrderStatusSchema,
} from '@/lib/validation/inventory.schemas';
import {
  listPurchaseOrders,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
} from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    const supplierId = url.searchParams.get('supplierId');
    const status = url.searchParams.get('status') as any;

    const purchaseOrders = await listPurchaseOrders(scope, user.clinicId, {
      supplierId,
      status,
    });
    return NextResponse.json({ ok: true, purchaseOrders });
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

    const body = await parseJson(request, createPurchaseOrderSchema);
    const purchaseOrder = await createPurchaseOrder(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, purchaseOrder });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    if (!body.id || !body.status) {
      return NextResponse.json({ error: 'Purchase Order ID and status required' }, { status: 400 });
    }

    const purchaseOrder = await updatePurchaseOrderStatus(scope, body.id, body.status, body.notes);
    return NextResponse.json({ ok: true, purchaseOrder });
  } catch (error) {
    return errorResponse(error);
  }
}
