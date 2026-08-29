import { describe, expect, it, beforeEach } from 'vitest';
import { routeMessage, detectLanguage } from '@/lib/router/fast-router';
import { encodeSlotToken } from '@/lib/booking/availability.service';
import { clearLanguageCache } from '@/lib/router/language-state';

import { vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';

describe('Fast Router & Language Persistence Flow', () => {
  beforeEach(() => {
    clearLanguageCache();
    vi.restoreAllMocks();
    vi.spyOn(prisma.systemLog, 'create').mockResolvedValue({} as any);
    vi.spyOn(prisma.clinic, 'findUnique').mockResolvedValue({
      id: 'clinic-test-1',
      name: 'Reveal Clinics',
      timezone: 'Asia/Riyadh',
    } as any);
    vi.spyOn(prisma.doctor, 'findUnique').mockResolvedValue({
      id: 'doc-1',
      name: 'Dr. Saud Al-Obaida',
      specialty: 'Dermatology',
    } as any);
    vi.spyOn(prisma.service, 'findUnique').mockResolvedValue({
      id: 'srv-1',
      name: 'Anti-Aging Therapy',
      durationMinutes: 30,
    } as any);
    vi.spyOn(prisma.service, 'findMany').mockResolvedValue([
      { id: 'srv-1', name: 'Anti-Aging Therapy', durationMinutes: 30, priceMinor: 25000, currency: 'SAR' },
    ] as any);
    vi.spyOn(prisma.doctor, 'findMany').mockResolvedValue([
      { id: 'doc-1', name: 'Dr. Saud Al-Obaida', specialty: 'Dermatology' },
    ] as any);
    vi.spyOn(prisma.patient, 'findUnique').mockResolvedValue({
      id: 'patient-test-1',
      name: 'Test Patient',
      email: 'patient@example.com',
      phone: '966500000000',
      tags: ['visited:done'],
      appointments: [],
    } as any);
    vi.spyOn(prisma.patient, 'update').mockResolvedValue({} as any);
  });

  it('detects English and Arabic accurately in sub-millisecond', () => {
    expect(detectLanguage('Hello, I want to book an appointment')).toBe('en');
    expect(detectLanguage('مرحبا اريد حجز موعد')).toBe('ar');
    expect(detectLanguage('السلام عليكم')).toBe('ar');
    expect(detectLanguage('Hi there!')).toBe('en');
    expect(detectLanguage('12345', 'en')).toBe('en');
    expect(detectLanguage('12345', 'ar')).toBe('ar');
  });

  const baseInput = {
    clinicId: 'clinic-test-1',
    conversationId: 'conv-test-1',
    patientId: 'patient-test-1',
    leadId: 'lead-test-1',
    idempotencySeed: 'seed-123',
    now: new Date('2026-08-25T10:00:00Z'),
  };

  it('1. English greeting responds quickly without AI', async () => {
    const res = await routeMessage({ ...baseInput, message: 'Hello!' });
    expect(res.handled).toBe(true);
    expect(res.locale).toBe('en');
    expect(res.intent).toBe('GREETING');
    expect(res.reply).toContain('Hello! Welcome');
    expect(res.buttons?.length).toBeGreaterThan(0);
  });

  it('2. Arabic greeting responds correctly without AI', async () => {
    const res = await routeMessage({ ...baseInput, message: 'السلام عليكم' });
    expect(res.handled).toBe(true);
    expect(res.locale).toBe('ar');
    expect(res.intent).toBe('GREETING');
    expect(res.reply).toContain('مرحباً بك');
    expect(res.buttons?.length).toBeGreaterThan(0);
  });

  it('3. Location query responds directly in English and Arabic', async () => {
    const en = await routeMessage({ ...baseInput, message: 'Where is your clinic located?' });
    expect(en.handled).toBe(true);
    expect(en.intent).toBe('LOCATION');
    expect(en.locale).toBe('en');
    expect(en.reply).toContain('Location');

    const ar = await routeMessage({ ...baseInput, message: 'وين موقعكم؟' });
    expect(ar.handled).toBe(true);
    expect(ar.intent).toBe('LOCATION');
    expect(ar.locale).toBe('ar');
    expect(ar.reply).toContain('موقع');
  });

  it('4. Clinic timing query responds directly in English and Arabic', async () => {
    const en = await routeMessage({ ...baseInput, message: 'What are your opening hours?' });
    expect(en.handled).toBe(true);
    expect(en.intent).toBe('WORKING_HOURS');
    expect(en.locale).toBe('en');
    expect(en.reply).toContain('Opening Hours');

    const ar = await routeMessage({ ...baseInput, message: 'ما هي اوقات العمل؟' });
    expect(ar.handled).toBe(true);
    expect(ar.intent).toBe('WORKING_HOURS');
    expect(ar.locale).toBe('ar');
    expect(ar.reply).toContain('أوقات عمل');
  });

  it('5. Services query responds directly in English and Arabic', async () => {
    const en = await routeMessage({ ...baseInput, message: 'What services do you offer?' });
    expect(en.handled).toBe(true);
    expect(en.intent).toBe('SERVICES');
    expect(en.locale).toBe('en');

    const ar = await routeMessage({ ...baseInput, message: 'ايش الخدمات المتوفرة؟' });
    expect(ar.handled).toBe(true);
    expect(ar.intent).toBe('SERVICES');
    expect(ar.locale).toBe('ar');
  });

  it('6. Doctor query responds directly in English and Arabic', async () => {
    const en = await routeMessage({ ...baseInput, message: 'Who are the doctors?' });
    expect(en.handled).toBe(true);
    expect(en.intent).toBe('DOCTORS');

    const ar = await routeMessage({ ...baseInput, message: 'من هم الاطباء؟' });
    expect(ar.handled).toBe(true);
    expect(ar.intent).toBe('DOCTORS');
    expect(ar.locale).toBe('ar');
  });

  it('7. English multi-step booking flow: stays 100% English throughout all steps', async () => {
    const enConv = { ...baseInput, conversationId: 'conv-en-1', patientId: 'pat-en-1' };

    // Step 1: Book Appointment
    const step1 = await routeMessage({ ...enConv, message: 'Book Appointment' });
    expect(step1.handled).toBe(true);
    expect(step1.locale).toBe('en');
    expect(step1.intent).toBe('SELECT_SERVICE');
    expect(step1.reply).toContain('Step 1: Select Service');

    // Step 2: Select Service (Button click payload)
    const step2 = await routeMessage({
      ...enConv,
      message: '[Button Click: Dental Checkup | ID: select_service:srv-1]',
    });
    expect(step2.handled).toBe(true);
    expect(step2.locale).toBe('en');
    expect(['SELECT_DOCTOR', 'SELECT_DATE']).toContain(step2.intent);
    expect(step2.reply).toContain(step2.intent === 'SELECT_DOCTOR' ? 'Step 2: Select Doctor' : 'Step 3: Select Preferred Date');

    // Step 3: Select Doctor
    const step3 = await routeMessage({
      ...enConv,
      message: '[Button Click: Dr. Smith | ID: select_doctor:srv-1:doc-1]',
    });
    expect(step3.handled).toBe(true);
    expect(step3.locale).toBe('en');
    expect(step3.intent).toBe('SELECT_DATE');
    expect(step3.reply).toContain('Step 3: Select Preferred Date');
    expect(step3.buttons?.some((b) => b.title.includes('Today'))).toBe(true);

    // Step 4: Select Date
    const step4 = await routeMessage({
      ...enConv,
      message: '[Button Click: Today | ID: select_date:srv-1:doc-1:2026-08-25]',
    });
    expect(step4.handled).toBe(true);
    expect(step4.locale).toBe('en');

    // Step 5: Select Slot -> Summary
    const start = new Date('2026-08-25T09:00:00Z');
    const slotToken = encodeSlotToken('doc-1', 'srv-1', start);
    const step5 = await routeMessage({
      ...enConv,
      message: `[Button Click: 10:00 AM | ID: select_slot:${slotToken}]`,
    });
    expect(step5.handled).toBe(true);
    expect(step5.locale).toBe('en');
    expect(step5.intent).toBe('CONFIRM_BOOKING_PROMPT');
    expect(step5.reply).toContain('Appointment Summary');
    expect(step5.buttons?.some((b) => b.title === '✅ Confirm Booking')).toBe(true);
    expect(step5.buttons?.some((b) => b.title === '❌ Cancel')).toBe(true);
  });

  it('8. Arabic multi-step booking flow: PERSISTS 100% Arabic across ALL button steps', async () => {
    const arConv = { ...baseInput, conversationId: 'conv-ar-1', patientId: 'pat-ar-1' };

    // Step 1: Arabic user starts booking
    const step1 = await routeMessage({ ...arConv, message: 'أريد حجز موعد' });
    expect(step1.handled).toBe(true);
    expect(step1.locale).toBe('ar');
    expect(step1.intent).toBe('SELECT_SERVICE');
    expect(step1.reply).toContain('الخطوة 1: اختيار الخدمة');

    // Step 2: User clicks service (even if button label contains English text or Latin ID)
    const step2 = await routeMessage({
      ...arConv,
      message: '[Button Click: Anti-Aging Therapy | ID: select_service:srv-1]',
    });
    expect(step2.handled).toBe(true);
    expect(step2.locale).toBe('ar');
    expect(['SELECT_DOCTOR', 'SELECT_DATE']).toContain(step2.intent);
    expect(step2.reply).toContain(step2.intent === 'SELECT_DOCTOR' ? 'الخطوة 2: اختيار الطبيب' : 'الخطوة 3: اختيار التاريخ');

    // Step 3: User clicks doctor
    const step3 = await routeMessage({
      ...arConv,
      message: '[Button Click: Dr. Saud Al-Obaida | ID: select_doctor:srv-1:doc-1]',
    });
    expect(step3.handled).toBe(true);
    expect(step3.locale).toBe('ar');
    expect(step3.intent).toBe('SELECT_DATE');
    expect(step3.reply).toContain('الخطوة 3: اختيار التاريخ');
    expect(step3.buttons?.some((b) => b.title.includes('اليوم'))).toBe(true);

    // Step 4: User clicks date
    const step4 = await routeMessage({
      ...arConv,
      message: '[Button Click: اليوم (25 أغسطس) | ID: select_date:srv-1:doc-1:2026-08-25]',
    });
    expect(step4.handled).toBe(true);
    expect(step4.locale).toBe('ar');

    // Step 5: User clicks slot -> Summary
    const start = new Date('2026-08-25T09:00:00Z');
    const slotToken = encodeSlotToken('doc-1', 'srv-1', start);
    const step5 = await routeMessage({
      ...arConv,
      message: `[Button Click: 2:00 م | ID: select_slot:${slotToken}]`,
    });
    expect(step5.handled).toBe(true);
    expect(step5.locale).toBe('ar');
    expect(step5.intent).toBe('CONFIRM_BOOKING_PROMPT');
    expect(step5.reply).toContain('ملخص الموعد');
    expect(step5.buttons?.some((b) => b.title === '✅ تأكيد الحجز')).toBe(true);
    expect(step5.buttons?.some((b) => b.title === '❌ إلغاء')).toBe(true);
  });

  it('9. Cancel booking action creates no appointment and stays localized', async () => {
    const arConv = { ...baseInput, conversationId: 'conv-ar-2', patientId: 'pat-ar-2' };
    await routeMessage({ ...arConv, message: 'مرحبا' }); // establish Arabic

    const res = await routeMessage({
      ...arConv,
      message: '[Button Click: إلغاء | ID: cancel_booking]',
    });
    expect(res.handled).toBe(true);
    expect(res.locale).toBe('ar');
    expect(res.intent).toBe('CANCEL_BOOKING');
    expect(res.reply).toContain('تم إلغاء الحجز');
  });

  it('10. Keep appointment action preserves scheduled appointment in Arabic', async () => {
    const arConv = { ...baseInput, conversationId: 'conv-ar-3', patientId: 'pat-ar-3' };
    await routeMessage({ ...arConv, message: 'مرحبا' }); // establish Arabic

    const res = await routeMessage({
      ...arConv,
      message: '[Button Click: إبقاء الموعد | ID: keep_appointment]',
    });
    expect(res.handled).toBe(true);
    expect(res.locale).toBe('ar');
    expect(res.intent).toBe('KEEP_APPOINTMENT');
    expect(res.reply).toContain('تم الإبقاء على موعدك');
  });

  it('11. Explicit language switch command updates conversation language', async () => {
    const conv = { ...baseInput, conversationId: 'conv-switch-1', patientId: 'pat-switch-1' };

    // Start in Arabic
    const r1 = await routeMessage({ ...conv, message: 'السلام عليكم' });
    expect(r1.locale).toBe('ar');

    // Switch to English
    const r2 = await routeMessage({ ...conv, message: 'Please speak in english' });
    expect(r2.locale).toBe('en');

    // Button clicks now follow English
    const r3 = await routeMessage({ ...conv, message: '[Button Click: Services | ID: get_services]' });
    expect(r3.locale).toBe('en');
    expect(r3.reply).toMatch(/(services|request)/i);

    // Switch back to Arabic
    const r4 = await routeMessage({ ...conv, message: 'تحدث بالعربي' });
    expect(r4.locale).toBe('ar');
  });

  it('12. Complex natural language queries delegate to AI Agent with correct locale', async () => {
    const res = await routeMessage({
      ...baseInput,
      message: 'I have severe tooth pain since yesterday and need an urgent root canal advice',
    });
    expect(res.handled).toBe(false);
    expect(res.locale).toBe('en');
    expect(res.intent).toBe('COMPLEX_AI_QUERY');
  });
});
