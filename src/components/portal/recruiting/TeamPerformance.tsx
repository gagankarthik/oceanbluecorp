"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import Icon from "../icons";
import { Avatar } from "../ui";
import { scorecards } from "../performance/TeamPerformance";
import { useUserDirectory } from "@/hooks/use-console-data";

/** Compact leaderboard for the dashboard: placements and submissions by owner, last 30 days */
export default function TeamPerformance({ applications, titles, onOpen }: { applications: Application[]; titles: Map<string, string>; onOpen: () => void }) {
  const { users } = useUserDirectory();
  const rows = useMemo(() => scorecards(applications, 30, titles, users).rows.filter((r) => r.name !== "Unassigned"), [applications, titles, users]);
  const top = rows.slice(0, 5);
  const leader = Math.max(1, top[0]?.placements ?? 0, ...top.map((r) => r.submitted));
  const placed = rows.reduce((n, r) => n + r.placements, 0);
  const submitted = rows.reduce((n, r) => n + r.submitted, 0);

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-2 border-b border-mist-200 pb-4">
        <dl className="flex gap-x-8">
          <div>
            <dt className="text-adm-base text-mist-600">Placements</dt>
            <dd className="text-adm-lg font-semibold tabular-nums text-navy-900">{placed}</dd>
          </div>
          <div>
            <dt className="text-adm-base text-mist-600">Submissions</dt>
            <dd className="text-adm-lg font-semibold tabular-nums text-navy-900">{submitted}</dd>
          </div>
        </dl>
        <p className="pb-1 text-adm-base text-mist-600">Last 30 days</p>
      </div>

      {top.length === 0 ? (
        <p className="text-adm-base text-mist-600">No owned candidates moved in the last 30 days. Assign owners on the candidate record to track this.</p>
      ) : (
        <ol className="grid gap-1">
          {top.map((r, i) => (
            <li key={r.id} className="grid grid-cols-[1.5rem_auto_1fr] items-center gap-3 rounded-lg p-2 transition-colors duration-150 hover:bg-mist-50">
              <span className={`text-center text-adm-base font-semibold tabular-nums ${i === 0 ? "text-ocean-700" : "text-mist-600"}`}>
                {i === 0 && r.placements ? <Icon name="trophy" className="mx-auto size-4" title="Leader" /> : i + 1}
              </span>
              <Avatar name={r.name} size="sm" />
              <span className="min-w-0">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-adm-base font-medium text-navy-900">{r.name}</span>
                  <span className="shrink-0 text-adm-xs tabular-nums text-mist-600">
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
        className="inline-flex items-center gap-1 text-adm-base font-medium text-ocean-700 transition-colors duration-150 hover:underline"
      >
        View team performance
        <Icon name="chevronRight" className="size-4" />
      </Link>
    </div>
  );
}
