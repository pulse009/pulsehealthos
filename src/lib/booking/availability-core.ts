import {
  localMinutesToInstant,
  MINUTES_PER_DAY,
  intervalsOverlap,
} from '@/lib/time/timezone';

/**
 * The availability engine — pure functions, no I/O.
 *
 * Everything the engine needs is passed in, which keeps the scheduling rules
 * exhaustively testable without a database and guarantees the engine cannot
 * "discover" availability from anywhere except its explicit inputs. That
 * property is what lets the AI layer be told, truthfully, that it may only ever
 * offer slots this function returned.
 *
 * Two coordinate systems meet here:
 *   - Recurring rules (opening hours, doctor shifts, breaks) are *local minutes*
 *     from midnight, because they repeat by wall clock regardless of DST.
 *   - Existing appointments are *UTC instants*, because they are fixed points.
 * Candidate slots are generated in local minutes, then projected to instants
 * before any conflict comparison, so DST transitions are handled exactly once.
 */

/** A half-open window of local minutes from midnight: [startMinute, endMinute). */
export interface LocalWindow {
  startMinute: number;
  endMinute: number;
}

/** A half-open interval of real time that a doctor's calendar is occupied. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

export interface AvailabilityRequest {
  timezone: string;
  /** Local calendar date being solved for (YYYY-MM-DD). */
  dateKey: string;
  /** Clinic opening windows for this weekday. Empty ⇒ clinic shut. */
  clinicWindows: LocalWindow[];
  /** Doctor's shift windows for this weekday. Empty ⇒ doctor not working. */
  doctorWindows: LocalWindow[];
  /** Recurring breaks plus any date-specific unavailability, as local windows. */
  blockedWindows: LocalWindow[];
  /** Holiday / full-day closure / full-day doctor leave. */
  isClosedAllDay: boolean;
  /** Length of the appointment itself, excluding buffer. */
  serviceDurationMinutes: number;
  /** Gap required after the appointment before the next may begin. */
  bufferMinutes: number;
  /** Candidate start times are generated on this lattice. */
  granularityMinutes: number;
  /** Occupied intervals already on the doctor's calendar (buffer included). */
  busy: BusyInterval[];
  /** Earliest permissible start (now + minimum notice). */
  earliestStart: Date;
  /** Latest permissible start (now + maximum booking horizon). */
  latestStart: Date;
}

export interface AvailableSlot {
  /** UTC instant the appointment starts. */
  start: Date;
  /** UTC instant the appointment ends (excludes buffer). */
  end: Date;
  /** Local minutes from midnight, for display and debugging. */
  startMinute: number;
}

// --- Local-window algebra -------------------------------------------------

/** Sort and merge touching/overlapping windows into a canonical minimal set. */
export function normalizeWindows(windows: LocalWindow[]): LocalWindow[] {
  const valid = windows
    .filter((w) => w.endMinute > w.startMinute)
    .map((w) => ({
      startMinute: Math.max(0, w.startMinute),
      endMinute: Math.min(MINUTES_PER_DAY, w.endMinute),
    }))
    .filter((w) => w.endMinute > w.startMinute)
    .sort((a, b) => a.startMinute - b.startMinute);

  const merged: LocalWindow[] = [];
  for (const w of valid) {
    const last = merged[merged.length - 1];
    if (last && w.startMinute <= last.endMinute) {
      last.endMinute = Math.max(last.endMinute, w.endMinute);
    } else {
      merged.push({ ...w });
    }
  }
  return merged;
}

/** Pairwise intersection of two window sets. */
export function intersectWindows(a: LocalWindow[], b: LocalWindow[]): LocalWindow[] {
  const left = normalizeWindows(a);
  const right = normalizeWindows(b);
  const out: LocalWindow[] = [];

  for (const l of left) {
    for (const r of right) {
      const start = Math.max(l.startMinute, r.startMinute);
      const end = Math.min(l.endMinute, r.endMinute);
      if (end > start) out.push({ startMinute: start, endMinute: end });
    }
  }
  return normalizeWindows(out);
}

/** Remove `cuts` from `base`, splitting windows where a cut lands in the middle. */
export function subtractWindows(base: LocalWindow[], cuts: LocalWindow[]): LocalWindow[] {
  const normalizedCuts = normalizeWindows(cuts);
  let current = normalizeWindows(base);

  for (const cut of normalizedCuts) {
    const next: LocalWindow[] = [];
    for (const w of current) {
      // No intersection — window survives intact.
      if (cut.endMinute <= w.startMinute || cut.startMinute >= w.endMinute) {
        next.push(w);
        continue;
      }
      // Left remainder.
      if (cut.startMinute > w.startMinute) {
        next.push({ startMinute: w.startMinute, endMinute: cut.startMinute });
      }
      // Right remainder.
      if (cut.endMinute < w.endMinute) {
        next.push({ startMinute: cut.endMinute, endMinute: w.endMinute });
      }
    }
    current = next;
  }
  return normalizeWindows(current);
}

