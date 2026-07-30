import { NextRequest, NextResponse, after } from "next/server";
import {
  indexChainKey,
  processIndexHop,
  type IndexJobPayload,
} from "@/lib/aws/index-resumes";
import { requireStaff } from "@/lib/auth/verify";

// One hop = up to 3 resumes, and a full parse can take 30–90s each — the batch
// runs in parallel so 120s covers the worst case plus the next-hop handoff.
export const maxDuration = 120;

// POST /api/resume-bank/index-run
// One hop of the self-chaining indexing job. Called by index-all / by the
// previous hop with the internal key; staff auth also accepted so a hop can be
// resumed manually. Responds 202 before doing any work.
export async function POST(request: NextRequest) {
  const secret = indexChainKey();
  const provided = (request.headers.get("x-index-key") || "").trim();
  const internal = !!secret && provided === secret;
  if (!internal) {
    const auth = await requireStaff(request);
    if (!auth.ok) return auth.response;
  }

  let body: Partial<IndexJobPayload>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const bank = Array.isArray(body.bank) ? body.bank.filter((k): k is string => typeof k === "string" && k.length > 0) : [];
  const apps = Array.isArray(body.apps) ? body.apps.filter((k): k is string => typeof k === "string" && k.length > 0) : [];
  const depth = typeof body.depth === "number" && Number.isFinite(body.depth) ? Math.max(0, Math.floor(body.depth)) : 0;

  if (bank.length + apps.length === 0) {
    return NextResponse.json({ accepted: true, remaining: 0 });
  }

  const selfUrl = new URL("/api/resume-bank/index-run", request.nextUrl.origin).toString();
  after(() => processIndexHop({ bank, apps, depth }, selfUrl));

  return NextResponse.json({ accepted: true, remaining: bank.length + apps.length }, { status: 202 });
}
