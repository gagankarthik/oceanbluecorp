"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import { BarChart, Funnel, Sparkline, TrendChart } from "@/components/portal/charts";
import DataTable, { Drawer, type Column } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import { Avatar, EmptyState, ErrorState, KpiRow, ListPageSkeleton, Panel, Segmented, StatCard } from "@/components/portal/kit";
import { buckets, countIn, reachedAt, type Bucket } from "@/components/portal/recruiting/model";
import { useApplicationSummaries, useJobSummaries, useUserDirectory } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { DAY, TERMINAL, median } from "@/lib/pipeline";

export type Period = "month" | "quarter" | "year";
export const PERIODS: { id: Period; label: string; days: number }[] = [
  { id: "month", label: "Last 30 days", days: 30 },
  { id: "quarter", label: "Last 90 days", days: 90 },
  { id: "year", label: "Last 12 months", days: 365 },
];

export type Scorecard = {
  id: string;
  name: string;
  active: number;
  submitted: number;
  interviews: number;
  offers: number;
  placements: number;
  submitToInterview: number | null;
  interviewToHire: number | null;
  daysToHire: number | null;
  trend: number[];
  placed: { id: string; name: string; job: string; at: number }[];
};

type Owner = { id: string; sub?: string; name?: string; email: string };

/**
 * One owner per person. Claims store the Cognito sub and the picker the
 * directory id (with the email as name when the profile had none), so match
 * on id, sub, email or name before falling back to the stored text.
 */
function ownerOf(people: Owner[]) {
  const idx = new Map<string, Owner>();
  for (const p of people) {
    for (const k of [p.id, p.sub, p.email, p.name]) if (k) idx.set(k.toLowerCase(), p);
  }
  return (a: Application) => {
    const p = (a.ownership && idx.get(a.ownership.toLowerCase())) || (a.ownershipName && idx.get(a.ownershipName.toLowerCase()));
    if (p) return { key: p.id, name: p.name || p.email };
    const name = a.ownershipName || "Unassigned";
    return { key: name, name };
  };
}

/** Per-owner pipeline figures over a window, from the application records themselves. */
export function scorecards(apps: Application[], days: number, titles: Map<string, string>, people: Owner[] = []): { rows: Scorecard[]; weeks: Bucket[] } {
  const start = Date.now() - days * DAY;
  const weeks = buckets(days);
  const inWindow = (t: number | null) => t !== null && t >= start;
  const owner = ownerOf(people);
  const groups = new Map<string, { name: string; list: Application[] }>();
  for (const a of apps) {
    const { key, name } = owner(a);
    const g = groups.get(key);
    if (g) g.list.push(a);
    else groups.set(key, { name, list: [a] });
  }
  const rows = [...groups.entries()].map(([id, { name, list }]): Scorecard => {
    const at = (s: string) => list.map((a) => reachedAt(a, s));
    const n = (s: string) => at(s).filter(inWindow).length;
    const hires = list.filter((a) => a.status === "hired" && inWindow(reachedAt(a, "hired")));
    const submitted = n("submitted");
    const interviews = n("interview");
    const placements = hires.length;
    return {
      id,
      name,
      active: list.filter((a) => !TERMINAL.has(a.status)).length,
      submitted,
      interviews,
      offers: n("offered"),
      placements,
      submitToInterview: submitted ? interviews / submitted : null,
      interviewToHire: interviews ? placements / interviews : null,
      daysToHire: median(hires.map((a) => Math.max(0, Math.round(((reachedAt(a, "hired") ?? 0) - new Date(a.appliedAt).getTime()) / DAY)))),
      trend: countIn(weeks, hires.map((a) => reachedAt(a, "hired"))),
      placed: hires
        .map((a) => ({ id: a.id, name: a.name || a.email, job: a.jobTitle || (a.jobId ? titles.get(a.jobId) : "") || "", at: reachedAt(a, "hired") ?? 0 }))
        .sort((x, y) => y.at - x.at),
    };
  });
  rows.sort((a, b) => b.placements - a.placements || b.submitted - a.submitted);
  return { rows, weeks };
}

const pct = (v: number | null) => (v === null ? "—" : `${Math.round(v * 100)}%`);

