# Synth — HiChord Web

A browser-based recreation of the **HiChord** (Pocket Audio) chord machine / synth.
Built with **React + Vite + TypeScript**, audio via **Tone.js**, music theory via
**Tonal**, and playable on-screen, with the computer keyboard, or via a MIDI
controller such as the **Akai MPK Mini** (Web MIDI API).

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
```

Open the page, click **Start** (browser autoplay policy requires a user gesture),
then play the 7 chord pads with the mouse/touch, the keys **A S D F G H J**, or a
connected MIDI keyboard (click **Enable MIDI**).

## Status — Phase 1 (Core Chord-Synth)

Implemented:

- 7 diatonic **chord buttons** (e.g. C Major → C, Dm, Em, F, G, Am, Bdim)
- **Key** (12) and **Scale/Mode** (Major, Minor, Dorian, Phrygian, Lydian,
  Mixolydian, Locrian, Harmonic/Melodic Minor, Pentatonic)
- **Octave** shift (−1…+2), **Inversions** (0–3), **Voices** (1/2/4/8 OSC layering)
- **Envelope** presets (LONG/SHORT/SWELL/PLUCK/TOUCH/SUSTAIN), **Oscillator** type,
  **Stereo/Mono**, master **Volume**
- Input: on-screen pads, computer keyboard, and **Web MIDI** (notes → chord buttons,
  knobs → parameters)

### Architecture

A single **preset state** ([`src/state/presetStore.ts`](src/state/presetStore.ts),
Zustand) is the source of truth; the UI, MIDI and audio engine all read/write it.

```
src/
  audio/SynthEngine.ts   Tone.js: PolySynth -> StereoWidener -> Volume
  music/theory.ts        Tonal: diatonic chords, inversions, voice layering, labels
  midi/mpkMini.ts        WebMidi: keys/pads -> buttons, knobs -> params
  state/presetStore.ts   Zustand store = the "preset"
  components/            Display, ChordPads, Controls
  useController.ts       press/release -> notes -> engine
```

## Roadmap (remaining HiChord features)

- **Phase 2** — more sound engines (samples, FM) + effects chain (reverb, delay,
  flanger, tremolo, filter+cutoff, LFO, glide, bass boost)
- **Phase 3** — arpeggiator, drum machine + sequencer, BPM/tap-tempo, metronome
- **Phase 4** — looper (record/overdub, auto-bounce) and mic sampling (auto-tune to C)
- **Phase 5** — vocoder, full preset save/load (P1–P4), configurable MIDI-learn

## HiChord settings reference (research)

Source manual: <https://manual.hichord.shop/> · <https://hichord.shop/pages/manual>

- **Sound/Voice**: 30+ instruments / 4 engines; Voices 1/2/4/8 OSC; Stereo↔Mono;
  Envelope (LONG/SHORT/SWELL/PLUCK/TOUCH/SUSTAIN); FM synthesis; Filter + cutoff.
- **Harmony**: Key (12), Octave (−1…+2), Scale (10), 28 chord types, auto voice-leading,
  inversions, chord-lock.
- **Effects**: Reverb, Delay (1/4…1/32), Flanger, Tremolo, Lowpass filter, LFO, Glide,
  Bass boost.
- **Rhythm**: Arpeggiator, Drum kit + sequencer, BPM 40–300 + tap tempo, metronome.
- **Sampling/Vocoder**: Sample playback (auto-tune to C), Vocoder.
- **System**: Presets (P1–P4), MIDI over USB, tuning indicator, auto-sleep.
