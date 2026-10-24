"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { Application, Job, TaskEntry } from "@/lib/aws/dynamodb";
import { BarChart, Sparkline } from "@/components/portal/charts";
import { FLOW, STAGE_LABEL, buckets, daysUntil, countIn, inPlayCount, needsCandidates, permissionsFor, reachedAt, tally, type Stage } from "@/components/portal/recruiting/model";
import TeamPerformancePanel from "@/components/portal/recruiting/TeamPerformance";
import TeamPerformance, { PERIODS, type Period } from "@/components/portal/performance/TeamPerformance";
import Icon, { type IconName } from "@/components/portal/icons";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import {
  BarList, Button, EmptyState, ErrorState, ProgressBar, Skeleton, usePortalRouter,
  ListHeader, MenuSelect, BTN_ICON, BTN_PRIMARY,
} from "@/components/portal/kit";
import { DeltaPill, type StatDelta } from "@/components/portal/ui";
import { sectionTone } from "@/components/portal/kit/tone";
import { TableTabs } from "@/components/portal/DataTable";
import { MY_TASKS_KEY, refreshApplications, refreshTasks, useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { useResource, type Resource } from "@/hooks/use-resource";
import { isPubliclyOpen, jobCategory } from "@/lib/job-status";
import { DAY, OFFER_STALE_DAYS, STALE_DAYS, TERMINAL, enteredStageAt, everReached, isStale, median } from "@/lib/pipeline";
import { DashboardBodySkeleton } from "./DashboardSkeleton";
import { ActivityChart, ActivityFeed, ConversionFunnel, RolesAtRisk, SourceTable, recentEvents, type FunnelStage, type SourceRow } from "./dashboard-widgets";

const RANGES = [
  { value: "7d", label: "7D", long: "last 7 days", days: 7 },
  { value: "30d", label: "30D", long: "last 30 days", days: 30 },
  { value: "90d", label: "90D", long: "last 90 days", days: 90 },
  { value: "1y", label: "12M", long: "last 12 months", days: 365 },
  { value: "all", label: "All", long: "all time", days: null },
] as const;
type RangeKey = (typeof RANGES)[number]["value"];
const DEFAULT_RANGE: RangeKey = "90d";
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

type Stats = {
  activeJobs: number;
  draftJobs: number;
  onHoldJobs: number;
  pausedJobs: number;
  closedJobs: number;
  monthlyApplications: { month: string; applications: number }[];
};
type MyTask = TaskEntry & { applicationId: string; candidateName?: string; jobTitle?: string };

/** A dashboard section, as Plane's home widgets: a plain heading above one bordered body. */
function Section({
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
    <section aria-label={title} className={`flex min-w-0 flex-col gap-3 ${className}`}>
      <header className="flex h-7 items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="truncate text-adm-base font-semibold text-navy-900">{title}</h2>
          {meta && <span className="truncate text-adm-xs text-mist-600">{meta}</span>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={`min-w-0 rounded-lg border border-mist-200 bg-mist-0 ${flush ? "overflow-hidden" : "p-4 sm:p-5"}`}>{children}</div>
    </section>
  );
}

/** One section, several views: underline tabs along the top of its body. */
function TabbedSection({ title, tabs, className = "" }: { title: string; tabs: { id: string; label: string; content: React.ReactNode }[]; className?: string }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <Section title={title} className={className} flush>
      <div role="tablist" aria-label={title} className="flex gap-5 scroll-strip border-b border-mist-200 px-4 sm:px-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={t.id === active}
            onClick={() => setActive(t.id)}
            className={`-mb-px h-10 shrink-0 whitespace-nowrap border-b-2 text-adm-base transition-colors duration-150 ${
              t.id === active ? "border-ocean-600 font-semibold text-navy-900" : "border-transparent text-mist-600 hover:border-mist-300 hover:text-navy-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab.id} role="tabpanel" className="kit-fade p-4 sm:p-5">
        {tab.content}
      </div>
    </Section>
  );
}

type Figure = { label: string; icon: IconName; value: number; href: string; delta?: StatDelta; note?: string; spark?: number[] };

/** Plane's analytics overview: the headline figures in one ruled strip, each opening its list. */
function FigureStrip({ items }: { items: Figure[] }) {
  return (
    <div className="grid gap-px overflow-hidden rounded-lg border border-mist-200 bg-mist-200 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((f) => (
        <Link key={f.label} href={f.href} className="group flex min-w-0 flex-col gap-3 bg-mist-0 p-4 transition-colors duration-150 hover:bg-mist-50 sm:p-5">
          <span className="flex items-center gap-2 text-adm-base text-mist-600">
            <Icon name={f.icon} className="size-4 shrink-0 text-mist-500" />
            <span className="truncate">{f.label}</span>
            <Icon name="chevronRight" className="ml-auto size-4 shrink-0 -translate-x-1 text-mist-500 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
          </span>
          <span className="flex items-end justify-between gap-3">
            <span className="text-adm-2xl font-semibold leading-none tracking-tight tabular-nums text-navy-900">{f.value}</span>
            {f.spark && <Sparkline values={f.spark} color={sectionTone.recruiting.spark} width={88} height={28} label={`${f.label} trend`} />}
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

/** "Good morning, Gagan" and today's date, as Plane's home opens. Time of day is read after mount. */
function Greeting({ first, updated }: { first: string; updated: Date | null }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const h = now?.getHours();
  const part = h === undefined ? null : h < 12 ? "morning" : h < 18 ? "afternoon" : "evening";
  return (
    <div className="kit-fade">
      <h1 className="text-adm-xl font-semibold tracking-tight text-navy-900">
        {part ? `Good ${part}` : "Hello"}
        {first ? `, ${first}` : ""}
      </h1>
      <p className="mt-1 text-adm-base text-mist-600">
        {now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : " "}
        {updated && <span> · Updated {updated.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>}
      </p>
    </div>
  );
}

const TONE_TEXT = { red: "text-status-danger", amber: "text-status-warning" } as const;

/** One attention row: what, why, how many. Two targets when the count spans both role lists. */
function AttentionRow({
  label,
  hint,
  value,
  tone,
  icon,
  href,
  split,
}: {
  label: string;
  hint: string;
  value: number;
  tone: "red" | "amber";
  icon: IconName;
  href: string;
  split?: { label: string; href: string }[];
}) {
  const mark = <Icon name={icon} className={`mt-0.5 size-4 shrink-0 ${value ? TONE_TEXT[tone] : "text-mist-500"}`} />;
  const count = <span className={`shrink-0 text-adm-md font-semibold tabular-nums ${value ? TONE_TEXT[tone] : "text-mist-600"}`}>{value}</span>;
  if (split)
    return (
      <li className="flex items-start gap-3 px-4 py-3">
        {mark}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-adm-base font-medium text-navy-900">{label}</span>
          <span className="block truncate text-adm-xs text-mist-600">{hint}</span>
          <span className="-ml-1.5 mt-1 flex flex-wrap gap-1">
            {split.map((s) => (
              <Link key={s.href} href={s.href} className="inline-flex h-7 items-center gap-0.5 rounded-md px-1.5 text-adm-xs font-medium text-ocean-700 transition-colors duration-150 hover:bg-ocean-50">
                {s.label}
                <Icon name="chevronRight" className="size-3.5" />
              </Link>
            ))}
          </span>
        </span>
        {count}
      </li>
    );
  return (
    <li>
      <Link href={href} className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-mist-50">
        {mark}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-adm-base font-medium text-navy-900">{label}</span>
          <span className="block truncate text-adm-xs text-mist-600">{hint}</span>
        </span>
        {count}
        <Icon name="chevronRight" className="mt-1 size-4 shrink-0 -translate-x-1 text-mist-500 opacity-0 transition-[opacity,transform] duration-150 group-hover:translate-x-0 group-hover:opacity-100" />
      </Link>
    </li>
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
    <Section
      title="My tasks"
      meta={tasks.length ? `${tasks.length} open` : undefined}
      flush
      action={
        overdue || dueToday ? (
          <span className="text-adm-xs font-medium">
            {overdue > 0 && <span className="text-status-danger">{overdue} overdue</span>}
            {overdue > 0 && dueToday > 0 && <span className="text-mist-600">, </span>}
            {dueToday > 0 && <span className="text-status-warning">{dueToday} due today</span>}
          </span>
        ) : undefined
      }
    >
      {res.isLoading ? (
        <ul className="grid gap-3 p-4" role="status" aria-label="Loading tasks">
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
        <div className="flex items-start gap-3 px-4 py-3.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-status-success-soft text-status-success">
            <Icon name="check" className="size-3.5" />
          </span>
          <span className="min-w-0">
            <span className="block text-adm-base font-medium text-navy-900">No open tasks</span>
            <span className="block text-adm-xs text-mist-600">Follow-ups you add on a candidate, or that teammates assign you, show here.</span>
          </span>
        </div>
      ) : (
        <ul className="divide-y divide-mist-100">
          {tasks.slice(0, 6).map((t) => {
            const late = !!t.dueAt && t.dueAt.slice(0, 10) < today;
            return (
              <li key={t.id} className="flex items-start gap-1 pl-1.5 pr-3 transition-colors duration-150 hover:bg-mist-50">
                <button
                  type="button"
                  aria-label={`Mark "${t.text}" done`}
                  title="Mark done"
                  disabled={busy === t.id}
                  onClick={() => void setDone(t, true)}
                  className="group grid size-10 shrink-0 place-items-center rounded-lg disabled:opacity-50"
                >
                  <span className="grid size-4 place-items-center rounded-full text-transparent ring-1 ring-inset ring-mist-400 transition-colors duration-150 group-hover:bg-kelp-700 group-hover:text-white group-hover:ring-kelp-700">
                    <Icon name="check" className="size-3" />
                  </span>
                </button>
                <Link href={`/portal/candidates/${t.applicationId}`} className="group min-w-0 flex-1 py-2 pr-2">
                  <span className="block truncate text-adm-base text-navy-900 group-hover:underline">{t.text}</span>
                  <span className="block truncate text-adm-xs text-mist-600">
                    {t.candidateName || "Unnamed"}
                    {t.dueAt && <span className={late ? "font-medium text-status-danger" : ""}>, due {dueLabel(t.dueAt)}</span>}
                  </span>
                </Link>
              </li>
            );
          })}
          {tasks.length > 6 && <li className="px-4 py-2.5 text-adm-xs text-mist-600">+{tasks.length - 6} more on candidate records</li>}
        </ul>
      )}
    </Section>
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

  const [recentTab, setRecentTab] = useState<"all" | "applied" | "moved">("all");
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

  const refreshing = appsRes.isValidating || jobsRes.isValidating;
  // Plane's page frame: the 44px header with the view tabs and controls, then the page on white.
  const frame = (content: React.ReactNode) => (
    <div className="-m-5 flex min-h-[calc(100svh-3.75rem-2px)] flex-col bg-mist-0 sm:-m-6 lg:-m-8">
      <ListHeader
        tabs={
          <TableTabs
            label="Dashboard view"
            value={view}
            onChange={(v) => setParams({ view: v === "team" ? "team" : null })}
            options={[
              { value: "overview", label: "Overview" },
              { value: "team", label: "Team performance" },
            ]}
          />
        }
      >
        {view === "team" ? (
          <MenuSelect label="Period" icon="calendar" value={teamPeriod} onChange={(v) => setParams({ period: v === "month" ? null : v })} options={PERIODS.map((x) => ({ value: x.id, label: x.label }))} />
        ) : (
          <MenuSelect label="Date range" icon="calendar" value={range} onChange={(v) => setParams({ range: v === DEFAULT_RANGE ? null : v })} options={RANGES.map((x) => ({ value: x.value, label: cap(x.long) }))} />
        )}
        <button
          type="button"
          onClick={() => void Promise.all([appsRes.reload(), jobsRes.reload(), statsRes.reload()])}
          disabled={refreshing}
          aria-label={refreshing ? "Refreshing" : "Refresh"}
          title="Refresh"
          className={`${BTN_ICON} disabled:opacity-60`}
        >
          <Icon name="refresh" className={`size-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} />
        </button>
        {canEditJobs && (
          <Link href="/portal/jobs/new" className={BTN_PRIMARY}>
            <Icon name="plus" className="size-4" />
            New role
          </Link>
        )}
      </ListHeader>
      <div className="grid w-full flex-1 content-start gap-8 bg-mist-50 px-4 py-6 sm:px-6 lg:px-8">{content}</div>
    </div>
  );

  if (view === "team")
    return frame(
      <>
        <h1 className="sr-only">Team performance</h1>
        <TeamPerformance period={teamPeriod} />
      </>,
    );

  let body: React.ReactNode;
  // The overview opens with its greeting as the h1; every other state names the page for screen readers
  let greeted = false;
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
  else {
    greeted = true;
    body = <Overview first={first} updated={loadedAt} all={all} apps={apps} jobs={jobs} titles={titles} range={r} start={start} stats={statsRes} recentTab={recentTab} setRecentTab={setRecentTab} onTeam={() => setParams({ view: "team" })} onStage={(s) => router.push(`/portal/applications?status=${s}`)} />;
  }

  return frame(
    <>
      {!greeted && <h1 className="sr-only">Dashboard</h1>}
      {body}
    </>,
  );
}

function Overview({
  first,
  updated,
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
  first: string;
  updated: Date | null;
  all: Application[];
  apps: Application[];
  jobs: Job[];
  titles: Map<string, string>;
  range: (typeof RANGES)[number];
  start: number | null;
  stats: Resource<{ stats?: Stats }>;
  recentTab: "all" | "applied" | "moved";
  setRecentTab: (v: "all" | "applied" | "moved") => void;
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
  const liveBy = { state: openJobs.filter((j) => jobCategory(j) === "state").length, open: openJobs.filter((j) => jobCategory(j) === "open").length };

  // Funnel rows: how many reached each stage, the share of the stage before, how long current holders wait
  const funnelStages: FunnelStage[] = funnel.map((f, i) => ({
    key: f.key,
    label: f.label,
    count: f.value,
    conversion: i > 0 && funnel[i - 1].value ? Math.round((f.value / funnel[i - 1].value) * 100) : null,
    medianDays: stageAges.find((x) => x.s === f.key)?.age ?? null,
  }));

  // Source effectiveness: volume and how far each source's people get
  const sourceRows: SourceRow[] = (() => {
    const m = new Map<string, SourceRow>();
    for (const a of apps) {
      const k = a.source || "Unattributed";
      const r = m.get(k) ?? { source: k, applicants: 0, interviewed: 0, hired: 0 };
      r.applicants++;
      if (everReached(a, "interview") || a.status === "hired") r.interviewed++;
      if (a.status === "hired") r.hired++;
      m.set(k, r);
    }
    return [...m.values()].sort((a, b) => b.applicants - a.applicants).slice(0, 8);
  })();

  // Live roles closing within a week or with nobody in play, soonest first
  const atRisk = openJobs
    .map((j) => ({ j, due: daysUntil(j.submissionDueDate), n: inPlayCount(j) }))
    .filter((x) => x.n === 0 || (x.due !== null && x.due <= 7))
    .sort((a, b) => (a.due ?? 999) - (b.due ?? 999) || a.n - b.n)
    .slice(0, 6)
    .map((x) => x.j);

  const events = recentEvents(all, 40).filter((e) => recentTab === "all" || e.kind === recentTab).slice(0, 6);

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
      <Greeting first={first} updated={updated} />

      <FigureStrip
        items={[
          { label: "Applications", icon: "inbox", value: apps.length, href: "/portal/applications", delta: vsPrev(appliedDelta), note: sources[0] && sources[0].label !== "Unattributed" ? `top source ${sources[0].label}` : prev ? undefined : r.long, spark: appliedSeries },
          { label: "Candidates in progress", icon: "activity", value: inProgress.length, href: "/portal/applications?status=inprogress", delta: vsPrev(inProgressDelta), note: `${openJobs.length ? (inProgress.length / openJobs.length).toFixed(1) : "0"} per live role`, spark: inProgressSeries },
          { label: "Interviews", icon: "calendar", value: interviews, href: "/portal/applications?status=interview", delta: vsPrev(interviewDelta), note: `${interviewingNow} interviewing now`, spark: interviewSeries },
          { label: "Placements", icon: "award", value: placements.length, href: "/portal/applications?status=hired", delta: vsPrev(placedDelta), note: timeToHire !== null ? `${timeToHire}d median to hire` : "no hires yet", spark: hiredSeries },
        ]}
      />

      {/* Two columns that flow on their own, as Plane's home does: the analysis wide on the left,
          what to act on in a rail on the right. Nothing stretches to match its neighbour. */}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-8">
          <Section title="Hiring activity" meta={cap(r.long)}>
            {apps.length || placements.length ? (
              <div className="grid gap-4">
                <ActivityChart
                  range={r.long}
                  labels={bs.map((b) => b.label)}
                  series={[{ name: "Applications", values: appliedSeries }, { name: "Hired", values: hiredSeries }, { name: "Rejected", values: rejectedSeries }]}
                />
                <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-mist-200 bg-mist-200">
                  {[
                    { label: "Offer acceptance", value: offerAcceptance !== null ? `${offerAcceptance}%` : "—", hint: "of decided offers" },
                    { label: "Median time to hire", value: timeToHire !== null ? `${timeToHire} days` : "—", hint: "application to hire" },
                  ].map((x) => (
                    <div key={x.label} className="bg-mist-0 px-3 py-2.5">
                      <dt className="text-adm-xs text-mist-600">{x.label}</dt>
                      <dd className="mt-0.5 flex items-baseline gap-2">
                        <span className="text-adm-md font-semibold text-navy-900">{x.value}</span>
                        <span className="text-adm-xs text-mist-600">{x.hint}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : (
              quiet("No applications in this period", "Pick a longer range to see the trend.")
            )}
          </Section>

          <Section title="Pipeline conversion" meta="Select a stage to open it">
            {apps.length ? (
              <div className="grid gap-4">
                <ConversionFunnel stages={funnelStages} />
                {bottleneck && (
                  <p className="flex items-center gap-2 text-adm-base text-mist-700">
                    <Icon name="timer" className="size-4 shrink-0 text-status-warning" />
                    <span>
                      <span className="font-medium text-navy-900">{STAGE_LABEL[bottleneck.s]}</span> is the bottleneck: people there have waited a median {bottleneck.age} days.
                    </span>
                  </p>
                )}
              </div>
            ) : (
              quiet("No applications in this period")
            )}
          </Section>

        </div>

        <div className="grid min-w-0 gap-8">
          <Section title="Needs attention" meta="Right now, every role" flush>
            {openJobs.length > 0 && (
              <div className="grid gap-2 border-b border-mist-200 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link href="/portal/state-roles?focus=live" className="text-adm-base font-medium text-navy-900 hover:underline">
                    <span className="text-adm-lg font-semibold">{openJobs.length}</span> live role{openJobs.length === 1 ? "" : "s"}
                  </Link>
                  <span className="truncate text-adm-xs text-mist-600">{liveBy.state} state · {liveBy.open} open</span>
                </div>
                <ProgressBar value={((openJobs.length - starved) / openJobs.length) * 100} tone={starved ? "amber" : "green"} />
                <p className="text-adm-xs text-mist-600">
                  {openJobs.length - starved} of {openJobs.length} have candidates in progress
                </p>
              </div>
            )}
            <ul className="divide-y divide-mist-100">
              <AttentionRow
                label="Roles with no candidates"
                hint="Live on the website, nobody in play"
                value={starved}
                tone="red"
                icon="briefcase"
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
              <AttentionRow label="Offers awaiting response" hint={`No answer for ${OFFER_STALE_DAYS}+ days`} value={offersAtRisk} tone="red" icon="mail" href="/portal/applications?status=offered" />
              <AttentionRow label="Stalled candidates" hint={`No stage change for ${STALE_DAYS}+ days`} value={stalled} tone="amber" icon="timer" href="/portal/applications?saved=stale" />
              <AttentionRow label="Unassigned candidates" hint="In progress, nobody owns them" value={unassigned} tone="red" icon="userPlus" href="/portal/applications?status=inprogress&owner=unassigned" />
            </ul>
          </Section>

          <Section title="Roles at risk" meta="Closing within a week or empty" flush>
            <RolesAtRisk jobs={atRisk} />
          </Section>


          <MyTasks />
        </div>
      </div>

      {/* Where people come from beside what just happened: two reads of the same flow */}
      <div className="grid items-start gap-8 lg:grid-cols-2">
          <Section title="Source effectiveness" meta="How far each source's applicants get">
            {sourceRows.length ? <SourceTable rows={sourceRows} /> : quiet("No source data yet")}
          </Section>
          <Section
            title="Recent activity"
            flush
            action={
              <MenuSelect
                label="Show"
                value={recentTab}
                onChange={setRecentTab}
                options={[
                  { value: "all", label: "Everything" },
                  { value: "applied", label: "Applications" },
                  { value: "moved", label: "Stage moves" },
                ]}
              />
            }
          >
            <ActivityFeed events={events} />
          </Section>
      </div>

      {/* The deeper views, full width under both columns */}
      <TabbedSection
        title="Insights"
        tabs={[
          { id: "team", label: "Team", content: <TeamPerformancePanel applications={all} titles={titles} onOpen={onTeam} /> },
          {
            id: "clients",
            label: "Pipeline by client",
            content: clientMix.length ? (
              <div className="grid gap-4">
                <BarList items={clientMix} />
                {topClientShare !== null && topClientShare >= 40 && (
                  <p className="text-adm-base text-mist-600">
                    <span className="font-medium text-navy-900">{clientMix[0].label}</span> holds{" "}
                    <span className="font-semibold text-status-warning">{topClientShare}%</span> of the pipeline.
                  </p>
                )}
              </div>
            ) : (
              quiet("No client data yet")
            ),
          },
          { id: "reqs", label: "Requisitions", content: statsBody(() => (reqMix.length ? <BarList items={reqMix} /> : quiet("No roles posted yet"))) },
          {
            id: "monthly",
            label: "Six months",
            content: statsBody((st) => (
              <BarChart title="Applications per month, last six months" labels={st.monthlyApplications.map((m) => m.month)} series={[{ name: "Applications", values: st.monthlyApplications.map((m) => m.applications) }]} height={220} />
            )),
          },
        ]}
      />
    </>
  );
}
