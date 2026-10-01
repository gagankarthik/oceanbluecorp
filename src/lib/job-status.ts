// Which job statuses the public sees. Pure: shared by the listing, the job
// page, the apply check and the sitemap, which used to disagree ("open" jobs
// were listed but refused applications).

export const PUBLIC_JOB_STATUSES = ["active", "open"] as const;

export type PublicJobStatus = (typeof PUBLIC_JOB_STATUSES)[number];

/** True when a posting is live: listed publicly and accepting applications. */
export function isPubliclyOpen(status: string | null | undefined): status is PublicJobStatus {
  return (PUBLIC_JOB_STATUSES as readonly string[]).includes(status ?? "");
}

/** Which admin list a posting lives in. Both show together on the careers board. */
export type JobCategory = "state" | "open";

/** The console list each category lives on. One detail route serves both. */
export const JOB_LIST_HREF = { state: "/admin/state-roles", open: "/admin/open-roles" } as const;
export const JOB_LIST_LABEL = { state: "State roles", open: "Open roles" } as const;

/** Records from before the split carry no category; they are all state roles. */
export function jobCategory(job: { category?: string | null }): JobCategory {
  return job.category === "open" ? "open" : "state";
}
