"use client";

/**
 * Portal chart kit. Built to the dataviz method:
 * - Categories take SERIES in a FIXED order, never cycled: the ocean ramp
 *   alternated with navy and the mist neutral, so neighbours split on lightness
 *   (one brand hue). Slots 1–5 clear 3:1 on white; the sixth and any overflow
 *   are the neutral, carried by the legend and tooltip (the "relief rule").
 * - Green and red are never categories. They appear only on a series that IS
 *   the outcome (Hired, Rejected): see seriesColors.
 * - Thin marks: 2px lines, rounded data-ends on the baseline, 2px gaps, recessive grid.
 * - One y-axis only. Hover tooltips by default. Text never wears the series colour.
 */
import { useMemo, useRef, useState } from "react";

// ocean-600, navy-900, ocean-400, mist-500, ocean-800, mist-400 (literal: SVG attributes take no var()).
export const SERIES = ["#0a72c0", "#0b2e46", "#3794d4", "#6e8291", "#0a4b7d", "#98a9b4"] as const;
const OVERFLOW = "#98a9b4";
/** Outcome series keep their meaning: kelp-700 for hires, coral-700 for rejections. */
const OUTCOME: Record<string, string> = { hired: "#067647", hires: "#067647", placements: "#067647", placed: "#067647", rejected: "#b42318", rejections: "#b42318" };

/** One colour per series name: outcomes by meaning, the rest SERIES in order, overflow neutral. */
export function seriesColors(names: string[]): string[] {
  let next = 0;
  return names.map((n) => OUTCOME[n.trim().toLowerCase()] ?? SERIES[next++] ?? OVERFLOW);
}
/** Single-hue ordinal ramp (ocean), nearest-surface step still clears 2:1 */
export const RAMP = ["#6fb2e3", "#3794d4", "#1580c8", "#0a72c0", "#085c9c", "#0a4b7d", "#0c3e66"] as const;
/** Sequential ramp for heatmaps: light means near zero */
export const SEQ = ["#eaf4fb", "#d2e8f7", "#a6d0ef", "#6fb2e3", "#3794d4", "#0a72c0", "#085c9c"] as const;

const GRID = "#e3e9ed";
const AXIS_TEXT = "#4b6273"; // mist-600: axis labels are text, 4.5:1

const fmtDefault = (n: number) => n.toLocaleString("en-US");

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export function Legend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-mist-600">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

