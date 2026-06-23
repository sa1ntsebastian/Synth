import * as Tone from "tone";
import { DRUM_STEPS, type DrumPattern, type DrumTrack } from "../state/presetStore";

/** Drum-kit parameter variations. */
const KITS: Record<string, { kickPitch: string; kickDecay: number; snareDecay: number }> = {
  "808": { kickPitch: "C1", kickDecay: 0.4, snareDecay: 0.2 },
  Acoustic: { kickPitch: "C2", kickDecay: 0.25, snareDecay: 0.15 },
};

/**
 * 16-step drum sequencer driven by Tone.Sequence on the shared transport.
 * Sounds are synthesized (no samples) so it stays self-contained.
 */
export class DrumMachine {
  private kick: Tone.MembraneSynth;
  private snare: Tone.NoiseSynth;
  private hat: Tone.NoiseSynth;
  private clap: Tone.NoiseSynth;
  private seq: Tone.Sequence<number>;
  private pattern: DrumPattern | null = null;
  private kit = KITS["808"];

  constructor() {
    this.kick = new Tone.MembraneSynth({ volume: -6 }).toDestination();
    this.snare = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 },
      volume: -10,
    }).toDestination();
    this.hat = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
      volume: -16,
    }).toDestination();
    this.clap = new Tone.NoiseSynth({
      noise: { type: "pink" },
      envelope: { attack: 0.001, decay: 0.15, sustain: 0 },
      volume: -12,
    }).toDestination();

    const steps = Array.from({ length: DRUM_STEPS }, (_, i) => i);
    this.seq = new Tone.Sequence((time, step) => this.onStep(time, step), steps, "16n");
  }

  setPattern(pattern: DrumPattern): void {
    this.pattern = pattern;
  }

  setKit(name: string): void {
    this.kit = KITS[name] ?? KITS["808"];
  }

  start(): void {
    this.seq.start(0);
  }

  stop(): void {
    this.seq.stop();
  }

  private hit(track: DrumTrack, time: number): void {
    switch (track) {
      case "kick":
        this.kick.triggerAttackRelease(this.kit.kickPitch, this.kit.kickDecay, time);
        break;
      case "snare":
        this.snare.triggerAttackRelease(this.kit.snareDecay, time);
        break;
      case "hat":
        this.hat.triggerAttackRelease(0.05, time);
        break;
      case "clap":
        this.clap.triggerAttackRelease(0.15, time);
        break;
    }
  }

  private onStep(time: number, step: number): void {
    if (!this.pattern) return;
    (Object.keys(this.pattern) as DrumTrack[]).forEach((track) => {
      if (this.pattern![track][step]) this.hit(track, time);
    });
  }
}

export const drumMachine = new DrumMachine();
