import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { appointmentTypeSchema } from '@/lib/validation/schemas';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound, forbidden } from '@/lib/errors';
import { resolveClinicId } from '@/lib/tenancy/scope';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const url = new URL(request.url);
    const requestedClinicId = url.searchParams.get('clinicId');
    const serviceId = url.searchParams.get('serviceId');
    const doctorId = url.searchParams.get('doctorId');

    const clinicId = scope.kind === 'PLATFORM'
      ? (requestedClinicId || undefined)
      : resolveClinicId(scope, requestedClinicId);

    const where: any = { isActive: true };
    if (clinicId) where.clinicId = clinicId;
    if (serviceId) where.serviceId = serviceId;
    if (doctorId) {
      where.OR = [{ doctorId: null }, { doctorId }];
    }

    const appointmentTypes = await prisma.appointmentType.findMany({
      where,
      orderBy: [{ serviceId: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        clinicId: true,
        serviceId: true,
        doctorId: true,
        name: true,
        durationMinutes: true,
        priceMinor: true,
        currency: true,
        description: true,
        isActive: true,
        service: { select: { id: true, name: true } },
        doctor: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ ok: true, appointmentTypes });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope, user } = await requireScope();
    const body = await parseJson(request, appointmentTypeSchema);

    const targetClinicId = scope.kind === 'PLATFORM'
      ? (body.clinicId || (user as any)?.clinicId)
      : resolveClinicId(scope, body.clinicId);

    if (!targetClinicId) {
      throw badRequest('Clinic ID is required.');
    }

    // Verify service belongs to clinic
    const service = await prisma.service.findFirst({
      where: { id: body.serviceId, clinicId: targetClinicId },
    });
    if (!service) {
      throw notFound('Selected service not found at this clinic.');
    }

    // If doctorId is provided, verify doctor belongs to clinic
    if (body.doctorId) {
      const doctor = await prisma.doctor.findFirst({
        where: { id: body.doctorId, clinicId: targetClinicId },
      });
      if (!doctor) {
        throw notFound('Selected doctor not found at this clinic.');
      }
    }

    const priceMinor = body.price !== undefined && body.price !== null
      ? Math.round(body.price * 100)
      : null;

    let appointmentType;
    if (body.id) {
      appointmentType = await prisma.appointmentType.update({
        where: { id: body.id },
        data: {
          name: body.name,
          serviceId: body.serviceId,
          doctorId: body.doctorId ?? null,
          durationMinutes: body.durationMinutes,
          priceMinor,
          currency: body.currency ?? 'SAR',
          description: body.description ?? null,
          isActive: body.isActive,
        },
      });
    } else {
      appointmentType = await prisma.appointmentType.create({
        data: {
          clinicId: targetClinicId,
          serviceId: body.serviceId,
          doctorId: body.doctorId ?? null,
          name: body.name,
          durationMinutes: body.durationMinutes,
          priceMinor,
          currency: body.currency ?? 'SAR',
          description: body.description ?? null,
          isActive: body.isActive,
        },
      });
    }

    return NextResponse.json({ ok: true, appointmentType });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch {
        // no body
      }
    }

    if (!id) throw badRequest('Appointment type ID is required.');

    const existing = await prisma.appointmentType.findUnique({
      where: { id },
      select: { id: true, clinicId: true },
    });
    if (!existing) throw notFound('Appointment type not found.');

    if (scope.kind !== 'PLATFORM' && scope.clinicId !== existing.clinicId) {
      throw forbidden('Cannot delete appointment type for another clinic.');
    }

    await prisma.appointmentType.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return errorResponse(error);
  }
}
