import * as Tone from "tone";
import { ENVELOPES, type EnvelopeName, type OscType } from "../state/presetStore";

/**
 * Phase 1 audio engine: a polyphonic synth with envelope/oscillator control,
 * a stereo-width stage and a master volume, all built on Tone.js.
 *
 * Signal chain:  PolySynth -> StereoWidener -> Volume -> Destination
 *
 * Later phases insert the effects chain (reverb/delay/filter/...) between the
 * synth and the widener.
 */
export class SynthEngine {
  private synth: Tone.PolySynth<Tone.Synth>;
  private widener: Tone.StereoWidener;
  private master: Tone.Volume;
  private started = false;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sawtooth" },
      envelope: ENVELOPES.LONG,
    });
    this.widener = new Tone.StereoWidener(1);
    this.master = new Tone.Volume(Tone.gainToDb(0.8));
    this.synth.chain(this.widener, this.master, Tone.getDestination());
  }

  /** Must run inside a user gesture to satisfy browser autoplay policy. */
  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    this.started = true;
  }

  get isStarted(): boolean {
    return this.started;
  }

  setEnvelope(name: EnvelopeName): void {
    this.synth.set({ envelope: ENVELOPES[name] });
  }

  setOscillator(type: OscType): void {
    this.synth.set({ oscillator: { type } });
  }

  /** width 1 = full stereo, 0 = mono. */
  setStereo(stereo: boolean): void {
    this.widener.width.rampTo(stereo ? 1 : 0, 0.05);
  }

  setMasterVolume(v: number): void {
    // Guard against -Infinity dB at 0.
    this.master.volume.rampTo(v <= 0 ? -Infinity : Tone.gainToDb(v), 0.05);
  }

  triggerChord(notes: string[]): void {
    if (notes.length === 0) return;
    this.synth.triggerAttack(notes);
  }

  releaseChord(notes: string[]): void {
    if (notes.length === 0) return;
    this.synth.triggerRelease(notes);
  }

  /** Release everything (e.g. on panic / preset change). */
  releaseAll(): void {
    this.synth.releaseAll();
  }
}

// Single shared engine instance for the app.
export const engine = new SynthEngine();
