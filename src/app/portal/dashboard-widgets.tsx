"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { TrendChart, seriesColors, SERIES } from "@/components/portal/charts";
import Icon from "@/components/portal/icons";
import { Avatar } from "@/components/portal/kit";
import { StateIcon } from "@/components/portal/kit/state-icon";
import { STAGE_LABEL, daysUntil, inPlayCount, stageLabel, stageState } from "@/components/portal/recruiting/model";
import { fmtRelative } from "@/lib/format";
import { DAY, STALE_DAYS } from "@/lib/pipeline";

/*
 * The dashboard's widgets, built to the dataviz method: one hue for single measures, the
 * validated slot-1 / hired / rejected trio for the activity chart, hover readouts on every
 * mark, text in text colours, and every number also readable without hovering.
 */

const BAR = SERIES[0];

/** Hiring activity over the range: the trend with toggles that show and hide each series. */
export function ActivityChart({ labels, series, range }: { labels: string[]; series: { name: string; values: number[] }[]; range: string }) {
  const [off, setOff] = useState<Set<string>>(new Set());
  // Colour follows the series, never its position among the visible ones
  const colors = useMemo(() => new Map(series.map((s, i) => [s.name, seriesColors(series.map((x) => x.name))[i]])), [series]);
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
      <TrendChart legend={false} title={`${shown.map((s) => s.name).join(", ")}, ${range}`} labels={labels} series={shown} area />
    </div>
  );
}

export type FunnelStage = { key: string; label: string; count: number; conversion: number | null; medianDays: number | null };

