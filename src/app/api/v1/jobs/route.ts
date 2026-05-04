import { NextRequest, NextResponse } from "next/server";
import { getAllJobs, getApiKeyByValue, updateApiKey, Job } from "@/lib/aws/dynamodb";

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

  // Fire-and-forget lastUsedAt update
  updateApiKey(result.data.id, { lastUsedAt: new Date().toISOString() }).catch(() => {});

  return { ok: true };
}

// GET /api/v1/jobs
export async function GET(request: NextRequest) {
  const auth = await authenticate(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as Job["status"] | null;
    const department = searchParams.get("department");
    const type = searchParams.get("type");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    // Default to active/open jobs only
    const filterStatus = (status === "active" || status === "open" || status === "paused" || status === "closed")
      ? status
      : undefined;

    const result = await getAllJobs(filterStatus);
    if (!result.success) {
      return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
    }

    let jobs = (result.data || [])
      .filter((j) => !filterStatus ? (j.status === "active" || j.status === "open") : true)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (department) jobs = jobs.filter((j) => j.department.toLowerCase() === department.toLowerCase());
    if (type) jobs = jobs.filter((j) => j.type === type);

    const total = jobs.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginated = jobs.slice(offset, offset + limit);

    return NextResponse.json({
      data: paginated.map(sanitizeJob),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("v1/jobs GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
