import { NextResponse } from 'next/server';
import { RateLimits } from '@/lib/rate-limit';
import { limitByIp, parseJson, withErrorHandling } from '@/lib/api/handler';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatPatientId(fileNumber: number | null, id: string): string {
  if (fileNumber) {
    return `PID-${fileNumber.toString().padStart(4, '0')}`;
  }
  return `PID-${id.slice(0, 6).toUpperCase()}`;
}

/**
 * Search patients by Patient ID (PID-XXXX), fileNumber, phone, or name within the clinic scope.
 */
export const GET = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-read', RateLimits.API_READ);
  const { scope } = await requireScope();

  if (scope.kind !== 'CLINIC') {
    return NextResponse.json({ error: 'Clinic scope required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const fileNumberStr = searchParams.get('fileNumber') || searchParams.get('patientId');
  const phone = searchParams.get('phone');
  const query = searchParams.get('query')?.trim();

  // 1. Single lookup by Patient ID / fileNumber
  if (fileNumberStr) {
    const rawVal = fileNumberStr.trim();
    const cleanNum = rawVal.replace(/^(?:PID-?|FR-?|PA-?|#)/i, '');
    const fileNumber = parseInt(cleanNum, 10);

    const orConditions: any[] = [];
    if (!isNaN(fileNumber)) {
      orConditions.push({ fileNumber });
    }
    orConditions.push({ id: rawVal });

    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: scope.clinicId,
        OR: orConditions,
      },
      include: {
        user: { select: { username: true, email: true } },
        _count: { select: { appointments: true } },
      },
    });

    if (!patient) {
      return NextResponse.json({ patient: null }, { status: 404 });
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        patientId: formatPatientId(patient.fileNumber, patient.id),
        fileNumber: patient.fileNumber,
        name: patient.name,
        phone: patient.phone,
        title: patient.title,
        gender: patient.gender,
        nationality: patient.nationality,
        email: patient.email,
        username: patient.user?.username || (patient.fileNumber ? `PA-${patient.fileNumber}` : null),
        appointmentsCount: patient._count.appointments,
      },
    });
  }

  // 2. Single lookup by phone
  if (phone) {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    const patient = await prisma.patient.findFirst({
      where: {
        clinicId: scope.clinicId,
        phone: { contains: cleanPhone },
      },
      include: {
        user: { select: { username: true, email: true } },
        _count: { select: { appointments: true } },
      },
    });

    if (!patient) {
      return NextResponse.json({ patient: null }, { status: 404 });
    }

    return NextResponse.json({
      patient: {
        id: patient.id,
        patientId: formatPatientId(patient.fileNumber, patient.id),
        fileNumber: patient.fileNumber,
        name: patient.name,
        phone: patient.phone,
        title: patient.title,
        gender: patient.gender,
        nationality: patient.nationality,
        email: patient.email,
        username: patient.user?.username || (patient.fileNumber ? `PA-${patient.fileNumber}` : null),
        appointmentsCount: patient._count.appointments,
      },
    });
  }

  // 3. General search
  const whereFilter: any = { clinicId: scope.clinicId };
  if (query) {
    const cleanNum = query.replace(/^(?:PID-?|FR-?|PA-?|#)/i, '');
    const isNum = !isNaN(parseInt(cleanNum, 10));
    whereFilter.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query } },
      { id: { contains: query, mode: 'insensitive' } },
      ...(isNum ? [{ fileNumber: parseInt(cleanNum, 10) }] : []),
    ];
  }

  const patients = await prisma.patient.findMany({
    where: whereFilter,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { username: true } },
      _count: { select: { appointments: true } },
    },
  });

  return NextResponse.json({
    patients: patients.map((p) => ({
      id: p.id,
      patientId: formatPatientId(p.fileNumber, p.id),
      fileNumber: p.fileNumber,
      name: p.name,
      phone: p.phone,
      title: p.title,
      gender: p.gender,
      nationality: p.nationality,
      email: p.email,
      username: p.user?.username || (p.fileNumber ? `PA-${p.fileNumber}` : null),
      appointmentsCount: p._count.appointments,
    })),
  });
});

const createPatientSchema = z.object({
  title: z.string().optional(),
  name: z.string().min(1, 'Patient Name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email().optional().or(z.literal('')),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  notes: z.string().optional(),
});

export const POST = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-write', RateLimits.API_WRITE);
  const { scope } = await requireScope();

  if (scope.kind !== 'CLINIC') {
    return NextResponse.json({ error: 'Clinic scope required' }, { status: 403 });
  }

  const body = await parseJson(request, createPatientSchema);

  // Allocate next file number
  const lastPatient = await prisma.patient.findFirst({
    where: { clinicId: scope.clinicId, fileNumber: { not: null } },
    orderBy: { fileNumber: 'desc' },
    select: { fileNumber: true },
  });
  const nextFileNumber = (lastPatient?.fileNumber ?? 0) + 1;

  const patient = await prisma.patient.create({
    data: {
      clinicId: scope.clinicId,
      fileNumber: nextFileNumber,
      title: body.title?.trim() || null,
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      gender: body.gender?.trim() || null,
      nationality: body.nationality?.trim() || null,
      notes: body.notes?.trim() || null,
    },
  });

  return NextResponse.json({
    ok: true,
    patient: {
      id: patient.id,
      patientId: formatPatientId(patient.fileNumber, patient.id),
      fileNumber: patient.fileNumber,
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      gender: patient.gender,
      nationality: patient.nationality,
      title: patient.title,
      createdAt: patient.createdAt.toISOString(),
    },
  });
});

/**
 * Permanently deletes a patient and cascades all associated appointments, conversations, messages, reminders, leads, and accounts.
 */
export const DELETE = withErrorHandling(async (request: Request) => {
  limitByIp(request, 'api-write', RateLimits.API_WRITE);
  const { scope } = await requireScope();

  if (scope.kind !== 'CLINIC') {
    return NextResponse.json({ error: 'Clinic scope required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('id') || searchParams.get('patientId');

  if (!patientId) {
    throw badRequest('Patient ID is required for deletion.');
  }

  const patient = await prisma.patient.findFirst({
    where: {
      id: patientId,
      clinicId: scope.clinicId,
    },
  });

  if (!patient) {
    throw notFound('Patient not found in this clinic.');
  }

  // Cascade delete all data in a single transaction
  await prisma.$transaction(async (tx) => {
    // Delete user account if attached
    if (patient.userId) {
      await tx.user.deleteMany({
        where: { id: patient.userId },
      });
    }

    // Delete patient record (Prisma will automatically cascade appointments, conversations, messages, leads, reminders)
    await tx.patient.delete({
      where: { id: patient.id },
    });
  });

  return NextResponse.json({
    ok: true,
    message: 'Patient and all associated records permanently deleted.',
  });
});
