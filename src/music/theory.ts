import { Scale, Note, Chord } from "tonal";

/**
 * Mapping of HiChord-style scale/mode display names to the names Tonal understands.
 * HiChord exposes 10 scales/modes; this covers the common set.
 */
export const SCALES: Record<string, string> = {
  Major: "major",
  Minor: "minor",
  Dorian: "dorian",
  Phrygian: "phrygian",
  Lydian: "lydian",
  Mixolydian: "mixolydian",
  Locrian: "locrian",
  "Harmonic Minor": "harmonic minor",
  "Melodic Minor": "melodic minor",
  Pentatonic: "major pentatonic",
};

export const SCALE_NAMES = Object.keys(SCALES);

/** The 12 keys, using sharps. */
export const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type VoiceCount = 1 | 2 | 4 | 8;

export interface ChordSpec {
  key: string;
  scale: string;
  /** Base octave for the chord roots (HiChord default ~4). */
  octave: number;
  /** Which of the 7 chord buttons (0-based degree). */
  degree: number;
  /** Number of bottom notes lifted up an octave. */
  inversion: number;
  /** Oscillator/voice stacking (octave layering). */
  voices: VoiceCount;
}

/**
 * Build a diatonic triad for a given scale degree, as absolute note names (e.g. "E4").
 * Uses Tonal's degree function which handles octave wrapping across the scale.
 */
export function triadNotes(spec: ChordSpec): string[] {
  const scaleName = SCALES[spec.scale] ?? "major";
  const degreeFn = Scale.degrees(`${spec.key}${spec.octave} ${scaleName}`);

  // Stack thirds within the scale: root, third, fifth (1-based degrees).
  const root = spec.degree + 1;
  let notes = [degreeFn(root), degreeFn(root + 2), degreeFn(root + 4)].filter(
    (n): n is string => Boolean(n),
  );

  notes = applyInversion(notes, spec.inversion);
  notes = applyVoices(notes, spec.voices);
  return sortByPitch(notes);
}

/** Move the lowest `inversion` notes up an octave each. */
function applyInversion(notes: string[], inversion: number): string[] {
  const out = [...notes];
  const sorted = sortByPitch(out);
  for (let i = 0; i < inversion; i++) {
    const target = sorted[i % sorted.length];
    const idx = out.indexOf(target);
    if (idx >= 0) out[idx] = Note.transpose(target, "8P");
  }
  return out;
}

/** Layer octaves to thicken the chord, mimicking HiChord's 1/2/4/8 OSC voicing. */
function applyVoices(notes: string[], voices: VoiceCount): string[] {
  if (voices <= 1) return notes;
  const out = [...notes];
  if (voices >= 2) out.push(...notes.map((n) => Note.transpose(n, "-8P")));
  if (voices >= 4) out.push(...notes.map((n) => Note.transpose(n, "8P")));
  if (voices >= 8) out.push(...notes.map((n) => Note.transpose(n, "-15P")));
  return Array.from(new Set(out));
}

function sortByPitch(notes: string[]): string[] {
  return [...notes].sort((a, b) => (Note.midi(a) ?? 0) - (Note.midi(b) ?? 0));
}

/**
 * Human-readable label for a chord button, e.g. "Cmaj", "Dm", "Bdim".
 * Detected from the base triad's pitch classes.
 */
export function chordLabel(spec: ChordSpec): string {
  const scaleName = SCALES[spec.scale] ?? "major";
  const degreeFn = Scale.degrees(`${spec.key}${spec.octave} ${scaleName}`);
  const root = spec.degree + 1;
  const triad = [degreeFn(root), degreeFn(root + 2), degreeFn(root + 4)].filter(Boolean) as string[];
  const pcs = triad.map((n) => Note.pitchClass(n));
  const detected = Chord.detect(pcs);
  if (detected.length > 0) return detected[0];
  // Fallback: root pitch class only.
  return pcs[0] ?? "?";
}