/** Stage by stage: how many reached it, what share of the stage before, how long the current holders have waited. */
export function ConversionFunnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="grid gap-1">
      <div aria-hidden className="grid grid-cols-[6.5rem_minmax(0,1fr)_3rem_4rem_5.5rem] items-center gap-3 px-2 pb-1 text-adm-xs text-mist-600">
        <span>Stage</span>
        <span />
        <span className="text-right">People</span>
        <span className="text-right">From prior</span>
        <span className="text-right">Median wait</span>
      </div>
      <ol className="grid gap-0.5">
        {stages.map((s) => {
          const stale = s.medianDays !== null && s.medianDays > STALE_DAYS;
          const tip = `${s.count} reached ${s.label}${s.conversion !== null ? `, ${s.conversion}% of the stage before` : ""}${s.medianDays !== null ? `; those here now have waited a median ${s.medianDays} days` : ""}`;
          return (
            <li key={s.key}>
              <Link
                href={s.key === "pending" ? "/portal/applications" : `/portal/applications?status=${s.key}`}
                title={tip}
                aria-label={tip}
                className="group grid grid-cols-[6.5rem_minmax(0,1fr)_3rem_4rem_5.5rem] items-center gap-3 rounded-md px-2 py-1.5 transition-colors duration-150 hover:bg-mist-50"
              >
                <span className="flex min-w-0 items-center gap-2 text-adm-base text-navy-900">
                  <StateIcon {...stageState(s.key)} />
                  <span className="truncate">{s.label}</span>
                </span>
                <span className="relative h-5 rounded bg-mist-100">
                  <span
                    className="absolute inset-y-0 left-0 rounded transition-[width,filter] duration-300 group-hover:brightness-110"
                    style={{ width: `${Math.max(2, (s.count / max) * 100)}%`, background: BAR }}
                  />
                </span>
                <span className="text-right text-adm-base font-semibold tabular-nums text-navy-900">{s.count}</span>
                <span className="text-right text-adm-xs tabular-nums text-mist-600">{s.conversion === null ? "—" : `${s.conversion}%`}</span>
                <span className={`flex items-center justify-end gap-1 text-right text-adm-xs tabular-nums ${stale ? "font-medium text-status-warning" : "text-mist-600"}`}>
                  {stale && <Icon name="timer" className="size-3.5" />}
                  {s.medianDays === null ? "—" : `${s.medianDays}d`}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export type SourceRow = { source: string; applicants: number; interviewed: number; hired: number };
type SourceSort = "applicants" | "interviewRate" | "hireRate";

/** Where people come from and how far they get: sortable, with the volume drawn inline. */
export function SourceTable({ rows }: { rows: SourceRow[] }) {
  const [sort, setSort] = useState<SourceSort>("applicants");
  const rate = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  const sorted = useMemo(() => {
    const val = (r: SourceRow) => (sort === "applicants" ? r.applicants : sort === "interviewRate" ? rate(r.interviewed, r.applicants) : rate(r.hired, r.applicants));
    return [...rows].sort((a, b) => val(b) - val(a) || b.applicants - a.applicants);
  }, [rows, sort]);
  const max = Math.max(1, ...rows.map((r) => r.applicants));
  const head = (key: SourceSort, label: string) => (
    <th scope="col" aria-sort={sort === key ? "descending" : undefined} className="px-2 py-2 text-right font-medium">
      <button type="button" onClick={() => setSort(key)} className={`inline-flex items-center gap-1 hover:text-navy-900 ${sort === key ? "text-navy-900" : ""}`}>
        {label}
        <Icon name="chevronDown" className={`size-3.5 transition-opacity ${sort === key ? "opacity-100" : "opacity-0"}`} />
      </button>
    </th>
  );
  return (
    <div className="-mx-2 overflow-x-auto">
      <table className="w-full min-w-[30rem] text-adm-base">
        <thead className="text-adm-xs text-mist-600">
          <tr className="border-b border-mist-200">
            <th scope="col" className="px-2 py-2 text-left font-medium">Source</th>
            {head("applicants", "Applicants")}
            {head("interviewRate", "Interviewed")}
            {head("hireRate", "Hired")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={r.source} className="border-b border-mist-100 transition-colors duration-150 last:border-b-0 hover:bg-mist-50">
              <th scope="row" className="max-w-[12rem] truncate px-2 py-2 text-left font-medium text-navy-900" title={r.source}>{r.source}</th>
              <td className="px-2 py-2">
                <span className="flex items-center justify-end gap-2">
                  <span aria-hidden className="hidden h-2 w-24 rounded-full bg-mist-100 sm:block">
                    <span className="block h-2 rounded-full" style={{ width: `${(r.applicants / max) * 100}%`, background: BAR }} />
                  </span>
                  <span className="w-9 text-right font-semibold tabular-nums text-navy-900">{r.applicants}</span>
                </span>
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-navy-900">
                {r.interviewed} <span className="text-adm-xs text-mist-600">({rate(r.interviewed, r.applicants)}%)</span>
              </td>
              <td className="px-2 py-2 text-right tabular-nums text-navy-900">
                {r.hired} <span className="text-adm-xs text-mist-600">({rate(r.hired, r.applicants)}%)</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Live roles that need someone now: closing within a week, or nobody in play. */
export function RolesAtRisk({ jobs }: { jobs: Job[] }) {
  if (jobs.length === 0)
    return (
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-status-success-soft text-status-success">
          <Icon name="check" className="size-3.5" />
        </span>
        <span className="text-adm-base text-navy-900">Every live role has candidates and time to run.</span>
      </div>
    );
  return (
    <ul className="divide-y divide-mist-100">
      {jobs.map((j) => {
        const due = daysUntil(j.submissionDueDate);
        const inPlay = inPlayCount(j);
        const dueText = due === null ? "No deadline" : due < 0 ? "Overdue" : due === 0 ? "Due today" : `Due in ${due}d`;
        return (
          <li key={j.id}>
            <Link href={`/portal/jobs/${j.id}`} className="group flex items-center gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mist-50">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-adm-base font-medium text-navy-900 group-hover:underline">{j.title}</span>
                <span className="block truncate text-adm-xs text-mist-600">{[j.clientName, j.postingId].filter(Boolean).join(" · ")}</span>
              </span>
              <span className={`shrink-0 text-right text-adm-xs tabular-nums ${inPlay === 0 ? "font-medium text-status-danger" : "text-mist-600"}`}>
                {inPlay} in play
              </span>
              <span
                className={`w-20 shrink-0 text-right text-adm-xs font-medium tabular-nums ${due !== null && due <= 1 ? "text-status-danger" : due !== null && due <= 7 ? "text-status-warning" : "text-mist-600"}`}
              >
                {dueText}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export type ActivityEvent = { id: string; at: number; kind: "applied" | "moved"; to?: string; by?: string; app: Application };

/** What happened lately: applications in and stage moves, who did it, newest first. */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return <p className="px-4 py-4 text-adm-base text-mist-600">Nothing happened in this period.</p>;
  return (
    <ol className="divide-y divide-mist-100">
      {events.map((e) => {
        const who = e.app.name || e.app.email;
        return (
          <li key={e.id}>
            <Link href={`/portal/candidates/${e.app.id}`} className="flex items-start gap-3 px-4 py-2.5 transition-colors duration-150 hover:bg-mist-50">
              {e.kind === "applied" ? (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ocean-50 text-ocean-700">
                  <Icon name="inbox" className="size-3.5" />
                </span>
              ) : (
                <Avatar name={e.by || "Someone"} size="sm" />
              )}
              <span className="min-w-0 flex-1 text-adm-base text-navy-900">
                {e.kind === "applied" ? (
                  <>
                    <span className="font-medium">{who}</span> applied
                    {e.app.jobTitle ? (
                      <>
                        {" "}for <span className="text-mist-700">{e.app.jobTitle}</span>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    <span className="font-medium">{e.by || "Someone"}</span> moved <span className="font-medium">{who}</span> to{" "}
                    <span className="inline-flex items-center gap-1 align-middle">
                      <StateIcon {...stageState(e.to ?? "")} />
                      {STAGE_LABEL[e.to as keyof typeof STAGE_LABEL] ?? stageLabel(e.to ?? "")}
                    </span>
                  </>
                )}
                <span className="block text-adm-xs text-mist-600">{fmtRelative(new Date(e.at).toISOString())}</span>
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

/** Newest events across every application: arrivals and each recorded stage change. */
export function recentEvents(apps: Application[], limit = 8): ActivityEvent[] {
  const out: ActivityEvent[] = [];
  for (const a of apps) {
    const applied = new Date(a.appliedAt).getTime();
    out.push({ id: `${a.id}-applied`, at: applied, kind: "applied", app: a });
    (a.statusHistory ?? []).forEach((h, i) => {
      const at = new Date(h.changedAt).getTime();
      // The opening "New" entry repeats the application itself
      if (h.status === "pending" && Math.abs(at - applied) < DAY) return;
      out.push({ id: `${a.id}-${i}`, at, kind: "moved", to: h.status, by: h.changedByName, app: a });
    });
  }
  return out.sort((x, y) => y.at - x.at).slice(0, limit);
}
