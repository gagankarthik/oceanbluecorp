"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import Icon from "../icons";
import { YieldBars } from "../viz";
import { scorecards } from "../performance/TeamPerformance";
import { useUserDirectory } from "@/hooks/use-console-data";

/** Compact team view for the dashboard: each owner's submissions and how many reached interview and placement, last 30 days */
export default function TeamPerformance({ applications, titles, onOpen }: { applications: Application[]; titles: Map<string, string>; onOpen: () => void }) {
  const { users } = useUserDirectory();
  const rows = useMemo(() => scorecards(applications, 30, titles, users).rows.filter((r) => r.name !== "Unassigned" && r.submitted > 0), [applications, titles, users]);

  return (
    <div className="grid max-w-[60rem] gap-4">
      {rows.length === 0 ? (
        <p className="text-adm-base text-mist-600">No owned candidates were submitted in the last 30 days. Assign owners on the candidate record to track this.</p>
      ) : (
        <YieldBars
          title="Submissions by owner, last 30 days, and how many reached interview and placement"
          rows={rows.map((r) => ({ key: r.id, label: r.name, total: r.submitted, mid: r.interviews, end: r.placements }))}
          labels={["Submitted", "Interviewed", "Placed"]}
          limit={6}
          avatars
        />
      )}
      <Link
        href="/portal?view=team"
        onClick={(e) => {
          e.preventDefault();
          onOpen();
        }}
        className="inline-flex w-fit items-center gap-1 text-adm-base font-medium text-ocean-700 transition-colors duration-150 hover:underline"
      >
        View team performance
        <Icon name="chevronRight" className="size-4" />
      </Link>
    </div>
  );
}
