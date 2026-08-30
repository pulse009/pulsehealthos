import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import {
  createStaffRoleSchema,
  resetStaffPasswordSchema,
} from '@/lib/validation/schemas';
import {
  listClinicStaff,
  createClinicStaff,
  resetStaffPassword,
  deleteClinicStaff,
} from '@/lib/directory/directory.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');
    const staff = await listClinicStaff(scope, clinicId);
    return NextResponse.json({ ok: true, staff });
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
    const body = await parseJson(request, createStaffRoleSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const newStaff = await createClinicStaff(scope, clinicId, body);
    return NextResponse.json({ ok: true, staff: newStaff });
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
    const body = await parseJson(request, resetStaffPasswordSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    await resetStaffPassword(scope, clinicId, body.userId, body.password);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');
    if (!userId) {
      return NextResponse.json({ ok: false, error: 'User ID is required' }, { status: 400 });
    }
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    await deleteClinicStaff(scope, clinicId, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
