/**
 * The 404 illustration: a browser window with a hole torn out of its page,
 * 404 showing through, a magnifier sweeping for the missing piece and the
 * torn scrap fluttering below. Pure SVG; motion is CSS (`.nf-*` in
 * globals.css) and holds still under reduced motion.
 */

import { ART_H as H, ART_W as W, ArtShadows, ArtWindow } from "./art-window";

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
        <ArtShadows id={id} />
        <linearGradient id={`${id}-void`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--p-blue-150)" />
          <stop offset="1" stopColor="var(--color-background-tertiary)" />
        </linearGradient>
        <linearGradient id={`${id}-digits`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--p-blue-500)" />
          <stop offset="1" stopColor="var(--color-action-primary-hover)" />
        </linearGradient>
        <radialGradient id={`${id}-lens`} cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="var(--color-background-primary)" stopOpacity=".6" />
          <stop offset=".45" stopColor="var(--color-background-primary)" stopOpacity=".08" />
          <stop offset="1" stopColor="var(--color-text-interactive-inverse)" stopOpacity=".35" />
        </radialGradient>
        <clipPath id={`${id}-hole`}>
          <path d={HOLE} />
        </clipPath>
      </defs>

      <g className="nf-rise">
        <ArtWindow id={id}>
          oceanbluecorp.com/<tspan fill="var(--p-red-500)" className="nf-blink">page-not-found</tspan>
        </ArtWindow>

        {/* Page skeleton, shimmering as if still loading. */}
        {lines.map(([x, y, w], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height="8"
            rx="4"
            fill={i < LINES_TOP.length ? "var(--color-border-strong)" : "var(--color-border-default)"}
            className="nf-shimmer"
            style={{ animationDelay: `${(i % 6) * 180}ms` }}
          />
        ))}
        <rect x="96" y="200" width="54" height="40" rx="8" fill="var(--color-background-selected)" />
        <rect x="490" y="190" width="54" height="54" rx="27" fill="var(--color-background-selected)" />

        {/* The hole: a torn edge, the void behind it, 404 in the void. */}
        <path d={HOLE} fill={`url(#${id}-void)`} />
        <g clipPath={`url(#${id}-hole)`}>
          <path d={HOLE} fill="none" stroke="var(--color-text-primary)" strokeOpacity=".16" strokeWidth="14" transform="translate(0 6)" />
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
        <path d={HOLE} fill="none" stroke="var(--color-background-primary)" strokeWidth="5" strokeLinejoin="round" />
        <path d={HOLE} fill="none" stroke="var(--color-border-strong)" strokeWidth="1.25" strokeLinejoin="round" />
      </g>

      {/* The missing piece, fluttering. */}
      <g transform="translate(470 368)">
        <g className="nf-scrap">
          <g filter={`url(#${id}-soft)`}>
            <path d={SCRAP} fill="var(--color-background-primary)" stroke="var(--color-border-strong)" strokeWidth="1.25" strokeLinejoin="round" />
          </g>
          <rect x="-34" y="-10" width="52" height="6" rx="3" fill="var(--color-border-default)" />
          <rect x="-34" y="2" width="36" height="6" rx="3" fill="var(--color-border-default)" />
        </g>
      </g>

      {/* Magnifier, sweeping for it. */}
      <g transform="translate(320 200)">
        <g className="nf-sweep">
          <g filter={`url(#${id}-soft)`}>
            <path d="M34 34l40 40" stroke="var(--color-text-primary)" strokeWidth="14" strokeLinecap="round" />
            <path d="M34 34l40 40" stroke="var(--color-text-secondary)" strokeWidth="8" strokeLinecap="round" />
            <circle r="44" fill={`url(#${id}-lens)`} stroke="var(--color-text-primary)" strokeWidth="9" />
          </g>
          <circle r="44" fill="none" stroke="var(--color-action-primary)" strokeWidth="3" />
          <path d="M-22 -24a32 32 0 0 1 22 -10" stroke="var(--color-background-primary)" strokeWidth="5" strokeLinecap="round" fill="none" />
        </g>
      </g>
    </svg>
  );
}
