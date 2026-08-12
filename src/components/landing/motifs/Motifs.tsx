/* ============================================================
   Ocean Blue illustration set.

   Two rules, both from feedback:

   1. EVERY illustration depicts the thing it sits next to. Nothing
      here is chosen to fill a corner. A pane about delivery centres
      gets a globe; a pane about years gets rings; a pillar about a
      single contract gets one sheet in front of the three it
      replaced. If a placement has nothing to depict, it gets no
      illustration.

   2. They carry colour. A one-tone outline at 12% opacity is a
      watermark, not an illustration. Each mark draws in two tones:
      the line in `currentColor`, and a solid accent in
      `--motif-accent` (defaults to the logo's light blue). Set the
      pair per surface with Tailwind's arbitrary-property syntax:

        text-[var(--hz-cobalt)] [--motif-accent:var(--hz-aqua)]

   The drawing language is shared so the set reads as one hand:
   a 48-unit box, 1.75 stroke, round caps and joins, and the logo's
   droplet reused as the accent wherever a mark needs a focal point.
   ============================================================ */

type MotifProps = { className?: string };

const ACCENT = "var(--motif-accent, var(--hz-aqua))";

/** Shared frame — every mark is drawn in the same 48-unit box with the
 *  same stroke discipline, which is what makes eight separate drawings
 *  look like one set. */
function Frame({ className, children }: MotifProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

/* ---------- brand primitives ---------- */

/** Confirmation tick for the proof rows.
 *
 *  This slot used to hold the logo's droplet. That was wrong twice over:
 *  it put the mark in front of a dozen unrelated lines until it read as
 *  a bullet rather than a mark, and a water drop says nothing about
 *  "shortlists in 48 hours". These lines are claims being confirmed, so
 *  they get the glyph that means confirmed. */
export function CheckMark({ className = "" }: MotifProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

/** The full mark — droplet plus the wave sweeping off it. Sized in the
 *  hundreds of pixels it becomes architecture rather than a logo, which
 *  is how the closing band is built. */
export function LogoMark({ className = "" }: MotifProps) {
  return (
    <svg viewBox="0 0 120 120" fill="none" className={className} aria-hidden>
      <path
        d="M44 14 C64 36 78 50 78 70 A34 34 0 0 1 10 70 C10 50 24 36 44 14 Z"
        fill="currentColor"
      />
      {/* The arcs open off the bowl's right edge and are centred ON it, so
          they read as one continuous mark. Centred further out they detach
          and the whole thing becomes a drop beside a set of brackets. */}
      {[15, 26, 37].map((r, i) => (
        <path
          key={r}
          d={`M76 ${70 - r} A ${r} ${r} 0 0 1 76 ${70 + r}`}
          stroke={ACCENT}
          strokeWidth={7 - i * 1.5}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}

/** Concentric arcs sweeping from a corner. The only mark here that is
 *  allowed to be a ground rather than a subject. */
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

/* ---------- the statement pillars ---------- */

/** One contract, not four: three sheets fade back, one comes forward
 *  with a seal on it. The drawing IS the sentence. */
export function IllContract({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <path d="M13 9h13l6 6v5" strokeOpacity={0.3} />
      <path d="M9.5 12.5h13l6 6v5" strokeOpacity={0.5} />
      <path d="M6 16h13l6 6v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V16Z" fill="var(--hz-paper)" />
      <path d="M19 16v6h6" />
      <path d="M11 29h11M11 34h7" strokeWidth={1.5} />
      <circle cx="24" cy="34" r="4" fill={ACCENT} stroke="none" />
    </Frame>
  );
}

/** Our people, our problem: three figures, the accountable one solid. */
export function IllTeam({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <circle cx="12" cy="18" r="4.5" strokeOpacity={0.45} />
      <path d="M4.5 34c0-4.4 3.4-7.5 7.5-7.5" strokeOpacity={0.45} />
      <circle cx="36" cy="18" r="4.5" strokeOpacity={0.45} />
      <path d="M43.5 34c0-4.4-3.4-7.5-7.5-7.5" strokeOpacity={0.45} />
      <circle cx="24" cy="16" r="6.5" fill={ACCENT} stroke="none" />
      <path d="M13 38a11 11 0 0 1 22 0" />
    </Frame>
  );
}

/** Public sector ready: a certification seal with ribbon tails. */
export function IllSeal({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <path d="M18 29 14 43l6-3 5 3-3.5-11" strokeOpacity={0.55} />
      <path d="M30.5 30 35 43l-6-3" strokeOpacity={0.55} />
      <circle cx="24" cy="18" r="12.5" />
      <circle cx="24" cy="18" r="7.5" fill={ACCENT} stroke="none" />
      <path d="m21 18 2.2 2.2L27.5 16" stroke="var(--hz-paper)" strokeWidth={2} />
    </Frame>
  );
}

/* ---------- the proof panes ---------- */

/** Years delivering: growth rings. Age drawn the way age is actually
 *  read off a cross-section, with the droplet as the core. */
export function IllYears({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      {[21, 16, 11].map((r, i) => (
        <circle key={r} cx="24" cy="24" r={r} strokeOpacity={0.35 + i * 0.2} />
      ))}
      {/* The heartwood at the centre of the rings — the year it started. */}
      <circle cx="24" cy="24" r="6" fill={ACCENT} stroke="none" />
    </Frame>
  );
}

/** Enterprise clients: towers of different heights, the tallest solid. */
export function IllBuildings({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <path d="M5 41V22h10v19" strokeOpacity={0.5} />
      <path d="M8.5 27h3M8.5 32h3M8.5 37h3" strokeWidth={1.5} strokeOpacity={0.5} />
      <rect x="19" y="11" width="12" height="30" rx="1.5" fill={ACCENT} stroke="none" />
      <path d="M35 41V26h8v15" />
      <path d="M38 31h2.5M38 36h2.5" strokeWidth={1.5} />
      <path d="M3 41h42" />
    </Frame>
  );
}

/** Client retention: the relationship closing back on itself. Two arrows
 *  round a droplet — renewal, not a generic circle. */
export function IllLoop({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <path d="M39 20A16 16 0 0 0 10.5 16.5" />
      <path d="M10 8v9h9" />
      <path d="M9 28a16 16 0 0 0 28.5 3.5" />
      <path d="M38 40v-9h-9" />
      {/* The account the loop keeps returning to. */}
      <circle cx="24" cy="24" r="5" fill={ACCENT} stroke="none" />
    </Frame>
  );
}

/** Delivery centres: a globe with a located pin, because the figure is
 *  about where the work physically happens. */
export function IllGlobe({ className = "" }: MotifProps) {
  return (
    <Frame className={className}>
      <circle cx="24" cy="24" r="18" />
      <path d="M6 24h36" />
      <ellipse cx="24" cy="24" rx="8" ry="18" />
      <path d="M11 12.5a26 26 0 0 0 26 0M11 35.5a26 26 0 0 1 26 0" strokeOpacity={0.5} />
      {/* A map pin, so it points DOWN at a place. The teardrop that was here
          before pointed up, which made it the logo's droplet sitting on a
          globe rather than a location on one. */}
      <path
        d="M31 24.5c-2.9-2.7-4.8-4.6-4.8-6.8a4.8 4.8 0 0 1 9.6 0c0 2.2-1.9 4.1-4.8 6.8Z"
        fill={ACCENT}
        stroke="none"
      />
      <circle cx="31" cy="17.6" r="1.7" fill="var(--hz-ink)" stroke="none" />
    </Frame>
  );
}
