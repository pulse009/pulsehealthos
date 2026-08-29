import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, parseQuery, withErrorHandling } from '@/lib/api/handler';
import { appointmentListSchema, createAppointmentSchema } from '@/lib/validation/schemas';
import { requireScope } from '@/lib/auth/guards';
import { createAppointment } from '@/lib/booking/booking.service';
import { listAppointments } from '@/lib/leads/lead.service';
import { prisma } from '@/lib/db/prisma';
import { badRequest } from '@/lib/errors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-read', RateLimits.API_READ);
  const { scope } = await requireScope();
  const query = parseQuery(request, appointmentListSchema);
  return NextResponse.json(await listAppointments(scope, query));
});

/**
 * Manual booking by an operator or clinic staff.
 *
 * Goes through exactly the same engine as the AI path, so a portal/admin booking
 * is subject to the same availability rules and conflict prevention.
 */
export const POST = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-write', RateLimits.API_WRITE);

  const { user, scope } = await requireScope();
  const input = await parseJson(request, createAppointmentSchema);

  const targetClinicId = user.role === 'CLIENT' ? user.clinicId! : (input.clinicId || user.clinicId!);
  if (!targetClinicId) {
    throw badRequest('Clinic ID is required.');
  }

  let resolvedPatientId = input.patientId;
  if (!resolvedPatientId && input.patientPhone) {
    const cleanPhone = input.patientPhone.trim();
    let patient = await prisma.patient.findFirst({
      where: { clinicId: targetClinicId, phone: cleanPhone },
    });
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          clinicId: targetClinicId,
          name: input.patientName?.trim() || 'Patient',
          phone: cleanPhone,
        },
      });
    } else if (input.patientName?.trim() && (!patient.name || patient.name === 'Patient')) {
      await prisma.patient.update({
        where: { id: patient.id },
        data: { name: input.patientName.trim() },
      });
    }
    resolvedPatientId = patient.id;
  }

  if (!resolvedPatientId) {
    throw badRequest('Patient ID or Patient Phone is required.');
  }

  const result = await createAppointment(scope, {
    clinicId: targetClinicId,
    doctorId: input.doctorId,
    serviceId: input.serviceId,
    patientId: resolvedPatientId,
    startsAt: input.startsAt,
    notes: input.notes,
    status: input.status,
    source: 'ADMIN',
    idempotencyKey: input.idempotencyKey,
    createdByUserId: user.id,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        error: { code: 'SLOT_UNAVAILABLE', message: result.message, details: { reason: result.reason } },
        alternatives: result.alternatives.map((s) => ({
          slotToken: s.slotToken,
          startsAt: s.start.toISOString(),
          doctorName: s.doctorName,
        })),
      },
      { status: 409 },
    );
  }

  return NextResponse.json({ ok: true, appointment: result.appointment }, { status: 201 });
});
