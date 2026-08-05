import type { SeasonMode } from "./types.js";

/**
 * Season intensity factor in [0, 1]:
 * - winter → 0 (softer glow, fluffier blur, smaller sun disc)
 * - summer → 1 (punchier alpha / ring, larger disc)
 * - mid → 0.5
 * - auto → triangle peaking at July (month index 6), trough at January
 *
 * Matches the Luminat design prototype month heuristic.
 *
 * @param monthOverride — 0–11; when set (e.g. from IANA zone wall clock), used instead of `at.getMonth()`.
 */
export function seasonFactor(mode: SeasonMode, at: Date, monthOverride?: number): number {
  if (mode === "winter") return 0;
  if (mode === "mid") return 0.5;
  if (mode === "summer") return 1;
  const month = monthOverride ?? at.getMonth(); // 0–11
  const seasonDist = Math.min(Math.abs(month - 6), 12 - Math.abs(month - 6));
  return 1 - seasonDist / 6;
}

/** Season multipliers applied to stop alpha / blur / ring. */
export function seasonShape(factor: number): {
  blurMul: number;
  alphaMul: number;
  ringMul: number;
} {
  return {
    // winter softer/fluffier (bigger blur, lower alpha), summer punchier
    blurMul: 1.6 - factor * 0.8,
    alphaMul: 0.55 + factor * 0.55,
    ringMul: 0.6 + factor * 0.5,
  };
}

/** Design “hidden” sun disc radius (half-diameter style number). */
export function sunDiscRadius(seasonFactorValue: number): number {
  return 7.5 + seasonFactorValue * 5;
}

/** Chart sun marker diameter in px (design: (11 + factor * 6) * 2). */
export function sunMarkerDiameter(seasonFactorValue: number): number {
  return (11 + seasonFactorValue * 6) * 2;
}
