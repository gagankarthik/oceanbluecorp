/**
 * Isometric wireframe illustrations. Thin ink lines, square vertex nodes, one
 * cobalt plane per drawing. Each shape stands for a service or an industry:
 * a team grid, a part being fitted, platform layers, a rack, a civic building.
 */

type P3 = [number, number, number];
const C = Math.cos(Math.PI / 6);
const S = 0.5;

function iso([x, y, z]: P3, s: number, ox: number, oy: number): [number, number] {
  return [ox + (x - y) * C * s, oy + (x + y) * S * s - z * s];
}

function poly(pts: P3[], s: number, ox: number, oy: number) {
  return pts.map((p) => iso(p, s, ox, oy).map((n) => n.toFixed(1)).join(",")).join(" ");
}

function Nodes({ pts, s, ox, oy }: { pts: P3[]; s: number; ox: number; oy: number }) {
  return (
    <>
      {pts.map((p, i) => {
        const [x, y] = iso(p, s, ox, oy);
        return <rect key={i} x={x - 1.8} y={y - 1.8} width="3.6" height="3.6" className="fill-ink" />;
      })}
    </>
  );
}

const box = (x: number, y: number, z: number, w: number, d: number, h: number) => {
  const v: P3[] = [
    [x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z],
    [x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h],
  ];
  return {
    v,
    top: [v[4], v[5], v[6], v[7]],
    left: [v[3], v[2], v[6], v[7]],
    right: [v[1], v[2], v[6], v[5]],
    edges: [
      [v[0], v[1]], [v[1], v[2]], [v[2], v[3]], [v[3], v[0]],
      [v[4], v[5]], [v[5], v[6]], [v[6], v[7]], [v[7], v[4]],
      [v[0], v[4]], [v[1], v[5]], [v[2], v[6]], [v[3], v[7]],
    ] as [P3, P3][],
  };
};

function Lines({ edges, s, ox, oy, dashed }: { edges: [P3, P3][]; s: number; ox: number; oy: number; dashed?: boolean }) {
  return (
    <>
      {edges.map(([a, b], i) => {
        const [x1, y1] = iso(a, s, ox, oy);
        const [x2, y2] = iso(b, s, ox, oy);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} className="stroke-ink" strokeWidth=".9" strokeDasharray={dashed ? "2 3" : undefined} />;
      })}
    </>
  );
}

type ArtProps = { className?: string };
const cls = (c?: string) => `geo-art ${c ?? ""}`;

/* ---------- Services ---------- */

/** Staffing: a team as a grid of blocks, the placed specialist raised and lit. */
export function GeoTeam({ className }: ArtProps) {
  const s = 22, ox = 120, oy = 92;
  const heights = [0.8, 1.1, 0.8, 1.1, 2.1, 0.9, 0.8, 0.9, 1.1];
  const blocks = heights.map((h, i) => box((i % 3) * 1.25, Math.floor(i / 3) * 1.25, 0, 1, 1, h));
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      {blocks.map((b, i) => (
        <g key={i}>
          {i === 4 && <polygon points={poly(b.top, s, ox, oy)} className="geo-plane fill-cobalt" />}
          <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
          <Nodes pts={b.top} s={s} ox={ox} oy={oy} />
        </g>
      ))}
    </svg>
  );
}

/** Engineering: a machined part lifted out of its housing, fit shown dashed. */
export function GeoPart({ className }: ArtProps) {
  const s = 24, ox = 120, oy = 112;
  const base = box(0, 0, 0, 3, 3, 2);
  const lifted = box(2, 0, 2.9, 1, 1, 1);
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      <polygon points={poly(lifted.right, s, ox, oy)} className="geo-plane fill-cobalt" />
      <polygon points={poly(lifted.top, s, ox, oy)} className="fill-paper-deep" />
      <Lines edges={base.edges} s={s} ox={ox} oy={oy} />
      <Lines edges={[[[2, 0, 2], [2, 1, 2]], [[2, 1, 2], [3, 1, 2]]]} s={s} ox={ox} oy={oy} dashed />
      <Lines edges={lifted.edges} s={s} ox={ox} oy={oy} />
      <Lines edges={[[[2.5, 0.5, 2], [2.5, 0.5, 2.9]]]} s={s} ox={ox} oy={oy} dashed />
      <Nodes pts={[...base.v, ...lifted.v]} s={s} ox={ox} oy={oy} />
    </svg>
  );
}

