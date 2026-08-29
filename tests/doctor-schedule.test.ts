import { describe, expect, it } from 'vitest';
import { computeAvailableSlots, type AvailabilityRequest } from '@/lib/booking/availability-core';
import { doctorSchema, doctorTimeOffSchema } from '@/lib/validation/schemas';

describe('Doctor Independent Scheduling & Availability Engine', () => {
  it('generates distinct slots for two doctors in the same clinic with different shifts', () => {
    const earliestStart = new Date('2026-09-01T00:00:00Z');
    const latestStart = new Date('2026-09-01T23:59:59Z');

    // Doctor A: Morning Shift 08:00 - 12:00 (480 - 720 minutes)
    const reqDoctorA: AvailabilityRequest = {
      timezone: 'UTC',
      dateKey: '2026-09-01',
      clinicWindows: [{ startMinute: 8 * 60, endMinute: 20 * 60 }],
      doctorWindows: [{ startMinute: 8 * 60, endMinute: 12 * 60 }],
      blockedWindows: [],
      isClosedAllDay: false,
      serviceDurationMinutes: 30,
      bufferMinutes: 0,
      granularityMinutes: 30,
      busy: [],
      earliestStart,
      latestStart,
    };

    // Doctor B: Evening Shift 14:00 - 18:00 (840 - 1080 minutes)
    const reqDoctorB: AvailabilityRequest = {
      timezone: 'UTC',
      dateKey: '2026-09-01',
      clinicWindows: [{ startMinute: 8 * 60, endMinute: 20 * 60 }],
      doctorWindows: [{ startMinute: 14 * 60, endMinute: 18 * 60 }],
      blockedWindows: [],
      isClosedAllDay: false,
      serviceDurationMinutes: 30,
      bufferMinutes: 0,
      granularityMinutes: 30,
      busy: [],
      earliestStart,
      latestStart,
    };

    const slotsA = computeAvailableSlots(reqDoctorA);
    const slotsB = computeAvailableSlots(reqDoctorB);

    expect(slotsA.length).toBe(8); // 8:00, 8:30, 9:00, 9:30, 10:00, 10:30, 11:00, 11:30
    expect(slotsA[0]?.start.toISOString()).toBe('2026-09-01T08:00:00.000Z');
    expect(slotsA[slotsA.length - 1]?.start.toISOString()).toBe('2026-09-01T11:30:00.000Z');

    expect(slotsB.length).toBe(8); // 14:00, 14:30, 15:00, 15:30, 16:00, 16:30, 17:00, 17:30
    expect(slotsB[0]?.start.toISOString()).toBe('2026-09-01T14:00:00.000Z');
    expect(slotsB[slotsB.length - 1]?.start.toISOString()).toBe('2026-09-01T17:30:00.000Z');
  });

  it('respects doctor lunch breaks and blocks slots during break window', () => {
    const earliestStart = new Date('2026-09-01T00:00:00Z');
    const latestStart = new Date('2026-09-01T23:59:59Z');

    // Shift 09:00 - 17:00, Break 13:00 - 14:00 (780 - 840 minutes)
    const reqWithBreak: AvailabilityRequest = {
      timezone: 'UTC',
      dateKey: '2026-09-01',
      clinicWindows: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
      doctorWindows: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
      blockedWindows: [{ startMinute: 13 * 60, endMinute: 14 * 60 }],
      isClosedAllDay: false,
      serviceDurationMinutes: 30,
      bufferMinutes: 0,
      granularityMinutes: 30,
      busy: [],
      earliestStart,
      latestStart,
    };

    const slots = computeAvailableSlots(reqWithBreak);
    const startIsoList = slots.map((s) => s.start.toISOString());

    // 13:00 and 13:30 should NOT be present
    expect(startIsoList).not.toContain('2026-09-01T13:00:00.000Z');
    expect(startIsoList).not.toContain('2026-09-01T13:30:00.000Z');
    expect(startIsoList).toContain('2026-09-01T12:30:00.000Z');
    expect(startIsoList).toContain('2026-09-01T14:00:00.000Z');
  });

  it('returns no slots when doctor is marked on all-day leave', () => {
    const earliestStart = new Date('2026-09-01T00:00:00Z');
    const latestStart = new Date('2026-09-01T23:59:59Z');

    const reqLeave: AvailabilityRequest = {
      timezone: 'UTC',
      dateKey: '2026-09-01',
      clinicWindows: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
      doctorWindows: [{ startMinute: 9 * 60, endMinute: 17 * 60 }],
      blockedWindows: [],
      isClosedAllDay: true, // Marked off all day
      serviceDurationMinutes: 30,
      bufferMinutes: 0,
      granularityMinutes: 30,
      busy: [],
      earliestStart,
      latestStart,
    };

    const slots = computeAvailableSlots(reqLeave);
    expect(slots).toEqual([]);
  });

  it('validates doctor schema with custom shifts, breaks and buffer overrides', () => {
    const validDoctor = {
      name: 'Dr. Michael Chang',
      specialty: 'Cardiologist',
      appointmentMinutes: 45,
      bufferMinutes: 15,
      serviceIds: ['service-1'],
      schedules: [
        { weekday: 1, startMinute: 540, endMinute: 1020 },
        { weekday: 3, startMinute: 540, endMinute: 1020 },
      ],
      breaks: [{ weekday: 1, startMinute: 780, endMinute: 840, label: 'Lunch' }],
    };

    const parsed = doctorSchema.safeParse(validDoctor);
    expect(parsed.success).toBe(true);
  });

  it('validates doctor time-off / date override schema', () => {
    const validTimeOff = {
      reason: 'Medical Conference',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
    };

    const parsed = doctorTimeOffSchema.safeParse(validTimeOff);
    expect(parsed.success).toBe(true);
  });
});
