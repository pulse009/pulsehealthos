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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const encounterId = searchParams.get('encounterId');

    const whereClause: any = {};
    if (clinicId) whereClause.clinicId = clinicId;
    if (status && status !== 'ALL') whereClause.status = status;
    if (priority && priority !== 'ALL') whereClause.priority = priority;
    if (patientId) whereClause.patientId = patientId;
    if (doctorId) whereClause.doctorId = doctorId;
    if (encounterId) whereClause.encounterId = encounterId;

    const orders = await prisma.labOrder.findMany({
      where: whereClause,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
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
        collectedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        verifiedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        encounter: {
          select: {
            id: true,
            chiefComplaint: true,
            primaryDiagnosis: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ orders });
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
      patientId,
      doctorId,
      encounterId,
      testName,
      category,
      sampleType,
      tubeType,
      priority,
      instructions,
      clinicalNotes,
      price,
      resultsJson,
      specimenId,
    } = body;

    if (!patientId || !testName) {
      throw badRequest('patientId and testName are required');
    }

    // Generate sequential order number
    const count = await prisma.labOrder.count({ where: { clinicId } });
    const orderNumber = `LAB-${String(count + 1).padStart(4, '0')}`;

    const newOrder = await prisma.labOrder.create({
      data: {
        clinicId,
        orderNumber,
        patientId,
        doctorId: doctorId || null,
        encounterId: encounterId || null,
        testName,
        category: category || 'Biochemistry',
        sampleType: sampleType || 'Blood',
        tubeType: tubeType || null,
        priority: priority || 'ROUTINE',
        status: 'ORDERED',
        instructions: instructions || null,
        clinicalNotes: clinicalNotes || null,
        price: price ? Number(price) : 0,
        specimenId: specimenId || null,
        resultsJson: resultsJson || null,
      },
      include: {
        patient: true,
        doctor: true,
        encounter: true,
      },
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
