import { NextRequest, NextResponse } from "next/server";
import { getResumeDownloadUrl, deleteResumeFromS3 } from "@/lib/aws";
import { markBankResumesDeleted } from "@/lib/aws/dynamodb";
import { requireStaff } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

/** The S3 key, or null when the id doesn't name a resume-bank file. */
function decodeKey(id: string): string | null {
  const key = Buffer.from(id, "base64url").toString("utf8");
  return key.startsWith("resume-bank/") && !key.includes("..") ? key : null;
}

const notFound = () => NextResponse.json({ error: "Resume not found" }, { status: 404 });

// GET, presigned download URL for a bank resume
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(_request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const fileKey = decodeKey(id);
    if (!fileKey) return notFound();

    const urlResult = await getResumeDownloadUrl(fileKey);
    if (!urlResult.success) {
      return serverError("Resume bank download URL", urlResult.error, "Couldn't open the resume. Please try again.");
    }

    return NextResponse.json({ success: true, downloadUrl: urlResult.url });
  } catch (error) {
    return serverError("Resume bank get error", error, "Couldn't open the resume. Please try again.");
  }
}

// DELETE, remove from S3 and flag the contact card so matches drop it
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStaff(_request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const fileKey = decodeKey(id);
    if (!fileKey) return notFound();

    const result = await deleteResumeFromS3(fileKey);
    if (!result.success) {
      return serverError("Resume bank delete", result.error, "Couldn't delete the resume. Please try again.");
    }
    await markBankResumesDeleted([fileKey]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Resume bank delete error", error, "Couldn't delete the resume. Please try again.");
  }
}
