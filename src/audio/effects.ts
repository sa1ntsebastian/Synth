import * as Tone from "tone";
import type { ADSR } from "../state/presetStore";

export type DelayDivision = "OFF" | "1/4" | "1/8" | "1/16" | "1/16T" | "1/32";

const DELAY_TIME: Record<Exclude<DelayDivision, "OFF">, string> = {
  "1/4": "4n",
  "1/8": "8n",
  "1/16": "16n",
  "1/16T": "16t",
  "1/32": "32n",
};

/**
 * The HiChord effects chain, built once and parameter-driven from the store.
 *
 *   input(Filter) -> AutoFilter(LFO) -> Chorus(Flanger) -> Tremolo -> Delay -> Reverb -> EQ(out)
 *
 * The static filter doubles as the target for the filter envelope: when the
 * envelope is on, a Tone.FrequencyEnvelope drives the cutoff (sweep on attack);
 * when off, the cutoff follows the manual slider. `glide` is a synth property.
 */
export class EffectChain {
  readonly input: Tone.Filter;
  readonly output: Tone.EQ3;

  private filter: Tone.Filter;
  private autoFilter: Tone.AutoFilter;
  private chorus: Tone.Chorus;
  private tremolo: Tone.Tremolo;
  private delay: Tone.FeedbackDelay;
  private reverb: Tone.Reverb;
  private eq: Tone.EQ3;

  // Filter / filter-envelope state
  private filterEnv: Tone.FrequencyEnvelope;
  private fOn = false;
  private fCut = 20000;
  private feOn = false;
  private feAmt = 3;
  private feConnected = false;

  constructor() {
    this.filter = new Tone.Filter(20000, "lowpass");
    this.autoFilter = new Tone.AutoFilter({ frequency: 1, depth: 0, wet: 0 }).start();
    this.chorus = new Tone.Chorus({ frequency: 2.5, delayTime: 3.5, depth: 0.7, wet: 0 }).start();
    this.tremolo = new Tone.Tremolo({ frequency: 9, depth: 0, wet: 1 }).start();
    this.delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.3, wet: 0 });
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    this.eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 });

    this.filterEnv = new Tone.FrequencyEnvelope({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.4,
      baseFrequency: 800,
      octaves: 3,
    });

    this.filter.chain(this.autoFilter, this.chorus, this.tremolo, this.delay, this.reverb, this.eq);
    this.input = this.filter;
    this.output = this.eq;
  }

  /** Static lowpass filter; off = wide open. Coordinated with the filter envelope. */
  setFilter(on: boolean, cutoff: number): void {
    this.fOn = on;
    this.fCut = cutoff;
    this.applyFilter();
  }

  /** Filter envelope params; when on it drives the cutoff between base and base*2^amount. */
  setFilterEnvParams(on: boolean, env: ADSR, amountOctaves: number): void {
    this.filterEnv.attack = env.attack;
    this.filterEnv.decay = env.decay;
    this.filterEnv.sustain = env.sustain;
    this.filterEnv.release = env.release;
    this.feOn = on;
    this.feAmt = amountOctaves;
    this.applyFilter();
  }

  triggerFilterEnv(time?: number): void {
    if (this.feOn) this.filterEnv.triggerAttack(time);
  }

  releaseFilterEnv(time?: number): void {
    if (this.feOn) this.filterEnv.triggerRelease(time);
  }

  private applyFilter(): void {
    if (this.feOn) {
      // Envelope drives cutoff: zero the intrinsic value so only the env signal counts.
      if (!this.feConnected) {
        this.filterEnv.connect(this.filter.frequency);
        this.feConnected = true;
      }
      this.filter.frequency.value = 0;
      this.filterEnv.baseFrequency = this.fCut;
      this.filterEnv.octaves = this.feAmt;
    } else {
      if (this.feConnected) {
        this.filterEnv.disconnect(this.filter.frequency);
        this.feConnected = false;
      }
      this.filter.frequency.rampTo(this.fOn ? this.fCut : 20000, 0.05);
    }
  }

  /** LFO-driven auto-filter (HiChord "LFO modulation"). */
  setLfo(rateHz: number, depth: number): void {
    this.autoFilter.frequency.value = rateHz;
    this.autoFilter.depth.rampTo(depth, 0.05);
    this.autoFilter.wet.rampTo(depth > 0 ? 1 : 0, 0.05);
  }

  /** Chorus/flanger amount (0..1). */
  setChorus(wet: number): void {
    this.chorus.wet.rampTo(wet, 0.05);
  }

  /** Tremolo depth (0..1). */
  setTremolo(depth: number): void {
    this.tremolo.depth.rampTo(depth, 0.05);
  }

  setDelay(div: DelayDivision, wet: number, feedback: number): void {
    if (div !== "OFF") this.delay.delayTime.value = DELAY_TIME[div];
    this.delay.feedback.rampTo(feedback, 0.05);
    this.delay.wet.rampTo(div === "OFF" ? 0 : wet, 0.05);
  }

  setReverb(wet: number): void {
    this.reverb.wet.rampTo(wet, 0.05);
  }

  /** Bass boost in dB on the low band. */
  setBassBoost(db: number): void {
    this.eq.low.rampTo(db, 0.05);
  }
}
