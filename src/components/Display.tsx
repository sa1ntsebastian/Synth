import { useStore } from "../state/presetStore";

/** Small status readout, echoing the HiChord screen. */
export function Display() {
  const { key, scale, octaveShift, inversion, voices, stereo, midiEnabled, midiDeviceName } =
    useStore();

  return (
    <div className="display">
      <div className="display-row">
        <span className="display-main">
          {key} {scale}
        </span>
        <span className="display-badge">{stereo ? "STEREO" : "MONO"}</span>
      </div>
      <div className="display-row display-sub">
        <span>OCT {octaveShift >= 0 ? `+${octaveShift}` : octaveShift}</span>
        <span>INV {inversion}</span>
        <span>{voices} OSC</span>
      </div>
      <div className="display-row display-midi">
        <span className={midiEnabled ? "midi-on" : "midi-off"}>
          {midiEnabled ? `MIDI: ${midiDeviceName ?? "connected"}` : "MIDI: off"}
        </span>
      </div>
    </div>
  );
}
