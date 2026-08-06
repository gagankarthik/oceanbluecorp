import { NextRequest, NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth/verify";
import { parseResumeBuffer } from "@/lib/aws/resume-parser";
import { validateResumeFile } from "@/lib/aws";

// The extraction Lambda's pipeline can take 30–90s.
export const maxDuration = 120;
export const dynamic = "force-dynamic";

// POST /api/resume/parse — read a resume and return its structured content.
//
// Deliberately stateless: nothing is written to S3 or DynamoDB. This backs the
// "upload a resume to fill the form" step on the new-applicant screen, where the
// recruiter must be able to review and correct what was extracted before any
// record exists. The file itself is uploaded later, on save, by /api/resume/upload.
//
// The file arrives as a raw binary body with metadata in headers rather than
// multipart/form-data: Amplify's SSR compute layer does not reliably forward the
// multipart boundary, which makes request.formData() throw (same reason as
// /api/resume-bank).
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;

  try {
    const rawFileName = request.headers.get("x-file-name");
    if (!rawFileName) {
      return NextResponse.json({ error: "Missing x-file-name header" }, { status: 400 });
    }
    const fileName = decodeURIComponent(rawFileName);
    const fileType = request.headers.get("x-file-type") || "application/octet-stream";

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty file body" }, { status: 400 });
    }

    const validation = validateResumeFile({ type: fileType, size: buffer.length, name: fileName });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const parsed = await parseResumeBuffer(buffer, fileName, fileType, auth.claims.sub);
    if (!parsed.success || !parsed.analysis) {
      return NextResponse.json(
        { error: parsed.error || "Could not read this resume" },
        { status: 502 },
      );
    }

    // contact is returned separately from analysis on purpose — the recruiter is
    // filling in a person's identity here, which never gets persisted as part of
    // the stored analysis.
    return NextResponse.json({
      success: true,
      contact: parsed.contact ?? null,
      analysis: parsed.analysis,
    });
  } catch (error) {
    console.error("Resume parse error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
