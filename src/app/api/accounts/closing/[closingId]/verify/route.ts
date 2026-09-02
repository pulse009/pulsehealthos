import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { verifyDayEndClosingSchema } from '@/lib/validation/accounts.schemas';
import { verifyDayEndClosing } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ closingId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { closingId } = await params;
    const body = await parseJson(request, verifyDayEndClosingSchema);
    const closing = await verifyDayEndClosing(scope, closingId, user.id, body.notes || undefined);

    return NextResponse.json({ ok: true, closing });
  } catch (error) {
    return errorResponse(error);
  }
}
