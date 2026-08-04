"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { WorkspaceButton } from "@/components/admin/workspace";
import { useAuth } from "@/lib/auth/AuthContext";
import type { Application, Job } from "@/lib/aws/dynamodb";
import {
  IconOverview, IconRequisition, IconPipeline, IconUser,
  IconCoverage, IconInterview, IconTrend, IconWarning,
} from "@/components/admin/icons";
import { Avatar } from "@/components/admin/avatar";
import { FunnelChart, DonutChart } from "@/components/admin/charts";
import { useAdmin } from "@/components/admin/admin-provider";
import { SERIES, statusMeta, type AppStatus } from "@/components/admin/theme";
// Timing helpers are shared with the Applications workspace, so the two screens
// cannot disagree about which candidates count as stale.
import {
  DAY, STALE_DAYS, OFFER_STALE_DAYS, TERMINAL,
  median, enteredStageAt, everReached, daysSince,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";

/* ============================================================================
   Recruitment operations console — Conduktor-style dark data console.

   The DATA model is unchanged: every application carries a statusHistory, so we
   can measure not just "how much is there" but where the pipeline is stalling,
   which roles are starved, and what the desk earns. What changed is the
   PRESENTATION — the screen is now a dark, dense operations console modelled on
   Conduktor's cluster dashboard:

     · a header block (mark + title) followed by a hairline-divided STAT ROW
     · a green-glow "pipeline state" card with a solid green check badge, whose
       PARTITIONS-style sub-grid surfaces the exception counts
     · blue line-chart cards (application + placement volume over time)
     · a 2×2 "data freshness" grid — per-domain icon, sync time, green check
     · a segmented "recent activity" list
     · dark analytical cards (pipeline stages, channels, coverage, clients)
     · the recruiter throughput ledger

   All fetching, auth and the derivations below are preserved verbatim; only the
   returned markup is new.
   ========================================================================== */

/**
 * Hours in a billable year, used to annualise an hourly spread. 2,080 is the
 * standard full-time year (40h × 52w). Every figure derived from it is labelled
 * an estimate in the UI — do not present these as booked revenue.
 */
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

/** Days above which a stage's median age is called out as a bottleneck. */
const STAGE_AGE_WARN = 7;

/** Dashboard scope. `days: null` means everything. */
const RANGES = [
  { value: "7d",  label: "7 days",   days: 7 },
  { value: "30d", label: "30 days",  days: 30 },
  { value: "90d", label: "90 days",  days: 90 },
  { value: "1y",  label: "12 months", days: 365 },
  { value: "all", label: "All time", days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["value"];

const PERIODS = [
  { value: "30d", label: "30D" },
  { value: "90d", label: "90D" },
  { value: "1y",  label: "1Y"  },
] as const;
type Period = (typeof PERIODS)[number]["value"];

/** In-flight stages, in order. Terminal states are handled separately. */
const FLOW: AppStatus[] = ["pending", "reviewing", "submitted", "interview", "offered"];

/** Sequential blue ramp — ordered stages of one process, not five categories. */
const STAGE_RAMP = ["#60a5fa", "#4b91f7", "#3b82f6", "#2f6fed", "#2563eb"];

/** Shared shape for the dark ranked-bar lists. */
type BarItem = {
  label: string;
  value: number;
  color?: string;
  meta?: string;
  onClick?: () => void;
};

// ── count-up ─────────────────────────────────────────────────────────────────

function useCountUp(target: number, ms = 800) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!target) { setN(0); return; }
    let raf: number, t0: number | null = null;
    const tick = (ts: number) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / ms, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return n;
}

// ── pipeline health band ─────────────────────────────────────────────────────

interface StageStat {
  key: AppStatus;
  label: string;
  count: number;
  /** Ever reached this stage or a later one. Drives the funnel. */
  cohort: number;
  medianAge: number | null;
  /** Conversion from the previous stage, as a percentage. */
  conversion: number | null;
  color: string;
  isBottleneck: boolean;
}

// ── presentational primitives (dark) ─────────────────────────────────────────

/** Solid confirmation tick — sits on a filled state badge. */
function Check({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
      strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

/** Dark thin-bordered card, the base surface for every panel on the screen. */
function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)]", className)}>
      {children}
    </div>
  );
}

