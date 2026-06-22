import { create } from "zustand";
import type { VoiceCount } from "../music/theory";

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

export type OscType = "sawtooth" | "square" | "triangle" | "sine";

/**
 * The full preset shape. This is the single source of truth — UI, MIDI and the
 * audio engine all read/write here. (Phase 1 subset; later phases extend it.)
 */
export interface PresetState {
  key: string;
  scale: string;
  octave: number; // base octave for chord roots
  octaveShift: number; // -1..+2, HiChord joystick octave shift
  inversion: number; // 0..3
  voices: VoiceCount;
  envelope: EnvelopeName;
  oscType: OscType;
  stereo: boolean; // true = stereo, false = mono
  masterVolume: number; // 0..1
}

export interface AppState extends PresetState {
  // UI / runtime (not part of a saved preset)
  audioReady: boolean;
  midiEnabled: boolean;
  midiDeviceName: string | null;
  activeButtons: number[]; // currently-held chord buttons

  // actions
  set: <K extends keyof PresetState>(key: K, value: PresetState[K]) => void;
  setAudioReady: (v: boolean) => void;
  setMidi: (enabled: boolean, deviceName: string | null) => void;
  pressButton: (i: number) => void;
  releaseButton: (i: number) => void;
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
  envelope: "LONG",
  oscType: "sawtooth",
  stereo: true,
  masterVolume: 0.8,
};

export const useStore = create<AppState>((set, get) => ({
  ...DEFAULT_PRESET,

  audioReady: false,
  midiEnabled: false,
  midiDeviceName: null,
  activeButtons: [],

  set: (key, value) => set({ [key]: value } as Partial<AppState>),
  setAudioReady: (v) => set({ audioReady: v }),
  setMidi: (enabled, deviceName) => set({ midiEnabled: enabled, midiDeviceName: deviceName }),

  pressButton: (i) =>
    set((s) => (s.activeButtons.includes(i) ? s : { activeButtons: [...s.activeButtons, i] })),
  releaseButton: (i) => set((s) => ({ activeButtons: s.activeButtons.filter((b) => b !== i) })),

  loadPreset: (preset) => set({ ...preset }),
  exportPreset: () => {
    const s = get();
    const { key, scale, octave, octaveShift, inversion, voices, envelope, oscType, stereo, masterVolume } = s;
    return { key, scale, octave, octaveShift, inversion, voices, envelope, oscType, stereo, masterVolume };
  },
}));
