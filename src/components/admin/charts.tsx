"use client";

import * as React from "react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { CHART_COLORS, SERIES } from "./theme";
import { cn } from "@/lib/utils";

/* ============================================================================
   Admin chart kit.

   Every analytical panel in the admin console is built from these four forms:
   trend, ranked breakdown, donut, funnel. The point is not to wrap recharts for
   its own sake, it is that axis ink, grid weight, tooltip chrome, empty states,
   and series colour were being re-decided on every screen, so no two charts read
   as the same instrument.

   Rules baked in here, so call sites cannot drift:
     · one y-axis, never two, a second measure gets its own panel
     · categorical hue assigned in fixed order from CHART_COLORS, never cycled;
       past five categories the caller folds the tail into an explicit "Other"
       bucket coloured with theme.ts's CHART_NEUTRAL
     · grid and axes are recessive (hairline #eef2f7, 10px slate-400 ticks)
     · ≥2 series always carry a legend, and bar/donut marks are directly
       labelled, this is the secondary encoding that licenses the palette's
       protan ΔE 7.8 pair (see CHART_COLORS in theme.ts)
     · 2px surface gap between adjacent fills, 4px rounded data-ends
     · a hover tooltip is present on every plotted form
   ========================================================================== */

// ── shared chrome ────────────────────────────────────────────────────────────

// Theme-driven: ticks, gridlines and the tooltip surface all read the admin
// tokens, so charts recolour with the light/dark toggle without any JS. CSS
// custom properties resolve inside SVG fill/stroke and inline styles alike.
const AXIS_TICK = { fontSize: 11, fill: "var(--adm-ink-subtle)" } as const;
const GRID_STROKE = "var(--adm-line)";

const TOOLTIP_STYLE: React.CSSProperties = {
  background: "var(--adm-surface)",
  border: "1px solid var(--adm-line)",
  borderRadius: 6,
  fontSize: 12,
  padding: "8px 10px",
  color: "var(--adm-ink)",
  boxShadow: "var(--adm-shadow-md)",
};

/** Series descriptor shared by the multi-series forms. */
export interface ChartSeries {
  key: string;
  label: string;
  /** Defaults to the categorical slot at this series' index. */
  color?: string;
}

function seriesColor(s: ChartSeries, i: number) {
  return s.color ?? CHART_COLORS[i % CHART_COLORS.length];
}

/**
 * Legend for a plotted panel. Always rendered at two or more series; omitted
 * at one, where the panel title already names the measure.
 */
function Legend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-[var(--adm-line-soft)] px-5 py-2.5">
      {series.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--adm-ink-mute)]">
          <span
            aria-hidden
            className="h-2.5 w-2.5 flex-none rounded-[2px]"
            style={{ background: seriesColor(s, i) }}
          />
          {s.label}
        </span>
      ))}
    </div>
  );
}

/** Nothing-to-plot state. Holds the panel's height so the grid doesn't jump. */
function NoData({ height, message = "No data for this period" }: { height: number; message?: string }) {
  return (
    <div
      className="flex items-center justify-center text-[13px] text-[var(--adm-ink-subtle)]"
      style={{ height }}
      role="status"
    >
      {message}
    </div>
  );
}

// ── panel shell ──────────────────────────────────────────────────────────────

/**
 * The frame every chart sits in: title band with optional right-hand control
 * (a period switcher, a "view all" link), an optional headline figure, and the
 * plot. Using one shell means a row of panels lines up on the title baseline
 * and on the plot's top edge regardless of which form is inside.
 */
export function ChartPanel({
  title,
  subtitle,
  icon: Icon,
  action,
  figure,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  action?: React.ReactNode;
  /** Headline value for the panel, shown large above the plot. */
  figure?: { value: string | number; caption?: string };
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("flex flex-col rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)]", className)}>
      <div className="flex items-start justify-between gap-3 border-b border-[var(--adm-line)] px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2">
          {Icon && <Icon className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />}
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">{title}</h3>
            {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex flex-none items-center gap-1">{action}</div>}
      </div>
      {figure && (
        <div className="flex items-baseline gap-2 px-5 pt-4">
          <span className="text-[28px] font-bold leading-none tracking-tight tabular-nums text-[var(--adm-ink)]">
            {figure.value}
          </span>
          {figure.caption && <span className="text-[12.5px] text-[var(--adm-ink-subtle)]">{figure.caption}</span>}
        </div>
      )}
      <div className={cn("flex-1", bodyClassName)}>{children}</div>
    </div>
  );
}

