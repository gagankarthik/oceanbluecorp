"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { cn } from "@/lib/utils";

/** Sequential blue ramp, ordered stages of one process. */
export const STAGE_RAMP = ["#60a5fa", "#4b91f7", "#3b82f6", "#2f6fed", "#2563eb"];

export type BarItem = {
  label: string;
  value: number;
  color?: string;
  meta?: string;
  onClick?: () => void;
};

const linkCls =
  "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-1 text-[12.5px] font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]";

export function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={linkCls}>
      {children}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

/** Ranked horizontal bars, value-labelled so they read without colour. */
export function RankedBars({ items, emptyMessage }: { items: BarItem[]; emptyMessage: string }) {
  if (items.length === 0) return <EmptyState size="sm" title={emptyMessage} description="" />;
  const max = Math.max(...items.map((it) => it.value), 1);
  return (
    <ul className="space-y-0.5 px-2 py-2">
      {items.map((it, i) => {
        const color = it.color ?? STAGE_RAMP[i % STAGE_RAMP.length];
        const width = Math.max((it.value / max) * 100, it.value > 0 ? 2 : 0);
        const row = (
          <>
            <span className="flex items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[13px] text-[var(--adm-ink)]">{it.label}</span>
              <span className="flex flex-none items-baseline gap-2">
                {it.meta && <span className="hidden max-w-[10rem] truncate text-[12px] text-[var(--adm-ink-subtle)] sm:inline">{it.meta}</span>}
                <span className="w-8 text-right text-[13px] font-semibold tabular-nums text-[var(--adm-ink)]">{it.value.toLocaleString()}</span>
              </span>
            </span>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--adm-surface-2)]">
              <span className="block h-full rounded-full" style={{ width: `${width}%`, background: color }} />
            </span>
          </>
        );
        return (
          <li key={it.label}>
            {it.onClick ? (
              <button type="button" onClick={it.onClick}
                className="block w-full rounded-[8px] px-2 py-2 text-left transition-colors hover:bg-[var(--adm-row-hover)]">
                {row}
              </button>
            ) : (
              <div className="px-2 py-2">{row}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Line chart with a hover readout. The SVG stretches on x, so markers and the
 * tooltip are positioned HTML on top where circles stay circular.
 */
export function LineChart({
  data, dataKey, xKey, xFmt, color = "var(--adm-data)", height = 130, dataKey2, color2 = "var(--adm-danger)",
  label, label2,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  xFmt: (v: string) => string;
  color?: string;
  height?: number;
  dataKey2?: string;
  color2?: string;
  label?: string;
  label2?: string;
}): React.ReactElement {
  const [active, setActive] = useState<number | null>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const vals = data.map((d) => Number(d[dataKey]) || 0);
  const vals2 = dataKey2 ? data.map((d) => Number(d[dataKey2]) || 0) : [];
  const hasData = data.length > 1 && (vals.some((v) => v > 0) || vals2.some((v) => v > 0));

  if (!hasData) {
    return (
      <div style={{ height }}
        className="flex items-center justify-center rounded-[8px] border border-dashed border-[var(--adm-line)] text-[12.5px] text-[var(--adm-ink-subtle)]">
        No data in this period
      </div>
    );
  }

  const W = 600, H = 100, padT = 8, padB = 4;
  const innerH = H - padT - padB;
  const max = Math.max(...vals, ...vals2, 1);
  const n = vals.length;
  const X = (i: number) => (n === 1 ? W / 2 : (i * W) / (n - 1));
  const Y = (v: number) => padT + innerH * (1 - v / max);
  const line = vals.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const line2 = vals2.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${W} ${H - padB} L 0 ${H - padB} Z`;
  const gy = [0, 0.5, 1].map((t) => padT + innerH * t);
  const ticks = [0, Math.floor((n - 1) / 2), n - 1];
  const gid = `ln-${dataKey}`;

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = plotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0) return;
    const frac = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    setActive(Math.round(frac * (n - 1)));
  };

  const pctX = (i: number) => (n === 1 ? 50 : (i / (n - 1)) * 100);
  const topPx = (v: number) => (Y(v) / H) * height;
  const point = active !== null ? data[active] : null;

  return (
    <div>
      <div ref={plotRef} className="relative" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-hidden="true">
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.14} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          {gy.map((y, i) => (
            <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="var(--adm-line-soft)"
              strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} fill={`url(#${gid})`} />
          {dataKey2 && line2 && (
            <path d={line2} fill="none" stroke={color2} strokeWidth={1.5} strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          )}
          <path d={line} fill="none" stroke={color} strokeWidth={1.75}
            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
          {active !== null && (
            <line x1={X(active)} y1={padT} x2={X(active)} y2={H - padB}
              stroke="var(--adm-line-strong)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {active !== null && point && (
          <>
            <span aria-hidden
              className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--adm-surface)]"
              style={{ left: `${pctX(active)}%`, top: topPx(vals[active]), background: color }} />
            {dataKey2 && (
              <span aria-hidden
                className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--adm-surface)]"
                style={{ left: `${pctX(active)}%`, top: topPx(vals2[active]), background: color2 }} />
            )}
            <div
              role="status"
              aria-live="polite"
              className={cn(
                "pointer-events-none absolute top-0 z-10 min-w-[8rem] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-2 shadow-[var(--adm-shadow-md)]",
                pctX(active) > 55 ? "-translate-x-[calc(100%+10px)]" : "translate-x-[10px]",
              )}
              style={{ left: `${pctX(active)}%` }}
            >
              <p className="text-[11.5px] text-[var(--adm-ink-subtle)]">{xFmt(String(point[xKey] ?? ""))}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-mute)]">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {label ?? dataKey}
                <span className="ml-auto pl-3 font-semibold tabular-nums text-[var(--adm-ink)]">{vals[active]}</span>
              </p>
              {dataKey2 && (
                <p className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-mute)]">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: color2 }} />
                  {label2 ?? dataKey2}
                  <span className="ml-auto pl-3 font-semibold tabular-nums text-[var(--adm-ink)]">{vals2[active]}</span>
                </p>
              )}
            </div>
          </>
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-[var(--adm-ink-subtle)]">
        {ticks.map((ti, i) => <span key={i}>{xFmt(String(data[ti]?.[xKey] ?? ""))}</span>)}
      </div>
    </div>
  );
}

