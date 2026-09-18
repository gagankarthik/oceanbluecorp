import { NextRequest, NextResponse } from "next/server";
import { getJob, toFeedJob } from "@/lib/aws/dynamodb";
import { requireApiKey } from "@/lib/auth/api-key";
import { serverError } from "@/lib/api-errors";

// GET /api/v1/jobs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiKey(request, "jobs:read");
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const result = await getJob(id);

    if (!result.success) {
      return serverError("v1/jobs/[id] GET failed", result.error, "Couldn't load the job. Please try again.");
    }
    if (!result.data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: toFeedJob(result.data) });
  } catch (error) {
    return serverError("v1/jobs/[id] GET error", error, "Couldn't load the job. Please try again.");
  }
}
