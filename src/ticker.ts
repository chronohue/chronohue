import { sampleLightHue } from "./sample.js";
import type { LightHueOptions, LightHueSnapshot, LightHueTicker } from "./types.js";

export interface TickerOptions extends LightHueOptions {
  /** Poll interval in ms. Default 60_000 (once per minute is enough for hour drift). */
  intervalMs?: number;
}

/**
 * Periodically re-sample light-hue and invoke `onTick`.
 * Browser / Node friendly (uses `setInterval`). Call `stop()` to clear.
 *
 * Does not touch the DOM — apply `snapshot.cssVars` yourself (or use `applyCssVars`).
 */
export function createLightHueTicker(
  onTick: (snapshot: LightHueSnapshot) => void,
  opts: TickerOptions = {},
): LightHueTicker {
  const { intervalMs = 60_000, ...sampleOpts } = opts;
  const currentOpts: LightHueOptions = { ...sampleOpts };

  const fire = (): LightHueSnapshot => {
    const snap = sampleLightHue(currentOpts);
    onTick(snap);
    return snap;
  };

  // immediate first sample
  fire();

  const id = setInterval(fire, intervalMs);

  return {
    stop: () => clearInterval(id),
    refresh: () => fire(),
  };
}

/**
 * Update options for a running ticker by recreating is awkward —
 * pass a mutable bag via closure, or just call `sampleLightHue` again.
 * This helper re-samples with new options once (no interval).
 */
/** Alias for `sampleLightHue` — re-sample once with new options. */
export function resample(opts: LightHueOptions = {}): LightHueSnapshot {
  return sampleLightHue(opts);
}
