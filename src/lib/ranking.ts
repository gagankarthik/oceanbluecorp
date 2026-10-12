// Rules for a job's saved candidate ranking. Pure, so they are tested in isolation.

/** A run older than this is presumed dead (the route's maxDuration is 120s). */
export const RUN_STALE_MS = 3 * 60_000;

type RankedJob = {
  title?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
  location?: string;
  type?: string;
};

/**
 * Hash of exactly what the matching engine reads from a job. Saved with the
 * ranking; when the job's current hash differs, the ranking predates an edit.
 * FNV-1a, 32-bit: stable across runtimes, no crypto import.
 */
export function jobFingerprint(job: RankedJob): string {
  const text = JSON.stringify([
    job.title ?? "",
    job.description ?? "",
    job.requirements ?? "",
    job.responsibilities ?? "",
    job.location ?? "",
    job.type ?? "",
  ]);
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** Whether a stored run marker still means "ranking in progress". */
export function isRunning(run: { state: string; startedAt: string } | undefined, now = Date.now()): boolean {
  return !!run && run.state === "running" && now - new Date(run.startedAt).getTime() < RUN_STALE_MS;
}
