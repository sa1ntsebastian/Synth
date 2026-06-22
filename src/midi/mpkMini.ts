import { WebMidi, type Input } from "webmidi";

/**
 * MIDI integration for the Akai MPK Mini (and any MIDI keyboard/controller).
 *
 * Phase 1 mapping:
 *  - White keys (and pads) -> the 7 diatonic chord buttons, by pitch class.
 *  - Control-change (knobs) -> parameter callbacks (normalized 0..1).
 *
 * Phase 5 will replace the fixed mapping with a configurable MIDI-learn layer.
 */

// White-key pitch classes -> chord button index (0..6).
const WHITE_KEY_TO_BUTTON: Record<number, number> = {
  0: 0, // C
  2: 1, // D
  4: 2, // E
  5: 3, // F
  7: 4, // G
  9: 5, // A
  11: 6, // B
};

export interface MidiHandlers {
  onButtonDown: (button: number) => void;
  onButtonUp: (button: number) => void;
  /** controller = CC number, value = normalized 0..1 */
  onControl: (controller: number, value: number) => void;
}

let boundInputs: Input[] = [];

export async function enableMidi(handlers: MidiHandlers): Promise<string | null> {
  await WebMidi.enable();
  bindInputs(handlers);

  // Re-bind when devices are (un)plugged.
  WebMidi.addListener("connected", () => bindInputs(handlers));

  return WebMidi.inputs[0]?.name ?? null;
}

function bindInputs(handlers: MidiHandlers): void {
  // Clear previous listeners to avoid duplicates.
  boundInputs.forEach((input) => input.removeListener());
  boundInputs = [...WebMidi.inputs];

  for (const input of boundInputs) {
    input.addListener("noteon", (e) => {
      const button = WHITE_KEY_TO_BUTTON[e.note.number % 12];
      if (button !== undefined) handlers.onButtonDown(button);
    });
    input.addListener("noteoff", (e) => {
      const button = WHITE_KEY_TO_BUTTON[e.note.number % 12];
      if (button !== undefined) handlers.onButtonUp(button);
    });
    input.addListener("controlchange", (e) => {
      const value = typeof e.value === "number" ? e.value : 0;
      handlers.onControl(e.controller.number, value);
    });
  }
}

export function disableMidi(): void {
  boundInputs.forEach((input) => input.removeListener());
  boundInputs = [];
  if (WebMidi.enabled) WebMidi.disable();
}
