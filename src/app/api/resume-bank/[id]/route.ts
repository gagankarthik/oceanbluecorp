import { NextRequest, NextResponse } from "next/server";
import { getResumeDownloadUrl, deleteResumeFromS3 } from "@/lib/aws";

function decodeKey(id: string): string {
  return Buffer.from(id, "base64url").toString("utf8");
}

// GET — presigned download URL for a bank resume
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const fileKey = decodeKey(id);

    const urlResult = await getResumeDownloadUrl(fileKey);
    if (!urlResult.success) {
      return NextResponse.json({ error: urlResult.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, downloadUrl: urlResult.url });
  } catch (error) {
    console.error("Resume bank get error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — remove from S3 only (no DynamoDB)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const fileKey = decodeKey(id);

    const result = await deleteResumeFromS3(fileKey);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume bank delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
