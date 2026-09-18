import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob, toPublicJob, Job } from "@/lib/aws/dynamodb";
import { requireStaff, requireJobEditor, getClaims } from "@/lib/auth/verify";
import { hasRecruitingAccess, hasJobEditAccess, hasJobCommercialAccess } from "@/lib/auth/config";
import { sanitizeRichText } from "@/lib/sanitize-server";
import { serverError } from "@/lib/api-errors";
import { isPubliclyOpen } from "@/lib/job-status";

/**
 * GET /api/jobs/[id]
 *
 * The projection is resolved from the caller, matching the list route:
 * recruiting staff get the full record, everyone else gets the public one.
 *
 * This used to return the WHOLE record, unguarded, to anyone who had a job id,
 * pay rate, client bill rate, client and vendor names, the recruitment manager
 * and every assignee's email address. Nothing legitimate depended on that: the
 * public careers page reads DynamoDB directly and applies `toPublicJob` itself,
 * so the only callers of this route are admin screens. Found while giving Media
 * read-only postings, since "media must not see commercials" is unenforceable
 * while an unauthenticated GET hands them over.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await getJob(id);

    if (!result.success) {
      return serverError("Error fetching job", result.error, "Couldn't load the job. Please try again.");
    }

    if (!result.data) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const claims = await getClaims(request);
    if (hasRecruitingAccess(claims?.groups)) {
      return NextResponse.json({ job: result.data });
    }

    // Media: public fields only, but at any status. It authors postings, so
    // the draft it is part-way through writing has to be loadable — while the
    // commercials stay stripped, exactly as they are in the list route.
    if (hasJobEditAccess(claims?.groups)) {
      return NextResponse.json({ job: toPublicJob(result.data) });
    }

    // Anonymous callers: public fields, and only for a posting that is
    // actually open. A draft or closed req is not theirs to read.
    const status = result.data.status;
    if (!isPubliclyOpen(status)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job: toPublicJob(result.data) });
  } catch (error) {
    return serverError("Error fetching job", error, "Couldn't load the job. Please try again.");
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireJobEditor(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();

    /* Same split as the create route: media edits the posting's words, not its
       commercials. Every gated field is skipped outright rather than written
       as undefined — an update that set clientName to undefined would ERASE a
       client a recruiter had recorded, which is a worse failure than refusing
       the write. */
    const canPrice = hasJobCommercialAccess(auth.claims.groups);

    // Check if job exists
    const existingJob = await getJob(id);
    if (!existingJob.success || !existingJob.data) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    // Prepare updates (exclude id, createdAt, createdBy, postingId)
    const updates: Partial<Omit<Job, "id" | "createdAt" | "createdBy" | "postingId">> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.department !== undefined) updates.department = body.department;
    if (body.location !== undefined) updates.location = body.location;
    if (body.type !== undefined) updates.type = body.type;
    if (body.description !== undefined) updates.description = sanitizeRichText(body.description);
    if (body.requirements !== undefined) updates.requirements = typeof body.requirements === "string" ? sanitizeRichText(body.requirements) : body.requirements;
    if (body.responsibilities !== undefined) updates.responsibilities = typeof body.responsibilities === "string" ? sanitizeRichText(body.responsibilities) : body.responsibilities;
    if (body.salary !== undefined) updates.salary = body.salary;
    if (body.status !== undefined) updates.status = body.status;
    if (body.submissionDueDate !== undefined) updates.submissionDueDate = body.submissionDueDate;
    if (body.applicationsCount !== undefined) updates.applicationsCount = body.applicationsCount;
    if (body.state !== undefined) updates.state = body.state;

    // ── commercial half, recruiting roles only ──
    if (canPrice) {
      if (body.clientId !== undefined) updates.clientId = body.clientId;
      if (body.clientName !== undefined) updates.clientName = body.clientName;
      if (body.clientBillRate !== undefined) updates.clientBillRate = body.clientBillRate;
      if (body.payRate !== undefined) updates.payRate = body.payRate;
      if (body.recruitmentManagerId !== undefined) updates.recruitmentManagerId = body.recruitmentManagerId;
      if (body.recruitmentManagerName !== undefined) updates.recruitmentManagerName = body.recruitmentManagerName;
      if (body.recruitmentManagerEmail !== undefined) updates.recruitmentManagerEmail = body.recruitmentManagerEmail;
      // Multi-select assignees
      if (body.assignedToIds !== undefined) updates.assignedToIds = body.assignedToIds;
      if (body.assignedToNames !== undefined) updates.assignedToNames = body.assignedToNames;
      if (body.assignedToEmails !== undefined) updates.assignedToEmails = body.assignedToEmails;
      if (body.excludedDepartments !== undefined) updates.excludedDepartments = body.excludedDepartments;
    }

    const result = await updateJob(id, updates);

    if (!result.success) {
      return serverError("Updating job", result.error, "Couldn't save the job. Please try again.");
    }

    // Fetch updated job. Answered through the same projection the GET uses, so
    // a media editor never receives commercials on the way back out either.
    const updatedJob = await getJob(id);
    const saved = updatedJob.data;
    return NextResponse.json({
      job: saved ? (canPrice ? saved : toPublicJob(saved)) : saved,
    });
  } catch (error) {
    return serverError("Error updating job", error, "Couldn't save the job. Please try again.");
  }
}

/**
 * DELETE /api/jobs/[id]
 *
 * Still {@link requireStaff}, not requireJobEditor: media may author a posting
 * and retire it by setting the status, but deleting the record destroys the
 * applications attached to it, and that is recruiting's call. `canEditJobs` is
 * about the copy; this is about the req.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Check if job exists
    const existingJob = await getJob(id);
    if (!existingJob.success || !existingJob.data) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const result = await deleteJob(id);

    if (!result.success) {
      return serverError("Deleting job", result.error, "Couldn't delete the job. Please try again.");
    }

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    return serverError("Error deleting job", error, "Couldn't delete the job. Please try again.");
  }
}
