import { NextRequest, NextResponse } from "next/server";
import { requireStaff, type Claims } from "@/lib/auth/verify";
import {
  getPipelineRecord,
  updatePipelineRecord,
  deletePipelineRecord,
} from "@/lib/aws/dynamodb";
import { loadVisibleApplication } from "@/lib/aws/application-access";
import { editSchema } from "@/lib/pipeline-schema";
import { validate, validationMessage } from "@/lib/validate";
import { serverError } from "@/lib/api-errors";

const notFound = () => NextResponse.json({ error: "Record not found" }, { status: 404 });

/** The record, or null when it is missing or its candidate is in a colleague's private pool. */
async function loadVisibleRecord(id: string, claims: Claims) {
  const result = await getPipelineRecord(id);
  if (!result.success || !result.data) return result.success ? null : result;
  const parent = await loadVisibleApplication(result.data.applicationId, claims);
  return parent?.success ? result : null;
}

// GET /api/pipeline/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await loadVisibleRecord(id, auth.claims);
  if (!result) return notFound();
  if (!result.success) return serverError("Fetching pipeline record", result.error, "Couldn't load the record. Please try again.");
  return NextResponse.json({ success: true, record: result.data });
}

/**
 * PUT /api/pipeline/[id], edit a recorded event.
 *
 * Only the fields the kind declares are editable. Identity (id, kind,
 * applicationId, createdAt) and attribution (createdBy) are not: an interview
 * cannot become a placement, and a record cannot be moved onto another
 * candidate. Re-record it instead, so the history stays honest.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await loadVisibleRecord(id, auth.claims);
    if (!existing) return notFound();
    if (!existing.success || !existing.data) return serverError("Fetching pipeline record for update", existing.error, "Couldn't save the record. Please try again.");

    // Only the fields this kind declares, as on create; identity and attribution are not editable.
    const checked = validate<Record<string, unknown>>(body, editSchema(existing.data.kind));
    if (!checked.ok) return NextResponse.json({ error: validationMessage(checked.errors) }, { status: 400 });
    const updates = checked.value;

    // Keep occurredAt in step with whichever date field this kind owns, so the
    // indexes keep sorting by the date the record is actually about.
    const record = existing.data;
    if (record.kind === "interview" && typeof updates.scheduledAt === "string") {
      updates.occurredAt = updates.scheduledAt;
    }
    if (record.kind === "placement" && typeof updates.startAt === "string") {
      updates.occurredAt = updates.startAt;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const result = await updatePipelineRecord(id, updates);
    if (!result.success) return serverError("Updating pipeline record", result.error, "Couldn't save the record. Please try again.");
    return NextResponse.json({ success: true, record: result.data });
  } catch (error) {
    return serverError("Pipeline update error", error, "Couldn't save the record. Please try again.");
  }
}

/**
 * DELETE /api/pipeline/[id]
 *
 * Deleting a submission also removes the interviews and placement recorded under
 * it, see deletePipelineRecord. The candidate's stage is deliberately left where
 * it is: undoing a mistyped record is not the same as saying the candidate was
 * never submitted, and guessing which it was would be worse than leaving the
 * stage for a human to correct.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const existing = await loadVisibleRecord(id, auth.claims);
  if (!existing) return notFound();
  if (!existing.success) return serverError("Fetching pipeline record for delete", existing.error, "Couldn't delete the record. Please try again.");
  const result = await deletePipelineRecord(id);
  if (!result.success) return serverError("Deleting pipeline record", result.error, "Couldn't delete the record. Please try again.");
  return NextResponse.json({ success: true });
}
