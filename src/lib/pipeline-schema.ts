// What each kind of pipeline record accepts, shared by create (POST /api/pipeline)
// and edit (PUT /api/pipeline/[id]).
import type { PipelineKind } from "@/lib/aws/dynamodb";
import type { Schema } from "@/lib/validate";

export const KINDS: PipelineKind[] = ["submission", "interview", "placement"];

const RATE_UNITS = ["hourly", "daily", "weekly", "monthly", "annual"] as const;
const SUBMISSION_STATUSES = [
  "sent", "under-review", "shortlisted", "interviewing", "offered", "placed", "rejected", "withdrawn",
] as const;
const INTERVIEW_STATUSES = ["scheduled", "completed", "cancelled", "no-show", "rescheduled"] as const;
const INTERVIEW_OUTCOMES = ["pending", "pass", "fail", "hold"] as const;
const INTERVIEW_MODES = ["phone", "video", "onsite"] as const;
const PLACEMENT_STATUSES = ["active", "completed", "terminated", "extended"] as const;

/**
 * What each kind of record accepts. Anything not declared here is dropped before
 * it can reach the table, see lib/validate.ts on why the shape is declared
 * rather than the dangerous fields blocked one at a time.
 */
const BASE_FIELDS: Schema = {
  kind: { kind: "string", required: true, oneOf: KINDS },
  applicationId: { kind: "string", required: true, maxLength: 128 },
  submissionId: { kind: "string", maxLength: 128 },
  jobId: { kind: "string", maxLength: 128 },
  jobTitle: { kind: "string", maxLength: 200 },
  candidateName: { kind: "string", maxLength: 200 },
  occurredAt: { kind: "string", maxLength: 40 },
  notes: { kind: "string", maxLength: 5000 },
};

export const SCHEMAS: Record<PipelineKind, Schema> = {
  submission: {
    ...BASE_FIELDS,
    clientId: { kind: "string", maxLength: 128 },
    clientName: { kind: "string", maxLength: 200 },
    vendorId: { kind: "string", maxLength: 128 },
    vendorName: { kind: "string", maxLength: 200 },
    submittedTo: { kind: "string", maxLength: 200 },
    rate: { kind: "number", min: 0, max: 10_000_000, coerce: true },
    rateUnit: { kind: "string", oneOf: RATE_UNITS },
    currency: { kind: "string", maxLength: 3 },
    status: { kind: "string", oneOf: SUBMISSION_STATUSES },
    respondedAt: { kind: "string", maxLength: 40 },
    rejectionReason: { kind: "string", maxLength: 500 },
    submittedAt: { kind: "string", maxLength: 40 },
  },
  interview: {
    ...BASE_FIELDS,
    round: { kind: "number", min: 1, max: 20, coerce: true },
    mode: { kind: "string", oneOf: INTERVIEW_MODES },
    scheduledAt: { kind: "string", maxLength: 40 },
    durationMinutes: { kind: "number", min: 0, max: 1440, coerce: true },
    location: { kind: "string", maxLength: 500 },
    panel: { kind: "stringArray", maxLength: 120 },
    status: { kind: "string", oneOf: INTERVIEW_STATUSES },
    outcome: { kind: "string", oneOf: INTERVIEW_OUTCOMES },
    feedback: { kind: "string", maxLength: 5000 },
  },
  placement: {
    ...BASE_FIELDS,
    startAt: { kind: "string", maxLength: 40 },
    endAt: { kind: "string", maxLength: 40 },
    billRate: { kind: "number", min: 0, max: 10_000_000, coerce: true },
    payRate: { kind: "number", min: 0, max: 10_000_000, coerce: true },
    rateUnit: { kind: "string", oneOf: RATE_UNITS },
    currency: { kind: "string", maxLength: 3 },
    status: { kind: "string", oneOf: PLACEMENT_STATUSES },
    poNumber: { kind: "string", maxLength: 60 },
  },
};

/** The same fields minus identity: an edit cannot change kind or move a record to another candidate. */
export function editSchema(kind: PipelineKind): Schema {
  const { kind: _k, applicationId: _a, ...rest } = SCHEMAS[kind];
  void _k; void _a;
  return rest;
}
