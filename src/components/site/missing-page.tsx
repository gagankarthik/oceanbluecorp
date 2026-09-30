/**
 * The 404 illustration: a browser window with a hole torn out of its page,
 * 404 showing through, a magnifier sweeping for the missing piece and the
 * torn scrap fluttering below. Pure SVG; motion is CSS (`.nf-*` in
 * globals.css) and holds still under reduced motion.
 */

const W = 640;
const H = 420;

/** Deterministic 0..1 noise, so server and client draw the same edge. */
const noise = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

/** A torn-paper outline around an ellipse: a slow wobble plus fine, uneven tears. */
function torn(cx: number, cy: number, rx: number, ry: number, n: number, seed: number) {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const wobble = 1 + 0.07 * Math.sin(a * 3 + seed) + 0.04 * Math.sin(a * 7 + seed * 2);
    const tear = 1 - noise(i + seed) * (i % 3 === 0 ? 0.07 : 0.025);
    const k = wobble * tear;
    pts.push(`${(cx + Math.cos(a) * rx * k).toFixed(1)},${(cy + Math.sin(a) * ry * k).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

const HOLE = torn(320, 222, 148, 82, 120, 7);
const SCRAP = torn(0, 0, 56, 30, 70, 3);

const LINES_TOP = [
  [96, 92, 180], [96, 108, 120],
];
const LINES_SIDE = [
  [96, 150, 70], [96, 166, 56], [96, 182, 64], [96, 262, 60], [96, 278, 72], [96, 294, 48],
  [490, 150, 56], [490, 166, 44], [490, 262, 54], [490, 278, 40],
];
const LINES_BOTTOM = [
  [96, 336, 220], [96, 352, 160], [340, 336, 204],
];

export function MissingPage({ id = "nf", className }: { id?: string; className?: string }) {
  const lines = [...LINES_TOP, ...LINES_SIDE, ...LINES_BOTTOM];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="404: a web page with a piece torn out of it">
      <defs>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#0b1a33" floodOpacity=".14" />
        </filter>
        <filter id={`${id}-soft`} x="-40%" y="-40%" width="180%" height="200%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0b1a33" floodOpacity=".18" />
        </filter>
        <linearGradient id={`${id}-void`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d6ec" />
          <stop offset="1" stopColor="#e7edf6" />
        </linearGradient>
        <linearGradient id={`${id}-digits`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b6cf0" />
          <stop offset="1" stopColor="#1740ad" />
        </linearGradient>
        <radialGradient id={`${id}-lens`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#fff" stopOpacity=".6" />
          <stop offset=".45" stopColor="#fff" stopOpacity=".08" />
          <stop offset="1" stopColor="#a9c1ff" stopOpacity=".35" />
        </radialGradient>
        <clipPath id={`${id}-hole`}>
          <path d={HOLE} />
        </clipPath>
      </defs>

      <g className="nf-rise">
        {/* Window. */}
        <g filter={`url(#${id}-shadow)`}>
          <rect x="60" y="24" width="520" height="360" rx="18" fill="#fff" />
        </g>
        <rect x="60.5" y="24.5" width="519" height="359" rx="17.5" fill="none" stroke="#e2e8f1" />
        <path d="M60 60h520" stroke="#e2e8f1" />
        {["#f3b5ae", "#f4d9a1", "#b9dfc3"].map((c, i) => (
          <circle key={c} cx={84 + i * 16} cy="42" r="5" fill={c} />
        ))}
        <rect x="180" y="32" width="280" height="20" rx="10" fill="#f3f6fb" />
        <circle cx="194" cy="42" r="3.5" fill="none" stroke="#9aa6ba" strokeWidth="1.5" />
        <text x="206" y="46" fontSize="11" fill="#56637b" fontFamily="inherit">
          oceanbluecorp.com/<tspan fill="#e8432f" className="nf-blink">page-not-found</tspan>
        </text>

        {/* Page skeleton, shimmering as if still loading. */}
        {lines.map(([x, y, w], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height="8"
            rx="4"
            fill={i < LINES_TOP.length ? "#cbd5e3" : "#e2e8f1"}
            className="nf-shimmer"
            style={{ animationDelay: `${(i % 6) * 180}ms` }}
          />
        ))}
        <rect x="96" y="200" width="54" height="40" rx="8" fill="#eef2ff" />
        <rect x="490" y="190" width="54" height="54" rx="27" fill="#eef2ff" />

        {/* The hole: a torn edge, the void behind it, 404 in the void. */}
        <path d={HOLE} fill={`url(#${id}-void)`} />
        <g clipPath={`url(#${id}-hole)`}>
          <path d={HOLE} fill="none" stroke="#0b1a33" strokeOpacity=".16" strokeWidth="14" transform="translate(0 6)" />
          <text
            x="320"
            y="252"
            textAnchor="middle"
            fontSize="92"
            fontWeight="800"
            letterSpacing="-2"
            fill={`url(#${id}-digits)`}
            fontFamily="inherit"
            className="nf-digits"
          >
            404
          </text>
        </g>
        <path d={HOLE} fill="none" stroke="#fff" strokeWidth="5" strokeLinejoin="round" />
        <path d={HOLE} fill="none" stroke="#cbd5e3" strokeWidth="1.25" strokeLinejoin="round" />
      </g>

      {/* The missing piece, fluttering. */}
      <g transform="translate(470 368)">
        <g className="nf-scrap">
          <g filter={`url(#${id}-soft)`}>
            <path d={SCRAP} fill="#fff" stroke="#cbd5e3" strokeWidth="1.25" strokeLinejoin="round" />
          </g>
          <rect x="-34" y="-10" width="52" height="6" rx="3" fill="#e2e8f1" />
          <rect x="-34" y="2" width="36" height="6" rx="3" fill="#e2e8f1" />
        </g>
      </g>

      {/* Magnifier, sweeping for it. */}
      <g transform="translate(320 200)">
        <g className="nf-sweep">
          <g filter={`url(#${id}-soft)`}>
            <path d="M34 34l40 40" stroke="#0b1a33" strokeWidth="14" strokeLinecap="round" />
            <path d="M34 34l40 40" stroke="#3a4a66" strokeWidth="8" strokeLinecap="round" />
            <circle r="44" fill={`url(#${id}-lens)`} stroke="#0b1a33" strokeWidth="9" />
          </g>
          <circle r="44" fill="none" stroke="#1d4ed8" strokeWidth="3" />
          <path d="M-22 -24a32 32 0 0 1 22 -10" stroke="#fff" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
}
