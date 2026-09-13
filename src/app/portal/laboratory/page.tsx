import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { LaboratoryStationView, type LabOrderItem, type LabCatalogItem } from '@/components/dashboard/lab/LaboratoryStationView';


export const metadata: Metadata = { title: 'Laboratory & Pathology - LIS Station' };
export const dynamic = 'force-dynamic';

export default async function LaboratoryPage() {
  const { user, clinicId } = await requireClientUser();

  const [clinic, orders, catalogTests, patients, doctors] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.labOrder.findMany({
      where: { clinicId: clinicId! },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
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
          },
        },
      },
    }),
    prisma.labTestCatalog.findMany({
      where: { clinicId: clinicId! },
      orderBy: { name: 'asc' },
    }),
    prisma.patient.findMany({
      where: { clinicId: clinicId! },
      select: { id: true, name: true, phone: true, fileNumber: true, gender: true },
      orderBy: { name: 'asc' },
      take: 200,
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  // Auto-seed catalog if empty
  let catalogItems = catalogTests;
  if (catalogItems.length === 0 && clinicId) {
    const DEFAULT_SEED_TESTS = [
      {
        code: 'CBC-01',
        name: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        sampleType: 'Whole Blood (EDTA)',
        containerType: 'Lavender (EDTA)',
        price: 120,
        turnaroundHours: 4,
        normalRange: 'See breakdown',
        parametersJson: [
          { name: 'Hemoglobin (Hb)', unit: 'g/dL', normalMin: 12.0, normalMax: 17.5, referenceRange: '12.0 - 17.5' },
          { name: 'WBC Count', unit: 'x10^3/uL', normalMin: 4.0, normalMax: 11.0, referenceRange: '4.0 - 11.0' },
          { name: 'Platelets', unit: 'x10^3/uL', normalMin: 150, normalMax: 450, referenceRange: '150 - 450' },
          { name: 'RBC Count', unit: 'x10^6/uL', normalMin: 4.2, normalMax: 5.9, referenceRange: '4.2 - 5.9' },
          { name: 'Hematocrit (PCV)', unit: '%', normalMin: 36.0, normalMax: 50.0, referenceRange: '36.0 - 50.0' },
        ],
      },
      {
        code: 'FBS-01',
        name: 'Fasting Blood Sugar (FBS)',
        category: 'Biochemistry',
        sampleType: 'Plasma (Fluoride)',
        containerType: 'Grey (Fluoride)',
        price: 60,
        turnaroundHours: 2,
        normalRange: '70 - 99 mg/dL',
        parametersJson: [
          { name: 'Fasting Glucose', unit: 'mg/dL', normalMin: 70, normalMax: 99, referenceRange: '70 - 99' },
        ],
      },
      {
        code: 'HBA1C-01',
        name: 'HbA1c (Glycated Hemoglobin)',
        category: 'Biochemistry',
        sampleType: 'Whole Blood (EDTA)',
        containerType: 'Lavender (EDTA)',
        price: 150,
        turnaroundHours: 4,
        normalRange: '< 5.7 %',
        parametersJson: [
          { name: 'HbA1c', unit: '%', normalMin: 4.0, normalMax: 5.6, referenceRange: '< 5.7' },
        ],
      },
      {
        code: 'LIPID-01',
        name: 'Lipid Profile',
        category: 'Biochemistry',
        sampleType: 'Serum',
        containerType: 'Yellow (SST Gel)',
        price: 180,
        turnaroundHours: 6,
        normalRange: 'See breakdown',
        parametersJson: [
          { name: 'Total Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 200, referenceRange: '< 200' },
          { name: 'Triglycerides', unit: 'mg/dL', normalMin: 0, normalMax: 150, referenceRange: '< 150' },
          { name: 'HDL Cholesterol', unit: 'mg/dL', normalMin: 40, normalMax: 60, referenceRange: '> 40 (M), > 50 (F)' },
          { name: 'LDL Cholesterol', unit: 'mg/dL', normalMin: 0, normalMax: 100, referenceRange: '< 100' },
        ],
      },
      {
        code: 'LFT-01',
        name: 'Liver Function Test (LFT)',
        category: 'Biochemistry',
        sampleType: 'Serum',
        containerType: 'Yellow (SST Gel)',
        price: 200,
        turnaroundHours: 6,
        normalRange: 'See breakdown',
        parametersJson: [
          { name: 'ALT (SGPT)', unit: 'U/L', normalMin: 7, normalMax: 56, referenceRange: '7 - 56' },
          { name: 'AST (SGOT)', unit: 'U/L', normalMin: 10, normalMax: 40, referenceRange: '10 - 40' },
          { name: 'Total Bilirubin', unit: 'mg/dL', normalMin: 0.1, normalMax: 1.2, referenceRange: '0.1 - 1.2' },
          { name: 'Alkaline Phosphatase (ALP)', unit: 'U/L', normalMin: 44, normalMax: 147, referenceRange: '44 - 147' },
        ],
      },
      {
        code: 'RFT-01',
        name: 'Renal Function Test (RFT)',
        category: 'Biochemistry',
        sampleType: 'Serum',
        containerType: 'Yellow (SST Gel)',
        price: 160,
        turnaroundHours: 4,
        normalRange: 'See breakdown',
        parametersJson: [
          { name: 'Serum Creatinine', unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2, referenceRange: '0.6 - 1.2' },
          { name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL', normalMin: 7, normalMax: 20, referenceRange: '7 - 20' },
          { name: 'Uric Acid', unit: 'mg/dL', normalMin: 3.5, normalMax: 7.2, referenceRange: '3.5 - 7.2' },
        ],
      },
      {
        code: 'URINE-01',
        name: 'Urine Routine Examination',
        category: 'Clinical Pathology',
        sampleType: 'Midstream Urine',
        containerType: 'Sterile Urine Cup',
        price: 70,
        turnaroundHours: 2,
        normalRange: 'Normal/Clear',
        parametersJson: [
          { name: 'Color / Appearance', unit: '', referenceRange: 'Pale Yellow / Clear' },
          { name: 'pH', unit: '', normalMin: 4.5, normalMax: 8.0, referenceRange: '4.5 - 8.0' },
          { name: 'Specific Gravity', unit: '', normalMin: 1.005, normalMax: 1.030, referenceRange: '1.005 - 1.030' },
          { name: 'Protein (Albumin)', unit: '', referenceRange: 'Negative' },
          { name: 'Glucose (Sugar)', unit: '', referenceRange: 'Negative' },
        ],
      },
      {
        code: 'ELEC-01',
        name: 'Serum Electrolytes (Na, K, Cl)',
        category: 'Biochemistry',
        sampleType: 'Serum',
        containerType: 'Yellow (SST Gel)',
        price: 140,
        turnaroundHours: 4,
        normalRange: 'See breakdown',
        parametersJson: [
          { name: 'Sodium (Na+)', unit: 'mmol/L', normalMin: 136, normalMax: 145, referenceRange: '136 - 145' },
          { name: 'Potassium (K+)', unit: 'mmol/L', normalMin: 3.5, normalMax: 5.1, referenceRange: '3.5 - 5.1' },
          { name: 'Chloride (Cl-)', unit: 'mmol/L', normalMin: 98, normalMax: 107, referenceRange: '98 - 107' },
        ],
      },
    ];

    try {
      await prisma.labTestCatalog.createMany({
        data: DEFAULT_SEED_TESTS.map((t) => ({
          clinicId: clinicId!,
          code: t.code,
          name: t.name,
          category: t.category,
          sampleType: t.sampleType,
          containerType: t.containerType,
          price: t.price,
          turnaroundHours: t.turnaroundHours,
          normalRange: t.normalRange,
          parametersJson: t.parametersJson,
          isActive: true,
          isFavorite: true,
        })),
        skipDuplicates: true,
      });

      catalogItems = await prisma.labTestCatalog.findMany({
        where: { clinicId: clinicId! },
        orderBy: { name: 'asc' },
      });
    } catch (e) {
      console.error('Failed to seed default catalog tests:', e);
    }
  }

  const activeCatalog: LabCatalogItem[] = catalogItems.map((t) => ({
    id: t.id,
    code: t.code,
    name: t.name,
    category: t.category,
    sampleType: t.sampleType,
    containerType: t.containerType,
    price: t.price,
    turnaroundHours: t.turnaroundHours,
    normalRange: t.normalRange,
    parametersJson: t.parametersJson,
  }));

  const formattedOrders: LabOrderItem[] = orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    patientId: o.patientId,
    doctorId: o.doctorId,
    encounterId: o.encounterId,
    testName: o.testName,
    category: o.category,
    sampleType: o.sampleType,
    tubeType: o.tubeType,
    specimenId: o.specimenId,
    priority: o.priority,
    status: o.status,
    fulfillmentLocation: o.fulfillmentLocation,
    instructions: o.instructions,
    clinicalNotes: o.clinicalNotes,
    price: o.price,
    resultsJson: (o.resultsJson as any) || null,
    resultsSummary: o.resultsSummary,
    hasAbnormalResults: Boolean(o.hasAbnormalResults),
    collectedAt: o.collectedAt ? o.collectedAt.toISOString() : null,
    collectedBy: o.collectedBy ? { id: o.collectedBy.id, name: o.collectedBy.name } : null,
    verifiedAt: o.verifiedAt ? o.verifiedAt.toISOString() : null,
    verifiedBy: o.verifiedBy ? { id: o.verifiedBy.id, name: o.verifiedBy.name } : null,
    createdAt: o.createdAt.toISOString(),
    patient: {
      id: o.patient.id,
      name: o.patient.name || 'Unnamed Patient',
      phone: o.patient.phone || '',
      fileNumber: o.patient.fileNumber,
      gender: o.patient.gender,
      tags: o.patient.tags || [],
    },
    doctor: o.doctor ? { id: o.doctor.id, name: o.doctor.name, specialty: o.doctor.specialty } : null,
    encounter: o.encounter
      ? {
          id: o.encounter.id,
          chiefComplaint: o.encounter.chiefComplaint,
          primaryDiagnosis: o.encounter.primaryDiagnosis,
        }
      : null,
  }));

  const formattedPatients = patients.map((p) => ({
    id: p.id,
    name: p.name || 'Unnamed Patient',
    phone: p.phone || '',
    fileNumber: p.fileNumber,
    gender: p.gender,
  }));

  return (
    <LaboratoryStationView
      clinicName={clinic?.name || 'Clinic Laboratory'}
      labTechName={user.name || user.email || 'Lab Technologist'}
      initialOrders={formattedOrders}
      catalogTests={activeCatalog}
      allPatients={formattedPatients}
      allDoctors={doctors}
    />
  );
}
