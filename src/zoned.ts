/**
 * IANA timezone wall-clock helpers (Intl only — no deps).
 * Used so circadian sampling can follow Europe/Moscow, America/New_York, etc.
 */

export interface ZonedParts {
  year: number;
  /** 0–11, same as Date#getMonth */
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** hour + minute/60 + second/3600 in [0, 24) */
  fractionalHour: number;
  /** 1…366 in the target zone's calendar year */
  dayOfYear: number;
  /** Short offset label from Intl, e.g. "GMT+3" / "GMT-5" */
  offsetLabel: string;
  timeZone: string;
}

function part(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
): string {
  return parts.find((p) => p.type === type)?.value ?? "0";
}

/**
 * Decompose an instant into wall-clock components in `timeZone`.
 * Falls back to the runtime local zone if `timeZone` is omitted or invalid.
 */
export function zonedParts(at: Date, timeZone?: string): ZonedParts {
  const tz = timeZone?.trim() || undefined;
  let dtf: Intl.DateTimeFormat;
  try {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    });
  } catch {
    dtf = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    });
  }

  const parts = dtf.formatToParts(at);
  const year = Number(part(parts, "year"));
  const month = Number(part(parts, "month")) - 1;
  const day = Number(part(parts, "day"));
  const hour = Number(part(parts, "hour"));
  const minute = Number(part(parts, "minute"));
  const second = Number(part(parts, "second"));
  const offsetLabel = part(parts, "timeZoneName") || "GMT";

  // day-of-year via UTC noon trick on calendar y/m/d (avoids DST edge on local Date)
  const start = Date.UTC(year, 0, 0);
  const cur = Date.UTC(year, month, day);
  const dayOfYear = Math.round((cur - start) / 86_400_000);

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    fractionalHour: hour + minute / 60 + second / 3600,
    dayOfYear,
    offsetLabel,
    timeZone: tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}

/** Fractional local hour [0, 24) in the given IANA zone. */
export function localHourInTimeZone(at: Date, timeZone?: string): number {
  return zonedParts(at, timeZone).fractionalHour;
}

/**
 * Approximate numeric UTC offset hours for a zone at instant `at`
 * (e.g. 3 for GMT+3, -5 for GMT-5). Parsed from shortOffset when possible.
 */
export function offsetHoursInTimeZone(at: Date, timeZone?: string): number {
  const label = zonedParts(at, timeZone).offsetLabel;
  // "GMT", "GMT+3", "GMT-5", "GMT+5:30"
  const m = label.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const h = Number(m[2]);
  const min = m[3] ? Number(m[3]) : 0;
  return sign * (h + min / 60);
}

/** Format wall clock in zone: "2026-07-01 18:30 GMT+3". */
export function formatZonedDateTime(at: Date, timeZone?: string, locale = "en"): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      timeZone: timeZone || undefined,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "shortOffset",
    }).format(at);
  } catch {
    return at.toISOString();
  }
}
