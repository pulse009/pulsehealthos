import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, parseQuery, withErrorHandling } from '@/lib/api/handler';
import { appointmentListSchema, createAppointmentSchema } from '@/lib/validation/schemas';
import { requireScope } from '@/lib/auth/guards';
import { createAppointment } from '@/lib/booking/booking.service';
import { listAppointments } from '@/lib/leads/lead.service';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { ensurePatientUserAccount } from '@/lib/auth/patient-account';
import { sendAppointmentWhatsAppNotification } from '@/lib/whatsapp/notifications.service';
import { formatInstant } from '@/lib/time/timezone';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const GET = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-read', RateLimits.API_READ);
  const { scope } = await requireScope();
  const query = parseQuery(request, appointmentListSchema);
  return NextResponse.json(await listAppointments(scope, query));
});

/**
 * Manual booking by an operator, doctor, coordinator or clinic staff.
 * Supports Existing Patient (lookup by file number) and New Patient creation with PA-NUMBER credentials & WhatsApp alert.
 */
export const POST = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-write', RateLimits.API_WRITE);

  const { user, scope } = await requireScope();
  const input = await parseJson(request, createAppointmentSchema);

  const targetClinicId = user.role === 'CLIENT' || user.role === 'COORDINATOR' || user.role === 'DOCTOR'
    ? user.clinicId!
    : (input.clinicId || user.clinicId!);

  if (!targetClinicId) {
    throw badRequest('Clinic ID is required.');
  }

  let resolvedPatientId = input.patientId;
  let resolvedPatient: any = null;

  // 1. Existing Patient lookup
  if (input.patientType === 'EXISTING' || input.fileNumber) {
    if (input.fileNumber) {
      resolvedPatient = await prisma.patient.findFirst({
        where: { clinicId: targetClinicId, fileNumber: input.fileNumber },
        include: { user: true },
      });
      if (!resolvedPatient) {
        throw notFound(`Patient with File #${input.fileNumber} not found.`);
      }
      resolvedPatientId = resolvedPatient.id;
    } else if (resolvedPatientId) {
      resolvedPatient = await prisma.patient.findUnique({
        where: { id: resolvedPatientId },
        include: { user: true },
      });
    }
  }

  // 2. New Patient or Lookup by Phone
  if (!resolvedPatient) {
    const cleanPhone = (input.patientPhone || '').trim();
    if (!cleanPhone && !resolvedPatientId) {
      throw badRequest('Patient Phone is required for new patients.');
    }

    if (cleanPhone) {
      resolvedPatient = await prisma.patient.findFirst({
        where: { clinicId: targetClinicId, phone: cleanPhone },
        include: { user: true },
      });
    }

    if (!resolvedPatient) {
      // Allocate next sequential file number
      const lastPatient = await prisma.patient.findFirst({
        where: { clinicId: targetClinicId, fileNumber: { not: null } },
        orderBy: { fileNumber: 'desc' },
        select: { fileNumber: true },
      });
      const nextFileNumber = (lastPatient?.fileNumber ?? 0) + 1;

      resolvedPatient = await prisma.patient.create({
        data: {
          clinicId: targetClinicId,
          fileNumber: nextFileNumber,
          title: input.title?.trim() || null,
          gender: input.gender?.trim() || null,
          nationality: input.nationality?.trim() || null,
          name: input.patientName?.trim() || 'Patient',
          phone: cleanPhone,
          notes: input.notes?.trim() || null,
        },
        include: { user: true },
      });
    } else {
      // Update patient profile info if provided
      const updateData: any = {};
      if (input.patientName?.trim() && (!resolvedPatient.name || resolvedPatient.name === 'Patient')) {
        updateData.name = input.patientName.trim();
      }
      if (input.title?.trim()) updateData.title = input.title.trim();
      if (input.gender?.trim()) updateData.gender = input.gender.trim();
      if (input.nationality?.trim()) updateData.nationality = input.nationality.trim();

      if (Object.keys(updateData).length > 0) {
        resolvedPatient = await prisma.patient.update({
          where: { id: resolvedPatient.id },
          data: updateData,
          include: { user: true },
        });
      }
    }

    resolvedPatientId = resolvedPatient.id;
  }

  if (!resolvedPatientId) {
    throw badRequest('Could not resolve patient.');
  }

  // 3. Ensure patient has portal user account with unique PA-NUMBER
  const accountResult = await ensurePatientUserAccount(
    targetClinicId,
    resolvedPatientId,
    resolvedPatient.phone,
    resolvedPatient.name,
    resolvedPatient.fileNumber,
  );

  // 4. Resolve Doctor and Service (supports UUIDs or exact Names)
  let resolvedService = await prisma.service.findFirst({
    where: {
      clinicId: targetClinicId,
      OR: [{ id: input.serviceId }, { name: input.serviceId }],
    },
  });
  if (!resolvedService) {
    resolvedService = await prisma.service.findFirst({
      where: { clinicId: targetClinicId, isActive: true },
    });
  }
  if (!resolvedService) {
    throw badRequest('Selected service is not found in this clinic.');
  }

  let resolvedDoctor = await prisma.doctor.findFirst({
    where: {
      clinicId: targetClinicId,
      OR: [{ id: input.doctorId }, { name: input.doctorId }],
    },
  });
  if (!resolvedDoctor) {
    const docService = await prisma.doctorService.findFirst({
      where: { serviceId: resolvedService.id },
      include: { doctor: true },
    });
    resolvedDoctor =
      docService?.doctor ||
      (await prisma.doctor.findFirst({
        where: { clinicId: targetClinicId, isActive: true },
      }));
  }
  if (!resolvedDoctor) {
    throw badRequest('Selected doctor is not found in this clinic.');
  }

  // 5. Create appointment
  const result = await createAppointment(scope, {
    clinicId: targetClinicId,
    doctorId: resolvedDoctor.id,
    serviceId: resolvedService.id,
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

  // 5. Update pending payment if specified
  if (input.pendingPayment && result.appointment?.id) {
    await prisma.appointment.update({
      where: { id: result.appointment.id },
      data: { pendingPayment: input.pendingPayment.trim() },
    });
  }

  // 6. Asynchronously send WhatsApp notification with appointment info & portal credentials
  const clinicConfig = await prisma.clinic.findUnique({
    where: { id: targetClinicId },
    select: { timezone: true },
  });
  const tz = clinicConfig?.timezone || 'Asia/Riyadh';
  const formattedTime = formatInstant(input.startsAt, tz);

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
    select: { name: true },
  });
  const doctor = await prisma.doctor.findUnique({
    where: { id: input.doctorId },
    select: { name: true },
  });

  // Non-blocking notification dispatch
  sendAppointmentWhatsAppNotification({
    clinicId: targetClinicId,
    patientPhone: resolvedPatient.phone,
    patientName: resolvedPatient.name || 'Patient',
    serviceName: service?.name || 'Medical Service',
    doctorName: doctor?.name || 'Doctor',
    appointmentTime: formattedTime,
    status: input.status,
    fileNumber: resolvedPatient.fileNumber,
    appointmentNumber: result.appointment?.appointmentNumber,
    username: accountResult?.username || (resolvedPatient.fileNumber ? `PA-${resolvedPatient.fileNumber}` : undefined),
    temporaryPassword: accountResult?.temporaryPassword,
  }).catch((e) => console.error('Failed to dispatch appointment WhatsApp notification:', e));

  return NextResponse.json(
    {
      ok: true,
      appointment: {
        ...result.appointment,
        fileNumber: resolvedPatient.fileNumber,
        username: accountResult?.username,
      },
      account: accountResult,
    },
    { status: 201 },
  );
});
