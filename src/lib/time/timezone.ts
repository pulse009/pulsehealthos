import { DateTime, Interval } from 'luxon';
import { badRequest } from '@/lib/errors';

/**
 * Timezone boundary.
 *
 * The invariant: instants (`Date`) are always UTC; wall-clock concepts (a
 * clinic's opening minute, a holiday date) are always local to a clinic's IANA
 * timezone. This module is the only place the two are allowed to meet, so DST
 * handling lives in exactly one spot.
 *
 * Local times are expressed as `minutes from local midnight` (0..1440) and
 * local dates as `YYYY-MM-DD` strings ("date keys").
 */

export const MINUTES_PER_DAY = 1440;

export function assertValidTimezone(timezone: string): void {
  if (!DateTime.local().setZone(timezone).isValid) {
    throw badRequest(`Unknown IANA timezone: ${timezone}`);
  }
}

export function isValidTimezone(timezone: string): boolean {
  return DateTime.local().setZone(timezone).isValid;
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function assertValidDateKey(dateKey: string): void {
  if (!DATE_KEY.test(dateKey) || !DateTime.fromISO(dateKey, { zone: 'utc' }).isValid) {
    throw badRequest(`Expected a YYYY-MM-DD date, received: ${dateKey}`);
  }
}

/** Current instant rendered in a clinic's timezone. */
export const nowInZone = (timezone: string, at: Date = new Date()): DateTime =>
  DateTime.fromJSDate(at, { zone: timezone });

/** The local calendar date an instant falls on, in the given timezone. */
export function toDateKey(instant: Date, timezone: string): string {
  const dt = DateTime.fromJSDate(instant, { zone: timezone });
  if (!dt.isValid) throw badRequest(`Unknown IANA timezone: ${timezone}`);
  return dt.toFormat('yyyy-MM-dd');
}

/** ISO weekday (1 = Monday .. 7 = Sunday) of a local date key. */
export function weekdayOf(dateKey: string, timezone: string): number {
  assertValidDateKey(dateKey);
  return DateTime.fromISO(dateKey, { zone: timezone }).weekday;
}

/**
 * Resolve a local wall-clock time to a UTC instant.
 *
 * Returns `null` when the wall-clock time does not exist in that zone — the
 * spring-forward gap. Callers treat a null as "this slot is not offerable",
 * which is the correct behaviour: you cannot hold a 02:30 appointment on a day
 * where 02:30 never happens.
 *
 * Ambiguous times (the fall-back hour, which occurs twice) resolve to the first
 * occurrence, deterministically.
 */
export function localMinutesToInstant(
  dateKey: string,
  minutes: number,
  timezone: string,
): Date | null {
  assertValidDateKey(dateKey);
  if (!Number.isInteger(minutes) || minutes < 0) {
    throw badRequest(`Minute offset must be a non-negative integer, received: ${minutes}`);
  }

  const dayOffset = Math.floor(minutes / MINUTES_PER_DAY);
  const remainder = minutes % MINUTES_PER_DAY;

  const base = DateTime.fromISO(dateKey, { zone: timezone });
  if (!base.isValid) throw badRequest(`Unknown IANA timezone: ${timezone}`);

  const target = base.startOf('day').plus({ days: dayOffset }).set({
    hour: Math.floor(remainder / 60),
    minute: remainder % 60,
    second: 0,
    millisecond: 0,
  });

  if (!target.isValid) return null;
  // Luxon shifts non-existent local times forward; detect that and reject.
  if (target.hour * 60 + target.minute !== remainder) return null;

  return target.toJSDate();
}

/**
 * Same as `localMinutesToInstant` but throws instead of returning null.
 * Use where a gap genuinely indicates a bug rather than an unbookable slot.
 */
export function requireLocalMinutesToInstant(
  dateKey: string,
  minutes: number,
  timezone: string,
): Date {
  const instant = localMinutesToInstant(dateKey, minutes, timezone);
  if (!instant) {
    throw badRequest(
      `Local time ${dateKey} +${minutes}m does not exist in ${timezone} (daylight-saving gap).`,
    );
  }
  return instant;
}

/** Minutes from local midnight for an instant, in the given timezone. */
export function instantToLocalMinutes(instant: Date, timezone: string): number {
  const dt = DateTime.fromJSDate(instant, { zone: timezone });
  if (!dt.isValid) throw badRequest(`Unknown IANA timezone: ${timezone}`);
  return dt.hour * 60 + dt.minute;
}

/** UTC instant of local midnight starting `dateKey`. */
export function startOfLocalDay(dateKey: string, timezone: string): Date {
  assertValidDateKey(dateKey);
  const dt = DateTime.fromISO(dateKey, { zone: timezone }).startOf('day');
  if (!dt.isValid) throw badRequest(`Unknown IANA timezone: ${timezone}`);
  return dt.toJSDate();
}

/** UTC instant of local midnight ending `dateKey` (i.e. start of the next day). */
export function endOfLocalDay(dateKey: string, timezone: string): Date {
  assertValidDateKey(dateKey);
  const dt = DateTime.fromISO(dateKey, { zone: timezone }).startOf('day').plus({ days: 1 });
  return dt.toJSDate();
}

/** Inclusive list of date keys between two local dates. Guards runaway ranges. */
export function dateKeyRange(
  startDateKey: string,
  endDateKey: string,
  timezone: string,
  maxDays = 400,
): string[] {
  assertValidDateKey(startDateKey);
  assertValidDateKey(endDateKey);

  const start = DateTime.fromISO(startDateKey, { zone: timezone }).startOf('day');
  const end = DateTime.fromISO(endDateKey, { zone: timezone }).startOf('day');
  if (end < start) return [];

  const days = Math.floor(end.diff(start, 'days').days) + 1;
  if (days > maxDays) {
    throw badRequest(`Date range too large: ${days} days (max ${maxDays}).`);
  }

  const keys: string[] = [];
  for (let i = 0; i < days; i += 1) {
    keys.push(start.plus({ days: i }).toFormat('yyyy-MM-dd'));
  }
  return keys;
}

/** Shift a date key by whole local days. */
export function addDaysToDateKey(dateKey: string, days: number, timezone: string): string {
  assertValidDateKey(dateKey);
  return DateTime.fromISO(dateKey, { zone: timezone })
    .startOf('day')
    .plus({ days })
    .toFormat('yyyy-MM-dd');
}

/** True when `dateKey` falls inside the inclusive local range. */
export function dateKeyInRange(dateKey: string, startDateKey: string, endDateKey: string): boolean {
  return dateKey >= startDateKey && dateKey <= endDateKey;
}

/** Matches an annually-recurring holiday by month and day, ignoring the year. */
export function sameMonthAndDay(dateKeyA: string, dateKeyB: string): boolean {
  return dateKeyA.slice(5) === dateKeyB.slice(5);
}

// --- Presentation ---------------------------------------------------------

export interface FormatOptions {
  locale?: string;
  /** Include the timezone abbreviation, e.g. "PKT". */
  withZone?: boolean;
}

/** e.g. "Mon, 3 Mar 2026 at 5:00 PM" — used in WhatsApp copy and dashboards. */
export function formatInstant(instant: Date, timezone: string, opts: FormatOptions = {}): string {
  const dt = DateTime.fromJSDate(instant, { zone: timezone }).setLocale(opts.locale ?? 'en');
  const base = dt.toFormat("ccc, d LLL yyyy 'at' h:mm a");
  return opts.withZone ? `${base} (${dt.toFormat('ZZZZ')})` : base;
}

/** e.g. "5:00 PM" */
export function formatTime(instant: Date, timezone: string, locale = 'en'): string {
  return DateTime.fromJSDate(instant, { zone: timezone }).setLocale(locale).toFormat('h:mm a');
}

/** e.g. "Monday, 3 March 2026" */
export function formatDate(instant: Date, timezone: string, locale = 'en'): string {
  return DateTime.fromJSDate(instant, { zone: timezone }).setLocale(locale).toFormat('cccc, d LLLL yyyy');
}

/** Machine-readable local wall time, useful for AI prompts: "2026-03-03 17:00". */
export function formatLocalIso(instant: Date, timezone: string): string {
  return DateTime.fromJSDate(instant, { zone: timezone }).toFormat('yyyy-MM-dd HH:mm');
}

/** Minutes-from-midnight rendered as "17:00". */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Parse "17:00" / "9:30" into minutes from midnight. */
export function parseMinutes(value: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) throw badRequest(`Expected HH:MM, received: ${value}`);
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  if (hours > 24 || mins > 59 || hours * 60 + mins > MINUTES_PER_DAY) {
    throw badRequest(`Time out of range: ${value}`);
  }
  return hours * 60 + mins;
}

/** True when two instant intervals overlap on a half-open [start, end) basis. */
export function intervalsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export { DateTime, Interval };
