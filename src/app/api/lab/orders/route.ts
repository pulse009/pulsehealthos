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
      customerType,
      patientName,
      patientPhone,
      patientGender,
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
      tests, // Array<{ testCode?: string; testName: string; category?: string; sampleType?: string; tubeType?: string; price?: number }>
    } = body;

    // Normalize tests to create (either array from multi-test selector or single test)
    let testsToCreate: Array<{
      testCode?: string;
      testName: string;
      category?: string;
      sampleType?: string;
      tubeType?: string;
      price?: number;
    }> = [];

    if (Array.isArray(tests) && tests.length > 0) {
      testsToCreate = tests
        .filter((t) => t && t.testName && t.testName.trim().length > 0)
        .map((t) => ({
          testCode: t.testCode,
          testName: t.testName.trim(),
          category: t.category || category || 'Biochemistry',
          sampleType: t.sampleType || sampleType || 'Blood',
          tubeType: t.tubeType || tubeType || null,
          price: t.price !== undefined ? Number(t.price) : Number(price) || 0,
        }));
    } else if (testName && testName.trim()) {
      testsToCreate = [
        {
          testName: testName.trim(),
          category: category || 'Biochemistry',
          sampleType: sampleType || 'Blood',
          tubeType: tubeType || null,
          price: price ? Number(price) : 0,
        },
      ];
    }

    if (testsToCreate.length === 0) {
      throw badRequest('Please provide at least one diagnostic test name');
    }

    const isWalkIn = customerType === 'WALK_IN' || (!patientId && Boolean(patientName));
    let resolvedPatientId = patientId;

    if (isWalkIn) {
      const rawName = (patientName || '').trim() || 'Walk-in Customer';
      const rawPhone = (patientPhone || '').trim();
      const rawGender = patientGender || null;

      if (rawPhone && rawPhone !== 'N/A' && rawPhone !== '0000000000') {
        let existingPatient = await prisma.patient.findFirst({
          where: {
            clinicId: clinicId!,
            phone: rawPhone,
          },
        });

        if (existingPatient) {
          if (rawName !== 'Walk-in Customer' && (existingPatient.name === 'Walk-in Customer' || !existingPatient.name)) {
            existingPatient = await prisma.patient.update({
              where: { id: existingPatient.id },
              data: {
                name: rawName,
                gender: rawGender || existingPatient.gender,
              },
            });
          }
          resolvedPatientId = existingPatient.id;
        } else {
          const newPatient = await prisma.patient.create({
            data: {
              clinicId: clinicId!,
              name: rawName,
              phone: rawPhone,
              gender: rawGender,
              fileNumber: null,
              tags: ['WALK_IN_CUSTOMER', 'LAB_WALK_IN'],
            },
          });
          resolvedPatientId = newPatient.id;
        }
      } else {
        const uniquePhoneKey = `walkin-lab-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const newPatient = await prisma.patient.create({
          data: {
            clinicId: clinicId!,
            name: rawName,
            phone: uniquePhoneKey,
            gender: rawGender,
            fileNumber: null,
            tags: ['WALK_IN_CUSTOMER', 'LAB_WALK_IN'],
          },
        });
        resolvedPatientId = newPatient.id;
      }
    } else {
      if (!resolvedPatientId) {
        throw badRequest('Please select a clinic patient or provide walk-in customer details');
      }
    }

    // Generate sequential order numbers and create orders in transaction
    const startCount = await prisma.labOrder.count({ where: { clinicId } });

    const createdOrders = await prisma.$transaction(
      testsToCreate.map((t, idx) => {
        const orderNumber = `LAB-${String(startCount + idx + 1).padStart(4, '0')}`;
        return prisma.labOrder.create({
          data: {
            clinicId: clinicId!,
            orderNumber,
            patientId: resolvedPatientId,
            doctorId: doctorId || null,
            encounterId: encounterId || null,
            testName: t.testName,
            category: t.category || 'Biochemistry',
            sampleType: t.sampleType || 'Blood',
            tubeType: t.tubeType || null,
            priority: priority || 'ROUTINE',
            status: 'ORDERED',
            instructions: instructions || null,
            clinicalNotes: clinicalNotes || null,
            price: t.price !== undefined ? Number(t.price) : 0,
            specimenId: specimenId || null,
            resultsJson: resultsJson || null,
          },
          include: {
            patient: true,
            doctor: true,
            encounter: true,
          },
        });
      })
    );

    return NextResponse.json(
      {
        orders: createdOrders,
        order: createdOrders[0],
        count: createdOrders.length,
      },
      { status: 201 }
    );
  } catch (error) {
    return errorResponse(error);
  }
}
