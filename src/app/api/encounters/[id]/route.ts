import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, notFound } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await context.params;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const whereClause: any = { id };
    if (clinicId) whereClause.clinicId = clinicId;

    const encounter = await prisma.clinicalEncounter.findFirst({
      where: whereClause,
      include: {
        patient: true,
        doctor: true,
        appointment: {
          include: {
            service: true,
            appointmentType: true,
          },
        },
      },
    });

    if (!encounter) {
      throw notFound('Clinical encounter not found');
    }

    // Also fetch previous encounters for this patient for historical context
    const previousEncounters = await prisma.clinicalEncounter.findMany({
      where: {
        patientId: encounter.patientId,
        id: { not: id },
        status: 'COMPLETED',
        ...(clinicId ? { clinicId } : {}),
      },
      orderBy: { completedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        primaryDiagnosis: true,
        doctor: { select: { name: true } },
        prescriptionsJson: true,
      },
    });

    // Fetch pharmacy medications list for auto-complete suggestions
    const pharmacyItems = await prisma.inventoryItem.findMany({
      where: {
        isActive: true,
        ...(clinicId ? { clinicId } : {}),
      },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
        unit: true,
        defaultCost: true,
      },
      take: 100,
    });

    // Also fetch any real LabOrder records linked to this encounter or patient
    const labOrders = await prisma.labOrder.findMany({
      where: {
        clinicId: clinicId || encounter.clinicId,
        OR: [
          { encounterId: encounter.id },
          { patientId: encounter.patientId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      encounter,
      previousEncounters,
      pharmacyItems,
      labOrders,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request, context: Context) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;
    const { id } = await context.params;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const body = await request.json();
    const {
      chiefComplaint,
      hpi,
      pastMedicalHistory,
      allergies,
      vitalsJson,
      physicalExam,
      primaryDiagnosis,
      secondaryDiagnosis,
      icd10Code,
      clinicalNotes,
      treatmentPlan,
      patientAdvice,
      followUpDays,
      followUpDate,
      prescriptionsJson,
      labOrdersJson,
      status,
    } = body;

    const whereClause: any = { id };
    if (clinicId) whereClause.clinicId = clinicId;

    const existing = await prisma.clinicalEncounter.findFirst({
      where: whereClause,
      include: { doctor: true, patient: true },
    });

    if (!existing) {
      throw notFound('Encounter not found');
    }

    const updated = await prisma.clinicalEncounter.update({
      where: { id },
      data: {
        ...(chiefComplaint !== undefined && { chiefComplaint }),
        ...(hpi !== undefined && { hpi }),
        ...(pastMedicalHistory !== undefined && { pastMedicalHistory }),
        ...(allergies !== undefined && { allergies }),
        ...(vitalsJson !== undefined && { vitalsJson }),
        ...(physicalExam !== undefined && { physicalExam }),
        ...(primaryDiagnosis !== undefined && { primaryDiagnosis }),
        ...(secondaryDiagnosis !== undefined && { secondaryDiagnosis }),
        ...(icd10Code !== undefined && { icd10Code }),
        ...(clinicalNotes !== undefined && { clinicalNotes }),
        ...(treatmentPlan !== undefined && { treatmentPlan }),
        ...(patientAdvice !== undefined && { patientAdvice }),
        ...(followUpDays !== undefined && { followUpDays }),
        ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
        ...(prescriptionsJson !== undefined && { prescriptionsJson }),
        ...(labOrdersJson !== undefined && { labOrdersJson }),
        ...(status !== undefined && { status }),
      },
      include: {
        patient: true,
        doctor: true,
        appointment: true,
      },
    });

    // Auto-create / sync LabOrder items in the LIS queue if labOrdersJson was passed
    if (Array.isArray(labOrdersJson) && labOrdersJson.length > 0 && (clinicId || existing.clinicId)) {
      const activeClinicId = clinicId || existing.clinicId;
      for (const item of labOrdersJson) {
        if (!item.testName) continue;
        const testName = String(item.testName).trim();
        
        // Check if order already exists for this encounter and test
        const existingOrder = await prisma.labOrder.findFirst({
          where: {
            encounterId: id,
            testName: testName,
          }
        });

        if (!existingOrder) {
          // Look up catalog for defaults
          const catalogItem = await prisma.labTestCatalog.findFirst({
            where: {
              clinicId: activeClinicId,
              name: { equals: testName, mode: 'insensitive' }
            }
          });

          const count = await prisma.labOrder.count({ where: { clinicId: activeClinicId } });
          const orderNumber = `LAB-${String(count + 1).padStart(4, '0')}`;

          await prisma.labOrder.create({
            data: {
              clinicId: activeClinicId,
              orderNumber,
              patientId: existing.patientId,
              doctorId: existing.doctorId,
              encounterId: existing.id,
              testName: testName,
              category: catalogItem?.category || item.category || 'General Pathology',
              sampleType: catalogItem?.sampleType || 'Venous Blood',
              priority: 'ROUTINE',
              clinicalNotes: item.notes || existing.primaryDiagnosis || null,
              resultsJson: (catalogItem?.parametersJson as any) || [
                { name: testName, unit: '', referenceRange: '', value: '', flag: 'NORMAL' }
              ],
              price: catalogItem?.price || 0,
              status: 'ORDERED',
            }
          });
        }
      }
    }

    return NextResponse.json({ encounter: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
