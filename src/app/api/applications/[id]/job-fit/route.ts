import { NextRequest, NextResponse } from "next/server";
import { getApplication, getJob, updateApplication, type JobFitResult } from "@/lib/aws/dynamodb";
import { scoreResume, jobToPayload, type JobFit } from "@/lib/aws/match-candidates";
import { requireStaff } from "@/lib/auth/verify";

function toResult(fit: JobFit): JobFitResult {
  return {
    fitScore: fit.fit_score,
    qualified: fit.qualified,
    verdict: fit.verdict,
    matchedSkills: fit.matched_skills || [],
    missingSkills: fit.missing_skills || [],
    rationale: fit.rationale ?? null,
  };
}

// GET — return the cached job-fit verdict (null if not scored yet).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const result = await getApplication(id);
  if (!result.success || !result.data) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  return NextResponse.json({ jobFit: result.data.jobFit ?? null, jobFitAt: result.data.jobFitAt ?? null });
}

// POST — (re)score this application's resume against its job, then cache it.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const appResult = await getApplication(id);
  if (!appResult.success || !appResult.data) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }
  const app = appResult.data;

  if (!app.jobId) {
    return NextResponse.json({ error: "This application isn't linked to a job." }, { status: 400 });
  }
  if (!app.resumeAnalysis) {
    return NextResponse.json({ error: "Analyze the resume first — no parsed resume to score." }, { status: 409 });
  }

  const jobResult = await getJob(app.jobId);
  if (!jobResult.success || !jobResult.data) {
    return NextResponse.json({ error: "Linked job not found" }, { status: 404 });
  }

  const scored = await scoreResume({
    job: jobToPayload(jobResult.data),
    analysis: app.resumeAnalysis,
    candidateName: app.name,
    resumeId: app.id,
  });
  if (!scored.success || !scored.fit) {
    console.error(`[job-fit] application=${id}: ${scored.error}`);
    return NextResponse.json({ error: "Unable to score this resume right now. Please try again." }, { status: 502 });
  }

  const jobFit = toResult(scored.fit);
  const jobFitAt = new Date().toISOString();
  // Best-effort cache — a failed write shouldn't fail the request.
  await updateApplication(id, { jobFit, jobFitAt }).catch((e) => console.error(`[job-fit] cache write failed for ${id}:`, e));

  return NextResponse.json({ jobFit, jobFitAt });
}
