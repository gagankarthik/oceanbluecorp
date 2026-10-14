"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Application, Job, TaskEntry } from "@/lib/aws/dynamodb";
import { BarChart, DonutChart, TrendChart } from "@/components/portal/charts";
import { StageBadge, StageFunnel } from "@/components/portal/recruiting/bits";
import { FLOW, STAGE_LABEL, buckets, countIn, inPlayCount, needsCandidates, permissionsFor, reachedAt, tally, type Stage } from "@/components/portal/recruiting/model";
import TeamPerformancePanel from "@/components/portal/recruiting/TeamPerformance";
import TeamPerformance, { PERIODS, type Period } from "@/components/portal/performance/TeamPerformance";
import Icon from "@/components/portal/icons";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import {
  Avatar, BarList, Button, EmptyState, ErrorState, KpiRow, Page, PageHeader, Panel, ProgressBar, Segmented, Skeleton, StatCard, usePortalRouter,
} from "@/components/portal/kit";
import { MY_TASKS_KEY, refreshApplications, refreshTasks, useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { useResource, type Resource } from "@/hooks/use-resource";
import { fmtRelative } from "@/lib/format";
import { isPubliclyOpen, jobCategory } from "@/lib/job-status";
import { DAY, OFFER_STALE_DAYS, STALE_DAYS, TERMINAL, enteredStageAt, everReached, isStale, median } from "@/lib/pipeline";
import { DashboardBodySkeleton } from "./DashboardSkeleton";

const RANGES = [
  { value: "7d", label: "7D", long: "last 7 days", days: 7 },
  { value: "30d", label: "30D", long: "last 30 days", days: 30 },
  { value: "90d", label: "90D", long: "last 90 days", days: 90 },
  { value: "1y", label: "12M", long: "last 12 months", days: 365 },
  { value: "all", label: "All", long: "all time", days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["value"];
const DEFAULT_RANGE: RangeKey = "90d";

type Stats = {
  activeJobs: number;
  draftJobs: number;
  onHoldJobs: number;
  pausedJobs: number;
  closedJobs: number;
  monthlyApplications: { month: string; applications: number }[];
};
/** KPI card as a link: hover firms the hairline instead of lifting a shadow */
const kpiLink = "block rounded-xl [&>div]:transition-shadow [&>div]:duration-150 hover:[&>div]:ring-mist-400";
type MyTask = TaskEntry & { applicationId: string; candidateName?: string; jobTitle?: string };

/** One panel, several views: keeps secondary charts off the page until asked for */
function TabbedPanel({ tabs, className = "" }: { tabs: { id: string; label: string; content: React.ReactNode }[]; className?: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <section aria-label="More insights" className={`flex min-w-0 flex-col rounded-xl bg-mist-0 ring-1 ring-mist-200 ${className}`}>
      <div role="tablist" aria-label="More insights" className=" flex gap-1 scroll-strip border-b border-mist-200 px-3 pt-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`-mb-px min-h-10 shrink-0 whitespace-nowrap border-b-2 px-3 text-[14px] font-medium transition-colors duration-150 ${
              t.id === active ? "border-ocean-600 text-navy-900" : "border-transparent text-mist-600 hover:text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" className="flex-1 p-5">
        {tab.content}
      </div>
    </section>
  );
}

/** One attention row: a count and where to act on it. Two targets when the count spans both role lists. */
function AttentionRow({ label, hint, value, tone, href, split }: { label: string; hint: string; value: number; tone: "red" | "amber"; href: string; split?: { label: string; href: string }[] }) {
  const badge = !value ? "bg-mist-100 text-mist-500" : tone === "red" ? "bg-[#fef3f2] text-[#b42318]" : "bg-[#fffaeb] text-[#b54708]";
  const count = <span className={`grid h-8 min-w-10 shrink-0 place-items-center rounded-md px-2 text-[14px] font-semibold tabular-nums ${badge}`}>{value}</span>;
  if (split)
    return (
      // Rail width: the two targets sit under the label rather than beside it
      <div className="flex min-h-12 items-start gap-3 rounded-lg p-2">
        {count}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-medium text-navy-900">{label}</span>
          <span className="block truncate text-[12px] text-mist-600">{hint}</span>
          <span className="-ml-2 mt-1 flex flex-wrap gap-1">
            {split.map((s) => (
              <Link key={s.href} href={s.href} className="inline-flex min-h-8 items-center gap-0.5 rounded-md px-2 text-[13px] font-medium text-ocean-700 transition-colors duration-150 hover:bg-ocean-50">
                {s.label}
                <Icon name="chevronRight" className="size-3.5" />
              </Link>
            ))}
          </span>
        </span>
      </div>
    );
  return (
    <Link href={href} className="flex min-h-12 items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-mist-50">
      {count}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-navy-900">{label}</span>
        <span className="block truncate text-[12px] text-mist-600">{hint}</span>
      </span>
      <Icon name="chevronRight" className="size-4 shrink-0 text-mist-400" />
    </Link>
  );
}

const dueLabel = (iso: string) => new Date(iso.length === 10 ? iso + "T12:00:00" : iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

/** Open follow-ups assigned to the viewer, soonest first */
function MyTasks() {
  const notify = useToast();
  const res = useResource<{ tasks?: MyTask[] }>(MY_TASKS_KEY);
  const [busy, setBusy] = useState<string | null>(null);
  const tasks = res.data?.tasks ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const setDone = async (t: MyTask, done: boolean) => {
    setBusy(t.id);
    const prev = res.data;
    if (done) res.setData((d) => ({ ...d, tasks: (d?.tasks ?? []).filter((x) => x.id !== t.id) }));
    try {
      const r = await fetch(`/api/applications/${t.applicationId}/tasks`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "update", taskId: t.id, done }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Couldn't update the task. Try again.");
      void refreshTasks();
      void refreshApplications();
      if (done) notify("Task done", { undo: () => void setDone(t, false) });
      else notify("Task reopened");
    } catch (e) {
      if (prev && done) res.setData(prev);
      notify(e instanceof Error ? e.message : "Couldn't update the task. Try again.", { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const overdue = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) < today).length;
  const dueToday = tasks.filter((t) => t.dueAt && t.dueAt.slice(0, 10) === today).length;
  // Roles the tasks API refuses see no panel.
  const status = (res.error as { status?: number } | undefined)?.status;
  if (status === 401 || status === 403) return null;
  return (
    <Panel
      title={`My tasks${tasks.length ? ` (${tasks.length})` : ""}`}
      action={
        overdue || dueToday ? (
          <span className="text-[13px] font-medium">
            {overdue > 0 && <span className="text-[#b42318]">{overdue} overdue</span>}
            {overdue > 0 && dueToday > 0 && <span className="text-mist-500">, </span>}
            {dueToday > 0 && <span className="text-[#b54708]">{dueToday} due today</span>}
          </span>
        ) : undefined
      }
    >
      {res.isLoading ? (
        <ul className="grid gap-3" role="status" aria-label="Loading tasks">
          {[0, 1, 2].map((i) => (
            <li key={i} className="flex items-start gap-3 p-2">
              <Skeleton className="size-5 shrink-0 rounded-md" />
              <span className="grid flex-1 gap-1.5">
                <Skeleton className={`h-3.5 ${i === 1 ? "w-1/2" : "w-2/3"}`} />
                <Skeleton className="h-3 w-1/3" />
              </span>
            </li>
          ))}
        </ul>
      ) : res.error && !res.data ? (
        <EmptyState compact icon="alert" title="Couldn't load your tasks" action={<Button size="sm" variant="secondary" icon="refresh" loading={res.isValidating} onClick={() => void res.reload()}>Try again</Button>} />
      ) : tasks.length === 0 ? (
        <EmptyState compact icon="check" title="No open tasks" body="Follow-ups you add on a candidate's record, or that teammates assign you, show here." />
      ) : (
        <ul className="grid gap-1">
          {tasks.slice(0, 6).map((t) => {
            const late = !!t.dueAt && t.dueAt.slice(0, 10) < today;
            return (
              <li key={t.id} className="flex items-start gap-1 rounded-lg transition-colors duration-150 hover:bg-mist-50">
                <button
                  type="button"
                  aria-label={`Mark "${t.text}" done`}
                  disabled={busy === t.id}
                  onClick={() => void setDone(t, true)}
                  className="group grid size-10 shrink-0 place-items-center rounded-lg disabled:opacity-50"
                >
                  <span className="grid size-5 place-items-center rounded-md text-transparent ring-1 ring-inset ring-mist-400 transition-colors group-hover:text-ocean-700 group-hover:ring-ocean-600">
                    <Icon name="check" className="size-3.5" />
                  </span>
                </button>
                <Link href={`/portal/candidates/${t.applicationId}`} className="group min-w-0 flex-1 py-2 pr-2">
                  <span className="block truncate text-[14px] text-navy-900 group-hover:underline">{t.text}</span>
                  <span className="block truncate text-[12px] text-mist-600">
                    {t.candidateName || "Unnamed"}
                    {t.dueAt && <span className={late ? "font-medium text-[#b42318]" : ""}>, due {dueLabel(t.dueAt)}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
          {tasks.length > 6 && <li className="px-2 pt-1 text-[12px] text-mist-600">+{tasks.length - 6} more on candidate records</li>}
        </ul>
      )}
    </Panel>
  );
}

export default function Dashboard() {
  const { user, role } = useSession();
  const { canEditJobs } = permissionsFor(role);
  const params = useSearchParams();
  const router = usePortalRouter();
  const pathname = usePathname();

  // View and range live in the URL so a link can be shared.
  const view = params.get("view") === "team" ? "team" : "overview";
  const rangeParam = params.get("range");
  const range: RangeKey = RANGES.some((x) => x.value === rangeParam) ? (rangeParam as RangeKey) : DEFAULT_RANGE;
  const periodParam = params.get("period");
  const teamPeriod: Period = PERIODS.some((x) => x.id === periodParam) ? (periodParam as Period) : "month";
  const setParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) next.delete(k);
      else next.set(k, v);
    }
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const [recentTab, setRecentTab] = useState<"all" | "interview" | "offered">("all");
  const appsRes = useApplicationSummaries();
  const jobsRes = useJobSummaries();
  const statsRes = useResource<{ stats?: Stats }>("/api/admin/stats");
  const loadedAt = useMemo(() => (appsRes.data && jobsRes.data ? new Date() : null), [appsRes.data, jobsRes.data]);

  const jobs = useMemo(() => jobsRes.jobs ?? [], [jobsRes.jobs]);
  const titles = useMemo(() => new Map(jobs.map((j) => [j.id, j.title])), [jobs]);
  const all: Application[] = useMemo(
    () => (appsRes.applications ?? []).map((a) => ({ ...a, jobTitle: a.jobTitle || (a.jobId ? titles.get(a.jobId) : "") || "" })),
    [appsRes.applications, titles],
  );

  const r = RANGES.find((x) => x.value === range)!;
  const start = r.days === null ? null : Date.now() - r.days * DAY;
  const apps = useMemo(() => (start === null ? all : all.filter((a) => new Date(a.appliedAt).getTime() >= start)), [all, start]);

  const first = user.name.split(" ")[0];
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  const header = (
    <PageHeader
      icon="dashboard"
      title={first ? `Welcome back, ${first}` : "Welcome back"}
      description={
        <>
          {date}
          {loadedAt && <>, updated {loadedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</>}
        </>
      }
      actions={
        <>
          <Button
            variant="ghost"
            icon="refresh"
            loading={appsRes.isValidating || jobsRes.isValidating}
            onClick={() => void Promise.all([appsRes.reload(), jobsRes.reload(), statsRes.reload()])}
          >
            Refresh
          </Button>
          {role === "sales" && <Button href="/portal/state-roles" variant="secondary" icon="capitol">State roles</Button>}
          {role === "hr" && <Button href="/portal/resumes" variant="secondary" icon="resume">Resumes</Button>}
          <Button href="/portal/applications" variant="secondary" icon="inbox">Applications</Button>
          {canEditJobs && <Button href="/portal/jobs/new" icon="plus">New role</Button>}
        </>
      }
      tabs={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            label="Dashboard view"
            value={view}
            onChange={(v) => setParams({ view: v === "team" ? "team" : null })}
            options={[
              { value: "overview", label: "Overview", icon: "dashboard" },
              { value: "team", label: "Team performance", icon: "target" },
            ]}
          />
          {view === "team" ? (
            <Segmented label="Period" value={teamPeriod} onChange={(v) => setParams({ period: v === "month" ? null : v })} options={PERIODS.map((x) => ({ value: x.id, label: x.label }))} />
          ) : (
            <Segmented label="Date range" value={range} onChange={(v) => setParams({ range: v === DEFAULT_RANGE ? null : v })} options={RANGES.map((x) => ({ value: x.value, label: x.label }))} />
          )}
        </div>
      }
    />
  );

  if (view === "team") {
    return (
      <Page>
        {header}
        <TeamPerformance period={teamPeriod} />
      </Page>
    );
  }

  let body: React.ReactNode;
  if (appsRes.isLoading || jobsRes.isLoading) body = <DashboardBodySkeleton />;
  else if ((!appsRes.applications && appsRes.error) || (!jobsRes.jobs && jobsRes.error))
    body = (
      <ErrorState
        title="Couldn't load the dashboard"
        message={(appsRes.error ?? jobsRes.error)?.message}
        onRetry={() => void Promise.all([appsRes.reload(), jobsRes.reload()])}
        retrying={appsRes.isValidating || jobsRes.isValidating}
      />
    );
  else if (jobs.length === 0 && all.length === 0)
    body = (
      <EmptyState
        framed
        variant="first-use"
        icon="briefcase"
        title={canEditJobs ? "Post your first role" : "Nothing to report yet"}
        body={
          canEditJobs
            ? "Live roles, applicants, interviews and placements show here once a role is posted. It stays a draft until you set it to Active."
            : "Live roles, applicants and your follow-ups show here once a job editor posts the first role."
        }
        primary={canEditJobs ? { label: "Post a role", icon: "plus", href: "/portal/jobs/new" } : undefined}
        secondary={{ label: "Add applicant", icon: "inbox", href: "/portal/applications/new" }}
      />
    );
  else body = <Overview all={all} apps={apps} jobs={jobs} titles={titles} range={r} start={start} stats={statsRes} recentTab={recentTab} setRecentTab={setRecentTab} onTeam={() => setParams({ view: "team" })} onStage={(s) => router.push(`/portal/applications?status=${s}`)} />;

  return (
    <Page>
      {header}
      {body}
    </Page>
  );
}

function Overview({
  all,
  apps,
  jobs,
  titles,
  range: r,
  start,
  stats: statsRes,
  recentTab,
  setRecentTab,
  onTeam,
  onStage,
}: {
  all: Application[];
  apps: Application[];
  jobs: Job[];
  titles: Map<string, string>;
  range: (typeof RANGES)[number];
  start: number | null;
  stats: Resource<{ stats?: Stats }>;
  recentTab: "all" | "interview" | "offered";
  setRecentTab: (v: "all" | "interview" | "offered") => void;
  onTeam: () => void;
  onStage: (s: Stage) => void;
}) {
  // Current counts (live roles, attention, in progress) ignore the range; flows (applied, placed) follow it.
  const openJobs = jobs.filter((j) => isPubliclyOpen(j.status));
  const inProgress = all.filter((a) => !TERMINAL.has(a.status));
  const bs = buckets(r.days ?? 365);
  const appliedSeries = countIn(bs, apps.map((a) => new Date(a.appliedAt).getTime()));
  const hiredSeries = countIn(bs, all.filter((a) => a.status === "hired").map((a) => reachedAt(a, "hired")));
  const interviewSeries = countIn(bs, all.map((a) => reachedAt(a, "interview")));
  const placements = all.filter((a) => a.status === "hired" && (start === null || (reachedAt(a, "hired") ?? 0) >= start));
  const rejectedAt = (a: Application) => {
    const h = (a.statusHistory ?? []).find((x) => x.status === "rejected");
    return h ? new Date(h.changedAt).getTime() : new Date(a.appliedAt).getTime();
  };
  const rejectedSeries = countIn(bs, all.filter((a) => a.status === "rejected").map(rejectedAt));
  // Same-length window just before this one, for the change figures.
  const prev = r.days === null ? null : { start: Date.now() - 2 * r.days * DAY, end: Date.now() - r.days * DAY };
  const inPrev = (t: number | null) => prev !== null && t !== null && t >= prev.start && t < prev.end;
  const prevApplied = prev ? all.filter((a) => inPrev(new Date(a.appliedAt).getTime())).length : 0;
  const prevPlaced = prev ? all.filter((a) => a.status === "hired" && inPrev(reachedAt(a, "hired"))).length : 0;
  const delta = (now: number, before: number) => (prev && before > 0 ? Math.round(((now - before) / before) * 100) : null);
  const appliedDelta = delta(apps.length, prevApplied);
  const placedDelta = delta(placements.length, prevPlaced);
  // In progress at time t: applied by then and not yet hired or rejected.
  const inProgressAt = (t: number) => all.filter((a) => new Date(a.appliedAt).getTime() <= t && !(TERMINAL.has(a.status) && enteredStageAt(a) <= t)).length;
  const inProgressSeries = bs.map((b) => inProgressAt(b.end));
  const inProgressDelta = prev ? delta(inProgress.length, inProgressAt(prev.end)) : null;
  const interviews = all.filter((a) => {
    const t = reachedAt(a, "interview");
    return t !== null && (start === null || t >= start);
  }).length;
  const interviewDelta = delta(interviews, prev ? all.filter((a) => inPrev(reachedAt(a, "interview"))).length : 0);
  const interviewingNow = all.filter((a) => a.status === "interview").length;
  const span = r.long.replace(/^last /, "");
  // No delta row for "all time": there is no previous window.
  const vsPrev = (value: number | null) => (prev ? { value, label: value === null ? `for previous ${span}` : `vs previous ${span}` } : undefined);
  const offeredEver = apps.filter((a) => everReached(a, "offered"));
  const decided = offeredEver.filter((a) => a.status === "hired" || a.status === "rejected");
  const offerAcceptance = decided.length ? Math.round((decided.filter((a) => a.status === "hired").length / decided.length) * 100) : null;
  const timeToHire = median(placements.map((a) => Math.max(0, Math.round(((reachedAt(a, "hired") ?? 0) - new Date(a.appliedAt).getTime()) / DAY))));

  const funnel = [...FLOW, "hired" as Stage].map((s, i) => ({
    label: s === "pending" ? "Applied" : STAGE_LABEL[s],
    value: s === "hired" ? apps.filter((a) => a.status === "hired").length : apps.filter((a) => a.status === "hired" || FLOW.slice(i).some((f) => everReached(a, f))).length,
    key: s,
  }));
  const stageAges = FLOW.map((s) => ({ s, age: median(apps.filter((a) => a.status === s).map((a) => Math.floor((Date.now() - enteredStageAt(a)) / DAY))) }));
  const bottleneck = stageAges.filter((x) => x.age !== null && x.age > STALE_DAYS).sort((a, b) => (b.age ?? 0) - (a.age ?? 0))[0];

  // Each count uses the same rule as the list it opens, so the numbers agree.
  const starvedBy = { state: openJobs.filter((j) => jobCategory(j) === "state" && needsCandidates(j)).length, open: openJobs.filter((j) => jobCategory(j) === "open" && needsCandidates(j)).length };
  const starved = starvedBy.state + starvedBy.open;
  const stalled = all.filter((a) => isStale(a)).length;
  const offersAtRisk = all.filter((a) => a.status === "offered" && enteredStageAt(a) < Date.now() - OFFER_STALE_DAYS * DAY).length;
  const unassigned = inProgress.filter((a) => !a.ownership && !a.ownershipName).length;
  const coverage = openJobs.map((j) => ({ j, n: inPlayCount(j) })).sort((a, b) => a.n - b.n);
  const liveBy = { state: openJobs.filter((j) => jobCategory(j) === "state").length, open: openJobs.filter((j) => jobCategory(j) === "open").length };

  const recent = [...all]
    .filter((a) => recentTab === "all" || a.status === recentTab)
    .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt))
    .slice(0, 6);

  const sources = tally(apps.map((a) => a.source || "Unattributed"));
  const jobById = new Map(jobs.map((j) => [j.id, j]));
  const clientMix = tally(apps.map((a) => (a.jobId && jobById.get(a.jobId)?.clientName) || "Unattributed"), 6);
  const clientTotal = clientMix.reduce((n, c) => n + c.value, 0);
  const topClientShare = clientTotal && clientMix.length ? Math.round((clientMix[0].value / clientTotal) * 100) : null;
  const stats = statsRes.data?.stats;
  const reqMix = stats
    ? [
        { label: "Live", value: stats.activeJobs },
        { label: "Draft", value: stats.draftJobs },
        { label: "On hold", value: stats.onHoldJobs + stats.pausedJobs },
        { label: "Closed", value: stats.closedJobs },
      ].filter((x) => x.value > 0)
    : [];

  const statsBody = (render: (s: Stats) => React.ReactNode) =>
    stats ? (
      render(stats)
    ) : statsRes.error ? (
      <EmptyState compact icon="alert" title="Couldn't load these figures" action={<Button size="sm" variant="secondary" icon="refresh" loading={statsRes.isValidating} onClick={() => void statsRes.reload()}>Try again</Button>} />
    ) : (
      <Skeleton className="h-40 w-full rounded-lg" />
    );
  const quiet = (title: string, body?: string) => <EmptyState compact title={title} body={body} />;

  return (
    <>
      <KpiRow>
        <Link href="/portal/applications" className={kpiLink}>
          <StatCard section="recruiting" label="Applications" value={apps.length} delta={vsPrev(appliedDelta)} change={sources[0] && sources[0].label !== "Unattributed" ? `Top source: ${sources[0].label}` : undefined} hint={prev ? undefined : r.long} spark={appliedSeries} />
        </Link>
        <Link href="/portal/applications?status=inprogress" className={kpiLink}>
          <StatCard section="recruiting" label="Candidates in progress" value={inProgress.length} delta={vsPrev(inProgressDelta)} change={`${openJobs.length ? (inProgress.length / openJobs.length).toFixed(1) : "0"} per live role`} hint="now" spark={inProgressSeries} />
        </Link>
        <Link href="/portal/applications?status=interview" className={kpiLink}>
          <StatCard section="recruiting" label="Interviews" value={interviews} delta={vsPrev(interviewDelta)} change={`${interviewingNow} interviewing now`} hint={prev ? undefined : r.long} spark={interviewSeries} />
        </Link>
        <Link href="/portal/applications?status=hired" className={kpiLink}>
          <StatCard section="recruiting" label="Placements" value={placements.length} delta={vsPrev(placedDelta)} change={timeToHire !== null ? `${timeToHire}d median to hire` : "No hires yet"} hint={prev ? undefined : r.long} spark={hiredSeries} />
        </Link>
      </KpiRow>

      {/* Z order: trend wide on the left, the queues in a rail on the right; below xl the rail follows the trend */}
      <div className="grid gap-6 xl:grid-cols-3 xl:grid-rows-[auto_1fr]">
        <Panel title="Applications and hires" className="xl:col-span-2">
          {apps.length || placements.length ? (
            <div className="grid gap-4">
              <TrendChart
                title={`Applications received, hires and rejections, ${r.long}`}
                labels={bs.map((b) => b.label)}
                series={[{ name: "Applications", values: appliedSeries }, { name: "Hired", values: hiredSeries }, { name: "Rejected", values: rejectedSeries }]}
                area
              />
              <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-mist-200 pt-3 text-[13px]">
                {[
                  { label: "Applications", value: apps.length },
                  { label: "Placements", value: placements.length },
                  { label: "Rejected", value: rejectedSeries.reduce((n, v) => n + v, 0) },
                  { label: "Offer acceptance", value: offerAcceptance !== null ? `${offerAcceptance}%` : "–" },
                ].map((x) => (
                  <div key={x.label} className="flex items-baseline gap-1.5">
                    <dt className="text-mist-600">{x.label}</dt>
                    <dd className="font-semibold tabular-nums text-navy-900">{x.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : (
            quiet("No applications in this period", "Pick a longer range to see the trend.")
          )}
        </Panel>

        <aside aria-label="Needs attention and tasks" className="grid min-w-0 content-start gap-6 lg:grid-cols-2 lg:[&>*:only-child]:col-span-2 xl:col-start-3 xl:row-span-2 xl:row-start-1 xl:grid-cols-1">
          <Panel title="Needs attention" description="Right now, across every role">
            {openJobs.length > 0 && (
              <div className="mb-3 grid gap-2 border-b border-mist-200 pb-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href="/portal/state-roles?focus=live" className="text-[14px] font-medium text-navy-900 hover:underline">
                    <span className="text-[20px] font-semibold tabular-nums">{openJobs.length}</span> live role{openJobs.length === 1 ? "" : "s"}
                  </Link>
                  <span className="truncate text-[13px] text-mist-600">{liveBy.state} state, {liveBy.open} open</span>
                </div>
                <ProgressBar value={((openJobs.length - starved) / openJobs.length) * 100} tone={starved ? "amber" : "green"} />
                <p className="text-[12px] text-mist-600">
                  {openJobs.length - starved} of {openJobs.length} have candidates in progress
                </p>
              </div>
            )}
            <div className="grid gap-1">
              <AttentionRow
                label="Roles with no candidates"
                hint="Live on the website, nobody in play"
                value={starved}
                tone="red"
                href={`/portal/${starvedBy.open > starvedBy.state ? "open" : "state"}-roles?focus=starved`}
                split={
                  starvedBy.state && starvedBy.open
                    ? [
                        { label: `${starvedBy.state} state`, href: "/portal/state-roles?focus=starved" },
                        { label: `${starvedBy.open} open`, href: "/portal/open-roles?focus=starved" },
                      ]
                    : undefined
                }
              />
              <AttentionRow label="Offers awaiting response" hint={`No answer for ${OFFER_STALE_DAYS}+ days`} value={offersAtRisk} tone="red" href="/portal/applications?status=offered" />
              <AttentionRow label="Stalled candidates" hint={`In progress, no stage change for ${STALE_DAYS}+ days`} value={stalled} tone="amber" href="/portal/applications?saved=stale" />
              <AttentionRow label="Unassigned candidates" hint="In progress, nobody owns them" value={unassigned} tone="red" href="/portal/applications?status=inprogress&owner=unassigned" />
            </div>
          </Panel>
          <MyTasks />
        </aside>

        <Panel title="Hiring funnel" className="xl:col-span-2" description="Click a stage to open it">
          {apps.length ? (
            <div className="grid gap-4">
              <StageFunnel stages={funnel} onSelect={(label) => { const s = funnel.find((f) => f.label === label)?.key; if (s) onStage(s); }} />
              {bottleneck && (
                <p className="text-[13px] text-mist-600">
                  <span className="font-medium text-navy-900">{STAGE_LABEL[bottleneck.s]}</span> is the slowest stage, at a median of {bottleneck.age} days.
                </p>
              )}
            </div>
          ) : (
            quiet("No applications in this period")
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <TabbedPanel
          className="xl:col-span-2"
          tabs={[
            {
              id: "team",
              label: "Team",
              content: <TeamPerformancePanel applications={all} titles={titles} onOpen={onTeam} />,
            },
            {
              id: "coverage",
              label: "Role coverage",
              content: coverage.length ? (
                <div className="grid gap-3">
                  <p className="text-[13px] text-mist-600">Candidates in progress per live role, thinnest first.</p>
                  <ul className="grid gap-1">
                    {coverage.slice(0, 8).map(({ j, n }) => (
                      <li key={j.id}>
                        <Link href={`/portal/jobs/${j.id}`} className="flex min-h-10 items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-mist-50">
                          <span className={`w-10 shrink-0 rounded-md py-1 text-center text-[13px] font-semibold tabular-nums ${n === 0 ? "bg-[#fef3f2] text-[#b42318]" : n < 3 ? "bg-[#fffaeb] text-[#b54708]" : "bg-ocean-50 text-ocean-700"}`}>{n}</span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-navy-900">{j.title}</span>
                            <span className="block truncate text-[12px] text-mist-600">{j.clientName || j.department || j.postingId}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                quiet("No live roles", "Set a role to Active to put it on the website.")
              ),
            },
            {
              id: "sources",
              label: "Sources",
              content: sources.length ? <DonutChart title="Applications by source" data={sources} centerLabel="Applications" size={160} /> : quiet("No source data yet"),
            },
            {
              id: "clients",
              label: "Pipeline by client",
              content: clientMix.length ? (
                <div className="grid gap-4">
                  <BarList items={clientMix} />
                  {topClientShare !== null && topClientShare >= 40 && (
                    <p className="text-[13px] text-mist-600">
                      <span className="font-medium text-navy-900">{clientMix[0].label}</span> holds{" "}
                      <span className="font-semibold text-[#b54708]">{topClientShare}%</span> of the pipeline.
                    </p>
                  )}
                </div>
              ) : (
                quiet("No client data yet")
              ),
            },
            {
              id: "reqs",
              label: "Requisitions",
              content: statsBody(() => (reqMix.length ? <DonutChart title="Requisitions by status" data={reqMix} centerLabel="Roles" size={160} /> : quiet("No roles posted yet"))),
            },
            {
              id: "monthly",
              label: "Six months",
              content: statsBody((s) => (
                <BarChart title="Applications per month, last six months" labels={s.monthlyApplications.map((m) => m.month)} series={[{ name: "Applications", values: s.monthlyApplications.map((m) => m.applications) }]} height={220} />
              )),
            },
          ]}
        />
        <Panel
          title="Recent applications"
          action={
            <Segmented
              label="Activity filter"
              size="sm"
              value={recentTab}
              onChange={setRecentTab}
              options={[
                { value: "all", label: "Latest" },
                { value: "interview", label: "Interviews" },
                { value: "offered", label: "Offers" },
              ]}
            />
          }
        >
          {recent.length === 0 ? (
            quiet(recentTab === "all" ? "No applications yet" : recentTab === "interview" ? "Nobody interviewing" : "No offers out")
          ) : (
            <ul className="grid gap-1">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/portal/candidates/${a.id}`} className="flex min-h-12 items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-mist-50">
                    <Avatar name={a.name || a.email} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-navy-900">{a.name || "Unnamed"}</span>
                      <span className="block truncate text-[12px] text-mist-600">{a.jobTitle || "No role"}, {fmtRelative(a.appliedAt)}</span>
                    </span>
                    <StageBadge stage={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
