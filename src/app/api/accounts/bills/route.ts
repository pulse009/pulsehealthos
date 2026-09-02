import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createSupplierBillSchema } from '@/lib/validation/accounts.schemas';
import { listSupplierBills, createSupplierBill } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    if (user.role === 'RECEPTIONIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supplierId = url.searchParams.get('supplierId');
    const status = url.searchParams.get('status');

    const bills = await listSupplierBills(scope, user.clinicId, {
      supplierId,
      status,
    });

    return NextResponse.json({ ok: true, bills });
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

    const body = await parseJson(request, createSupplierBillSchema);
    const bill = await createSupplierBill(scope, user.clinicId, body);

    return NextResponse.json({ ok: true, bill });
  } catch (error) {
    return errorResponse(error);
  }
}
