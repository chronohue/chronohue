import { buildArcs } from "./arcs.js";
import { buildCssVars } from "./css.js";
import {
  accentDimHex,
  accentHoverHex,
  dayOfYear,
  localHour,
  rgbCss,
  rgbToHex,
  wrapHour,
} from "./math.js";
import { moonAgeDays, moonDeclination, moonEffHour, moonPhase, SYNODIC_MONTH } from "./moon.js";
import { dayPhase, phaseLabel } from "./phase.js";
import { seasonFactor, seasonShape, sunDiscRadius } from "./season.js";
import { DEFAULT_LATITUDE, solarAltitude, solarDeclination } from "./solar.js";
import { lightAt } from "./stops.js";
import { formatZonedDateTime, zonedParts } from "./zoned.js";
import type { LightHueOptions, LightHueSnapshot } from "./types.js";

const ARC_HEIGHT_DEFAULT = 286;

function resolveLocale(opts: LightHueOptions): string {
  if (opts.locale) return opts.locale;
  if (typeof Intl !== "undefined" && typeof Intl.DateTimeFormat === "function") {
    try {
      return Intl.DateTimeFormat().resolvedOptions().locale || "en";
    } catch {
      /* ignore */
    }
  }
  return "en";
}

function buildCaption(
  at: Date,
  ageDays: number,
  phase: number,
  locale: string,
  timeZone?: string,
  offsetLabel?: string,
): string {
  let pct = `${Math.round(phase * 100)}%`;
  try {
    pct = new Intl.NumberFormat(locale, {
      style: "percent",
      maximumFractionDigits: 0,
    }).format(phase);
  } catch {
    /* keep fallback */
  }
  const dateStr = timeZone
    ? formatZonedDateTime(at, timeZone, locale)
    : at.toLocaleDateString(locale);
  const tz =
    offsetLabel ??
    (() => {
      const h = -at.getTimezoneOffset() / 60;
      return h >= 0 ? `UTC+${h}` : `UTC${h}`;
    })();
  const zoneBit = timeZone ? ` · ${timeZone}` : "";
  return `Moon age: ${ageDays.toFixed(1)} d (${pct} lit) · ${dateStr} · ${tz}${zoneBit} · ${locale}`;
}

/**
 * Sample the living light accent at a given instant / observer position.
 * Pure function — no DOM, no timers.
 */
export function sampleLightHue(opts: LightHueOptions = {}): LightHueSnapshot {
  const at = opts.at ?? new Date();
  const latitude = opts.latitude ?? DEFAULT_LATITUDE;
  const season = opts.season ?? "auto";
  const timeZone = opts.timeZone?.trim() || undefined;

  const zoned = timeZone ? zonedParts(at, timeZone) : null;
  const sFactor = seasonFactor(season, at, zoned?.month);
  const shape = seasonShape(sFactor);

  const hour =
    opts.hourOverride != null
      ? wrapHour(opts.hourOverride)
      : zoned
        ? zoned.fractionalHour
        : localHour(at);
  const light = lightAt(hour);

  const glowAlpha = light.a * shape.alphaMul;
  const glowBlur = light.blur * shape.blurMul;
  const ringAlpha = light.ringA * shape.ringMul;

  const accentHex = rgbToHex(light.rgb);
  const accentHover = accentHoverHex(light.rgb);
  const accentDim = accentDimHex(light.rgb);
  const rgbStr = rgbCss(light.rgb);
  const ringStr = rgbCss(light.ring);

  const phase = dayPhase(hour);
  const doy = zoned?.dayOfYear ?? dayOfYear(at);
  const declSun = solarDeclination(at, doy);
  const sunAlt = solarAltitude(hour, declSun, latitude);

  const ageDays = moonAgeDays(at);
  const mPhase = moonPhase(ageDays);
  const declMoon = moonDeclination(ageDays);
  const mHour = moonEffHour(hour);
  const moonAlt = solarAltitude(mHour, declMoon, latitude);

  const arcHeight = opts.arcHeight ?? ARC_HEIGHT_DEFAULT;
  const horizonY = arcHeight * 0.34;
  const pxPerDeg = 0.8 * (arcHeight / 160);
  const sunY = horizonY - sunAlt * pxPerDeg;
  const moonY = horizonY - moonAlt * pxPerDeg;

  const snapBase = {
    accent: {
      hex: accentHex,
      rgb: light.rgb,
      rgbCss: rgbStr,
    },
    accentHover,
    accentDim,
    glow: {
      rgb: rgbStr,
      alpha: glowAlpha,
      blur: glowBlur,
    },
    ring: {
      rgb: ringStr,
      alpha: ringAlpha,
    },
  };

  const locale = resolveLocale(opts);
  const includeArcs = opts.includeArcs === true;
  const offsetLabel = zoned?.offsetLabel;

  const snapshot: LightHueSnapshot = {
    hour,
    hourInt: Math.round(hour) % 24,
    seasonFactor: sFactor,
    phase,
    phaseLabel: phaseLabel(phase),
    ...snapBase,
    cssVars: buildCssVars(snapBase),
    sun: {
      altitudeDeg: sunAlt,
      aboveHorizon: sunAlt > 0,
      xNorm: hour / 24,
      y: sunY,
      declinationDeg: declSun,
      discRadius: sunDiscRadius(sFactor),
    },
    moon: {
      altitudeDeg: moonAlt,
      aboveHorizon: moonAlt > 0,
      xNorm: hour / 24,
      y: moonY,
      ageDays,
      phase: mPhase,
      declinationDeg: declMoon,
    },
    caption: buildCaption(at, ageDays, mPhase, locale, timeZone, offsetLabel),
    meta: {
      latitude,
      season,
      at,
      dayOfYear: doy,
      ...(timeZone ? { timeZone: zoned?.timeZone ?? timeZone, offsetLabel } : {}),
    },
  };

  if (includeArcs) {
    snapshot.arcs = buildArcs({
      hour,
      seasonFactor: sFactor,
      sunDeclinationDeg: declSun,
      moonAgeDays: ageDays,
      latitude,
      height: arcHeight,
    });
  }

  return snapshot;
}

/**
 * Convenience: only the CSS custom properties map.
 * Equivalent to `sampleLightHue(opts).cssVars`.
 */
export function lightHueCssVars(opts: LightHueOptions = {}): Record<string, string> {
  return sampleLightHue(opts).cssVars;
}

/** Synodic month constant re-export for consumers drawing moon fill. */
export { SYNODIC_MONTH };
