import { useCallback, useRef } from "react";
import { engine } from "./audio/SynthEngine";
import { triadNotes } from "./music/theory";
import { useStore } from "./state/presetStore";

/**
 * Central chord controller. Press/release compute the chord notes from the
 * CURRENT preset state and drive the audio engine, while tracking the exact
 * notes held per button so a release always stops what it started — even if
 * parameters change mid-hold. Used by the on-screen pads, computer keyboard
 * and MIDI input alike.
 */
export function useController() {
  const heldRef = useRef<Map<number, string[]>>(new Map());

  const press = useCallback((button: number) => {
    if (heldRef.current.has(button)) return; // already held
    const s = useStore.getState();
    const notes = triadNotes({
      key: s.key,
      scale: s.scale,
      octave: s.octave + s.octaveShift,
      degree: button,
      inversion: s.inversion,
      voices: s.voices,
    });
    heldRef.current.set(button, notes);
    engine.triggerChord(notes);
    s.pressButton(button);
  }, []);

  const release = useCallback((button: number) => {
    const notes = heldRef.current.get(button);
    if (!notes) return;
    heldRef.current.delete(button);
    engine.releaseChord(notes);
    useStore.getState().releaseButton(button);
  }, []);

  return { press, release };
}
