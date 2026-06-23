import { useEffect, useState } from "react";
import { engine } from "./audio/SynthEngine";
import { arp } from "./audio/Arp";
import { drumMachine } from "./audio/DrumMachine";
import { metronome, setBpm } from "./audio/transport";
import { vocoder } from "./audio/Vocoder";
import { useStore } from "./state/presetStore";
import { useController } from "./useController";
import { enableMidi } from "./midi/mpkMini";
import { applyMidiValue, DEFAULT_CC_MAP } from "./midi/mapping";
import { Display } from "./components/Display";
import { ChordPads } from "./components/ChordPads";
import { Controls } from "./components/Controls";
import { Effects } from "./components/Effects";
import { Rhythm } from "./components/Rhythm";
import { Studio } from "./components/Studio";
import { PresetBar } from "./components/PresetBar";
import { MidiPanel } from "./components/MidiPanel";

const KEY_MAP: Record<string, number> = { a: 0, s: 1, d: 2, f: 3, g: 4, h: 5, j: 6 };

export default function App() {
  const { press, release } = useController();
  const audioReady = useStore((s) => s.audioReady);
  const setAudioReady = useStore((s) => s.setAudioReady);
  const setMidi = useStore((s) => s.setMidi);

  // ---- engine parameter sync (preset -> audio) ---------------------------
  const s = useStore();
  useEffect(() => engine.setInstrument(s.instrument), [s.instrument]);
  useEffect(() => engine.setEnvelope(s.envelope), [s.envelope]);
  useEffect(() => engine.setStereo(s.stereo), [s.stereo]);
  useEffect(() => engine.setGlide(s.glide), [s.glide]);
  useEffect(() => engine.setMasterVolume(s.masterVolume), [s.masterVolume]);

  useEffect(() => engine.setFilter(s.filterOn, s.filterCutoff), [s.filterOn, s.filterCutoff]);
  useEffect(() => engine.setLfo(s.lfoRate, s.lfoDepth), [s.lfoRate, s.lfoDepth]);
  useEffect(() => engine.setChorus(s.chorus), [s.chorus]);
  useEffect(() => engine.setTremolo(s.tremolo), [s.tremolo]);
  useEffect(
    () => engine.setDelay(s.delayDiv, s.delayWet, s.delayFeedback),
    [s.delayDiv, s.delayWet, s.delayFeedback],
  );
  useEffect(() => engine.setReverb(s.reverb), [s.reverb]);
  useEffect(() => engine.setBassBoost(s.bassBoost), [s.bassBoost]);

  // ---- rhythm lifecycle --------------------------------------------------
  useEffect(() => setBpm(s.bpm), [s.bpm]);
  useEffect(() => {
    engine.setArpEnabled(s.arpOn);
    if (s.arpOn) arp.start();
    else arp.stop();
  }, [s.arpOn]);
  useEffect(() => arp.setPattern(s.arpPattern), [s.arpPattern]);
  useEffect(() => arp.setRate(s.arpRate), [s.arpRate]);

  useEffect(() => drumMachine.setPattern(s.drumPattern), [s.drumPattern]);
  useEffect(() => drumMachine.setKit(s.drumKit), [s.drumKit]);
  useEffect(() => {
    if (s.drumsOn) drumMachine.start();
    else drumMachine.stop();
  }, [s.drumsOn]);

  useEffect(() => metronome.setEnabled(s.metronomeOn), [s.metronomeOn]);

  // ---- vocoder -----------------------------------------------------------
  useEffect(() => {
    if (s.vocoderOn) vocoder.enable(engine.carrierNode).catch(() => undefined);
    else vocoder.disable();
  }, [s.vocoderOn]);

  // ---- computer keyboard -------------------------------------------------
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

  // ---- audio + midi setup ------------------------------------------------
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
          if (st.midiLearnTarget) {
            st.bindMidi(cc);
            return;
          }
          const param = st.midiMap[cc] ?? DEFAULT_CC_MAP[cc];
          if (param) applyMidiValue(param, value);
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
        <PresetBar />
      </header>

      <Display />
      <ChordPads press={press} release={release} />
      <Controls />
      <Effects />
      <Rhythm />
      <Studio />
      <MidiPanel onEnable={handleEnableMidi} error={midiError} />

      <footer className="hint">
        Play with the pads, the keys <kbd>A</kbd>–<kbd>J</kbd>, or an Akai MPK Mini (Enable MIDI).
      </footer>
    </div>
  );
}
