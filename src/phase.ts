import type { DayPhase } from "./types.js";

const PHASE_LABELS: Record<DayPhase, string> = {
  night: "Night",
  dawn: "Dawn",
  morning: "Morning",
  zenith: "Zenith",
  day: "Day",
  sunset: "Sunset",
  dusk: "Dusk",
};

/**
 * Day phase from fractional hour — same bands as the design Russian labels
 * (Ночь / Рассвет / Утро / Зенит / День / Закат / Сумерки).
 */
export function dayPhase(hour: number): DayPhase {
  if (hour < 5 || hour >= 21) return "night";
  if (hour < 7) return "dawn";
  if (hour < 11) return "morning";
  if (hour < 14) return "zenith";
  if (hour < 17) return "day";
  if (hour < 20) return "sunset";
  return "dusk";
}

export function phaseLabel(phase: DayPhase): string {
  return PHASE_LABELS[phase];
}
