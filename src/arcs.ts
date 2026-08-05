import { moonDeclination, moonEffHour, MOON_HOUR_OFFSET } from "./moon.js";
import { solarAltitude } from "./solar.js";
import { sunMarkerDiameter } from "./season.js";
import type { ArcGeometry } from "./types.js";

const ARC_WIDTH = 300;
const MOON_DIAMETER = 20;

export interface ArcInput {
  hour: number;
  seasonFactor: number;
  sunDeclinationDeg: number;
  moonAgeDays: number;
  latitude: number;
  height?: number;
}

/**
 * Build SVG path geometry for the sun/moon day chart.
 * Coordinate space: width 300 × height (default 286), horizon at 34% height.
 */
export function buildArcs(input: ArcInput): ArcGeometry {
  const height = input.height ?? 286;
  const horizonY = height * 0.34;
  const pxPerDeg = 0.8 * (height / 160);
  const declMoon = moonDeclination(input.moonAgeDays);

  const sunY = (h: number) =>
    horizonY - solarAltitude(h, input.sunDeclinationDeg, input.latitude) * pxPerDeg;
  const moonY = (h: number) => horizonY - solarAltitude(h, declMoon, input.latitude) * pxPerDeg;

  const samples = Array.from({ length: 49 }, (_, i) => i / 2);
  const sunPath =
    "M" +
    samples.map((h) => `${((h / 24) * ARC_WIDTH).toFixed(1)},${sunY(h).toFixed(1)}`).join(" L ");
  // path y = moonY(x_hour − 6) so the marker rides the curve
  const moonPath =
    "M" +
    samples
      .map((h) => `${((h / 24) * ARC_WIDTH).toFixed(1)},${moonY(h - MOON_HOUR_OFFSET).toFixed(1)}`)
      .join(" L ");

  const sunX = (input.hour / 24) * ARC_WIDTH;
  const moonX = (input.hour / 24) * ARC_WIDTH;
  const mHour = moonEffHour(input.hour);
  const phase = input.moonAgeDays / 29.530588853;

  return {
    viewBox: `0 0 ${ARC_WIDTH} ${height}`,
    width: ARC_WIDTH,
    height,
    horizonY,
    sunPath,
    moonPath,
    sun: {
      x: sunX,
      y: sunY(input.hour),
      diameter: sunMarkerDiameter(input.seasonFactor),
    },
    moon: {
      x: moonX,
      y: moonY(mHour),
      diameter: MOON_DIAMETER,
      fillWidth: MOON_DIAMETER * phase,
    },
  };
}
