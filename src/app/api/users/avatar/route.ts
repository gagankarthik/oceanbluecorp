import { NextRequest, NextResponse } from "next/server";
import { generateAvatarKey, uploadAvatar, validateAvatarFile } from "@/lib/aws/s3";
import { requireStaff } from "@/lib/auth/verify";

export const runtime = "nodejs";

// POST /api/users/avatar?userId=...
// Body is the raw image bytes (Content-Type = the image MIME type). Raw body —
// not multipart — to stay reliable behind Amplify/Lambda. Uploads to S3 under a
// stable per-user key; the photo is served back via /api/users/avatar/[userId].
export async function POST(request: NextRequest) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const contentType = request.headers.get("content-type") || "";

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await request.arrayBuffer());

    const validation = validateAvatarFile({ type: contentType, size: buffer.length });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const key = generateAvatarKey(userId);
    const result = await uploadAvatar(buffer, key, contentType);
    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to upload photo" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
