import { describe, expect, it } from "vitest";

import { solarAnchoredHour } from "../src/anchor.js";
import { solarPosition } from "../src/ephemeris.js";
import { currentOrNextGoldenHour, goldenHourWindows, solarEvents } from "../src/golden.js";
import { sampleLightHue } from "../src/sample.js";
import { solarAltitude, solarDeclination } from "../src/solar.js";

// Yaroslavl — where the reference readings were taken.
const YAR = { latitude: 57.6261, longitude: 39.8845, timeZone: "Europe/Moscow" };

function hhmm(at: Date | null, timeZone = "Europe/Moscow"): string {
  if (at == null) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(at);
}

function minutesOfDay(at: Date, timeZone = "Europe/Moscow"): number {
  const [h, m] = hhmm(at, timeZone).split(":").map(Number);
  return h! * 60 + m!;
}

describe("ephemeris", () => {
  it("puts solar noon where longitude says, not at 12:00", () => {
    // Yaroslavl sits at 39.88E while the UTC+3 meridian is 45E, so solar noon
    // runs ~20 minutes late all year. The design model assumes 12:00 exactly.
    const events = solarEvents({ at: new Date("2026-09-02T12:00:00+03:00"), ...YAR });
    const noon = minutesOfDay(events.solarNoon);
    expect(noon).toBeGreaterThan(12 * 60 + 12);
    expect(noon).toBeLessThan(12 * 60 + 30);
  });

  it("keeps the equation of time inside its physical range", () => {
    for (let month = 0; month < 12; month++) {
      const at = new Date(Date.UTC(2026, month, 15, 12));
      const { equationOfTimeMin } = solarPosition(at, YAR.latitude, YAR.longitude);
      expect(Math.abs(equationOfTimeMin)).toBeLessThan(17);
    }
  });

  it("disagrees with the design model by enough to matter", () => {
    // Same instant, two models. The gap is the whole reason this module exists.
    const at = new Date("2026-09-02T12:00:00+03:00");
    const precise = solarPosition(at, YAR.latitude, YAR.longitude).altitudeDeg;
    const design = solarAltitude(12, solarDeclination(at, 245), YAR.latitude);
    expect(Math.abs(precise - design)).toBeGreaterThan(0.3);
  });
});

describe("solar events", () => {
  it("agrees with the Kotlin port to the minute", () => {
    // Cross-language contract: the golden-hour widget's SolarCalcTest asserts
    // this same instant. The stock Leica widget reads 19:19 for this day because
    // its sunrise equation drops the equation of time.
    const events = solarEvents({ at: new Date("2026-09-02T12:00:00+03:00"), ...YAR });
    expect(hhmm(events.sunset)).toBe("19:16");
  });

  it("reports polar night with no sunrise", () => {
    const events = solarEvents({
      at: new Date("2026-12-21T12:00:00Z"),
      latitude: 78.22,
      longitude: 15.65,
      timeZone: "UTC",
    });
    expect(events.sunrise).toBeNull();
    expect(events.sunset).toBeNull();
    expect(events.alwaysBelow).toBe(true);
  });
});

describe("golden hour", () => {
  it("finds both windows of the day, morning first", () => {
    const windows = goldenHourWindows({ at: new Date("2026-09-02T12:00:00+03:00"), ...YAR });
    expect(windows).toHaveLength(2);
    expect(windows[0]!.morning).toBe(true);
    expect(windows[1]!.morning).toBe(false);
    expect(windows[0]!.start.getTime()).toBeLessThan(windows[1]!.start.getTime());
  });

  it("holds the elevation bounds at both edges of every window", () => {
    for (const w of goldenHourWindows({ at: new Date("2026-09-02T12:00:00+03:00"), ...YAR })) {
      for (const edge of [w.start, w.end]) {
        const alt = solarPosition(edge, YAR.latitude, YAR.longitude).altitudeDeg;
        expect(alt).toBeGreaterThan(-4.3);
        expect(alt).toBeLessThan(6.3);
      }
    }
  });

  it("rolls over to tomorrow morning once the evening one has passed", () => {
    // 20:23 local — the moment the stock widget was still showing 18:39-19:19,
    // a window that had ended over an hour earlier.
    const at = new Date("2026-09-02T20:23:00+03:00");
    const next = currentOrNextGoldenHour({ at, ...YAR });
    expect(next).not.toBeNull();
    expect(next!.start.getTime()).toBeGreaterThan(at.getTime());
    expect(next!.morning).toBe(true);
    expect(hhmm(next!.start)).toBe("05:00");
  });

  it("reports a window already under way rather than the next one", () => {
    const at = new Date("2026-09-02T18:50:00+03:00");
    const current = currentOrNextGoldenHour({ at, ...YAR });
    expect(current).not.toBeNull();
    expect(current!.start.getTime()).toBeLessThanOrEqual(at.getTime());
    expect(current!.end.getTime()).toBeGreaterThanOrEqual(at.getTime());
    expect(current!.morning).toBe(false);
  });

  it("has none through polar night", () => {
    const next = currentOrNextGoldenHour({
      at: new Date("2026-12-21T12:00:00Z"),
      latitude: 78.22,
      longitude: 15.65,
      timeZone: "UTC",
    });
    expect(next).toBeNull();
  });
});

describe("solar-anchored palette", () => {
  it("pins the real sunrise to the sunrise keyframe", () => {
    expect(
      solarAnchoredHour(3.75, { sunriseHour: 3.75, noonHour: 12.3, sunsetHour: 21 }),
    ).toBeCloseTo(6.5, 6);
    expect(
      solarAnchoredHour(12.3, { sunriseHour: 3.75, noonHour: 12.3, sunsetHour: 21 }),
    ).toBeCloseTo(12, 6);
  });

  it("passes the hour through when the anchors cannot be ordered", () => {
    expect(solarAnchoredHour(9, { sunriseHour: null, noonHour: 12, sunsetHour: null })).toBe(9);
    expect(solarAnchoredHour(9, { sunriseHour: 13, noonHour: 12, sunsetHour: 18 })).toBe(9);
  });

  it("moves the accent where the clock model puts it hours off", () => {
    // Murmansk, midsummer: the sun is up at 01:00 but the clock palette only
    // reaches its sunrise stop at 06:30.
    const opts = {
      at: new Date("2026-06-21T02:00:00+03:00"),
      latitude: 68.97,
      longitude: 33.08,
      timeZone: "Europe/Moscow",
    } as const;
    const clock = sampleLightHue(opts);
    const solar = sampleLightHue({ ...opts, hourMode: "solar" });
    expect(solar.paletteHour).not.toBeCloseTo(clock.paletteHour, 3);
    expect(solar.accent.hex).not.toBe(clock.accent.hex);
  });

  it("leaves the default mode exactly as it was", () => {
    const opts = { at: new Date("2026-09-02T18:00:00+03:00"), ...YAR };
    const snap = sampleLightHue(opts);
    expect(snap.paletteHour).toBe(snap.hour);
    expect(snap.accent.hex).toBe(sampleLightHue({ ...opts, hourMode: "clock" }).accent.hex);
  });
});
