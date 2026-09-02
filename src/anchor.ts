/**
 * Anchoring the palette to the sun instead of to the clock.
 *
 * `DAY_STOPS` is keyed on hour: the sunrise colour sits at 6.5, zenith at 12,
 * sunset at 18. That holds around 50°N in spring, and nowhere else. In
 * Yaroslavl the sun rises at 03:45 in June and at 08:50 in December, so the
 * June sunrise picks up the cold pre-dawn stop and the December one picks up
 * mid-morning amber — the colour lands on the wrong side of the sun.
 *
 * Sliding the axis does not fix that; the axis has to stretch. These helpers
 * map a wall-clock hour onto the palette's hour so that the observer's real
 * sunrise, solar noon and sunset land on the keyframes built for them.
 */

/** Palette hours the solar events are pinned to. */
export const PALETTE_SUNRISE_HOUR = 6.5;
export const PALETTE_NOON_HOUR = 12;
export const PALETTE_SUNSET_HOUR = 18;

export interface SolarAnchors {
  /** Local fractional hour of sunrise, or null through polar day / night. */
  sunriseHour: number | null;
  /** Local fractional hour of maximum altitude. */
  noonHour: number;
  sunsetHour: number | null;
}

/**
 * Piecewise-linear warp of `hour` through the anchor pairs
 * (0, 0) → (sunrise, 6.5) → (noon, 12) → (sunset, 18) → (24, 24).
 *
 * Returns `hour` unchanged when the anchors cannot form a strictly increasing
 * axis — polar day and night, or a sun that never crosses the horizon.
 */
export function solarAnchoredHour(hour: number, anchors: SolarAnchors): number {
  const from: number[] = [0];
  const to: number[] = [0];

  if (anchors.sunriseHour != null) {
    from.push(anchors.sunriseHour);
    to.push(PALETTE_SUNRISE_HOUR);
  }
  from.push(anchors.noonHour);
  to.push(PALETTE_NOON_HOUR);
  if (anchors.sunsetHour != null) {
    from.push(anchors.sunsetHour);
    to.push(PALETTE_SUNSET_HOUR);
  }
  from.push(24);
  to.push(24);

  for (let i = 1; i < from.length; i++) {
    if (!(from[i]! > from[i - 1]!)) return hour;
  }

  const h = hour < 0 ? 0 : hour > 24 ? 24 : hour;
  for (let i = 0; i < from.length - 1; i++) {
    const a = from[i]!;
    const b = from[i + 1]!;
    if (h >= a && h <= b) {
      const t = (h - a) / (b - a);
      return to[i]! + (to[i + 1]! - to[i]!) * t;
    }
  }
  return h;
}
