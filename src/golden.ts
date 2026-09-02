/**
 * Solar events and golden-hour windows, on the accurate ephemeris.
 *
 * `solarDayEvents` in `events.ts` stays: a 3-minute scan of the design model,
 * good enough for a playground readout. These are the ones to schedule against.
 */

import { HORIZON_DEG, solarAltitudeAt } from "./ephemeris.js";
import { DEFAULT_LATITUDE } from "./solar.js";
import { offsetHoursInTimeZone, zonedParts } from "./zoned.js";

/** Sun elevation bounds of the golden hour, degrees. */
export const GOLDEN_LOW_DEG = -4;
export const GOLDEN_HIGH_DEG = 6;

const STEP_MS = 60_000;
const DAY_MS = 86_400_000;

export interface SolarEventTimes {
  /** Null through polar day and polar night. */
  sunrise: Date | null;
  sunset: Date | null;
  solarNoon: Date;
  maxAltitudeDeg: number;
  minAltitudeDeg: number;
  alwaysAbove: boolean;
  alwaysBelow: boolean;
}

export interface GoldenHourWindow {
  start: Date;
  end: Date;
  /** True for the window around sunrise, false for the one around sunset. */
  morning: boolean;
}

export interface SolarEventOptions {
  at?: Date;
  latitude?: number;
  /**
   * Observer longitude, degrees positive east. Defaults to 0, which is only
   * right on the Greenwich meridian — pass the real one, it moves solar noon by
   * four minutes per degree.
   */
  longitude?: number;
  /** IANA zone deciding which local day is meant. Defaults to the runtime zone. */
  timeZone?: string;
}

export interface GoldenHourOptions extends SolarEventOptions {
  /** Lower elevation bound, degrees. Default -4. */
  lowDeg?: number;
  /** Upper elevation bound, degrees. Default 6. */
  highDeg?: number;
}

export interface NextGoldenHourOptions extends GoldenHourOptions {
  /** How far ahead to look. Default 72 hours — enough to clear polar summer. */
  searchHours?: number;
}

/** Altitudes sampled at a fixed step, with linear crossing lookup. */
class Track {
  readonly alt: Float64Array;

  constructor(
    readonly from: number,
    readonly to: number,
    latitude: number,
    longitude: number,
  ) {
    const count = Math.floor((to - from) / STEP_MS) + 1;
    this.alt = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      this.alt[i] = solarAltitudeAt(new Date(from + i * STEP_MS), latitude, longitude);
    }
  }

  get count(): number {
    return this.alt.length;
  }

  timeAt(i: number): number {
    return this.from + i * STEP_MS;
  }

  indexOf(ms: number): number {
    const i = Math.floor((ms - this.from) / STEP_MS);
    return i < 0 ? 0 : i > this.count - 1 ? this.count - 1 : i;
  }

  /** Instant where the altitude crosses `level` between sample `i` and `i + 1`. */
  crossing(i: number, level: number): number {
    const a = this.alt[i]!;
    const b = this.alt[i + 1]!;
    if (a === b) return this.timeAt(i);
    const t = Math.min(1, Math.max(0, (level - a) / (b - a)));
    return this.timeAt(i) + t * STEP_MS;
  }

  between(i: number, low: number, high: number): boolean {
    const v = this.alt[i]!;
    return v >= low && v <= high;
  }

  /** Golden-hour windows overlapping the sampled range. */
  windows(low: number, high: number): GoldenHourWindow[] {
    const out: GoldenHourWindow[] = [];
    let i = 0;
    while (i < this.count) {
      if (!this.between(i, low, high)) {
        i++;
        continue;
      }
      const s = i;
      let e = i;
      while (e < this.count - 1 && this.between(e + 1, low, high)) e++;
      const rising = this.alt[e]! >= this.alt[s]!;
      const start = s > 0 ? this.crossing(s - 1, rising ? low : high) : this.timeAt(s);
      const end = e < this.count - 1 ? this.crossing(e, rising ? high : low) : this.timeAt(e);
      out.push({
        start: new Date(Math.min(start, end)),
        end: new Date(Math.max(start, end)),
        morning: rising,
      });
      i = e + 1;
    }
    return out;
  }
}

