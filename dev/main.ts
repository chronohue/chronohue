/**
 * circahue playground — timezone, dial, sun/moon chart, reality check.
 */
import {
  applyCssVars,
  DAY_STOPS,
  formatHourClock,
  formatZonedDateTime,
  lightAt,
  rgbToHex,
  sampleLightHue,
  solarDayEvents,
  type LightHueSnapshot,
  type SeasonMode,
} from "../src/index.ts";
import { ARC_HEIGHT, mountSky, type SkyHandle } from "@circahue/widget";
import "@circahue/widget/sky.css";

// ── Place presets (lat + IANA zone) ─────────────────────────────────────────

interface Place {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  timeZone: string;
}

const PLACES: Place[] = [
  { id: "moscow", label: "Moscow", latitude: 55.75, longitude: 37.62, timeZone: "Europe/Moscow" },
  {
    id: "yaroslavl",
    label: "Yaroslavl",
    latitude: 57.63,
    longitude: 39.87,
    timeZone: "Europe/Moscow",
  },
  {
    id: "spb",
    label: "Saint Petersburg",
    latitude: 59.93,
    longitude: 30.34,
    timeZone: "Europe/Moscow",
  },
  {
    id: "murmansk",
    label: "Murmansk (polar)",
    latitude: 68.97,
    longitude: 33.09,
    timeZone: "Europe/Moscow",
  },
  { id: "london", label: "London", latitude: 51.51, longitude: -0.13, timeZone: "Europe/London" },
  {
    id: "reykjavik",
    label: "Reykjavík",
    latitude: 64.15,
    longitude: -21.94,
    timeZone: "Atlantic/Reykjavik",
  },
  {
    id: "nyc",
    label: "New York",
    latitude: 40.71,
    longitude: -74.01,
    timeZone: "America/New_York",
  },
  {
    id: "la",
    label: "Los Angeles",
    latitude: 34.05,
    longitude: -118.24,
    timeZone: "America/Los_Angeles",
  },
  { id: "tokyo", label: "Tokyo", latitude: 35.68, longitude: 139.69, timeZone: "Asia/Tokyo" },
  {
    id: "singapore",
    label: "Singapore",
    latitude: 1.35,
    longitude: 103.82,
    timeZone: "Asia/Singapore",
  },
  {
    id: "sydney",
    label: "Sydney",
    latitude: -33.87,
    longitude: 151.21,
    timeZone: "Australia/Sydney",
  },
  {
    id: "cape",
    label: "Cape Town",
    latitude: -33.92,
    longitude: 18.42,
    timeZone: "Africa/Johannesburg",
  },
  { id: "custom", label: "Custom…", latitude: 55.75, longitude: 37.62, timeZone: "UTC" },
];

/** Common IANA zones for the timezone dropdown. */
const TIMEZONES = [
  "UTC",
  "Europe/Moscow",
  "Europe/Samara",
  "Asia/Yekaterinburg",
  "Asia/Novosibirsk",
  "Asia/Vladivostok",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Atlantic/Reykjavik",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Africa/Johannesburg",
  "Africa/Cairo",
];

const SEASONS: { id: SeasonMode; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "winter", label: "Winter" },
  { id: "mid", label: "Mid" },
  { id: "summer", label: "Summer" },
];

// ── DOM ─────────────────────────────────────────────────────────────────────

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

