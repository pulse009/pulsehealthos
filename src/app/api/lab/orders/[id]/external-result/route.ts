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

    const order = await prisma.labOrder.findUnique({
      where: { id },
      include: { encounter: true },
    });

    if (!order || (clinicId && order.clinicId !== clinicId)) {
      throw notFound('Lab order not found');
    }

    const body = await request.json();
    const {
      externalReportUrl,
      externalResultNotes,
      externalResultDate,
      markReviewed,
    } = body;

    const resultDate = externalResultDate ? new Date(externalResultDate) : new Date();
    const newStatus = markReviewed ? 'REVIEWED' : 'EXTERNAL_RESULT_UPLOADED';

    const updated = await prisma.labOrder.update({
      where: { id },
      data: {
        externalReportUrl: externalReportUrl || order.externalReportUrl,
        externalResultNotes: externalResultNotes || order.externalResultNotes,
        externalResultDate: resultDate,
        status: newStatus,
        ...(markReviewed && {
          verifiedAt: new Date(),
          verifiedById: user.id,
        }),
      },
      include: {
        patient: true,
        doctor: true,
        encounter: true,
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    });

    // Also sync in encounter.labOrdersJson if attached to an encounter
    if (order.encounterId && order.encounter?.labOrdersJson) {
      const currentJson = order.encounter.labOrdersJson as any[];
      if (Array.isArray(currentJson)) {
        const updatedJson = currentJson.map((item) => {
          if (item.testName === order.testName || item.id === order.id) {
            return {
              ...item,
              externalReportUrl: externalReportUrl || item.externalReportUrl,
              externalResultNotes: externalResultNotes || item.externalResultNotes,
              externalResultDate: resultDate.toISOString(),
              status: newStatus,
            };
          }
          return item;
        });

        await prisma.clinicalEncounter.update({
          where: { id: order.encounterId },
          data: { labOrdersJson: updatedJson },
        });
      }
    }

    return NextResponse.json({ order: updated, success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
