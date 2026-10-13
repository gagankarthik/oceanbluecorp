import { createSign } from "node:crypto";

/**
 * Google Indexing API, which Google accepts for JobPosting pages only. A
 * posting that opens is crawled within minutes instead of waiting on the
 * sitemap, and one that closes leaves Google Jobs the same day.
 *
 * Needs a service account that is an Owner of the Search Console property:
 * GOOGLE_INDEXING_CLIENT_EMAIL and GOOGLE_INDEXING_PRIVATE_KEY (the PEM, with
 * literal "\n" allowed). Without them every call is a no-op.
 */

const SITE = "https://oceanbluecorp.com";
const SCOPE = "https://www.googleapis.com/auth/indexing";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const PUBLISH_URL = "https://indexing.googleapis.com/v3/urlNotifications:publish";

let cached: { token: string; exp: number } | null = null;

function credentials() {
  const email = process.env.GOOGLE_INDEXING_CLIENT_EMAIL;
  const key = process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, "\n");
  return email && key ? { email, key } : null;
}

const b64url = (v: string | Buffer) => Buffer.from(v).toString("base64url");

async function accessToken(email: string, key: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.exp - 60 > now) return cached.token;

  const head = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(JSON.stringify({ iss: email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }));
  const signature = createSign("RSA-SHA256").update(`${head}.${claims}`).sign(key, "base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${head}.${claims}.${signature}`,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, exp: now + json.expires_in };
  return json.access_token;
}

/** Tell Google a job page is live (`open`) or gone. Never throws. */
export async function notifyJobIndexing(jobId: string, open: boolean): Promise<void> {
  const creds = credentials();
  if (!creds) return;
  const url = `${SITE}/careers/search/${jobId}`;
  try {
    const token = await accessToken(creds.email, creds.key);
    const res = await fetch(PUBLISH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ url, type: open ? "URL_UPDATED" : "URL_DELETED" }),
    });
    if (!res.ok) console.error(`[indexing] ${url} ${res.status}: ${await res.text()}`);
  } catch (err) {
    console.error(`[indexing] ${url} failed:`, err);
  }
}
