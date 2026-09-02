import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { getInvoiceDetail } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { invoiceId } = await params;

    const invoice = await getInvoiceDetail(scope, invoiceId);
    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    return errorResponse(error);
  }
}
