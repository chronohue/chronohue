import { lerp, lerpRgb } from "./math.js";
import type { InterpolatedLight, LightStop, Rgb } from "./types.js";

/**
 * Time-of-day keyframes from the Luminat MainScreens prototype.
 * Midnight moonlight → pre-dawn → sunrise → morning → zenith → afternoon →
 * sunset → dusk → midnight.
 */
export const DAY_STOPS: readonly LightStop[] = [
  { h: 0, rgb: [205, 220, 255], a: 0.32, blur: 13, ring: [180, 200, 255], ringA: 0.5 },
  { h: 5, rgb: [170, 175, 225], a: 0.28, blur: 14, ring: [170, 175, 225], ringA: 0.45 },
  { h: 6.5, rgb: [255, 150, 95], a: 0.5, blur: 10, ring: [255, 140, 80], ringA: 0.7 },
  { h: 9, rgb: [255, 195, 110], a: 0.48, blur: 9, ring: [240, 170, 70], ringA: 0.72 },
  { h: 12, rgb: [255, 228, 160], a: 0.58, blur: 6, ring: [240, 190, 90], ringA: 0.85 },
  { h: 15, rgb: [255, 180, 95], a: 0.5, blur: 8, ring: [235, 160, 60], ringA: 0.78 },
  { h: 18, rgb: [255, 110, 70], a: 0.62, blur: 7, ring: [235, 95, 55], ringA: 0.85 },
  { h: 20, rgb: [200, 120, 160], a: 0.4, blur: 11, ring: [190, 120, 170], ringA: 0.55 },
  { h: 24, rgb: [205, 220, 255], a: 0.32, blur: 13, ring: [180, 200, 255], ringA: 0.5 },
] as const;

/** Interpolate palette stop at fractional hour `h` in [0, 24]. */
export function lightAt(h: number, stops: readonly LightStop[] = DAY_STOPS): InterpolatedLight {
  const hour = h < 0 ? 0 : h > 24 ? 24 : h;
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]!;
    const b = stops[i + 1]!;
    if (hour >= a.h && hour <= b.h) {
      const t = (hour - a.h) / (b.h - a.h || 1);
      return {
        rgb: lerpRgb(a.rgb, b.rgb, t),
        a: lerp(a.a, b.a, t),
        blur: lerp(a.blur, b.blur, t),
        ring: lerpRgb(a.ring, b.ring, t),
        ringA: lerp(a.ringA, b.ringA, t),
      };
    }
  }
  const first = stops[0]!;
  return {
    rgb: first.rgb as Rgb,
    a: first.a,
    blur: first.blur,
    ring: first.ring as Rgb,
    ringA: first.ringA,
  };
}
