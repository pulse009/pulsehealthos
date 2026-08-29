import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, errorResponse } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import {
  cancelAppointment,
  getAppointment,
  rescheduleAppointment,
} from '@/lib/booking/booking.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-read', RateLimits.API_READ);
    const { scope } = await requireScope();
    const { id } = await context.params;
    return NextResponse.json({ appointment: await getAppointment(scope, id) });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Permanently Delete appointment from database. */
export async function DELETE(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope, user } = await requireScope();
    const { id } = await context.params;

    const targetClinicId =
      user.role === 'SUPER_ADMIN'
        ? undefined
        : user.clinicId || (scope.kind === 'CLINIC' ? scope.clinicId : undefined);

    const whereClause: any = { id };
    if (targetClinicId) {
      whereClause.clinicId = targetClinicId;
    }

    const targetAppointment = await prisma.appointment.findFirst({
      where: whereClause,
      select: { id: true, clinicId: true },
    });

    if (!targetAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Perform permanent deletion inside interactive transaction
    await prisma.$transaction(
      async (tx) => {
        // 1. Delete reminders
        await tx.reminder.deleteMany({
          where: { appointmentId: targetAppointment.id },
        });

        // 2. Unlink any appointment that was rescheduled from this appointment
        await tx.appointment.updateMany({
          where: { rescheduledFromId: targetAppointment.id },
          data: { rescheduledFromId: null },
        });

        // 3. Permanently delete the appointment
        await tx.appointment.delete({
          where: { id: targetAppointment.id },
        });
      },
      { maxWait: 15000, timeout: 30000 },
    );

    return NextResponse.json({ ok: true, deletedId: targetAppointment.id });
  } catch (error) {
    return errorResponse(error);
  }
}

/** Update status or Reschedule. */
export async function PATCH(request: Request, context: Context) {
  try {
    limitByIp(request, 'api-write', RateLimits.API_WRITE);
    const { scope } = await requireScope();
    const { id } = await context.params;
    const body = await request.json();

    // 1. Direct status update
    if (body.status) {
      const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'RESCHEDULED', 'COMPLETED', 'NO_SHOW'];
      const targetStatus = body.status.toUpperCase();
      if (!validStatuses.includes(targetStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      const whereClause = scope.kind === 'CLINIC' ? { id, clinicId: scope.clinicId } : { id };
      const updated = await prisma.appointment.update({
        where: whereClause,
        data: { status: targetStatus as any },
      });
      return NextResponse.json({ ok: true, appointment: updated });
    }

    // 2. Reschedule request
    if (body.newStartsAt) {
      const result = await rescheduleAppointment(scope, {
        appointmentId: id,
        newStartsAt: body.newStartsAt,
        newDoctorId: body.newDoctorId ?? undefined,
        reason: body.reason,
        enforcePolicy: false,
      });

      if (!result.ok) {
        return NextResponse.json(
          {
            error: {
              code: 'SLOT_UNAVAILABLE',
              message: result.message,
              details: { reason: result.reason },
            },
            alternatives: result.alternatives.map((s) => ({
              slotToken: s.slotToken,
              startsAt: s.start.toISOString(),
              doctorName: s.doctorName,
            })),
          },
          { status: 409 },
        );
      }

      return NextResponse.json({ ok: true, appointment: result.appointment });
    }

    return NextResponse.json({ error: 'No valid update provided' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}
