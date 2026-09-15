import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { forbidden } from '@/lib/errors';
import { resetDoctorPassword } from '@/lib/directory/directory.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const resetDoctorPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long').max(200),
});

type Context = { params: Promise<{ doctorId: string }> };

export async function POST(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { user, scope } = await requireScope();
    if (user.role !== 'CLIENT' && user.role !== 'SUPER_ADMIN' && user.role !== 'MANAGER') {
      throw forbidden('Only clinic administrators and managers can reset doctor passwords.');
    }
    const { doctorId } = await context.params;
    const body = await parseJson(request, resetDoctorPasswordSchema);
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : (request.headers.get('x-clinic-id') || '');

    const result = await resetDoctorPassword(scope, clinicId, doctorId, body.password);
    return NextResponse.json({
      ok: true,
      message: 'Doctor password reset successfully.',
      username: result.username,
      email: result.email,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
