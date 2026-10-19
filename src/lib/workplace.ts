// Where a role is worked, kept apart from its employment type. Pure; shared by
// the console, the API and the careers pages.

export const WORKPLACES = ["on-site", "hybrid", "remote"] as const;
export type Workplace = (typeof WORKPLACES)[number];

export const WORKPLACE_LABEL: Record<Workplace, string> = {
  "on-site": "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

type Placed = { type?: string; workplace?: string; location?: string; state?: string };

/** The stored workplace. Remote used to be a job type, so a legacy `type: "remote"` reads as one. */
export function workplaceOf(job: Placed): Workplace | undefined {
  if ((WORKPLACES as readonly unknown[]).includes(job.workplace)) return job.workplace as Workplace;
  return job.type === "remote" ? "remote" : undefined;
}

export const isRemoteJob = (job: Placed): boolean => workplaceOf(job) === "remote";

/** Location then state, without repeats: "Remote" in both fields reads once. */
function placeParts(job: Placed): string {
  const parts: string[] = [];
  for (const raw of [job.location, job.state]) {
    const v = raw?.trim();
    if (v && !parts.some((p) => p.toLowerCase() === v.toLowerCase())) parts.push(v);
  }
  return parts.join(", ");
}

/** "Columbus, OH". A remote role that names no place reads "Remote". */
export function jobPlace(job: Placed): string {
  const place = placeParts(job);
  return place || (isRemoteJob(job) ? "Remote" : "");
}

/** Place plus arrangement for lists that show no separate workplace: "Columbus, OH (Hybrid)". */
export function jobLocationLabel(job: Placed): string {
  const place = placeParts(job);
  const wp = workplaceOf(job);
  if (!place) return wp === "remote" ? "Remote" : "";
  return wp && wp !== "on-site" ? `${place} (${WORKPLACE_LABEL[wp]})` : place;
}
