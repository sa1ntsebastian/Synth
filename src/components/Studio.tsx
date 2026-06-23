import { useState } from "react";
import { useStore } from "../state/presetStore";
import { looper, type LoopTrackState } from "../audio/Looper";
import { micSampler } from "../audio/Sampler";

/** Phase 4/5: looper tracks, mic sampling and the vocoder toggle. */
export function Studio() {
  const vocoderOn = useStore((s) => s.vocoderOn);
  const setParam = useStore((s) => s.set);

  const [trackStates, setTrackStates] = useState<LoopTrackState[]>(
    Array.from({ length: looper.trackCount }, () => "empty"),
  );
  const refresh = () =>
    setTrackStates(Array.from({ length: looper.trackCount }, (_, i) => looper.state(i)));

  const handleLoop = async (track: number) => {
    const state = looper.state(track);
    if (state === "empty") {
      looper.startRecording(track);
      refresh();
    } else if (state === "recording") {
      await looper.stopRecording();
      refresh();
    } else {
      looper.clear(track);
      refresh();
    }
  };

  const [sampleState, setSampleState] = useState<"idle" | "recording" | "ready">("idle");
  const handleSample = async () => {
    if (sampleState === "idle") {
      await micSampler.open();
      micSampler.startRecording();
      setSampleState("recording");
    } else if (sampleState === "recording") {
      await micSampler.stopRecording();
      setSampleState("ready");
      setParam("instrument", "sample");
    } else {
      setSampleState("idle");
    }
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Studio</h2>
      <div className="studio">
        <div className="studio-block">
          <span className="studio-label">Looper</span>
          <div className="loop-tracks">
            {trackStates.map((state, i) => (
              <button key={i} className={`loop-btn loop-${state}`} onClick={() => handleLoop(i)}>
                {state === "empty" && `Rec ${i + 1}`}
                {state === "recording" && "■ Stop"}
                {state === "playing" && "✕ Clear"}
              </button>
            ))}
          </div>
        </div>

        <div className="studio-block">
          <span className="studio-label">Mic Sample</span>
          <button className="big-btn" onClick={handleSample}>
            {sampleState === "idle" && "● Record"}
            {sampleState === "recording" && "■ Stop"}
            {sampleState === "ready" && "Re-record"}
          </button>
        </div>

        <div className="studio-block">
          <span className="studio-label">Vocoder</span>
          <div className="seg">
            <button className={vocoderOn ? "seg-on" : ""} onClick={() => setParam("vocoderOn", true)}>
              ON
            </button>
            <button
              className={!vocoderOn ? "seg-on" : ""}
              onClick={() => setParam("vocoderOn", false)}
            >
              OFF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
