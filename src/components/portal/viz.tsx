"use client";

/*
 * The portal's analysis widgets, built to the dataviz method and the funnel's pattern: drawn at
 * the container's true width so text stays its size, one hue for volume (slot-1 blue) and the
 * outcome green for hires, a hover/focus readout under every chart so no number needs a tooltip,
 * and every mark that stands for a list opens it.
 */
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Legend, SERIES, Sparkline, TrendChart, seriesColors, useWidth } from "./charts";
import Icon, { type IconName } from "./icons";
import { StateIcon } from "./kit/state-icon";
import { sectionTone } from "./kit/tone";
import { stageState } from "./recruiting/model";
import { Avatar, DeltaPill, Segmented, type StatDelta } from "./ui";
import { STALE_DAYS } from "@/lib/pipeline";

export const BAR = SERIES[0];
export const HIRED = "#0e8a4f";
/** A third line beside BAR and HIRED (validated with both, light and dark; the toggles name it) */
export const VIOLET = "#8b5cf6";
/** Volume that did not progress: the slot-1 hue, washed so the solid marks inside it lead */
const WASH = "color-mix(in srgb, #1580c8 22%, transparent)";

const pctOf = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
const niceMax = (v: number) => {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};
/** Round axis ticks from 0 to a nice max: quarters when they land on integers, else fifths */
const axisTicks = (max: number) => {
  const step = max <= 5 ? 1 : max / (max % 4 === 0 ? 4 : 5);
  return Array.from({ length: Math.round(max / step) + 1 }, (_, i) => Math.round(i * step));
};
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** The line under a chart that says what the pointer is on, or the headline when it's on nothing. */
function Readout({ children }: { children: React.ReactNode }) {
  return (
    <p aria-live="polite" className="min-h-9 rounded-md bg-mist-50 px-3 py-2 text-adm-xs text-mist-700">
      {children}
    </p>
  );
}
const B = ({ children }: { children: React.ReactNode }) => <span className="font-semibold text-navy-900">{children}</span>;

/* ------------------------------------------------------------------ */
/* Layout pieces shared by the dashboard views                         */
/* ------------------------------------------------------------------ */

