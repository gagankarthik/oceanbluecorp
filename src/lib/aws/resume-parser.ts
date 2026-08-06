// Client for the resume-extraction Lambda (FastAPI behind a Lambda Function URL).
// Server-side only — never import this into client components.
//
// The Lambda exposes POST /extract which accepts a multipart file upload and
// returns a fully structured JSON document. The multi-agent LLM pipeline can
// take 30–90 seconds, so callers must allow a long timeout.
import { createHmac } from "node:crypto";
import type { ResumeAnalysis } from "./dynamodb";

// Resolved from env (NEXT_PUBLIC_RESUME_PARSER_API_URL is the configured name);
// falls back to RESUME_PARSER_URL and finally the deployed Function URL.
const DEFAULT_PARSER_URL =
  "https://vsobqovdih6kgz2hk7suap4yw40fdhee.lambda-url.us-east-2.on.aws/";

function getParserBaseUrl(): string {
  const url = (
    process.env.NEXT_PUBLIC_RESUME_PARSER_API_URL ||
    process.env.RESUME_PARSER_URL ||
    DEFAULT_PARSER_URL
  ).trim();
  return url.replace(/\/+$/, ""); // strip trailing slashes
}

// Max time to wait for the Lambda before giving up (ms).
const PARSE_TIMEOUT_MS = Number(process.env.RESUME_PARSER_TIMEOUT_MS || 110_000);

/* ── Upload tickets ──────────────────────────────────────────────────────────
   The engine runs behind a Lambda Function URL with no AWS authentication (a
   30–90s pipeline does not fit behind an API Gateway's 30s timeout), so it
   guards /extract itself: callers must present a short-lived HS256 JWT signed
   with a secret shared between the two services. Sending nothing — which is
   what this app did — earns a 401 "Upload authorisation failed or expired." on
   every resume.

   The ticket is minted per request rather than held anywhere: it lives five
   minutes, and the engine independently refuses any ticket claiming more than
   fifteen. Signed with node:crypto rather than a JWT library — the format is
   three base64url segments and an HMAC, and the engine verifies it with Python's
   stdlib hmac for the same reason.

   Contract, mirrored from the engine's auth.py — changing either side breaks
   uploads: alg HS256, aud "resume-extraction-engine", iat/exp required, and
   exp - iat must not exceed fifteen minutes. */

/** Must match AUDIENCE in the engine's auth.py. */
const TICKET_AUDIENCE = "resume-extraction-engine";

/** Long enough for one upload; far inside the engine's 15-minute ceiling. */
const TICKET_TTL_SECONDS = 300;

/**
 * The shared signing secret. Server-side only — it must never be NEXT_PUBLIC_,
 * because a leaked secret lets anyone run a ten-agent GPT pipeline on our key.
 * RESUME_PARSER_TOKEN is accepted as a legacy alias for the same value.
 */
function getExtractionSecret(): string {
  return (
    process.env.NEXT_EXTRACTION_SHARED_SECRET ||
    process.env.EXTRACTION_SHARED_SECRET ||
    process.env.RESUME_PARSER_TOKEN ||
    ""
  ).trim();
}

const b64url = (input: string): string => Buffer.from(input, "utf8").toString("base64url");

/**
 * Sign an upload ticket. `subject` is logged by the engine to tie an extraction
 * to a person; pass the caller's Cognito sub where one is known.
 */
function mintUploadTicket(secret: string, subject: string): string {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify({
    sub: subject,
    aud: TICKET_AUDIENCE,
    iat: now,
    exp: now + TICKET_TTL_SECONDS,
  }));
  const signature = createHmac("sha256", secret)
    .update(`${header}.${payload}`, "ascii")
    .digest("base64url");
  return `${header}.${payload}.${signature}`;
}

/**
 * Turn the engine's deliberately opaque 401 into something an operator can act
 * on. It says the same sentence whichever part of the ticket failed, which tells
 * a recruiter nothing about a variable missing on our side.
 */
function authFailureMessage(status: number, detail: string): string {
  if (!getExtractionSecret()) {
    return "Resume extraction is not authorised: NEXT_EXTRACTION_SHARED_SECRET is not set on this deployment, so no upload ticket can be signed.";
  }
  return `The extraction service rejected our upload ticket (${status}) — NEXT_EXTRACTION_SHARED_SECRET no longer matches the engine's EXTRACTION_SHARED_SECRET. Service said: ${detail}`;
}

export interface ParsedContact {
  name?: string;
  /** Split by the extractor itself, which beats guessing where a name divides. */
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** From personal_information.address — analytics.primary_location is often null. */
  city?: string;
  state?: string;
}

export interface ParseResult {
  success: boolean;
  analysis?: ResumeAnalysis;
  /**
   * Contact details the extractor found. Deliberately NOT part of `analysis`
   * (which gets persisted onto applications, where the candidate's own details
   * are the source of truth) — callers that have no other identity for the
   * person, like resume-bank indexing, read it from here explicitly.
   */
  contact?: ParsedContact;
  error?: string;
}

