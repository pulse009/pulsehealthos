import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { listStockMovements } from '@/lib/inventory/inventory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    const itemId = url.searchParams.get('itemId');
    const type = url.searchParams.get('type') as any;
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const movements = await listStockMovements(scope, user.clinicId, {
      itemId,
      type,
      limit,
    });
    return NextResponse.json({ ok: true, movements });
  } catch (error) {
    return errorResponse(error);
  }
}
