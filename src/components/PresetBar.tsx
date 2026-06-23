import { useState } from "react";
import { useStore } from "../state/presetStore";
import { SLOTS, savePreset, getPreset, occupiedSlots } from "../state/presets";

/** Save/load the full preset (100+ params) to localStorage slots P1–P4. */
export function PresetBar() {
  const exportPreset = useStore((s) => s.exportPreset);
  const loadPreset = useStore((s) => s.loadPreset);
  const [occupied, setOccupied] = useState(occupiedSlots());
  const [status, setStatus] = useState<string | null>(null);

  const handleSave = (slot: (typeof SLOTS)[number]) => {
    savePreset(slot, exportPreset());
    setOccupied(occupiedSlots());
    setStatus(`Saved ${slot}`);
  };

  const handleLoad = (slot: (typeof SLOTS)[number]) => {
    const preset = getPreset(slot);
    if (!preset) return;
    loadPreset(preset);
    setStatus(`Loaded ${slot}`);
  };

  return (
    <div className="preset-bar">
      <span className="preset-title">Presets</span>
      {SLOTS.map((slot) => (
        <div key={slot} className={`preset-slot ${occupied[slot] ? "filled" : ""}`}>
          <span className="preset-name">{slot}</span>
          <button onClick={() => handleSave(slot)}>Save</button>
          <button disabled={!occupied[slot]} onClick={() => handleLoad(slot)}>
            Load
          </button>
        </div>
      ))}
      {status && <span className="preset-status">{status}</span>}
    </div>
  );
}
