import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { toDateKey, startOfLocalDay, endOfLocalDay } from '@/lib/time/timezone';
import { NursePortalView, type NursePatientItem } from '@/components/dashboard/nurse/NursePortalView';

export const metadata: Metadata = { title: 'Nurse Station - Triage & Vitals' };
export const dynamic = 'force-dynamic';

export default async function NurseStationPage() {
  const { user, clinicId } = await requireClientUser();

  const timezone = 'Asia/Riyadh';
  const now = new Date();
  const todayKey = toDateKey(now, timezone);
  const todayStart = startOfLocalDay(todayKey, timezone);
  const todayEnd = endOfLocalDay(todayKey, timezone);

  const [clinic, appointments] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId: clinicId!,
        startsAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        appointmentNumber: true,
        startsAt: true,
        endsAt: true,
        status: true,
        notes: true,
        doctorId: true,
        patientId: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        service: { select: { id: true, name: true } },
        encounter: {
          select: {
            id: true,
            status: true,
            vitalsJson: true,
            allergies: true,
            chiefComplaint: true,
            updatedAt: true,
          },
        },
        patient: {
          select: {
            id: true,
            name: true,
            phone: true,
            fileNumber: true,
            gender: true,
            tags: true,
            notes: true,
          },
        },
      },
    }),
  ]);

  // Transform appointments into triage patient items
  const initialPatients: NursePatientItem[] = appointments.map((apt) => {
    const p = apt.patient;
    const timeSlot = new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const enc = apt.encounter;
    const vitalsData = enc?.vitalsJson ? (enc.vitalsJson as any) : undefined;
    const hasVitals = !!(vitalsData?.bpSystolic || vitalsData?.heartRate || vitalsData?.temperature);

    let status: NursePatientItem['status'] = 'WAITING';
    if (apt.status === 'COMPLETED' || enc?.status === 'COMPLETED') {
      status = 'COMPLETED';
    } else if (enc?.status === 'IN_PROGRESS' && hasVitals) {
      status = 'VITALS_DONE';
    } else if (apt.status === 'CONFIRMED' || apt.status === 'PENDING' || apt.status === 'CHECKED_IN') {
      status = hasVitals ? 'VITALS_DONE' : 'WAITING';
    }

    // Extract allergy tags if any (from encounter or patient tags)
    const patientAllergies = p?.tags?.filter(t => t.toLowerCase().includes('allerg') || t.toLowerCase().includes('penicillin') || t.toLowerCase().includes('asthma') || t.toLowerCase().includes('latex') || t.toLowerCase().includes('nsaid')) || [];
    const encounterAllergies = enc?.allergies || [];
    const combinedAllergies = Array.from(new Set([...patientAllergies, ...encounterAllergies]));

    return {
      id: p?.id || apt.id,
      patientId: p?.id || apt.patientId,
      doctorId: apt.doctorId || apt.doctor?.id,
      appointmentId: apt.id,
      name: p?.name || 'Walk-in Patient',
      fileNumber: p?.fileNumber,
      phone: p?.phone || 'N/A',
      gender: p?.gender,
      doctorName: apt.doctor ? `Dr. ${apt.doctor.name}` : undefined,
      serviceName: apt.service?.name,
      timeSlot,
      status,
      triagePriority: vitalsData?.triagePriority || 'NORMAL',
      allergies: combinedAllergies.length > 0 ? combinedAllergies : undefined,
      chiefComplaint: enc?.chiefComplaint || apt.notes || undefined,
      vitals: vitalsData
        ? {
            bpSystolic: vitalsData.bpSystolic ? Number(vitalsData.bpSystolic) : undefined,
            bpDiastolic: vitalsData.bpDiastolic ? Number(vitalsData.bpDiastolic) : undefined,
            heartRate: vitalsData.heartRate ? Number(vitalsData.heartRate) : undefined,
            temperature: vitalsData.temperature ? Number(vitalsData.temperature) : undefined,
            spo2: vitalsData.spo2 ? Number(vitalsData.spo2) : undefined,
            bloodSugar: vitalsData.bloodSugar ? Number(vitalsData.bloodSugar) : undefined,
            height: vitalsData.height ? Number(vitalsData.height) : undefined,
            weight: vitalsData.weight ? Number(vitalsData.weight) : undefined,
            bmi: vitalsData.bmi ? Number(vitalsData.bmi) : undefined,
            notes: vitalsData.notes || enc?.chiefComplaint || undefined,
            recordedAt: enc?.updatedAt
              ? new Date(enc.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : undefined,
          }
        : undefined,
    };
  });

  return (
    <NursePortalView
      clinicName={clinic?.name || 'Clinic'}
      nurseName={user.name || user.email || 'Staff Nurse'}
      initialPatients={initialPatients}
    />
  );
}
