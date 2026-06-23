import { useStore } from "../state/presetStore";
import type { DelayDivision } from "../audio/effects";

const DELAY_DIVS: DelayDivision[] = ["OFF", "1/4", "1/8", "1/16", "1/16T", "1/32"];

/** Phase 2 effects controls: filter, LFO, chorus, tremolo, delay, reverb, glide, bass. */
export function Effects() {
  const s = useStore();

  return (
    <div className="panel">
      <h2 className="panel-title">Effects</h2>
      <div className="controls">
        <div className="ctrl">
          <span>Filter</span>
          <div className="seg">
            <button className={s.filterOn ? "seg-on" : ""} onClick={() => s.set("filterOn", true)}>
              ON
            </button>
            <button className={!s.filterOn ? "seg-on" : ""} onClick={() => s.set("filterOn", false)}>
              OFF
            </button>
          </div>
        </div>

        <label className="ctrl">
          <span>Cutoff {Math.round(s.filterCutoff)} Hz</span>
          <input
            type="range"
            min={100}
            max={12000}
            step={10}
            value={s.filterCutoff}
            onChange={(e) => s.set("filterCutoff", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>LFO Rate {s.lfoRate.toFixed(1)} Hz</span>
          <input
            type="range"
            min={0.1}
            max={10}
            step={0.1}
            value={s.lfoRate}
            onChange={(e) => s.set("lfoRate", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>LFO Depth {Math.round(s.lfoDepth * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.lfoDepth}
            onChange={(e) => s.set("lfoDepth", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Flanger {Math.round(s.chorus * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.chorus}
            onChange={(e) => s.set("chorus", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Tremolo {Math.round(s.tremolo * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.tremolo}
            onChange={(e) => s.set("tremolo", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Delay</span>
          <select
            value={s.delayDiv}
            onChange={(e) => s.set("delayDiv", e.target.value as DelayDivision)}
          >
            {DELAY_DIVS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        <label className="ctrl">
          <span>Delay Mix {Math.round(s.delayWet * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.delayWet}
            onChange={(e) => s.set("delayWet", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Reverb {Math.round(s.reverb * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={s.reverb}
            onChange={(e) => s.set("reverb", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Glide {s.glide.toFixed(2)} s</span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={s.glide}
            onChange={(e) => s.set("glide", Number(e.target.value))}
          />
        </label>

        <label className="ctrl">
          <span>Bass Boost {s.bassBoost} dB</span>
          <input
            type="range"
            min={0}
            max={18}
            step={1}
            value={s.bassBoost}
            onChange={(e) => s.set("bassBoost", Number(e.target.value))}
          />
        </label>
      </div>
    </div>
  );
}