/** Pull the person's details out of the extractor's personal_information, whatever keys it used. */
function extractContact(pi: unknown): ParsedContact | undefined {
  if (!pi || typeof pi !== "object") return undefined;
  const p = pi as Record<string, unknown>;

  /**
   * The engine returns email and phone as ARRAYS (a resume may list several) and
   * single strings elsewhere. Reading only strings silently dropped both, which
   * is how a parsed resume came back with no contact details at all.
   */
  const s = (v: unknown): string | undefined => {
    if (typeof v === "string") return v.trim() || undefined;
    if (Array.isArray(v)) {
      for (const item of v) {
        const first = s(item);
        if (first) return first;
      }
    }
    return undefined;
  };

  const firstName = s(p.first_name) || s(p.firstName);
  const lastName = s(p.last_name) || s(p.lastName);
  const joined = [firstName, lastName].filter(Boolean).join(" ");
  const name = s(p.full_name) || s(p.name) || s(p.fullName) || (joined || undefined);
  const email = s(p.email) || s(p.email_address) || s(p.emailAddress);
  const phone = s(p.phone) || s(p.phone_number) || s(p.phoneNumber) || s(p.mobile) || s(p.contact_number);

  // address is a nested object: { full_address, street, city, state, ... }
  const addr = (p.address && typeof p.address === "object" ? p.address : {}) as Record<string, unknown>;
  const city = s(addr.city);
  const state = s(addr.state);

  return name || email || phone || city || state
    ? { name, firstName, lastName, email, phone, city, state }
    : undefined;
}

/**
 * Send a resume file to the extraction Lambda and return the structured result.
 * `personal_information` is stripped out of `analysis` (never persisted there)
 * but surfaced separately as `contact` for callers that need it.
 */
export async function parseResumeBuffer(
  bytes: Uint8Array | Buffer,
  fileName: string,
  contentType: string,
  /** Cognito sub of the staff member behind this call, for the engine's log. */
  subject = "oceanbluecorp"
): Promise<ParseResult> {
  // Both attempts share ONE deadline. Giving the retry a fresh full timeout
  // could run to 220s against a route capped at 120s, so the platform would kill
  // it mid-flight and the caller would see a truncated request rather than the
  // real failure.
  const deadline = Date.now() + PARSE_TIMEOUT_MS;

  const first = await attemptParse(bytes, fileName, contentType, subject, PARSE_TIMEOUT_MS);
  if (first.success || !first.transient) return first;

  // One immediate retry for a service that was merely unavailable — a cold
  // start, a throttle, a dropped connection. Only worth it with enough of the
  // deadline left for the pipeline to actually finish.
  const remaining = deadline - Date.now() - RETRY_DELAY_MS;
  if (remaining < MIN_RETRY_WINDOW_MS) return first;

  await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
  console.warn(`[resume-parser] retrying after transient failure (${Math.round(remaining / 1000)}s left): ${first.error}`);
  // The second attempt mints its own ticket, so a retry can never fail on an
  // expiry the first attempt burned through.
  return attemptParse(bytes, fileName, contentType, subject, remaining);
}

/** Pause before a second attempt, and the least time worth starting one in. */
const RETRY_DELAY_MS = 1_500;
const MIN_RETRY_WINDOW_MS = 45_000;

/** ParseResult plus whether the failure was worth an immediate second try. */
interface AttemptResult extends ParseResult {
  transient?: boolean;
}

async function attemptParse(
  bytes: Uint8Array | Buffer,
  fileName: string,
  contentType: string,
  subject: string,
  timeoutMs: number
): Promise<AttemptResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const form = new FormData();
    // Wrap the bytes in a Blob so fetch builds a proper multipart body. Cast to
    // BlobPart: a Uint8Array is a valid BlobPart at runtime, but TS's strict lib
    // types reject the ArrayBufferLike generic.
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: contentType || "application/octet-stream",
    });
    form.append("file", blob, fileName || "resume");

    const secret = getExtractionSecret();

    const res = await fetch(`${getParserBaseUrl()}/extract`, {
      method: "POST",
      body: form,
      // No secret configured still sends the request: the engine's own 401 (or
      // its 503 when it is the one misconfigured) is more informative than a
      // client-side guess, and authFailureMessage() names the missing variable.
      headers: secret ? { "X-Extraction-Token": mintUploadTicket(secret, subject) } : undefined,
      signal: controller.signal,
    });

    if (!res.ok) {
      let detail = `Extraction service returned ${res.status}`;
      try {
        const err = await res.json();
        if (err?.detail) detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
      } catch {
        /* response body wasn't JSON — keep the status-based message */
      }
      if (res.status === 401 || res.status === 403) {
        // A rejected token is not fixed by trying again a second later.
        return { success: false, error: authFailureMessage(res.status, detail) };
      }
      return { success: false, error: detail, transient: res.status >= 500 };
    }

    const data = (await res.json()) as Record<string, unknown>;

    // Keep personal_information out of the persisted analysis, but hand the
    // contact details back separately for callers that need an identity.
    const { personal_information, ...rest } = data;

    return { success: true, analysis: rest as ResumeAnalysis, contact: extractContact(personal_information) };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      error: aborted
        ? "Resume analysis timed out. The document may be unusually long, try again."
        : err instanceof Error
          ? err.message
          : "Failed to reach the resume extraction service.",
      // A timeout is not retried inside one request — there is no time left for
      // it. Reaching the service failing outright is.
      transient: !aborted,
    };
  } finally {
    clearTimeout(timer);
  }
}
