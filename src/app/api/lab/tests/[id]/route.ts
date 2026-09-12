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

    const test = await prisma.labTestCatalog.findUnique({
      where: { id },
    });

    if (!test || (clinicId && test.clinicId !== clinicId)) {
      throw notFound('Lab test not found');
    }

    return NextResponse.json({ test });
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

    const existing = await prisma.labTestCatalog.findUnique({
      where: { id },
    });

    if (!existing || (clinicId && existing.clinicId !== clinicId)) {
      throw notFound('Lab test not found');
    }

    const body = await request.json();
    const {
      code,
      name,
      category,
      sampleType,
      containerType,
      normalRange,
      unit,
      parametersJson,
      turnaroundHours,
      price,
      isActive,
    } = body;

    const updateData: any = {};
    if (code !== undefined) updateData.code = String(code).toUpperCase().trim();
    if (name !== undefined) updateData.name = String(name).trim();
    if (category !== undefined) updateData.category = category;
    if (sampleType !== undefined) updateData.sampleType = sampleType;
    if (containerType !== undefined) updateData.containerType = containerType;
    if (normalRange !== undefined) updateData.normalRange = normalRange;
    if (unit !== undefined) updateData.unit = unit;
    if (parametersJson !== undefined) updateData.parametersJson = parametersJson;
    if (turnaroundHours !== undefined) updateData.turnaroundHours = Number(turnaroundHours);
    if (price !== undefined) updateData.price = Number(price);
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.labTestCatalog.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ test: updated });
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

    const existing = await prisma.labTestCatalog.findUnique({
      where: { id },
    });

    if (!existing || (clinicId && existing.clinicId !== clinicId)) {
      throw notFound('Lab test not found');
    }

    await prisma.labTestCatalog.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return errorResponse(error);
  }
}
