import { describe, expect, it } from "vitest";
import {
  accentDimHex,
  accentHoverHex,
  dayPhase,
  lightAt,
  lightHueCssVars,
  phaseLabel,
  rgbToHex,
  sampleLightHue,
  seasonFactor,
  solarAltitude,
  solarDeclination,
  moonAgeDays,
  DEFAULT_LATITUDE,
} from "../src/index.js";

/** Fixed local date: avoid DST flakiness by using explicit overrides. */
const NOON_JULY = new Date(2026, 6, 1, 12, 0, 0); // July 1 2026 local noon
const MIDNIGHT_JAN = new Date(2026, 0, 15, 0, 0, 0);

describe("seasonFactor", () => {
  it("maps overrides", () => {
    expect(seasonFactor("winter", NOON_JULY)).toBe(0);
    expect(seasonFactor("mid", NOON_JULY)).toBe(0.5);
    expect(seasonFactor("summer", NOON_JULY)).toBe(1);
  });

  it("auto peaks in July and troughs in January", () => {
    expect(seasonFactor("auto", NOON_JULY)).toBe(1);
    expect(seasonFactor("auto", MIDNIGHT_JAN)).toBe(0);
    // April (month 3): dist to July = 3 → 1 - 3/6 = 0.5
    expect(seasonFactor("auto", new Date(2026, 3, 1))).toBe(0.5);
  });
});

describe("lightAt / stops", () => {
  it("returns midnight moonlight blue at h=0", () => {
    const l = lightAt(0);
    expect(l.rgb).toEqual([205, 220, 255]);
  });

  it("returns zenith warm yellow at h=12", () => {
    const l = lightAt(12);
    expect(l.rgb).toEqual([255, 228, 160]);
    expect(rgbToHex(l.rgb)).toBe("#ffe4a0");
  });

  it("lerps between stops", () => {
    const a = lightAt(0);
    const b = lightAt(5);
    const mid = lightAt(2.5);
    // channel-wise between endpoints
    for (let i = 0; i < 3; i++) {
      const lo = Math.min(a.rgb[i]!, b.rgb[i]!);
      const hi = Math.max(a.rgb[i]!, b.rgb[i]!);
      expect(mid.rgb[i]).toBeGreaterThanOrEqual(lo);
      expect(mid.rgb[i]).toBeLessThanOrEqual(hi);
    }
  });
});

describe("dayPhase", () => {
  it("matches design bands", () => {
    expect(dayPhase(0)).toBe("night");
    expect(dayPhase(6)).toBe("dawn");
    expect(dayPhase(9)).toBe("morning");
    expect(dayPhase(12)).toBe("zenith");
    expect(dayPhase(15)).toBe("day");
    expect(dayPhase(18)).toBe("sunset");
    expect(dayPhase(20.5)).toBe("dusk");
    expect(dayPhase(22)).toBe("night");
    expect(phaseLabel("sunset")).toBe("Sunset");
  });
});

describe("solar geometry", () => {
  it("uses Moscow latitude by default", () => {
    expect(DEFAULT_LATITUDE).toBe(55.75);
  });

  it("July noon altitude is high positive at Moscow", () => {
    const decl = solarDeclination(NOON_JULY);
    // July declination ~ +23°
    expect(decl).toBeGreaterThan(20);
    expect(decl).toBeLessThan(24);
    const alt = solarAltitude(12, decl, 55.75);
    // ~ 90 - (55.75 - decl) ≈ 57°
    expect(alt).toBeGreaterThan(50);
    expect(alt).toBeLessThan(65);
  });

  it("January noon altitude is lower", () => {
    const jan = new Date(2026, 0, 15, 12, 0, 0);
    const decl = solarDeclination(jan);
    expect(decl).toBeLessThan(-15);
    const alt = solarAltitude(12, decl, 55.75);
    expect(alt).toBeGreaterThan(5);
    expect(alt).toBeLessThan(25);
  });

  it("midnight altitude is negative at mid-latitudes", () => {
    const decl = solarDeclination(NOON_JULY);
    const alt = solarAltitude(0, decl, 55.75);
    expect(alt).toBeLessThan(0);
  });
});

describe("moonAgeDays", () => {
  it("is in [0, 29.53)", () => {
    const age = moonAgeDays(NOON_JULY);
    expect(age).toBeGreaterThanOrEqual(0);
    expect(age).toBeLessThan(29.530588853);
  });

  it("returns ~0 near known new moon epoch", () => {
    // 2000-01-06 18:14 UTC
    const known = new Date(Date.UTC(2000, 0, 6, 18, 14, 0));
    expect(moonAgeDays(known)).toBeCloseTo(0, 5);
  });
});

describe("sampleLightHue", () => {
  it("produces accent + css vars at noon summer", () => {
    const snap = sampleLightHue({
      at: NOON_JULY,
      hourOverride: 12,
      season: "summer",
      latitude: 55.75,
      locale: "en",
    });
    expect(snap.hour).toBe(12);
    expect(snap.phase).toBe("zenith");
    expect(snap.seasonFactor).toBe(1);
    expect(snap.accent.hex).toBe("#ffe4a0");
    expect(snap.accentHover).toBe(accentHoverHex(snap.accent.rgb));
    expect(snap.accentDim).toBe(accentDimHex(snap.accent.rgb));
    expect(snap.cssVars["--accent-primary"]).toBe(snap.accent.hex);
    expect(snap.cssVars["--accent-primary-hover"]).toBe(snap.accentHover);
    expect(snap.sun.aboveHorizon).toBe(true);
    expect(snap.arcs).toBeUndefined();
  });

  it("includes arcs when requested", () => {
    const snap = sampleLightHue({
      at: NOON_JULY,
      hourOverride: 12,
      includeArcs: true,
    });
    expect(snap.arcs).toBeDefined();
    expect(snap.arcs!.sunPath.startsWith("M")).toBe(true);
    expect(snap.arcs!.moonPath.startsWith("M")).toBe(true);
    expect(snap.arcs!.width).toBe(300);
    expect(snap.arcs!.sun.y).toBeLessThan(snap.arcs!.horizonY); // above horizon
  });

  it("winter softens glow vs summer at same hour", () => {
    const winter = sampleLightHue({
      at: NOON_JULY,
      hourOverride: 12,
      season: "winter",
    });
    const summer = sampleLightHue({
      at: NOON_JULY,
      hourOverride: 12,
      season: "summer",
    });
    expect(winter.glow.blur).toBeGreaterThan(summer.glow.blur);
    expect(winter.glow.alpha).toBeLessThan(summer.glow.alpha);
    expect(winter.sun.discRadius).toBeLessThan(summer.sun.discRadius);
  });

  it("sunset hour shifts accent toward red-orange", () => {
    const snap = sampleLightHue({
      at: NOON_JULY,
      hourOverride: 18,
      season: "mid",
    });
    expect(snap.phase).toBe("sunset");
    expect(snap.accent.rgb[0]).toBe(255);
    expect(snap.accent.rgb[2]).toBeLessThan(100);
  });

  it("lightHueCssVars matches sample", () => {
    const opts = { at: NOON_JULY, hourOverride: 9 as number };
    expect(lightHueCssVars(opts)).toEqual(sampleLightHue(opts).cssVars);
  });
});
