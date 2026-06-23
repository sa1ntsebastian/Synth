import * as Tone from "tone";
import { Note } from "tonal";
import type { ArpPattern } from "../state/presetStore";
import { engine } from "./SynthEngine";

/**
 * Arpeggiator: a Tone.Loop that steps through the engine's currently-held notes
 * according to the selected pattern and rate. The engine supplies the notes and
 * the trigger callback, so block-chord and arp playback share one note source.
 */
export class Arp {
  private loop: Tone.Loop;
  private pattern: ArpPattern = "up";
  private step = 0;

  constructor(
    private getNotes: () => string[],
    private trigger: (note: string, dur: Tone.Unit.Time, time: number) => void,
  ) {
    this.loop = new Tone.Loop((time) => this.tick(time), "8n");
  }

  setRate(rate: string): void {
    this.loop.interval = rate;
  }

  setPattern(p: ArpPattern): void {
    this.pattern = p;
    this.step = 0;
  }

  start(): void {
    this.step = 0;
    this.loop.start(0);
  }

  stop(): void {
    this.loop.stop();
  }

  private tick(time: number): void {
    const sequence = this.order(this.getNotes());
    if (sequence.length === 0) return;
    const note = sequence[this.step % sequence.length];
    this.trigger(note, this.loop.interval, time);
    this.step++;
  }

  private order(notes: string[]): string[] {
    const asc = [...notes].sort((a, b) => (Note.midi(a) ?? 0) - (Note.midi(b) ?? 0));
    switch (this.pattern) {
      case "up":
        return asc;
      case "down":
        return asc.reverse();
      case "updown": {
        const down = asc.slice(1, -1).reverse();
        return [...asc, ...down];
      }
      case "random":
        return asc.length ? [asc[Math.floor(Math.random() * asc.length)]] : [];
      case "asPlayed":
        return notes;
      default:
        return asc;
    }
  }
}

export const arp = new Arp(
  () => engine.getActiveNotes(),
  (note, dur, time) => engine.triggerArpNote(note, dur, time),
);
