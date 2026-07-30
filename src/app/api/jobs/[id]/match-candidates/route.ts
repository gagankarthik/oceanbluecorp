import { NextRequest, NextResponse } from "next/server";
import { getJob, updateJob } from "@/lib/aws/dynamodb";
import { matchCandidates, jobToPayload } from "@/lib/aws/match-candidates";
import { enrichMatches } from "@/lib/aws/enrich-matches";
import { requireStaff } from "@/lib/auth/verify";

// GET /api/jobs/[id]/match-candidates
// Return the CACHED ranking (instant — no embedding/LLM work). The resumes were
// vectorized once at parse time; this just reads the last saved result.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const jobResult = await getJob(id);
  if (!jobResult.success || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  // The cache stores the raw engine result; origin/link data is derived on
  // read so it never goes stale (e.g. a candidate later added to the bench).
  const candidates = await enrichMatches(jobResult.data.candidateMatches ?? []);
  return NextResponse.json({
    success: true,
    candidates,
    matchedAt: jobResult.data.candidateMatchesAt ?? null,
    cached: true,
  });
}

// POST /api/jobs/[id]/match-candidates
// Recompute the ranking (embeds only the job, searches the stored resume vectors,
// LLM re-ranks the shortlist) and CACHE it on the job. Body: { topK?: number }.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  let topK = 10;
  try {
    const body = await request.json().catch(() => ({}));
    if (typeof body?.topK === "number" && Number.isFinite(body.topK)) {
      topK = Math.min(50, Math.max(1, Math.floor(body.topK)));
    }
  } catch {
    /* empty/invalid body — use default */
  }

  const jobResult = await getJob(id);
  if (!jobResult.success || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const result = await matchCandidates({ job: jobToPayload(jobResult.data), topK });
  if (!result.success) {
    console.error(`[match-candidates] job=${id}: ${result.error}`);
    return NextResponse.json({ error: "Unable to find candidates right now. Please try again." }, { status: 502 });
  }

  const matchedAt = new Date().toISOString();
  // Cache the RAW ranking so re-opening the job page is instant; enrichment is
  // derived on every read. Best-effort.
  await updateJob(id, { candidateMatches: result.candidates, candidateMatchesAt: matchedAt }).catch((e) =>
    console.error(`[match-candidates] cache write failed for ${id}:`, e),
  );

  const candidates = await enrichMatches(result.candidates);
  return NextResponse.json({ success: true, count: candidates.length, candidates, matchedAt });
}
