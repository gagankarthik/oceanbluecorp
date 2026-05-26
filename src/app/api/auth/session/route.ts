import { NextRequest, NextResponse } from "next/server";
import { verifyCognitoJwt, SESSION_COOKIE } from "@/lib/auth/verify";

// Establishes / clears the httpOnly session cookie used to authorize the
// internal API. The client posts the Cognito ID token it already holds; we
// verify it before trusting it as a cookie, so this endpoint can't be used to
// plant an arbitrary cookie. Setting a cookie from a token the caller already
// has is not a privilege escalation.

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

// POST — verify the token and set the session cookie.
export async function POST(req: NextRequest) {
  let body: { token?: unknown; expiresIn?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (typeof body.token !== "string") {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const claims = await verifyCognitoJwt(body.token);
  if (!claims) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  // Cap the cookie lifetime to the token's remaining lifetime (max 1h).
  const requested = typeof body.expiresIn === "number" && body.expiresIn > 0 ? body.expiresIn : 3600;
  const maxAge = Math.min(Math.floor(requested), 3600);

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, body.token, cookieOptions(maxAge));
  return res;
}

// DELETE — clear the session cookie (sign-out).
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", cookieOptions(0));
  return res;
}
