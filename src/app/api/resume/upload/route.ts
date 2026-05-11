import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  generateResumeKey,
  uploadResume,
  createResume,
  validateResumeFile,
} from "@/lib/aws";

// Accept multipart/form-data — uploads file directly from the server to S3.
// This avoids S3 CORS restrictions that break browser-to-S3 presigned PUT requests.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: file and userId" },
        { status: 400 }
      );
    }

    // Validate file type and size
    const validation = validateResumeFile({ type: file.type, size: file.size });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const resumeId = uuidv4();
    const fileKey = generateResumeKey(userId, file.name);

    // Upload directly from the server — no browser CORS issues
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadResume(buffer, fileKey, file.type);

    if (!uploadResult.success) {
      return NextResponse.json({ error: uploadResult.error }, { status: 500 });
    }

    // Persist metadata in DynamoDB
    const createResult = await createResume({
      id: resumeId,
      userId,
      fileName: file.name,
      fileKey,
      fileSize: file.size,
      fileType: file.type,
      uploadedAt: new Date().toISOString(),
    });

    if (!createResult.success) {
      return NextResponse.json({ error: createResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, resumeId, fileKey });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
