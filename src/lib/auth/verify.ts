// Server-side Cognito JWT verification + route guards.
//
// The client stores its Cognito tokens (oidc-client-ts) and, on every sign-in
// or token renewal, posts the ID token to /api/auth/session, which verifies it
// and sets an httpOnly `ob_session` cookie. The browser then sends that cookie
// automatically with same-origin API requests, so protected route handlers can
// authorize the caller without any change to client fetch call sites.
//
// Verification is done with Node's built-in crypto against Cognito's JWKS — no
// extra dependency. Route handlers run in the Node.js runtime, so this is safe.
import crypto from "crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-2";
const POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "";
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || "";
const ISSUER = `https://cognito-idp.${REGION}.amazonaws.com/${POOL_ID}`;
const JWKS_URL = `${ISSUER}/.well-known/jwks.json`;

export const SESSION_COOKIE = "ob_session";
const STAFF_GROUPS = ["admin", "hr", "recruiter", "sales"];

type Jwk = { kid: string; kty: string; n: string; e: string; alg?: string; use?: string };

// JWKS rarely rotates; cache it in module memory for an hour.
let jwksCache: { keys: Jwk[]; at: number } | null = null;
const JWKS_TTL_MS = 60 * 60 * 1000;

async function getJwks(): Promise<Jwk[]> {
  if (jwksCache && Date.now() - jwksCache.at < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  if (!res.ok) throw new Error(`Failed to fetch JWKS (${res.status})`);
  const data = (await res.json()) as { keys: Jwk[] };
  jwksCache = { keys: data.keys, at: Date.now() };
  return data.keys;
}

function b64urlToBuffer(s: string): Buffer {
  return Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

export type Claims = { sub: string; email?: string; groups: string[]; tokenUse?: string };

// Verify a Cognito JWT: RS256 signature against JWKS, plus issuer / audience /
// expiry checks. Returns the claims, or null if anything fails.
export async function verifyCognitoJwt(token: string): Promise<Claims | null> {
  try {
    const [h, p, s] = token.split(".");
    if (!h || !p || !s) return null;

    const header = JSON.parse(b64urlToBuffer(h).toString("utf8")) as { alg?: string; kid?: string };
    const payload = JSON.parse(b64urlToBuffer(p).toString("utf8")) as Record<string, unknown>;

    if (header.alg !== "RS256" || !header.kid) return null;
    if (payload.iss !== ISSUER) return null;

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;

    // ID tokens carry `aud` = app client id; access tokens carry `client_id`.
    const aud = (payload.aud as string | undefined) ?? (payload.client_id as string | undefined);
    if (CLIENT_ID && aud !== CLIENT_ID) return null;

    const jwk = (await getJwks()).find((k) => k.kid === header.kid);
    if (!jwk) return null;

    const pubKey = crypto.createPublicKey({ key: jwk as crypto.JsonWebKey, format: "jwk" });
    const valid = crypto.verify("RSA-SHA256", Buffer.from(`${h}.${p}`), pubKey, b64urlToBuffer(s));
    if (!valid) return null;

    const groups = (payload["cognito:groups"] as string[] | undefined) ?? [];
    return {
      sub: String(payload.sub ?? ""),
      email: payload.email as string | undefined,
      groups,
      tokenUse: payload.token_use as string | undefined,
    };
  } catch {
    return null;
  }
}

// Pull the token from the session cookie, falling back to an Authorization
// header (so the same guards work for header-based callers too).
function tokenFromRequest(req: NextRequest): string | null {
  const cookie = req.cookies.get(SESSION_COOKIE)?.value;
  if (cookie) return cookie;
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function getClaims(req: NextRequest): Promise<Claims | null> {
  const token = tokenFromRequest(req);
  return token ? verifyCognitoJwt(token) : null;
}

type Guard = { ok: true; claims: Claims } | { ok: false; response: NextResponse };

const unauthorized = (): NextResponse => NextResponse.json({ error: "Unauthorized" }, { status: 401 });
const forbidden = (): NextResponse => NextResponse.json({ error: "Forbidden" }, { status: 403 });

// Require a signed-in user belonging to any staff group. This closes the
// "anyone with the URL" hole; finer per-role checks remain enforced in the UI.
export async function requireStaff(req: NextRequest): Promise<Guard> {
  const claims = await getClaims(req);
  if (!claims) return { ok: false, response: unauthorized() };
  if (!claims.groups.some((g) => STAFF_GROUPS.includes(g))) return { ok: false, response: forbidden() };
  return { ok: true, claims };
}

// Require the ADMIN group (user management, API keys, etc.).
export async function requireAdmin(req: NextRequest): Promise<Guard> {
  const claims = await getClaims(req);
  if (!claims) return { ok: false, response: unauthorized() };
  if (!claims.groups.includes("admin")) return { ok: false, response: forbidden() };
  return { ok: true, claims };
}
