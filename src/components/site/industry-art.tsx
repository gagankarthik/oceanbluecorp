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

/** Healthcare: a hospital, two wings either side of a tower carrying the cross. */
export function ArtHealth({ className }: ArtProps) {
  const wingWindows = [50, 70, 158, 178];
  return (
    <Frame className={className}>
      <rect x="40" y="108" width="52" height="58" className="fill-white" />
      <rect x="148" y="108" width="52" height="58" className="fill-white" />
      {wingWindows.map((x) => (
        <g key={x}>
          <rect x={x} y="120" width="12" height="12" />
          <rect x={x} y="142" width="12" height="12" />
        </g>
      ))}
      <rect x="88" y="62" width="64" height="104" className="fill-white" />
      <rect x="84" y="56" width="72" height="6" className="fill-white" />
      <rect x="104" y="70" width="32" height="32" rx="6" className="fill-cobalt stroke-cobalt" />
      <path d="M120 77v18M111 86h18" className="stroke-white" strokeWidth="5" />
      {[98, 114, 130].map((x) => <rect key={x} x={x} y="110" width="12" height="12" />)}
      <rect x="100" y="132" width="40" height="6" className="fill-white" />
      <rect x="108" y="138" width="24" height="28" className="fill-cobalt-tint" />
      <line x1="120" y1="138" x2="120" y2="166" />
      <line x1="24" y1="166" x2="216" y2="166" />
    </Frame>
  );
}

/** Financial services: a vault with a cobalt dial, a coin stack beside it. */
export function ArtFinance({ className }: ArtProps) {
  // Bottom coin first so each one above covers the one below.
  // Staggered so it reads as a pile of coins, not a database cylinder.
  const coins = [{ y: 154, dx: 0 }, { y: 145, dx: 4 }, { y: 136, dx: -3 }, { y: 127, dx: 2 }];
  const spokes = [-90, 30, 150].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return { x1: 104 + 6 * Math.cos(a), y1: 112 + 6 * Math.sin(a), x2: 104 + 17 * Math.cos(a), y2: 112 + 17 * Math.sin(a) };
  });
  return (
    <Frame className={className}>
      <rect x="62" y="158" width="14" height="8" className="fill-white" />
      <rect x="132" y="158" width="14" height="8" className="fill-white" />
      <rect x="48" y="58" width="112" height="100" rx="6" className="fill-white" />
      <rect x="58" y="68" width="92" height="80" rx="3" />
      <rect x="44" y="80" width="6" height="16" rx="2" className="fill-white" />
      <rect x="44" y="120" width="6" height="16" rx="2" className="fill-white" />
      <circle cx="104" cy="112" r="24" className="fill-cobalt stroke-cobalt" />
      <circle cx="104" cy="112" r="17" className="stroke-white" strokeWidth="1.25" />
      {spokes.map((s, i) => (
        <g key={i} className="stroke-white" strokeWidth="2.5">
          <line x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} />
          <circle cx={s.x2} cy={s.y2} r="2" className="fill-white" />
        </g>
      ))}
      <circle cx="104" cy="112" r="5" className="fill-white stroke-white" />
      <rect x="138" y="96" width="6" height="32" rx="3" className="fill-white" />
      {coins.map(({ y, dx }, i) => (
        <g key={y}>
          <path d={`M${174 + dx} ${y}v8a18 5.5 0 0 0 36 0v-8`} className="fill-white" />
          <ellipse cx={192 + dx} cy={y} rx="18" ry="5.5" className={i === coins.length - 1 ? "fill-cobalt-tint" : "fill-white"} />
        </g>
      ))}
      <ellipse cx="194" cy="127" rx="10" ry="3" className="stroke-cobalt" strokeWidth="1.25" />
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
