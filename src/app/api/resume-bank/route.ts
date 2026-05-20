import { NextRequest, NextResponse } from "next/server";
import {
  generateResumeBankKey,
  uploadResume,
  validateResumeFile,
  listResumeBankObjects,
  parseResumeBankKey,
} from "@/lib/aws";

function deriveFileType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  return "application/octet-stream";
}

// GET — list all resume bank items from S3 (no DynamoDB)
export async function GET() {
  try {
    const result = await listResumeBankObjects();
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    const resumes = (result.objects || [])
      .map((obj) => {
        const parsed = parseResumeBankKey(obj.key);
        return {
          id: Buffer.from(obj.key).toString("base64url"),
          fileKey: obj.key,
          fileName: parsed.fileName,
          fileSize: obj.size,
          fileType: deriveFileType(parsed.fileName),
          candidateName: parsed.candidateName,
          uploaderEmail: parsed.uploaderEmail,
          uploadedAt: obj.lastModified.toISOString(),
        };
      })
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

    return NextResponse.json({ success: true, resumes });
  } catch (error) {
    console.error("Resume bank list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — upload resume file server-side to S3 (avoids browser CORS restrictions on direct S3 PUT).
// File is sent as a raw binary body with metadata in headers rather than multipart/form-data,
// because AWS Amplify's SSR compute layer does not reliably forward the multipart Content-Type
// (boundary) to the function, which makes request.formData() throw.
export async function POST(request: NextRequest) {
  try {
    const rawFileName = request.headers.get("x-file-name");
    const rawUploadedBy = request.headers.get("x-uploaded-by");
    const rawCandidateName = request.headers.get("x-candidate-name");
    const fileType = request.headers.get("x-file-type") || "application/octet-stream";

    if (!rawFileName || !rawUploadedBy) {
      return NextResponse.json(
        { error: "Missing required fields: file and uploadedBy" },
        { status: 400 },
      );
    }

    // Header values are encodeURIComponent'd on the client to stay ASCII-safe.
    const fileName = decodeURIComponent(rawFileName);
    const uploadedBy = decodeURIComponent(rawUploadedBy);
    const candidateName = rawCandidateName ? decodeURIComponent(rawCandidateName) : undefined;

    const buffer = Buffer.from(await request.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "Empty file body" }, { status: 400 });
    }

    const validation = validateResumeFile({ type: fileType, size: buffer.length });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const fileKey = generateResumeBankKey(uploadedBy, fileName, candidateName);
    const result = await uploadResume(buffer, fileKey, fileType);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, fileKey });
  } catch (error) {
    console.error("Resume bank upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
