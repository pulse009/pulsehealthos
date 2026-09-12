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

  const activeCatalog: LabCatalogItem[] = catalogTests as any;

  const formattedOrders: LabOrderItem[] = orders.map((o) => ({
    ...o,
    resultsJson: o.resultsJson as any,
    collectedAt: o.collectedAt ? o.collectedAt.toISOString() : null,
    verifiedAt: o.verifiedAt ? o.verifiedAt.toISOString() : null,
    createdAt: o.createdAt.toISOString(),
    patient: {
      ...o.patient,
      name: o.patient.name || 'Unnamed Patient',
    },
  }));

  const formattedPatients = patients.map((p) => ({
    ...p,
    name: p.name || 'Unnamed Patient',
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
