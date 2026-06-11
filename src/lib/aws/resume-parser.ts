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

export interface ParseResult {
  success: boolean;
  analysis?: ResumeAnalysis;
  error?: string;
}

/**
 * Send a resume file to the extraction Lambda and return the structured result.
 * `personal_information` is intentionally stripped from the result — the
 * candidate's own contact details on the Application stay the source of truth.
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

    // Drop personal_information so we never persist parsed contact details.
    const { personal_information, ...rest } = data;
    void personal_information;

    return { success: true, analysis: rest as ResumeAnalysis };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      success: false,
      error: aborted
        ? "Resume analysis timed out. The document may be unusually long — try again."
        : err instanceof Error
          ? err.message
          : "Failed to reach the resume extraction service.",
    };
  } finally {
    clearTimeout(timer);
  }
}
