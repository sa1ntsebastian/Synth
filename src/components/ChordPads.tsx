import { useStore } from "../state/presetStore";
import { chordLabel } from "../music/theory";

const KEYBOARD_HINTS = ["A", "S", "D", "F", "G", "H", "J"];

interface Props {
  press: (button: number) => void;
  release: (button: number) => void;
}

/** The 7 HiChord chord buttons. */
export function ChordPads({ press, release }: Props) {
  const { key, scale, octave, octaveShift, inversion, voices, activeButtons } = useStore();

  return (
    <div className="pads">
      {Array.from({ length: 7 }, (_, i) => {
        const label = chordLabel({
          key,
          scale,
          octave: octave + octaveShift,
          degree: i,
          inversion,
          voices,
        });
        const active = activeButtons.includes(i);
        return (
          <button
            key={i}
            className={`pad ${active ? "pad-active" : ""}`}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              press(i);
            }}
            onPointerUp={() => release(i)}
            onPointerCancel={() => release(i)}
            onContextMenu={(e) => e.preventDefault()}
          >
            <span className="pad-label">{label}</span>
            <span className="pad-degree">{i + 1}</span>
            <span className="pad-hint">{KEYBOARD_HINTS[i]}</span>
          </button>
        );
      })}
    </div>
  );
}
