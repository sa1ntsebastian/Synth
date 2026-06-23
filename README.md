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

## Status — all phases implemented

- **Harmony** — 7 diatonic **chord buttons** (C Major → C, Dm, Em, F, G, Am, Bdim),
  **Key** (12), **Scale/Mode** (10), **Octave** (−1…+2), **Inversions**, **Voices** (1/2/4/8)
- **Sound** — instrument engines (Saw/Square/Tri/Sine, Pad, FM E-Piano/Brass/Bell, Pluck),
  **Envelope** presets, **Glide**, **Stereo/Mono**, master **Volume**
- **Effects** — Filter + Cutoff, LFO mod, Flanger (chorus), Tremolo, Delay (1/4…1/32),
  Reverb, Bass Boost
- **Rhythm** — Arpeggiator (up/down/updown/random/as-played), **BPM** (40–300) + Tap Tempo,
  16-step **Drum machine** (2 kits), Metronome
- **Studio** — multi-track **Looper** (record/overdub/clear), **Mic sampling** (played
  chromatically as the "sample" instrument), simplified **Vocoder**
- **Presets** — save/load full state to **localStorage** slots P1–P4
- **Input** — on-screen pads, computer keyboard (A–J), and **Web MIDI** with default knob
  mapping (CC 70–77) plus **MIDI-learn**

> Note: Mic sampling and the vocoder request microphone permission. Web MIDI works in
> Chromium-based browsers. The vocoder adds a parallel vocoded layer (approximation).

### Architecture

A single **preset state** ([`src/state/presetStore.ts`](src/state/presetStore.ts),
Zustand) is the source of truth; the UI, MIDI and audio engine all read/write it. The app
syncs every parameter into the audio engine via `useEffect` hooks in `App.tsx`.

```
src/
  audio/
    SynthEngine.ts   swappable instrument -> effects -> widener -> volume; held-note + arp
    instruments.ts   Tone synth/FM/AM voice presets
    effects.ts       filter, auto-filter (LFO), chorus, tremolo, delay, reverb, EQ
    Arp.ts           Tone.Loop arpeggiator over the engine's held notes
    DrumMachine.ts   Tone.Sequence 16-step synthesized drums
    transport.ts     BPM, tap tempo, metronome
    Looper.ts        Tone.Recorder multi-track looper
    Sampler.ts       mic -> Tone.Sampler ("sample" instrument)
    Vocoder.ts       band-vocoder (mic modulates synth carrier)
  music/theory.ts    Tonal: diatonic chords, inversions, voice layering, labels
  midi/              WebMidi input + CC mapping / MIDI-learn
  state/             Zustand store + localStorage presets
  components/        Display, ChordPads, Controls, Effects, Rhythm, DrumGrid, Studio,
                     PresetBar, MidiPanel
  useController.ts   press/release -> notes -> engine
```

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
