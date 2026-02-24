import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob, deleteJob, Job } from "@/lib/aws/dynamodb";

// GET /api/jobs/[id] - Get a specific job
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

    return NextResponse.json({ job: result.data });
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

    // Prepare updates (exclude id, createdAt, createdBy)
    const updates: Partial<Omit<Job, "id" | "createdAt" | "createdBy">> = {};

    if (body.title !== undefined) updates.title = body.title;
    if (body.department !== undefined) updates.department = body.department;
    if (body.location !== undefined) updates.location = body.location;
    if (body.type !== undefined) updates.type = body.type;
    if (body.description !== undefined) updates.description = body.description;
    if (body.requirements !== undefined) updates.requirements = body.requirements;
    if (body.responsibilities !== undefined) updates.responsibilities = body.responsibilities;
    if (body.salary !== undefined) updates.salary = body.salary;
    if (body.status !== undefined) updates.status = body.status;
    if (body.submissionDueDate !== undefined) updates.submissionDueDate = body.submissionDueDate;
    if (body.applicationsCount !== undefined) updates.applicationsCount = body.applicationsCount;
    if (body.notifyHROnApplication !== undefined) updates.notifyHROnApplication = body.notifyHROnApplication;
    if (body.notifyAdminOnApplication !== undefined) updates.notifyAdminOnApplication = body.notifyAdminOnApplication;

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
