/**
 * The argument drawn with one repeated shape, one panel per idea: scattered
 * vendors, pulled into one team, laid out as ordered work.
 */
const S = 12;

// Deterministic scatter so server and client render the same picture
function scatter(count: number) {
  const out: { x: number; y: number; tone: number }[] = [];
  let seed = 11;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let i = 0; i < count; i++) {
    out.push({ x: 10 + rand() * 360, y: 14 + rand() * 236, tone: rand() > 0.5 ? 1 : 0 });
  }
  return out;
}

const loose = scatter(46);
const ribbon = Array.from({ length: 3 * 25 }, (_, i) => ({ x: 430 + (i % 25) * 14, y: 115 + Math.floor(i / 25) * 14 }));
const ordered = Array.from({ length: 5 * 8 }, (_, i) => ({ x: 840 + (i % 8) * 44, y: 36 + Math.floor(i / 8) * 46 }));

export type ManyPart = "loose" | "ribbon" | "ordered";

// Each panel's slice of the original 1200×266 drawing, same height so they read as one sequence
const VIEW: Record<ManyPart, string> = {
  loose: "0 0 392 266",
  ribbon: "418 0 372 266",
  ordered: "828 0 350 266",
};

const LABEL: Record<ManyPart, string> = {
  loose: "Loose squares in two pale tones, scattered with no order.",
  ribbon: "The same squares pulled into one tight navy ribbon.",
  ordered: "Blue squares laid out in even rows.",
};

/** One panel with `part`; the whole sequence without it. */
export default function ManyIntoOne({ part, className = "h-auto w-full" }: { part?: ManyPart; className?: string }) {
  const all = !part;
  return (
    <svg
      viewBox={part ? VIEW[part] : "0 0 1200 266"}
      className={className}
      role="img"
      aria-label={part ? LABEL[part] : `${LABEL.loose} ${LABEL.ribbon} ${LABEL.ordered}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {(all || part === "loose") &&
        loose.map((p, i) => <rect key={i} x={p.x} y={p.y} width={S} height={S} className={p.tone ? "fill-tide-300" : "fill-mist-300"} />)}
      {(all || part === "ribbon") && ribbon.map((p, i) => <rect key={i} x={p.x} y={p.y} width={S} height={S} className="fill-navy-900" />)}
      {(all || part === "ordered") && ordered.map((p, i) => <rect key={i} x={p.x} y={p.y} width={S + 6} height={S + 6} className="fill-ocean-600" />)}
    </svg>
  );
}
