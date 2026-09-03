/**
 * chronohue — circadian accent hues from clock, season, and latitude.
 * (Internal code name: light-hue. Luminat MainScreens design prototype.)
 *
 * Pure TypeScript: no DOM, no framework, zero runtime dependencies.
 * isamarin × BLMK
 */

export { sampleLightHue, lightHueCssVars, SYNODIC_MONTH } from "./sample.js";
export { createLightHueTicker } from "./ticker.js";
export { applyCssVars, buildCssVars, CSS_VAR_KEYS } from "./css.js";
export { lightAt, DAY_STOPS } from "./stops.js";
export { seasonFactor, seasonShape, sunDiscRadius, sunMarkerDiameter } from "./season.js";
export { solarDeclination, solarAltitude, DEFAULT_LATITUDE } from "./solar.js";
export { solarPosition, solarAltitudeAt, HORIZON_DEG } from "./ephemeris.js";
export {
  solarEvents,
  goldenHourWindows,
  currentOrNextGoldenHour,
  GOLDEN_LOW_DEG,
  GOLDEN_HIGH_DEG,
} from "./golden.js";
export {
  solarAnchoredHour,
  PALETTE_SUNRISE_HOUR,
  PALETTE_NOON_HOUR,
  PALETTE_SUNSET_HOUR,
} from "./anchor.js";
export {
  moonAgeDays,
  moonPhase,
  moonDeclination,
  moonEffHour,
  MOON_HOUR_OFFSET,
  KNOWN_NEW_MOON_MS,
  DRACONIC_APPROX,
} from "./moon.js";
export { dayPhase, phaseLabel } from "./phase.js";
export { buildArcs } from "./arcs.js";
export { solarDayEvents, formatHourClock } from "./events.js";
export {
  zonedParts,
  localHourInTimeZone,
  offsetHoursInTimeZone,
  formatZonedDateTime,
} from "./zoned.js";
export {
  lerp,
  clamp,
  rgbToHex,
  rgbCss,
  accentHoverHex,
  accentDimHex,
  localHour,
  dayOfYear,
  wrapHour,
} from "./math.js";

export type {
  SeasonMode,
  DayPhase,
  Rgb,
  LightHueOptions,
  LightStop,
  InterpolatedLight,
  GlowState,
  RingState,
  AccentState,
  BodyState,
  MoonState,
  ArcGeometry,
  LightHueSnapshot,
  LightHueTicker,
} from "./types.js";

export type { LightHueCssVar } from "./css.js";
export type { TickerOptions } from "./ticker.js";
export type { ZonedParts } from "./zoned.js";
export type { SolarDayEvents } from "./events.js";
export type { SolarPosition } from "./ephemeris.js";
export type {
  SolarEventTimes,
  GoldenHourWindow,
  SolarEventOptions,
  GoldenHourOptions,
  NextGoldenHourOptions,
} from "./golden.js";
export type { SolarAnchors } from "./anchor.js";
