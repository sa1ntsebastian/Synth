import { create } from "zustand";
import type { VoiceCount } from "../music/theory";
import type { DelayDivision } from "../audio/effects";

/** Envelope shape presets, mirroring HiChord's named envelopes. */
export type EnvelopeName = "LONG" | "SHORT" | "SWELL" | "PLUCK" | "TOUCH" | "SUSTAIN";

export const ENVELOPES: Record<EnvelopeName, { attack: number; decay: number; sustain: number; release: number }> = {
  LONG: { attack: 0.02, decay: 0.3, sustain: 0.8, release: 2.0 },
  SHORT: { attack: 0.005, decay: 0.2, sustain: 0.0, release: 0.25 },
  SWELL: { attack: 0.8, decay: 0.2, sustain: 1.0, release: 1.5 },
  PLUCK: { attack: 0.001, decay: 0.15, sustain: 0.0, release: 0.3 },
  TOUCH: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.4 },
  SUSTAIN: { attack: 0.01, decay: 0.1, sustain: 1.0, release: 1.0 },
};

export type ArpPattern = "up" | "down" | "updown" | "random" | "asPlayed";

/** Drum sequencer tracks (one row each in the step grid). */
export const DRUM_TRACKS = ["kick", "snare", "hat", "clap"] as const;
export type DrumTrack = (typeof DRUM_TRACKS)[number];
export type DrumPattern = Record<DrumTrack, boolean[]>;
export const DRUM_STEPS = 16;

export function emptyDrumPattern(): DrumPattern {
  return {
    kick: Array(DRUM_STEPS).fill(false),
    snare: Array(DRUM_STEPS).fill(false),
    hat: Array(DRUM_STEPS).fill(false),
    clap: Array(DRUM_STEPS).fill(false),
  };
}

/**
 * The full preset shape — single source of truth shared by UI, MIDI and audio.
 * Every field here is saved/loaded as part of a preset.
 */
export interface PresetState {
  // Harmony
  key: string;
  scale: string;
  octave: number;
  octaveShift: number;
  inversion: number;
  voices: VoiceCount;

  // Sound
  instrument: string;
  envelope: EnvelopeName;
  stereo: boolean;
  glide: number;
  masterVolume: number;

  // Effects
  filterOn: boolean;
  filterCutoff: number; // Hz
  lfoRate: number; // Hz
  lfoDepth: number; // 0..1
  chorus: number; // 0..1 (flanger)
  tremolo: number; // 0..1 depth
  delayDiv: DelayDivision;
  delayWet: number; // 0..1
  delayFeedback: number; // 0..1
  reverb: number; // 0..1
  bassBoost: number; // dB

  // Rhythm
  bpm: number;
  arpOn: boolean;
  arpPattern: ArpPattern;
  arpRate: string; // Tone note value, e.g. "8n"
  drumsOn: boolean;
  drumKit: string;
  drumPattern: DrumPattern;
  metronomeOn: boolean;

  // Vocoder
  vocoderOn: boolean;
}

export interface AppState extends PresetState {
  // runtime (not saved)
  audioReady: boolean;
  midiEnabled: boolean;
  midiDeviceName: string | null;
  activeButtons: number[];
  midiLearnTarget: keyof PresetState | null;
  midiMap: Record<number, keyof PresetState>; // CC -> param

  // actions
  set: <K extends keyof PresetState>(key: K, value: PresetState[K]) => void;
  setAudioReady: (v: boolean) => void;
  setMidi: (enabled: boolean, deviceName: string | null) => void;
  pressButton: (i: number) => void;
  releaseButton: (i: number) => void;
  toggleDrumStep: (track: DrumTrack, step: number) => void;
  setMidiLearn: (target: keyof PresetState | null) => void;
  bindMidi: (cc: number) => void;
  loadPreset: (preset: PresetState) => void;
  exportPreset: () => PresetState;
}

export const DEFAULT_PRESET: PresetState = {
  key: "C",
  scale: "Major",
  octave: 4,
  octaveShift: 0,
  inversion: 0,
  voices: 4,

  instrument: "saw",
  envelope: "LONG",
  stereo: true,
  glide: 0,
  masterVolume: 0.8,

  filterOn: false,
  filterCutoff: 4000,
  lfoRate: 1,
  lfoDepth: 0,
  chorus: 0,
  tremolo: 0,
  delayDiv: "OFF",
  delayWet: 0.3,
  delayFeedback: 0.3,
  reverb: 0,
  bassBoost: 0,

  bpm: 120,
  arpOn: false,
  arpPattern: "up",
  arpRate: "8n",
  drumsOn: false,
  drumKit: "808",
  drumPattern: emptyDrumPattern(),
  metronomeOn: false,

  vocoderOn: false,
};

const PRESET_KEYS = Object.keys(DEFAULT_PRESET) as (keyof PresetState)[];

export const useStore = create<AppState>((set, get) => ({
  ...DEFAULT_PRESET,

  audioReady: false,
  midiEnabled: false,
  midiDeviceName: null,
  activeButtons: [],
  midiLearnTarget: null,
  midiMap: {},

  set: (key, value) => set({ [key]: value } as Partial<AppState>),
  setAudioReady: (v) => set({ audioReady: v }),
  setMidi: (enabled, deviceName) => set({ midiEnabled: enabled, midiDeviceName: deviceName }),

  pressButton: (i) =>
    set((s) => (s.activeButtons.includes(i) ? s : { activeButtons: [...s.activeButtons, i] })),
  releaseButton: (i) => set((s) => ({ activeButtons: s.activeButtons.filter((b) => b !== i) })),

  toggleDrumStep: (track, step) =>
    set((s) => {
      const row = [...s.drumPattern[track]];
      row[step] = !row[step];
      return { drumPattern: { ...s.drumPattern, [track]: row } };
    }),

  setMidiLearn: (target) => set({ midiLearnTarget: target }),
  bindMidi: (cc) =>
    set((s) => {
      if (!s.midiLearnTarget) return s;
      return { midiMap: { ...s.midiMap, [cc]: s.midiLearnTarget }, midiLearnTarget: null };
    }),

  loadPreset: (preset) => set({ ...preset }),
  exportPreset: () => {
    const s = get();
    const out = {} as PresetState;
    for (const k of PRESET_KEYS) {
      // deep-copy the drum grid so saved presets don't alias live state
      (out as unknown as Record<string, unknown>)[k] =
        k === "drumPattern" ? structuredClone(s.drumPattern) : s[k];
    }
    return out;
  },
}));
