"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDownRight, ArrowRight, ArrowUpRight, ChevronRight, Plus } from "lucide-react";
import { WorkspaceButton, Section, MenuSelect } from "@/components/admin/workspace";
import { IconCalendar } from "@/components/admin/icons";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { useAuth } from "@/lib/auth/AuthContext";
import { DashboardSkeleton } from "@/components/admin/skeletons";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { FunnelChart, DonutChart, PeriodSwitcher } from "@/components/admin/charts";
import { useAdmin } from "@/components/admin/admin-provider";
import { SERIES, statusMeta, type AppStatus } from "@/components/admin/theme";
// Shared with the Applications workspace so both agree on what counts as stale.
import {
  DAY, STALE_DAYS, OFFER_STALE_DAYS, TERMINAL,
  median, enteredStageAt, everReached, daysSince,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";

/** Billable hours in a year (40h x 52w). Figures derived from it are estimates. */
const FTE_HOURS = 2080;

/** Relative "time since" for recent activity. */
function ago(ms: number): string {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 1) return `${s}s ago`;
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function greeting(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/** Days above which a stage's median age is called out as a bottleneck. */
const STAGE_AGE_WARN = 7;

/** Dashboard scope. `days: null` means everything. */
const RANGES = [
  { value: "7d",  label: "7D",  long: "Last 7 days",   days: 7 },
  { value: "30d", label: "30D", long: "Last 30 days",  days: 30 },
  { value: "90d", label: "90D", long: "Last 90 days",  days: 90 },
  { value: "1y",  label: "12M", long: "Last 12 months", days: 365 },
  { value: "all", label: "All", long: "All time",      days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["value"];

type Period = "30d" | "90d" | "1y";

/** In-flight stages, in order. Terminal states are handled separately. */
const FLOW: AppStatus[] = ["pending", "reviewing", "submitted", "interview", "offered"];

/** Sequential blue ramp, ordered stages of one process. */
const STAGE_RAMP = ["#60a5fa", "#4b91f7", "#3b82f6", "#2f6fed", "#2563eb"];

type BarItem = {
  label: string;
  value: number;
  color?: string;
  meta?: string;
  onClick?: () => void;
};

interface StageStat {
  key: AppStatus;
  label: string;
  count: number;
  /** Ever reached this stage or a later one. */
  cohort: number;
  medianAge: number | null;
  /** Conversion from the previous stage, as a percentage. */
  conversion: number | null;
  color: string;
  isBottleneck: boolean;
}

// ── presentational pieces ────────────────────────────────────────────────────

const linkCls =
  "inline-flex items-center gap-1 rounded-[6px] px-1.5 py-1 text-[12.5px] font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]";

function PanelLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={linkCls}>
      {children}
      <ArrowRight className="h-3 w-3" aria-hidden="true" />
    </Link>
  );
}

/** Ranked horizontal bars, value-labelled so they read without colour. */
function RankedBars({ items, emptyMessage }: { items: BarItem[]; emptyMessage: string }) {
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
function LineChart({
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
type Delta = { pct: number; against: string } | null;

function DeltaChip({ delta }: { delta: Delta }) {
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

function TrendPanel({
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

function LegendKey({ color, label, value, dashed }: { color: string; label: string; value: number; dashed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-mute)]">
      <span aria-hidden className={cn("h-0 w-3.5 border-t-2", dashed && "border-dashed")} style={{ borderColor: color }} />
      {label}
      <span className="font-semibold tabular-nums text-[var(--adm-ink)]">{value.toLocaleString()}</span>
    </span>
  );
}

type Severity = "danger" | "warning";

interface AttentionItem {
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
function AttentionPanel({
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

// ── dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const { setJobs: setProviderJobs, candidateRevision } = useAdmin();

  const [rawApplications, setApps] = useState<Application[]>([]);
  const [rawJobs, setJobs]         = useState<Job[]>([]);
  /** Scopes every application-derived panel on the page. */
  const [range, setRange] = useState<RangeKey>("90d");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [recentTab, setRecentTab] = useState<"all" | "interview" | "offered">("all");

  // The volume charts follow the page's date-range control, they used to have
  // their own 30D/90D/1Y segmented picker, which just duplicated it.
  const period: Period = range === "7d" || range === "30d" ? "30d" : range === "90d" ? "90d" : "1y";

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ar, jr] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs?fields=summary")]);
      const [ad, jd] = await Promise.all([ar.json(), jr.json()]);
      if (!ar.ok || !jr.ok) throw new Error(ad.error || jd.error || "Failed to load");
      const jobsList: Job[] = jd.jobs || [];
      const jmap = new Map(jobsList.map((j: Job) => [j.id, j]));
      setApps((ad.applications || []).map((a: Application) => ({
        ...a, jobTitle: a.jobTitle || (a.jobId ? jmap.get(a.jobId)?.title : ""),
      })));
      setJobs(jobsList);
      setProviderJobs(jobsList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [setProviderJobs]);

  useEffect(() => { void fetchAll(); }, [fetchAll, candidateRevision]);

  const drillToStatus = useCallback(
    (status?: string) => router.push(`/admin/applications${status ? `?status=${status}` : ""}`),
    [router],
  );

  // ── date scope ────────────────────────────────────────────────────────────

  /**
   * One range, applied honestly. Anything derived from APPLICATIONS respects
   * the range. Requisitions do not, a role that is open is open regardless of
   * the window, so open-roles is labelled current rather than filtered.
   */
  const rangeStart = useMemo(() => {
    const days = RANGES.find((r) => r.value === range)?.days ?? null;
    return days === null ? null : Date.now() - days * DAY;
  }, [range]);

  const applications = useMemo(
    () => (rangeStart === null
      ? rawApplications
      : rawApplications.filter((a) => new Date(a.appliedAt).getTime() >= rangeStart)),
    [rawApplications, rangeStart],
  );

  const jobs = rawJobs;

  /** Same-length window immediately before the current one, for the delta chips. */
  const previous = useMemo(() => {
    const r = RANGES.find((x) => x.value === range);
    if (!r || r.days === null) return null;
    const end = Date.now() - r.days * DAY;
    const start = end - r.days * DAY;
    const prev = rawApplications.filter((a) => {
      const t = new Date(a.appliedAt).getTime();
      return t >= start && t < end;
    });
    return {
      applied: prev.length,
      hired: prev.filter((a) => a.status === "hired").length,
      against: `previous ${r.long.replace(/^Last /, "").toLowerCase()}`,
    };
  }, [rawApplications, range]);
  const rangeLabel = RANGES.find((r) => r.value === range)?.long ?? "";

  // ── core derivations ──────────────────────────────────────────────────────

  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === "active" || j.status === "open"),
    [jobs],
  );

  /** Candidates still in play, the supply side of the coverage ratio. */
  const activePipeline = useMemo(
    () => applications.filter((a) => !TERMINAL.has(a.status)),
    [applications],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  /**
   * Stage-by-stage health: occupancy, dwell time, and pass-through from the
   * previous stage. Conversion is computed on "ever reached" (a cohort that got
   * at least this far), which keeps every step a real rate that cannot exceed
   * 100%.
   */
  const stageStats: StageStat[] = useMemo(() => {
    const reachedAtLeast = FLOW.map((_, i) =>
      applications.filter(
        (a) => a.status === "hired" || FLOW.slice(i).some((s) => everReached(a, s)),
      ).length,
    );

    const raw = FLOW.map((key, i) => {
      const here = applications.filter((a) => a.status === key);
      const ages = here.map((a) => daysSince(enteredStageAt(a)));
      const prev = i > 0 ? reachedAtLeast[i - 1] : null;
      return {
        key,
        label: statusMeta[key].label,
        count: here.length,
        cohort: reachedAtLeast[i],
        medianAge: median(ages),
        conversion: prev && prev > 0 ? Math.round((reachedAtLeast[i] / prev) * 100) : null,
        color: STAGE_RAMP[i],
        isBottleneck: false,
      };
    });

    let worst = -1, worstAge = STAGE_AGE_WARN;
    raw.forEach((s, i) => {
      if (s.count > 0 && s.medianAge !== null && s.medianAge > worstAge) {
        worst = i; worstAge = s.medianAge;
      }
    });
    if (worst >= 0) raw[worst].isBottleneck = true;
    return raw;
  }, [applications]);

  const bottleneck = stageStats.find((s) => s.isBottleneck) ?? null;

  /** Hiring funnel: cohort that ever reached each stage, and pass-through to the next. */
  const funnel = useMemo(() => {
    const stages: AppStatus[] = [...FLOW, "hired"];
    const cohortAt = (idx: number) =>
      stages[idx] === "hired"
        ? applications.filter((a) => a.status === "hired").length
        : applications.filter(
            (a) => a.status === "hired" || FLOW.slice(idx).some((s) => everReached(a, s)),
          ).length;
    return stages.map((key, i) => {
      const count = cohortAt(i);
      const next = i < stages.length - 1 ? cohortAt(i + 1) : null;
      return {
        key,
        // The pipeline's first stage is "New" everywhere else, but on the funnel
        // "Applied" reads truer, it is the count of everyone who applied.
        label: key === "pending" ? "Applied" : statusMeta[key].label,
        count,
        pass: next !== null && count > 0 ? Math.round((next / count) * 100) : null,
      };
    });
  }, [applications]);

  /**
   * Commercial outcome, the spread a staffing firm earns between client bill
   * rate and contractor pay. Placements with no rates on file are excluded (not
   * counted as zero margin), and yearly figures annualise at FTE_HOURS, which
   * is stated in the UI as an estimate.
   */
  const commercial = useMemo(() => {
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const placements = applications.filter((a) => a.status === "hired");

    const withRates = placements.flatMap((a) => {
      const j = a.jobId ? jobById.get(a.jobId) : undefined;
      if (!j?.clientBillRate || !j?.payRate) return [];
      const spread = j.clientBillRate - j.payRate;
      return [{ spread, bill: j.clientBillRate, marginPct: (spread / j.clientBillRate) * 100 }];
    });

    const totalSpread = withRates.reduce((s, r) => s + r.spread, 0);
    const avgMarginPct = withRates.length
      ? withRates.reduce((s, r) => s + r.marginPct, 0) / withRates.length
      : null;

    return {
      placements: placements.length,
      covered: withRates.length,
      avgMarginPct,
      runRate: withRates.length ? totalSpread * FTE_HOURS : null,
    };
  }, [applications, jobs]);

  /** Client concentration, one client being most of the book is a real risk. */
  const clientMix: BarItem[] = useMemo(() => {
    const jobById = new Map(jobs.map((j) => [j.id, j]));
    const m = new Map<string, number>();
    for (const a of applications) {
      const j = a.jobId ? jobById.get(a.jobId) : undefined;
      const name = j?.clientName || "Unattributed";
      m.set(name, (m.get(name) || 0) + 1);
    }
    const ranked = [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    if (ranked.length <= 5) return ranked;
    const tail = ranked.slice(4);
    return [
      ...ranked.slice(0, 4),
      { label: `Other (${tail.length})`, value: tail.reduce((s, r) => s + r.value, 0), color: SERIES.neutral },
    ];
  }, [applications, jobs]);

  /** Share held by the largest client, the concentration figure. */
  const topClientShare = useMemo(() => {
    const total = clientMix.reduce((sum, c) => sum + c.value, 0);
    if (!total || clientMix.length === 0) return null;
    return Math.round((clientMix[0].value / total) * 100);
  }, [clientMix]);

  const timeToHire = useMemo(() => {
    const days = applications.flatMap((a) => {
      if (a.status !== "hired") return [];
      const e = (a.statusHistory ?? []).find((h) => h.status === "hired");
      if (!e) return [];
      const d = Math.round((new Date(e.changedAt).getTime() - new Date(a.appliedAt).getTime()) / DAY);
      return d >= 0 ? [d] : [];
    });
    return median(days);
  }, [applications]);

  /** Offer acceptance, of everyone who reached an offer, how many were hired. */
  const offerAcceptance = useMemo(() => {
    const offered = applications.filter((a) => everReached(a, "offered"));
    const decided = offered.filter((a) => a.status === "hired" || a.status === "rejected");
    if (!decided.length) return null;
    return Math.round((decided.filter((a) => a.status === "hired").length / decided.length) * 100);
  }, [applications]);

  /** Coverage: active candidates per open requisition. Below ~3 is thin. */
  const coverage = openJobs.length > 0
    ? Math.round((activePipeline.length / openJobs.length) * 10) / 10
    : null;

  /** Open requisitions ranked by how thin their pipeline is. */
  const reqCoverage: BarItem[] = useMemo(() => {
    const byJob = new Map<string, number>();
    for (const a of activePipeline) {
      if (a.jobId) byJob.set(a.jobId, (byJob.get(a.jobId) || 0) + 1);
    }
    return openJobs
      .map((j) => ({ job: j, n: byJob.get(j.id) || 0 }))
      .sort((a, b) => a.n - b.n)
      .slice(0, 6)
      .map(({ job, n }) => ({
        label: job.title,
        value: n,
        color: n === 0 ? SERIES.danger : n < 3 ? SERIES.warning : SERIES.primary,
        meta: job.clientName || job.department || undefined,
        onClick: () => router.push(`/admin/jobs/${job.id}`),
      }));
  }, [openJobs, activePipeline, router]);

  const starvedReqs = reqCoverage.filter((r) => r.value === 0).length;

  /** Channel mix by application VOLUME, the share each source contributes. */
  const channelMix = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applications) {
      const k = a.source || "Unattributed";
      m.set(k, (m.get(k) || 0) + 1);
    }
    const ranked = [...m.entries()]
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    if (ranked.length <= 5) return ranked;
    const tail = ranked.slice(4);
    return [
      ...ranked.slice(0, 4),
      { label: `Other (${tail.length})`, value: tail.reduce((s, r) => s + r.value, 0), color: SERIES.neutral },
    ];
  }, [applications]);

  // ── exceptions ────────────────────────────────────────────────────────────

  const staleCandidates = useMemo(() => {
    const cut = Date.now() - STALE_DAYS * DAY;
    return applications
      .filter((a) => (a.status === "pending" || a.status === "reviewing") && enteredStageAt(a) < cut);
  }, [applications]);

  const offersAtRisk = useMemo(() => {
    const cut = Date.now() - OFFER_STALE_DAYS * DAY;
    return applications.filter((a) => a.status === "offered" && enteredStageAt(a) < cut);
  }, [applications]);

  const unassignedActive = useMemo(
    () => activePipeline.filter((a) => !a.ownership).length,
    [activePipeline],
  );

  // ── recruiter throughput ──────────────────────────────────────────────────

  const byOwner = useMemo(() => {
    const SUBMITTED_PLUS = new Set(["submitted", "interview", "offered", "hired"]);
    const m = new Map<string, { name: string; total: number; submitted: number; hired: number; active: number }>();
    for (const a of applications) {
      const name = a.ownershipName || "Unassigned";
      if (!m.has(name)) m.set(name, { name, total: 0, submitted: 0, hired: 0, active: 0 });
      const e = m.get(name)!;
      e.total++;
      if (SUBMITTED_PLUS.has(a.status)) e.submitted++;
      if (a.status === "hired") e.hired++;
      if (!TERMINAL.has(a.status)) e.active++;
    }
    return [...m.values()].sort((a, b) => b.submitted - a.submitted || b.hired - a.hired);
  }, [applications]);

  // ── recent activity ───────────────────────────────────────────────────────

  const recent = useMemo(
    () => [...rawApplications].sort(
      (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
    ),
    [rawApplications],
  );

  const recentShown = useMemo(() => {
    const list = recentTab === "all" ? recent : recent.filter((a) => a.status === recentTab);
    return list.slice(0, 6);
  }, [recent, recentTab]);

  // ── volume trend ──────────────────────────────────────────────────────────

  const trend = useMemo(() => {
    const now = new Date();
    const days = period === "30d" ? 30 : period === "90d" ? 90 : 365;
    const group: "day" | "week" | "month" = period === "30d" ? "day" : period === "90d" ? "week" : "month";
    const start = new Date(now); start.setDate(now.getDate() - days);

    const keyOf = (d: Date) => {
      if (group === "month") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
      if (group === "week") { const m = new Date(d); m.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return m.toISOString().split("T")[0]; }
      return d.toISOString().split("T")[0];
    };

    const b: Record<string, { applied: number; hired: number; rejected: number }> = {};
    const cur = new Date(start);
    while (cur <= now) {
      b[keyOf(cur)] ??= { applied: 0, hired: 0, rejected: 0 };
      cur.setDate(cur.getDate() + (group === "day" ? 1 : group === "week" ? 7 : 28));
    }
    for (const a of applications) {
      const d = new Date(a.appliedAt);
      if (d < start) continue;
      const k = keyOf(d);
      b[k] ??= { applied: 0, hired: 0, rejected: 0 };
      b[k].applied++;
      if (a.status === "hired") b[k].hired++;
      if (a.status === "rejected") b[k].rejected++;
    }
    return Object.entries(b).sort(([x], [y]) => x.localeCompare(y)).map(([date, v]) => ({ date, ...v }));
  }, [applications, period]);

  const appliedTotal  = trend.reduce((s, t) => s + t.applied, 0);
  const hiredTotal    = trend.reduce((s, t) => s + t.hired, 0);
  const rejectedTotal = trend.reduce((s, t) => s + t.rejected, 0);
  const xFmt = (v: string) => new Date(v).toLocaleDateString("en-US",
    period === "1y" ? { month: "short", year: "2-digit" } : { month: "short", day: "numeric" });

  // ── header state ──────────────────────────────────────────────────────────

  const openItems =
    (staleCandidates.length > 0 ? 1 : 0) +
    (offersAtRisk.length > 0 ? 1 : 0) +
    (unassignedActive > 0 ? 1 : 0) +
    (starvedReqs > 0 ? 1 : 0);
  const healthy = openItems === 0;

  const firstName = (user?.name ?? "").split("@")[0].trim().split(/\s+/)[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        variant="error"
        title="Couldn't load the dashboard"
        description={error}
        action={<WorkspaceButton onClick={() => fetchAll()}>Try again</WorkspaceButton>}
      />
    </div>
  );

  // Figures that count something link to the records behind them. Ratios have
  // no list to land on, so they carry no href.
  const headStats: { label: string; value: React.ReactNode; sub: string; href?: string }[] = [
    { label: "Open roles",   value: openJobs.length,       sub: "Current", href: "/admin/jobs" },
    { label: "In play",      value: activePipeline.length, sub: `of ${applications.length} applications`, href: "/admin/applications" },
    { label: "Interviews",   value: counts.interview || 0, sub: "Active now", href: "/admin/applications?status=interview" },
    { label: "Placements",   value: commercial.placements, sub: rangeStart !== null ? rangeLabel : "All time", href: "/admin/applications?status=hired" },
    { label: "Coverage",     value: coverage !== null ? coverage : "–", sub: "Candidates per role" },
    { label: "Time to hire", value: timeToHire !== null ? `${timeToHire}d` : "–", sub: "Median" },
  ];

  const attention: AttentionItem[] = [
    { label: "Roles with no candidates", hint: "Open requisitions with an empty pipeline", value: starvedReqs,
      href: "/admin/jobs", severity: "danger" },
    { label: "Offers going cold", hint: `Pending an answer for ${OFFER_STALE_DAYS}+ days`, value: offersAtRisk.length,
      href: "/admin/applications?status=offered", severity: "danger" },
    { label: "Stale in screening", hint: `No movement for ${STALE_DAYS}+ days`, value: staleCandidates.length,
      href: "/admin/applications?status=pending", severity: "warning" },
    { label: "Candidates without an owner", hint: "Active, but nobody assigned", value: unassignedActive,
      href: "/admin/applications", severity: "warning" },
  ];

  return (
    <div className="adm-stagger mx-auto w-full max-w-[1600px] space-y-4 pb-6 lg:space-y-5">
      {/* Greeting + scope */}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="truncate text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[var(--adm-ink)] sm:text-[21px]">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </h1>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">{today}</p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <MenuSelect
            label="Date range"
            icon={IconCalendar}
            value={range}
            onChange={setRange}
            options={RANGES.map((r) => ({ value: r.value, label: r.long }))}
          />
          <WorkspaceButton variant="primary" asChild>
            <Link href="/admin/jobs/new">
              <Plus aria-hidden="true" />
              New job
            </Link>
          </WorkspaceButton>
        </div>
      </div>

      {/* KPI band. Linked cells draw a cobalt rule on hover and open their records. */}
      <AdminCard className="@container overflow-hidden">
        <div className="grid grid-cols-2 gap-px bg-[var(--adm-line-soft)] @2xl:grid-cols-3 @4xl:grid-cols-6">
          {headStats.map((s) => {
            const body = (
              <>
                <span className="block text-[12.5px] text-[var(--adm-ink-mute)]">{s.label}</span>
                <span className="mt-2 block text-[22px] font-semibold leading-none tracking-[-0.025em] tabular-nums text-[var(--adm-ink)] sm:mt-2.5 sm:text-[26px]">
                  {s.value}
                </span>
                <span className="mt-2 flex items-center justify-between gap-2 text-[12.5px] text-[var(--adm-ink-subtle)] sm:mt-2.5">
                  <span className="truncate">{s.sub}</span>
                  {s.href && (
                    <ArrowRight
                      aria-hidden="true"
                      className="h-3.5 w-3.5 flex-none -translate-x-1 text-[var(--adm-accent)] opacity-0 transition-[opacity,transform] group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  )}
                </span>
              </>
            );
            const cell = "relative min-w-0 bg-[var(--adm-surface)] px-4 py-3.5 sm:py-4";
            return s.href ? (
              <Link
                key={s.label}
                href={s.href}
                className={cn(
                  cell,
                  "group transition-colors hover:bg-[var(--adm-row-hover)]",
                  "before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:origin-left before:scale-x-0 before:bg-[var(--adm-accent)] before:transition-transform before:duration-300 hover:before:scale-x-100",
                )}
              >
                {body}
              </Link>
            ) : (
              <div key={s.label} className={cell}>{body}</div>
            );
          })}
        </div>
      </AdminCard>

      {/* Exceptions + volume */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AttentionPanel items={attention} inPlay={activePipeline.length} healthy={healthy} openItems={openItems} />

        <div className="grid gap-4 xl:col-span-2">
          <TrendPanel
            title="Applications"
            value={appliedTotal}
            caption={`Received · ${period}`}
            delta={previous && previous.applied > 0
              ? { pct: Math.round(((applications.length - previous.applied) / previous.applied) * 100), against: previous.against }
              : null}
          >
            <LineChart data={trend} dataKey="applied" label="Applications" xKey="date" xFmt={xFmt} color="var(--adm-accent)" />
          </TrendPanel>
          <TrendPanel
            title="Placements"
            value={hiredTotal}
            caption={offerAcceptance !== null ? `Hired · ${offerAcceptance}% offer acceptance` : `Hired · ${period}`}
            delta={previous && previous.hired > 0
              ? { pct: Math.round(((commercial.placements - previous.hired) / previous.hired) * 100), against: previous.against }
              : null}
            legend={
              <div className="flex flex-col items-end gap-1">
                <LegendKey color="var(--adm-success)" label="Hired" value={hiredTotal} />
                <LegendKey color="var(--adm-danger)" label="Rejected" value={rejectedTotal} dashed />
              </div>
            }
          >
            <LineChart
              data={trend}
              dataKey="hired"
              label="Hired"
              dataKey2="rejected"
              label2="Rejected"
              xKey="date"
              xFmt={xFmt}
              color="var(--adm-success)"
              color2="var(--adm-danger)"
            />
          </TrendPanel>
        </div>
      </div>

      <Section
        title="Pipeline and channels"
        description="How candidates move through stages, and where they come from."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminCard className="flex flex-col overflow-hidden">
            <AdminCardHeader title="Hiring funnel" subtitle="Cohort reaching each stage · select a stage to open it" />
            <FunnelChart
              stages={funnel.map((f) => ({
                label: f.label,
                value: f.count,
                onClick: () => drillToStatus(f.key),
              }))}
            />
            {bottleneck && (
              <p className="border-t border-[var(--adm-line)] px-4 py-2.5 text-[12.5px] text-[var(--adm-ink-mute)]">
                <span className="font-medium text-[var(--adm-ink)]">{bottleneck.label}</span> is the slowest stage, at a median of {bottleneck.medianAge}d.
              </p>
            )}
          </AdminCard>

          <AdminCard className="flex flex-col overflow-hidden">
            <AdminCardHeader title="Channel mix" subtitle="Share of applications by source" />
            {channelMix.length > 0 ? (
              <div className="grid flex-1 place-items-center px-4 py-5">
                <DonutChart segments={channelMix} centerCaption="applications" />
              </div>
            ) : (
              <EmptyState size="sm" title="No source data yet" description="Sources appear once applications record where they came from." />
            )}
          </AdminCard>
        </div>
      </Section>

      <Section
        title="Where the work is"
        description="Roles that need sourcing, and how the pipeline splits by client."
        action={<PanelLink href="/admin/jobs">All roles</PanelLink>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Requisition coverage" subtitle="Active candidates per open role, thinnest first" />
            <RankedBars items={reqCoverage} emptyMessage="No open requisitions" />
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Client concentration" subtitle="Share of pipeline by client" />
            <RankedBars items={clientMix} emptyMessage="No client data yet" />
            {topClientShare !== null && topClientShare >= 40 && clientMix.length > 0 && (
              <p className="border-t border-[var(--adm-line)] px-4 py-2.5 text-[12.5px] text-[var(--adm-ink-mute)]">
                <span className="font-medium text-[var(--adm-ink)]">{clientMix[0].label}</span> holds{" "}
                <span className="font-semibold text-[var(--adm-warning-ink)]">{topClientShare}%</span> of the pipeline.
              </p>
            )}
          </AdminCard>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-5">
        <AdminCard className="overflow-hidden lg:col-span-2">
          <AdminCardHeader
            title="Recent activity"
            action={
              <PeriodSwitcher
                label="Activity filter"
                value={recentTab}
                onChange={setRecentTab}
                options={[
                  { value: "all", label: "Latest" },
                  { value: "interview", label: "Interviews" },
                  { value: "offered", label: "Offers" },
                ]}
              />
            }
          />
          {recentShown.length > 0 ? (
            <ul className="divide-y divide-[var(--adm-line-soft)]">
              {recentShown.map((a) => (
                <li key={a.id}>
                  <Link href={`/admin/candidates/${a.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[var(--adm-row-hover)]">
                    <Avatar name={a.name || a.email} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--adm-ink)]">{a.name || "Unnamed"}</span>
                      <span className="block truncate text-[12px] text-[var(--adm-ink-subtle)]">{a.jobTitle || "No role"}</span>
                    </span>
                    <span className="flex flex-none flex-col items-end gap-1">
                      <StatusBadge status={a.status} />
                      <span className="text-[11.5px] text-[var(--adm-ink-subtle)]">{ago(new Date(a.appliedAt).getTime())}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState size="sm" title="Nothing here yet" description="Candidates at this stage will appear here." />
          )}
        </AdminCard>

        <AdminCard className="overflow-hidden lg:col-span-3">
          <AdminCardHeader
            title="Recruiter throughput"
            subtitle="Submissions against hires"
            action={<PanelLink href="/admin/applications">All</PanelLink>}
          />
          {byOwner.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="adm-grid w-full text-[13px]">
                <thead>
                  <tr>
                    <th className="h-9 px-4 text-left">Recruiter</th>
                    <th className="hidden h-9 px-3 text-right sm:table-cell">Active</th>
                    <th className="h-9 px-3 text-left">Submitted</th>
                    <th className="h-9 px-3 text-right">Hired</th>
                    <th className="hidden h-9 px-4 text-right sm:table-cell">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byOwner.slice(0, 8).map((r) => {
                    const maxSub = byOwner[0].submitted || 1;
                    const conv = r.submitted > 0 ? Math.round((r.hired / r.submitted) * 100) : 0;
                    return (
                      <tr key={r.name} className="transition-colors hover:bg-[var(--adm-row-hover)]" style={{ ["--adm-row-h" as string]: "44px" }}>
                        <td className="px-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={r.name} size="xs" />
                            <span className={cn("truncate", r.name === "Unassigned" ? "text-[var(--adm-ink-subtle)]" : "font-medium text-[var(--adm-ink)]")}>
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="hidden px-3 text-right text-[var(--adm-ink-mute)] sm:table-cell">{r.active}</td>
                        <td className="px-3">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-right font-semibold text-[var(--adm-ink)]">{r.submitted}</span>
                            <span className="h-1.5 min-w-[36px] max-w-[140px] flex-1 overflow-hidden rounded-full bg-[var(--adm-surface-2)]">
                              <span className="block h-full rounded-full bg-[var(--adm-accent)]" style={{ width: `${(r.submitted / maxSub) * 100}%` }} />
                            </span>
                          </div>
                        </td>
                        <td className="px-3 text-right">
                          <span className={cn("font-semibold", r.hired > 0 ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-ink-subtle)]")}>{r.hired}</span>
                        </td>
                        <td className="hidden px-4 text-right text-[var(--adm-ink-mute)] sm:table-cell">{conv}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState size="sm" title="No candidates assigned yet" description="Assign an owner to candidates to track throughput." />
          )}
        </AdminCard>
      </div>
    </div>
  );
}
