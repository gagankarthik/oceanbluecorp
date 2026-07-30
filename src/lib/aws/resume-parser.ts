// Client for the resume-extraction Lambda (FastAPI behind a Lambda Function URL).
// Server-side only — never import this into client components.
//
// The Lambda exposes POST /extract which accepts a multipart file upload and
// returns a fully structured JSON document. The multi-agent LLM pipeline can
// take 30–90 seconds, so callers must allow a long timeout.
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

export interface ParsedContact {
  name?: string;
  email?: string;
  phone?: string;
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

/** Pull name/email/phone out of the extractor's personal_information, whatever keys it used. */
function extractContact(pi: unknown): ParsedContact | undefined {
  if (!pi || typeof pi !== "object") return undefined;
  const p = pi as Record<string, unknown>;
  const s = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
  const joined = [s(p.first_name), s(p.last_name)].filter(Boolean).join(" ");
  const name = s(p.full_name) || s(p.name) || s(p.fullName) || (joined || undefined);
  const email = s(p.email) || s(p.email_address) || s(p.emailAddress);
  const phone = s(p.phone) || s(p.phone_number) || s(p.phoneNumber) || s(p.mobile) || s(p.contact_number);
  return name || email || phone ? { name, email, phone } : undefined;
}

/**
 * Send a resume file to the extraction Lambda and return the structured result.
 * `personal_information` is stripped out of `analysis` (never persisted there)
 * but surfaced separately as `contact` for callers that need it.
 */
export async function parseResumeBuffer(
  bytes: Uint8Array | Buffer,
  fileName: string,
  contentType: string
): Promise<ParseResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PARSE_TIMEOUT_MS);

  try {
    const form = new FormData();
    // Wrap the bytes in a Blob so fetch builds a proper multipart body. Cast to
    // BlobPart: a Uint8Array is a valid BlobPart at runtime, but TS's strict lib
    // types reject the ArrayBufferLike generic.
    const blob = new Blob([bytes as unknown as BlobPart], {
      type: contentType || "application/octet-stream",
    });
    form.append("file", blob, fileName || "resume");

    const res = await fetch(`${getParserBaseUrl()}/extract`, {
      method: "POST",
      body: form,
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
      return { success: false, error: detail };
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
    };
  } finally {
    clearTimeout(timer);
  }
}
