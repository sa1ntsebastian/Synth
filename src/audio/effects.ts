import * as Tone from "tone";

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
 * `glide` is not here — it is a synth `portamento` property handled by the engine.
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

  constructor() {
    this.filter = new Tone.Filter(20000, "lowpass");
    this.autoFilter = new Tone.AutoFilter({ frequency: 1, depth: 0, wet: 0 }).start();
    this.chorus = new Tone.Chorus({ frequency: 2.5, delayTime: 3.5, depth: 0.7, wet: 0 }).start();
    this.tremolo = new Tone.Tremolo({ frequency: 9, depth: 0, wet: 1 }).start();
    this.delay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.3, wet: 0 });
    this.reverb = new Tone.Reverb({ decay: 2.5, wet: 0 });
    this.eq = new Tone.EQ3({ low: 0, mid: 0, high: 0 });

    this.filter.chain(this.autoFilter, this.chorus, this.tremolo, this.delay, this.reverb, this.eq);
    this.input = this.filter;
    this.output = this.eq;
  }

  /** Static lowpass filter; off = wide open. */
  setFilter(on: boolean, cutoff: number): void {
    this.filter.frequency.rampTo(on ? cutoff : 20000, 0.05);
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
