// Requisition vocabulary for the job form and record. Pure.

import type { Job } from "./aws/dynamodb";

export const DEPARTMENTS = [
  "ERP Solutions", "Cloud Services", "Data & AI", "Salesforce", "Engineering",
  "Information and Computers", "Training", "PMO", "Operations",
];

export const JOB_TYPE_OPTIONS: { value: Job["type"]; label: string }[] = [
  { value: "full-time", label: "Full-time" },
  { value: "part-time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "contract-to-hire", label: "Contract-to-hire" },
  { value: "direct-hire", label: "Direct hire" },
  { value: "managed-teams", label: "Managed teams" },
];

// Public wording of each type on the careers site; "remote" is legacy.
const PUBLIC_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  "contract-to-hire": "Contract to hire",
  "direct-hire": "Direct hire",
  "managed-teams": "Managed teams",
  remote: "Remote",
};

export const jobTypeLabel = (type: string) => PUBLIC_TYPE_LABEL[type] || type;

/** Each status in words a recruiter can act on; only Active is public (job-status.ts). */
export const JOB_STATUS_COPY: Record<Job["status"], { label: string; detail: string; public: boolean }> = {
  draft: { label: "Draft", detail: "Off the careers site. Finish it before publishing.", public: false },
  open: { label: "Open (internal)", detail: "Working the requisition internally. Not on the careers site.", public: false },
  active: { label: "Active (on website)", detail: "Live on the careers site and taking applications.", public: true },
  "on-hold": { label: "On hold", detail: "Paused. Off the careers site.", public: false },
  paused: { label: "Paused", detail: "Older status, same as On hold. Off the careers site.", public: false },
  closed: { label: "Closed", detail: "Finished. Off the careers site.", public: false },
};

/** Statuses offered when saving; Paused only while a record still holds it. */
export function jobStatusChoices(current?: Job["status"]): Job["status"][] {
  const base: Job["status"][] = ["draft", "open", "active", "on-hold", "closed"];
  return current === "paused" ? [...base, "paused"] : base;
}
