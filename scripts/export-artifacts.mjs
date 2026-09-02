/**
 * Writes the two files that let a non-JavaScript port stay in step with this
 * package. Runs against the built `dist`, so it also proves the build exports
 * everything a port needs.
 *
 *   dist/palette.json   — the design data: keyframes and season shaping.
 *                         A port interpolates these; it does not re-type them.
 *   vectors/solar.json  — reference values for the accurate solar path.
 *                         Every implementation asserts against this file, so a
 *                         drift shows up as a failing test rather than as a
 *                         widget that is quietly twenty minutes late.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  currentOrNextGoldenHour,
  DAY_STOPS,
  goldenHourWindows,
  PALETTE_NOON_HOUR,
  PALETTE_SUNRISE_HOUR,
  PALETTE_SUNSET_HOUR,
  seasonShape,
  solarEvents,
  solarPosition,
} from "../dist/index.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PALETTE = {
  version: 1,
  note: "Design data for ports. Interpolate; do not retype.",
  stops: DAY_STOPS.map((s) => ({
    h: s.h,
    rgb: [...s.rgb],
    a: s.a,
    blur: s.blur,
    ring: [...s.ring],
    ringA: s.ringA,
  })),
  // The hours the solar events are pinned to when anchoring the palette.
  anchors: {
    sunrise: PALETTE_SUNRISE_HOUR,
    noon: PALETTE_NOON_HOUR,
    sunset: PALETTE_SUNSET_HOUR,
  },
  // seasonShape is linear in the factor, so its ends are the whole function.
  season: { winter: seasonShape(0), summer: seasonShape(1) },
};

const PLACES = [
  { name: "Yaroslavl", latitude: 57.6261, longitude: 39.8845, timeZone: "Europe/Moscow" },
  { name: "Murmansk", latitude: 68.9585, longitude: 33.0827, timeZone: "Europe/Moscow" },
  { name: "Longyearbyen", latitude: 78.2232, longitude: 15.6469, timeZone: "Arctic/Longyearbyen" },
  { name: "Quito", latitude: -0.1807, longitude: -78.4678, timeZone: "America/Guayaquil" },
  { name: "Sydney", latitude: -33.8688, longitude: 151.2093, timeZone: "Australia/Sydney" },
  { name: "Anchorage", latitude: 61.2181, longitude: -149.9003, timeZone: "America/Anchorage" },
];

const DAYS = ["2026-03-20", "2026-06-21", "2026-09-02", "2026-12-21"];

const iso = (d) => (d == null ? null : d.toISOString());
const round = (n, places = 6) => Number(n.toFixed(places));

const cases = [];
for (const place of PLACES) {
  for (const day of DAYS) {
    // Noon UTC keeps the sample inside the intended calendar day everywhere.
    const at = new Date(`${day}T12:00:00Z`);
    const common = {
      latitude: place.latitude,
      longitude: place.longitude,
      timeZone: place.timeZone,
    };
    const position = solarPosition(at, place.latitude, place.longitude);
    const events = solarEvents({ at, ...common });
    cases.push({
      place: place.name,
      at: at.toISOString(),
      ...common,
      position: {
        altitudeDeg: round(position.altitudeDeg),
        declinationDeg: round(position.declinationDeg),
        equationOfTimeMin: round(position.equationOfTimeMin),
        hourAngleDeg: round(position.hourAngleDeg),
      },
      events: {
        sunrise: iso(events.sunrise),
        sunset: iso(events.sunset),
        solarNoon: iso(events.solarNoon),
        maxAltitudeDeg: round(events.maxAltitudeDeg),
        minAltitudeDeg: round(events.minAltitudeDeg),
        alwaysAbove: events.alwaysAbove,
        alwaysBelow: events.alwaysBelow,
      },
      goldenHourWindows: goldenHourWindows({ at, ...common }).map((w) => ({
        start: iso(w.start),
        end: iso(w.end),
        morning: w.morning,
      })),
      currentOrNext: (() => {
        const w = currentOrNextGoldenHour({ at, ...common });
        return w == null ? null : { start: iso(w.start), end: iso(w.end), morning: w.morning };
      })(),
    });
  }
}

const VECTORS = {
  version: 1,
  note: "Reference values for the accurate solar path. Ports assert against these.",
  generator: "circahue scripts/export-artifacts.mjs",
  toleranceSeconds: 60,
  toleranceDegrees: 0.01,
  cases,
};

mkdirSync(resolve(root, "dist"), { recursive: true });
mkdirSync(resolve(root, "vectors"), { recursive: true });
writeFileSync(resolve(root, "dist/palette.json"), `${JSON.stringify(PALETTE, null, 2)}\n`);
writeFileSync(resolve(root, "vectors/solar.json"), `${JSON.stringify(VECTORS, null, 2)}\n`);

console.log(`palette.json: ${PALETTE.stops.length} stops`);
console.log(`vectors/solar.json: ${cases.length} cases`);
