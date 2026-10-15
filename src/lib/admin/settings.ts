import { readJson, writeJson } from "./store";

export type Settings = {
  /** Rotate the ten templates across applications so the numbers can compare them. Off: every run uses the base's template. */
  abTemplates: boolean;
};
const DEFAULTS: Settings = { abTemplates: true };

export function getSettings(): Settings {
  return { ...DEFAULTS, ...readJson<Partial<Settings>>("settings", {}) };
}
export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  writeJson("settings", next);
  return next;
}
