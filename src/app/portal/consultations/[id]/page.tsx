import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { ClinicalEncounterRoomView, type ClinicalEncounterData } from '@/components/dashboard/consultations/ClinicalEncounterRoomView';

export const metadata: Metadata = { title: 'Clinical Encounter · Consultation Room' };
export const dynamic = 'force-dynamic';

export default async function ClinicalEncounterPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { user, clinicId } = await requireClientUser();
  const { id } = await props.params;

  const [clinic, encounter, pharmacyItems] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true },
    }),
    prisma.clinicalEncounter.findFirst({
      where: { id, clinicId: clinicId! },
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
        appointment: {
          select: {
            id: true,
            startsAt: true,
            service: { select: { name: true } },
          },
        },
      },
    }),
    prisma.inventoryItem.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        currentStock: true,
      },
      take: 100,
    }),
  ]);

  if (!encounter) {
    notFound();
  }

  // Fetch previous encounters for this patient
  const previousEncounters = await prisma.clinicalEncounter.findMany({
    where: {
      clinicId: clinicId!,
      patientId: encounter.patientId,
      id: { not: id },
      status: 'COMPLETED',
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
    include: {
      doctor: { select: { name: true } },
    },
  });

  const formattedEncounter: ClinicalEncounterData = {
    id: encounter.id,
    clinicId: encounter.clinicId,
    status: encounter.status as any,
    startedAt: encounter.startedAt.toISOString(),
    completedAt: encounter.completedAt ? encounter.completedAt.toISOString() : null,
    chiefComplaint: encounter.chiefComplaint,
    hpi: encounter.hpi,
    pastMedicalHistory: encounter.pastMedicalHistory,
    allergies: encounter.allergies,
    vitalsJson: encounter.vitalsJson as any,
    physicalExam: encounter.physicalExam as any,
    primaryDiagnosis: encounter.primaryDiagnosis,
    secondaryDiagnosis: encounter.secondaryDiagnosis,
    icd10Code: encounter.icd10Code,
    clinicalNotes: encounter.clinicalNotes,
    treatmentPlan: encounter.treatmentPlan,
    patientAdvice: encounter.patientAdvice,
    followUpDays: encounter.followUpDays,
    followUpDate: encounter.followUpDate ? encounter.followUpDate.toISOString() : null,
    prescriptionsJson: encounter.prescriptionsJson as any,
    labOrdersJson: encounter.labOrdersJson as any,
    patient: {
      id: encounter.patient.id,
      name: encounter.patient.name || 'Patient',
      phone: encounter.patient.phone,
      fileNumber: encounter.patient.fileNumber,
      gender: encounter.patient.gender,
      tags: encounter.patient.tags,
    },
    doctor: {
      id: encounter.doctor.id,
      name: encounter.doctor.name,
      specialty: encounter.doctor.specialty,
    },
    appointment: encounter.appointment ? {
      id: encounter.appointment.id,
      startsAt: encounter.appointment.startsAt.toISOString(),
      service: encounter.appointment.service,
    } : null,
  };

  return (
    <ClinicalEncounterRoomView
      initialEncounter={formattedEncounter}
      clinicName={clinic?.name || 'Clinic'}
      previousEncounters={previousEncounters}
      pharmacyItems={pharmacyItems}
      userRole={user.role}
    />
  );
}
