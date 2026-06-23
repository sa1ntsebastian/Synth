import { useEffect, useRef, useState } from "react";
import type { ADSR } from "../state/presetStore";

const W = 240;
const H = 90;
const P = 8;

interface Maxes {
  attack: number;
  decay: number;
  release: number;
}

interface Props {
  value: ADSR;
  onChange: (v: ADSR) => void;
  max?: Maxes;
}

const DEFAULT_MAX: Maxes = { attack: 2, decay: 2, release: 3 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Computes pixel geometry (in viewBox units) for the current ADSR values. */
function geom(v: ADSR, max: Maxes) {
  const drawW = W - 2 * P;
  const attackW = drawW * 0.28;
  const decayW = drawW * 0.28;
  const sustainW = drawW * 0.18;
  const releaseW = drawW * 0.26;
  const topY = P;
  const botY = H - P;
  const usable = botY - topY;

  const xPeak = P + (v.attack / max.attack) * attackW;
  const xSus = xPeak + (v.decay / max.decay) * decayW;
  const susY = botY - v.sustain * usable;
  const xSusEnd = xSus + sustainW;
  const xRel = xSusEnd + (v.release / max.release) * releaseW;

  return { drawW, attackW, decayW, sustainW, releaseW, topY, botY, usable, xPeak, xSus, susY, xSusEnd, xRel };
}

type Handle = "a" | "d" | "r";

/** An editable ADSR envelope graph. Drag the dots to shape attack/decay/sustain/release. */
export function EnvelopeGraph({ value, onChange, max = DEFAULT_MAX }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [drag, setDrag] = useState<Handle | null>(null);

  const g = geom(value, max);
  const path = `M ${P} ${g.botY} L ${g.xPeak} ${g.topY} L ${g.xSus} ${g.susY} L ${g.xSusEnd} ${g.susY} L ${g.xRel} ${g.botY}`;

  useEffect(() => {
    if (!drag) return;
    const toVB = (e: PointerEvent) => {
      const r = svgRef.current!.getBoundingClientRect();
      return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };
    const move = (e: PointerEvent) => {
      const { x, y } = toVB(e);
      const cur = geom(value, max);
      if (drag === "a") {
        onChange({ ...value, attack: clamp(((x - P) / cur.attackW) * max.attack, 0, max.attack) });
      } else if (drag === "d") {
        onChange({
          ...value,
          decay: clamp(((x - cur.xPeak) / cur.decayW) * max.decay, 0, max.decay),
          sustain: clamp((cur.botY - y) / cur.usable, 0, 1),
        });
      } else {
        onChange({ ...value, release: clamp(((x - cur.xSusEnd) / cur.releaseW) * max.release, 0, max.release) });
      }
    };
    const up = () => setDrag(null);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, value, max, onChange]);

  return (
    <svg
      ref={svgRef}
      className="env-graph"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      preserveAspectRatio="none"
    >
      <path d={path} className="env-fill" />
      <path d={path} className="env-line" />
      <circle cx={g.xPeak} cy={g.topY} r={6} className="env-handle" onPointerDown={() => setDrag("a")} />
      <circle cx={g.xSus} cy={g.susY} r={6} className="env-handle" onPointerDown={() => setDrag("d")} />
      <circle cx={g.xRel} cy={g.botY} r={6} className="env-handle" onPointerDown={() => setDrag("r")} />
    </svg>
  );
}