/** One figure + trend panel. */
/** Change against the previous window of the same length. */
export type Delta = { pct: number; against: string } | null;

export function DeltaChip({ delta }: { delta: Delta }) {
  if (!delta) return null;
  const up = delta.pct > 0;
  const flat = delta.pct === 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      title={`Compared with the ${delta.against}`}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[12px] font-semibold tabular-nums",
        flat
          ? "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]"
          : up
            ? "bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]"
            : "bg-[var(--adm-danger-soft)] text-[var(--adm-danger-ink)]",
      )}
    >
      {!flat && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      {flat ? "No change" : `${Math.abs(delta.pct)}%`}
      <span className="sr-only"> {up ? "up" : "down"} against the {delta.against}</span>
    </span>
  );
}

export function TrendPanel({
  title, value, caption, legend, delta = null, children,
}: {
  title: string;
  value: number;
  caption: React.ReactNode;
  legend?: React.ReactNode;
  delta?: Delta;
  children: React.ReactNode;
}) {
  return (
    <AdminCard className="flex flex-col p-4">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="text-[13px] font-medium text-[var(--adm-ink-mute)]">{title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-[var(--adm-ink)]">
              {value.toLocaleString()}
            </span>
            <DeltaChip delta={delta} />
          </div>
          <p className="mt-1.5 text-[12.5px] text-[var(--adm-ink-subtle)]">{caption}</p>
        </div>
        {legend}
      </div>
      <div className="mt-3 flex-1">{children}</div>
    </AdminCard>
  );
}

export function LegendKey({ color, label, value, dashed }: { color: string; label: string; value: number; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-mute)]">
      <span aria-hidden className={cn("h-0 w-3.5 border-t-2", dashed && "border-dashed")} style={{ borderColor: color }} />
      {label}
      <span className="font-semibold tabular-nums text-[var(--adm-ink)]">{value.toLocaleString()}</span>
    </span>
  );
}

