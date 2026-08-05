import type { LightHueSnapshot } from "./types.js";

/** CSS custom property names written by light-hue. */
export const CSS_VAR_KEYS = [
  "--accent-primary",
  "--accent-primary-hover",
  "--accent-primary-dim",
  "--light-hue-glow-rgb",
  "--light-hue-glow-alpha",
  "--light-hue-glow-blur",
  "--light-hue-ring-rgb",
  "--light-hue-ring-alpha",
  "--light-hue-rgb",
] as const;

export type LightHueCssVar = (typeof CSS_VAR_KEYS)[number];

/** Build the cssVars map from a computed snapshot (or partial accent/glow/ring). */
export function buildCssVars(
  snap: Pick<LightHueSnapshot, "accent" | "accentHover" | "accentDim" | "glow" | "ring">,
): Record<string, string> {
  return {
    "--accent-primary": snap.accent.hex,
    "--accent-primary-hover": snap.accentHover,
    "--accent-primary-dim": snap.accentDim,
    "--light-hue-glow-rgb": snap.glow.rgb,
    "--light-hue-glow-alpha": snap.glow.alpha.toFixed(4),
    "--light-hue-glow-blur": `${snap.glow.blur.toFixed(2)}px`,
    "--light-hue-ring-rgb": snap.ring.rgb,
    "--light-hue-ring-alpha": snap.ring.alpha.toFixed(4),
    "--light-hue-rgb": snap.accent.rgbCss,
  };
}

/**
 * Apply snapshot CSS vars onto an element (browser only).
 * No-op friendly: pass `null` / undefined to skip.
 */
export function applyCssVars(
  el: { style: { setProperty(name: string, value: string): void } } | null | undefined,
  vars: Record<string, string>,
): void {
  if (!el) return;
  for (const [k, v] of Object.entries(vars)) {
    el.style.setProperty(k, v);
  }
}