const el = {
  place: $("place") as unknown as HTMLSelectElement,
  tz: $("tz") as unknown as HTMLSelectElement,
  lat: $("lat") as unknown as HTMLInputElement,
  lon: $("lon") as unknown as HTMLInputElement,
  date: $("date") as unknown as HTMLInputElement,
  liveClock: $("liveClock") as unknown as HTMLInputElement,
  seasonSeg: $("seasonSeg"),
  dial: $("dial"),
  dialTicks: $("dialTicks"),
  needle: $("needle"),
  hub: $("hub"),
  dialHour: $("dialHour"),
  hourRange: $("hourRange") as unknown as HTMLInputElement,
  nowBtn: $("nowBtn") as unknown as HTMLButtonElement,
  chartTitle: $("chartTitle"),
  skyHost: $("skyHost"),
  caption: $("caption"),
  swatch: $("swatch"),
  accentHex: $("accentHex"),
  accentRgb: $("accentRgb"),
  phasePill: $("phasePill"),
  clockReadout: $("clockReadout"),
  brandMark: $("brandMark"),
  facts: $("facts"),
  stopStrip: $("stopStrip"),
  demoProgress: $("demoProgress"),
  demoProgressLabel: $("demoProgressLabel"),
  metaAccent: $("metaAccent"),
  metaPhase: $("metaPhase"),
  metaSun: $("metaSun"),
  metaMoon: $("metaMoon"),
  metaPlace: $("metaPlace"),
  metaSeason: $("metaSeason"),
};

const sky: SkyHandle = mountSky(el.skyHost, {
  note: false,
  onHour: (h) => setHour(h),
});

// ── State ───────────────────────────────────────────────────────────────────

let season: SeasonMode = "auto";
/** null = follow live wall clock in selected TZ */
let hourOverride: number | null = null;

// ── Init controls ───────────────────────────────────────────────────────────

function fillSelects() {
  for (const p of PLACES) {
    const o = document.createElement("option");
    o.value = p.id;
    o.textContent = p.label;
    el.place.appendChild(o);
  }
  el.place.value = "yaroslavl";

  // Ensure place zones are in the list
  const zones = new Set(TIMEZONES);
  for (const p of PLACES) zones.add(p.timeZone);
  // runtime zone
  try {
    zones.add(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    /* ignore */
  }

  for (const z of [...zones].sort()) {
    const o = document.createElement("option");
    o.value = z;
    o.textContent = z;
    el.tz.appendChild(o);
  }
  const home = PLACES.find((p) => p.id === "yaroslavl")!;
  el.tz.value = home.timeZone;
  el.lat.value = String(home.latitude);
  el.lon.value = String(home.longitude);

  const today = new Date();
  el.date.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  for (const s of SEASONS) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = s.label;
    b.dataset.season = s.id;
    if (s.id === season) b.classList.add("active");
    b.addEventListener("click", () => {
      season = s.id;
      el.seasonSeg.querySelectorAll("button").forEach((x) => x.classList.toggle("active", x === b));
      render();
    });
    el.seasonSeg.appendChild(b);
  }

  // stop strip legend
  for (const stop of DAY_STOPS.slice(0, -1)) {
    const span = document.createElement("span");
    span.style.background = rgbToHex(stop.rgb);
    span.title = `${formatHourClock(stop.h)} ${rgbToHex(stop.rgb)}`;
    el.stopStrip.appendChild(span);
  }
}

