import type { WaveShape } from "../audio/instruments";

interface Props {
  shape: WaveShape;
  width?: number;
  height?: number;
  cycles?: number;
}

/** Builds an SVG path string for one of the basic oscillator waveforms. */
function wavePath(shape: WaveShape, w: number, h: number, cycles: number): string {
  const mid = h / 2;
  const amp = h / 2 - 2;
  const cw = w / cycles;

  if (shape === "sine") {
    const steps = 64;
    let d = "";
    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * w;
      const y = mid - amp * Math.sin((i / steps) * cycles * 2 * Math.PI);
      d += `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)} `;
    }
    return d.trim();
  }

  let d = "";
  for (let c = 0; c < cycles; c++) {
    const x0 = c * cw;
    if (shape === "sawtooth") {
      // Ramp up, then instant drop.
      d += `${c === 0 ? "M" : "L"} ${x0} ${mid + amp} L ${x0 + cw} ${mid - amp} L ${x0 + cw} ${mid + amp} `;
    } else if (shape === "triangle") {
      d += `${c === 0 ? "M" : "L"} ${x0} ${mid + amp} L ${x0 + cw / 2} ${mid - amp} L ${x0 + cw} ${mid + amp} `;
    } else {
      // square
      d += `${c === 0 ? "M" : "L"} ${x0} ${mid - amp} L ${x0 + cw / 2} ${mid - amp} L ${x0 + cw / 2} ${mid + amp} L ${x0 + cw} ${mid + amp} L ${x0 + cw} ${mid - amp} `;
    }
  }
  return d.trim();
}

/** A small waveform graph visualizing an oscillator's shape. */
export function Waveform({ shape, width = 100, height = 36, cycles = 2 }: Props) {
  return (
    <svg
      className="waveform"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      aria-label={`${shape} waveform`}
    >
      <line x1="0" y1={height / 2} x2={width} y2={height / 2} className="waveform-axis" />
      <path d={wavePath(shape, width, height, cycles)} className="waveform-path" />
    </svg>
  );
}
