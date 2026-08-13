// Pure helpers for pipeline RECORDS, submissions, interviews, placements:
// labels, tones, margin, and the application status each kind of event implies.
//
// Kept apart from lib/pipeline.ts, which is about the stage-aging arithmetic the
// dashboard and Applications list share (how long has this sat, is it stale).
//
// Type-only imports from lib/aws so this stays safe in client components (see
// CLAUDE.md, a value import from there ships the AWS SDK to the browser).
import type {
  Interview,
  InterviewMode,
  InterviewOutcome,
  InterviewStatus,
  Placement,
  PlacementStatus,
  RateUnit,
  Submission,
  SubmissionStatus,
} from "@/lib/aws/dynamodb";

/* ── Labels ──────────────────────────────────────────────────────────────── */

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  sent: "Sent",
  "under-review": "Under review",
  shortlisted: "Shortlisted",
  interviewing: "Interviewing",
  offered: "Offered",
  placed: "Placed",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  "no-show": "No show",
  rescheduled: "Rescheduled",
};

export const INTERVIEW_OUTCOME_LABELS: Record<InterviewOutcome, string> = {
  pending: "Awaiting feedback",
  pass: "Passed",
  fail: "Did not pass",
  hold: "On hold",
};

export const INTERVIEW_MODE_LABELS: Record<InterviewMode, string> = {
  phone: "Phone",
  video: "Video",
  onsite: "On site",
};

export const PLACEMENT_STATUS_LABELS: Record<PlacementStatus, string> = {
  active: "Active",
  completed: "Completed",
  terminated: "Terminated",
  extended: "Extended",
};

export const RATE_UNIT_LABELS: Record<RateUnit, string> = {
  hourly: "/hr",
  daily: "/day",
  weekly: "/wk",
  monthly: "/mo",
  annual: "/yr",
};

/** Ordered for pickers, the sequence a submission actually travels. */
export const SUBMISSION_STATUS_ORDER: SubmissionStatus[] = [
  "sent", "under-review", "shortlisted", "interviewing", "offered", "placed", "rejected", "withdrawn",
];

export const INTERVIEW_STATUS_ORDER: InterviewStatus[] = [
  "scheduled", "completed", "rescheduled", "no-show", "cancelled",
];

export const PLACEMENT_STATUS_ORDER: PlacementStatus[] = [
  "active", "extended", "completed", "terminated",
];

/* ── Tones (map onto the admin design system's Tone union) ────────────────── */

export function submissionTone(status: SubmissionStatus): "blue" | "emerald" | "amber" | "rose" | "slate" {
  switch (status) {
    case "placed": return "emerald";
    case "offered": case "shortlisted": return "blue";
    case "interviewing": case "under-review": return "amber";
    case "rejected": return "rose";
    case "withdrawn": return "slate";
    default: return "slate";
  }
}

export function interviewTone(status: InterviewStatus, outcome?: InterviewOutcome): "blue" | "emerald" | "amber" | "rose" | "slate" {
  if (status === "cancelled" || status === "no-show") return "rose";
  if (status === "completed") {
    if (outcome === "pass") return "emerald";
    if (outcome === "fail") return "rose";
    return "amber";
  }
  return "blue";
}

export function placementTone(status: PlacementStatus): "blue" | "emerald" | "amber" | "rose" | "slate" {
  switch (status) {
    case "active": case "extended": return "emerald";
    case "completed": return "slate";
    case "terminated": return "rose";
    default: return "slate";
  }
}

/* ── Money ───────────────────────────────────────────────────────────────── */

/**
 * Gross margin on a placement, as a percentage of the bill rate.
 *
 * Returns null unless both rates are present and the bill rate is positive,
 * a placement recorded without a pay rate has no margin, and showing 100%
 * would read as an unusually good deal rather than as missing data.
 */
export function grossMarginPct(placement: Pick<Placement, "billRate" | "payRate">): number | null {
  const { billRate, payRate } = placement;
  if (typeof billRate !== "number" || typeof payRate !== "number") return null;
  if (billRate <= 0) return null;
  return ((billRate - payRate) / billRate) * 100;
}

/** Per-unit gross profit, in the placement's own currency and rate unit. */
export function grossMarginAmount(placement: Pick<Placement, "billRate" | "payRate">): number | null {
  const { billRate, payRate } = placement;
  if (typeof billRate !== "number" || typeof payRate !== "number") return null;
  return billRate - payRate;
}

/** "$85.00/hr", blank when there is no figure, never "$0". */
export function formatRate(
  amount?: number,
  unit?: RateUnit,
  currency = "USD",
): string {
  if (typeof amount !== "number") return "–";
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: unit === "annual" ? 0 : 2,
    maximumFractionDigits: unit === "annual" ? 0 : 2,
  }).format(amount);
  return unit ? `${money}${RATE_UNIT_LABELS[unit]}` : money;
}

/* ── Status implications ─────────────────────────────────────────────────── */

/**
 * The application status implied by recording a pipeline event.
 *
 * The point of the pipeline is that a candidate's stage becomes a CONSEQUENCE of
 * real events rather than something a recruiter remembers to change. Recording a
 * submission means they are submitted; scheduling an interview means they are
 * interviewing; a placement means they are hired.
 */
export function impliedApplicationStatus(
  record: Pick<Submission, "kind"> | Pick<Interview, "kind"> | Pick<Placement, "kind">,
): "submitted" | "interview" | "hired" {
  switch (record.kind) {
    case "submission": return "submitted";
    case "interview": return "interview";
    case "placement": return "hired";
  }
}

/**
 * How far along each application status is, for forward-only advancement.
 *
 * A recruiter logging a first-round interview on someone already offered must
 * not drag them back to "interview", and a rejected candidate must not be
 * silently reopened by a late piece of admin. Anything not listed (rejected,
 * withdrawn, inactive) has no rank and is never overwritten automatically.
 */
const STATUS_RANK: Record<string, number> = {
  pending: 0,
  reviewing: 1,
  active: 1,
  submitted: 2,
  interview: 3,
  offered: 4,
  hired: 5,
};

/** True when `next` is strictly further along than `current`. */
export function isForwardStatusMove(current: string | undefined, next: string): boolean {
  const from = current ? STATUS_RANK[current] : undefined;
  const to = STATUS_RANK[next];
  if (to === undefined) return false;
  // An unranked current status (rejected, withdrawn) is a deliberate end state:
  // leave it alone and let a human reopen the candidate explicitly.
  if (from === undefined) return current === undefined;
  return to > from;
}
