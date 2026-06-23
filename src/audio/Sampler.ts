import * as Tone from "tone";
import { engine } from "./SynthEngine";

/**
 * Microphone sampler: records a short sound from the mic, then maps it to C4 in a
 * Tone.Sampler so it can be played chromatically via the chord buttons (selectable
 * as the "sample" instrument). True pitch-detection auto-tune is out of scope;
 * mapping the recording to C4 is the pragmatic equivalent of HiChord's "tune to C".
 */
export class MicSampler {
  private mic = new Tone.UserMedia();
  private recorder = new Tone.Recorder();
  private opened = false;

  async open(): Promise<void> {
    if (this.opened) return;
    await this.mic.open();
    this.mic.connect(this.recorder);
    this.opened = true;
  }

  startRecording(): void {
    this.recorder.start();
  }

  /** Stops recording, builds a Sampler from the take and registers it with the engine. */
  async stopRecording(): Promise<void> {
    const blob = await this.recorder.stop();
    const url = URL.createObjectURL(blob);
    const sampler = new Tone.Sampler({ urls: { C4: url } });
    await Tone.loaded();
    engine.setSampler(sampler);
  }
}

export const micSampler = new MicSampler();