/** Enterprise solutions: platform layers stacked, the one being shipped lit. */
export function GeoStack({ className }: ArtProps) {
  const s = 26, ox = 120, oy = 100;
  const slabs = [box(0, 0, 0, 3, 3, 0.7), box(0, 0, 1.2, 3, 3, 0.7), box(0, 0, 2.4, 3, 3, 0.7)];
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      {slabs.map((b, i) => (
        <g key={i}>
          {i === 2 && <polygon points={poly(b.top, s, ox, oy)} className="geo-plane fill-cobalt" />}
          {i === 1 && <polygon points={poly(b.left, s, ox, oy)} className="fill-paper-deep" />}
          <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
          <Nodes pts={b.v} s={s} ox={ox} oy={oy} />
        </g>
      ))}
      <Lines edges={[[[1.5, 1.5, 0.7], [1.5, 1.5, 1.2]], [[1.5, 1.5, 1.9], [1.5, 1.5, 2.4]]]} s={s} ox={ox} oy={oy} dashed />
    </svg>
  );
}

/** Managed services: a rack, one shelf lit, the one being worked on. */
export function GeoRack({ className }: ArtProps) {
  const s = 24, ox = 120, oy = 158;
  const b = box(0, 0, 0, 2, 2, 5);
  const shelves: [P3, P3][] = [1, 2, 3, 4].flatMap((z) => [
    [[0, 2, z], [2, 2, z]],
    [[2, 0, z], [2, 2, z]],
  ] as [P3, P3][]);
  return (
    <svg viewBox="0 0 240 220" className={cls(className)} aria-hidden>
      <polygon points={poly([[2, 0, 2], [2, 2, 2], [2, 2, 3], [2, 0, 3]], s, ox, oy)} className="geo-plane fill-cobalt" />
      <Lines edges={shelves} s={s} ox={ox} oy={oy} dashed />
      <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
      <Nodes pts={b.v} s={s} ox={ox} oy={oy} />
    </svg>
  );
}

/** Training: three books stacked with a slight offset, the top cover lit. */
export function GeoBooks({ className }: ArtProps) {
  const s = 24, ox = 118, oy = 104;
  const books = [box(0, 0, 0, 3.4, 2.2, 0.6), box(0.3, 0.1, 0.6, 3, 2, 0.55), box(0.1, 0.2, 1.15, 3.2, 1.9, 0.6)];
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      {books.map((b, i) => (
        <g key={i}>
          {i === 2 && <polygon points={poly(b.top, s, ox, oy)} className="geo-plane fill-cobalt" />}
          {i === 1 && <polygon points={poly(b.left, s, ox, oy)} className="fill-paper-deep" />}
          <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
          <Nodes pts={b.v} s={s} ox={ox} oy={oy} />
        </g>
      ))}
      <Lines edges={[[[0.4, 0.2, 1.75], [0.4, 2.1, 1.75]]]} s={s} ox={ox} oy={oy} dashed />
    </svg>
  );
}

/** One accountable centre: a hexagonal lattice from above, one wedge lit. */
export function GeoLattice({ className }: ArtProps) {
  const cx = 120, cy = 100, r = 72;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
  const mid = pts.map((p, i) => {
    const q = pts[(i + 1) % 6];
    return [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2] as const;
  });
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      <polygon points={`${cx},${cy} ${pts[0].join(",")} ${pts[1].join(",")}`} className="geo-plane fill-cobalt" />
      <polygon points={pts.map((p) => p.join(",")).join(" ")} fill="none" className="stroke-ink" strokeWidth=".9" />
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} className="stroke-ink" strokeWidth=".9" />
      ))}
      <polygon points={mid.map((p) => p.join(",")).join(" ")} fill="none" className="stroke-ink" strokeWidth=".9" strokeDasharray="2 3" />
      {[...pts, ...mid, [cx, cy] as const].map((p, i) => (
        <rect key={i} x={p[0] - 1.8} y={p[1] - 1.8} width="3.6" height="3.6" className="fill-ink" />
      ))}
    </svg>
  );
}

