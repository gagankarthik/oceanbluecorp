import { NextRequest, NextResponse } from "next/server";
import { matchCandidates } from "@/lib/aws/match-candidates";
import { enrichMatches } from "@/lib/aws/enrich-matches";
import { requireStaff } from "@/lib/auth/verify";

// POST /api/match, find candidates for a pasted job description.
// Body: { jobText?: string, job?: {...}, topK?: number }
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  let body: { jobText?: unknown; job?: unknown; topK?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const jobText = typeof body.jobText === "string" ? body.jobText.trim() : undefined;
  const job = body.job && typeof body.job === "object" ? (body.job as Record<string, unknown>) : undefined;

  if (!jobText && !job) {
    return NextResponse.json({ error: "Provide a job description (jobText) or a structured job." }, { status: 400 });
  }
  // Cap pasted text so we don't forward an unbounded payload to the LLM.
  if (jobText && jobText.length > 20_000) {
    return NextResponse.json({ error: "Job description is too long (max 20,000 characters)." }, { status: 413 });
  }

  let topK = 10;
  if (typeof body.topK === "number" && Number.isFinite(body.topK)) {
    topK = Math.min(50, Math.max(1, Math.floor(body.topK)));
  }

  const result = await matchCandidates({ jobText, job: job as never, topK });
  if (!result.success) {
    console.error(`[match] ${result.error}`);
    return NextResponse.json({ error: "Unable to find candidates right now. Please try again." }, { status: 502 });
  }

  // Resolve each hit to its origin (resume bank / talent bench / applicant)
  // so the UI can badge and link it correctly.
  const candidates = await enrichMatches(result.candidates);

  return NextResponse.json({ success: true, count: candidates.length, candidates });
}
