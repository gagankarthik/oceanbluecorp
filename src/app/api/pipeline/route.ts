import { NextRequest, NextResponse } from "next/server";
import { randomUUID as uuidv4 } from "node:crypto";
import { requireStaff } from "@/lib/auth/verify";
import {
  createPipelineRecord,
  listPipelineByApplication,
  listPipelineByKind,
  listSubmissionsByJob,
  updateApplication,
  type PipelineKind,
  type PipelineRecord,
} from "@/lib/aws/dynamodb";
import { impliedApplicationStatus, isForwardStatusMove } from "@/lib/pipeline-records";
import { validate, validationMessage } from "@/lib/validate";
import { KINDS, SCHEMAS } from "@/lib/pipeline-schema";
import { loadVisibleApplication, visiblePipeline } from "@/lib/aws/application-access";
import { serverError } from "@/lib/api-errors";

/**
 * GET /api/pipeline
 *   ?applicationId=…            everything recorded against one candidate
 *   ?kind=submission&jobId=…    submissions raised for one requisition
 *   ?kind=interview&from=&to=   one kind in a date window (reporting)
 */
export async function GET(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const params = request.nextUrl.searchParams;
  const applicationId = params.get("applicationId");
  const kindParam = params.get("kind");
  const jobId = params.get("jobId");

  if (applicationId) {
    const parent = await loadVisibleApplication(applicationId, auth.claims);
    if (!parent?.success) return NextResponse.json({ success: true, records: [] });
    const result = await listPipelineByApplication(applicationId);
    if (!result.success) return serverError("Listing pipeline by application", result.error, "Couldn't load the pipeline. Please try again.");
    return NextResponse.json({ success: true, records: result.data || [] });
  }

  if (kindParam && jobId && kindParam === "submission") {
    const result = await listSubmissionsByJob(jobId);
    if (!result.success) return serverError("Listing submissions by job", result.error, "Couldn't load the submissions. Please try again.");
    return NextResponse.json({ success: true, records: await visiblePipeline(result.data || [], auth.claims) });
  }

  if (kindParam) {
    if (!KINDS.includes(kindParam as PipelineKind)) {
      return NextResponse.json({ error: `kind must be one of ${KINDS.join(", ")}` }, { status: 400 });
    }
    const result = await listPipelineByKind(kindParam as PipelineKind, {
      from: params.get("from") || undefined,
      to: params.get("to") || undefined,
    });
    if (!result.success) return serverError("Listing pipeline by kind", result.error, "Couldn't load the pipeline. Please try again.");
    // My Pool: drop records whose candidate sits in a colleague's private pool.
    return NextResponse.json({ success: true, records: await visiblePipeline(result.data || [], auth.claims) });
  }

  return NextResponse.json(
    { error: "Provide applicationId, or kind (optionally with jobId / from / to)" },
    { status: 400 },
  );
}

/**
 * POST /api/pipeline, record a submission, interview or placement.
 *
 * Also advances the parent application's stage, because that is the whole point:
 * a candidate's stage becomes a consequence of what actually happened instead of
 * something a recruiter has to remember to set. The move is forward-only, so
 * logging a late first-round interview cannot drag someone already offered back
 * down, and a rejected candidate is never silently reopened.
 */
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const raw = await request.json();
    const kind = raw?.kind as PipelineKind | undefined;

    if (!kind || !KINDS.includes(kind)) {
      return NextResponse.json({ error: `kind must be one of ${KINDS.join(", ")}` }, { status: 400 });
    }

    // Only the fields this kind declares survive; the rest never reach the table.
    const checked = validate<Record<string, unknown>>(raw, SCHEMAS[kind]);
    if (!checked.ok) {
      return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    }
    const body = checked.value as Record<string, any>;

    const appResult = await loadVisibleApplication(body.applicationId, auth.claims);
    if (!appResult?.success || !appResult.data) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }
    const app = appResult.data;

    const now = new Date().toISOString();
    const actorName = auth.claims.email || "Staff";

    // The date the record is ABOUT, sent / scheduled / start, which is what
    // every list and report sorts and filters on. Falls back to now so a record
    // saved without a date still lands somewhere sensible rather than at the
    // epoch, where it would sort ahead of everything ever recorded.
    const occurredAt: string =
      (kind === "submission" && (body.occurredAt || body.submittedAt)) ||
      (kind === "interview" && (body.scheduledAt || body.occurredAt)) ||
      (kind === "placement" && (body.startAt || body.occurredAt)) ||
      now;

    const base = {
      id: uuidv4(),
      applicationId: body.applicationId,
      occurredAt,
      candidateName: app.name,
      jobId: body.jobId || app.jobId || undefined,
      jobTitle: body.jobTitle || app.jobTitle || undefined,
      submissionId: body.submissionId || undefined,
      notes: body.notes || undefined,
      createdAt: now,
      createdBy: auth.claims.sub,
      createdByName: actorName,
    };

    let record: PipelineRecord;

    if (kind === "submission") {
      record = {
        ...base,
        kind: "submission",
        clientId: body.clientId || undefined,
        clientName: body.clientName || undefined,
        vendorId: body.vendorId || undefined,
        vendorName: body.vendorName || undefined,
        submittedTo: body.submittedTo || undefined,
        rate: typeof body.rate === "number" ? body.rate : undefined,
        rateUnit: body.rateUnit || undefined,
        currency: body.currency || "USD",
        status: body.status || "sent",
        respondedAt: body.respondedAt || undefined,
        rejectionReason: body.rejectionReason || undefined,
      };
    } else if (kind === "interview") {
      record = {
        ...base,
        kind: "interview",
        round: typeof body.round === "number" && body.round > 0 ? body.round : 1,
        mode: body.mode || "video",
        scheduledAt: occurredAt,
        durationMinutes: typeof body.durationMinutes === "number" ? body.durationMinutes : undefined,
        location: body.location || undefined,
        panel: Array.isArray(body.panel) ? body.panel.filter(Boolean) : undefined,
        status: body.status || "scheduled",
        outcome: body.outcome || "pending",
        feedback: body.feedback || undefined,
      };
    } else {
      record = {
        ...base,
        kind: "placement",
        startAt: occurredAt,
        endAt: body.endAt || undefined,
        billRate: typeof body.billRate === "number" ? body.billRate : undefined,
        payRate: typeof body.payRate === "number" ? body.payRate : undefined,
        rateUnit: body.rateUnit || undefined,
        currency: body.currency || "USD",
        status: body.status || "active",
        poNumber: body.poNumber || undefined,
      };
    }

    const created = await createPipelineRecord(record);
    if (!created.success) {
      return serverError("Creating pipeline record", created.error, "Couldn't record this step. Please try again.");
    }

    // Advance the candidate's stage, forward only.
    const nextStatus = impliedApplicationStatus(record);
    let statusChanged = false;
    if (isForwardStatusMove(app.status, nextStatus)) {
      const history = app.statusHistory || [];
      const label =
        record.kind === "submission" ? "Submitted to client"
          : record.kind === "interview" ? `Interview round ${record.round} scheduled`
            : "Placed";
      const update = await updateApplication(body.applicationId, {
        status: nextStatus,
        statusHistory: [
          ...history,
          {
            status: nextStatus,
            changedAt: now,
            changedBy: auth.claims.sub,
            changedByName: actorName,
            notes: label,
          },
        ],
      });
      statusChanged = update.success;
    }

    return NextResponse.json({ success: true, record, statusChanged, status: statusChanged ? nextStatus : app.status });
  } catch (error) {
    return serverError("Pipeline create error", error, "Couldn't record this step. Please try again.");
  }
}
