import * as Tone from "tone";

/** BPM control. */
export function setBpm(bpm: number): void {
  Tone.getTransport().bpm.rampTo(bpm, 0.1);
}

/** Tap-tempo helper: feed it timestamps (ms); returns a BPM once enough taps. */
export class TapTempo {
  private taps: number[] = [];

  tap(now = performance.now()): number | null {
    // Reset if the gap is too long (new tempo).
    if (this.taps.length && now - this.taps[this.taps.length - 1] > 2000) this.taps = [];
    this.taps.push(now);
    if (this.taps.length < 2) return null;
    if (this.taps.length > 6) this.taps.shift();

    const intervals = this.taps.slice(1).map((t, i) => t - this.taps[i]);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avg);
    return Math.min(300, Math.max(40, bpm));
  }
}

/** Metronome: a click on every quarter note, toggled on/off. */
export class Metronome {
  private click: Tone.MembraneSynth;
  private eventId: number | null = null;

  constructor() {
    this.click = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0 },
      volume: -12,
    }).toDestination();
  }

  setEnabled(on: boolean): void {
    if (on && this.eventId === null) {
      this.eventId = Tone.getTransport().scheduleRepeat((time) => {
        this.click.triggerAttackRelease("C2", "16n", time);
      }, "4n");
    } else if (!on && this.eventId !== null) {
      Tone.getTransport().clear(this.eventId);
      this.eventId = null;
    }
  }
}

export const metronome = new Metronome();
