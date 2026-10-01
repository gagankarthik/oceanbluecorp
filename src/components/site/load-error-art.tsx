import { ART_H, ART_W, ArtShadows, ArtWindow } from "./art-window";

/**
 * The "page did not load" illustration: the site's window with its cable
 * pulled. The plug keeps nudging back toward the socket, sparks flicker in the
 * gap, and the progress bar has stopped part-way. Pure SVG; motion is CSS
 * (`.er-nudge`, plus the shared `.nf-*` classes) and holds still under reduced
 * motion.
 */

const LINES = [
  [96, 92, 150, "#cbd5e3"], [96, 108, 104, "#cbd5e3"],
  [96, 284, 96, "#e2e8f1"], [96, 300, 64, "#e2e8f1"],
  [448, 92, 96, "#e2e8f1"], [470, 108, 74, "#e2e8f1"],
  [434, 284, 110, "#e2e8f1"], [468, 300, 76, "#e2e8f1"],
] as const;

// Six short rays around the gap between plug and socket.
const SPARKS = ["M322 186v-14", "M308 191l-9-11", "M336 191l9-11", "M322 244v14", "M308 239l-9 11", "M336 239l9 11"];

export function LoadErrorArt({ id = "er", className }: { id?: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${ART_W} ${ART_H}`} className={className} role="img" aria-label="The page lost its connection and did not load">
      <defs>
        <ArtShadows id={id} />
        <linearGradient id={`${id}-socket`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b6cf0" />
          <stop offset="1" stopColor="#1740ad" />
        </linearGradient>
      </defs>

      <g className="nf-rise">
        <ArtWindow id={id}>
          oceanbluecorp.com <tspan fill="#e8432f" className="nf-blink">· couldn’t load</tspan>
        </ArtWindow>

        {LINES.map(([x, y, w, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height="8" rx="4" fill={fill} className="nf-shimmer" style={{ animationDelay: `${(i % 6) * 180}ms` }} />
        ))}

        {/* Socket, fixed to the right. */}
        <path d="M398 215c52 0 70-30 146-30" fill="none" stroke="#1740ad" strokeWidth="7" strokeLinecap="round" />
        <g filter={`url(#${id}-soft)`}>
          <rect x="350" y="187" width="50" height="56" rx="12" fill={`url(#${id}-socket)`} />
        </g>
        <rect x="350" y="202" width="16" height="7" rx="3.5" fill="#fff" />
        <rect x="350" y="221" width="16" height="7" rx="3.5" fill="#fff" />

        {/* Plug, trying to get back in. */}
        <g className="er-nudge">
          <path d="M96 246c58 0 76-31 138-31" fill="none" stroke="#0b1a33" strokeWidth="7" strokeLinecap="round" />
          <g filter={`url(#${id}-soft)`}>
            <rect x="232" y="191" width="46" height="48" rx="11" fill="#0b1a33" />
          </g>
          <rect x="276" y="202" width="20" height="7" rx="3.5" fill="#56637b" />
          <rect x="276" y="221" width="20" height="7" rx="3.5" fill="#56637b" />
        </g>

        {SPARKS.map((d, i) => (
          <path key={d} d={d} stroke="#d97706" strokeWidth="3.5" strokeLinecap="round" className="nf-blink" style={{ animationDelay: `${(i % 3) * 400}ms` }} />
        ))}

        {/* Progress, stopped. */}
        <rect x="96" y="336" width="448" height="10" rx="5" fill="#e7edf6" />
        <rect x="96" y="336" width="186" height="10" rx="5" fill="#e8432f" />
      </g>
    </svg>
  );
}
