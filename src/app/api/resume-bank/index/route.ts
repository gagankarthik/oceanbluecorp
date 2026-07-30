import { NextRequest, NextResponse } from "next/server";
import { indexBankFile } from "@/lib/aws/index-resumes";
import { requireStaff } from "@/lib/auth/verify";

// A parse can take 30–90s; allow a couple per request.
export const maxDuration = 120;

// POST /api/resume-bank/index
// Parse + index one or more resume-bank files so they become searchable.
// Body: { fileKeys: string[] }. Used for single-row retries in the UI; the
// bulk "Index all" path goes through /api/resume-bank/index-all, which runs
// as a cloud-side background job instead of many browser-driven requests.
// Every item is isolated: one failure never aborts the others.
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  let body: { fileKeys?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fileKeys = Array.isArray(body.fileKeys)
    ? body.fileKeys.filter((k): k is string => typeof k === "string" && k.length > 0)
    : [];
  if (fileKeys.length === 0) {
    return NextResponse.json({ error: "Provide fileKeys: string[]." }, { status: 400 });
  }
  // Guard against an over-long serverless request.
  if (fileKeys.length > 10) {
    return NextResponse.json({ error: "Index at most 10 resumes per request." }, { status: 400 });
  }

  const results: Record<string, { indexed: boolean; error?: string }> = {};

  for (const fileKey of fileKeys) {
    try {
      results[fileKey] = await indexBankFile(fileKey);
    } catch (e) {
      console.error(`[resume-bank/index] ${fileKey}:`, e);
      results[fileKey] = { indexed: false, error: "Unexpected error indexing this resume" };
    }
  }

  const indexed = Object.values(results).filter((r) => r.indexed).length;
  return NextResponse.json({ success: true, indexed, total: fileKeys.length, results });
}
