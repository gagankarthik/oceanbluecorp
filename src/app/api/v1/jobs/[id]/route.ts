import { NextRequest, NextResponse } from "next/server";
import { getJob, toFeedJob } from "@/lib/aws/dynamodb";
import { requireApiKey } from "@/lib/auth/api-key";

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
      return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
    }
    if (!result.data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: toFeedJob(result.data) });
  } catch (error) {
    console.error("v1/jobs/[id] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