function Tooltip({ x, y, children, containerWidth }: { x: number; y: number; children: React.ReactNode; containerWidth: number }) {
  const flip = x > containerWidth * 0.65;
  return (
    <div
      role="presentation"
      className="pointer-events-none absolute z-10 min-w-36 rounded-lg bg-navy-950 px-3 py-2 text-[12px] text-white shadow-lg"
      style={{ left: x, top: y, transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)` }}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sparkline: a single series, no axes, last point marked              */
/* ------------------------------------------------------------------ */

export function Sparkline({ values, color = SERIES[0], width = 96, height = 28, label }: { values: number[]; color?: string; width?: number; height?: number; label?: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * (width - 4) + 2, height - 3 - ((v - min) / span) * (height - 6)] as const);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label ?? `Trend from ${values[0]} to ${values[values.length - 1]}`}>
      <path d={`${d} L${last[0]} ${height} L2 ${height} Z`} fill={color} opacity="0.08" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Line / area chart with crosshair tooltip                            */
/* ------------------------------------------------------------------ */

export function TrendChart({
  labels,
  series,
  height = 240,
  area = true,
  format = fmtDefault,
  title,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
  height?: number;
  area?: boolean;
  format?: (n: number) => string;
  title: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 12, t: 12, b: 28 };
  const max = niceMax(Math.max(...series.flatMap((s) => s.values)));
  const x = (i: number) => pad.l + (i / Math.max(1, labels.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const step = Math.ceil(labels.length / 8);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - pad.l) / (W - pad.l - pad.r)) * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, i)));
  };

  const cw = ref.current?.clientWidth ?? W;
  const scale = cw / W;
  const colors = seriesColors(series.map((s) => s.name));

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      {series.length >= 2 && (
        <div className="mb-3">
          <Legend items={series.map((s, i) => ({ label: s.name, color: colors[i] }))} />
        </div>
      )}
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full touch-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={title}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} strokeWidth="1" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={AXIS_TEXT}>
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            i % step === 0 || i === labels.length - 1 ? (
              <text key={l + i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
                {l}
              </text>
            ) : null,
          )}
          {series.map((s, si) => {
            const color = colors[si];
            const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
            return (
              <g key={s.name}>
                {area && series.length === 1 && <path d={`${d} L${x(s.values.length - 1)} ${y(0)} L${x(0)} ${y(0)} Z`} fill={color} opacity="0.1" />}
                <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              </g>
            );
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke="#98a9b4" strokeWidth="1" strokeDasharray="3 3" />
              {series.map((s, si) => (
                <circle key={s.name} cx={x(hover)} cy={y(s.values[hover])} r="4.5" fill={colors[si]} stroke="#fff" strokeWidth="2" />
              ))}
            </g>
          )}
          <rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} fill="transparent" />
        </svg>
        {hover !== null && (
          <Tooltip x={x(hover) * scale} y={(H / 2) * scale} containerWidth={cw}>
            <p className="font-semibold">{labels[hover]}</p>
            {series.map((s, si) => (
              <p key={s.name} className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-mist-300">
                  <span className="size-2 rounded-[2px]" style={{ background: colors[si] }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums">{format(s.values[hover])}</span>
              </p>
            ))}
          </Tooltip>
        )}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Vertical bars (single series, or stacked)                           */
/* ------------------------------------------------------------------ */

export function BarChart({
  labels,
  series,
  height = 240,
  format = fmtDefault,
  title,
  stacked = true,
  highlight,
}: {
  labels: string[];
  series: { name: string; values: number[] }[];
  height?: number;
  format?: (n: number) => string;
  title: string;
  stacked?: boolean;
  /** index of a bar to emphasise (others recede) */
  highlight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = height;
  const pad = { l: 44, r: 8, t: 12, b: 28 };
  const totals = labels.map((_, i) => series.reduce((a, s) => a + (s.values[i] ?? 0), 0));
  const max = niceMax(stacked ? Math.max(...totals) : Math.max(...series.flatMap((s) => s.values)));
  const band = (W - pad.l - pad.r) / labels.length;
  const barW = Math.min(36, band * 0.62);
  const y = (v: number) => pad.t + (1 - v / max) * (H - pad.t - pad.b);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const cw = ref.current?.clientWidth ?? W;
  const scale = cw / W;
  const colors = seriesColors(series.map((s) => s.name));

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      {series.length >= 2 && (
        <div className="mb-3">
          <Legend items={series.map((s, i) => ({ label: s.name, color: colors[i] }))} />
        </div>
      )}
      <div ref={ref} className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={title} onPointerLeave={() => setHover(null)}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill={AXIS_TEXT}>
                {format(t)}
              </text>
            </g>
          ))}
          {labels.map((l, i) => {
            const cx = pad.l + band * i + band / 2;
            const dim = (highlight !== undefined && highlight !== i) || (hover !== null && hover !== i);
            let acc = 0;
            const segs = stacked ? series : series.slice(0, 1);
            return (
              <g key={l + i} opacity={dim ? 0.45 : 1} onPointerEnter={() => setHover(i)}>
                <rect x={pad.l + band * i} y={pad.t} width={band} height={H - pad.t - pad.b} fill="transparent" />
                {segs.map((s, si) => {
                  const v = s.values[i] ?? 0;
                  const top = y(acc + v);
                  const bottom = y(acc);
                  acc += v;
                  const h = Math.max(0, bottom - top - (si > 0 ? 2 : 0));
                  const isTop = si === segs.length - 1;
                  const r = isTop ? Math.min(4, h) : 0;
                  return (
                    <path
                      key={s.name}
                      d={`M${cx - barW / 2} ${bottom - (si > 0 ? 2 : 0)} V${top + r} Q${cx - barW / 2} ${top} ${cx - barW / 2 + r} ${top} H${cx + barW / 2 - r} Q${cx + barW / 2} ${top} ${cx + barW / 2} ${top + r} V${bottom - (si > 0 ? 2 : 0)} Z`}
                      fill={colors[si]}
                    />
                  );
                })}
                {i % Math.ceil(labels.length / 12) === 0 && (
                  <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
                    {l}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {hover !== null && (
          <Tooltip x={(pad.l + band * hover + band / 2) * scale} y={y(totals[hover]) * scale} containerWidth={cw}>
            <p className="font-semibold">{labels[hover]}</p>
            {(stacked ? series : series.slice(0, 1)).map((s, si) => (
              <p key={s.name} className="mt-1 flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-mist-300">
                  <span className="size-2 rounded-[2px]" style={{ background: colors[si] }} />
                  {s.name}
                </span>
                <span className="font-semibold tabular-nums">{format(s.values[hover] ?? 0)}</span>
              </p>
            ))}
            {stacked && series.length > 1 && (
              <p className="mt-1.5 flex justify-between gap-4 border-t border-white/15 pt-1.5">
                <span className="text-mist-300">Total</span>
                <span className="font-semibold tabular-nums">{format(totals[hover])}</span>
              </p>
            )}
          </Tooltip>
        )}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Donut: share of a whole (keep to ≤ 6 slices; fold the rest)         */
/* ------------------------------------------------------------------ */

export function DonutChart({
  data,
  title,
  centerLabel = "Total",
  format = fmtDefault,
  size = 180,
}: {
  data: { label: string; value: number }[];
  title: string;
  centerLabel?: string;
  format?: (n: number) => string;
  size?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const rows = useMemo(() => {
    const sorted = [...data].sort((a, b) => b.value - a.value);
    if (sorted.length <= 6) return sorted;
    const head = sorted.slice(0, 5);
    const rest = sorted.slice(5).reduce((a, d) => a + d.value, 0);
    return [...head, { label: "Other", value: rest }];
  }, [data]);
  const total = rows.reduce((a, d) => a + d.value, 0) || 1;
  const colors = seriesColors(rows.map((d) => d.label));
  const R = 70;
  const r = 50;
  const C = 90;
  let angle = -Math.PI / 2;
  const gap = rows.length > 1 ? 0.025 : 0;

  const arcs = rows.map((d, i) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const a0 = angle + gap / 2;
    const a1 = angle + sweep - gap / 2;
    angle += sweep;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const p = (rad: number, a: number) => `${C + rad * Math.cos(a)} ${C + rad * Math.sin(a)}`;
    return { d: `M${p(R, a0)} A${R} ${R} 0 ${large} 1 ${p(R, a1)} L${p(r, a1)} A${r} ${r} 0 ${large} 0 ${p(r, a0)} Z`, color: colors[i], ...d };
  });

  const active = hover !== null ? rows[hover] : null;

  return (
    <figure className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
      <figcaption className="sr-only">{title}</figcaption>
      <svg viewBox="0 0 180 180" width={size} height={size} role="img" aria-label={title} className="shrink-0" onPointerLeave={() => setHover(null)}>
        {arcs.map((a, i) => (
          <path
            key={a.label}
            d={a.d}
            fill={a.color}
            opacity={hover !== null && hover !== i ? 0.35 : 1}
            onPointerEnter={() => setHover(i)}
            className="cursor-pointer transition-opacity"
          />
        ))}
        <text x={C} y={C - 4} textAnchor="middle" fontSize="22" fontWeight="600" fill="#0b2e46">
          {format(active ? active.value : total)}
        </text>
        <text x={C} y={C + 16} textAnchor="middle" fontSize="11" fill={AXIS_TEXT}>
          {active ? `${Math.round((active.value / total) * 100)}% ${active.label}`.slice(0, 22) : centerLabel}
        </text>
      </svg>
      <ul className="grid w-full gap-2 text-[13px]">
        {arcs.map((a, i) => (
          <li
            key={a.label}
            onPointerEnter={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
            className={`flex items-center justify-between gap-3 rounded-md px-2 py-1 ${hover === i ? "bg-mist-100" : ""}`}
          >
            <span className="flex min-w-0 items-center gap-2 text-navy-900">
              <span aria-hidden className="size-2.5 shrink-0 rounded-[3px]" style={{ background: a.color }} />
              <span className="truncate">{a.label}</span>
            </span>
            <span className="shrink-0 tabular-nums text-mist-600">
              <span className="font-semibold text-navy-900">{format(a.value)}</span> · {Math.round((a.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel: ordered stages with conversion between them                 */
/* ------------------------------------------------------------------ */

export function Funnel({ stages, title, format = fmtDefault }: { stages: { label: string; value: number }[]; title: string; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <ol className="grid gap-2" onPointerLeave={() => setHover(null)}>
        {stages.map((s, i) => {
          const conv = i > 0 && stages[i - 1].value > 0 ? Math.round((s.value / stages[i - 1].value) * 100) : null;
          return (
            <li key={s.label} onPointerEnter={() => setHover(i)} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 text-[13px]">
              <span className="truncate text-navy-900">{s.label}</span>
              <span className="relative h-7 overflow-hidden rounded-md bg-mist-100">
                <span
                  className="absolute inset-y-0 left-0 rounded-md transition-opacity"
                  style={{ width: `${Math.max(2, (s.value / max) * 100)}%`, background: RAMP[Math.min(RAMP.length - 1, i)], opacity: hover !== null && hover !== i ? 0.45 : 1 }}
                />
              </span>
              <span className="w-20 text-right tabular-nums">
                <span className="font-semibold text-navy-900">{format(s.value)}</span>
                {conv !== null && <span className="ml-1 text-[12px] text-mist-600">{conv}%</span>}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[12px] text-mist-600">Percentages show conversion from the previous stage.</p>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Horizontal stacked bar: composition of one whole                    */
/* ------------------------------------------------------------------ */

export function StackedBar({ data, title, format = fmtDefault }: { data: { label: string; value: number }[]; title: string; format?: (n: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const total = data.reduce((a, d) => a + d.value, 0) || 1;
  const colors = seriesColors(data.map((d) => d.label));
  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex h-3.5 w-full gap-[2px] overflow-hidden rounded-full" role="img" aria-label={title} onPointerLeave={() => setHover(null)}>
        {data.map((d, i) => (
          <span
            key={d.label}
            onPointerEnter={() => setHover(i)}
            className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
            style={{ width: `${(d.value / total) * 100}%`, background: colors[i], opacity: hover !== null && hover !== i ? 0.4 : 1 }}
            title={`${d.label}: ${format(d.value)}`}
          />
        ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-mist-600">
        {data.map((d, i) => (
          <li key={d.label} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: colors[i] }} />
            {d.label}
            <span className="font-semibold tabular-nums text-navy-900">{format(d.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Heatmap: rows × columns, sequential single hue                      */
/* ------------------------------------------------------------------ */

export function Heatmap({
  rows,
  cols,
  values,
  title,
  format = fmtDefault,
}: {
  rows: string[];
  cols: string[];
  /** values[row][col] */
  values: number[][];
  title: string;
  format?: (n: number) => string;
}) {
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const max = Math.max(...values.flat(), 1);
  const step = (v: number) => SEQ[Math.min(SEQ.length - 1, Math.floor((v / max) * (SEQ.length - 1)))];
  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="overflow-x-auto overflow-y-hidden">
        <table className="border-separate border-spacing-[3px] text-[11px]" onPointerLeave={() => setHover(null)}>
          <thead>
            <tr>
              <th />
              {cols.map((c) => (
                <th key={c} scope="col" className="px-0.5 pb-1 text-center font-medium text-mist-600">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={r}>
                <th scope="row" className="pr-2 text-right font-medium text-mist-600">
                  {r}
                </th>
                {cols.map((c, ci) => {
                  const v = values[ri]?.[ci] ?? 0;
                  const on = hover?.r === ri && hover?.c === ci;
                  return (
                    <td
                      key={c}
                      onPointerEnter={() => setHover({ r: ri, c: ci })}
                      title={`${r}, ${c}: ${format(v)}`}
                      className={`size-7 rounded-[4px] text-center align-middle tabular-nums ${on ? "ring-2 ring-navy-900" : ""}`}
                      style={{ background: step(v), color: v / max > 0.55 ? "#fff" : "#0b2e46" }}
                    >
                      {on ? format(v) : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-mist-600">
        <span>Fewer</span>
        {SEQ.map((c) => (
          <span key={c} className="size-3 rounded-[3px]" style={{ background: c }} />
        ))}
        <span>More</span>
        {hover && (
          <span className="ml-auto text-[12px] text-navy-900">
            {rows[hover.r]}, {cols[hover.c]}: <span className="font-semibold">{format(values[hover.r]?.[hover.c] ?? 0)}</span>
          </span>
        )}
      </div>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Radial progress: one value against a goal                           */
/* ------------------------------------------------------------------ */

export function RadialProgress({ value, max = 100, label, sub, size = 120 }: { value: number; max?: number; label: string; sub?: string; size?: number }) {
  const pct = Math.max(0, Math.min(1, value / max));
  const R = 48;
  const C = 2 * Math.PI * R;
  return (
    <figure className="flex items-center gap-4">
      <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${label}: ${Math.round(pct * 100)}%`} className="shrink-0">
        <circle cx="60" cy="60" r={R} fill="none" stroke="#e3e9ed" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={SERIES[0]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${C * pct} ${C}`}
          transform="rotate(-90 60 60)"
        />
        <text x="60" y="66" textAnchor="middle" fontSize="22" fontWeight="600" fill="#0b2e46">
          {Math.round(pct * 100)}%
        </text>
      </svg>
      <figcaption>
        <p className="text-[14px] font-semibold text-navy-900">{label}</p>
        {sub && <p className="mt-0.5 text-[13px] text-mist-600">{sub}</p>}
      </figcaption>
    </figure>
  );
}
