import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { recordPaymentSchema } from '@/lib/validation/accounts.schemas';
import { recordInvoicePayment } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    const { invoiceId } = await params;

    const body = await parseJson(request, recordPaymentSchema);
    const result = await recordInvoicePayment(scope, invoiceId, body, user.id);

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return errorResponse(error);
  }
}
