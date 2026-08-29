import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { leadUpdateSchema } from '@/lib/validation/schemas';
import { requireScope } from '@/lib/auth/guards';
import { getLead, updateLead } from '@/lib/leads/lead.service';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { id } = await context.params;
    const lead = await getLead(scope, id);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;
    const body = await parseJson(request, leadUpdateSchema);
    const lead = await updateLead(scope, id, body);
    return NextResponse.json({ ok: true, lead });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;

    const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };
    await prisma.lead.delete({
      where: whereClause,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
