import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { createInvoiceSchema } from '@/lib/validation/accounts.schemas';
import { listInvoices, createInvoice } from '@/lib/accounts/accounts.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    const url = new URL(request.url);

    const status = url.searchParams.get('status') || undefined;
    const patientId = url.searchParams.get('patientId') || undefined;
    const doctorId = url.searchParams.get('doctorId') || undefined;
    const search = url.searchParams.get('search') || undefined;

    const invoices = await listInvoices(scope, user.clinicId, {
      status,
      patientId,
      doctorId,
      search,
    });

    return NextResponse.json({ ok: true, invoices });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();

    const body = await parseJson(request, createInvoiceSchema);
    const invoice = await createInvoice(scope, user.clinicId, body, user.id);

    return NextResponse.json({ ok: true, invoice });
  } catch (error) {
    return errorResponse(error);
  }
}
