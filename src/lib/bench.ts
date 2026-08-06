import type { Application, BenchType } from "@/lib/aws/dynamodb";

/**
 * The two talent pools, and who can see them.
 *
 * These labels and the visibility rule used to be restated in six places (both
 * application forms, the drawer, the candidate page, the bench page and its
 * detail card), and they had already drifted — so they live here once.
 *
 *   My Pool      external   candidates YOU sourced. Private to whoever added
 *                           the record: a recruiter's own market pipeline.
 *   Talent Bench internal   our own consultants between placements. Company
 *                           property, so every staff member sees the whole list.
 *
 * Note the pairing is deliberate and is the inverse of the labels this app
 * shipped with: "internal" is the shared bench, "external" is the private pool.
 * `poolOf`'s legacy fallback still resolves hired records to "internal", which
 * remains correct — a hire becomes one of our consultants, and consultants are
 * exactly what the shared Talent Bench holds.
 */
export interface PoolMeta {
  /** What the pool is called in the UI. */
  label: string;
  /** Short badge text — the raw internal/external distinction. */
  badge: string;
  /** One-line explanation, used as picker hints and empty-state copy. */
  hint: string;
  /** Whether every staff member sees these records, or only the person who added them. */
  visibility: "team" | "own";
}

export const POOL_META: Record<BenchType, PoolMeta> = {
  external: {
    label: "My Pool",
    badge: "External",
    hint: "External candidates you sourced — visible only to you",
    visibility: "own",
  },
  internal: {
    label: "Talent Bench",
    badge: "Internal",
    hint: "Our own consultants — visible to the whole team",
    visibility: "team",
  },
};

/** `POOL_META[pool].label`, in the shape a Record lookup wants. */
export const POOL_LABEL: Record<BenchType, string> = {
  external: POOL_META.external.label,
  internal: POOL_META.internal.label,
};

/** The order pickers and tabs list the pools in: shared bench first. */
export const POOL_ORDER: BenchType[] = ["internal", "external"];

/**
 * A record's pool, with the legacy fallback: rows written before benchType
 * existed count as internal when hired (they became one of our consultants)
 * and external otherwise — the same rule scripts/backfill-bench-type.mjs
 * applies, so pages read correctly before and after the backfill runs.
 */
export function poolOf(app: Pick<Application, "benchType" | "status">): BenchType {
  return app.benchType || (app.status === "hired" ? "internal" : "external");
}

/** Who added a bench record — benchAddedBy wins, createdBy is the fallback. */
export function adderKeyOf(app: Pick<Application, "benchAddedBy" | "createdBy">): string {
  return (app.benchAddedBy || app.createdBy || "").toString();
}

export interface Viewer {
  id?: string;
  email?: string | null;
  isAdmin?: boolean;
}

/** Whether this record was added by the viewer. */
export function isOwnRecord(
  app: Pick<Application, "benchAddedBy" | "createdBy">,
  viewer: Viewer,
): boolean {
  const key = adderKeyOf(app).toLowerCase();
  if (!key) return false;
  return key === (viewer.email || "").toLowerCase() || key === (viewer.id || "").toLowerCase();
}

/**
 * Whether a viewer may see a bench record at all.
 *
 * Talent Bench (internal) is company-wide, so everyone sees it. My Pool
 * (external) is private to the person who built it — admins excepted, since
 * they are the ones who audit the team's pipeline.
 */
export function canView(app: Application, viewer: Viewer): boolean {
  if (poolOf(app) === "internal") return true;
  return !!viewer.isAdmin || isOwnRecord(app, viewer);
}
