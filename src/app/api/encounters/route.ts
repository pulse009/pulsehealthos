import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const { searchParams } = new URL(request.url);
    const doctorId = searchParams.get('doctorId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (clinicId) whereClause.clinicId = clinicId;
    if (doctorId) whereClause.doctorId = doctorId;
    if (patientId) whereClause.patientId = patientId;
    if (status) whereClause.status = status;

    const encounters = await prisma.clinicalEncounter.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            fileNumber: true,
            gender: true,
            tags: true,
          },
        },
        doctor: {
          select: {
            id: true,
            name: true,
            specialty: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
            status: true,
            service: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ encounters });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId) {
      throw badRequest('Clinic scope required');
    }

    const body = await request.json();
    const { appointmentId, patientId, doctorId, chiefComplaint, vitalsJson, allergies: inputAllergies } = body;

    let targetPatientId = patientId;
    let targetDoctorId = doctorId;

    // If appointmentId provided, resolve details
    if (appointmentId) {
      const existing = await prisma.clinicalEncounter.findUnique({
        where: { appointmentId },
        include: {
          patient: true,
          doctor: true,
          appointment: { include: { service: true } },
        },
      });

      if (existing) {
        const updateData: any = {};
        if (vitalsJson !== undefined) updateData.vitalsJson = vitalsJson;
        if (inputAllergies !== undefined) updateData.allergies = inputAllergies;
        if (chiefComplaint !== undefined) updateData.chiefComplaint = chiefComplaint;

        const updated = await prisma.clinicalEncounter.update({
          where: { id: existing.id },
          data: updateData,
          include: {
            patient: true,
            doctor: true,
            appointment: { include: { service: true } },
          },
        });

        // Also sync allergies into patient tags if provided
        if (Array.isArray(inputAllergies) && inputAllergies.length > 0) {
          const currentPatient = await prisma.patient.findUnique({
            where: { id: existing.patientId },
            select: { tags: true },
          });
          const mergedTags = Array.from(new Set([...(currentPatient?.tags || []), ...inputAllergies]));
          await prisma.patient.update({
            where: { id: existing.patientId },
            data: { tags: mergedTags },
          });
        }

        return NextResponse.json({ encounter: updated, isExisting: true });
      }

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { patient: true, doctor: true },
      });

      if (!appointment) {
        throw notFound('Appointment not found');
      }

      targetPatientId = appointment.patientId;
      targetDoctorId = appointment.doctorId;
    }

    if (!targetPatientId || !targetDoctorId) {
      throw badRequest('patientId and doctorId are required to start an encounter');
    }

    // Look up patient allergies
    const patient = await prisma.patient.findUnique({
      where: { id: targetPatientId },
      select: { tags: true },
    });
    const defaultAllergies = patient?.tags?.filter((t: string) => t.toLowerCase().includes('allerg') || t.toLowerCase().includes('penicillin')) || [];
    const finalAllergies = Array.isArray(inputAllergies) ? inputAllergies : defaultAllergies;

    const encounter = await prisma.clinicalEncounter.create({
      data: {
        clinicId,
        patientId: targetPatientId,
        doctorId: targetDoctorId,
        appointmentId: appointmentId || null,
        status: 'IN_PROGRESS',
        chiefComplaint: chiefComplaint || null,
        allergies: finalAllergies,
        vitalsJson: vitalsJson || null,
        startedAt: new Date(),
      },
      include: {
        patient: true,
        doctor: true,
        appointment: { include: { service: true } },
      },
    });

    // Also sync allergies into patient tags if provided
    if (Array.isArray(inputAllergies) && inputAllergies.length > 0) {
      const mergedTags = Array.from(new Set([...(patient?.tags || []), ...inputAllergies]));
      await prisma.patient.update({
        where: { id: targetPatientId },
        data: { tags: mergedTags },
      });
    }

    return NextResponse.json({ encounter, isExisting: false }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
