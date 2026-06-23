import { useRef } from "react";
import { useStore, type ArpPattern } from "../state/presetStore";
import { TapTempo } from "../audio/transport";
import { DrumGrid } from "./DrumGrid";

const ARP_PATTERNS: ArpPattern[] = ["up", "down", "updown", "random", "asPlayed"];
const ARP_RATES: { label: string; value: string }[] = [
  { label: "1/4", value: "4n" },
  { label: "1/8", value: "8n" },
  { label: "1/16", value: "16n" },
  { label: "1/16T", value: "16t" },
  { label: "1/32", value: "32n" },
];
const KITS = ["808", "Acoustic"];

/** Phase 3 rhythm controls: BPM/tap, arpeggiator, drum machine, metronome. */
export function Rhythm() {
  const s = useStore();
  const tapRef = useRef(new TapTempo());

  const handleTap = () => {
    const bpm = tapRef.current.tap();
    if (bpm) s.set("bpm", bpm);
  };

  return (
    <div className="panel">
      <h2 className="panel-title">Rhythm</h2>
      <div className="controls">
        <label className="ctrl">
          <span>BPM {s.bpm}</span>
          <input
            type="range"
            min={40}
            max={300}
            step={1}
            value={s.bpm}
            onChange={(e) => s.set("bpm", Number(e.target.value))}
          />
        </label>

        <div className="ctrl">
          <span>Tap Tempo</span>
          <button className="big-btn" onClick={handleTap}>
            TAP
          </button>
        </div>

        <div className="ctrl">
          <span>Arpeggiator</span>
          <div className="seg">
            <button className={s.arpOn ? "seg-on" : ""} onClick={() => s.set("arpOn", true)}>
              ON
            </button>
            <button className={!s.arpOn ? "seg-on" : ""} onClick={() => s.set("arpOn", false)}>
              OFF
            </button>
          </div>
        </div>

        <label className="ctrl">
          <span>Arp Pattern</span>
          <select
            value={s.arpPattern}
            onChange={(e) => s.set("arpPattern", e.target.value as ArpPattern)}
          >
            {ARP_PATTERNS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="ctrl">
          <span>Arp Rate</span>
          <select value={s.arpRate} onChange={(e) => s.set("arpRate", e.target.value)}>
            {ARP_RATES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <div className="ctrl">
          <span>Drums</span>
          <div className="seg">
            <button className={s.drumsOn ? "seg-on" : ""} onClick={() => s.set("drumsOn", true)}>
              ON
            </button>
            <button className={!s.drumsOn ? "seg-on" : ""} onClick={() => s.set("drumsOn", false)}>
              OFF
            </button>
          </div>
        </div>

        <label className="ctrl">
          <span>Drum Kit</span>
          <select value={s.drumKit} onChange={(e) => s.set("drumKit", e.target.value)}>
            {KITS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>

        <div className="ctrl">
          <span>Metronome</span>
          <div className="seg">
            <button
              className={s.metronomeOn ? "seg-on" : ""}
              onClick={() => s.set("metronomeOn", true)}
            >
              ON
            </button>
            <button
              className={!s.metronomeOn ? "seg-on" : ""}
              onClick={() => s.set("metronomeOn", false)}
            >
              OFF
            </button>
          </div>
        </div>
      </div>

      <DrumGrid />
    </div>
  );
}