/** A dashboard section, as Plane's home widgets: a plain heading above one bordered body. */
export function Section({
  title,
  meta,
  action,
  children,
  className = "",
  flush = false,
}: {
  title: string;
  meta?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Lists and tabbed bodies run edge to edge */
  flush?: boolean;
}) {
  return (
    <section aria-label={title} className={`flex min-w-0 flex-col gap-2 ${className}`}>
      <header className="flex min-h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-adm-base font-semibold text-navy-900">{title}</h2>
          {meta && <span className="truncate text-adm-xs text-mist-600">{meta}</span>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={`min-w-0 rounded-lg border border-mist-200 bg-mist-0 ${flush ? "overflow-hidden" : "p-4"}`}>{children}</div>
    </section>
  );
}

export type Figure = { label: string; icon: IconName; value: number | string; href: string; delta?: StatDelta; note?: string; spark?: number[] };

/** Plane's analytics overview: the headline figures in one ruled strip, each opening its list. */
export function FigureStrip({ items }: { items: Figure[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-mist-200 bg-mist-200 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((f) => (
        <Link key={f.label} href={f.href} className="group flex min-w-0 flex-col gap-2 bg-mist-0 px-4 py-3 transition-colors duration-150 hover:bg-mist-50">
          <span className="flex items-center gap-2 text-adm-base text-mist-600">
            <Icon name={f.icon} className="size-4 shrink-0 text-mist-500" />
            <span className="truncate">{f.label}</span>
            <Icon name="chevronRight" className="ml-auto size-4 shrink-0 -translate-x-1 text-mist-500 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
          <span className="flex min-h-6 items-end justify-between gap-3">
            <span className="text-adm-xl font-semibold leading-none tracking-tight text-navy-900">{f.value}</span>
            {f.spark && <Sparkline values={f.spark} color={sectionTone.recruiting.spark} width={76} height={24} label={`${f.label} trend`} />}
          </span>
          <span className="flex min-h-5 min-w-0 items-center gap-1.5 text-adm-xs text-mist-600">
            {f.delta && <DeltaPill {...f.delta} />}
            <span className="truncate">{[f.delta?.label, f.note].filter(Boolean).join(" · ")}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Trend with series toggles                                           */
/* ------------------------------------------------------------------ */

/** A trend over the range, with toggles that show and hide each series and carry its total. */
export function ActivityChart({ labels, series, range, height = 200 }: { labels: string[]; series: { name: string; values: number[]; color?: string }[]; range: string; height?: number }) {
  const [off, setOff] = useState<Set<string>>(new Set());
  // Colour follows the series, never its position among the visible ones
  const colors = useMemo(() => new Map(series.map((s, i) => [s.name, s.color ?? seriesColors(series.map((x) => x.name))[i]])), [series]);
  const shown = series.filter((s) => !off.has(s.name));
  const toggle = (name: string) =>
    setOff((o) => {
      const n = new Set(o);
      if (n.has(name)) n.delete(name);
      else if (series.length - n.size > 1) n.add(name); // one series always stays
      return n;
    });
  return (
    <div className="grid gap-4">
      <div role="group" aria-label="Series" className="flex flex-wrap gap-2">
        {series.map((s) => {
          const on = !off.has(s.name);
          const total = s.values.reduce((n, v) => n + v, 0);
          return (
            <button
              key={s.name}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(s.name)}
              title={on ? `Hide ${s.name.toLowerCase()}` : `Show ${s.name.toLowerCase()}`}
              className={`flex h-8 items-center gap-2 rounded-md border px-2.5 text-adm-base transition-colors duration-150 ${
                on ? "border-mist-200 bg-mist-0 text-navy-900 hover:bg-mist-50" : "border-dashed border-mist-300 bg-transparent text-mist-600 hover:text-navy-900"
              }`}
            >
              <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: on ? colors.get(s.name) : "var(--color-mist-400)" }} />
              {s.name}
              <span className="font-semibold tabular-nums">{total.toLocaleString("en-US")}</span>
            </button>
          );
        })}
      </div>
      <TrendChart legend={false} height={height} title={`${shown.map((s) => s.name).join(", ")}, ${range}`} labels={labels} series={shown.map((s) => ({ ...s, color: colors.get(s.name) }))} area />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Funnel: columns joined by drop-off bands                            */
/* ------------------------------------------------------------------ */

export type FunnelStage = { key: string; label: string; count: number; conversion: number | null; medianDays: number | null };

/**
 * The pipeline as a funnel: one column per stage, its height the people who reached it, joined
 * by tapering bands that show the drop-off with the stage-to-stage rate on each. Hover or focus a
 * stage for its readout; with `href`, select it to open that stage's list.
 */
export function ConversionFunnel({ stages, href, height = 168 }: { stages: FunnelStage[]; href?: (key: string) => string; height?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const W = useWidth(ref);
  const H = height;
  const top = 26; // room for the counts above the columns
  const n = stages.length;
  const slot = W / n;
  const barW = Math.min(28, slot * 0.3);
  const max = Math.max(1, ...stages.map((s) => s.count));
  const room = H - top - 6;
  const mid = top + room / 2;
  const geo = stages.map((s, i) => {
    const h = Math.max(6, (s.count / max) * room);
    return { cx: slot * i + slot / 2, y: mid - h / 2, h };
  });
  const fill = (key: string) => (key === "hired" || key === "placed" ? HIRED : BAR);
  const first = stages[0]?.count ?? 0;
  const last = stages[n - 1];
  const s = hover !== null ? stages[hover] : null;
  const pill = slot > 70;

  return (
    <div className="grid gap-3">
      <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block text-navy-900" role="img" aria-label={`Funnel: ${stages.map((x) => `${x.label} ${x.count}`).join(", ")}`}>
          {geo.slice(0, -1).map((g, i) => {
            const nx = geo[i + 1];
            const x1 = g.cx + barW / 2;
            const x2 = nx.cx - barW / 2;
            const xm = (x1 + x2) / 2;
            const d = `M${x1} ${g.y} C${xm} ${g.y} ${xm} ${nx.y} ${x2} ${nx.y} L${x2} ${nx.y + nx.h} C${xm} ${nx.y + nx.h} ${xm} ${g.y + g.h} ${x1} ${g.y + g.h} Z`;
            return <path key={`b${i}`} d={d} fill={fill(stages[i + 1].key)} opacity={hover === null || hover === i + 1 ? 0.16 : 0.06} className="transition-opacity duration-200" />;
          })}
          {geo.map((g, i) => (
            <rect key={stages[i].key} x={g.cx - barW / 2} y={g.y} width={barW} height={g.h} rx={4} fill={fill(stages[i].key)} opacity={hover === null || hover === i ? 1 : 0.35} className="transition-opacity duration-200" />
          ))}
          {geo.map((g, i) => (
            <text key={`c${i}`} x={g.cx} y={g.y - 8} textAnchor="middle" fontSize="13" fontWeight="600" fill="currentColor">
              {stages[i].count}
            </text>
          ))}
          {pill &&
            geo.slice(0, -1).map((g, i) => {
              const conv = stages[i + 1].conversion;
              if (conv === null) return null;
              const xm = (g.cx + geo[i + 1].cx) / 2;
              return (
                <g key={`p${i}`}>
                  <rect x={xm - 20} y={mid - 10} width={40} height={20} rx={10} style={{ fill: "var(--color-mist-0)", stroke: "var(--color-mist-200)" }} />
                  <text x={xm} y={mid + 4} textAnchor="middle" fontSize="11" fontWeight="600" style={{ fill: "var(--color-mist-700)" }}>
                    {conv}%
                  </text>
                </g>
              );
            })}
        </svg>
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
          {stages.map((st, i) => {
            const props = {
              onPointerEnter: () => setHover(i),
              onFocus: () => setHover(i),
              onBlur: () => setHover(null),
              "aria-label": `${st.label}: ${st.count}${st.conversion !== null ? `, ${st.conversion}% of the stage before` : ""}${href ? ". Open the list." : ""}`,
              className: "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ocean-600",
            };
            return href ? <Link key={st.key} href={href(st.key)} {...props} /> : <span key={st.key} tabIndex={0} role="img" {...props} />;
          })}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {stages.map((st, i) => {
          const stale = st.medianDays !== null && st.medianDays > STALE_DAYS;
          return (
            <div key={st.key} className={`grid justify-items-center gap-0.5 px-1 text-center transition-opacity duration-200 ${hover === null || hover === i ? "opacity-100" : "opacity-50"}`}>
              <span className="flex max-w-full items-center gap-1.5 text-adm-xs font-medium text-navy-900">
                <StateIcon {...stageState(st.key)} />
                <span className="truncate">{st.label}</span>
              </span>
              {st.medianDays !== null && (
                <span className={`flex items-center gap-1 text-adm-xs tabular-nums ${stale ? "font-medium text-status-warning" : "text-mist-600"}`}>
                  {stale && <Icon name="timer" className="size-3" />}
                  {st.medianDays}d wait
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Readout>
        {s ? (
          <>
            <B>{s.label}</B> · {s.count} people
            {s.conversion !== null && <> · {s.conversion}% of the stage before</>}
            {first > 0 && <> · {pctOf(s.count, first)}% of the first stage</>}
            {s.medianDays !== null && <> · median wait {s.medianDays} days</>}
            {href && <> · select to open the list</>}
          </>
        ) : (
          <>
            End to end: <B>{last?.count ?? 0}</B> of <B>{first}</B> reached {last?.label ?? "the end"} ({first ? ((100 * (last?.count ?? 0)) / first).toFixed(1) : "0"}%). Hover a stage for its detail.
          </>
        )}
      </Readout>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Yield bars: volume, and how much of it got through two gates        */
/* ------------------------------------------------------------------ */

export type YieldRow = { key: string; label: string; total: number; mid: number; end: number; href?: string; onSelect?: () => void };

/**
 * One nested bar per row: the washed bar is everyone, the solid blue inside it those who passed
 * the first gate, the green those who passed the second. Sorting by either rate ranks quality
 * over volume; hover a row for its full readout.
 */
export function YieldBars({ rows, labels, title, limit = 8, avatars = false, empty = "Nothing to show yet" }: {
  rows: YieldRow[];
  /** Names for total, mid and end, e.g. Applicants, Interviewed, Hired */
  labels: [string, string, string];
  title: string;
  limit?: number;
  avatars?: boolean;
  empty?: string;
}) {
  const [sort, setSort] = useState<"total" | "mid" | "end">("total");
  const [hover, setHover] = useState<string | null>(null);
  const sorted = useMemo(() => {
    const v = (r: YieldRow) => (sort === "total" ? r.total : pctOf(sort === "mid" ? r.mid : r.end, r.total));
    return [...rows].sort((a, b) => v(b) - v(a) || b.total - a.total).slice(0, limit);
  }, [rows, sort, limit]);
  const max = Math.max(1, ...rows.map((r) => r.total));
  const sum = rows.reduce((a, r) => ({ total: a.total + r.total, mid: a.mid + r.mid, end: a.end + r.end }), { total: 0, mid: 0, end: 0 });
  const h = sorted.find((r) => r.key === hover) ?? null;
  const [lt, lm, le] = labels;

  if (rows.length === 0) return <p className="text-adm-base text-mist-600">{empty}</p>;
  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Legend items={[{ label: lt, color: WASH }, { label: lm, color: BAR }, { label: le, color: HIRED }]} />
        <Segmented
          label="Sort by"
          size="sm"
          value={sort}
          onChange={setSort}
          options={[
            { value: "total", label: "Volume" },
            { value: "mid", label: `${lm} rate` },
            { value: "end", label: `${le} rate` },
          ]}
        />
      </div>
      <ol className="grid gap-0.5" onPointerLeave={() => setHover(null)}>
        {sorted.map((r) => {
          const w = (n: number) => (n > 0 ? `max(3px, ${(Math.min(n, r.total) / max) * 100}%)` : "0");
          const body = (
            <>
              <span className="flex min-w-0 items-center gap-2">
                {avatars && <Avatar name={r.label} size="sm" />}
                <span className="truncate text-adm-base font-medium text-navy-900" title={r.label}>{r.label}</span>
              </span>
              <span aria-hidden className="relative h-5">
                <span className="absolute inset-y-0 left-0 rounded-[4px] transition-[width] duration-300" style={{ width: w(r.total), background: WASH }} />
                <span className="absolute inset-y-1 left-0 rounded-[3px] transition-[width] duration-300" style={{ width: w(r.mid), background: BAR }} />
                <span className="absolute inset-y-1 left-0 rounded-[3px] transition-[width] duration-300" style={{ width: w(r.end), background: HIRED }} />
              </span>
              <span className="text-right text-adm-xs tabular-nums text-mist-600">
                <span className="text-adm-base font-semibold text-navy-900">{r.total}</span>
                <span className="ml-3 inline-flex w-12 items-center justify-end gap-1">
                  <span aria-hidden className="size-1.5 rounded-full" style={{ background: BAR }} />
                  {pctOf(r.mid, r.total)}%
                </span>
                <span className={`ml-2 inline-flex w-12 items-center justify-end gap-1 ${r.end ? "font-medium text-status-success" : ""}`}>
                  <span aria-hidden className="size-1.5 rounded-full" style={{ background: HIRED }} />
                  {pctOf(r.end, r.total)}%
                </span>
              </span>
            </>
          );
          const cls = `grid w-full grid-cols-[minmax(6rem,10rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-[background-color,opacity] duration-150 hover:bg-mist-50 focus-visible:outline-2 focus-visible:outline-ocean-600 ${
            hover && hover !== r.key ? "opacity-60" : ""
          }`;
          const ev = { onPointerEnter: () => setHover(r.key), onFocus: () => setHover(r.key), onBlur: () => setHover(null) };
          const aria = `${r.label}: ${r.total} ${lt.toLowerCase()}, ${r.mid} ${lm.toLowerCase()}, ${r.end} ${le.toLowerCase()}`;
          return (
            <li key={r.key}>
              {r.href ? (
                <Link href={r.href} aria-label={aria} className={cls} {...ev}>{body}</Link>
              ) : r.onSelect ? (
                <button type="button" aria-label={aria} onClick={r.onSelect} className={cls} {...ev}>{body}</button>
              ) : (
                <div tabIndex={0} aria-label={aria} className={cls} {...ev}>{body}</div>
              )}
            </li>
          );
        })}
      </ol>
      <Readout>
        {h ? (
          <>
            <B>{h.label}</B> · {h.total} {lt.toLowerCase()} → {h.mid} {lm.toLowerCase()} ({pctOf(h.mid, h.total)}%) → {h.end} {le.toLowerCase()} ({pctOf(h.end, h.total)}%)
          </>
        ) : (
          <>
            All together: <B>{sum.total}</B> {lt.toLowerCase()}, <B>{pctOf(sum.mid, sum.total)}%</B> {lm.toLowerCase()}, <B>{pctOf(sum.end, sum.total)}%</B> {le.toLowerCase()}.
            {rows.length > limit && <> Top {limit} of {rows.length} shown.</>}
          </>
        )}
      </Readout>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Dot strip: a distribution, one dot per record                       */
/* ------------------------------------------------------------------ */

export type StripItem = { key: string; label: string; sub?: string; value: number; href?: string };

/** Every record as a dot on one axis, stacked where they collide, with the median marked. */
export function DotStrip({ items, unit = "days", title, color = HIRED }: { items: StripItem[]; unit?: string; title: string; color?: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const W = useWidth(ref);
  const r = 5;
  const pad = { l: 8, r: 8 };
  const max = niceMax(Math.max(1, ...items.map((i) => i.value)));
  const x = (v: number) => pad.l + (v / max) * (W - pad.l - pad.r);
  // Beeswarm: each dot takes the lowest lane where it clears the dots already placed
  const placed = useMemo(() => {
    const lanes: number[][] = [];
    return [...items]
      .map((it, i) => ({ it, i }))
      .sort((a, b) => a.it.value - b.it.value)
      .map(({ it, i }) => {
        const px = x(it.value);
        let lane = lanes.findIndex((l) => l.every((q) => Math.abs(q - px) >= r * 2 + 1));
        if (lane === -1) lane = lanes.push([]) - 1;
        lanes[lane].push(px);
        return { it, i, px, lane };
      });
  }, [items, W]);
  const lanes = Math.max(1, ...placed.map((p) => p.lane + 1));
  const base = 22 + Math.min(lanes, 4) * (r * 2 + 1);
  const H = base + 22;
  const m = median(items.map((i) => i.value));
  const ticks = axisTicks(max);
  const h = hover !== null ? items[hover] : null;

  return (
    <figure className="grid gap-2">
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`${title}: ${items.length} records${m !== null ? `, median ${m} ${unit}` : ""}`}>
          <line x1={pad.l} x2={W - pad.r} y1={base + 4} y2={base + 4} style={{ stroke: "var(--color-mist-300)" }} />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - 4} textAnchor={t === 0 ? "start" : t === max ? "end" : "middle"} fontSize="11" style={{ fill: "var(--color-mist-600)" }}>
              {t}
              {t === max ? ` ${unit}` : ""}
            </text>
          ))}
          {m !== null && (
            <g>
              <line x1={x(m)} x2={x(m)} y1={14} y2={base + 4} strokeDasharray="3 3" style={{ stroke: "var(--color-mist-500)" }} />
              <text x={x(m)} y={10} textAnchor={x(m) > W - 60 ? "end" : x(m) < 60 ? "start" : "middle"} fontSize="11" fontWeight="600" style={{ fill: "var(--color-mist-700)" }}>
                median {m} {unit}
              </text>
            </g>
          )}
          {placed.map(({ it, i, px, lane }) => (
            <circle
              key={it.key}
              cx={px}
              cy={base - r - Math.min(lane, 3) * (r * 2 + 1)}
              r={hover === i ? r + 1.5 : r}
              fill={color}
              strokeWidth="1.5"
              opacity={hover === null || hover === i ? 1 : 0.35}
              style={{ stroke: "var(--color-mist-0)" }}
              className="transition-[opacity,r] duration-150"
            />
          ))}
        </svg>
        {placed.map(({ it, i, px, lane }) => {
          const props = {
            onPointerEnter: () => setHover(i),
            onFocus: () => setHover(i),
            onBlur: () => setHover(null),
            "aria-label": `${it.label}${it.sub ? `, ${it.sub}` : ""}: ${it.value} ${unit}`,
            className: "absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ocean-600",
            style: { left: px, top: base - r - Math.min(lane, 3) * (r * 2 + 1) },
          };
          return it.href ? <Link key={it.key} href={it.href} {...props} /> : <span key={it.key} tabIndex={0} role="img" {...props} />;
        })}
      </div>
      <Readout>
        {h ? (
          <>
            <B>{h.label}</B>
            {h.sub && <> · {h.sub}</>} · {h.value} {unit}
          </>
        ) : items.length ? (
          <>
            {items.length} {items.length === 1 ? "record" : "records"}: fastest <B>{Math.min(...items.map((i) => i.value))}</B>, slowest <B>{Math.max(...items.map((i) => i.value))}</B> {unit}. Hover a dot for who.
          </>
        ) : (
          "Nothing in this period."
        )}
      </Readout>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Meter: one share of a whole, with its count                         */
/* ------------------------------------------------------------------ */

export function Meter({ value, of, label, hint, color = HIRED }: { value: number; of: number; label: string; hint: string; color?: string }) {
  const p = pctOf(value, of);
  return (
    <div className="grid content-start gap-2">
      <p className="text-adm-xs text-mist-600">{label}</p>
      <p className="flex items-baseline gap-2">
        <span className="text-adm-xl font-semibold leading-none tracking-tight text-navy-900">{of ? `${p}%` : "—"}</span>
        <span className="text-adm-xs text-mist-600">{of ? `${value} of ${of} ${hint}` : `no ${hint} yet`}</span>
      </p>
      <span role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={p} className="block h-2 overflow-hidden rounded-full bg-mist-100">
        <span className="block h-full rounded-full transition-[width] duration-500" style={{ width: `${p}%`, background: color }} />
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Composition bar: the parts of one whole                             */
/* ------------------------------------------------------------------ */

/** light: a pale fill that takes dark ink for its count */
export type Part = { key: string; label: string; value: number; color: string; light?: boolean; href?: string };
const share = (n: number, d: number) => (n && pctOf(n, d) === 0 ? "<1%" : `${pctOf(n, d)}%`);

export function CompositionBar({ parts, title, unit = "" }: { parts: Part[]; title: string; unit?: string }) {
  const [hover, setHover] = useState<string | null>(null);
  const total = parts.reduce((n, p) => n + p.value, 0);
  const live = parts.filter((p) => p.value > 0);
  const h = live.find((p) => p.key === hover);
  if (!total) return <p className="text-adm-base text-mist-600">Nothing to show yet</p>;
  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex h-9 gap-[2px]" onPointerLeave={() => setHover(null)}>
        {live.map((p) => {
          const props = {
            onPointerEnter: () => setHover(p.key),
            onFocus: () => setHover(p.key),
            onBlur: () => setHover(null),
            "aria-label": `${p.label}: ${p.value}${unit}, ${share(p.value, total)}`,
            className: `flex min-w-[3px] items-center overflow-hidden rounded-[4px] px-2 text-adm-xs font-semibold outline-none ${p.light ? "text-navy-900" : "text-white"} transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-ocean-600 focus-visible:ring-offset-1`,
            style: { flex: `${p.value} 1 0`, background: p.color, opacity: hover && hover !== p.key ? 0.4 : 1 },
          };
          const inner = p.value / total > 0.05 ? <span className="truncate tabular-nums">{p.value}</span> : null;
          return p.href ? <Link key={p.key} href={p.href} {...props}>{inner}</Link> : <span key={p.key} tabIndex={0} {...props}>{inner}</span>;
        })}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-adm-xs text-mist-600">
        {live.map((p) => (
          <li key={p.key} className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-[3px]" style={{ background: p.color }} />
            {p.label}
            <span className="font-semibold tabular-nums text-navy-900">{p.value}</span>
            <span>({share(p.value, total)})</span>
          </li>
        ))}
      </ul>
      <Readout>
        {h ? (
          <>
            <B>{h.label}</B> · {h.value}
            {unit} · {share(h.value, total)} of {total}
            {h.href && <> · select to open the list</>}
          </>
        ) : (
          <>
            <B>{total}</B> in all; the largest share is <B>{[...live].sort((a, b) => b.value - a.value)[0].label.toLowerCase()}</B>.
          </>
        )}
      </Readout>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Rhythm heatmap: weekday by time of day                              */
/* ------------------------------------------------------------------ */

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BANDS = ["12a", "3a", "6a", "9a", "12p", "3p", "6p", "9p"];
const BAND_LONG = ["midnight–3am", "3–6am", "6–9am", "9am–noon", "noon–3pm", "3–6pm", "6–9pm", "9pm–midnight"];

/** When things arrive: a 7 × 8 grid of three-hour bands in the viewer's time, one hue light to dark. */
export function RhythmHeatmap({ times, title, noun = "applications" }: { times: number[]; title: string; noun?: string }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const grid = useMemo(() => {
    const g = DAYS.map(() => BANDS.map(() => 0));
    for (const t of times) {
      const d = new Date(t);
      g[(d.getDay() + 6) % 7][Math.floor(d.getHours() / 3)]++;
    }
    return g;
  }, [times]);
  const max = Math.max(1, ...grid.flat());
  const dayTotals = grid.map((r) => r.reduce((a, b) => a + b, 0));
  const dayMax = Math.max(1, ...dayTotals);
  let peak: [number, number] = [0, 0];
  grid.forEach((r, di) => r.forEach((v, bi) => v > grid[peak[0]][peak[1]] && (peak = [di, bi])));
  const shade = (v: number) => (v ? `color-mix(in srgb, ${BAR} ${Math.round(14 + 86 * (v / max))}%, transparent)` : "var(--color-mist-100)");
  const h = hover ?? null;

  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">{title}</figcaption>
      <div className="overflow-x-auto">
        <div role="grid" aria-label={title} className="grid min-w-[26rem] grid-cols-[2.5rem_repeat(8,minmax(0,1fr))_5rem] gap-[3px] text-adm-xs" onPointerLeave={() => setHover(null)}>
          <span />
          {BANDS.map((b) => (
            <span key={b} className="pb-1 text-mist-600">{b}</span>
          ))}
          <span className="pb-1 pl-2 text-mist-600">Day total</span>
          {DAYS.map((d, di) => (
            <div key={d} role="row" className="contents">
              <span className="self-center font-medium text-mist-600">{d}</span>
              {BANDS.map((b, bi) => {
                const v = grid[di][bi];
                const on = h?.[0] === di && h?.[1] === bi;
                return (
                  <span
                    key={b}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`${d} ${BAND_LONG[bi]}: ${v} ${noun}`}
                    onPointerEnter={() => setHover([di, bi])}
                    onFocus={() => setHover([di, bi])}
                    onBlur={() => setHover(null)}
                    className={`h-7 rounded-[4px] outline-none transition-shadow duration-150 ${on ? "ring-2 ring-navy-900" : ""} focus-visible:ring-2 focus-visible:ring-ocean-600`}
                    style={{ background: shade(v) }}
                  />
                );
              })}
              <span className="flex items-center gap-1.5 pl-2">
                <span className="h-1.5 rounded-full" style={{ width: `${(dayTotals[di] / dayMax) * 2.5}rem`, background: BAR }} />
                <span className="tabular-nums text-navy-900">{dayTotals[di]}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-adm-xs text-mist-600">
        <span>Fewer</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <span key={t} className="size-3 rounded-[3px]" style={{ background: t ? shade(t * max) : "var(--color-mist-100)" }} />
        ))}
        <span>More</span>
      </div>
      <Readout>
        {h ? (
          <>
            <B>{DAYS[h[0]]}, {BAND_LONG[h[1]]}</B> · {grid[h[0]][h[1]]} {noun}
          </>
        ) : times.length ? (
          <>
            Busiest window: <B>{DAYS[peak[0]]}, {BAND_LONG[peak[1]]}</B> with {grid[peak[0]][peak[1]]} {noun}; busiest day <B>{DAYS[dayTotals.indexOf(dayMax)]}</B>. Times are yours.
          </>
        ) : (
          `No ${noun} in this period.`
        )}
      </Readout>
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* Quadrant scatter: volume against conversion                         */
/* ------------------------------------------------------------------ */

export type ScatterPoint = { key: string; label: string; x: number; y: number; onSelect?: () => void };

/**
 * Each person as a dot: across, how much they move; up, how much of it converts. Dashed lines at
 * the team medians split it into four quadrants, so "busy but leaky" and "few but precise" read
 * at a glance. The biggest five carry their names; hover any dot for the rest.
 */
export function QuadrantScatter({ points, xLabel, yLabel, title, height = 260 }: { points: ScatterPoint[]; xLabel: string; yLabel: string; title: string; height?: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const W = useWidth(ref);
  const H = height;
  const pad = { l: 44, r: 16, t: 30, b: 34 };
  const xMax = niceMax(Math.max(1, ...points.map((p) => p.x)));
  const yTop = Math.max(...points.map((p) => p.y), 0) > 0.5 ? 1 : niceMax(Math.max(0.05, ...points.map((p) => p.y)) * 100) / 100;
  const x = (v: number) => pad.l + (v / xMax) * (W - pad.l - pad.r);
  const y = (v: number) => pad.t + (1 - v / yTop) * (H - pad.t - pad.b);
  const xTicks = axisTicks(xMax);
  const mx = median(points.map((p) => p.x)) ?? 0;
  const my = median(points.map((p) => p.y)) ?? 0;
  const named = new Set([...points].sort((a, b) => b.x - a.x).slice(0, 5).map((p) => p.key));
  const h = points.find((p) => p.key === hover);
  const quad = (p: ScatterPoint) => `${p.x >= mx ? "more" : "less"} ${xLabel.toLowerCase()} than the median, ${p.y >= my ? "converting better" : "converting less"}`;

  if (points.length === 0) return <p className="text-adm-base text-mist-600">Nobody to compare yet.</p>;
  return (
    <figure className="grid gap-3">
      <figcaption className="sr-only">{title}</figcaption>
      <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={title}>
          {/* The better quadrant, tinted */}
          <rect x={x(mx)} y={pad.t} width={W - pad.r - x(mx)} height={y(my) - pad.t} fill={HIRED} opacity="0.06" />
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t * yTop)} y2={y(t * yTop)} style={{ stroke: "var(--color-mist-200)" }} />
              <text x={pad.l - 8} y={y(t * yTop) + 4} textAnchor="end" fontSize="11" style={{ fill: "var(--color-mist-600)" }}>
                {Math.round(t * yTop * 100)}%
              </text>
            </g>
          ))}
          {xTicks.map((v) => (
            <text key={v} x={x(v)} y={H - pad.b + 16} textAnchor="middle" fontSize="11" style={{ fill: "var(--color-mist-600)" }}>
              {v}
            </text>
          ))}
          <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="11" fontWeight="600" style={{ fill: "var(--color-mist-700)" }}>
            {xLabel} →
          </text>
          <text x={pad.l - 36} y={12} fontSize="11" fontWeight="600" style={{ fill: "var(--color-mist-700)" }}>
            ↑ {yLabel}
          </text>
          <line x1={x(mx)} x2={x(mx)} y1={pad.t} y2={H - pad.b} strokeDasharray="4 4" style={{ stroke: "var(--color-mist-400)" }} />
          <line x1={pad.l} x2={W - pad.r} y1={y(my)} y2={y(my)} strokeDasharray="4 4" style={{ stroke: "var(--color-mist-400)" }} />
          {points.map((p) => {
            const on = hover === p.key;
            const right = x(p.x) < W - 90;
            return (
              <g key={p.key} opacity={hover === null || on ? 1 : 0.35} className="transition-opacity duration-150">
                <circle cx={x(p.x)} cy={y(p.y)} r={on ? 7.5 : 6} fill={BAR} strokeWidth="2" style={{ stroke: "var(--color-mist-0)" }} />
                {(named.has(p.key) || on) && (
                  <text x={x(p.x) + (right ? 10 : -10)} y={y(p.y) + 4} textAnchor={right ? "start" : "end"} fontSize="11" fontWeight={on ? 600 : 500} style={{ fill: "var(--color-navy-900)" }}>
                    {p.label.split(" ")[0]}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        {points.map((p) => {
          const props = {
            onPointerEnter: () => setHover(p.key),
            onFocus: () => setHover(p.key),
            onBlur: () => setHover(null),
            "aria-label": `${p.label}: ${p.x} ${xLabel.toLowerCase()}, ${Math.round(p.y * 100)}% ${yLabel.toLowerCase()}`,
            className: "absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ocean-600",
            style: { left: x(p.x), top: y(p.y) },
          };
          return p.onSelect ? <button key={p.key} type="button" onClick={p.onSelect} {...props} /> : <span key={p.key} tabIndex={0} role="img" {...props} />;
        })}
      </div>
      <Readout>
        {h ? (
          <>
            <B>{h.label}</B> · {h.x} {xLabel.toLowerCase()} · {Math.round(h.y * 100)}% {yLabel.toLowerCase()} · {quad(h)}
          </>
        ) : (
          <>
            Dashed lines are the team medians: <B>{Math.round(mx)}</B> {xLabel.toLowerCase()}, <B>{Math.round(my * 100)}%</B> {yLabel.toLowerCase()}. Top right, tinted green, is high volume that converts.
          </>
        )}
      </Readout>
    </figure>
  );
}
