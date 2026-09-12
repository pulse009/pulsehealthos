import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await params;

    const order = await prisma.labOrder.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        encounter: true,
        collectedBy: { select: { id: true, name: true, role: true } },
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    });

    if (!order || (clinicId && order.clinicId !== clinicId)) {
      throw notFound('Lab order not found');
    }

    return NextResponse.json({ order });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await params;

    const existing = await prisma.labOrder.findUnique({
      where: { id },
    });

    if (!existing || (clinicId && existing.clinicId !== clinicId)) {
      throw notFound('Lab order not found');
    }

    const body = await request.json();
    const {
      status,
      priority,
      specimenId,
      tubeType,
      sampleType,
      resultsJson,
      resultsSummary,
      hasAbnormalResults,
      clinicalNotes,
      reportFileUrl,
      price,
    } = body;

    const updateData: any = {};

    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (specimenId !== undefined) updateData.specimenId = specimenId;
    if (tubeType !== undefined) updateData.tubeType = tubeType;
    if (sampleType !== undefined) updateData.sampleType = sampleType;
    if (clinicalNotes !== undefined) updateData.clinicalNotes = clinicalNotes;
    if (reportFileUrl !== undefined) updateData.reportFileUrl = reportFileUrl;
    if (price !== undefined) updateData.price = Number(price);

    // If status moving to SAMPLE_COLLECTED, record collector
    if (status === 'SAMPLE_COLLECTED' && !existing.collectedAt) {
      updateData.collectedAt = new Date();
      updateData.collectedById = user.id;
    }

    // If results provided, update results payload
    if (resultsJson !== undefined) {
      updateData.resultsJson = resultsJson;
      
      // Auto compute abnormal flag if any parameter flagged HIGH / LOW / CRITICAL
      if (Array.isArray(resultsJson)) {
        const isAbnormal = resultsJson.some(
          (p: any) => p.flag === 'HIGH' || p.flag === 'LOW' || p.flag === 'CRITICAL'
        );
        updateData.hasAbnormalResults = isAbnormal;
      }
    }

    if (hasAbnormalResults !== undefined) {
      updateData.hasAbnormalResults = Boolean(hasAbnormalResults);
    }
    if (resultsSummary !== undefined) {
      updateData.resultsSummary = resultsSummary;
    }

    // If status moving to COMPLETED, record verifier
    if (status === 'COMPLETED' && !existing.verifiedAt) {
      updateData.verifiedAt = new Date();
      updateData.verifiedById = user.id;
    }

    const updated = await prisma.labOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: true,
        doctor: true,
        encounter: true,
        collectedBy: { select: { id: true, name: true, role: true } },
        verifiedBy: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await params;

    const existing = await prisma.labOrder.findUnique({
      where: { id },
    });

    if (!existing || (clinicId && existing.clinicId !== clinicId)) {
      throw notFound('Lab order not found');
    }

    const cancelled = await prisma.labOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ success: true, order: cancelled });
  } catch (error) {
    return errorResponse(error);
  }
}
