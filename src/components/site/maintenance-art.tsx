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
  [96, 92, 150, "var(--color-border-strong)"], [96, 108, 104, "var(--color-border-strong)"],
  [96, 150, 84, "var(--color-border-default)"], [96, 166, 66, "var(--color-border-default)"], [96, 182, 76, "var(--color-border-default)"],
  [96, 250, 70, "var(--color-border-default)"], [96, 266, 88, "var(--color-border-default)"], [96, 282, 58, "var(--color-border-default)"],
] as const;

export function MaintenanceArt({ id = "mt", className }: { id?: string; className?: string }) {
  return (
    <svg viewBox={`0 0 ${ART_W} ${ART_H}`} className={className} role="img" aria-label="The site is being updated">
      <defs>
        <ArtShadows id={id} />
        <linearGradient id={`${id}-gear`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--p-blue-500)" />
          <stop offset="1" stopColor="var(--color-action-primary-hover)" />
        </linearGradient>
      </defs>

      <g className="nf-rise">
        <ArtWindow id={id}>
          oceanbluecorp.com <tspan fill="var(--color-action-primary)" className="nf-blink">· updating</tspan>
        </ArtWindow>

        {LINES.map(([x, y, w, fill], i) => (
          <rect key={i} x={x} y={y} width={w} height="8" rx="4" fill={fill} className="nf-shimmer" style={{ animationDelay: `${(i % 6) * 180}ms` }} />
        ))}

        {/* The slot, and the card that drops into it. */}
        <rect x="452.5" y="140.5" width="92" height="120" rx="10" fill="var(--color-background-secondary)" stroke="var(--color-border-strong)" strokeDasharray="5 5" />
        <g className="mt-drop">
          <g filter={`url(#${id}-soft)`}>
            <rect x="452" y="140" width="93" height="121" rx="10" fill="var(--color-background-primary)" stroke="var(--color-border-default)" />
          </g>
          <rect x="466" y="156" width="34" height="34" rx="8" fill="var(--color-background-selected)" />
          <rect x="466" y="204" width="64" height="7" rx="3.5" fill="var(--color-border-strong)" />
          <rect x="466" y="220" width="48" height="7" rx="3.5" fill="var(--color-border-default)" />
          <rect x="466" y="236" width="56" height="7" rx="3.5" fill="var(--color-border-default)" />
        </g>

        {/* Gears. */}
        <g transform="translate(296 222)" filter={`url(#${id}-soft)`}>
          <g className="mt-spin">
            <path d={GEAR_LG} fill={`url(#${id}-gear)`} strokeLinejoin="round" stroke="var(--color-action-primary-hover)" strokeWidth="3" />
            <circle r="22" fill="var(--color-background-primary)" />
            <circle r="22" fill="none" stroke="var(--color-action-primary-hover)" strokeOpacity=".25" strokeWidth="3" />
          </g>
        </g>
        <g transform="translate(361 161)" filter={`url(#${id}-soft)`}>
          <g className="mt-spin-rev">
            <path d={GEAR_SM} fill="var(--color-text-primary)" strokeLinejoin="round" stroke="var(--color-text-primary)" strokeWidth="3" />
            <circle r="12" fill="var(--color-background-primary)" />
          </g>
        </g>

        {/* Progress. */}
        <rect x="96" y="336" width="448" height="10" rx="5" fill="var(--color-background-tertiary)" />
        <rect x="96" y="336" width="448" height="10" rx="5" fill="var(--color-action-primary)" className="mt-fill" />
      </g>
    </svg>
  );
}