/** Recruiter performance from real records: submissions, interviews and placements by owner. The dashboard header owns the period. */
export default function TeamPerformance({ period }: { period: Period }) {
  const appsRes = useApplicationSummaries();
  const jobsRes = useJobSummaries();
  const { users } = useUserDirectory();
  const [metric, setMetric] = useState<"placements" | "submitted">("placements");
  const [open, setOpen] = useState<Scorecard | null>(null);

  const p = PERIODS.find((x) => x.id === period)!;
  const titles = useMemo(() => new Map((jobsRes.jobs ?? []).map((j) => [j.id, j.title])), [jobsRes.jobs]);
  const { rows, weeks } = useMemo(() => scorecards(appsRes.applications ?? [], p.days, titles, users), [appsRes.applications, p.days, titles, users]);
  const apps = appsRes.applications ?? [];
  const start = Date.now() - p.days * DAY;
  const series = {
    placements: countIn(weeks, apps.filter((a) => a.status === "hired").map((a) => reachedAt(a, "hired"))),
    submitted: countIn(weeks, apps.map((a) => reachedAt(a, "submitted"))),
    interviews: countIn(weeks, apps.map((a) => reachedAt(a, "interview"))),
  };
  const total = (k: "submitted" | "interviews" | "placements" | "offers") => rows.reduce((n, r) => n + r[k], 0);
  const hireDays = median(
    apps
      .filter((a) => a.status === "hired" && (reachedAt(a, "hired") ?? 0) >= start)
      .map((a) => Math.max(0, Math.round(((reachedAt(a, "hired") ?? 0) - new Date(a.appliedAt).getTime()) / DAY))),
  );

  if (appsRes.isLoading || jobsRes.isLoading) return <ListPageSkeleton header={false} label="Loading team performance" kpis={4} />;
  if (!appsRes.applications && appsRes.error)
    return <ErrorState title="Couldn't load team performance" message={appsRes.error.message} onRetry={() => void appsRes.reload()} retrying={appsRes.isValidating} />;
  if (apps.length === 0)
    return (
      <EmptyState
        framed
        variant="first-use"
        icon="target"
        title="No candidates to measure yet"
        body="Submissions, interviews and placements appear here by owner once candidates are in the pipeline."
        primary={{ label: "Add applicant", icon: "plus", href: "/portal/applications/new" }}
      />
    );

  const columns: Column<Scorecard>[] = [
    {
      key: "name",
      header: "Owner",
      sortable: true,
      value: (r) => r.name,
      cell: (r) => (
        <span className="flex items-center gap-3">
          <Avatar name={r.name} size="sm" />
          <span className={`truncate ${r.name === "Unassigned" ? "italic text-mist-500" : "font-medium"}`}>{r.name}</span>
        </span>
      ),
    },
    { key: "active", header: "Active", sortable: true, hideBelow: "lg", value: (r) => r.active, cell: (r) => <span className="tabular-nums">{r.active}</span> },
    { key: "submitted", header: "Submitted", sortable: true, value: (r) => r.submitted, cell: (r) => <span className="tabular-nums">{r.submitted}</span> },
    { key: "interviews", header: "Interviews", sortable: true, hideBelow: "md", value: (r) => r.interviews, cell: (r) => <span className="tabular-nums">{r.interviews}</span> },
    { key: "offers", header: "Offers", sortable: true, defaultHidden: true, value: (r) => r.offers },
    { key: "placements", header: "Placed", sortable: true, value: (r) => r.placements, cell: (r) => <span className="font-semibold tabular-nums">{r.placements}</span> },
    { key: "s2i", header: "Submit to interview", sortable: true, hideBelow: "xl", value: (r) => (r.submitToInterview ?? -1) * 100, cell: (r) => <span className="tabular-nums">{pct(r.submitToInterview)}</span> },
    { key: "i2h", header: "Interview to hire", sortable: true, hideBelow: "xl", value: (r) => (r.interviewToHire ?? -1) * 100, cell: (r) => <span className="tabular-nums">{pct(r.interviewToHire)}</span> },
    { key: "days", header: "Days to hire", sortable: true, defaultHidden: true, value: (r) => r.daysToHire ?? -1, cell: (r) => <span className="tabular-nums">{r.daysToHire ?? "—"}</span> },
    { key: "trend", header: "Placements", hideBelow: "xl", value: (r) => r.trend.join(" "), cell: (r) => <Sparkline values={r.trend} width={72} height={22} label={`${r.name} placements, ${p.label.toLowerCase()}`} /> },
  ];

  const detail = (r: Scorecard) => (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Avatar name={r.name} size="lg" />
        <div>
          <p className="text-[17px] font-semibold text-navy-900">{r.name}</p>
          <p className="text-[14px] text-mist-600">{r.active} active candidates, {p.label.toLowerCase()}</p>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-3 rounded-xl bg-mist-50 p-4 text-[13px]">
        {[
          { k: "Submit to interview", v: pct(r.submitToInterview) },
          { k: "Interview to hire", v: pct(r.interviewToHire) },
          { k: "Median days to hire", v: r.daysToHire ?? "—" },
          { k: "Offers", v: r.offers },
        ].map((x) => (
          <div key={x.k}>
            <dt className="text-mist-500">{x.k}</dt>
            <dd className="font-semibold tabular-nums text-navy-900">{x.v}</dd>
          </div>
        ))}
      </dl>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-navy-900">
          <Icon name="funnel" className="size-4 text-ocean-700" />
          Pipeline
        </h3>
        <Funnel
          title={`${r.name} pipeline`}
          stages={[
            { label: "Submitted", value: r.submitted },
            { label: "Interviewed", value: r.interviews },
            { label: "Offers", value: r.offers },
            { label: "Placed", value: r.placements },
          ]}
        />
      </section>
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[14px] font-semibold text-navy-900">
          <Icon name="userCheck" className="size-4 text-ocean-700" />
          Placements
        </h3>
        {r.placed.length === 0 ? (
          <EmptyState compact icon="userCheck" title="No placements in this period" />
        ) : (
          <ul className="grid gap-2">
            {r.placed.slice(0, 8).map((x) => (
              <li key={x.id}>
                <Link href={`/portal/candidates/${x.id}`} className="flex items-center gap-3 rounded-lg bg-mist-50 p-3 hover:bg-mist-100">
                  <Avatar name={x.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-medium">{x.name}</span>
                    <span className="block truncate text-[12px] text-mist-600">{x.job || "No position"}</span>
                  </span>
                  <span className="text-[12px] tabular-nums text-mist-500">{fmtDate(x.at)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );

  const ranked = rows.filter((r) => r.name !== "Unassigned");
  const s2i = total("submitted") ? total("interviews") / total("submitted") : null;

  return (
    <>
      <KpiRow>
        <StatCard section="recruiting" label="Submissions" value={total("submitted")} icon="send" change={p.label} trend="flat" spark={series.submitted} />
        <StatCard section="recruiting" label="Interviews" value={total("interviews")} icon="calendar" change={`${pct(s2i)} of submissions`} trend="flat" spark={series.interviews} />
        <StatCard section="recruiting" label="Placements" value={total("placements")} icon="userCheck" change={`${total("offers")} offers`} trend="flat" spark={series.placements} />
        <StatCard section="recruiting" label="Median days to hire" value={hireDays ?? "—"} icon="timer" change="Applied to hired" trend="flat" />
      </KpiRow>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title={`${metric === "placements" ? "Placements" : "Submissions"} per ${period === "year" ? "month" : "week"}`}
          action={
            <Segmented
              label="Metric"
              size="sm"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "placements", label: "Placements" },
                { value: "submitted", label: "Submissions" },
              ]}
            />
          }
        >
          <TrendChart title={`Team ${metric}, ${p.label.toLowerCase()}`} labels={weeks.map((w) => w.label)} series={[{ name: metric === "placements" ? "Placements" : "Submissions", values: series[metric] }]} height={300} />
        </Panel>
        <Panel title="Top placements" padded={false}>
          {ranked.length === 0 ? (
            <EmptyState compact icon="trophy" title="No owners yet" body="Assign owners to candidates to track who places them." />
          ) : (
            <ol className="grid gap-0.5 p-3">
              {ranked.slice(0, 7).map((r, i) => {
                const max = ranked[0]?.placements || 1;
                return (
                  <li key={r.id}>
                    <button type="button" onClick={() => setOpen(r)} className="group flex min-h-10 w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors duration-150 hover:bg-mist-50">
                      <span className={`grid size-6 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${i === 0 && r.placements ? "bg-[#fef0c7] text-[#93370d]" : "bg-mist-100 text-mist-600"}`}>{i + 1}</span>
                      <Avatar name={r.name} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-[14px] font-medium text-navy-900 group-hover:text-ocean-700">{r.name}</span>
                          <span className="text-[14px] font-semibold tabular-nums text-navy-900">{r.placements}</span>
                        </span>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-mist-100">
                          <span className="block h-full rounded-full bg-ocean-600" style={{ width: `${(r.placements / max) * 100}%` }} />
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      <section aria-labelledby="scorecards-title" className="grid min-w-0 gap-3">
        <h2 id="scorecards-title" className="text-[17px] font-semibold text-navy-900">Scorecards</h2>
        <DataTable
          rows={rows}
          columns={columns}
          exportName={`recruiter-performance-${period}`}
          searchPlaceholder="Search owners"
          emptyTitle="No candidates in this period"
          renderDetail={detail}
          detailTitle={(r) => r.name}
        />
      </section>

      {ranked.length > 0 && (
        <Panel title="Submit to interview rate" description="By owner, top ten">
          <BarChart
            title="Submit to interview conversion by owner"
            labels={ranked.slice(0, 10).map((r) => r.name.split(" ")[0])}
            series={[{ name: "Submit to interview", values: ranked.slice(0, 10).map((r) => Math.round((r.submitToInterview ?? 0) * 100)) }]}
            format={(n) => `${n}%`}
            height={220}
          />
        </Panel>
      )}

      {open && (
        <Drawer title={open.name} onClose={() => setOpen(null)}>
          {detail(rows.find((r) => r.id === open.id) ?? open)}
        </Drawer>
      )}
    </>
  );
}
