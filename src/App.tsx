import { useEffect, useState } from "react";
import { engine } from "./audio/SynthEngine";
import { useStore } from "./state/presetStore";
import { useController } from "./useController";
import { enableMidi } from "./midi/mpkMini";
import { Display } from "./components/Display";
import { ChordPads } from "./components/ChordPads";
import { Controls } from "./components/Controls";

// Computer-keyboard keys mapped to the 7 chord buttons.
const KEY_MAP: Record<string, number> = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6 };

export default function App() {
  const { press, release } = useController();
  const audioReady = useStore((s) => s.audioReady);
  const setAudioReady = useStore((s) => s.setAudioReady);
  const setMidi = useStore((s) => s.setMidi);
  const midiEnabled = useStore((s) => s.midiEnabled);

  // Engine parameter sync — keep audio in lockstep with the preset state.
  const envelope = useStore((s) => s.envelope);
  const oscType = useStore((s) => s.oscType);
  const stereo = useStore((s) => s.stereo);
  const masterVolume = useStore((s) => s.masterVolume);
  useEffect(() => engine.setEnvelope(envelope), [envelope]);
  useEffect(() => engine.setOscillator(oscType), [oscType]);
  useEffect(() => engine.setStereo(stereo), [stereo]);
  useEffect(() => engine.setMasterVolume(masterVolume), [masterVolume]);

  // Computer-keyboard input.
  useEffect(() => {
    if (!audioReady) return;
    const down = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const button = KEY_MAP[e.key.toLowerCase()];
      if (button !== undefined) press(button);
    };
    const up = (e: KeyboardEvent) => {
      const button = KEY_MAP[e.key.toLowerCase()];
      if (button !== undefined) release(button);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, [audioReady, press, release]);

  const [midiError, setMidiError] = useState<string | null>(null);

  const handleStart = async () => {
    await engine.start();
    setAudioReady(true);
  };

  const handleEnableMidi = async () => {
    try {
      const name = await enableMidi({
        onButtonDown: press,
        onButtonUp: release,
        onControl: (cc, value) => {
          const st = useStore.getState();
          // Akai MPK Mini mk3 default knob CCs are 70..77.
          if (cc === 70) st.set("masterVolume", value);
          else if (cc === 71) st.set("inversion", Math.round(value * 3));
          else if (cc === 72) st.set("octaveShift", Math.round(value * 3) - 1);
        },
      });
      setMidi(true, name);
      setMidiError(null);
    } catch (err) {
      setMidiError(err instanceof Error ? err.message : "MIDI unavailable");
    }
  };

  return (
    <div className="app">
      {!audioReady && (
        <div className="overlay" onClick={handleStart}>
          <div className="overlay-card">
            <h1>HiChord Web</h1>
            <p>Tap to start audio</p>
            <button className="start-btn">▶ Start</button>
          </div>
        </div>
      )}

      <header className="topbar">
        <h1>HiChord Web</h1>
        <button className="midi-btn" onClick={handleEnableMidi}>
          {midiEnabled ? "MIDI ✓" : "Enable MIDI"}
        </button>
      </header>

      {midiError && <div className="error">MIDI: {midiError}</div>}

      <Display />
      <ChordPads press={press} release={release} />
      <Controls />

      <footer className="hint">
        Play with the pads, the keys <kbd>A</kbd>–<kbd>J</kbd>, or an Akai MPK Mini (Enable MIDI).
      </footer>
    </div>
  );
}
