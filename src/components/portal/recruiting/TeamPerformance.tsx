"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import Icon from "../icons";
import { Avatar } from "../ui";
import { scorecards } from "../performance/TeamPerformance";

/** Compact leaderboard for the dashboard: placements and submissions by owner, last 30 days */
export default function TeamPerformance({ applications, titles, onOpen }: { applications: Application[]; titles: Map<string, string>; onOpen: () => void }) {
  const rows = useMemo(() => scorecards(applications, 30, titles).rows.filter((r) => r.name !== "Unassigned"), [applications, titles]);
  const top = rows.slice(0, 5);
  const leader = Math.max(1, top[0]?.placements ?? 0, ...top.map((r) => r.submitted));
  const placed = rows.reduce((n, r) => n + r.placements, 0);
  const submitted = rows.reduce((n, r) => n + r.submitted, 0);

  return (
    <div className="grid gap-5">
      <div className="flex items-center gap-4 rounded-lg bg-mist-50 p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-ocean-50 text-ocean-700">
          <Icon name="target" className="size-5" />
        </span>
        <p className="text-[14px] text-navy-900">
          <span className="font-semibold tabular-nums">{placed}</span> placement{placed === 1 ? "" : "s"} and <span className="font-semibold tabular-nums">{submitted}</span> submission{submitted === 1 ? "" : "s"} in the last 30 days
        </p>
      </div>

      {top.length === 0 ? (
        <p className="text-[14px] text-mist-600">No owned candidates moved in the last 30 days. Assign owners on the candidate record to track this.</p>
      ) : (
        <ol className="grid gap-1">
          {top.map((r, i) => (
            <li key={r.id} className="grid grid-cols-[1.5rem_auto_1fr] items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-mist-50">
              <span className={`text-center text-[13px] font-semibold tabular-nums ${i === 0 ? "text-ocean-700" : "text-mist-500"}`}>
                {i === 0 && r.placements ? <Icon name="trophy" className="mx-auto size-4" title="Leader" /> : i + 1}
              </span>
              <Avatar name={r.name} size="sm" />
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[14px] font-medium text-navy-900">{r.name}</span>
                  <span className="shrink-0 text-[12px] tabular-nums text-mist-600">
                    <span className="font-semibold text-navy-900">{r.placements}</span> placed, {r.submitted} submitted
                  </span>
                </span>
                <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-mist-100">
                  <span className="block h-full rounded-full bg-ocean-600" style={{ width: `${(Math.max(r.placements, r.submitted) / leader) * 100}%` }} />
                </span>
              </span>
            </li>
          ))}
        </ol>
      )}

      <Link
        href="/portal?view=team"
        onClick={(e) => {
          e.preventDefault();
          onOpen();
        }}
        className="inline-flex items-center gap-1 text-[14px] font-medium text-ocean-700 transition-colors duration-150 hover:underline"
      >
        View team performance
        <Icon name="chevronRight" className="size-4" />
      </Link>
    </div>
  );
}
