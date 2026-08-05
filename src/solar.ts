import { dayOfYear, toDeg, toRad } from "./math.js";

/** Default latitude from the Luminat design prototype (Moscow). */
export const DEFAULT_LATITUDE = 55.75;

/**
 * Solar declination (degrees) from day-of-year.
 * Same formula as design: `23.44 * sin(2π/365 * (284 + doy))`.
 *
 * @param dayOfYearOverride — when set (e.g. zone wall-clock doy), used instead of local `dayOfYear(at)`.
 */
export function solarDeclination(at: Date, dayOfYearOverride?: number): number {
  const doy = dayOfYearOverride ?? dayOfYear(at);
  return 23.44 * Math.sin(((2 * Math.PI) / 365) * (284 + doy));
}

/**
 * Solar altitude in degrees for local hour angle at `latitude`.
 * Hour 12 ≈ local solar noon (approximation; no equation of time).
 */
export function solarAltitude(
  hour: number,
  declinationDeg: number,
  latitudeDeg: number = DEFAULT_LATITUDE,
): number {
  const H = toRad(15 * (hour - 12));
  const decl = toRad(declinationDeg);
  const lat = toRad(latitudeDeg);
  const alt = Math.asin(
    Math.sin(decl) * Math.sin(lat) + Math.cos(decl) * Math.cos(lat) * Math.cos(H),
  );
  return toDeg(alt);
}
