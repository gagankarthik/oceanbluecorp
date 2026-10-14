// Which job statuses the public sees. Pure: shared by the listing, the job
// page, the apply check, the sitemap and the partner feed. Only "active" is
// public; "open" stays an internal status (owner's call, 2026-10-14).

export const PUBLIC_JOB_STATUSES = ["active"] as const;

export type PublicJobStatus = (typeof PUBLIC_JOB_STATUSES)[number];

/** True when a posting is live: listed publicly and accepting applications. */
export function isPubliclyOpen(status: string | null | undefined): status is PublicJobStatus {
  return (PUBLIC_JOB_STATUSES as readonly string[]).includes(status ?? "");
}

/**
 * Live and not past its submission deadline. The deadline is a calendar date,
 * so it stays open through the whole of that day.
 */
/** Past the end of its submission-due day. */
export function isPastDeadline(job: { submissionDueDate?: string | null }, now: Date = new Date()): boolean {
  if (!job.submissionDueDate) return false;
  const due = new Date(job.submissionDueDate.slice(0, 10) + "T23:59:59.999");
  return !Number.isNaN(due.getTime()) && due < now;
}

export function isAcceptingApplications(
  job: { status?: string | null; submissionDueDate?: string | null },
  now: Date = new Date(),
): boolean {
  return isPubliclyOpen(job.status) && !isPastDeadline(job, now);
}

/** Which admin list a posting lives in. Both show together on the careers board. */
export type JobCategory = "state" | "open";

/** The console list each category lives on. One detail route serves both. */
export const JOB_LIST_HREF = { state: "/portal/state-roles", open: "/portal/open-roles" } as const;
export const JOB_LIST_LABEL = { state: "State roles", open: "Open roles" } as const;

/** Records from before the split carry no category; they are all state roles. */
export function jobCategory(job: { category?: string | null }): JobCategory {
  return job.category === "open" ? "open" : "state";
}
