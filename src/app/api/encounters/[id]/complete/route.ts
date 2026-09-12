import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await context.params;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const whereClause: any = { id };
    if (clinicId) whereClause.clinicId = clinicId;

    const existing = await prisma.clinicalEncounter.findFirst({
      where: whereClause,
      include: { appointment: true },
    });

    if (!existing) {
      throw notFound('Encounter not found');
    }

    const now = new Date();

    // Run transaction to finalize encounter and appointment
    const result = await prisma.$transaction(async (tx) => {
      const updatedEncounter = await tx.clinicalEncounter.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
        include: {
          patient: true,
          doctor: true,
          appointment: true,
        },
      });

      if (existing.appointmentId) {
        await tx.appointment.update({
          where: { id: existing.appointmentId },
          data: {
            status: 'COMPLETED',
            completedAt: now,
          },
        });
      }

      return updatedEncounter;
    });

    return NextResponse.json({ encounter: result, success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