export type Severity = "danger" | "warning";

export interface AttentionItem {
  label: string;
  hint: string;
  value: number;
  href: string;
  severity: Severity;
}

const SEVERITY: Record<Severity | "clear", { ink: string; bar: string; edge: string }> = {
  danger:  { ink: "text-[var(--adm-danger-ink)]",  bar: "bg-[var(--adm-danger)]",  edge: "before:bg-[var(--adm-danger)]" },
  warning: { ink: "text-[var(--adm-warning-ink)]", bar: "bg-[var(--adm-warning)]", edge: "before:bg-[var(--adm-warning)]" },
  clear:   { ink: "text-[var(--adm-success-ink)]", bar: "bg-[var(--adm-success)]", edge: "before:bg-transparent" },
};

/** Exception checks as a ledger: the count leads each row, severity marks its edge. */
export function AttentionPanel({
  items, inPlay, healthy, openItems,
}: {
  items: AttentionItem[];
  inPlay: number;
  healthy: boolean;
  openItems: number;
}) {
  const total = items.reduce((n, it) => n + it.value, 0);

  return (
    <AdminCard className="flex flex-col overflow-hidden">
      <div className="px-4 pb-3.5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Needs attention</h3>
            <p className="mt-0.5 text-[13px] text-[var(--adm-ink-subtle)]">
              {healthy ? "Every check is clear for this range." : `${openItems} of ${items.length} checks flagged in this range.`}
            </p>
          </div>
          <span className={cn(
            "text-[26px] font-semibold leading-none tracking-[-0.025em] tabular-nums",
            healthy ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-ink)]",
          )}>
            {total.toLocaleString()}
          </span>
        </div>
        <div className="mt-4 flex h-1.5 gap-[3px] overflow-hidden rounded-full bg-[var(--adm-surface-2)]" aria-hidden="true">
          {total === 0 ? (
            <span className={cn("h-full w-full", SEVERITY.clear.bar)} />
          ) : (
            items.filter((it) => it.value > 0).map((it) => (
              <span
                key={it.label}
                title={`${it.label}: ${it.value}`}
                className={cn("h-full", SEVERITY[it.severity].bar)}
                style={{ flexGrow: it.value, flexBasis: 6 }}
              />
            ))
          )}
        </div>
      </div>

      <ul className="flex flex-1 flex-col border-t border-[var(--adm-line-soft)]">
        {items.map((it) => {
          const tone = it.value > 0 ? SEVERITY[it.severity] : SEVERITY.clear;
          return (
            <li key={it.label} className="flex flex-1 border-b border-[var(--adm-line-soft)] last:border-0">
              <Link
                href={it.href}
                className={cn(
                  "group relative grid w-full grid-cols-[2.5rem_1fr_auto] items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--adm-row-hover)]",
                  "before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-r-full",
                  tone.edge,
                )}
              >
                <span className={cn("text-[19px] font-semibold leading-none tracking-[-0.02em] tabular-nums", tone.ink)}>
                  {it.value.toLocaleString()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-[var(--adm-ink)]">{it.label}</span>
                  <span className="block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{it.hint}</span>
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="h-4 w-4 text-[var(--adm-ink-subtle)] transition-[transform,color] group-hover:translate-x-0.5 group-hover:text-[var(--adm-accent)]"
                />
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-2.5">
        <span className="text-[13px] text-[var(--adm-ink-mute)]">
          <span className="font-semibold tabular-nums text-[var(--adm-ink)]">{inPlay}</span> candidates in play
        </span>
        <PanelLink href="/admin/applications">Open pipeline</PanelLink>
      </div>
    </AdminCard>
  );
}

