import { NextRequest, NextResponse } from "next/server";
import { getJob, getApiKeyByValue, updateApiKey, Job } from "@/lib/aws/dynamodb";

function sanitizeJob(job: Job) {
  return {
    id: job.id,
    postingId: job.postingId,
    title: job.title,
    department: job.department,
    location: job.location,
    state: job.state,
    type: job.type,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    salary: job.salary,
    status: job.status,
    submissionDueDate: job.submissionDueDate,
    clientName: job.clientName,
    vendorName: job.vendorName,
    postedByName: job.postedByName,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}

async function authenticate(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key") || request.nextUrl.searchParams.get("api_key");
  if (!apiKey) return { ok: false, status: 401, message: "Missing API key. Pass X-API-Key header." };

  const result = await getApiKeyByValue(apiKey);
  if (!result.success || !result.data) return { ok: false, status: 401, message: "Invalid API key." };
  if (!result.data.isActive) return { ok: false, status: 403, message: "API key is disabled." };

  updateApiKey(result.data.id, { lastUsedAt: new Date().toISOString() }).catch(() => {});

  return { ok: true };
}

// GET /api/v1/jobs/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { id } = await params;
    const result = await getJob(id);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch job" }, { status: 500 });
    }
    if (!result.data) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ data: sanitizeJob(result.data) });
  } catch (error) {
    console.error("v1/jobs/[id] GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
