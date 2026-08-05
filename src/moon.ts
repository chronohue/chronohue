/** Mean synodic month (days). */
export const SYNODIC_MONTH = 29.530588853;

/** Known new moon epoch used by the design (UTC 2000-01-06 18:14). */
export const KNOWN_NEW_MOON_MS = Date.UTC(2000, 0, 6, 18, 14, 0);

/** Draconic-ish period used for declination approximation. */
export const DRACONIC_APPROX = 27.32;

/** Moon hour offset on the day chart (design: −6 h). */
export const MOON_HOUR_OFFSET = 6;

/**
 * Moon age in synodic days [0, SYNODIC_MONTH).
 * Works across the ~100yr range the design claimed.
 */
export function moonAgeDays(at: Date): number {
  const raw = ((at.getTime() - KNOWN_NEW_MOON_MS) / 86_400_000) % SYNODIC_MONTH;
  return raw < 0 ? raw + SYNODIC_MONTH : raw;
}

/** Illumination / fill fraction [0, 1). */
export function moonPhase(ageDays: number): number {
  return ageDays / SYNODIC_MONTH;
}

/**
 * Approximate lunar declination (degrees).
 * Real lunar altitude needs full ephemeris; this tracks phase-linked dates.
 */
export function moonDeclination(ageDays: number): number {
  return 28.5 * Math.sin((2 * Math.PI * ageDays) / DRACONIC_APPROX);
}

/** Effective hour for moon altitude on the chart (shift by MOON_HOUR_OFFSET). */
export function moonEffHour(hour: number): number {
  return (hour - MOON_HOUR_OFFSET + 24) % 24;
}
