import * as Tone from "tone";

export type LoopTrackState = "empty" | "recording" | "playing";

/**
 * Simple multi-track looper. Records the master output via Tone.Recorder and
 * plays the captured buffer back on a looping Tone.Player. Overdub = recording a
 * new track while existing ones play.
 */
export class Looper {
  private recorder = new Tone.Recorder();
  private players: (Tone.Player | null)[] = [null, null, null, null];
  private recordingTrack: number | null = null;

  constructor() {
    Tone.getDestination().connect(this.recorder);
  }

  get trackCount(): number {
    return this.players.length;
  }

  startRecording(track: number): void {
    if (this.recordingTrack !== null) return;
    this.recordingTrack = track;
    this.recorder.start();
  }

  async stopRecording(): Promise<number | null> {
    if (this.recordingTrack === null) return null;
    const track = this.recordingTrack;
    this.recordingTrack = null;
    const blob = await this.recorder.stop();
    const url = URL.createObjectURL(blob);
    const player = new Tone.Player({ url, loop: true });
    await player.load(url);
    player.toDestination();
    player.start();
    this.players[track]?.dispose();
    this.players[track] = player;
    return track;
  }

  clear(track: number): void {
    this.players[track]?.stop();
    this.players[track]?.dispose();
    this.players[track] = null;
  }

  state(track: number): LoopTrackState {
    if (this.recordingTrack === track) return "recording";
    return this.players[track] ? "playing" : "empty";
  }
}

export const looper = new Looper();
