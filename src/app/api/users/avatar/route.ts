import { NextRequest, NextResponse } from "next/server";
import { generateAvatarKey, uploadAvatar, validateAvatarFile } from "@/lib/aws/s3";
import { requireSignedIn, isAdminClaims } from "@/lib/auth/verify";
import { serverError } from "@/lib/api-errors";

export const runtime = "nodejs";

// POST /api/users/avatar?userId=...
// Body is the raw image bytes (Content-Type = the image MIME type). Raw body,
// not multipart, to stay reliable behind Amplify/Lambda. Uploads to S3 under a
// stable per-user key; the photo is served back via /api/users/avatar/[userId].
export async function POST(request: NextRequest) {
  const auth = await requireSignedIn(request);
  if (!auth.ok) return auth.response;
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const contentType = request.headers.get("content-type") || "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    // Own photo only (admins may fix anyone's); otherwise any signed-in account
    // could overwrite a colleague's avatar.
    if (userId !== auth.claims.sub && !isAdminClaims(auth.claims)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const buffer = Buffer.from(await request.arrayBuffer());

    const validation = validateAvatarFile({ type: contentType, size: buffer.length });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const key = generateAvatarKey(userId);
    const result = await uploadAvatar(buffer, key, contentType);
    if (!result.success) {
      return serverError("Avatar upload failed", result.error, "Couldn't upload your photo. Please try again.");
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("Avatar upload error", error, "Couldn't upload your photo. Please try again.");
  }
}
