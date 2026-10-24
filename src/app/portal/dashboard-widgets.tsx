"use client";

import Link from "next/link";
import type { Application, Job } from "@/lib/aws/dynamodb";
import Icon from "@/components/portal/icons";
import { Avatar } from "@/components/portal/kit";
import { StateIcon } from "@/components/portal/kit/state-icon";
import { STAGE_LABEL, daysUntil, inPlayCount, stageLabel, stageState } from "@/components/portal/recruiting/model";
import { fmtRelative } from "@/lib/format";
import { DAY } from "@/lib/pipeline";

/* The dashboard's lists; its charts live in components/portal/viz.tsx. */

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