function buildDialTicks() {
  const size = 220;
  const center = size / 2;
  const radius = 92;
  el.dialTicks.innerHTML = "";
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
    const major = i % 3 === 0;
    const r = major ? 8 : 5;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tick${major ? " major" : ""}`;
    btn.dataset.hour = String(i);
    btn.style.width = `${r}px`;
    btn.style.height = `${r}px`;
    btn.style.left = `${center + radius * Math.cos(angle) - r / 2}px`;
    btn.style.top = `${center + radius * Math.sin(angle) - r / 2}px`;
    btn.title = `${String(i).padStart(2, "0")}:00`;
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setHour(i);
    });
    el.dialTicks.appendChild(btn);
  }
}

// ── Time helpers ────────────────────────────────────────────────────────────

function selectedDateAtHour(hour: number): Date {
  // Build a UTC instant that roughly maps to wall clock in zone via iterative search —
  // for playground accuracy we use a simpler approach: local Date from date input + hour
  // as if it were zone wall clock, then sample with timeZone + hourOverride.
  // The `at` date mainly drives day-of-year / moon age; hour comes from override.
  const [y, m, d] = el.date.value.split("-").map(Number);
  // noon UTC on that calendar day ± avoids most DST boundary weirdness for moon/season
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  // encode fractional hour into minutes for moon? Moon uses absolute `at` —
  // keep base as calendar day noon UTC, hour separate via override.
  void hour;
  return base;
}

function nowInZoneWallHour(): number {
  const snap = sampleLightHue({
    at: new Date(),
    timeZone: el.tz.value,
    latitude: Number(el.lat.value),
  });
  return snap.hour;
}

function setHour(h: number) {
  hourOverride = ((h % 24) + 24) % 24;
  el.liveClock.checked = false;
  el.hourRange.value = String(hourOverride);
  render();
}

function hourFromPointer(e: PointerEvent): number {
  const rect = el.dial.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let angle = Math.atan2(e.clientY - cy, e.clientX - cx) + Math.PI / 2;
  if (angle < 0) angle += 2 * Math.PI;
  return (angle / (2 * Math.PI)) * 24;
}

// ── Render ──────────────────────────────────────────────────────────────────

function render() {
  const latitude = Number(el.lat.value);
  const timeZone = el.tz.value;
  const live = el.liveClock.checked;

  if (live) {
    hourOverride = null;
  }

  const hour = hourOverride != null ? hourOverride : nowInZoneWallHour();

  // keep range in sync when live
  if (live) {
    el.hourRange.value = String(hour);
  }

  const at = live ? new Date() : selectedDateAtHour(hour);

  const snap = sampleLightHue({
    at,
    timeZone,
    latitude: Number.isFinite(latitude) ? latitude : 55.75,
    season,
    hourOverride: live ? undefined : hour,
    includeArcs: true,
    arcHeight: ARC_HEIGHT,
    locale: "en",
  });

  applyCssVars(document.documentElement, snap.cssVars);
  paint(snap, timeZone, live);
}

function paint(snap: LightHueSnapshot, timeZone: string, live: boolean) {
  // header
  el.phasePill.textContent = `${snap.phaseLabel} · ${formatHourClock(snap.hour)}`;
  el.clockReadout.textContent = live
    ? formatZonedDateTime(new Date(), timeZone, "en")
    : `${el.date.value} ${formatHourClock(snap.hour)} · ${timeZone}`;

  // dial
  el.needle.style.transform = `rotate(${(snap.hour / 24) * 360}deg)`;
  el.dialHour.textContent = formatHourClock(snap.hour);
  el.dialTicks.querySelectorAll<HTMLElement>(".tick").forEach((t) => {
    const h = Number(t.dataset.hour);
    t.classList.toggle("active", h === snap.hourInt);
  });

  el.chartTitle.textContent = `${snap.phaseLabel} — sun & moon path for the day`;
  sky.update(snap, { live });
  el.caption.textContent = snap.caption;

  // swatch
  el.swatch.style.background = snap.accent.hex;
  el.accentHex.textContent = snap.accent.hex;
  el.accentRgb.textContent = `rgb(${snap.accent.rgbCss})`;

  // reality facts
  const ev = solarDayEvents(snap.sun.declinationDeg, snap.meta.latitude);
  const lon = Number(el.lon.value);
  const yn = (v: boolean) => (v ? "yes" : "no");
  const rows: [string, string][] = [
    ["Zone", `${timeZone} (${snap.meta.offsetLabel ?? "local"})`],
    ["Latitude", `${snap.meta.latitude.toFixed(2)}°`],
    ["Longitude", Number.isFinite(lon) ? `${lon.toFixed(2)}°` : "—"],
    ["Day of year", String(snap.meta.dayOfYear)],
    ["Season factor", snap.seasonFactor.toFixed(2)],
    ["Phase", `${snap.phase} / ${snap.phaseLabel}`],
    ["Sun alt", `${snap.sun.altitudeDeg.toFixed(1)}° ${snap.sun.aboveHorizon ? "↑" : "↓"}`],
    ["Moon alt*", `${snap.moon.altitudeDeg.toFixed(1)}° ${snap.moon.aboveHorizon ? "↑" : "↓"}`],
    ["Sun decl.", `${snap.sun.declinationDeg.toFixed(2)}°`],
    ["Sunrise (model)", formatHourClock(ev.sunriseHour)],
    ["Sunset (model)", formatHourClock(ev.sunsetHour)],
    ["Max alt @", `${formatHourClock(ev.noonHour)} → ${ev.maxAltitudeDeg.toFixed(1)}°`],
    ["Min alt", `${ev.minAltitudeDeg.toFixed(1)}°`],
    ["Polar day", yn(ev.alwaysAbove)],
    ["Polar night", yn(ev.alwaysBelow)],
    ["Moon age", `${snap.moon.ageDays.toFixed(2)} d`],
    ["Moon lit", `${(snap.moon.phase * 100).toFixed(0)}%`],
    ["Accent", snap.accent.hex],
    ["Glow α / blur", `${snap.glow.alpha.toFixed(2)} / ${snap.glow.blur.toFixed(1)}px`],
  ];

  el.facts.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");

  // UI kit meta + progress demo
  el.metaAccent.textContent = snap.accent.hex;
  el.metaPhase.textContent = snap.phaseLabel;
  el.metaSun.textContent = `${snap.sun.altitudeDeg.toFixed(1)}°`;
  el.metaMoon.textContent = `${(snap.moon.phase * 100).toFixed(0)}% · ${snap.moon.ageDays.toFixed(1)}d`;
  el.metaPlace.textContent = `${snap.meta.latitude.toFixed(1)}°, ${Number.isFinite(lon) ? lon.toFixed(1) : "—"}°`;
  el.metaSeason.textContent = `${snap.meta.season} · ${snap.seasonFactor.toFixed(2)}`;

  const pct = Math.min(100, Math.max(8, (snap.hour / 24) * 100));
  el.demoProgress.style.width = `${pct.toFixed(1)}%`;
  el.demoProgressLabel.textContent = `${formatHourClock(snap.hour)} · day ${pct.toFixed(0)}%`;

  void lightAt(snap.hour);
}

// ── Events ──────────────────────────────────────────────────────────────────

function bind() {
  el.place.addEventListener("change", () => {
    const p = PLACES.find((x) => x.id === el.place.value);
    if (!p || p.id === "custom") return;
    el.tz.value = p.timeZone;
    el.lat.value = String(p.latitude);
    el.lon.value = String(p.longitude);
    render();
  });

  el.tz.addEventListener("change", () => {
    // mark custom if doesn't match place
    const p = PLACES.find((x) => x.id === el.place.value);
    if (p && p.timeZone !== el.tz.value) el.place.value = "custom";
    render();
  });

  el.lat.addEventListener("change", () => {
    el.place.value = "custom";
    render();
  });
  el.lon.addEventListener("change", () => {
    el.place.value = "custom";
    render();
  });
  el.date.addEventListener("change", () => {
    el.liveClock.checked = false;
    render();
  });

  el.liveClock.addEventListener("change", () => {
    if (el.liveClock.checked) hourOverride = null;
    else hourOverride = Number(el.hourRange.value);
    render();
  });

  el.hourRange.addEventListener("input", () => {
    hourOverride = Number(el.hourRange.value);
    el.liveClock.checked = false;
    render();
  });

  el.nowBtn.addEventListener("click", () => {
    el.liveClock.checked = true;
    hourOverride = null;
    const now = new Date();
    // sync date field to zone calendar day
    try {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: el.tz.value,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(now);
      el.date.value = parts; // en-CA → YYYY-MM-DD
    } catch {
      /* keep */
    }
    render();
  });

  // dial drag
  el.dial.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    el.dial.setPointerCapture(e.pointerId);
    setHour(hourFromPointer(e));
    const move = (ev: PointerEvent) => setHour(hourFromPointer(ev));
    const up = () => {
      el.dial.removeEventListener("pointermove", move);
      el.dial.removeEventListener("pointerup", up);
    };
    el.dial.addEventListener("pointermove", move);
    el.dial.addEventListener("pointerup", up);
  });

  // live tick
  const tick = () => {
    if (el.liveClock.checked) render();
    window.setTimeout(tick, 1000);
  };
  tick();
}

// ── Boot ────────────────────────────────────────────────────────────────────

fillSelects();
buildDialTicks();
bind();
render();
