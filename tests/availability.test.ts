import { describe, expect, it } from 'vitest';
import {
  computeAvailableSlots,
  computeWorkingWindows,
  intersectWindows,
  normalizeWindows,
  subtractWindows,
  isSlotAvailable,
  type AvailabilityRequest,
} from '@/lib/booking/availability-core';
import { localMinutesToInstant } from '@/lib/time/timezone';

/**
 * Availability engine.
 *
 * These are the rules the AI is not allowed to bend, so they are tested against
 * the pure engine rather than through the database — every case here is a
 * scheduling decision, not a persistence detail.
 */

const LONDON = 'Europe/London';
// 2026-03-02 is a Monday.
const MONDAY = '2026-03-02';

const at = (dateKey: string, minutes: number, tz = LONDON): Date => {
  const instant = localMinutesToInstant(dateKey, minutes, tz);
  if (!instant) throw new Error(`No such local time: ${dateKey} +${minutes}`);
  return instant;
};

const hm = (h: number, m = 0) => h * 60 + m;

function request(overrides: Partial<AvailabilityRequest> = {}): AvailabilityRequest {
  return {
    timezone: LONDON,
    dateKey: MONDAY,
    clinicWindows: [{ startMinute: hm(9), endMinute: hm(19) }],
    doctorWindows: [
      { startMinute: hm(9), endMinute: hm(13) },
      { startMinute: hm(15), endMinute: hm(19) },
    ],
    blockedWindows: [],
    isClosedAllDay: false,
    serviceDurationMinutes: 30,
    bufferMinutes: 0,
    granularityMinutes: 30,
    busy: [],
    // Far enough in the past/future that window rules don't interfere unless tested.
    earliestStart: new Date('2020-01-01T00:00:00Z'),
    latestStart: new Date('2030-01-01T00:00:00Z'),
    ...overrides,
  };
}

const startTimes = (req: AvailabilityRequest) =>
  computeAvailableSlots(req).map((s) => s.startMinute);

describe('window algebra', () => {
  it('merges overlapping and adjacent windows', () => {
    expect(
      normalizeWindows([
        { startMinute: 540, endMinute: 600 },
        { startMinute: 600, endMinute: 660 },
        { startMinute: 580, endMinute: 590 },
      ]),
    ).toEqual([{ startMinute: 540, endMinute: 660 }]);
  });

  it('discards zero-length and inverted windows', () => {
    expect(
      normalizeWindows([
        { startMinute: 600, endMinute: 600 },
        { startMinute: 700, endMinute: 650 },
      ]),
    ).toEqual([]);
  });

  it('intersects two sets', () => {
    expect(
      intersectWindows(
        [{ startMinute: hm(9), endMinute: hm(17) }],
        [
          { startMinute: hm(8), endMinute: hm(12) },
          { startMinute: hm(16), endMinute: hm(20) },
        ],
      ),
    ).toEqual([
      { startMinute: hm(9), endMinute: hm(12) },
      { startMinute: hm(16), endMinute: hm(17) },
    ]);
  });

  it('splits a window when a cut lands in the middle', () => {
    expect(
      subtractWindows(
        [{ startMinute: hm(9), endMinute: hm(17) }],
        [{ startMinute: hm(13), endMinute: hm(14) }],
      ),
    ).toEqual([
      { startMinute: hm(9), endMinute: hm(13) },
      { startMinute: hm(14), endMinute: hm(17) },
    ]);
  });

  it('intersects clinic hours with doctor hours and removes breaks', () => {
    const windows = computeWorkingWindows(
      request({
        clinicWindows: [{ startMinute: hm(10), endMinute: hm(16) }],
        doctorWindows: [{ startMinute: hm(9), endMinute: hm(19) }],
        blockedWindows: [{ startMinute: hm(12), endMinute: hm(13) }],
      }),
    );
    expect(windows).toEqual([
      { startMinute: hm(10), endMinute: hm(12) },
      { startMinute: hm(13), endMinute: hm(16) },
    ]);
  });
});

