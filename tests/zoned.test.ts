import { describe, expect, it } from "vitest";
import {
  formatHourClock,
  localHourInTimeZone,
  sampleLightHue,
  solarDayEvents,
  zonedParts,
} from "../src/index.js";

describe("timeZone wall clock", () => {
  it("zonedParts returns consistent hour for UTC", () => {
    const at = new Date("2026-07-01T15:30:00.000Z");
    const z = zonedParts(at, "UTC");
    expect(z.hour).toBe(15);
    expect(z.minute).toBe(30);
    expect(z.fractionalHour).toBeCloseTo(15.5, 5);
    expect(z.timeZone).toBe("UTC");
  });

  it("Europe/Moscow is UTC+3 in July (no DST)", () => {
    const at = new Date("2026-07-01T12:00:00.000Z");
    const h = localHourInTimeZone(at, "Europe/Moscow");
    expect(h).toBeCloseTo(15, 5);
  });

  it("sampleLightHue respects timeZone for hour", () => {
    const at = new Date("2026-07-01T12:00:00.000Z");
    const msk = sampleLightHue({ at, timeZone: "Europe/Moscow" });
    const nyc = sampleLightHue({ at, timeZone: "America/New_York" });
    // same UTC instant → different wall hours → different accents possible
    expect(msk.hour).toBeCloseTo(15, 5);
    expect(nyc.hour).toBeGreaterThanOrEqual(7);
    expect(nyc.hour).toBeLessThan(9);
    expect(msk.meta.timeZone).toBe("Europe/Moscow");
  });

  it("hourOverride still wins over timeZone wall clock", () => {
    const at = new Date("2026-07-01T12:00:00.000Z");
    const snap = sampleLightHue({
      at,
      timeZone: "Europe/Moscow",
      hourOverride: 6.5,
    });
    expect(snap.hour).toBe(6.5);
    expect(snap.phase).toBe("dawn");
  });
});

describe("solarDayEvents", () => {
  it("July Moscow has sunrise morning and sunset evening", () => {
    const decl = 23; // approx summer
    const ev = solarDayEvents(decl, 55.75);
    expect(ev.sunriseHour).not.toBeNull();
    expect(ev.sunsetHour).not.toBeNull();
    expect(ev.sunriseHour!).toBeGreaterThan(2);
    expect(ev.sunriseHour!).toBeLessThan(6);
    expect(ev.sunsetHour!).toBeGreaterThan(18);
    expect(ev.sunsetHour!).toBeLessThan(23);
    expect(ev.alwaysAbove).toBe(false);
    expect(formatHourClock(ev.sunriseHour)).toMatch(/^\d{2}:\d{2}$/);
  });

  it("polar summer high latitude alwaysAbove", () => {
    const ev = solarDayEvents(23.4, 80);
    expect(ev.alwaysAbove || (ev.sunriseHour == null && ev.maxAltitudeDeg > 0)).toBe(true);
  });
});
