import { NextRequest, NextResponse } from "next/server";
import {
  getResume,
  getResumeDownloadUrl,
  deleteResume,
  deleteResumeFromS3,
} from "@/lib/aws";
import { requireStaff } from "@/lib/auth/verify";

// GET - Get resume download URL
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Get resume record from DynamoDB
    const resumeResult = await getResume(id);
    if (!resumeResult.success || !resumeResult.data) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Get presigned download URL
    const downloadUrlResult = await getResumeDownloadUrl(resumeResult.data.fileKey);
    if (!downloadUrlResult.success) {
      return NextResponse.json(
        { error: downloadUrlResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      resume: resumeResult.data,
      downloadUrl: downloadUrlResult.url,
    });
  } catch (error) {
    console.error("Resume download error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete resume
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;

    // Get resume record from DynamoDB
    const resumeResult = await getResume(id);
    if (!resumeResult.success || !resumeResult.data) {
      return NextResponse.json(
        { error: "Resume not found" },
        { status: 404 }
      );
    }

    // Delete from S3
    const s3DeleteResult = await deleteResumeFromS3(resumeResult.data.fileKey);
    if (!s3DeleteResult.success) {
      console.error("Failed to delete from S3:", s3DeleteResult.error);
      // Continue with DynamoDB deletion even if S3 fails
    }

    // Delete from DynamoDB
    const dbDeleteResult = await deleteResume(id);
    if (!dbDeleteResult.success) {
      return NextResponse.json(
        { error: dbDeleteResult.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
