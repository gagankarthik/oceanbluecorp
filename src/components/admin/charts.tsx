"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { CHART_COLORS } from "./theme";
import { cn } from "@/lib/utils";

/* Admin chart kit: segmented period control, donut (composition, ≤5 parts
   plus an explicit "Other"), and the stage funnel. Hand-drawn SVG, no chart
   library, so the dashboard ships no charting runtime. Categorical hues come
   from CHART_COLORS in order. */

/**
 * Period selector for a time-series panel. Segmented rather than a dropdown:
 * the options are few, mutually exclusive, and worth seeing without a click.
 */
export function PeriodSwitcher<P extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: readonly { value: P; label: string }[];
  value: P;
  onChange: (v: P) => void;
  /** Accessible name for the group. */
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex h-9 flex-none items-center gap-0.5 rounded-[9px] border border-[var(--adm-line)] bg-[var(--adm-seg-track)] p-0.5",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={cn(
            "flex h-full items-center whitespace-nowrap rounded-[7px] px-2.5 text-[12.5px] font-medium transition-colors",
            value === o.value
              ? "bg-[var(--adm-seg-active)] text-[var(--adm-ink)] shadow-[0_1px_2px_rgba(15,23,42,0.08),0_0_0_1px_var(--adm-line)]"
              : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
          )}
        >
          {o.label}
        </button>
      ))}
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
          <span className="text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--adm-ink)]">
            {(active ? active.value : total).toLocaleString()}
          </span>
          <span className="mt-1 max-w-[7rem] truncate text-[12px] text-[var(--adm-ink-subtle)]">
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
              <span className="truncate text-[12.5px] text-[var(--adm-ink-mute)]">{seg.label}</span>
              <span className="ml-auto text-[12.5px] font-semibold tabular-nums text-[var(--adm-ink)]">{seg.value}</span>
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
 * Sequential stage drop-off, with the step-to-step conversion labelled between
 * bands. Feed cohort counts, not occupancy. The hovered band zooms forward and
 * its siblings recede, so the eye lands on one stage at a time.
 */
// Light to deep cobalt; every step keeps white labels at 4.6:1 or better.
const FUNNEL_RAMP = ["#2f6fe8", "#2563eb", "#2158d8", "#1d4ed8", "#1b47c4", "#1e40af"];
const FUNNEL_FLOOR = 32; // keeps a near-zero stage wide enough to read its label

export function FunnelChart({ stages, className }: { stages: FunnelStage[]; className?: string }) {
  if (stages.length === 0) return null;
  const head = stages[0].value || 1;

  return (
    <div className={cn("px-5 py-4", className)}>
      <div className="space-y-1">
        {stages.map((st, i) => {
          const w = Math.max((st.value / head) * 100, FUNNEL_FLOOR);
          const next = i < stages.length - 1 ? Math.max((stages[i + 1].value / head) * 100, FUNNEL_FLOOR) : w * 0.84;
          const clip = `polygon(${(100 - w) / 2}% 0, ${(100 + w) / 2}% 0, ${(100 + next) / 2}% 100%, ${(100 - next) / 2}% 100%)`;
          const prev = i > 0 ? stages[i - 1].value : null;
          const conv = prev && prev > 0 ? Math.round((st.value / prev) * 100) : null;
          const interactive = !!st.onClick;

          return (
            <div key={st.label} className="group/band relative">
              {i > 0 && (
                <div className="pointer-events-none relative z-20 -my-1 flex justify-center">
                  <span
                    className={cn(
                      "rounded-full bg-[var(--adm-surface)] px-1.5 py-px text-[11px] font-semibold tabular-nums text-[var(--adm-ink-mute)] ring-1 ring-[var(--adm-line)]",
                      "transition-colors duration-200",
                      interactive && "group-hover/band:bg-[var(--adm-accent)] group-hover/band:text-white group-hover/band:ring-[var(--adm-accent)]",
                    )}
                  >
                    {conv !== null ? `${conv}%` : "–"}
                  </span>
                </div>
              )}
              {/* The shadow lives on this wrapper: a filter on the clipped button would be clipped with it. */}
              <div
                className={cn(
                  "relative origin-center transition-[transform,filter] duration-200 ease-[var(--adm-ease)]",
                  interactive &&
                    "group-hover/band:z-10 group-hover/band:scale-[1.025] group-hover/band:[filter:drop-shadow(0_6px_12px_rgba(29,78,216,0.28))] group-has-[:focus-visible]/band:z-10 group-has-[:focus-visible]/band:scale-[1.025]",
                )}
              >
                <button
                  type="button"
                  onClick={st.onClick}
                  disabled={!interactive}
                  title={interactive ? `View ${st.label.toLowerCase()}` : undefined}
                  aria-label={`${st.label}: ${st.value.toLocaleString()}${conv !== null ? `, ${conv}% from the previous stage` : ""}`}
                  className={cn(
                    "flex h-11 w-full items-center justify-center gap-2 leading-none text-white transition-[filter] duration-200",
                    interactive ? "cursor-pointer group-hover/band:brightness-[0.9]" : "cursor-default",
                  )}
                  style={{ clipPath: clip, background: FUNNEL_RAMP[Math.min(i, FUNNEL_RAMP.length - 1)] }}
                >
                  <span className="text-[12.5px] font-semibold">{st.label}</span>
                  <span className="text-[14px] font-bold tabular-nums">{st.value.toLocaleString()}</span>
                  {st.meta && (
                    <span className="text-[11.5px] font-medium tabular-nums text-white/80">{st.meta}</span>
                  )}
                  {interactive && (
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 -translate-x-1 opacity-0 transition-[opacity,transform] duration-200 group-hover/band:translate-x-0 group-hover/band:opacity-100"
                    />
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
