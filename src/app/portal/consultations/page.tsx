import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { toDateKey, startOfLocalDay, endOfLocalDay } from '@/lib/time/timezone';
import { DoctorConsultationDeskView, type ConsultationQueueItem } from '@/components/dashboard/consultations/DoctorConsultationDeskView';

export const metadata: Metadata = { title: 'Doctor Consultation Desk · EMR Workspace' };
export const dynamic = 'force-dynamic';

export default async function DoctorConsultationPage() {
  const { user, clinicId } = await requireClientUser();

  const timezone = 'Asia/Riyadh';
  const now = new Date();
  const todayKey = toDateKey(now, timezone);
  const todayStart = startOfLocalDay(todayKey, timezone);
  const todayEnd = endOfLocalDay(todayKey, timezone);

  const [clinic, doctors, appointments, existingEncounters] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: { id: true, name: true, specialty: true },
      orderBy: { name: 'asc' },
    }),
    prisma.appointment.findMany({
      where: {
        clinicId: clinicId!,
        startsAt: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { startsAt: 'asc' },
      include: {
        doctor: { select: { id: true, name: true, specialty: true } },
        service: { select: { id: true, name: true } },
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
        encounter: {
          select: {
            id: true,
            status: true,
            vitalsJson: true,
            primaryDiagnosis: true,
          },
        },
      },
    }),
    prisma.clinicalEncounter.findMany({
      where: {
        clinicId: clinicId!,
        startedAt: { gte: todayStart, lte: todayEnd },
      },
      include: {
        patient: true,
        doctor: true,
        appointment: { include: { service: true } },
      },
      orderBy: { startedAt: 'desc' },
    }),
  ]);

  // Build unified consultation queue
  const queueMap = new Map<string, ConsultationQueueItem>();

  // 1. Add from appointments
  appointments.forEach((apt) => {
    const p = apt.patient;
    const timeSlot = new Date(apt.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const allergies = p?.tags?.filter(t => t.toLowerCase().includes('allerg') || t.toLowerCase().includes('penicillin')) || [];

    let status: ConsultationQueueItem['status'] = 'WAITING';
    if (apt.encounter) {
      if (apt.encounter.status === 'COMPLETED') status = 'COMPLETED';
      else if (apt.encounter.status === 'IN_PROGRESS') status = 'IN_CONSULTATION';
    } else if (apt.status === 'COMPLETED') {
      status = 'COMPLETED';
    }

    const vitals = apt.encounter?.vitalsJson as ConsultationQueueItem['vitals'] || undefined;

    queueMap.set(apt.id, {
      id: apt.id,
      appointmentId: apt.id,
      encounterId: apt.encounter?.id,
      patientId: p?.id || apt.id,
      patientName: p?.name || 'Patient',
      fileNumber: p?.fileNumber,
      phone: p?.phone || 'N/A',
      gender: p?.gender,
      doctorId: apt.doctorId,
      doctorName: apt.doctor?.name || 'General Doctor',
      specialty: apt.doctor?.specialty,
      serviceName: apt.service?.name,
      timeSlot,
      status,
      triagePriority: 'NORMAL',
      allergies: allergies.length > 0 ? allergies : undefined,
      vitals,
      primaryDiagnosis: apt.encounter?.primaryDiagnosis,
    });
  });

  // 2. Add any standalone encounters
  existingEncounters.forEach((enc) => {
    if (enc.appointmentId && queueMap.has(enc.appointmentId)) {
      // already mapped
      return;
    }
    const p = enc.patient;
    const timeSlot = new Date(enc.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let status: ConsultationQueueItem['status'] = 'WAITING';
    if (enc.status === 'COMPLETED') status = 'COMPLETED';
    else if (enc.status === 'IN_PROGRESS') status = 'IN_CONSULTATION';

    queueMap.set(enc.id, {
      id: enc.id,
      appointmentId: enc.appointmentId || undefined,
      encounterId: enc.id,
      patientId: p.id,
      patientName: p.name || 'Patient',
      fileNumber: p.fileNumber,
      phone: p.phone,
      gender: p.gender,
      doctorId: enc.doctorId,
      doctorName: enc.doctor?.name || 'Attending Doctor',
      specialty: enc.doctor?.specialty,
      serviceName: enc.appointment?.service?.name,
      timeSlot,
      status,
      triagePriority: 'NORMAL',
      allergies: enc.allergies,
      vitals: enc.vitalsJson as any,
      primaryDiagnosis: enc.primaryDiagnosis,
    });
  });

  const initialQueue = Array.from(queueMap.values());

  return (
    <DoctorConsultationDeskView
      clinicName={clinic?.name || 'Clinic'}
      currentUserName={user.name || user.email || 'Doctor'}
      userRole={user.role}
      doctors={doctors}
      initialQueue={initialQueue}
    />
  );
}
