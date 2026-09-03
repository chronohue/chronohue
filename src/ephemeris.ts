/**
 * Accurate solar position (NOAA), for event times.
 *
 * `solar.ts` stays as it is: a design model where hour 12 *is* solar noon and
 * longitude is ignored. That is fine for an accent colour that drifts across
 * the day, and it is what the published palette behaviour is built on.
 *
 * It is not fine for telling someone when to be outside. Skipping the equation
 * of time and the observer's longitude puts solar noon up to half an hour off:
 * in Yaroslavl (39.88°E, UTC+3) the meridian sits at 45°E, so noon is at 12:20
 * before the equation of time adds its own ±15 minutes across the year.
 *
 * Everything here is instant-based and takes longitude.
 */

import { toDeg, toRad } from "./math.js";

/** Sun elevation of sunrise / sunset: upper limb, refraction included. */
export const HORIZON_DEG = -0.833;

export interface SolarPosition {
  /** Geometric elevation above the horizon, degrees. */
  altitudeDeg: number;
  declinationDeg: number;
  /** Equation of time, minutes. Positive means the sun runs ahead of the clock. */
  equationOfTimeMin: number;
  /** Hour angle, degrees; 0 at solar noon, negative before it. */
  hourAngleDeg: number;
}

function wrap(value: number, period: number): number {
  const r = value % period;
  return r < 0 ? r + period : r;
}

/**
 * Sun position at `at` for an observer at `latitudeDeg` / `longitudeDeg`
 * (positive north / east).
 */
export function solarPosition(at: Date, latitudeDeg: number, longitudeDeg: number): SolarPosition {
  const ms = at.getTime();
  const jd = ms / 86_400_000 + 2_440_587.5;
  const t = (jd - 2_451_545) / 36_525;

  const meanLong = wrap(280.46646 + t * (36_000.76983 + t * 0.0003032), 360);
  const meanAnom = 357.52911 + t * (35_999.05029 - 0.0001537 * t);
  const eccentricity = 0.016708634 - t * (0.000042037 + 0.0000001267 * t);

  const m = toRad(meanAnom);
  const centre =
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289;

  const omega = 125.04 - 1934.136 * t;
  const apparentLong = meanLong + centre - 0.00569 - 0.00478 * Math.sin(toRad(omega));

  const meanObliquity =
    23 + (26 + (21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))) / 60) / 60;
  const obliquity = meanObliquity + 0.00256 * Math.cos(toRad(omega));

  const declinationDeg = toDeg(
    Math.asin(Math.sin(toRad(obliquity)) * Math.sin(toRad(apparentLong))),
  );

  const varY = Math.tan(toRad(obliquity / 2)) ** 2;
  const l0 = toRad(meanLong);
  const equationOfTimeMin =
    4 *
    toDeg(
      varY * Math.sin(2 * l0) -
        2 * eccentricity * Math.sin(m) +
        4 * eccentricity * varY * Math.sin(m) * Math.cos(2 * l0) -
        0.5 * varY * varY * Math.sin(4 * l0) -
        1.25 * eccentricity * eccentricity * Math.sin(2 * m),
    );

  const minutesUtc = wrap(ms, 86_400_000) / 60_000;
  const trueSolarTime = wrap(minutesUtc + equationOfTimeMin + 4 * longitudeDeg, 1440);
  const hourAngleDeg = trueSolarTime / 4 < 0 ? trueSolarTime / 4 + 180 : trueSolarTime / 4 - 180;

  const lat = toRad(latitudeDeg);
  const decl = toRad(declinationDeg);
  const cosZenith =
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(toRad(hourAngleDeg));
  const altitudeDeg = 90 - toDeg(Math.acos(Math.min(1, Math.max(-1, cosZenith))));

  return { altitudeDeg, declinationDeg, equationOfTimeMin, hourAngleDeg };
}

/** Sun elevation in degrees — the hot path when only the altitude is needed. */
export function solarAltitudeAt(at: Date, latitudeDeg: number, longitudeDeg: number): number {
  return solarPosition(at, latitudeDeg, longitudeDeg).altitudeDeg;
}
