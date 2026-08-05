# circahue

**Circadian accent hues** from clock time, season, and observer latitude.

Pure TypeScript — **no DOM, no React, zero runtime deps**.  
Born as the Luminat “living light” accent (code name _light-hue_); public name **circahue**.

[![CI](https://github.com/isamarin/circahue/actions/workflows/ci.yml/badge.svg)](https://github.com/isamarin/circahue/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/circahue.svg)](https://www.npmjs.com/package/circahue)

## Install

```bash
npm install circahue
```

## Quick start

```ts
import { sampleLightHue, applyCssVars, createLightHueTicker } from "circahue";

const snap = sampleLightHue({
  latitude: 57.63, // e.g. Yaroslavl
  timeZone: "Europe/Moscow",
  season: "auto", // auto | winter | mid | summer
  hourOverride: 18, // optional dial / demo
  includeArcs: true, // SVG sun/moon day chart
});

// browser
applyCssVars(document.documentElement, snap.cssVars);

const ticker = createLightHueTicker(
  (s) => {
    applyCssVars(document.documentElement, s.cssVars);
  },
  { latitude: 57.63, timeZone: "Europe/Moscow", intervalMs: 60_000 },
);

// later: ticker.stop();
```

## What it computes

| Output                         | Source                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Accent RGB / hex / hover / dim | Time-of-day keyframes (midnight → sunrise → zenith → sunset → dusk)                        |
| Glow alpha / blur, ring alpha  | Season shaping (winter soft, summer punchy)                                                |
| Solar altitude & day arc       | Declination + hour angle at latitude                                                       |
| Moon age, phase fill, arc      | Synodic month from 2000-01-06 new moon epoch                                               |
| CSS vars                       | `--accent-primary`, `--accent-primary-hover`, `--accent-primary-dim`, plus `--light-hue-*` |

**Brand accent ≠ status.** Green/red stay for success/danger in the host design system.

## API

### `sampleLightHue(opts?): LightHueSnapshot`

```ts
interface LightHueOptions {
  at?: Date;
  hourOverride?: number; // 0–24
  timeZone?: string; // IANA, e.g. "Europe/Moscow"
  latitude?: number; // default 55.75
  longitude?: number; // reserved
  season?: "auto" | "winter" | "mid" | "summer";
  includeArcs?: boolean;
  arcHeight?: number;
  locale?: string;
}
```

Also: `lightHueCssVars`, `createLightHueTicker`, `solarDayEvents`, `zonedParts`, `lightAt`, `DAY_STOPS`, …

## Time zones

```ts
sampleLightHue({
  at: new Date(),
  timeZone: "America/New_York",
  latitude: 40.71,
});
```

Moon age stays absolute (UTC). Latitude is explicit — pair zone + city lat yourself.

## Dev playground

```bash
npm install
npm run dev        # → http://localhost:5173
```

Timezone picker, 24h dial, sun/moon chart, sunrise/sunset model readout.

## Scripts

```bash
npm test
npm run build
npm run typecheck
npm run lint          # ESLint
npm run format:check  # Prettier
npm run publint       # package export quality
npm run quality       # all of the above + tests + build
```

## Publish

See **[PUBLISH.md](./PUBLISH.md)** — npm, tags, CI, CDN.

## License

MIT · isamarin × BLMK
