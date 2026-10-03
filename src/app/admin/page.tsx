"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw } from "lucide-react";
import { BrandBand, BAND_PRIMARY, WorkspaceButton, Section, MenuSelect } from "@/components/admin/workspace";
import { IconCalendar } from "@/components/admin/icons";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { MyTasksPanel } from "@/components/admin/my-tasks-panel";
import { DashboardSkeleton } from "@/components/admin/skeletons";
import { Avatar } from "@/components/admin/avatar";
import { StatusBadge } from "@/components/admin/status-badge";
import { FunnelChart, DonutChart, PeriodSwitcher } from "@/components/admin/charts";
import { useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { SERIES, statusMeta, type AppStatus } from "@/components/admin/theme";
// Shared with the Applications workspace so both agree on what counts as stale.
import {
  DAY, STALE_DAYS, OFFER_STALE_DAYS, TERMINAL,
  median, enteredStageAt, everReached, daysSince,
} from "@/lib/pipeline";
import { cn } from "@/lib/utils";
import {
  AttentionPanel, LegendKey, LineChart, PanelLink, RankedBars, STAGE_RAMP, TrendPanel,
  type AttentionItem, type BarItem,
} from "@/components/admin/dashboard-panels";

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

// ── dashboard ────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  /** Scopes every application-derived panel on the page. */
  const [range, setRange] = useState<RangeKey>("90d");
  const [recentTab, setRecentTab] = useState<"all" | "interview" | "offered">("all");

  // The volume charts follow the page's date-range control, they used to have
  // their own 30D/90D/1Y segmented picker, which just duplicated it.
  const period: Period = range === "7d" || range === "30d" ? "30d" : range === "90d" ? "90d" : "1y";

  // Shared with the Applications and Jobs screens; a refresh keeps the figures
  // on screen and a failed one leaves the last good figures up.
  const appsRes = useApplicationSummaries();
  const jobsRes = useJobSummaries();
  const rawJobs = useMemo(() => jobsRes.jobs ?? [], [jobsRes.jobs]);
  const rawApplications = useMemo(() => {
    const jmap = new Map(rawJobs.map((j) => [j.id, j]));
    return (appsRes.applications ?? []).map((a) => ({
      ...a, jobTitle: a.jobTitle || (a.jobId ? jmap.get(a.jobId)?.title : ""),
    }));
  }, [appsRes.applications, rawJobs]);
  const loading = appsRes.isLoading || jobsRes.isLoading;
  const firstError = (!appsRes.applications && appsRes.error) || (!jobsRes.jobs && jobsRes.error);
  const error = firstError ? firstError.message : null;
  const refreshing = appsRes.isValidating || jobsRes.isValidating;
  const loadedAt = useMemo(() => (appsRes.data && jobsRes.data ? new Date() : null), [appsRes.data, jobsRes.data]);
  const { reload: reloadApps } = appsRes;
  const { reload: reloadJobs } = jobsRes;
  const fetchAll = useCallback(() => Promise.all([reloadApps(), reloadJobs()]), [reloadApps, reloadJobs]);

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

  /** Candidate sourcing by application VOLUME, the share each source contributes. */
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
    { label: "Open roles",   value: openJobs.length,       sub: "Current", href: "/admin/state-roles" },
    { label: "Active candidates", value: activePipeline.length, sub: `of ${applications.length} applications`, href: "/admin/applications" },
    { label: "Interviews",   value: counts.interview || 0, sub: "Active now", href: "/admin/applications?status=interview" },
    { label: "Placements",   value: commercial.placements, sub: rangeStart !== null ? rangeLabel : "All time", href: "/admin/applications?status=hired" },
    { label: "Candidates per role", value: coverage !== null ? coverage : "–", sub: "Average across open roles" },
    { label: "Time to hire", value: timeToHire !== null ? `${timeToHire}d` : "–", sub: "Median" },
  ];

  const attention: AttentionItem[] = [
    { label: "Roles with no candidates", hint: "Open roles with an empty pipeline", value: starvedReqs,
      href: "/admin/state-roles", severity: "danger" },
    { label: "Offers awaiting response", hint: `Pending an answer for ${OFFER_STALE_DAYS}+ days`, value: offersAtRisk.length,
      href: "/admin/applications?status=offered", severity: "danger" },
    { label: "Stalled in screening", hint: `No movement for ${STALE_DAYS}+ days`, value: staleCandidates.length,
      href: "/admin/applications?status=pending", severity: "warning" },
    { label: "Unassigned candidates", hint: "Active, but nobody assigned", value: unassignedActive,
      href: "/admin/applications", severity: "warning" },
  ];

  return (
    <div className="adm-stagger mx-auto w-full max-w-[1600px] space-y-4 pb-6 lg:space-y-5">
      <BrandBand
        title="Recruiting overview"
        meta={<>{today}{loadedAt && <> · Updated {loadedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}</>}
        stats={headStats}
        actions={
          <>
            <MenuSelect
              label="Date range"
              icon={IconCalendar}
              value={range}
              onChange={setRange}
              options={RANGES.map((r) => ({ value: r.value, label: r.long }))}
            />
            <WorkspaceButton onClick={() => void fetchAll()} disabled={refreshing} aria-label="Refresh dashboard">
              <RefreshCw className={refreshing ? "animate-spin" : undefined} aria-hidden="true" />
              Refresh
            </WorkspaceButton>
            <WorkspaceButton asChild className={BAND_PRIMARY}>
              <Link href="/admin/jobs/new">
                <Plus aria-hidden="true" />
                New job
              </Link>
            </WorkspaceButton>
          </>
        }
      />

      <MyTasksPanel />

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
        title="Pipeline and sourcing"
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
            <AdminCardHeader title="Candidate sourcing" subtitle="Share of applications by source" />
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
        title="Open role coverage"
        description="Roles that need sourcing, and how the pipeline splits by client."
        action={<PanelLink href="/admin/state-roles">All roles</PanelLink>}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Role coverage" subtitle="Active candidates per open role, thinnest first" />
            <RankedBars items={reqCoverage} emptyMessage="No open roles" />
          </AdminCard>

          <AdminCard className="overflow-hidden">
            <AdminCardHeader title="Pipeline by client" subtitle="Share of pipeline by client" />
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
            title="Recruiter performance"
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
