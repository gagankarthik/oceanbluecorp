/**
 * Industry illustrations for the home page. Flat line drawings in ink with
 * one cobalt accent each, drawn on a 240×200 box to sit where GeoArt did.
 */

type ArtProps = { className?: string };

function Frame({ className, children }: ArtProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 200" className={className} aria-hidden>
      <g fill="none" className="stroke-ink" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </g>
    </svg>
  );
}

/** Government: a capitol, domed drum over a colonnade, flag on the lantern. */
export function ArtCapitol({ className }: ArtProps) {
  const columns = [72, 92, 112, 132, 152, 172];
  return (
    <Frame className={className}>
      <line x1="120" y1="36" x2="120" y2="12" />
      <path d="M120 13h20l-5 5.5 5 5.5h-20z" className="fill-cobalt stroke-cobalt" />
      <rect x="113" y="36" width="14" height="10" className="fill-white" />
      <path d="M86 78a34 32 0 0 1 68 0z" className="fill-cobalt" />
      <path d="M103 78a17 32 0 0 1 17-32m0 0a17 32 0 0 1 17 32" className="stroke-white" strokeWidth="1.25" />
      <rect x="86" y="78" width="68" height="18" className="fill-white" />
      {[96, 110, 124, 138].map((x) => <rect key={x} x={x} y="82" width="6" height="10" rx="3" />)}
      <rect x="54" y="96" width="132" height="10" className="fill-white" />
      {columns.map((x) => <rect key={x} x={x - 4} y="106" width="8" height="42" className="fill-white" />)}
      <line x1="60" y1="148" x2="180" y2="148" />
      <rect x="48" y="148" width="144" height="8" className="fill-white" />
      <rect x="38" y="156" width="164" height="10" className="fill-white" />
      <line x1="24" y1="166" x2="216" y2="166" />
    </Frame>
  );
}

/** Healthcare: a heart with a pulse trace running through it, and a cross badge. */
export function ArtHealth({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <path
        d="M120 162C62 126 58 78 92 70c14-3 24 5 28 16 4-11 14-19 28-16 34 8 30 56-28 92z"
        className="fill-cobalt-tint"
      />
      <path d="M26 116h54l10-22 12 44 12-62 12 50 8-10h80" />
      <circle cx="184" cy="54" r="20" className="fill-cobalt stroke-cobalt" />
      <path d="M184 44v20M174 54h20" className="stroke-white" strokeWidth="4" />
      <circle cx="80" cy="116" r="3" className="fill-ink" />
      <circle cx="136" cy="116" r="3" className="fill-ink" />
    </Frame>
  );
}

/** Financial services: a coin stack beside rising bars and a trend arrow. */
export function ArtFinance({ className }: ArtProps) {
  // Bottom coin first so each one above covers the one below.
  const coins = [146, 136, 126, 116];
  return (
    <Frame className={className}>
      {coins.map((y, i) => (
        <g key={y}>
          <path d={`M38 ${y}v10a26 8 0 0 0 52 0v-10`} className="fill-white" />
          <ellipse cx="64" cy={y} rx="26" ry="8" className={i === coins.length - 1 ? "fill-cobalt-tint" : "fill-white"} />
        </g>
      ))}
      <ellipse cx="64" cy="116" rx="15" ry="4.5" className="stroke-cobalt" strokeWidth="1.25" />
      <rect x="108" y="126" width="22" height="40" rx="2" className="fill-white" />
      <rect x="140" y="104" width="22" height="62" rx="2" className="fill-white" />
      <rect x="172" y="76" width="22" height="90" rx="2" className="fill-cobalt stroke-cobalt" />
      <path d="M104 104l30-22 26 8 40-40" className="stroke-cobalt" strokeWidth="2.5" />
      <path d="M186 50h14v14" className="stroke-cobalt" strokeWidth="2.5" />
      <line x1="24" y1="166" x2="216" y2="166" />
    </Frame>
  );
}

/** Teeth of a gear as one closed path around (cx, cy). */
function gearPath(cx: number, cy: number, inner: number, outer: number, teeth: number) {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    for (const [r, t] of [[inner, 0], [outer, 0.18], [outer, 0.5], [inner, 0.68]] as const) {
      const ang = a + t * step;
      pts.push(`${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)}`);
    }
  }
  return `M${pts.join("L")}Z`;
}

/** Manufacturing: a sawtooth-roof plant with a stack, and a gear. */
export function ArtFactory({ className }: ArtProps) {
  return (
    <Frame className={className}>
      <circle cx="146" cy="68" r="5" />
      <circle cx="134" cy="54" r="7" />
      <rect x="142" y="80" width="14" height="46" className="fill-white" />
      <path d="M34 166V118l32-20v20l32-20v20l32-20v68z" className="fill-white" />
      <rect x="130" y="126" width="72" height="40" className="fill-white" />
      {[44, 76, 108].map((x) => <rect key={x} x={x} y="130" width="14" height="12" />)}
      <rect x="156" y="142" width="20" height="24" />
      <path d={gearPath(186, 76, 20, 27, 10)} className="fill-cobalt stroke-cobalt" />
      <circle cx="186" cy="76" r="8" className="fill-white stroke-white" />
      <line x1="24" y1="166" x2="216" y2="166" />
    </Frame>
  );
}
