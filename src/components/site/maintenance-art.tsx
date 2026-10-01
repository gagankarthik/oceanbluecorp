import { ART_H, ART_W, ArtShadows, ArtWindow } from "./art-window";

/**
 * The maintenance illustration: the site's own window with its page being put
 * back together. Two meshed gears turn, a card drops into the slot waiting for
 * it, and a progress bar fills. Pure SVG; motion is CSS (`.mt-*` in
 * globals.css) and holds still under reduced motion.
 */

/** A gear outline centred on the origin: `teeth` flat-topped teeth between root radius `r` and tip radius `R`. */
function gear(teeth: number, R: number, r: number) {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [f, rad] of [[0, r], [0.16, R], [0.5, R], [0.66, r]] as const) {
      pts.push(`${(Math.cos(a + f * step) * rad).toFixed(1)},${(Math.sin(a + f * step) * rad).toFixed(1)}`);
    }
  }
  return `M${pts.join("L")}Z`;
}

// 12 and 8 teeth turning at 12s and 8s keep the mesh in step.
const GEAR_LG = gear(12, 62, 49);
const GEAR_SM = gear(8, 38, 27);

const LINES = [
  [96, 92, 150, "#cbd5e3"], [96, 108, 104, "#cbd5e3"],
  [96, 150, 84, "#e2e8f1"], [96, 166, 66, "#e2e8f1"], [96, 182, 76, "#e2e8f1"],
  [96, 250, 70, "#e2e8f1"], [96, 266, 88, "#e2e8f1"], [96, 282, 58, "#e2e8f1"],
] as const;

export function MaintenanceArt({ id = "mt", className }: { id?: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${ART_W} ${ART_H}`} className={className} role="img" aria-label="The site is being updated">
      <defs>
        <ArtShadows id={id} />
        <linearGradient id={`${id}-gear`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b6cf0" />
          <stop offset="1" stopColor="#1740ad" />
        </linearGradient>
      </defs>

      <g className="nf-rise">
        <ArtWindow id={id}>
          oceanbluecorp.com <tspan fill="#1d4ed8" className="nf-blink">· updating</tspan>
        </ArtWindow>

        {LINES.map(([x, y, w, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height="8" rx="4" fill={fill} className="nf-shimmer" style={{ animationDelay: `${(i % 6) * 180}ms` }} />
        ))}

        {/* The slot, and the card that drops into it. */}
        <rect x="452.5" y="140.5" width="92" height="120" rx="10" fill="#f3f6fb" stroke="#cbd5e3" strokeDasharray="5 5" />
        <g className="mt-drop">
          <g filter={`url(#${id}-soft)`}>
            <rect x="452" y="140" width="93" height="121" rx="10" fill="#fff" stroke="#e2e8f1" />
          </g>
          <rect x="466" y="156" width="34" height="34" rx="8" fill="#eef2ff" />
          <rect x="466" y="204" width="64" height="7" rx="3.5" fill="#cbd5e3" />
          <rect x="466" y="220" width="48" height="7" rx="3.5" fill="#e2e8f1" />
          <rect x="466" y="236" width="56" height="7" rx="3.5" fill="#e2e8f1" />
        </g>

        {/* Gears. */}
        <g transform="translate(296 222)" filter={`url(#${id}-soft)`}>
          <g className="mt-spin">
            <path d={GEAR_LG} fill={`url(#${id}-gear)`} strokeLinejoin="round" stroke="#1740ad" strokeWidth="3" />
            <circle r="22" fill="#fff" />
            <circle r="22" fill="none" stroke="#1740ad" strokeOpacity=".25" strokeWidth="3" />
          </g>
        </g>
        <g transform="translate(361 161)" filter={`url(#${id}-soft)`}>
          <g className="mt-spin-rev">
            <path d={GEAR_SM} fill="#0b1a33" strokeLinejoin="round" stroke="#0b1a33" strokeWidth="3" />
            <circle r="12" fill="#fff" />
          </g>
        </g>

        {/* Progress. */}
        <rect x="96" y="336" width="448" height="10" rx="5" fill="#e7edf6" />
        <rect x="96" y="336" width="448" height="10" rx="5" fill="#1d4ed8" className="mt-fill" />
      </g>
    </svg>
  );
}
