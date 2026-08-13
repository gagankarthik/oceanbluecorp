import { NextRequest, NextResponse } from "next/server";
import { generateAvatarKey, getAvatarObject, deleteAvatar } from "@/lib/aws/s3";
import { requireSignedIn } from "@/lib/auth/verify";

export const runtime = "nodejs";

/**
 * GET /api/users/avatar/[userId], streams the user's profile photo from S3.
 *
 * "No photo uploaded" is the NORMAL case for most staff, not an error, so it
 * answers 204 No Content rather than 404. The <img> still fails to decode and
 * the UI still falls back to initials via onError, but the browser console no
 * longer logs a red 404 on every admin page load for every user who simply
 * never set a picture. Reserve 4xx for things that are actually wrong.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireSignedIn(_request);
  if (!auth.ok) return auth.response;
  const { userId } = await params;
  const result = await getAvatarObject(generateAvatarKey(userId));

  if (result.notFound || !result.body) {
    return new NextResponse(null, {
      status: 204,
      // Cache the "nothing here" answer too, or every navigation re-asks.
      headers: { "Cache-Control": "public, max-age=300" },
    });
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

// DELETE /api/users/avatar/[userId], removes the user's profile photo.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const auth = await requireSignedIn(_request);
  if (!auth.ok) return auth.response;
  const { userId } = await params;
  const result = await deleteAvatar(generateAvatarKey(userId));
  if (!result.success) {
    return NextResponse.json({ error: result.error || "Failed to remove photo" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
