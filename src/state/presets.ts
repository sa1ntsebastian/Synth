import type { PresetState } from "./presetStore";

const STORAGE_KEY = "hichord.presets";

export type Slot = "P1" | "P2" | "P3" | "P4";
export const SLOTS: Slot[] = ["P1", "P2", "P3", "P4"];

function loadAll(): Record<string, PresetState> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

export function savePreset(slot: Slot, preset: PresetState): void {
  const all = loadAll();
  all[slot] = preset;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function getPreset(slot: Slot): PresetState | null {
  return loadAll()[slot] ?? null;
}

export function occupiedSlots(): Record<string, boolean> {
  const all = loadAll();
  return Object.fromEntries(SLOTS.map((s) => [s, Boolean(all[s])]));
}
