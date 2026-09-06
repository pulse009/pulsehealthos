import { describe, expect, it, vi, beforeEach } from 'vitest';
import { i18n } from '@/lib/router/i18n';
import { routeMessage } from '@/lib/router/fast-router';
import { createAppointment } from '@/lib/booking/booking.service';
import { generateTemporaryPassword, ensurePatientUserAccount } from '@/lib/auth/patient-account';
import { prisma } from '@/lib/db/prisma';
import * as availService from '@/lib/booking/availability.service';
import * as schedulerModule from '@/lib/reminders/scheduler';
import type { TenantScope } from '@/lib/tenancy/scope';

describe('Patient Onboarding, File Numbering & Portal Account Creation Flow', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(prisma.systemLog, 'create').mockResolvedValue({} as any);
    vi.spyOn(prisma.auditLog, 'create').mockResolvedValue({} as any);
    vi.spyOn(schedulerModule, 'scheduleRemindersFor').mockResolvedValue(0);
  });

  describe('1. Temporary Password & Patient User Account Provisioning', () => {
    it('generates a secure 12-char temporary password meeting policy', () => {
      const pwd = generateTemporaryPassword();
      expect(pwd.length).toBeGreaterThanOrEqual(12);
      expect(/[A-Z]/.test(pwd)).toBe(true);
      expect(/[a-z]/.test(pwd)).toBe(true);
      expect(/[0-9]/.test(pwd)).toBe(true);
    });

    it('creates a new PATIENT user account when none exists', async () => {
      let createdUserData: any = null;
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        phone: '966500000001',
        email: 'sara@example.com',
        fileNumber: 1,
        userId: null,
      } as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.user, 'findMany').mockResolvedValue([]);
      (vi.spyOn(prisma.user, 'create') as any).mockImplementation(async ({ data }: any) => {
        createdUserData = data;
        return { id: 'user-pat-1', ...data };
      });
      vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const result = await ensurePatientUserAccount(
        'clinic-1',
        'pat-1',
        'sara@example.com',
        'Sara Ahmed',
      );

      expect(result).not.toBeNull();
      expect(result?.isNewAccount).toBe(true);
      expect(result?.email).toBe('sara@example.com');
      expect(result?.temporaryPassword).toBeDefined();
      expect(createdUserData.role).toBe('PATIENT');
      expect(createdUserData.clinicId).toBe('clinic-1');
    });

    it('links existing user account without generating new password', async () => {
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        phone: '966500000001',
        email: 'sara@example.com',
        fileNumber: 1,
        userId: 'existing-user-1',
        user: { id: 'existing-user-1', email: 'sara@example.com', username: 'PA-001' },
      } as any);
      vi.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'existing-user-1',
        email: 'sara@example.com',
        username: 'PA-001',
        role: 'PATIENT',
        clinicId: 'clinic-1',
      } as any);
      vi.spyOn(prisma.user, 'findFirst').mockResolvedValue({
        id: 'existing-user-1',
        email: 'sara@example.com',
        username: 'PA-001',
      } as any);
      vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const result = await ensurePatientUserAccount(
        'clinic-1',
        'pat-1',
        'sara@example.com',
        'Sara Ahmed',
      );

      expect(result).not.toBeNull();
      expect(result?.isNewAccount).toBe(false);
      expect(result?.temporaryPassword).toBeUndefined();
      expect(result?.userId).toBe('existing-user-1');
    });
  });

  describe('2. Sequential File Number & Multi-Appointment Linking', () => {
    it('assigns unique sequential fileNumber starting from 1 for new patient', async () => {
      const scope: TenantScope = { kind: 'CLINIC', clinicId: 'clinic-1', actorUserId: 'user-1' };

      vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({
        id: 'clinic-1',
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
        clinicId: 'clinic-1',
        name: 'Dr. Ahmad',
        isActive: true,
        appointmentMinutes: null,
        bufferMinutes: null,
      } as any);

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
        id: 'srv-1',
        clinicId: 'clinic-1',
        name: 'Facial',
        isActive: true,
        durationMinutes: 30,
        bufferMinutes: 0,
      } as any);

      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        clinicId: 'clinic-1',
        name: 'Sara',
        phone: '966500000001',
        email: 'sara@example.com',
        fileNumber: null, // First booking => fileNumber not assigned yet
        lead: { id: 'lead-1' },
      } as any);

      vi.spyOn(prisma.doctorService, 'findUnique').mockResolvedValue({
        doctorId: 'doc-1',
        serviceId: 'srv-1',
        clinicId: 'clinic-1',
      } as any);

      vi.spyOn(availService, 'isSlotStillAvailable').mockResolvedValue(true);

      const capturedPatientUpdates: any[] = [];
      let createdAppointmentData: any = null;

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          patient: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'pat-1',
              phone: '966500000001',
              email: 'sara@example.com',
              fileNumber: 1,
              userId: null,
            }),
            findFirst: vi.fn().mockResolvedValue(null), // First patient in clinic => next file number = 1
            update: vi.fn().mockImplementation(async ({ data }: any) => {
              capturedPatientUpdates.push(data);
              return { id: 'pat-1', fileNumber: data.fileNumber };
            }),
          },
          appointment: {
            findFirst: vi.fn().mockResolvedValue(null), // First appointment in clinic => next appt number = 1
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              createdAppointmentData = data;
              return {
                id: 'appt-1',
                clinicId: 'clinic-1',
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
                service: { id: 'srv-1', name: 'Facial' },
                patient: {
                  id: 'pat-1',
                  name: 'Sara',
                  phone: '966500000001',
                  email: 'sara@example.com',
                  fileNumber: 1,
                },
              };
            }),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue(null),
            findFirst: vi.fn().mockResolvedValue(null),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn().mockResolvedValue({ id: 'user-1', email: 'sara@example.com', role: 'PATIENT' }),
          },
          lead: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const startsAt = new Date(Date.now() + 3600 * 1000 * 24);
      const result = await createAppointment(scope, {
        clinicId: 'clinic-1',
        doctorId: 'doc-1',
        serviceId: 'srv-1',
        patientId: 'pat-1',
        startsAt,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.appointment.fileNumber).toBe(1);
        expect(result.appointment.appointmentNumber).toBe(1);
        expect(capturedPatientUpdates.some((u) => u.fileNumber === 1)).toBe(true);
        expect(createdAppointmentData.appointmentNumber).toBe(1);
      }
    });

    it('attaches second appointment to the same fileNumber', async () => {
      const scope: TenantScope = { kind: 'CLINIC', clinicId: 'clinic-1', actorUserId: 'user-1' };

      vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({
        id: 'clinic-1',
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
        clinicId: 'clinic-1',
        name: 'Dr. Ahmad',
        isActive: true,
        appointmentMinutes: null,
        bufferMinutes: null,
      } as any);

      vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
        id: 'srv-1',
        clinicId: 'clinic-1',
        name: 'Facial',
        isActive: true,
        durationMinutes: 30,
        bufferMinutes: 0,
      } as any);

      // Patient already has fileNumber = 1
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-1',
        clinicId: 'clinic-1',
        name: 'Sara',
        phone: '966500000001',
        email: 'sara@example.com',
        fileNumber: 1,
        lead: { id: 'lead-1' },
      } as any);

      vi.spyOn(prisma.doctorService, 'findUnique').mockResolvedValue({
        doctorId: 'doc-1',
        serviceId: 'srv-1',
        clinicId: 'clinic-1',
      } as any);

      vi.spyOn(availService, 'isSlotStillAvailable').mockResolvedValue(true);

      vi.spyOn(prisma, '$transaction').mockImplementation(async (callback: any) => {
        const txMock = {
          patient: {
            findUnique: vi.fn().mockResolvedValue({
              id: 'pat-1',
              clinicId: 'clinic-1',
              name: 'Sara',
              phone: '966500000001',
              email: 'sara@example.com',
              fileNumber: 1,
              userId: 'user-1',
              user: { id: 'user-1', email: 'sara@example.com', username: 'PA-001' },
            }),
            findFirst: vi.fn(),
            update: vi.fn(),
          },
          appointment: {
            findFirst: vi.fn().mockResolvedValue({ appointmentNumber: 1 }), // Last was #1 => next is #2
            create: vi.fn().mockImplementation(async ({ data }: any) => {
              return {
                id: 'appt-2',
                clinicId: 'clinic-1',
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
                service: { id: 'srv-1', name: 'Facial' },
                patient: {
                  id: 'pat-1',
                  name: 'Sara',
                  phone: '966500000001',
                  email: 'sara@example.com',
                  fileNumber: 1, // Stays #1
                },
              };
            }),
          },
          user: {
            findUnique: vi.fn().mockResolvedValue({ id: 'user-1', email: 'sara@example.com', username: 'PA-001', role: 'PATIENT' }),
            findFirst: vi.fn().mockResolvedValue({ id: 'user-1', email: 'sara@example.com', username: 'PA-001' }),
            findMany: vi.fn().mockResolvedValue([]),
            create: vi.fn(),
          },
          lead: { update: vi.fn().mockResolvedValue({}) },
        };
        return callback(txMock);
      });

      const startsAt = new Date(Date.now() + 3600 * 1000 * 24);
      const result = await createAppointment(scope, {
        clinicId: 'clinic-1',
        doctorId: 'doc-1',
        serviceId: 'srv-1',
        patientId: 'pat-1',
        startsAt,
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.appointment.fileNumber).toBe(1);
        expect(result.appointment.appointmentNumber).toBe(2);
      }
    });
  });

  describe('3. Fast Router Onboarding & Visited Flow', () => {
    it('prompts first-time caller with language selection first, then "Have you visited before?"', async () => {
      vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({ id: 'clinic-1', name: 'Reveal Clinics' } as any);
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-new',
        tags: [],
        appointments: [],
      } as any);

      // Step 1: First message shows language selection
      const resLang = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-new',
        leadId: 'lead-1',
        message: 'Hello',
        idempotencySeed: 'msg-1',
      });

      expect(resLang.handled).toBe(true);
      expect(resLang.intent).toBe('LANGUAGE_SELECT_PROMPT');
      expect(resLang.buttons).toEqual([
        { id: 'select_language:en', title: '🇬🇧 English' },
        { id: 'select_language:ar', title: '🇸🇦 العربية' },
      ]);

      // Step 2: Language selected -> prompts with visited before
      const resVisited = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-new',
        leadId: 'lead-1',
        message: '[Button Click: English | ID: select_language:en]',
        idempotencySeed: 'msg-1b',
      });

      expect(resVisited.handled).toBe(true);
      expect(resVisited.intent).toBe('VISITED_BEFORE_PROMPT');
      expect(resVisited.reply).toContain('Have you visited our clinic before?');
      expect(resVisited.buttons).toEqual([
        { id: 'visited_before:yes', title: 'Yes' },
        { id: 'visited_before:no', title: 'No, First Visit' },
      ]);
    });

    it('handles visited_before:no for new patient and shows booking options', async () => {
      vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({ id: 'clinic-1', name: 'Reveal Clinics' } as any);
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({ id: 'pat-new', tags: ['lang:en'] } as any);
      const updateSpy = vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const res = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-new',
        leadId: 'lead-1',
        message: 'visited_before:no',
        idempotencySeed: 'msg-2',
      });

      expect(res.handled).toBe(true);
      expect(res.intent).toBe('VISITED_NEW_PATIENT');
      expect(res.reply).toContain('first appointment');
      expect(res.buttons?.some((b) => b.id === 'book_appointment')).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { tags: expect.arrayContaining(['visited:done', 'visited:no']) },
        }),
      );
    });

    it('handles visited_before:yes by asking returning patient for file number', async () => {
      vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({ id: 'clinic-1', name: 'Reveal Clinics' } as any);
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({ id: 'pat-ret', tags: [] } as any);
      const updateSpy = vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const res = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-ret',
        leadId: 'lead-1',
        message: 'visited_before:yes',
        idempotencySeed: 'msg-3',
      });

      expect(res.handled).toBe(true);
      expect(res.intent).toBe('ASK_FILE_NUMBER');
      expect(res.reply).toContain('Patient ID');
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { tags: expect.arrayContaining(['awaiting:file_number', 'visited:yes']) },
        }),
      );
    });

    it('matches existing file number, links conversation and greets patient', async () => {
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-placeholder',
        tags: ['awaiting:file_number'],
      } as any);

      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue({
        id: 'pat-existing-1',
        clinicId: 'clinic-1',
        name: 'Sara Ahmed',
        phone: '966500000001',
        email: 'sara@example.com',
        fileNumber: 1,
        tags: ['visited:done'],
      } as any);

      const convUpdateSpy = vi.spyOn(prisma.conversation, 'update').mockResolvedValue({} as any);
      vi.spyOn(prisma.lead, 'updateMany').mockResolvedValue({ count: 1 } as any);
      vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const res = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-placeholder',
        leadId: 'lead-1',
        message: '#1',
        idempotencySeed: 'msg-4',
      });

      expect(res.handled).toBe(true);
      expect(res.intent).toBe('FILE_NUMBER_MATCHED');
      expect(res.reply).toContain('Sara Ahmed');
      expect(res.reply).toContain('PID-0001');
      expect(convUpdateSpy).toHaveBeenCalledWith({
        where: { id: 'conv-1' },
        data: { patientId: 'pat-existing-1' },
      });
      expect(res.buttons?.some((b) => b.id === 'book_appointment')).toBe(true);
    });

    it('handles non-existent file number and offers booking as new or escalation', async () => {
      vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
        id: 'pat-placeholder',
        tags: ['awaiting:file_number'],
      } as any);

      vi.spyOn(prisma.patient, 'findFirst').mockResolvedValue(null);
      vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);

      const res = await routeMessage({
        clinicId: 'clinic-1',
        conversationId: 'conv-1',
        patientId: 'pat-placeholder',
        leadId: 'lead-1',
        message: '9999',
        idempotencySeed: 'msg-5',
      });

      expect(res.handled).toBe(true);
      expect(res.intent).toBe('FILE_NUMBER_NOT_FOUND');
      expect(res.reply).toContain('9999');
      expect(res.buttons).toEqual([
        { id: 'book_new', title: '📅 Book as New Patient' },
        { id: 'human_escalation', title: '👨‍💼 Speak to Staff' },
      ]);
    });
  });

  describe('4. Confirmation Messaging with File # and Appt #', () => {
    it('formats English confirmation with File Number and Appointment Number', () => {
      const msg = i18n.en.booking_confirmed(
        'Deep Cleansing Facial',
        'Dr. Ahmad',
        'Monday, Aug 27 at 2:00 PM',
        1,
        1,
      );

      expect(msg).toContain('Your Patient ID is PID-0001');
      expect(msg).toContain('• *Appointment Number:* AP-001');
      expect(msg).toContain('• *Service:* Deep Cleansing Facial');
      expect(msg).toContain('• *Doctor:* Dr. Ahmad');
      expect(msg).toContain('We look forward to welcoming you!');
    });

    it('formats Arabic confirmation with File Number and Appointment Number', () => {
      const msg = i18n.ar.booking_confirmed(
        'تنظيف البشرة',
        'د. أحمد',
        'الإثنين 27 أغسطس في 2:00 م',
        1,
        1,
      );

      expect(msg).toContain('رقم ملفك الطبي هو PID-0001');
      expect(msg).toContain('• *رقم الموعد:* AP-001');
      expect(msg).toContain('• *الخدمة:* تنظيف البشرة');
      expect(msg).toContain('• *الطبيب:* د. أحمد');
      expect(msg).toContain('يسعدنا حضوركم ونتمنى لكم دوام الصحة والعافية.');
    });
  });
});
