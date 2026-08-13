import type { Application } from "@/lib/aws/dynamodb";

/**
 * Pipeline timing helpers.
 *
 * These were private to the dashboard, but the Applications workspace needs the
 * same "how long has this been sitting?" arithmetic to build its Stale view,
 * and two copies of a stage-age calculation that drift apart would let the
 * dashboard and the list disagree about which candidates are stuck.
 */

export const DAY = 86_400_000;

/** How long a record has sat in its current stage before being called stale. */
export const STALE_DAYS = 7;

/** An offer with no response after this many days is at risk. */
export const OFFER_STALE_DAYS = 5;

/** Stages that end the process. */
export const TERMINAL = new Set(["hired", "rejected"]);

export function median(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

/**
 * When the application entered its CURRENT stage.
 *
 * Falls back to the applied date for records with no history, which is the
 * honest answer: a record that has never moved has been waiting since it
 * arrived.
 */
export function enteredStageAt(a: Application): number {
  const hits = (a.statusHistory ?? []).filter((h) => h.status === a.status);
  const last = hits.length ? hits[hits.length - 1].changedAt : null;
  return new Date(last ?? a.appliedAt).getTime();
}

/**
 * Whether this application ever reached a given stage.
 *
 * Conversion must be measured on this rather than on current occupancy: a
 * candidate now at Interview has still passed through Screening, so counting
 * only who is sitting in a stage right now makes every conversion look like a
 * collapse (and, when an early stage has emptied out, produces figures well
 * over 100%).
 */
export function everReached(a: Application, stage: string): boolean {
  return a.status === stage || (a.statusHistory ?? []).some((h) => h.status === stage);
}

export function daysSince(ms: number): number {
  return Math.max(0, Math.floor((Date.now() - ms) / DAY));
}

/** Days the record has sat in its current stage. */
export function daysInStage(a: Application): number {
  return daysSince(enteredStageAt(a));
}

/** Still in play, and untouched for STALE_DAYS or more. */
export function isStale(a: Application, days = STALE_DAYS): boolean {
  return !TERMINAL.has(a.status) && daysInStage(a) >= days;
}
