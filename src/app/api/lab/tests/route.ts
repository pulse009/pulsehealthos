import { NextResponse } from 'next/server';
import { requireScope } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { badRequest, forbidden } from '@/lib/errors';
import { errorResponse } from '@/lib/api/handler';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DEFAULT_INVESTIGATION_CATALOG = [
  { code: 'CBC01', name: 'Complete Blood Count (CBC)', category: 'Hematology', sampleType: 'Blood', containerType: 'Lavender (EDTA)', price: 50, isFavorite: true, description: 'WBC, RBC, Hemoglobin, Hematocrit, Platelets' },
  { code: 'FBS01', name: 'Fasting Blood Sugar (FBS)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Grey (Sodium Fluoride)', price: 25, isFavorite: true, description: 'Plasma glucose level after 8-10 hour fast' },
  { code: 'HBA1C', name: 'HbA1c (Glycated Hemoglobin)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Lavender (EDTA)', price: 80, isFavorite: true, description: 'Average blood sugar level over the past 2-3 months' },
  { code: 'LIPID01', name: 'Lipid Profile Panel', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Gold / SST', price: 120, isFavorite: true, description: 'Total Cholesterol, HDL, LDL, Triglycerides' },
  { code: 'LFT01', name: 'Liver Function Test (LFT)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Gold / SST', price: 100, isFavorite: true, description: 'ALT, AST, ALP, Bilirubin (Total/Direct), Albumin, Total Protein' },
  { code: 'RFT01', name: 'Renal Function Test (BUN/Creatinine)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Gold / SST', price: 90, isFavorite: true, description: 'Blood Urea Nitrogen, Serum Creatinine, eGFR, Uric Acid' },
  { code: 'URINE01', name: 'Urine Routine & Microscopy', category: 'Pathology', sampleType: 'Urine', containerType: 'Sterile Urine Container', price: 30, isFavorite: true, description: 'Physical, chemical, and microscopic examination' },
  { code: 'LYTES01', name: 'Serum Electrolytes (Na, K, Cl)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Gold / SST', price: 75, isFavorite: true, description: 'Sodium, Potassium, Chloride, Bicarbonate' },
  { code: 'CXR01', name: 'Chest X-Ray PA View', category: 'Imaging', sampleType: 'None', containerType: 'Radiology Dept', price: 150, isFavorite: true, description: 'Posterior-Anterior chest radiograph' },
  { code: 'ECG01', name: '12-Lead ECG Resting', category: 'Cardiology', sampleType: 'None', containerType: 'Cardiology Dept', price: 80, isFavorite: true, description: 'Standard 12-lead electrocardiogram tracing' },
  { code: 'USG01', name: 'Abdominal Ultrasound', category: 'Imaging', sampleType: 'None', containerType: 'Radiology Dept', price: 200, isFavorite: true, description: 'Ultrasound imaging of abdomen and pelvis' },
  { code: 'TFT01', name: 'Thyroid Function Test (TSH, FT4)', category: 'Biochemistry', sampleType: 'Blood', containerType: 'Gold / SST', price: 130, isFavorite: false, description: 'Thyroid Stimulating Hormone and Free T4' },
  { code: 'CRP01', name: 'C-Reactive Protein (CRP)', category: 'Immunology', sampleType: 'Blood', containerType: 'Gold / SST', price: 60, isFavorite: false, description: 'Acute phase inflammatory marker' },
  { code: 'UCULT01', name: 'Urine Culture & Sensitivity', category: 'Microbiology', sampleType: 'Urine', containerType: 'Sterile Urine Cup', price: 110, isFavorite: false, description: 'Bacterial growth and antibiotic susceptibility' },
  { code: 'STOOL01', name: 'Stool Routine & Occult Blood', category: 'Pathology', sampleType: 'Stool', containerType: 'Stool Container', price: 45, isFavorite: false, description: 'Stool analysis for parasites, RBCs, occult blood' },
];

export async function GET(request: Request) {
  try {
    const { user, scope } = await requireScope();
    const clinicId = scope.kind === 'CLINIC' ? scope.clinicId : user.clinicId;

    if (!clinicId && user.role !== 'SUPER_ADMIN') {
      throw badRequest('Clinic scope required');
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();
    const favoritesOnly = searchParams.get('favoritesOnly') === 'true';

    const targetClinicId = clinicId!;

    // Auto-seed standard investigations if clinic catalog is empty
    const existingCount = await prisma.labTestCatalog.count({
      where: { clinicId: targetClinicId },
    });

    if (existingCount === 0) {
      await prisma.labTestCatalog.createMany({
        data: DEFAULT_INVESTIGATION_CATALOG.map((item) => ({
          clinicId: targetClinicId,
          code: item.code,
          name: item.name,
          category: item.category,
          sampleType: item.sampleType,
          containerType: item.containerType,
          price: item.price,
          isFavorite: item.isFavorite,
          description: item.description,
          defaultPriority: 'ROUTINE',
          defaultFulfillment: 'IN_HOUSE',
          turnaroundHours: 24,
          isActive: true,
        })),
        skipDuplicates: true,
      });
    }

    const whereClause: any = { clinicId: targetClinicId };
    if (category && category !== 'ALL') whereClause.category = category;
    if (favoritesOnly) whereClause.isFavorite = true;
    whereClause.isActive = true;

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.labTestCatalog.findMany({
      where: whereClause,
      orderBy: [
        { isFavorite: 'desc' },
        { name: 'asc' },
      ],
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

    // Role permission check for saving to catalog
    const allowedRoles = ['SUPER_ADMIN', 'CLIENT', 'DOCTOR', 'MANAGER', 'PATHOLOGIST', 'LAB_TECHNICIAN'];
    if (!allowedRoles.includes(user.role)) {
      throw forbidden('You do not have permission to manage the clinic investigation catalog.');
    }

    const body = await request.json();
    const {
      code,
      name,
      category,
      description,
      sampleType,
      containerType,
      normalRange,
      unit,
      parametersJson,
      turnaroundHours,
      price,
      isFavorite,
      defaultPriority,
      defaultFulfillment,
    } = body;

    if (!name || !name.trim()) {
      throw badRequest('Investigation name is required');
    }

    const trimmedName = name.trim();
    const resolvedCode = code?.trim()
      ? code.trim().toUpperCase()
      : `TEST-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const test = await prisma.labTestCatalog.upsert({
      where: {
        clinicId_code: {
          clinicId,
          code: resolvedCode,
        },
      },
      update: {
        name: trimmedName,
        category: category || 'Other',
        description: description || null,
        sampleType: sampleType || 'Blood',
        containerType: containerType || 'Lavender (EDTA)',
        normalRange: normalRange || null,
        unit: unit || null,
        parametersJson: parametersJson || null,
        turnaroundHours: turnaroundHours ? Number(turnaroundHours) : 24,
        price: price ? Number(price) : 0,
        isFavorite: Boolean(isFavorite),
        defaultPriority: defaultPriority || 'ROUTINE',
        defaultFulfillment: defaultFulfillment || 'IN_HOUSE',
        isActive: true,
      },
      create: {
        clinicId,
        code: resolvedCode,
        name: trimmedName,
        category: category || 'Other',
        description: description || null,
        sampleType: sampleType || 'Blood',
        containerType: containerType || 'Lavender (EDTA)',
        normalRange: normalRange || null,
        unit: unit || null,
        parametersJson: parametersJson || null,
        turnaroundHours: turnaroundHours ? Number(turnaroundHours) : 24,
        price: price ? Number(price) : 0,
        isFavorite: Boolean(isFavorite),
        defaultPriority: defaultPriority || 'ROUTINE',
        defaultFulfillment: defaultFulfillment || 'IN_HOUSE',
        isActive: true,
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

    const allowedRoles = ['SUPER_ADMIN', 'CLIENT', 'MANAGER', 'PATHOLOGIST'];
    if (!allowedRoles.includes(user.role)) {
      throw forbidden('You do not have permission to delete catalog items.');
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
