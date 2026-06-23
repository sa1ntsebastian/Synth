import { KEYS, SCALE_NAMES, type VoiceCount } from "../music/theory";
import { ENVELOPES, useStore, type EnvelopeName } from "../state/presetStore";
import { INSTRUMENTS, getInstrument } from "../audio/instruments";
import { Waveform } from "./Waveform";

const VOICE_OPTIONS: VoiceCount[] = [1, 2, 4, 8];

/** Parameter controls for the Phase 1 core chord synth. */
export function Controls() {
  const s = useStore();

  return (
    <div className="controls">
      <label className="ctrl">
        <span>Key</span>
        <select value={s.key} onChange={(e) => s.set("key", e.target.value)}>
          {KEYS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
      </label>

      <label className="ctrl">
        <span>Scale</span>
        <select value={s.scale} onChange={(e) => s.set("scale", e.target.value)}>
          {SCALE_NAMES.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="ctrl">
        <span>Octave {s.octaveShift >= 0 ? `+${s.octaveShift}` : s.octaveShift}</span>
        <input
          type="range"
          min={-1}
          max={2}
          step={1}
          value={s.octaveShift}
          onChange={(e) => s.set("octaveShift", Number(e.target.value))}
        />
      </label>

      <label className="ctrl">
        <span>Inversion {s.inversion}</span>
        <input
          type="range"
          min={0}
          max={3}
          step={1}
          value={s.inversion}
          onChange={(e) => s.set("inversion", Number(e.target.value))}
        />
      </label>

      <div className="ctrl">
        <span>Voices</span>
        <div className="seg">
          {VOICE_OPTIONS.map((v) => (
            <button
              key={v}
              className={s.voices === v ? "seg-on" : ""}
              onClick={() => s.set("voices", v)}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <label className="ctrl">
        <span>Envelope</span>
        <select
          value={s.envelope}
          onChange={(e) => s.set("envelope", e.target.value as EnvelopeName)}
        >
          {(Object.keys(ENVELOPES) as EnvelopeName[]).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </label>

      <label className="ctrl">
        <span>Instrument</span>
        <select value={s.instrument} onChange={(e) => s.set("instrument", e.target.value)}>
          {INSTRUMENTS.map((inst) => (
            <option key={inst.id} value={inst.id}>
              {inst.name}
            </option>
          ))}
        </select>
        <Waveform shape={getInstrument(s.instrument).wave} />
      </label>

      <div className="ctrl">
        <span>Stereo</span>
        <div className="seg">
          <button className={s.stereo ? "seg-on" : ""} onClick={() => s.set("stereo", true)}>
            STEREO
          </button>
          <button className={!s.stereo ? "seg-on" : ""} onClick={() => s.set("stereo", false)}>
            MONO
          </button>
        </div>
      </div>

      <label className="ctrl">
        <span>Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={s.masterVolume}
          onChange={(e) => s.set("masterVolume", Number(e.target.value))}
        />
      </label>
    </div>
  );
}
