// Shared recruiting vocabulary for the portal views: real pipeline stages, job
// statuses, permissions and time buckets. Pure, so any view can import it.

import type { Application, Job } from "@/lib/aws/dynamodb";
import { UserRole, canEditJobs, canSeeJobCommercials } from "@/lib/auth/config";
import type { Role } from "@/lib/portal/roles";
import type { Tone } from "@/components/portal/ui";
import { DAY, TERMINAL } from "@/lib/pipeline";
import { isPubliclyOpen } from "@/lib/job-status";

export type Stage = Application["status"];

/** In-flight stages in order, then the terminal ones. Same set the API accepts. */
export const FLOW: Stage[] = ["pending", "reviewing", "submitted", "interview", "offered"];
export const PIPELINE: Stage[] = [...FLOW, "hired"];
export const BOARD: Stage[] = [...PIPELINE, "rejected"];
/** The bench also carries consultants who are simply active or parked. */
export const BENCH_STAGES: Stage[] = ["active", "pending", "reviewing", "submitted", "interview", "hired", "inactive"];

export const STAGE_LABEL: Record<Stage, string> = {
  pending: "New",
  reviewing: "Screening",
  submitted: "Submitted",
  interview: "Interview",
  offered: "Offered",
  hired: "Hired",
  rejected: "Rejected",
  active: "Active",
  inactive: "Inactive",
};

/** Token key per stage; bench-only stages borrow the nearest pipeline look. */
export const STAGE_KEY: Record<Stage, StageKey> = {
  pending: "new",
  reviewing: "screening",
  submitted: "submitted",
  interview: "interview",
  offered: "offered",
  hired: "hired",
  rejected: "rejected",
  active: "hired",
  inactive: "new",
};
export type StageKey = "new" | "screening" | "submitted" | "interview" | "offered" | "hired" | "rejected";

export const STAGE_TONE: Record<Stage, Tone> = {
  pending: "stage-new",
  reviewing: "stage-screening",
  submitted: "stage-submitted",
  interview: "stage-interview",
  offered: "stage-offered",
  hired: "stage-hired",
  rejected: "stage-rejected",
  active: "green",
  inactive: "grey",
};

const fill = (k: StageKey) => `var(--color-stage-${k}-fill)`;

/** Solid dot colour for selects and lists. New is hollow, so its dot is the edge grey. */
export const STAGE_DOT: Record<Stage, string> = {
  pending: "var(--color-stage-new-edge)",
  reviewing: fill("screening"),
  submitted: fill("submitted"),
  interview: fill("interview"),
  offered: fill("offered"),
  hired: fill("hired"),
  rejected: fill("rejected"),
  active: fill("hired"),
  inactive: "var(--color-mist-400)",
};

/** Fill, text-on-fill and edge for a stage, as CSS values. */
export function stageColors(s: string) {
  const k = STAGE_KEY[s as Stage] ?? "new";
  return { fill: fill(k), onFill: `var(--color-stage-${k}-on-fill)`, edge: `var(--color-stage-${k}-edge)` };
}

/** A stage dot as drawn: New hollow on a grey ring, Screening ringed in ocean-600, the rest solid. */
export function stageDotStyle(s: string): React.CSSProperties {
  const c = stageColors(s);
  return { background: c.fill, boxShadow: `inset 0 0 0 1px ${c.edge}` };
}

export const stageLabel = (s: string) => STAGE_LABEL[s as Stage] ?? s;

export type JobStatus = Job["status"];
/** List and filter vocabulary. Only Active is on the careers site; Open is internal. Paused is retired (legacy rows keep it). */
export const JOB_STATUSES: { value: JobStatus; label: string; public?: boolean }[] = [
  { value: "draft", label: "Draft" },
  { value: "open", label: "Open (internal)" },
  { value: "active", label: "Active (on website)", public: true },
  { value: "on-hold", label: "On hold" },
  { value: "closed", label: "Closed" },
];
export const jobStatusLabel = (s: string) => JOB_STATUSES.find((x) => x.value === s)?.label ?? (s === "paused" ? "Paused" : s);

/** Table cells and badges: the status without its qualifier. Selects keep the full label. */
const JOB_STATUS_SHORT: Record<string, string> = { draft: "Draft", open: "Open", active: "Active", "on-hold": "On hold", closed: "Closed", paused: "Paused" };
export const jobStatusShort = (s: string) => JOB_STATUS_SHORT[s] ?? s;

/** Open (internal) is in-flight work, blue; Active is live on the site, green; closed is ended, not failed, so neutral. */
export const JOB_STATUS_TONE: Record<string, Tone> = { draft: "grey", open: "blue", active: "green", "on-hold": "amber", paused: "amber", closed: "grey" };
export const JOB_STATUS_DOT: Record<string, string> = {
  draft: "var(--color-mist-400)",
  open: "var(--color-ocean-600)",
  active: "var(--color-kelp-700)",
  "on-hold": "var(--color-buoy-500)",
  paused: "var(--color-buoy-500)",
  closed: "var(--color-mist-500)",
};

