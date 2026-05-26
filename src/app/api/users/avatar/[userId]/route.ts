import { NextRequest, NextResponse } from "next/server";
import { generateAvatarKey, getAvatarObject, deleteAvatar } from "@/lib/aws/s3";

export const runtime = "nodejs";

// GET /api/users/avatar/[userId] — streams the user's profile photo from S3.
// 404 when none exists, so the UI can fall back to initials.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const result = await getAvatarObject(generateAvatarKey(userId));

  if (result.notFound || !result.body) {
    return NextResponse.json({ error: "No photo" }, { status: 404 });
  }
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Failed to load photo" }, { status: 500 });
  }

  return new NextResponse(result.body as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": result.contentType || "image/jpeg",
      // Short cache: a re-upload uses a stable key, so headers elsewhere bust it
      // with a ?v= query; 5 min keeps the navbar avatar reasonably fresh.
      "Cache-Control": "public, max-age=300",
    },
  });
}

// DELETE /api/users/avatar/[userId] — removes the user's profile photo.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const result = await deleteAvatar(generateAvatarKey(userId));
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Failed to remove photo" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
