import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { serviceSchema } from '@/lib/validation/schemas';
import { listServices, saveService } from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : undefined;
    const services = await listServices(scope, clinicId);
    return NextResponse.json({ ok: true, services });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const body = await parseJson(request, serviceSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const service = await saveService(scope, clinicId, body);
    return NextResponse.json({ ok: true, service });
  } catch (error) {
    return errorResponse(error);
  }
}
