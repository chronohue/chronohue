import type { Rgb } from "./types.js";

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [
    Math.round(lerp(a[0], b[0], t)),
    Math.round(lerp(a[1], b[1], t)),
    Math.round(lerp(a[2], b[2], t)),
  ] as const;
}

export function rgbToHex(rgb: Rgb): string {
  const toHex = (v: number) =>
    Math.round(clamp(v, 0, 255))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`;
}

export function rgbCss(rgb: Rgb): string {
  return `${rgb[0]},${rgb[1]},${rgb[2]}`;
}

export function accentHoverHex(rgb: Rgb): string {
  return rgbToHex([
    Math.min(255, rgb[0] + 20),
    Math.min(255, rgb[1] + 20),
    Math.min(255, rgb[2] + 20),
  ]);
}

export function accentDimHex(rgb: Rgb): string {
  return rgbToHex([rgb[0] * 0.7, rgb[1] * 0.7, rgb[2] * 0.7]);
}

/** Local civil hour as fractional [0, 24). */
export function localHour(at: Date): number {
  return at.getHours() + at.getMinutes() / 60 + at.getSeconds() / 3600;
}

/**
 * Day-of-year 1…366 using local calendar (same construction as the design:
 * `new Date(y, 0, 0)` then floor ms delta / 864e5).
 */
export function dayOfYear(at: Date): number {
  const start = new Date(at.getFullYear(), 0, 0);
  return Math.floor((at.getTime() - start.getTime()) / 86_400_000);
}

export function wrapHour(h: number): number {
  const x = h % 24;
  return x < 0 ? x + 24 : x;
}