/** The public posting a candidate opens; only Active roles resolve. */
export const publicJobPath = (id: string) => `/jobs/${id}`;

/** New-role form prefilled from another role. */
export const duplicateJobHref = (j: { id: string; category?: string | null }) => `/portal/jobs/new?from=${j.id}${j.category === "open" ? "&category=open" : ""}`;

/** Whole days until the end of an ISO date's day: 0 today, negative once past. */
export const daysUntil = (iso?: string) => (iso ? Math.ceil((new Date(iso.slice(0, 10) + "T23:59:59").getTime() - Date.now()) / DAY) - 1 : null);

/** Candidates still in play on a role (not hired or rejected); the summary's stage split, else the total. */
export function inPlayCount(j: Job): number {
  if (!j.pipeline) return j.applicationsCount ?? 0;
  return Object.entries(j.pipeline).reduce((n, [s, c]) => (TERMINAL.has(s) ? n : n + (c || 0)), 0);
}

/** A live role with nobody in play: the one definition the dashboard and both role lists share. */
export const needsCandidates = (j: Job) => isPubliclyOpen(j.status) && inPlayCount(j) === 0;

export const JOB_TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  "contract-to-hire": "Contract to hire",
  "direct-hire": "Direct hire",
  "managed-teams": "Managed teams",
  remote: "Remote",
};

/** Portal role (preview-aware) to the Cognito role the permission sets name. */
const TO_USER_ROLE: Record<Role, UserRole> = {
  admin: UserRole.ADMIN,
  hr: UserRole.HR,
  recruiter: UserRole.RECRUITER,
  sales: UserRole.SALES,
  marketing: UserRole.MEDIA,
};

export function permissionsFor(role: Role) {
  const r = TO_USER_ROLE[role];
  return {
    userRole: r,
    isAdmin: r === UserRole.ADMIN,
    canEditJobs: canEditJobs(r),
    /** Rates, client, assignees; also who may delete a posting (requireStaff). */
    canPrice: canSeeJobCommercials(r),
  };
}

/** Job assignees; records from before multi-assign carry one name. */
export function assigneesOf(j: Job): string[] {
  return (j.assignedToNames?.length ? j.assignedToNames : [j.assignedToName]).filter((n): n is string => !!n);
}

/**
 * When an application first reached a stage. History wins; a record that is
 * at or past the stage with no history entry counts from its applied date.
 */
export function reachedAt(a: Application, stage: string): number | null {
  const h = (a.statusHistory ?? []).find((x) => x.status === stage);
  if (h) return new Date(h.changedAt).getTime();
  const at = PIPELINE.indexOf(a.status), want = PIPELINE.indexOf(stage as Stage);
  if (a.status === stage || (want >= 0 && at >= want)) return new Date(a.appliedAt).getTime();
  return null;
}

export type Bucket = { label: string; start: number; end: number };

/** Consecutive buckets ending now: days → weekly, longer → monthly. */
export function buckets(days: number): Bucket[] {
  const now = new Date();
  if (days > 120) {
    const out: Bucket[] = [];
    const months = Math.round(days / 30.4);
    for (let i = months - 1; i >= 0; i--) {
      const s = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const e = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      out.push({ label: s.toLocaleDateString("en-US", { month: "short" }), start: s.getTime(), end: e.getTime() });
    }
    return out;
  }
  const weeks = Math.max(2, Math.round(days / 7));
  const end = now.getTime();
  return Array.from({ length: weeks }, (_, i) => {
    const e = end - (weeks - 1 - i) * 7 * DAY;
    const s = e - 7 * DAY;
    return { label: new Date(s + DAY).toLocaleDateString("en-US", { month: "short", day: "numeric" }), start: s, end: e };
  });
}

/** How many timestamps fall in each bucket. */
export function countIn(bs: Bucket[], times: (number | null)[]): number[] {
  return bs.map((b) => times.filter((t) => t !== null && t >= b.start && t < b.end).length);
}

/** "Austin, TX" */
export function locationOf(a: Pick<Application, "city" | "state">): string {
  return [a.city?.trim(), a.state?.trim()].filter(Boolean).join(", ");
}

/** Tally values into label/value pairs, largest first; extras fold into "Other". */
export function tally(values: string[], max = 6): { label: string; value: number }[] {
  const m = new Map<string, number>();
  for (const v of values) m.set(v, (m.get(v) || 0) + 1);
  const ranked = [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
  if (ranked.length <= max) return ranked;
  const tail = ranked.slice(max - 1);
  return [...ranked.slice(0, max - 1), { label: `Other (${tail.length})`, value: tail.reduce((n, r) => n + r.value, 0) }];
}
