import { DRUM_TRACKS, DRUM_STEPS, useStore, type DrumTrack } from "../state/presetStore";

const TRACK_LABELS: Record<DrumTrack, string> = {
  kick: "Kick",
  snare: "Snare",
  hat: "Hat",
  clap: "Clap",
};

/** 16-step drum sequencer grid. */
export function DrumGrid() {
  const drumPattern = useStore((s) => s.drumPattern);
  const toggleDrumStep = useStore((s) => s.toggleDrumStep);

  return (
    <div className="drum-grid">
      {DRUM_TRACKS.map((track) => (
        <div key={track} className="drum-row">
          <span className="drum-label">{TRACK_LABELS[track]}</span>
          <div className="drum-steps">
            {Array.from({ length: DRUM_STEPS }, (_, step) => (
              <button
                key={step}
                className={`step ${drumPattern[track][step] ? "step-on" : ""} ${
                  step % 4 === 0 ? "step-beat" : ""
                }`}
                onClick={() => toggleDrumStep(track, step)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
