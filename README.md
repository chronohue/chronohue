# chronohue

**Circadian accent hues** from clock time, season, and observer latitude.

Pure TypeScript — **no DOM, no React, zero runtime deps**.  
Born as the Lightmotiv “living light” accent (code name _light-hue_); npm package **`chronohue`**.

[![CI](https://github.com/chronohue/chronohue/actions/workflows/ci.yml/badge.svg)](https://github.com/chronohue/chronohue/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/chronohue.svg)](https://www.npmjs.com/package/chronohue)

## Install

```bash
npm install chronohue
```

## Adapters

Core stays framework-free. For a 30-second drop-in:

| Host             | Package                                                                    | Fast path                          |
| ---------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| Tailwind v3 / v4 | [`@chronohue/tailwind`](https://github.com/chronohue/chronohue-tailwind)   | `start()` + `bg-accent`            |
| Svelte 5         | [`@chronohue/svelte`](https://github.com/chronohue/chronohue-svelte)       | `start()` / `$hue` / `<ChronoHue>` |
| Bootstrap 5      | [`@chronohue/bootstrap`](https://github.com/chronohue/chronohue-bootstrap) | `start()` + `.btn-primary`         |

Local siblings next to this repo: `../tailwind-adapter`, `../svelte5-adapter`, `../bootstrap-adapter`.

## Quick start

```ts
import { sampleLightHue, applyCssVars, createLightHueTicker } from "chronohue";

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

## Solar events and the golden hour

`solarAltitude` in the palette path is a design model: hour 12 _is_ solar noon and
longitude is ignored. That is invisible in an accent colour and wrong by up to half
an hour in a time — in Yaroslavl (39.88°E, UTC+3) the meridian is at 45°E, so noon
falls at 12:20 before the equation of time adds its own ±15 minutes.

Anything you would schedule against goes through the accurate path instead:

```ts
import { solarEvents, goldenHourWindows, currentOrNextGoldenHour } from "chronohue";

const place = { latitude: 57.6261, longitude: 39.8845, timeZone: "Europe/Moscow" };

solarEvents({ ...place }); // sunrise / sunset / solarNoon of the local day
goldenHourWindows({ ...place }); // both windows of that day — the marks on an arc
currentOrNextGoldenHour({ ...place }); // the one running now, else the next
```

The golden hour is the sun between **-4°** and **+6°**, not a flat forty minutes
after sunrise. `currentOrNextGoldenHour` rolls into tomorrow once this evening's has
passed, and returns `null` through polar night.

## Anchoring the palette to the sun

`DAY_STOPS` is keyed on hour: sunrise colour at 6.5, zenith at 12, sunset at 18.
That holds around 50°N in spring and nowhere else — in Murmansk in June the sun is
up at 01:00 while the clock palette only reaches its sunrise stop at 06:30.

`hourMode: "solar"` stretches the palette's hour axis so the observer's real
sunrise, solar noon and sunset land on the keyframes built for them:

```ts
sampleLightHue({ ...place, hourMode: "solar" });
```

Default stays `"clock"`, so published behaviour is unchanged. `snapshot.paletteHour`
shows which hour the palette was actually read at.

## Ports

Two files are built for implementations in other languages:

| File                 | What it is                                                         |
| -------------------- | ------------------------------------------------------------------ |
| `dist/palette.json`  | `DAY_STOPS` and season shaping as data — interpolate, don't retype |
| `vectors/solar.json` | Reference solar values every port asserts against                  |

The vectors are the contract. A port that drifts fails a test instead of quietly
running twenty minutes late. Regenerate with `npm run artifacts`.

## Time zones

```ts
sampleLightHue({
  at: new Date(),
  timeZone: "America/New_York",
  latitude: 40.71,
});
```

Moon age stays absolute (UTC). Latitude is explicit — pair zone + city lat yourself.

## Demo

Live: **https://chronohue.isamarin.xyz/**

The sun/moon chart is [`@chronohue/widget`](https://github.com/chronohue/widget) — same drawing as Lumina.

Location / timezone / lat·lon, 24h dial, sun·moon chart, UI kit on CSS vars.

```bash
npm install
npm run dev              # → http://localhost:5173
npm run build:demo       # → ./site
bash deploy/deploy.sh    # rsync to Luma
```

## Scripts

```bash
npm test
npm run build
npm run typecheck
npm run lint          # ESLint
npm run format:check  # Prettier
npm run publint       # package export quality
npm run quality       # all of the above + tests + build
npm run build:demo    # static playground → ./site
```

## Publish

See **[PUBLISH.md](./PUBLISH.md)** — npm, tags, CI, CDN.

## License

MIT · isamarin × BLMK
