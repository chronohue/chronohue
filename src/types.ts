/** Season intensity mode. `auto` derives from day-of-year. */
export type SeasonMode = "auto" | "winter" | "mid" | "summer";

/**
 * Day-phase label derived from local solar-hour (not civil twilight).
 * Matches the design prototype phase bands.
 */
export type DayPhase = "night" | "dawn" | "morning" | "zenith" | "day" | "sunset" | "dusk";

export type Rgb = readonly [number, number, number];

export interface LightHueOptions {
  /** Instant to sample. Default: `new Date()`. */
  at?: Date;
  /**
   * Override local clock hour in [0, 24). When set, date is still used for
   * season / declination / moon age, but the palette and markers use this hour.
   */
  hourOverride?: number;
  /**
   * IANA timezone id (e.g. `"Europe/Moscow"`, `"America/New_York"`).
   * When set, wall-clock hour, calendar day-of-year and season `auto` are
   * taken from this zone instead of the runtime local zone.
   * Moon age stays absolute (UTC epoch). Does not replace `latitude`.
   */
  timeZone?: string;
  /**
   * Observer latitude in degrees (positive north).
   * Default `55.75` (Moscow) — same default as the Luminat design prototype.
   */
  latitude?: number;
  /**
   * Observer longitude in degrees (positive east).
   * Unused by the clock-hour palette; required for anything solar — event times
   * and `hourMode: "solar"` — where it moves solar noon by four minutes per
   * degree away from the zone meridian.
   */
  longitude?: number;
  /**
   * Which hour the palette is read at.
   *
   * `clock` (default, and the published behaviour) reads `DAY_STOPS` at the
   * wall-clock hour: the sunrise colour is always at 6.5.
   *
   * `solar` stretches the palette's hour axis so the observer's real sunrise,
   * solar noon and sunset land on the keyframes built for them. Needs
   * `longitude` to be meaningful. Away from mid-latitude spring the two differ
   * sharply: in Murmansk in June `clock` lights the sunrise hue at 06:30, five
   * hours after the sun came up.
   */
  hourMode?: "clock" | "solar";
  /** Season shaping of glow intensity / sun disc size. Default `auto`. */
  season?: SeasonMode;
  /**
   * When true, include SVG arc geometry for sun/moon day charts.
   * Default false (cheaper for accent-only consumers).
   */
  includeArcs?: boolean;
  /**
   * Arc chart height in viewBox units (width is fixed at 300).
   * Default 286 — matches the design dial size.
   */
  arcHeight?: number;
  /** BCP 47 locale for human captions. Default runtime locale / `en`. */
  locale?: string;
}

export interface LightStop {
  h: number;
  rgb: Rgb;
  a: number;
  blur: number;
  ring: Rgb;
  ringA: number;
}

export interface InterpolatedLight {
  rgb: Rgb;
  a: number;
  blur: number;
  ring: Rgb;
  ringA: number;
}

export interface GlowState {
  /** Comma-joined "r,g,b" for rgba() templates. */
  rgb: string;
  alpha: number;
  blur: number;
}

export interface RingState {
  rgb: string;
  alpha: number;
}

export interface AccentState {
  hex: string;
  rgb: Rgb;
  /** rgb as "r,g,b" string. */
  rgbCss: string;
}

export interface BodyState {
  altitudeDeg: number;
  aboveHorizon: boolean;
  /** Normalized x position along the day chart [0, 1]. */
  xNorm: number;
  /** Absolute y in arc viewBox units (when arcs computed). */
  y: number;
}

export interface MoonState extends BodyState {
  /** Age in synodic days since new moon [0, ~29.53). */
  ageDays: number;
  /** Illumination / fill fraction [0, 1) — age / synodic month. */
  phase: number;
  /** Approximate lunar declination (degrees). */
  declinationDeg: number;
}

export interface ArcGeometry {
  viewBox: string;
  width: number;
  height: number;
  horizonY: number;
  sunPath: string;
  moonPath: string;
  sun: { x: number; y: number; diameter: number };
  moon: { x: number; y: number; diameter: number; fillWidth: number };
}

export interface LightHueSnapshot {
  /** Effective local wall-clock hour [0, 24). */
  hour: number;
  /**
   * Hour the palette and phase were actually read at. Equals `hour` under
   * `hourMode: "clock"`; under `"solar"` it is `hour` warped onto the palette's
   * axis, so it is a palette coordinate and not a time of day.
   */
  paletteHour: number;
  /** Rounded hour label 0–23. */
  hourInt: number;
  /** Season intensity [0 winter … 1 summer]. */
  seasonFactor: number;
  phase: DayPhase;
  /** Human phase label (English keys; consumer may i18n). */
  phaseLabel: string;
  accent: AccentState;
  accentHover: string;
  accentDim: string;
  glow: GlowState;
  ring: RingState;
  sun: BodyState & { declinationDeg: number; discRadius: number };
  moon: MoonState;
  /**
   * Ready-to-apply CSS custom properties for brand accent.
   * Keys include leading `--`.
   */
  cssVars: Record<string, string>;
  /** Present when `includeArcs: true`. */
  arcs?: ArcGeometry;
  /** Short debug/caption string (locale-aware moon age). */
  caption: string;
  /** Options effectively used (resolved defaults). */
  meta: {
    latitude: number;
    season: SeasonMode;
    at: Date;
    dayOfYear: number;
    /** Resolved IANA zone used for wall clock (if any). */
    timeZone?: string;
    /** shortOffset label e.g. GMT+3 */
    offsetLabel?: string;
  };
}

export interface LightHueTicker {
  stop: () => void;
  /** Force an immediate re-sample with current options. */
  refresh: () => LightHueSnapshot;
}