/**
 * Start of the local calendar day containing `at`, as an epoch instant.
 * Uses the zone offset at `at`, so a day containing a DST switch is off by the
 * shift — which no event in this module is sensitive to.
 */
function localDayStart(at: Date, timeZone?: string): number {
  const p = zonedParts(at, timeZone);
  const offsetHours = offsetHoursInTimeZone(at, timeZone);
  return Date.UTC(p.year, p.month, p.day) - offsetHours * 3_600_000;
}

/** Sunrise, sunset and solar noon of the local day containing `at`. */
export function solarEvents(opts: SolarEventOptions = {}): SolarEventTimes {
  const at = opts.at ?? new Date();
  const latitude = opts.latitude ?? DEFAULT_LATITUDE;
  const longitude = opts.longitude ?? 0;
  const from = localDayStart(at, opts.timeZone);
  const track = new Track(from, from + DAY_MS, latitude, longitude);

  let sunrise: Date | null = null;
  let sunset: Date | null = null;
  let maxAlt = -Infinity;
  let minAlt = Infinity;
  let noonMs = from;

  for (let i = 0; i < track.count; i++) {
    const alt = track.alt[i]!;
    if (alt > maxAlt) {
      maxAlt = alt;
      noonMs = track.timeAt(i);
    }
    if (alt < minAlt) minAlt = alt;
    if (i < track.count - 1) {
      const next = track.alt[i + 1]!;
      if (sunrise === null && alt < HORIZON_DEG && next >= HORIZON_DEG) {
        sunrise = new Date(track.crossing(i, HORIZON_DEG));
      }
      if (alt >= HORIZON_DEG && next < HORIZON_DEG) {
        sunset = new Date(track.crossing(i, HORIZON_DEG));
      }
    }
  }

  return {
    sunrise,
    sunset,
    solarNoon: new Date(noonMs),
    maxAltitudeDeg: maxAlt,
    minAltitudeDeg: minAlt,
    alwaysAbove: minAlt >= HORIZON_DEG,
    alwaysBelow: maxAlt < HORIZON_DEG,
  };
}

/**
 * Both golden-hour windows of the local day containing `at` — the marks to draw
 * on a day arc. Fewer than two near the poles, where the sun can stay inside or
 * outside the band all day.
 */
export function goldenHourWindows(opts: GoldenHourOptions = {}): GoldenHourWindow[] {
  const at = opts.at ?? new Date();
  const latitude = opts.latitude ?? DEFAULT_LATITUDE;
  const longitude = opts.longitude ?? 0;
  const low = opts.lowDeg ?? GOLDEN_LOW_DEG;
  const high = opts.highDeg ?? GOLDEN_HIGH_DEG;
  const from = localDayStart(at, opts.timeZone);
  return new Track(from, from + DAY_MS, latitude, longitude).windows(low, high);
}

/**
 * The golden hour in progress right now, or the next one — rolling into
 * tomorrow once this evening's has passed. Null when there is none within
 * `searchHours`, which happens through polar night.
 */
export function currentOrNextGoldenHour(opts: NextGoldenHourOptions = {}): GoldenHourWindow | null {
  const at = opts.at ?? new Date();
  const latitude = opts.latitude ?? DEFAULT_LATITUDE;
  const longitude = opts.longitude ?? 0;
  const low = opts.lowDeg ?? GOLDEN_LOW_DEG;
  const high = opts.highDeg ?? GOLDEN_HIGH_DEG;
  const searchHours = opts.searchHours ?? 72;

  const now = at.getTime();
  // Start half a day back so a window already under way is reported from its
  // real beginning rather than clipped to now.
  const track = new Track(now - DAY_MS / 2, now + searchHours * 3_600_000, latitude, longitude);
  for (const window of track.windows(low, high)) {
    if (window.end.getTime() >= now) return window;
  }
  return null;
}
