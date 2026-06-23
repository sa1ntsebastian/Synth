import { useStore, type PresetState } from "../state/presetStore";

/** Continuous parameters that a MIDI knob can drive, with their value ranges. */
export const MIDI_RANGES: Partial<Record<keyof PresetState, [number, number]>> = {
  masterVolume: [0, 1],
  filterCutoff: [100, 12000],
  reverb: [0, 1],
  delayWet: [0, 1],
  delayFeedback: [0, 1],
  chorus: [0, 1],
  tremolo: [0, 1],
  lfoDepth: [0, 1],
  lfoRate: [0.1, 10],
  bpm: [40, 300],
  glide: [0, 0.5],
  bassBoost: [0, 18],
  inversion: [0, 3],
  octaveShift: [-1, 2],
};

export const MIDI_TARGETS = Object.keys(MIDI_RANGES) as (keyof PresetState)[];

const INTEGER_PARAMS = new Set<keyof PresetState>(["bpm", "inversion", "octaveShift"]);

/** Default Akai MPK Mini mk3 knob CCs (70..77) -> parameters. */
export const DEFAULT_CC_MAP: Record<number, keyof PresetState> = {
  70: "masterVolume",
  71: "filterCutoff",
  72: "reverb",
  73: "delayWet",
  74: "chorus",
  75: "tremolo",
  76: "lfoDepth",
  77: "bpm",
};

/** Apply a normalized 0..1 MIDI value to a parameter, scaled to its range. */
export function applyMidiValue(param: keyof PresetState, normalized: number): void {
  const range = MIDI_RANGES[param];
  if (!range) return;
  const [min, max] = range;
  let value = min + (max - min) * normalized;
  if (INTEGER_PARAMS.has(param)) value = Math.round(value);
  useStore.getState().set(param, value as never);
}
