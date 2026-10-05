import { NextRequest, NextResponse } from "next/server";
import { deleteResumeFromS3 } from "@/lib/aws";
import { markBankResumesDeleted } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

const MAX_KEYS = 500;

// POST /api/resume-bank/delete   body: { fileKeys: string[] }
// Delete several bank files at once (the duplicate cleanup). Each key must be a
// resume-bank object. Per-key results, so one failure doesn't hide the rest.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  const body = await request.json().catch(() => null);
  const keys: string[] = Array.isArray(body?.fileKeys)
    ? [...new Set<string>(body.fileKeys.filter((k: unknown): k is string => typeof k === "string" && k.startsWith("resume-bank/")))]
    : [];
  if (keys.length === 0) {
    return NextResponse.json({ error: "No resume-bank files given." }, { status: 400 });
  }
  if (keys.length > MAX_KEYS) {
    return NextResponse.json({ error: `Delete at most ${MAX_KEYS} files at a time.` }, { status: 400 });
  }

  try {
    const results = await Promise.all(
      keys.map(async (key) => ({ key, ok: (await deleteResumeFromS3(key)).success })),
    );
    const deleted = results.filter((r) => r.ok).map((r) => r.key);
    await markBankResumesDeleted(deleted);
    return NextResponse.json({ deleted, failed: results.filter((r) => !r.ok).map((r) => r.key) });
  } catch (error) {
    return serverError("Resume bank bulk delete", error, "Couldn't delete the files. Please try again.");
  }
}
