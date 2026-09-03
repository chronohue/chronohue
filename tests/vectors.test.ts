import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { currentOrNextGoldenHour, goldenHourWindows, solarEvents } from "../src/golden.js";
import { solarPosition } from "../src/ephemeris.js";

/**
 * The cross-language contract. `vectors/solar.json` is generated from this
 * implementation and committed; every port asserts against the same file, so a
 * drift between languages fails a test instead of quietly shifting a widget.
 */

interface WindowVector {
  start: string;
  end: string;
  morning: boolean;
}

interface Vector {
  place: string;
  at: string;
  latitude: number;
  longitude: number;
  timeZone: string;
  position: {
    altitudeDeg: number;
    declinationDeg: number;
    equationOfTimeMin: number;
    hourAngleDeg: number;
  };
  events: {
    sunrise: string | null;
    sunset: string | null;
    solarNoon: string;
    maxAltitudeDeg: number;
    minAltitudeDeg: number;
    alwaysAbove: boolean;
    alwaysBelow: boolean;
  };
  goldenHourWindows: WindowVector[];
  currentOrNext: WindowVector | null;
}

const file = JSON.parse(readFileSync(resolve(__dirname, "../vectors/solar.json"), "utf8")) as {
  toleranceSeconds: number;
  toleranceDegrees: number;
  cases: Vector[];
};

const secondsApart = (a: Date | null, b: string | null): number => {
  if (a === null && b === null) return 0;
  if (a === null || b === null) return Infinity;
  return Math.abs(a.getTime() - Date.parse(b)) / 1000;
};

describe("solar vectors", () => {
  it("ships a spread of latitudes and seasons", () => {
    expect(file.cases.length).toBeGreaterThanOrEqual(20);
    const places = new Set(file.cases.map((c) => c.place));
    expect(places.size).toBeGreaterThanOrEqual(5);
    // Polar night has to be in there, it is where the edge cases live.
    expect(file.cases.some((c) => c.events.alwaysBelow)).toBe(true);
  });

  for (const v of file.cases) {
    it(`${v.place} ${v.at.slice(0, 10)}`, () => {
      const at = new Date(v.at);
      const opts = { at, latitude: v.latitude, longitude: v.longitude, timeZone: v.timeZone };

      const position = solarPosition(at, v.latitude, v.longitude);
      expect(position.altitudeDeg).toBeCloseTo(v.position.altitudeDeg, 4);
      expect(position.declinationDeg).toBeCloseTo(v.position.declinationDeg, 4);
      expect(position.equationOfTimeMin).toBeCloseTo(v.position.equationOfTimeMin, 4);

      const events = solarEvents(opts);
      expect(secondsApart(events.sunrise, v.events.sunrise)).toBeLessThanOrEqual(
        file.toleranceSeconds,
      );
      expect(secondsApart(events.sunset, v.events.sunset)).toBeLessThanOrEqual(
        file.toleranceSeconds,
      );
      expect(events.alwaysAbove).toBe(v.events.alwaysAbove);
      expect(events.alwaysBelow).toBe(v.events.alwaysBelow);

      const windows = goldenHourWindows(opts);
      expect(windows).toHaveLength(v.goldenHourWindows.length);
      windows.forEach((w, i) => {
        const ref = v.goldenHourWindows[i]!;
        expect(w.morning).toBe(ref.morning);
        expect(secondsApart(w.start, ref.start)).toBeLessThanOrEqual(file.toleranceSeconds);
        expect(secondsApart(w.end, ref.end)).toBeLessThanOrEqual(file.toleranceSeconds);
      });

      const next = currentOrNextGoldenHour(opts);
      if (v.currentOrNext === null) {
        expect(next).toBeNull();
      } else {
        expect(next).not.toBeNull();
        expect(next!.morning).toBe(v.currentOrNext.morning);
        expect(secondsApart(next!.start, v.currentOrNext.start)).toBeLessThanOrEqual(
          file.toleranceSeconds,
        );
      }
    });
  }
});
