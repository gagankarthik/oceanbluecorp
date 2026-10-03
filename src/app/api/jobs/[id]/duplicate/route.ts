import { NextRequest, NextResponse } from "next/server";
import { getJob, createJob, getNextPostingId, toPublicJob, Job } from "@/lib/aws/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { requireJobEditor } from "@/lib/auth/verify";
import { hasJobCommercialAccess } from "@/lib/auth/config";
import { serverError } from "@/lib/api-errors";

// POST /api/jobs/[id]/duplicate - Duplicate a job posting
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Duplicating is authoring a posting, so it follows the edit rule, not the recruiting one.
  const auth = await requireJobEditor(request);
  if (!auth.ok) return auth.response;
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
      return serverError("Generating posting ID", postingIdResult.error, "Couldn't duplicate the job. Please try again.");
    }

    // Media copies the posting copy only; the commercials stay with recruiting.
    const canPrice = hasJobCommercialAccess(auth.claims.groups);
    const duplicatedJob: Job = {
      ...(canPrice ? originalJob : (toPublicJob(originalJob) as Job)),
      createdBy: auth.claims.sub,
      postedByEmail: auth.claims.email || originalJob.postedByEmail,
      publishedAt: undefined,
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
      return serverError("Duplicating job", result.error, "Couldn't duplicate the job. Please try again.");
    }

    return NextResponse.json({ job: canPrice ? duplicatedJob : toPublicJob(duplicatedJob) }, { status: 201 });
  } catch (error) {
    return serverError("Error duplicating job", error, "Couldn't duplicate the job. Please try again.");
  }
}
