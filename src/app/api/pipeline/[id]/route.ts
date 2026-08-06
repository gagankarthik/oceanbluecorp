import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/verify";
import {
  getPipelineRecord,
  updatePipelineRecord,
  deletePipelineRecord,
} from "@/lib/aws/dynamodb";

// GET /api/pipeline/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const result = await getPipelineRecord(id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  if (!result.data) return NextResponse.json({ error: "Record not found" }, { status: 404 });
  return NextResponse.json({ success: true, record: result.data });
}

/**
 * PUT /api/pipeline/[id] — edit a recorded event.
 *
 * The identity fields (id, kind, applicationId, createdAt) are not editable: an
 * interview cannot become a placement, and a record cannot be moved onto another
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

    const existing = await getPipelineRecord(id);
    if (!existing.success) return NextResponse.json({ error: existing.error }, { status: 500 });
    if (!existing.data) return NextResponse.json({ error: "Record not found" }, { status: 404 });

    const { id: _id, kind: _kind, applicationId: _appId, createdAt: _createdAt, ...updates } =
      body as Record<string, unknown>;
    void _id; void _kind; void _appId; void _createdAt;

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
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
    return NextResponse.json({ success: true, record: result.data });
  } catch (error) {
    console.error("Pipeline update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/pipeline/[id]
 *
 * Deleting a submission also removes the interviews and placement recorded under
 * it — see deletePipelineRecord. The candidate's stage is deliberately left where
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
  const result = await deletePipelineRecord(id);
  if (!result.success) return NextResponse.json({ error: result.error }, { status: 500 });
  return NextResponse.json({ success: true });
}
