import { describe, expect, it } from "vitest";
import { clamp, lerp, localHour, wrapHour, dayOfYear } from "../src/index.js";

describe("math helpers", () => {
  it("lerp / clamp / wrapHour", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(wrapHour(25)).toBe(1);
    expect(wrapHour(-1)).toBe(23);
  });

  it("localHour and dayOfYear", () => {
    const d = new Date(2026, 0, 1, 6, 30, 0); // Jan 1
    expect(localHour(d)).toBeCloseTo(6.5, 5);
    expect(dayOfYear(d)).toBe(1);
  });
});
