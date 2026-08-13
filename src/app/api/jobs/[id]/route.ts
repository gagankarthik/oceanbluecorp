import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob, toPublicJob, Job } from "@/lib/aws/dynamodb";
import { requireStaff, getClaims } from "@/lib/auth/verify";
import { hasRecruitingAccess } from "@/lib/auth/config";
import { sanitizeRichText } from "@/lib/sanitize-server";

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
      return NextResponse.json(
        { error: result.error || "Failed to fetch job" },
        { status: 500 }
      );
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

    // Media and anonymous callers: public fields only, and only for a posting
    // that is actually open. A draft or closed req is not theirs to read.
    const status = result.data.status;
    if (status !== "active" && status !== "open") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ job: toPublicJob(result.data) });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/jobs/[id] - Update a job
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const body = await request.json();

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
    // New fields
    if (body.clientId !== undefined) updates.clientId = body.clientId;
    if (body.clientName !== undefined) updates.clientName = body.clientName;
    if (body.state !== undefined) updates.state = body.state;
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

    const result = await updateJob(id, updates);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update job" },
        { status: 500 }
      );
    }

    // Fetch updated job
    const updatedJob = await getJob(id);

    return NextResponse.json({ job: updatedJob.data });
  } catch (error) {
    console.error("Error updating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs/[id] - Delete a job
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
      return NextResponse.json(
        { error: result.error || "Failed to delete job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
