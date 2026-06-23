import * as Tone from "tone";

const BANDS = [200, 400, 800, 1200, 1600, 2400, 3200, 4800, 6400];

/**
 * Simplified band-vocoder. The mic (modulator) is split into frequency bands; each
 * band's amplitude envelope drives the gain of the matching band of the synth
 * (carrier). The vocoded signal is added in parallel to the dry output — a faithful
 * approximation rather than a full carrier-replacing vocoder.
 */
export class Vocoder {
  private mic = new Tone.UserMedia();
  private out = new Tone.Gain(0).toDestination();
  private bands: Tone.Gain[] = [];
  private built = false;

  async enable(carrier: Tone.ToneAudioNode): Promise<void> {
    if (!this.built) {
      await this.mic.open();
      for (const freq of BANDS) {
        const carrierBP = new Tone.Filter({ frequency: freq, type: "bandpass", Q: 6 });
        const modBP = new Tone.Filter({ frequency: freq, type: "bandpass", Q: 6 });
        const follower = new Tone.Follower(0.02);
        const vca = new Tone.Gain(0);

        carrier.connect(carrierBP);
        carrierBP.connect(vca);
        vca.connect(this.out);

        this.mic.connect(modBP);
        modBP.connect(follower);
        follower.connect(vca.gain);

        this.bands.push(vca);
      }
      this.built = true;
    }
    this.out.gain.rampTo(0.9, 0.1);
  }

  disable(): void {
    this.out.gain.rampTo(0, 0.1);
  }
}

export const vocoder = new Vocoder();