describe('slot generation', () => {
  it('generates slots across a split shift', () => {
    const slots = startTimes(request());
    // 09:00–13:00 gives 8 half-hour starts; 15:00–19:00 gives 8 more.
    expect(slots).toHaveLength(16);
    expect(slots[0]).toBe(hm(9));
    expect(slots.at(-1)).toBe(hm(18, 30));
    // Nothing during the 13:00–15:00 gap.
    expect(slots.filter((m) => m >= hm(13) && m < hm(15))).toEqual([]);
  });

  it('never offers an appointment that would run past the end of a window', () => {
    const slots = startTimes(request({ serviceDurationMinutes: 45, granularityMinutes: 15 }));
    // A 45-minute appointment cannot start after 12:15 in the 09:00–13:00 block.
    expect(slots).toContain(hm(12, 15));
    expect(slots).not.toContain(hm(12, 30));
  });

  it('does not let an appointment straddle a break', () => {
    const slots = startTimes(
      request({
        doctorWindows: [{ startMinute: hm(9), endMinute: hm(17) }],
        blockedWindows: [{ startMinute: hm(13), endMinute: hm(14) }],
        serviceDurationMinutes: 60,
        granularityMinutes: 30,
      }),
    );
    expect(slots).toContain(hm(12));
    // 12:30–13:30 would cross into the break.
    expect(slots).not.toContain(hm(12, 30));
    expect(slots).toContain(hm(14));
  });

  it('returns nothing when the doctor is not working that day', () => {
    expect(startTimes(request({ doctorWindows: [] }))).toEqual([]);
  });

  it('returns nothing on a holiday or full closure', () => {
    expect(startTimes(request({ isClosedAllDay: true }))).toEqual([]);
  });

  it('returns nothing when clinic hours and doctor hours do not overlap', () => {
    expect(
      startTimes(
        request({
          clinicWindows: [{ startMinute: hm(9), endMinute: hm(12) }],
          doctorWindows: [{ startMinute: hm(14), endMinute: hm(18) }],
        }),
      ),
    ).toEqual([]);
  });
});

describe('conflicts with existing appointments', () => {
  it('does not offer a slot that is already booked — the 15:00 case', () => {
    const slots = startTimes(
      request({
        busy: [{ start: at(MONDAY, hm(15)), end: at(MONDAY, hm(15, 30)) }],
      }),
    );
    expect(slots).not.toContain(hm(15));
    // Neighbouring slots stay available.
    expect(slots).toContain(hm(15, 30));
    expect(slots).toContain(hm(12, 30));
  });

  it('excludes any slot that partially overlaps a booking', () => {
    const slots = startTimes(
      request({
        granularityMinutes: 15,
        // A 45-minute appointment at 15:00 blocks 15:00, 15:15 and 15:30 starts.
        busy: [{ start: at(MONDAY, hm(15)), end: at(MONDAY, hm(15, 45)) }],
      }),
    );
    expect(slots).not.toContain(hm(15));
    expect(slots).not.toContain(hm(15, 15));
    expect(slots).not.toContain(hm(15, 30));
    expect(slots).toContain(hm(15, 45));
  });

  it('honours buffer time on both sides of an existing appointment', () => {
    const slots = startTimes(
      request({
        // A continuous shift, so any exclusion here is attributable to the
        // buffer rather than to the default split-shift gap.
        doctorWindows: [{ startMinute: hm(9), endMinute: hm(19) }],
        granularityMinutes: 15,
        bufferMinutes: 15,
        // Existing block already includes its own trailing buffer (15:30 + 15m).
        busy: [{ start: at(MONDAY, hm(15)), end: at(MONDAY, hm(15, 45)) }],
      }),
    );
    // Before: 14:30–15:00 plus its own 15-minute buffer would run to 15:15 and
    // collide, so the last bookable start before the gap is 14:15.
    expect(slots).not.toContain(hm(14, 30));
    expect(slots).toContain(hm(14, 15));
    // After: the existing block ends at 15:45, so that is the first free start.
    expect(slots).toContain(hm(15, 45));
    // And the slot itself is still excluded.
    expect(slots).not.toContain(hm(15));
  });

  it('agrees with isSlotAvailable', () => {
    const req = request({ busy: [{ start: at(MONDAY, hm(15)), end: at(MONDAY, hm(15, 30)) }] });
    expect(isSlotAvailable(req, at(MONDAY, hm(15)))).toBe(false);
    expect(isSlotAvailable(req, at(MONDAY, hm(15, 30)))).toBe(true);
  });
});

