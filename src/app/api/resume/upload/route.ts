import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getClaims } from "@/lib/auth/verify";
import { hasRecruitingAccess } from "@/lib/auth/config";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  generateResumeKey,
  uploadResume,
  createResume,
  validateResumeFile,
  MAX_RESUME_SIZE,
} from "@/lib/aws";
import { serverError } from "@/lib/api-errors";

const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * The stored Content-Type, decided from the bytes rather than the browser.
 *
 * validateResumeFile passes a file on its MIME *or* its extension (browsers
 * disagree about Word types), and the object was then stored with whatever
 * `file.type` the caller claimed. So `x.pdf` sent as text/html landed in S3 as
 * HTML, and the presigned download link rendered it inline on the bucket's
 * origin. Sniffing the signature closes that and still accepts every real
 * resume: PDF, OLE (.doc), ZIP (.docx), and RTF saved with a .doc name.
 */
function sniffResumeType(buf: Buffer): string | null {
  const head = buf.subarray(0, 1024).toString("latin1");
  if (head.includes("%PDF-")) return "application/pdf";
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return DOCX_TYPE;
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) {
    return "application/msword";
  }
  if (head.startsWith("{\\rtf")) return "application/msword";
  return null;
}

// Accept multipart/form-data, uploads file directly from the server to S3.
// This avoids S3 CORS restrictions that break browser-to-S3 presigned PUT requests.
export async function POST(request: NextRequest) {
  try {
    // Unauthenticated by design, the public careers form uploads through here,
    // so anonymous callers are throttled. Each accepted request writes a 5MB-max
    // S3 object plus a DynamoDB row, which is worth abusing.
    const claims = await getClaims(request);
    if (!claims || !hasRecruitingAccess(claims.groups)) {
      const limited = await checkRateLimit(request, RATE_LIMITS.resumeUpload);
      if (!limited.allowed) return limited.response!;
    }

    // Refuse an oversized body before buffering it. The header can lie, so the
    // file size is checked again below; this only stops the honest large case
    // from being read into memory first.
    const declared = Number(request.headers.get("content-length") || 0);
    if (declared > MAX_RESUME_SIZE + 64 * 1024) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 413 });
    }

    const formData = await request.formData();

    const file = formData.get("file");
    const rawUserId = formData.get("userId");

    if (!(file instanceof File) || typeof rawUserId !== "string" || !rawUserId.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: file and userId" },
        { status: 400 }
      );
    }

    const userId = rawUserId.trim().slice(0, 254);
    // It also becomes an S3 path segment; keep that to one segment of safe chars.
    const keyOwner = userId.replace(/[^a-zA-Z0-9@._+-]/g, "_");
    const fileName = file.name.slice(0, 255);

    // Validate file type and size
    const validation = validateResumeFile({ type: file.type, size: file.size, name: fileName });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = sniffResumeType(buffer);
    if (!contentType) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload a PDF or Word document (.pdf, .doc, .docx)." },
        { status: 400 }
      );
    }

    const resumeId = uuidv4();
    const fileKey = generateResumeKey(keyOwner, fileName);

    // Upload directly from the server, no browser CORS issues
    const uploadResult = await uploadResume(buffer, fileKey, contentType);

    if (!uploadResult.success) {
      return serverError("Resume upload to S3 failed", uploadResult.error, "Could not upload the resume. Please try again.");
    }

    // Persist metadata in DynamoDB
    const createResult = await createResume({
      id: resumeId,
      userId,
      fileName,
      fileKey,
      fileSize: file.size,
      fileType: contentType,
      uploadedAt: new Date().toISOString(),
    });

    if (!createResult.success) {
      return serverError("Resume record create failed", createResult.error, "Could not upload the resume. Please try again.");
    }

    return NextResponse.json({ success: true, resumeId, fileKey });
  } catch (error) {
    return serverError("Resume upload error", error, "Could not upload the resume. Please try again.");
  }
}
