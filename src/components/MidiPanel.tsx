import { useStore, type PresetState } from "../state/presetStore";
import { MIDI_TARGETS } from "../midi/mapping";

interface Props {
  onEnable: () => void;
  error: string | null;
}

/** MIDI status + MIDI-learn: pick a parameter, click Learn, then move a knob. */
export function MidiPanel({ onEnable, error }: Props) {
  const { midiEnabled, midiDeviceName, midiLearnTarget, midiMap, setMidiLearn } = useStore();

  const mappings = Object.entries(midiMap) as [string, keyof PresetState][];

  return (
    <div className="panel">
      <h2 className="panel-title">MIDI</h2>
      <div className="midi-panel">
        <div className="midi-status">
          <button className="midi-btn" onClick={onEnable}>
            {midiEnabled ? "MIDI ✓" : "Enable MIDI"}
          </button>
          <span className={midiEnabled ? "midi-on" : "midi-off"}>
            {midiEnabled ? (midiDeviceName ?? "connected") : "not connected"}
          </span>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="midi-learn">
          <span>Learn:</span>
          <select
            value={midiLearnTarget ?? ""}
            onChange={(e) =>
              setMidiLearn(e.target.value ? (e.target.value as keyof PresetState) : null)
            }
          >
            <option value="">— choose parameter —</option>
            {MIDI_TARGETS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {midiLearnTarget && <span className="learn-hint">move a knob…</span>}
        </div>

        {mappings.length > 0 && (
          <ul className="midi-maps">
            {mappings.map(([cc, param]) => (
              <li key={cc}>
                CC {cc} → {param}
              </li>
            ))}
          </ul>
        )}
        <p className="hint">Default: knobs CC 70–77 map to volume, cutoff, reverb, delay…</p>
      </div>
    </div>
  );
}
