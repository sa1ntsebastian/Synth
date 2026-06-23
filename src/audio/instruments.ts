import * as Tone from "tone";

/**
 * Instrument registry. Each instrument is a self-contained polyphonic Tone voice,
 * built on demand. No external sample assets are used, so everything works offline.
 * (HiChord ships 30+; this is a representative, expandable subset.)
 *
 * Replaces the old standalone `oscType` field — instrument selection now drives
 * the core timbre. The engine still applies the user's envelope/voices on top.
 */
export interface InstrumentDef {
  id: string;
  name: string;
  build: () => Tone.PolySynth;
}

export const INSTRUMENTS: InstrumentDef[] = [
  {
    id: "saw",
    name: "Saw",
    build: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sawtooth" } }),
  },
  {
    id: "square",
    name: "Square",
    build: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: "square" } }),
  },
  {
    id: "triangle",
    name: "Triangle",
    build: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } }),
  },
  {
    id: "sine",
    name: "Sine",
    build: () => new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" } }),
  },
  {
    id: "pad",
    name: "Pad",
    build: () =>
      new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "fatsawtooth", count: 3, spread: 30 },
      }),
  },
  {
    id: "fmEPiano",
    name: "FM E-Piano",
    build: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3,
        modulationIndex: 10,
        oscillator: { type: "sine" },
        modulation: { type: "sine" },
      }),
  },
  {
    id: "fmBrass",
    name: "FM Brass",
    build: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 1,
        modulationIndex: 5,
        oscillator: { type: "sawtooth" },
      }),
  },
  {
    id: "fmBell",
    name: "FM Bell",
    build: () =>
      new Tone.PolySynth(Tone.FMSynth, {
        harmonicity: 3.5,
        modulationIndex: 12,
        oscillator: { type: "sine" },
      }),
  },
  {
    id: "pluck",
    name: "Pluck",
    build: () =>
      new Tone.PolySynth(Tone.AMSynth, {
        harmonicity: 2,
        oscillator: { type: "triangle" },
      }),
  },
];

export const INSTRUMENT_IDS = INSTRUMENTS.map((i) => i.id);
export const DEFAULT_INSTRUMENT = "saw";

export function getInstrument(id: string): InstrumentDef {
  return INSTRUMENTS.find((i) => i.id === id) ?? INSTRUMENTS[0];
}