/** Titled card band with an optional leading icon and right-hand action. */
function CardHead({
  icon: Icon, title, subtitle, action,
}: {
  icon?: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
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
  );
}

/** Named group of panels with generous space around it. */
function SectionHead({ title, description, action }: {
  title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[var(--adm-ink-mute)]">{title}</h2>
        {description && <p className="mt-1 text-[13.5px] leading-snug text-[var(--adm-ink-subtle)]">{description}</p>}
      </div>
      {action && <div className="flex flex-shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

/** Ranked horizontal bars, dark. Value-labelled, so it reads without colour. */
function DarkBars({ items, emptyMessage = "Nothing to break down yet" }: {
  items: BarItem[]; emptyMessage?: string;
}) {
  if (items.length === 0) {
    return <div className="px-5 py-10 text-center text-[13px] text-[var(--adm-ink-subtle)]">{emptyMessage}</div>;
  }
  const max = Math.max(...items.map((it) => it.value), 1);
  return (
    <div className="space-y-3 px-5 py-4">
      {items.map((it, i) => {
        const color = it.color ?? STAGE_RAMP[i % STAGE_RAMP.length];
        const width = max > 0 ? Math.max((it.value / max) * 100, it.value > 0 ? 3 : 0) : 0;
        const Row = (
          <>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span aria-hidden className="h-2.5 w-2.5 flex-none rounded-[2px]" style={{ background: color }} />
                <span className="truncate text-[13px] font-medium text-[var(--adm-ink-mute)]">{it.label}</span>
              </span>
              <span className="flex flex-none items-baseline gap-1.5">
                {it.meta && <span className="text-[11.5px] text-[var(--adm-ink-subtle)]">{it.meta}</span>}
                <span className="text-[13px] font-bold tabular-nums text-[var(--adm-ink)]">{it.value.toLocaleString()}</span>
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-[3px] bg-[var(--adm-line-soft)]">
              <div className="h-full rounded-[3px]" style={{ width: `${width}%`, background: color }} />
            </div>
          </>
        );
        return it.onClick ? (
          <button key={it.label} type="button" onClick={it.onClick}
            className="block w-full rounded-[6px] text-left transition-colors hover:bg-[var(--adm-row-hover)]">
            {Row}
          </button>
        ) : (
          <div key={it.label}>{Row}</div>
        );
      })}
    </div>
  );
}

/**
 * Blue line chart — a hand-drawn SVG so it themes cleanly to the dark console
 * without dragging the light recharts chrome onto the screen. Dotted gridlines,
 * a soft area fill and a crisp 2px line, with tiny axis ticks. `non-scaling-
 * stroke` keeps line + dashes even while the SVG stretches to the panel width.
 */
function LineChart({
  data, dataKey, xKey, xFmt, color = "var(--adm-data)", height = 132, dataKey2, color2 = "var(--adm-danger)",
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey: string;
  xFmt: (v: string) => string;
  color?: string;
  height?: number;
  /** Optional comparison series, drawn as a second line with no area fill. */
  dataKey2?: string;
  color2?: string;
}): React.ReactElement {
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

  const W = 600, H = 100, padT = 8, padB = 8;
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

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {gy.map((y, i) => (
          <line key={i} x1="0" y1={y} x2={W} y2={y} stroke="var(--adm-line)"
            strokeWidth={1} strokeDasharray="2 5" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={area} fill={`url(#${gid})`} />
        {dataKey2 && line2 && (
          <path d={line2} fill="none" stroke={color2} strokeWidth={2} strokeDasharray="5 4"
            vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        )}
        <path d={line} fill="none" stroke={color} strokeWidth={2}
          vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <div className="mt-2 flex justify-between px-0.5 text-[10px] tabular-nums text-[var(--adm-ink-subtle)]">
        {ticks.map((ti, i) => <span key={i}>{xFmt(String(data[ti]?.[xKey] ?? ""))}</span>)}
      </div>
    </div>
  );
}

// ── skeleton ─────────────────────────────────────────────────────────────────

function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[4px] bg-[var(--adm-line-soft)]", className)} />;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-10">
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Skel className="h-12 w-12 rounded-[12px]" />
          <div className="space-y-2"><Skel className="h-6 w-48" /><Skel className="h-3 w-32" /></div>
        </div>
        <div className="mt-6 flex gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 space-y-2"><Skel className="h-3 w-20" /><Skel className="h-7 w-12" /></div>
          ))}
        </div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skel className="h-64 rounded-[12px]" />
        <Skel className="h-64 rounded-[12px] lg:col-span-2" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skel key={i} className="h-28 rounded-[12px]" />)}
      </div>
    </div>
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

  // The volume charts follow the page's date-range control — they used to have
  // their own 30D/90D/1Y segmented picker, which just duplicated it.
  const period: Period = range === "7d" || range === "30d" ? "30d" : range === "90d" ? "90d" : "1y";

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ar, jr] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
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
   * the range. Requisitions do not — a role that is open is open regardless of
   * the window — so open-roles is labelled current rather than filtered.
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
  const rangeLabel = RANGES.find((r) => r.value === range)?.label ?? "";

  // ── core derivations ──────────────────────────────────────────────────────

  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === "active" || j.status === "open"),
    [jobs],
  );

  /** Candidates still in play — the supply side of the coverage ratio. */
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
        // "Applied" reads truer — it is the count of everyone who applied.
        label: key === "pending" ? "Applied" : statusMeta[key].label,
        count,
        pass: next !== null && count > 0 ? Math.round((next / count) * 100) : null,
      };
    });
  }, [applications]);

  /**
   * Commercial outcome — the spread a staffing firm earns between client bill
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

  /** Client concentration — one client being most of the book is a real risk. */
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

  /** Share held by the largest client — the concentration figure. */
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

  /** Offer acceptance — of everyone who reached an offer, how many were hired. */
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

  /** Channel mix by application VOLUME — the share each source contributes. */
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

  /** Cognito gives us a full `name`, falling back to the email when unset. */
  const firstName = (user?.name ?? "").split("@")[0].trim().split(/\s+/)[0];

  const openItems =
    (staleCandidates.length > 0 ? 1 : 0) +
    (offersAtRisk.length > 0 ? 1 : 0) +
    (unassignedActive > 0 ? 1 : 0) +
    (starvedReqs > 0 ? 1 : 0);
  const healthy = openItems === 0;

  const openReqCount   = useCountUp(openJobs.length);
  const activeCount    = useCountUp(activePipeline.length);
  const interviewCount = useCountUp(counts.interview || 0);
  const placementCount = useCountUp(commercial.placements);

  if (loading) return <DashboardSkeleton />;

  if (error) return (
    <div className="mx-auto mt-20 max-w-md text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[10px] bg-[var(--adm-danger-soft)]">
        <IconWarning className="h-7 w-7 text-[var(--adm-danger)]" />
      </div>
      <p className="font-semibold text-[var(--adm-ink)]">{error}</p>
      <button onClick={() => fetchAll()}
        className="mt-4 rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--adm-accent-strong)]">
        Retry
      </button>
    </div>
  );

  // ── header stat row ─────────────────────────────────────────────────────────
  const headStats = [
    { label: "Open roles",   value: openReqCount,   sub: "current" },
    { label: "In play",      value: activeCount,    sub: `${applications.length} apps` },
    { label: "Interviews",   value: interviewCount, sub: "active" },
    { label: "Placements",   value: placementCount, sub: rangeStart !== null ? rangeLabel.toLowerCase() : "all time" },
    { label: "Coverage",     value: coverage !== null ? coverage : "—", sub: "per role" },
    { label: "Time to hire", value: timeToHire !== null ? `${timeToHire}d` : "—", sub: "median" },
  ];

  return (
    <div className="space-y-8 pb-12">

      {/* ── greeting + scope filter, one row ── */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          <span className="grid h-12 w-12 flex-none place-items-center rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] text-[var(--adm-accent)]">
            <IconUser className="h-6 w-6" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
              Welcome back{firstName ? `, ${firstName}` : ""}!
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs/new")}>
            <IconRequisition className="h-4 w-4" strokeWidth={1.75} />
            Add job
          </WorkspaceButton>
          <div className="relative">
            <label htmlFor="dash-range" className="sr-only">Date range</label>
            <select
              id="dash-range"
              value={range}
              onChange={(e) => setRange(e.target.value as RangeKey)}
              className="h-10 cursor-pointer appearance-none rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] pl-3.5 pr-9 text-[14px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-accent)]"
            >
              {RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]"
            />
          </div>
        </div>
      </div>

      {/* ── header block + stat row ── */}
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:gap-8">
          <div className="flex min-w-0 items-center gap-4 lg:w-[240px] lg:flex-none">
            <span className="grid h-12 w-12 flex-none place-items-center rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] text-[var(--adm-accent)]">
              <IconOverview className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
                Operations
              </h1>
              <p className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-subtle)]">Recruitment desk</p>
            </div>
          </div>

          {/* Hairline-divided stat columns, the Conduktor signature. */}
          <div className="grid flex-1 grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-y-0">
            {headStats.map((s, i) => (
              <div
                key={s.label}
                className={cn(
                  "px-0 lg:px-5",
                  i > 0 && "lg:border-l lg:border-[var(--adm-line)]",
                )}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
                  {s.label}
                </div>
                <div className="mt-1.5 text-[26px] font-bold leading-none tracking-[-0.02em] tabular-nums text-[var(--adm-ink)]">
                  {s.value}
                </div>
                <div className="mt-1 text-[11.5px] text-[var(--adm-ink-subtle)]">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* ── state card + volume charts ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Pipeline state — the card wears its state: a light green wash when
            everything is healthy, an amber wash + amber border when something
            needs attention, so the difference is visible from across the room. */}
        <div
          className={cn(
            "relative overflow-hidden rounded-[12px] border bg-[var(--adm-surface)] p-5",
            healthy ? "border-[var(--adm-line)]" : "border-[var(--adm-warning)]",
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full"
            style={{
              background: healthy
                ? "radial-gradient(circle, var(--adm-glow), transparent 70%)"
                : "radial-gradient(circle, var(--adm-warning-soft), transparent 70%)",
            }}
          />
          <div className="relative flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Pipeline state</h3>
            <Link href="/admin/applications"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)]">
              View pipeline <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <div className="relative mt-5 flex items-center gap-3">
            <span
              className="grid h-9 w-9 flex-none place-items-center rounded-full"
              style={{ background: healthy ? "var(--adm-success)" : "var(--adm-warning)", color: "#ffffff" }}
            >
              {healthy ? <Check className="h-5 w-5" /> : <IconWarning className="h-5 w-5" />}
            </span>
            <span className="text-[26px] font-bold tracking-[-0.01em] text-[var(--adm-ink)]">
              {healthy ? "Healthy" : "Needs attention"}
            </span>
          </div>

          <div className="relative mt-6 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--adm-ink-subtle)]">
            Exceptions
          </div>
          <div className="relative mt-3 grid grid-cols-3 gap-3">
            {[
              { label: "Starved roles", value: starvedReqs },
              { label: "Stale", value: staleCandidates.length },
              { label: "Offers at risk", value: offersAtRisk.length },
            ].map((e) => (
              <div key={e.label}>
                <div className="text-[11.5px] leading-tight text-[var(--adm-ink-subtle)]">{e.label}</div>
                <div className={cn(
                  "mt-1 text-[20px] font-bold tabular-nums",
                  e.value === 0 ? "text-[var(--adm-success)]" : "text-[var(--adm-warning)]",
                )}>
                  {e.value}
                </div>
              </div>
            ))}
          </div>

          <div className="relative mt-5 flex items-center justify-between rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-canvas)] px-3 py-2">
            <code className="truncate font-mono text-[12px] text-[var(--adm-ink-mute)]">
              oceanblue-pipeline · {activePipeline.length} active
            </code>
            {unassignedActive > 0 && (
              <span className="ml-2 flex-none rounded-full bg-[var(--adm-warning-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--adm-warning)]">
                {unassignedActive} unassigned
              </span>
            )}
          </div>
        </div>

        {/* Volume line charts. */}
        <div className="grid gap-4 lg:col-span-2">
          <Card className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="sm:w-40 sm:flex-none">
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Applications</h3>
                </div>
                <div className="mt-4 text-[30px] font-bold leading-none tabular-nums text-[var(--adm-ink)]">
                  {appliedTotal.toLocaleString()}
                </div>
                <div className="mt-1.5 text-[12px] text-[var(--adm-ink-subtle)]">received, {period}</div>
              </div>
              <div className="min-w-0 flex-1">
                <LineChart data={trend} dataKey="applied" xKey="date" xFmt={xFmt} color="var(--adm-data)" />
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="sm:w-40 sm:flex-none">
                <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Placements</h3>
                <div className="mt-4 text-[30px] font-bold leading-none tabular-nums text-[var(--adm-ink)]">
                  {hiredTotal.toLocaleString()}
                </div>
                <div className="mt-1.5 text-[12px] text-[var(--adm-ink-subtle)]">
                  hired, {period}
                  {offerAcceptance !== null && <> · {offerAcceptance}% offer accept</>}
                </div>
                {/* Hired vs rejected: same axis, so the two outcomes read against each other. */}
                <div className="mt-4 space-y-1.5 text-[12px]">
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden className="h-[3px] w-4 flex-none rounded-full" style={{ background: "var(--adm-success)" }} />
                    <span className="text-[var(--adm-ink-mute)]">Hired</span>
                    <span className="ml-auto font-bold tabular-nums text-[var(--adm-ink)]">{hiredTotal.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span aria-hidden className="h-[3px] w-4 flex-none rounded-full border-b border-dashed" style={{ background: "var(--adm-danger)" }} />
                    <span className="text-[var(--adm-ink-mute)]">Rejected</span>
                    <span className="ml-auto font-bold tabular-nums text-[var(--adm-ink)]">{rejectedTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <LineChart
                  data={trend}
                  dataKey="hired"
                  dataKey2="rejected"
                  xKey="date"
                  xFmt={xFmt}
                  color="var(--adm-success)"
                  color2="var(--adm-danger)"
                />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── pipeline & channels ── */}
      <section className="space-y-3">
        <SectionHead
          title="Pipeline and channels"
          action={
            <span className="flex items-center gap-3 text-[12.5px] text-[var(--adm-ink-subtle)]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--adm-success)" }} />
                {counts.hired || 0} hired
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: "var(--adm-danger)" }} />
                {counts.rejected || 0} rejected
              </span>
            </span>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHead icon={IconPipeline} title="Hiring funnel" subtitle="Conversion through each stage · click to drill in" />
            <FunnelChart
              stages={funnel.map((f) => ({
                label: f.label,
                value: f.count,
                onClick: () => drillToStatus(f.key),
              }))}
            />
            {bottleneck && (
              <div className="border-t border-[var(--adm-line)] px-5 py-3 text-[12.5px] leading-relaxed text-[var(--adm-ink-subtle)]">
                <span className="font-semibold text-[var(--adm-ink-mute)]">{bottleneck.label}</span> is the slowest
                stage, at a median of {bottleneck.medianAge}d.
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHead icon={IconTrend} title="Channel mix" subtitle="Share of applications by source" />
            {channelMix.length > 0 ? (
              <div className="px-5 py-5">
                <DonutChart segments={channelMix} centerCaption="applications" />
              </div>
            ) : (
              <div className="px-5 py-10 text-center text-[13px] text-[var(--adm-ink-subtle)]">No source data yet</div>
            )}
          </Card>
        </div>
      </section>

      {/* ── where the work is ── */}
      <section className="space-y-3">
        <SectionHead
          title="Where the work is"
          action={
            <Link href="/admin/jobs"
              className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)]">
              All roles <ArrowRight className="h-3 w-3" />
            </Link>
          }
        />
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHead icon={IconCoverage} title="Requisition coverage" subtitle="Thinnest first — the top is where to source" />
            <DarkBars items={reqCoverage} emptyMessage="No open requisitions" />
          </Card>

          <Card className="overflow-hidden">
            <CardHead icon={IconRequisition} title="Client concentration" subtitle="Share of pipeline by client" />
            <DarkBars items={clientMix} emptyMessage="No client data yet" />
            {topClientShare !== null && topClientShare >= 40 && clientMix.length > 0 && (
              <div className="border-t border-[var(--adm-line)] px-5 py-3 text-[12.5px] leading-relaxed text-[var(--adm-ink-subtle)]">
                <span className="font-semibold text-[var(--adm-ink-mute)]">{clientMix[0].label}</span> is{" "}
                <span className="font-semibold text-[var(--adm-warning)]">{topClientShare}%</span> of the pipeline —
                a concentration risk worth naming.
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ── recent activity + throughput ── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recently viewed — segmented tabs. */}
        <Card className="overflow-hidden lg:col-span-2">
          <div className="border-b border-[var(--adm-line)] px-5 py-3.5">
            <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Recent activity</h3>
            <div className="mt-3 inline-flex rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-seg-track)] p-0.5">
              {([
                { key: "all", label: "Latest" },
                { key: "interview", label: "Interviews" },
                { key: "offered", label: "Offers" },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setRecentTab(t.key)}
                  aria-pressed={recentTab === t.key}
                  className={cn(
                    "rounded-[6px] px-3 py-1 text-[12.5px] font-semibold transition-colors",
                    recentTab === t.key
                      ? "bg-[var(--adm-seg-active)] text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
                      : "text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          {recentShown.length > 0 ? (
            <div>
              {recentShown.map((a) => {
                const meta = statusMeta[a.status as AppStatus];
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => router.push(`/admin/candidates/${a.id}`)}
                    className="flex w-full items-center gap-3 border-b border-[var(--adm-line-soft)] px-5 py-3 text-left transition-colors last:border-0 hover:bg-[var(--adm-row-hover)]"
                  >
                    <Avatar name={a.name || a.email} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold text-[var(--adm-ink)]">{a.name || "Unnamed"}</p>
                      <p className="truncate text-[12px] text-[var(--adm-ink-subtle)]">{a.jobTitle || "No role"}</p>
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <span className="text-[11px] font-medium text-[var(--adm-ink-mute)]">{meta?.label ?? a.status}</span>
                      <span className="text-[10.5px] text-[var(--adm-ink-subtle)]">{ago(new Date(a.appliedAt).getTime())}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-[13px] text-[var(--adm-ink-subtle)]">
              Nothing here yet
            </div>
          )}
        </Card>

        {/* Recruiter throughput ledger. */}
        <Card className="overflow-hidden lg:col-span-3">
          <CardHead
            icon={IconInterview}
            title="Recruiter throughput"
            subtitle="Submissions against hires, ranked by hires"
            action={
              <Link href="/admin/applications"
                className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)]">
                All <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          {byOwner.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]" style={{ fontVariantNumeric: "tabular-nums" }}>
                <thead>
                  <tr className="border-b border-[var(--adm-line)] text-[12.5px] text-[var(--adm-ink-subtle)]">
                    <th className="px-5 py-2.5 text-left font-medium">Recruiter</th>
                    <th className="px-3 py-2.5 text-right font-medium">Active</th>
                    <th className="px-3 py-2.5 text-left font-medium">Submitted</th>
                    <th className="px-3 py-2.5 text-right font-medium">Hired</th>
                    <th className="px-5 py-2.5 text-right font-medium">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {byOwner.slice(0, 8).map((r) => {
                    const maxSub = byOwner[0].submitted || 1;
                    const conv = r.submitted > 0 ? Math.round((r.hired / r.submitted) * 100) : 0;
                    return (
                      <tr key={r.name} className="border-b border-[var(--adm-line-soft)] transition-colors last:border-0 hover:bg-[var(--adm-row-hover)]">
                        <td className="px-5 py-2.5">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar name={r.name} size="sm" />
                            <span className={cn("truncate font-semibold", r.name === "Unassigned" ? "italic text-[var(--adm-ink-subtle)]" : "text-[var(--adm-ink-mute)]")}>
                              {r.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right text-[var(--adm-ink-mute)]">{r.active}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 text-right font-bold text-[var(--adm-ink)]">{r.submitted}</span>
                            <div className="h-2 min-w-[36px] max-w-[140px] flex-1 overflow-hidden rounded-[3px] bg-[var(--adm-line-soft)]">
                              <div className="h-full rounded-[3px]" style={{ width: `${(r.submitted / maxSub) * 100}%`, background: "var(--adm-data)" }} />
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <span className={cn("font-bold", r.hired > 0 ? "text-[var(--adm-success)]" : "text-[var(--adm-ink-subtle)]")}>{r.hired}</span>
                        </td>
                        <td className="px-5 py-2.5 text-right text-[var(--adm-ink-subtle)]">{conv}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-[14px] font-medium text-[var(--adm-ink-mute)]">No candidates assigned yet</p>
              <p className="mt-1 text-[13px] text-[var(--adm-ink-subtle)]">Assign ownership to track throughput</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
