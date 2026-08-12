/* ============================================================
   Ocean Blue shape language.

   The page had no shapes at all — photographs, type and hairlines,
   which is why it read as plain next to a site like customer.io.
   Theirs works because the shapes are not decoration bought from a
   catalogue: a tag glyph before every eyebrow, line illustrations
   in the solution cards, abstract geometry in the enterprise band.
   One family, used everywhere, all of it theirs.

   These are derived from the logo rather than invented, so the
   ornament and the mark are the same object at different sizes.
   The logo is a droplet with concentric arcs sweeping off it, so
   the whole family is exactly two primitives:

       · a circle (the droplet)
       · concentric arcs (the wave)

   Nothing here uses a gradient mesh, a blob, or a floating 3D
   shape. Those are the marks of a template; a circle and an arc
   that appear in the company's own logo are not.

   All of it is currentColor and stroke-based, so a motif takes the
   tone of wherever it is placed and needs no per-surface variant.
   ============================================================ */

type MotifProps = { className?: string };

/**
 * The eyebrow glyph. customer.io puts a small tag before every
 * eyebrow; this is the same idea drawn as the logo's droplet, so the
 * label rows carry the brand mark at 12px.
 */
export function TagMark({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden>
      {/* Droplet: a circle with one corner pulled to a point, which is
          the silhouette of the logo's "b" bowl. */}
      <path
        d="M8 1.6 C10.6 4 12.4 5.8 12.4 8.4 A4.4 4.4 0 0 1 3.6 8.4 C3.6 5.8 5.4 4 8 1.6 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Concentric arcs sweeping from a corner — the wave from the mark,
 * enlarged. Sits behind content as a quiet ground.
 */
export function ArcSweep({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 200 200" fill="none" className={className} aria-hidden>
      {[38, 62, 86, 110, 134].map((r, i) => (
        <circle
          key={r}
          cx="18"
          cy="182"
          r={r}
          stroke="currentColor"
          strokeWidth={1.25}
          strokeOpacity={0.55 - i * 0.08}
        />
      ))}
    </svg>
  );
}

/**
 * A droplet punched out of a ruled grid. Used where a panel is about
 * structure — infrastructure, delivery, the things under the surface.
 */
export function DropGrid({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <defs>
        <mask id="ob-dropgrid-mask">
          <rect width="120" height="120" fill="white" />
          <path
            d="M60 26 C78 44 90 56 90 74 A30 30 0 0 1 30 74 C30 56 42 44 60 26 Z"
            fill="black"
          />
        </mask>
      </defs>
      <g mask="url(#ob-dropgrid-mask)" stroke="currentColor" strokeOpacity={0.3} strokeWidth={1}>
        {[16, 32, 48, 64, 80, 96].map((v) => (
          <line key={`h${v}`} x1="8" y1={v} x2="112" y2={v} />
        ))}
        {[16, 32, 48, 64, 80, 96].map((v) => (
          <line key={`v${v}`} x1={v} y1="8" x2={v} y2="112" />
        ))}
      </g>
      <path
        d="M60 26 C78 44 90 56 90 74 A30 30 0 0 1 30 74 C30 56 42 44 60 26 Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * Three arcs nested inside a ring — the mark's wave, closed. Used
 * where a panel is about continuity: retention, uptime, the long
 * relationship.
 */
export function ArcRing({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth={1.5} strokeOpacity={0.4} />
      {[
        "M22 66 A38 38 0 0 0 98 62",
        "M32 70 A28 28 0 0 0 88 66",
        "M42 74 A18 18 0 0 0 78 70",
      ].map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
      ))}
      <circle cx="60" cy="40" r="5.5" fill="currentColor" />
    </svg>
  );
}

/**
 * A droplet built from stacked horizontal rules that thin as they
 * rise — depth, layers, a stack. Used where a panel is about scale.
 */
export function DropStack({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <defs>
        <clipPath id="ob-dropstack-clip">
          <path d="M60 20 C80 40 94 54 94 74 A34 34 0 0 1 26 74 C26 54 40 40 60 20 Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#ob-dropstack-clip)">
        {Array.from({ length: 11 }, (_, i) => 24 + i * 8).map((y, i) => (
          <line
            key={y}
            x1="20"
            y1={y}
            x2="100"
            y2={y}
            stroke="currentColor"
            strokeWidth={1 + i * 0.16}
            strokeOpacity={0.25 + i * 0.06}
          />
        ))}
      </g>
      <path
        d="M60 20 C80 40 94 54 94 74 A34 34 0 0 1 26 74 C26 54 40 40 60 20 Z"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    </svg>
  );
}

/**
 * The mark's arcs, opened out and travelling — reach, distribution,
 * the delivery centres. Used where a panel is about spread.
 */
export function ArcSpan({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      {[
        "M10 84 C34 44 86 44 110 84",
        "M20 88 C40 56 80 56 100 88",
        "M30 92 C46 68 74 68 90 92",
      ].map((d, i) => (
        <path
          key={d}
          d={d}
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeOpacity={1 - i * 0.22}
        />
      ))}
      <circle cx="60" cy="34" r="6" fill="currentColor" />
      <circle cx="10" cy="84" r="3" fill="currentColor" />
      <circle cx="110" cy="84" r="3" fill="currentColor" />
    </svg>
  );
}