/* ---------- Industries ---------- */

/** Government: a civic building, base, four columns and a pediment slab. */
export function GeoCivic({ className }: ArtProps) {
  const s = 22, ox = 120, oy = 128;
  const base = box(0, 0, 0, 4, 2, 0.5);
  const roof = box(0, 0, 2.6, 4, 2, 0.6);
  const cols = [0.4, 1.4, 2.4, 3.4].map((x) => box(x, 1.4, 0.5, 0.25, 0.25, 2.1));
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      <polygon points={poly(roof.top, s, ox, oy)} className="geo-plane fill-cobalt" />
      <Lines edges={base.edges} s={s} ox={ox} oy={oy} />
      {cols.map((c, i) => (
        <Lines key={i} edges={c.edges} s={s} ox={ox} oy={oy} />
      ))}
      <Lines edges={roof.edges} s={s} ox={ox} oy={oy} />
      <Nodes pts={[...base.v, ...roof.v]} s={s} ox={ox} oy={oy} />
    </svg>
  );
}

/** Healthcare: a cross assembled from five blocks, the centre lit. */
export function GeoCross({ className }: ArtProps) {
  const s = 22, ox = 120, oy = 92;
  const blocks = [box(1, 0, 0, 1, 1, 1), box(0, 1, 0, 1, 1, 1), box(2, 1, 0, 1, 1, 1), box(1, 2, 0, 1, 1, 1), box(1, 1, 0, 1, 1, 1.8)];
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      {blocks.map((b, i) => (
        <g key={i}>
          {i === 4 && <polygon points={poly(b.top, s, ox, oy)} className="geo-plane fill-cobalt" />}
          <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
          <Nodes pts={b.top} s={s} ox={ox} oy={oy} />
        </g>
      ))}
    </svg>
  );
}

/** Financial services: three rising columns, the tallest lit. */
export function GeoColumns({ className }: ArtProps) {
  const s = 22, ox = 120, oy = 130;
  const cols = [box(0, 2, 0, 1, 1, 1.2), box(1.3, 1, 0, 1, 1, 2.2), box(2.6, 0, 0, 1, 1, 3.4)];
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      {cols.map((b, i) => (
        <g key={i}>
          {i === 2 && <polygon points={poly(b.top, s, ox, oy)} className="geo-plane fill-cobalt" />}
          <Lines edges={b.edges} s={s} ox={ox} oy={oy} />
          <Nodes pts={b.v} s={s} ox={ox} oy={oy} />
        </g>
      ))}
      <Lines edges={[[[0.5, 2.5, 1.2], [1.8, 1.5, 2.2]], [[1.8, 1.5, 2.2], [3.1, 0.5, 3.4]]]} s={s} ox={ox} oy={oy} dashed />
    </svg>
  );
}

/** Manufacturing: a plant hall with a stepped roof line and a stack. */
export function GeoPlant({ className }: ArtProps) {
  const s = 22, ox = 112, oy = 128;
  const hall = box(0, 0, 0, 4, 2.2, 1.4);
  const bays = [box(0, 0, 1.4, 1.3, 2.2, 0.6), box(1.35, 0, 1.4, 1.3, 2.2, 0.6), box(2.7, 0, 1.4, 1.3, 2.2, 0.6)];
  const stack = box(3.3, 1.5, 2, 0.5, 0.5, 1.8);
  return (
    <svg viewBox="0 0 240 200" className={cls(className)} aria-hidden>
      <polygon points={poly(hall.left, s, ox, oy)} className="geo-plane fill-cobalt" />
      <Lines edges={hall.edges} s={s} ox={ox} oy={oy} />
      {bays.map((b, i) => (
        <Lines key={i} edges={b.edges} s={s} ox={ox} oy={oy} dashed={i === 1} />
      ))}
      <Lines edges={stack.edges} s={s} ox={ox} oy={oy} />
      <Nodes pts={[...hall.v, ...stack.top]} s={s} ox={ox} oy={oy} />
    </svg>
  );
}
