import { NextRequest, NextResponse } from "next/server";
import {
  generateResumeBankKey,
  getResumeUploadUrl,
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

// POST — get presigned upload URL (no DynamoDB write needed)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileName, fileType, fileSize, candidateName, uploadedBy } = body;

    if (!fileName || !fileType || !fileSize || !uploadedBy) {
      return NextResponse.json(
        { error: "Missing required fields: fileName, fileType, fileSize, uploadedBy" },
        { status: 400 },
      );
    }

    const validation = validateResumeFile({ type: fileType, size: fileSize });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const fileKey = generateResumeBankKey(uploadedBy, fileName, candidateName);
    const uploadUrlResult = await getResumeUploadUrl(fileKey, fileType);
    if (!uploadUrlResult.success) {
      return NextResponse.json({ error: uploadUrlResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, uploadUrl: uploadUrlResult.url, fileKey });
  } catch (error) {
    console.error("Resume bank upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
