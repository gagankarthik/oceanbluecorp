// Which job statuses the public sees. Pure: shared by the listing, the job
// page, the apply check and the sitemap, which used to disagree ("open" jobs
// were listed but refused applications).

export const PUBLIC_JOB_STATUSES = ["active", "open"] as const;

export type PublicJobStatus = (typeof PUBLIC_JOB_STATUSES)[number];

/** True when a posting is live: listed publicly and accepting applications. */
export function isPubliclyOpen(status: string | null | undefined): status is PublicJobStatus {
  return (PUBLIC_JOB_STATUSES as readonly string[]).includes(status ?? "");
}
