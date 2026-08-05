import { solarAltitude } from "./solar.js";

export interface SolarDayEvents {
  /** First hour (0–24) where altitude crosses above 0, or null if always down. */
  sunriseHour: number | null;
  /** First hour after noon where altitude crosses below 0, or null if always up. */
  sunsetHour: number | null;
  /** Hour of maximum altitude (≈ solar noon in this model). */
  noonHour: number;
  maxAltitudeDeg: number;
  minAltitudeDeg: number;
  /** True polar day / night style edge cases at high latitude. */
  alwaysAbove: boolean;
  alwaysBelow: boolean;
}

/**
 * Approximate sunrise / sunset for the circadian model (altitude = 0 crossings).
 * Samples the day at `stepHours` resolution (default 0.05 h ≈ 3 min).
 * Useful for playground “reality check” readouts — not an ephemeris.
 */
export function solarDayEvents(
  declinationDeg: number,
  latitudeDeg: number,
  stepHours = 0.05,
): SolarDayEvents {
  let maxAlt = -Infinity;
  let minAlt = Infinity;
  let noonHour = 12;
  let prevAlt = solarAltitude(0, declinationDeg, latitudeDeg);
  let sunriseHour: number | null = null;
  let sunsetHour: number | null = null;

  for (let h = stepHours; h <= 24 + 1e-9; h += stepHours) {
    const hour = Math.min(h, 24);
    const alt = solarAltitude(hour, declinationDeg, latitudeDeg);
    if (alt > maxAlt) {
      maxAlt = alt;
      noonHour = hour;
    }
    if (alt < minAlt) minAlt = alt;

    if (sunriseHour == null && prevAlt < 0 && alt >= 0) {
      // linear interpolate crossing
      const t = prevAlt === alt ? 0 : -prevAlt / (alt - prevAlt);
      sunriseHour = hour - stepHours + t * stepHours;
    }
    if (sunsetHour == null && hour > 12 && prevAlt >= 0 && alt < 0) {
      const t = prevAlt === alt ? 0 : prevAlt / (prevAlt - alt);
      sunsetHour = hour - stepHours + t * stepHours;
    }
    prevAlt = alt;
  }

  return {
    sunriseHour,
    sunsetHour,
    noonHour,
    maxAltitudeDeg: maxAlt,
    minAltitudeDeg: minAlt,
    alwaysAbove: minAlt >= 0,
    alwaysBelow: maxAlt < 0,
  };
}

export function formatHourClock(hour: number | null): string {
  if (hour == null || Number.isNaN(hour)) return "—";
  const h = ((Math.floor(hour) % 24) + 24) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