/**
 * Period selector for a time-series panel. Segmented rather than a dropdown:
 * the options are few, mutually exclusive, and worth seeing without a click.
 */
export function PeriodSwitcher<P extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: P; label: string }[];
  value: P;
  onChange: (v: P) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 rounded-[8px] bg-[var(--adm-seg-track)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            // h-8 so the segments clear a comfortable target; they were
            // 26px, which on a control people toggle constantly is a miss
            // waiting to happen.
            "flex h-8 items-center rounded-[6px] px-3 text-[13px] font-semibold transition-colors",
            value === o.value
              ? "bg-[var(--adm-seg-active)] text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
              : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ── trend ────────────────────────────────────────────────────────────────────

/**
 * Change over time, as a filled area. Fills are held at 0.18 alpha so two
 * overlapping series stay separately readable without needing a line variant.
 */
export function TrendChart<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  height = 220,
  xTickFormatter,
  labelFormatter,
  emptyMessage,
}: {
  data: T[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  xTickFormatter?: (v: string) => string;
  labelFormatter?: (v: string) => string;
  emptyMessage?: string;
}) {
  const gradientId = React.useId();
  const hasData = data.length > 0 && data.some((d) => series.some((s) => Number(d[s.key]) > 0));

  if (!hasData) {
    return (
      <>
        <NoData height={height} message={emptyMessage} />
        <Legend series={series} />
      </>
    );
  }

  return (
    <>
      <div className="px-2 pt-4" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 12, left: -10, bottom: 0 }}>
            <defs>
              {series.map((s, i) => (
                <linearGradient key={s.key} id={`${gradientId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor(s, i)} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={seriesColor(s, i)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tick={AXIS_TICK}
              tickFormatter={xTickFormatter}
            />
            <YAxis tickLine={false} axisLine={false} tickMargin={4} tick={AXIS_TICK} allowDecimals={false} width={36} />
            <Tooltip
              cursor={{ stroke: SERIES.primary, strokeWidth: 1, strokeDasharray: "4 4" }}
              contentStyle={TOOLTIP_STYLE}
              labelFormatter={labelFormatter}
            />
            {series.map((s, i) => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={seriesColor(s, i)}
                fill={`url(#${gradientId}-${s.key})`}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <Legend series={series} />
    </>
  );
}

// ── ranked breakdown ─────────────────────────────────────────────────────────

export interface BreakdownItem {
  label: string;
  value: number;
  /** Optional override; defaults to the categorical slot at this index. */
  color?: string;
  onClick?: () => void;
  /** Secondary figure shown right of the value, e.g. a conversion rate. */
  meta?: string;
}

/**
 * Ranked horizontal bars, the workhorse for "top N by count" and for source
 * or department breakdowns. Preferred over a pie for ranking, and over a
 * vertical bar chart whenever the labels are prose.
 *
 * Every row is directly labelled with its value, which is the secondary
 * encoding the palette requires, and makes the panel readable in greyscale.
 */
export function BreakdownBars({
  items,
  total,
  showPercent = true,
  max: maxProp,
  emptyMessage = "Nothing to break down yet",
  className,
}: {
  items: BreakdownItem[];
  /** Denominator for the percentages; defaults to the sum of values. */
  total?: number;
  showPercent?: boolean;
  /** Bar-scale denominator; defaults to the largest value. */
  max?: number;
  emptyMessage?: string;
  className?: string;
}) {
  if (items.length === 0) {
    return <div className="px-5 py-10 text-center text-[13px] text-[var(--adm-ink-subtle)]">{emptyMessage}</div>;
  }

  const sum = total ?? items.reduce((s, it) => s + it.value, 0);
  const max = maxProp ?? Math.max(...items.map((it) => it.value), 1);

  return (
    <div className={cn("space-y-3 px-5 py-4", className)}>
      {items.map((it, i) => {
        const color = it.color ?? CHART_COLORS[i % CHART_COLORS.length];
        const pct = sum > 0 ? (it.value / sum) * 100 : 0;
        const width = max > 0 ? Math.max((it.value / max) * 100, it.value > 0 ? 2 : 0) : 0;
        const Row = (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: color }} />
                <span className="truncate text-[13px] font-medium text-[var(--adm-ink-mute)]">{it.label}</span>
              </span>
              <span className="flex flex-none items-baseline gap-1.5">
                {it.meta && <span className="text-[11.5px] text-[var(--adm-ink-subtle)]">{it.meta}</span>}
                <span className="text-[13px] font-bold tabular-nums text-[var(--adm-ink)]">
                  {it.value.toLocaleString()}
                </span>
                {showPercent && (
                  <span className="w-9 text-right text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                    {pct.toFixed(0)}%
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-[3px] bg-[var(--adm-line-soft)]">
              <div className="h-full rounded-[3px]" style={{ width: `${width}%`, background: color }} />
            </div>
          </>
        );

        if (it.onClick) {
          return (
            <button
              key={it.label}
              type="button"
              onClick={it.onClick}
              className="block w-full rounded-[4px] text-left transition-colors hover:bg-[var(--adm-accent-tint)]"
            >
              {Row}
            </button>
          );
        }
        return <div key={it.label}>{Row}</div>;
      })}
    </div>
  );
}

// ── donut ────────────────────────────────────────────────────────────────────

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
  onClick?: () => void;
}

/**
 * Part-to-whole for a small number of segments. Hand-drawn SVG rather than
 * recharts' Pie so the segments can carry a 2px surface gap and the centre can
 * hold a live readout on hover, both of which the recharts Pie fights.
 *
 * A donut is only correct when the segments are parts of one meaningful total
 * and there are ≲6 of them; for a ranking, use BreakdownBars.
 */
export function DonutChart({
  segments,
  size = 168,
  thickness = 22,
  centerCaption = "total",
  className,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerCaption?: string;
  className?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = segments.filter((s) => s.value > 0);
  const total = shown.reduce((s, g) => s + g.value, 0);

  const cx = size / 2;
  const cy = size / 2;
  const r = (size - thickness) / 2 - 2;

  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // 2px surface gap between adjacent fills, expressed as the arc-degrees that
  // 2px subtends at this radius, so the gap stays 2px at any panel size.
  const gapDeg = total > 0 && shown.length > 1 ? (2 / (2 * Math.PI * r)) * 360 : 0;

  const active = hover !== null ? shown[hover] : null;

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div className="relative inline-flex" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={`Distribution across ${shown.length} categories`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--adm-line-soft)" strokeWidth={thickness} />
          {(() => {
            let cum = 0;
            return shown.map((seg, i) => {
              const deg = (seg.value / total) * 360;
              const s = polar(cum + gapDeg / 2);
              const e = polar(cum + deg - gapDeg / 2);
              const large = deg > 180 ? 1 : 0;
              cum += deg;
              const color = seg.color ?? CHART_COLORS[i % CHART_COLORS.length];
              return (
                <path
                  key={seg.label}
                  d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`}
                  fill="none"
                  stroke={color}
                  strokeWidth={hover === i ? thickness + 4 : thickness}
                  strokeLinecap="butt"
                  style={{ transition: "stroke-width 150ms var(--adm-ease)", cursor: seg.onClick ? "pointer" : "default" }}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onClick={seg.onClick}
                />
              );
            });
          })()}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[28px] font-bold leading-none tabular-nums text-[var(--adm-ink)]">
            {(active ? active.value : total).toLocaleString()}
          </span>
          <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--adm-ink-subtle)]">
            {active ? active.label : centerCaption}
          </span>
        </div>
      </div>

      {/* Legend doubles as the value table, identity is never colour-alone. */}
      <div className="grid w-full grid-cols-2 gap-x-4 gap-y-0.5">
        {shown.map((seg, i) => {
          const color = seg.color ?? CHART_COLORS[i % CHART_COLORS.length];
          const Inner = (
            <>
              <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: color }} />
              <span className="truncate text-[12px] font-medium text-[var(--adm-ink-mute)]">{seg.label}</span>
              <span className="ml-auto text-[12px] font-bold tabular-nums text-[var(--adm-ink)]">{seg.value}</span>
            </>
          );
          return seg.onClick ? (
            <button
              key={seg.label}
              type="button"
              onClick={seg.onClick}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="flex items-center gap-1.5 rounded-[4px] px-1.5 py-1 text-left transition-colors hover:bg-[var(--adm-accent-tint)]"
            >
              {Inner}
            </button>
          ) : (
            <div key={seg.label} className="flex items-center gap-1.5 px-1.5 py-1">
              {Inner}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── stage funnel ─────────────────────────────────────────────────────────────

export interface FunnelStage {
  label: string;
  /**
   * Use a COHORT count ("how many ever got at least this far"), not current
   * occupancy. The chart derives each conversion badge from value/previous, so
   * feeding it occupancy produces nonsense, a stage that has emptied out
   * reads as a collapse, and a stage people were moved into directly can
   * exceed 100%.
   */
  value: number;
  /** Small trailing annotation on the bar, e.g. "4d median". */
  meta?: string;
  onClick?: () => void;
}

/**
 * Sequential stage drop-off. Unlike a bar chart this encodes the *conversion*
 * between neighbouring stages, which is the number a recruiter actually acts
 * on, so the step-to-step percentage is labelled between the bands.
 *
 * Colour here is a sequential cobalt ramp, not categorical: the stages are one
 * ordered measure, not five independent identities.
 */
export function FunnelChart({ stages, className }: { stages: FunnelStage[]; className?: string }) {
  if (stages.length === 0) return null;
  const head = stages[0].value || 1;
  const FLOOR = 32; // keeps a near-zero stage wide enough to read its label

  // Sequential ramp, light → dark, one hue.
  const ramp = ["#93b4fb", "#6d97f7", "#4a7bef", "#2f62e0", "#1d4ed8", "#1a3fae"];

  return (
    <div className={cn("px-5 py-4", className)}>
      <div className="space-y-1">
        {stages.map((st, i) => {
          const w = Math.max((st.value / head) * 100, FLOOR);
          const next = i < stages.length - 1 ? Math.max((stages[i + 1].value / head) * 100, FLOOR) : w * 0.84;
          const clip = `polygon(${(100 - w) / 2}% 0, ${(100 + w) / 2}% 0, ${(100 + next) / 2}% 100%, ${(100 - next) / 2}% 100%)`;
          const prev = i > 0 ? stages[i - 1].value : null;
          const conv = prev && prev > 0 ? Math.round((st.value / prev) * 100) : null;
          const color = ramp[Math.min(i, ramp.length - 1)];

          return (
            <div key={st.label}>
              {i > 0 && (
                <div className="relative z-10 -my-1 flex justify-center">
                  <span className="rounded-full bg-[var(--adm-surface)] px-1.5 py-px text-[10px] font-bold tabular-nums text-[var(--adm-ink-mute)] ring-1 ring-[var(--adm-line)]">
                    {conv !== null ? `${conv}%` : "–"}
                  </span>
                </div>
              )}
              <button
                type="button"
                onClick={st.onClick}
                disabled={!st.onClick}
                title={st.onClick ? `View ${st.label.toLowerCase()}` : undefined}
                className={cn(
                  "flex h-[52px] w-full items-center justify-center gap-2 text-white transition-[filter] leading-none",
                  st.onClick && "hover:brightness-110",
                )}
                style={{ clipPath: clip, background: color }}
              >
                <span className="text-[12px] font-semibold">{st.label}</span>
                <span className="text-[14px] font-bold tabular-nums">{st.value.toLocaleString()}</span>
                {/* Optional trailing fact (e.g. median age). Kept translucent
                    so it reads as an annotation on the bar, not a second
                    figure competing with the count. */}
                {st.meta && (
                  <span className="text-[11.5px] font-medium tabular-nums text-white/75">{st.meta}</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
