import type { Metadata } from 'next';
import { requireClientUser } from '@/lib/auth/guards';
import { prisma } from '@/lib/db/prisma';
import { formatTime, toDateKey, startOfLocalDay, endOfLocalDay } from '@/lib/time/timezone';
import {
  AppointmentsScheduleDashboard,
  type AppointmentItem,
} from '@/components/dashboard/AppointmentsScheduleDashboard';

export const metadata: Metadata = { title: 'Appointments Schedule' };
export const dynamic = 'force-dynamic';

export default async function PortalAppointmentsPage() {
  const { clinicId } = await requireClientUser();

  const timezone = 'Asia/Riyadh';
  const now = new Date();
  const todayKey = toDateKey(now, timezone);
  const todayStart = startOfLocalDay(todayKey, timezone);
  const todayEnd = endOfLocalDay(todayKey, timezone);

  // Fetch all dashboard data concurrently in a single parallel batch
  const [
    clinic,
    rawAppointments,
    rawServices,
    rawDoctors,
    todaysAppointmentsCount,
    pendingConfirmationsCount,
    cancellationsTodayCount,
  ] = await Promise.all([
    prisma.clinic.findUnique({
      where: { id: clinicId! },
      select: { name: true, timezone: true },
    }),
    prisma.appointment.findMany({
      where: { clinicId: clinicId! },
      orderBy: { startsAt: 'desc' },
      take: 100,
      select: {
        id: true,
        appointmentNumber: true,
        startsAt: true,
        endsAt: true,
        status: true,
        timezone: true,
        doctor: { select: { id: true, name: true, specialty: true } },
        service: { select: { id: true, name: true } },
        patient: { select: { id: true, name: true, phone: true, email: true, fileNumber: true } },
      },
    }),
    prisma.service.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: {
        id: true,
        name: true,
        doctors: {
          select: {
            doctor: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.doctor.findMany({
      where: { clinicId: clinicId!, isActive: true },
      select: {
        id: true,
        name: true,
        specialty: true,
        services: {
          select: {
            service: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinicId!,
        startsAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinicId!,
        status: 'PENDING',
      },
    }),
    prisma.appointment.count({
      where: {
        clinicId: clinicId!,
        status: 'CANCELLED',
        startsAt: { gte: todayStart, lt: todayEnd },
      },
    }),
  ]);

  const effectiveTimezone = clinic?.timezone ?? timezone;

  // Build bidirectional mappings for cascading filters
  const serviceDoctorMap: Record<string, string[]> = {};
  for (const s of rawServices) {
    serviceDoctorMap[s.name] = s.doctors.map((d) => d.doctor.name);
  }

  const doctorServiceMap: Record<string, string[]> = {};
  for (const d of rawDoctors) {
    doctorServiceMap[d.name] = d.services.map((s) => s.service.name);
  }

  // Map real database records into dashboard appointment items
  const initialAppointments: AppointmentItem[] = rawAppointments.map((app) => {
    const formattedTime = formatTime(app.startsAt, app.timezone || effectiveTimezone);
    const dayOfMonth = Number(toDateKey(app.startsAt, app.timezone || effectiveTimezone).slice(-2));

    let statusLabel: 'Confirmed' | 'In Progress' | 'Pending' | 'Cancelled' = 'Confirmed';
    if (app.status === 'PENDING') statusLabel = 'Pending';
    else if (app.status === 'CANCELLED') statusLabel = 'Cancelled';
    else if (app.status === 'CONFIRMED' || app.status === 'COMPLETED') statusLabel = 'Confirmed';
    else statusLabel = 'Confirmed';

    return {
      id: app.id,
      appointmentNumber: app.appointmentNumber,
      fileNumber: app.patient.fileNumber,
      time: formattedTime,
      patientName: app.patient.name || 'Patient',
      patientDetails: app.patient.phone,
      department: app.service.name,
      doctor: app.doctor.name,
      status: statusLabel,
      date: dayOfMonth,
      rawStartsAt: app.startsAt.toISOString(),
    };
  });

  const departmentNames = rawServices.map((s) => s.name);
  const doctorNames = rawDoctors.map((d) => d.name);

  return (
    <AppointmentsScheduleDashboard
      clinicId={clinicId!}
      clinicName={clinic?.name ?? 'Clinic'}
      timezone={effectiveTimezone}
      initialAppointments={initialAppointments}
      departments={
        departmentNames.length > 0
          ? departmentNames
          : ['General Checkup', 'Cardiology', 'Dental', 'Orthopedic', 'Neurology']
      }
      doctors={
        doctorNames.length > 0 ? doctorNames : ['Dr. Marwan Al-Haddad', 'Dr. Anil Patel', 'Dr. Chen']
      }
      serviceDoctorMap={serviceDoctorMap}
      doctorServiceMap={doctorServiceMap}
      servicesList={rawServices.map((s) => ({
        id: s.id,
        name: s.name,
        doctorIds: s.doctors.map((d) => d.doctor.id),
      }))}
      doctorsList={rawDoctors.map((d) => ({
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        serviceIds: d.services.map((s) => s.service.id),
      }))}
      metrics={{
        todaysCount: todaysAppointmentsCount,
        pendingCount: pendingConfirmationsCount,
        cancellationsCount: cancellationsTodayCount,
      }}
    />
  );
}
