import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest } from '@/lib/errors';
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
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const whereClause: any = {};
    if (clinicId) whereClause.clinicId = clinicId;
    if (category && category !== 'ALL') whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.labTestCatalog.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ tests });
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
    } = body;

    if (!code || !name) {
      throw badRequest('Code and name are required');
    }

    const test = await prisma.labTestCatalog.create({
      data: {
        clinicId,
        code: code.toUpperCase(),
        name,
        category: category || 'Biochemistry',
        sampleType: sampleType || 'Blood',
        containerType: containerType || 'Lavender (EDTA)',
        normalRange: normalRange || null,
        unit: unit || null,
        parametersJson: parametersJson || null,
        turnaroundHours: turnaroundHours ? Number(turnaroundHours) : 24,
        price: price ? Number(price) : 0,
      },
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId) {
      throw badRequest('Clinic scope required');
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      throw badRequest('Array of test IDs is required');
    }

    const result = await prisma.labTestCatalog.deleteMany({
      where: {
        id: { in: ids },
        clinicId,
      },
    });

    return NextResponse.json({ success: true, count: result.count, deletedIds: ids });
  } catch (error) {
    return errorResponse(error);
  }
}
