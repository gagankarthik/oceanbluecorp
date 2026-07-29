import { NextRequest, NextResponse } from "next/server";
import { getResumeObject, parseResumeBankKey } from "@/lib/aws";
import { parseResumeBuffer } from "@/lib/aws/resume-parser";
import { embedResume } from "@/lib/aws/match-candidates";
import { requireStaff } from "@/lib/auth/verify";

function deriveFileType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  return "application/octet-stream";
}

// POST /api/resume-bank/index
// Parse + index one or more resume-bank files so they become searchable.
// Body: { fileKeys: string[] }. Each file is parsed via the extraction Lambda
// (30–90s each) then embedded — send small batches (ideally 1) per request so a
// serverless request doesn't time out. Every item is isolated: one failure
// never aborts the others.
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
      const meta = parseResumeBankKey(fileKey);
      const fileName = meta.fileName || fileKey.split("/").pop() || "resume";

      const object = await getResumeObject(fileKey);
      if (!object.success || !object.body) {
        results[fileKey] = { indexed: false, error: object.notFound ? "File missing from storage" : object.error || "Could not read file" };
        continue;
      }

      const parsed = await parseResumeBuffer(object.body, fileName, object.contentType || deriveFileType(fileName));
      if (!parsed.success || !parsed.analysis) {
        results[fileKey] = { indexed: false, error: parsed.error || "Could not parse resume" };
        continue;
      }

      const embedded = await embedResume({
        resumeId: fileKey,
        analysis: parsed.analysis,
        candidateName: meta.candidateName || undefined,
        source: "bank",
      });
      results[fileKey] = embedded.success ? { indexed: true } : { indexed: false, error: embedded.error || "Indexing failed" };
    } catch (e) {
      console.error(`[resume-bank/index] ${fileKey}:`, e);
      results[fileKey] = { indexed: false, error: "Unexpected error indexing this resume" };
    }
  }

  const indexed = Object.values(results).filter((r) => r.indexed).length;
  return NextResponse.json({ success: true, indexed, total: fileKeys.length, results });
}