/**
 * The windows in which this doctor can actually see patients on this date:
 * clinic hours ∩ doctor shifts − (breaks ∪ closures ∪ leave).
 */
export function computeWorkingWindows(req: AvailabilityRequest): LocalWindow[] {
  if (req.isClosedAllDay) return [];
  const shared = intersectWindows(req.clinicWindows, req.doctorWindows);
  if (shared.length === 0) return [];
  return subtractWindows(shared, req.blockedWindows);
}

// --- Slot generation ------------------------------------------------------

/**
 * Resolve a window boundary to an instant.
 *
 * Unlike a *start* time, a boundary that falls in a spring-forward gap should
 * not be discarded — the window still closes at the moment the clock jumps. So
 * we walk forward to the first wall-clock minute that exists, which is exactly
 * that instant.
 */
function resolveBoundaryInstant(
  dateKey: string,
  minute: number,
  timezone: string,
): Date | null {
  for (let m = minute; m <= minute + 180; m += 1) {
    const instant = localMinutesToInstant(dateKey, m, timezone);
    if (instant) return instant;
  }
  return null;
}

/**
 * Compute every bookable start time for one doctor, one service, one date.
 *
 * A candidate survives only if all of the following hold:
 *   1. The whole appointment fits inside a single working window (an
 *      appointment may not straddle a break or a shift boundary). Fit is
 *      checked against *instants*, not wall-clock minutes.
 *   2. Its local wall-clock start actually exists in the timezone — the
 *      spring-forward gap is skipped rather than silently shifted.
 *   3. It lies within the advance-booking window.
 *   4. Its occupied interval (appointment + trailing buffer) does not intersect
 *      any interval already occupied on the doctor's calendar.
 *
 * Duration is *elapsed* time, not wall-clock arithmetic: a 30-minute
 * appointment consumes 30 real minutes of a doctor's day whether or not the
 * clocks change during it. Deriving the end by adding 30 to the local minute
 * offset instead would drop legitimate slots around a transition and, worse,
 * disagree with the interval the database stores.
 */
export function computeAvailableSlots(req: AvailabilityRequest): AvailableSlot[] {
  const {
    timezone,
    dateKey,
    serviceDurationMinutes,
    bufferMinutes,
    granularityMinutes,
    busy,
    earliestStart,
    latestStart,
  } = req;

  if (serviceDurationMinutes <= 0) return [];
  const step = granularityMinutes > 0 ? granularityMinutes : serviceDurationMinutes;

  const workingWindows = computeWorkingWindows(req);
  if (workingWindows.length === 0) return [];

  const slots: AvailableSlot[] = [];

  for (const window of workingWindows) {
    const windowEnd = resolveBoundaryInstant(dateKey, window.endMinute, timezone);
    if (!windowEnd) continue;

    // Align the first candidate to the lattice so offered times stay tidy
    // (e.g. :00/:15/:30/:45) instead of drifting off an odd window start.
    const firstAligned = Math.ceil(window.startMinute / step) * step;
    // ...but never lose a window that begins off-lattice and is exactly long
    // enough for one appointment.
    const startPoints = new Set<number>();
    if (window.startMinute + serviceDurationMinutes <= window.endMinute) {
      startPoints.add(window.startMinute);
    }
    for (let m = firstAligned; m + serviceDurationMinutes <= window.endMinute; m += step) {
      startPoints.add(m);
    }

    for (const startMinute of [...startPoints].sort((a, b) => a - b)) {
      const start = localMinutesToInstant(dateKey, startMinute, timezone);
      // Non-existent wall-clock time (DST gap): not offerable.
      if (!start) continue;

      // Elapsed-time duration — see the note on the function above.
      const end = new Date(start.getTime() + serviceDurationMinutes * 60_000);
      // The appointment must finish within the window in real time. On a
      // spring-forward day this is stricter than the wall-clock bound above,
      // which is the point: the window is genuinely an hour shorter.
      if (end.getTime() > windowEnd.getTime()) continue;

      // Advance-booking window: too soon, or beyond the horizon.
      if (start.getTime() < earliestStart.getTime()) continue;
      if (start.getTime() > latestStart.getTime()) continue;

      // The interval this appointment would occupy, buffer included. Mirrors
      // [blockStartsAt, blockEndsAt) so the engine and the database agree.
      const blockEnd = new Date(end.getTime() + bufferMinutes * 60_000);

      const collides = busy.some((b) => intervalsOverlap(start, blockEnd, b.start, b.end));
      if (collides) continue;

      slots.push({ start, end, startMinute });
    }
  }

  return slots.sort((a, b) => a.start.getTime() - b.start.getTime());
}

/**
 * Whether one specific start time is bookable.
 *
 * Implemented by asking the same generator, so a slot can never pass this check
 * yet be absent from the offered list (or vice versa).
 */
export function isSlotAvailable(req: AvailabilityRequest, start: Date): boolean {
  return computeAvailableSlots(req).some((s) => s.start.getTime() === start.getTime());
}
