import * as Tone from "tone";
import { type ADSR } from "../state/presetStore";
import { EffectChain, type DelayDivision } from "./effects";
import { getInstrument } from "./instruments";

const DEFAULT_AMP_ENV: ADSR = { attack: 0.02, decay: 0.3, sustain: 0.8, release: 2.0 };

/** Anything the engine can play polyphonically (synth voices or a mic sampler). */
type Instrument = Tone.PolySynth | Tone.Sampler;

/**
 * Audio engine: a swappable instrument feeding the effects chain, with held-note
 * tracking so both block-chord and arpeggiator playback share one source of truth.
 *
 *   Instrument -> EffectChain -> StereoWidener -> Volume -> Destination
 */
export class SynthEngine {
  private instrument: Instrument;
  private effects: EffectChain;
  private widener: Tone.StereoWidener;
  private master: Tone.Volume;
  private started = false;

  private held = new Map<string, string[]>();
  private arpEnabled = false;
  private ampEnv: ADSR = DEFAULT_AMP_ENV;
  private glide = 0;

  private sampler: Tone.Sampler | null = null;
  private currentInstrumentId = "saw";

  constructor() {
    this.effects = new EffectChain();
    this.widener = new Tone.StereoWidener(1);
    this.master = new Tone.Volume(Tone.gainToDb(0.8));
    this.effects.output.chain(this.widener, this.master, Tone.getDestination());

    this.instrument = getInstrument("saw").build();
    this.instrument.connect(this.effects.input);
    this.applyEnvelope();
  }

  /** Must run inside a user gesture (browser autoplay policy). Also starts transport. */
  async start(): Promise<void> {
    if (this.started) return;
    await Tone.start();
    Tone.getTransport().start();
    this.started = true;
  }

  get isStarted(): boolean {
    return this.started;
  }

  // ---- instrument ----------------------------------------------------------
  setInstrument(id: string): void {
    if (id === this.currentInstrumentId) return;
    const next = id === "sample" && this.sampler ? this.sampler : getInstrument(id).build();
    this.instrument.releaseAll();
    if (this.instrument !== this.sampler) this.instrument.dispose();
    this.instrument = next;
    this.instrument.connect(this.effects.input);
    this.currentInstrumentId = id;
    this.applyEnvelope();
    this.applyGlide();
    if (!this.arpEnabled) for (const notes of this.held.values()) this.instrument.triggerAttack(notes);
  }

  /** Register a mic-recorded sampler so the "sample" instrument becomes available. */
  setSampler(sampler: Tone.Sampler): void {
    this.sampler = sampler;
    if (this.currentInstrumentId === "sample") {
      this.currentInstrumentId = "__force__";
      this.setInstrument("sample");
    }
  }

  private applyEnvelope(): void {
    if (this.instrument instanceof Tone.PolySynth) {
      this.instrument.set({ envelope: this.ampEnv });
    }
  }

  private applyGlide(): void {
    if (this.instrument instanceof Tone.PolySynth) {
      this.instrument.set({ portamento: this.glide });
    }
  }

  setAmpEnvelope(env: ADSR): void {
    this.ampEnv = env;
    this.applyEnvelope();
  }

  /** Filter envelope: sweeps the cutoff on note attack (classic synth movement). */
  setFilterEnv(on: boolean, env: ADSR, amountOctaves: number): void {
    this.effects.setFilterEnvParams(on, env, amountOctaves);
  }

  setGlide(seconds: number): void {
    this.glide = seconds;
    this.applyGlide();
  }

  setStereo(stereo: boolean): void {
    this.widener.width.rampTo(stereo ? 1 : 0, 0.05);
  }

  setMasterVolume(v: number): void {
    this.master.volume.rampTo(v <= 0 ? -Infinity : Tone.gainToDb(v), 0.05);
  }

  // ---- effects passthrough -------------------------------------------------
  setFilter(on: boolean, cutoff: number): void {
    this.effects.setFilter(on, cutoff);
  }
  setLfo(rateHz: number, depth: number): void {
    this.effects.setLfo(rateHz, depth);
  }
  setChorus(wet: number): void {
    this.effects.setChorus(wet);
  }
  setTremolo(depth: number): void {
    this.effects.setTremolo(depth);
  }
  setDelay(div: DelayDivision, wet: number, feedback: number): void {
    this.effects.setDelay(div, wet, feedback);
  }
  setReverb(wet: number): void {
    this.effects.setReverb(wet);
  }
  setBassBoost(db: number): void {
    this.effects.setBassBoost(db);
  }

  /** Tap point for the vocoder carrier / metering: the effect chain output. */
  get carrierNode(): Tone.ToneAudioNode {
    return this.effects.output;
  }

  // ---- notes ---------------------------------------------------------------
  noteOn(id: string, notes: string[]): void {
    if (notes.length === 0 || this.held.has(id)) return;
    const first = this.held.size === 0;
    this.held.set(id, notes);
    if (!this.arpEnabled) this.instrument.triggerAttack(notes);
    if (first) this.effects.triggerFilterEnv();
  }

  noteOff(id: string): void {
    const notes = this.held.get(id);
    if (!notes) return;
    this.held.delete(id);
    if (!this.arpEnabled) this.instrument.triggerRelease(notes);
    if (this.held.size === 0) this.effects.releaseFilterEnv();
  }

  /** Flattened set of currently-held notes (used by the arpeggiator). */
  getActiveNotes(): string[] {
    const set = new Set<string>();
    for (const notes of this.held.values()) notes.forEach((n) => set.add(n));
    return [...set];
  }

  setArpEnabled(on: boolean): void {
    if (on === this.arpEnabled) return;
    this.arpEnabled = on;
    if (on) {
      this.instrument.releaseAll();
    } else {
      for (const notes of this.held.values()) this.instrument.triggerAttack(notes);
    }
  }

  triggerArpNote(note: string, dur: Tone.Unit.Time, time: number): void {
    this.instrument.triggerAttackRelease(note, dur, time);
  }

  releaseAll(): void {
    this.instrument.releaseAll();
    this.held.clear();
  }
}

export const engine = new SynthEngine();
