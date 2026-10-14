"use client";

import { useMemo } from "react";
import type { Job } from "@/lib/aws/dynamodb";
import { NativeSelect } from "./base";

/** Status groups in the order a recruiter looks for them; Active is the public one. */
const GROUPS: { label: string; statuses: string[] }[] = [
  { label: "Active · on the careers site", statuses: ["active"] },
  { label: "Open · internal only", statuses: ["open"] },
  { label: "On hold", statuses: ["on-hold", "paused"] },
  { label: "Drafts", statuses: ["draft"] },
  { label: "Closed", statuses: ["closed"] },
];

export const jobOptionLabel = (j: Pick<Job, "title" | "postingId">) => (j.postingId ? `${j.title} · ${j.postingId}` : j.title);

/**
 * Every non-closed role, grouped by status with its posting ID. A closed role
 * shows only when it is the current value, so a saved link never blanks.
 */
export function JobPicker({
  id,
  jobs,
  value,
  onChange,
  currentTitle,
  noneLabel = "Unassigned",
  includeClosed = false,
  required,
  invalid,
}: {
  id?: string;
  jobs: Job[];
  value: string;
  onChange: (job: Job | null, id: string) => void;
  /** Label for a current value missing from `jobs` */
  currentTitle?: string;
  /** Blank option; pass null for none */
  noneLabel?: string | null;
  includeClosed?: boolean;
  required?: boolean;
  invalid?: Record<string, unknown>;
}) {
  const grouped = useMemo(
    () =>
      GROUPS.map((g) => ({
        label: g.label,
        jobs: jobs
          .filter((j) => g.statuses.includes(j.status) && (includeClosed || j.status !== "closed" || j.id === value))
          .sort((a, b) => a.title.localeCompare(b.title)),
      })).filter((g) => g.jobs.length > 0),
    [jobs, includeClosed, value],
  );
  const known = jobs.some((j) => j.id === value);

  return (
    <NativeSelect
      id={id}
      required={required}
      {...invalid}
      value={value}
      onChange={(e) => onChange(jobs.find((j) => j.id === e.target.value) ?? null, e.target.value)}
    >
      {noneLabel !== null && <option value="">{noneLabel}</option>}
      {value && !known && <option value={value}>{currentTitle || "Current posting"}</option>}
      {grouped.map((g) => (
        <optgroup key={g.label} label={g.label}>
          {g.jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {jobOptionLabel(j)}
            </option>
          ))}
        </optgroup>
      ))}
    </NativeSelect>
  );
}