describe('booking window rules', () => {
  it('excludes slots before the minimum-notice cutoff', () => {
    const slots = startTimes(request({ earliestStart: at(MONDAY, hm(14)) }));
    expect(slots.every((m) => m >= hm(14))).toBe(true);
    expect(slots).toContain(hm(15));
  });

  it('excludes slots beyond the booking horizon', () => {
    const slots = startTimes(request({ latestStart: at(MONDAY, hm(10)) }));
    expect(slots).toEqual([hm(9), hm(9, 30), hm(10)]);
  });
});

describe('daylight-saving transitions', () => {
  // The UK springs forward at 01:00 UTC on 2026-03-29: 01:00–02:00 local does
  // not exist that day.
  const DST_FORWARD = '2026-03-29';

  it('skips local times that do not exist on a spring-forward day', () => {
    expect(localMinutesToInstant(DST_FORWARD, hm(1, 30), LONDON)).toBeNull();

    const slots = startTimes(
      request({
        dateKey: DST_FORWARD,
        clinicWindows: [{ startMinute: hm(0), endMinute: hm(6) }],
        doctorWindows: [{ startMinute: hm(0), endMinute: hm(6) }],
        granularityMinutes: 30,
      }),
    );
    // 01:00 and 01:30 never happen, so they are not offerable.
    expect(slots).not.toContain(hm(1));
    expect(slots).not.toContain(hm(1, 30));
    expect(slots).toContain(hm(0, 30));
    expect(slots).toContain(hm(2));
  });

  it('keeps wall-clock hours stable across a transition', () => {
    // 09:00 local is 09:00 local on both sides of the change, even though the
    // UTC offset differs.
    const before = at('2026-03-28', hm(9));
    const after = at('2026-03-30', hm(9));
    expect(before.toISOString()).toBe('2026-03-28T09:00:00.000Z');
    // BST is UTC+1, so 09:00 local is 08:00 UTC.
    expect(after.toISOString()).toBe('2026-03-30T08:00:00.000Z');
  });

  it('handles a southern-hemisphere zone with the opposite transition', () => {
    const slots = startTimes(
      request({
        timezone: 'Australia/Sydney',
        dateKey: '2026-10-04', // Sydney springs forward 02:00 → 03:00.
        clinicWindows: [{ startMinute: hm(0), endMinute: hm(6) }],
        doctorWindows: [{ startMinute: hm(0), endMinute: hm(6) }],
        granularityMinutes: 30,
      }),
    );
    expect(slots).not.toContain(hm(2));
    expect(slots).not.toContain(hm(2, 30));
    expect(slots).toContain(hm(3));
  });
});

describe('lattice alignment', () => {
  it('aligns starts to the granularity lattice', () => {
    const slots = startTimes(
      request({
        doctorWindows: [{ startMinute: hm(9), endMinute: hm(12) }],
        granularityMinutes: 15,
        serviceDurationMinutes: 30,
      }),
    );
    expect(slots.every((m) => m % 15 === 0)).toBe(true);
  });

  it('still offers a window that begins off-lattice', () => {
    const slots = startTimes(
      request({
        doctorWindows: [{ startMinute: hm(9, 10), endMinute: hm(9, 40) }],
        granularityMinutes: 30,
        serviceDurationMinutes: 30,
      }),
    );
    // The only possible appointment is exactly 09:10–09:40; losing it to
    // lattice rounding would silently discard real availability.
    expect(slots).toEqual([hm(9, 10)]);
  });

  it('returns an empty list rather than throwing on a zero-length service', () => {
    expect(startTimes(request({ serviceDurationMinutes: 0 }))).toEqual([]);
  });
});
