import { NextRequest, NextResponse } from "next/server";
import { getJob, createJob, getNextPostingId, Job } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";

// POST /api/jobs/[id]/duplicate - Duplicate a job posting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the original job
    const existingJob = await getJob(id);
    if (!existingJob.success || !existingJob.data) {
      return NextResponse.json(
        { error: "Job not found" },
        { status: 404 }
      );
    }

    const originalJob = existingJob.data;

    // Generate new OB-ID (posting ID)
    const postingIdResult = await getNextPostingId();
    if (!postingIdResult.success || !postingIdResult.postingId) {
      console.error("Failed to generate posting ID:", postingIdResult.error);
    }

    // Create duplicated job with new ID and postingId
    const duplicatedJob: Job = {
      ...originalJob,
      id: uuidv4(),
      postingId: postingIdResult.postingId,
      title: `${originalJob.title} (Copy)`,
      status: "draft", // Always set to draft for duplicates
      createdAt: new Date().toISOString(),
      updatedAt: undefined,
      applicationsCount: 0, // Reset application count
      notificationSentAt: undefined, // Reset notification status
    };

    const result = await createJob(duplicatedJob);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to duplicate job" },
        { status: 500 }
      );
    }

    return NextResponse.json({ job: duplicatedJob }, { status: 201 });
  } catch (error) {
    console.error("Error duplicating job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
