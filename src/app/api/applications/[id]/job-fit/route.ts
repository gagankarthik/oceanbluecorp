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
  /**
   * Never serve a verdict scored against a different job.
   *
   * The PUT handler clears the cache when a candidate is moved, which is the
   * primary fix. This is the backstop: any other path that changes `jobId` —
   * an import, a script, a future route — would otherwise resurrect the same
   * bug, and the failure is silent by nature. Comparing the stamp costs one
   * field on a read that already has the record in hand.
   *
   * A missing `jobFitJobId` is grandfathered rather than treated as stale:
   * every score written before the stamp existed lacks it, and invalidating
   * all of them would bill a re-score for records that were never moved. Those
   * are covered by the PUT clear the moment they actually are.
   */
  const app = result.data;
  const stale = !!app.jobFit && !!app.jobFitJobId && app.jobFitJobId !== app.jobId;

  return NextResponse.json({
    jobFit: stale ? null : app.jobFit ?? null,
    jobFitAt: stale ? null : app.jobFitAt ?? null,
    // Lets the card explain the empty state rather than looking unscored.
    staleForJobChange: stale,
  });
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
  await updateApplication(id, { jobFit, jobFitAt, jobFitJobId: app.jobId }).catch((e) => console.error(`[job-fit] cache write failed for ${id}:`, e));

  return NextResponse.json({ jobFit, jobFitAt, jobFitJobId: app.jobId });
}
