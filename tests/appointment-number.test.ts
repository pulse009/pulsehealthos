import { describe, expect, it, vi, beforeEach } from 'vitest';
import { i18n } from '@/lib/router/i18n';
import { createAppointment } from '@/lib/booking/booking.service';
import { prisma } from '@/lib/db/prisma';
import * as availService from '@/lib/booking/availability.service';
import * as schedulerModule from '@/lib/reminders/scheduler';
import type { TenantScope } from '@/lib/tenancy/scope';

describe('Unique Per-Clinic Appointment Number', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.systemLog, 'create').mockResolvedValue({} as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
    vi.spyOn(schedulerModule, 'scheduleRemindersFor').mockResolvedValue(0);
  });

  it('1. Formats English confirmation with Appointment Number', () => {
    const msg = i18n.en.booking_confirmed('Dental Checkup', 'Dr. Smith', 'Monday, Aug 27 at 2:00 PM', 1);
    expect(msg).toContain('• *Appointment Number:* AP-001');
    expect(msg).toContain('• *Service:* Dental Checkup');
    expect(msg).toContain('• *Doctor:* Dr. Smith');
  });

  it('2. Formats Arabic confirmation with Appointment Number', () => {
    const msg = i18n.ar.booking_confirmed('فحص الأسنان', 'د. سميث', 'الإثنين 27 أغسطس في 2:00 م', 5);
    expect(msg).toContain('• *رقم الموعد:* AP-005');
    expect(msg).toContain('• *الخدمة:* فحص الأسنان');
    expect(msg).toContain('• *الطبيب:* د. سميث');
  });

  it('3. Starts sequential appointment numbering from 1 for each clinic', async () => {
    const scopeClinicA: TenantScope = { kind: 'CLINIC', clinicId: 'clinic-A', actorUserId: 'user-1' };

    vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({
      id: 'clinic-A',
      timezone: 'Asia/Riyadh',
      isActive: true,
      settings: {
        defaultAppointmentMinutes: 30,
        defaultBufferMinutes: 0,
        slotGranularityMinutes: 15,
        minAdvanceBookingMinutes: 0,
        maxAdvanceBookingDays: 30,
        cancellationCutoffHours: 2,
        allowPatientCancellation: true,
        allowPatientReschedule: true,
        maxSlotsOfferedToAI: 5,
      },
    } as any);

    vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({
      id: 'doc-1',
      clinicId: 'clinic-A',
      name: 'Dr. Ahmad',
      isActive: true,
      appointmentMinutes: null,
      bufferMinutes: null,
    } as any);

    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'srv-1',
      clinicId: 'clinic-A',
      name: 'General Consultation',
      isActive: true,
      durationMinutes: 30,
      bufferMinutes: 0,
    } as any);

    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: 'pat-1',
      clinicId: 'clinic-A',
      name: 'John Doe',
      phone: '966500000001',
      lead: { id: 'lead-1' },
    } as any);

    vi.spyOn(prisma.doctorService, 'findUnique').mockResolvedValue({
      doctorId: 'doc-1',
      serviceId: 'srv-1',
      clinicId: 'clinic-A',
    } as any);

    vi.spyOn(availService, 'isSlotStillAvailable').mockResolvedValue(true);

    let capturedCreateData: any = null;
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const txMock = {
        patient: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'pat-1',
            clinicId: 'clinic-A',
            name: 'John Doe',
            phone: '966500000001',
            email: null,
            fileNumber: 1,
            userId: null,
          }),
          findFirst: vi.fn().mockResolvedValue(null),
          update: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 'u1' }),
        },
        appointment: {
          findFirst: vi.fn().mockResolvedValue(null), // Clinic A's first appointment => null
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            capturedCreateData = data;
            return {
              id: 'appt-1',
              clinicId: 'clinic-A',
              appointmentNumber: data.appointmentNumber,
              status: 'CONFIRMED',
              startsAt: data.startsAt,
              endsAt: data.endsAt,
              timezone: 'Asia/Riyadh',
              doctorId: 'doc-1',
              serviceId: 'srv-1',
              patientId: 'pat-1',
              notes: null,
              doctor: { id: 'doc-1', name: 'Dr. Ahmad' },
              service: { id: 'srv-1', name: 'General Consultation' },
              patient: { id: 'pat-1', name: 'John Doe', phone: '966500000001', email: null, fileNumber: 1 },
            };
          }),
        },
        lead: { update: vi.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const startsAt = new Date(Date.now() + 3600 * 1000 * 24); // tomorrow
    const result = await createAppointment(scopeClinicA, {
      clinicId: 'clinic-A',
      doctorId: 'doc-1',
      serviceId: 'srv-1',
      patientId: 'pat-1',
      startsAt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appointment.appointmentNumber).toBe(1);
      expect(capturedCreateData.appointmentNumber).toBe(1);
    }
  });

  it('4. Increments appointment number from the highest existing number in that clinic', async () => {
    const scopeClinicA: TenantScope = { kind: 'CLINIC', clinicId: 'clinic-A', actorUserId: 'user-1' };

    vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({
      id: 'clinic-A',
      timezone: 'Asia/Riyadh',
      isActive: true,
      settings: {
        defaultAppointmentMinutes: 30,
        defaultBufferMinutes: 0,
        slotGranularityMinutes: 15,
        minAdvanceBookingMinutes: 0,
        maxAdvanceBookingDays: 30,
        cancellationCutoffHours: 2,
        allowPatientCancellation: true,
        allowPatientReschedule: true,
        maxSlotsOfferedToAI: 5,
      },
    } as any);

    vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({
      id: 'doc-1',
      clinicId: 'clinic-A',
      name: 'Dr. Ahmad',
      isActive: true,
      appointmentMinutes: null,
      bufferMinutes: null,
    } as any);

    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'srv-1',
      clinicId: 'clinic-A',
      name: 'General Consultation',
      isActive: true,
      durationMinutes: 30,
      bufferMinutes: 0,
    } as any);

    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: 'pat-1',
      clinicId: 'clinic-A',
      name: 'John Doe',
      phone: '966500000001',
      lead: { id: 'lead-1' },
    } as any);

    vi.spyOn(prisma.doctorService, 'findUnique').mockResolvedValue({
      doctorId: 'doc-1',
      serviceId: 'srv-1',
      clinicId: 'clinic-A',
    } as any);

    vi.spyOn(availService, 'isSlotStillAvailable').mockResolvedValue(true);

    let capturedCreateData: any = null;
    vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
      const txMock = {
        patient: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'pat-1',
            clinicId: 'clinic-A',
            name: 'John Doe',
            phone: '966500000001',
            email: null,
            fileNumber: 1,
            userId: null,
          }),
          findFirst: vi.fn().mockResolvedValue({ fileNumber: 1 }),
          update: vi.fn().mockResolvedValue({}),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue(null),
          findFirst: vi.fn().mockResolvedValue(null),
          findMany: vi.fn().mockResolvedValue([]),
          create: vi.fn().mockResolvedValue({ id: 'u1' }),
        },
        appointment: {
          findFirst: vi.fn().mockResolvedValue({ appointmentNumber: 42 }), // Previous highest was 42
          create: vi.fn().mockImplementation(async ({ data }: any) => {
            capturedCreateData = data;
            return {
              id: 'appt-43',
              clinicId: 'clinic-A',
              appointmentNumber: data.appointmentNumber,
              status: 'CONFIRMED',
              startsAt: data.startsAt,
              endsAt: data.endsAt,
              timezone: 'Asia/Riyadh',
              doctorId: 'doc-1',
              serviceId: 'srv-1',
              patientId: 'pat-1',
              notes: null,
              doctor: { id: 'doc-1', name: 'Dr. Ahmad' },
              service: { id: 'srv-1', name: 'General Consultation' },
              patient: { id: 'pat-1', name: 'John Doe', phone: '966500000001', email: null, fileNumber: 1 },
            };
          }),
        },
        lead: { update: vi.fn().mockResolvedValue({}) },
      };
      return callback(txMock);
    });

    const startsAt = new Date(Date.now() + 3600 * 1000 * 24);
    const result = await createAppointment(scopeClinicA, {
      clinicId: 'clinic-A',
      doctorId: 'doc-1',
      serviceId: 'srv-1',
      patientId: 'pat-1',
      startsAt,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.appointment.appointmentNumber).toBe(43);
      expect(capturedCreateData.appointmentNumber).toBe(43);
    }
  });
});
