import { NextRequest, NextResponse } from "next/server";
import {
  getJob, claimCandidateMatchRun, saveCandidateMatches, failCandidateMatchRun, type Job,
} from "@/lib/aws/dynamodb";
import { matchCandidates, jobToPayload, matchFailureMessage } from "@/lib/aws/match-candidates";
import { enrichMatches } from "@/lib/aws/enrich-matches";
import { requireStaff, viewerOf } from "@/lib/auth/verify";
import { RUN_STALE_MS, isRunning, jobFingerprint } from "@/lib/ranking";

// The engine takes 25–35s warm and longer cold; the platform default would cut it off.
export const maxDuration = 120;

/** What the panel needs about a job's saved ranking, besides the candidates. */
function rankingState(job: Job) {
  const run = job.candidateMatchRun;
  return {
    matchedAt: job.candidateMatchesAt ?? null,
    running: isRunning(run),
    runStartedAt: isRunning(run) ? run!.startedAt : null,
    lastError: run?.state === "failed" ? run.error ?? null : null,
    // Rankings saved before fingerprints existed are not flagged.
    stale: !!job.candidateMatchesMeta && job.candidateMatchesMeta.fingerprint !== jobFingerprint(job),
  };
}

// GET /api/jobs/[id]/match-candidates
// The SAVED ranking, instant, no engine work. Also says whether a run is in
// flight (so a second viewer waits instead of re-running) and whether the job
// was edited after the ranking was made.
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
  // Enrichment (origin, contact, links) is derived on read so it never goes stale.
  const candidates = await enrichMatches(jobResult.data.candidateMatches ?? [], viewerOf(auth.claims));
  return NextResponse.json({ success: true, candidates, ...rankingState(jobResult.data) });
}

// POST /api/jobs/[id]/match-candidates
// Rank the resume bank for this job and SAVE it on the job, so it is run once
// and read thereafter. One run per job at a time. Body: { topK?: number }.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  const { id } = await params;

  const body = await request.json().catch(() => ({}));
  const topK = typeof body?.topK === "number" && Number.isFinite(body.topK)
    ? Math.min(50, Math.max(1, Math.floor(body.topK)))
    : 10;

  const jobResult = await getJob(id);
  if (!jobResult.success || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }
  const job = jobResult.data;
  const by = auth.claims.email || auth.claims.sub;

  const claim = await claimCandidateMatchRun(id, by, RUN_STALE_MS);
  if (!claim.claimed) {
    if (claim.running) {
      return NextResponse.json(
        { error: "A ranking for this job is already running.", running: true, runStartedAt: claim.running.startedAt },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Couldn't start the ranking. Please try again." }, { status: 500 });
  }

  // From here the run must end in a save or a recorded failure, or the job
  // reads as "running" until the marker goes stale.
  const started = Date.now();
  const result = await matchCandidates({ job: jobToPayload(job), topK });
  if (!result.success) {
    console.error(`[match-candidates] job=${id}: ${result.error}`);
    const message = matchFailureMessage(result.reason);
    await failCandidateMatchRun(id, { state: "failed", startedAt: new Date(started).toISOString(), by, error: message });
    return NextResponse.json({ error: message }, { status: result.reason === "timeout" ? 504 : 502 });
  }

  const saved = await saveCandidateMatches(id, result.candidates, {
    fingerprint: jobFingerprint(job),
    by,
    topK,
    durationMs: Date.now() - started,
  });
  if (!saved.success) {
    // The ranking is good; only persisting it failed. Show it, say so.
    console.error(`[match-candidates] save failed for ${id}: ${saved.error}`);
    await failCandidateMatchRun(id, { state: "failed", startedAt: new Date(started).toISOString(), by, error: "The ranking ran but couldn't be saved." });
  }

  const candidates = await enrichMatches(result.candidates, viewerOf(auth.claims));
  return NextResponse.json({
    success: true,
    count: candidates.length,
    candidates,
    matchedAt: saved.matchedAt ?? new Date().toISOString(),
    saved: saved.success,
    running: false,
    stale: false,
  });
}
