// Client for the Resume Matching Engine (FastAPI behind a Lambda Function URL).
// Server-side ONLY, it reads the secret RESUME_MATCH_API_KEY.
//
// Why the key cannot leak to the browser:
//   1. RESUME_MATCH_API_KEY is a non-`NEXT_PUBLIC_` env var. Next.js only inlines
//      NEXT_PUBLIC_* vars into client bundles; everything else is server-only and
//      resolves to `undefined` in the browser. So the secret is never shipped.
//   2. `import type` for the AWS module keeps the AWS SDK (and its secret env
//      refs) out of any bundle that touches this file.
//   3. This module is imported only by server route handlers, never by a Client
//      Component. The runtime tripwire below throws loudly if that ever changes.
import type { Job, ResumeAnalysis } from "./dynamodb";

if (typeof window !== "undefined") {
  throw new Error("match-candidates.ts is server-only and must not run in the browser.");
}

const DEFAULT_MATCH_URL =
  "https://xfbpwjfbzyj7m52regeunvxyxq0qezkr.lambda-url.us-east-2.on.aws";

function baseUrl(): string {
  return (process.env.RESUME_MATCH_API_URL || DEFAULT_MATCH_URL).trim().replace(/\/+$/, "");
}

function apiKey(): string {
  return (process.env.RESUME_MATCH_API_KEY || "").trim();
}

// Match/score embed, search and LLM re-rank: 25–35s warm, more on a cold start.
// Stays under the routes' 120s maxDuration with room for one retry.
const MATCH_TIMEOUT_MS = Number(process.env.RESUME_MATCH_TIMEOUT_MS || 90_000);
const EMBED_TIMEOUT_MS = Number(process.env.RESUME_EMBED_TIMEOUT_MS || 30_000);
// Status checks run on page loads, keep them snappy so a slow engine can't hang the UI.
const STATUS_TIMEOUT_MS = Number(process.env.RESUME_STATUS_TIMEOUT_MS || 12_000);

export interface MatchCandidate {
  resume_id: string;
  candidate_name: string | null;
  fit_score: number; // 0–100
  similarity: number; // 0–1
  qualified: boolean;
  verdict: "strong" | "possible" | "weak";
  matched_skills: string[];
  missing_skills: string[];
  rationale: string | null;
}

export interface JobFit {
  resume_id: string | null;
  candidate_name: string | null;
  fit_score: number;
  qualified: boolean;
  verdict: "strong" | "possible" | "weak";
  matched_skills: string[];
  missing_skills: string[];
  rationale: string | null;
}

// The structured job payload the engine understands. requirements/responsibilities
// accept HTML/rich-text or string[]; the engine strips tags and splits lines.
interface JobPayload {
  title?: string;
  description?: string;
  requirements?: string | string[];
  responsibilities?: string | string[];
  skills?: string[];
  location?: string;
  employment_type?: string;
  seniority?: string;
}

/** Project a stored Job into the engine's job payload. */
export function jobToPayload(job: Job): JobPayload {
  return {
    title: job.title,
    description: job.description,
    requirements: job.requirements,
    responsibilities: job.responsibilities,
    location: job.location,
    employment_type: job.type,
    skills: job.skills ?? [],
  };
}

type Failure = { ok: false; error: string; status?: number; reason: FailureReason };
export type FailureReason = "config" | "auth" | "timeout" | "unavailable";

/** One engine call, retried once on a 5xx or dropped connection if the clock allows. */
async function call<T>(path: string, body: unknown, timeoutMs: number): Promise<{ ok: true; data: T } | Failure> {
  const started = Date.now();
  const first = await callOnce<T>(path, body, timeoutMs);
  // Only server-side failures are worth a second try; a 4xx will fail the same way.
  if (first.ok || first.reason !== "unavailable" || (first.status !== undefined && first.status < 500)) return first;
  const left = timeoutMs - (Date.now() - started);
  if (left < timeoutMs / 2) return first;
  console.warn(`[match-engine] ${path} failed (${first.error}); retrying once`);
  await new Promise((r) => setTimeout(r, 800));
  return callOnce<T>(path, body, left);
}

async function callOnce<T>(path: string, body: unknown, timeoutMs: number): Promise<{ ok: true; data: T } | Failure> {
  const key = apiKey();
  if (!key) {
    return { ok: false, error: "RESUME_MATCH_API_KEY is not configured on the server.", reason: "config" };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl()}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": key },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      let detail = `Matching service returned ${res.status}`;
      try {
        const err = await res.json();
        if (err?.detail) detail = typeof err.detail === "string" ? err.detail : JSON.stringify(err.detail);
        else if (err?.error) detail = err.error;
      } catch {
        /* non-JSON body */
      }
      const reason: FailureReason = res.status === 401 || res.status === 403 ? "auth" : res.status === 504 ? "timeout" : "unavailable";
      return { ok: false, error: detail, status: res.status, reason };
    }
    return { ok: true, data: (await res.json()) as T };
  } catch (err) {
    const aborted = err instanceof Error && err.name === "AbortError";
    return {
      ok: false,
      error: aborted ? `Matching request timed out after ${Math.round(timeoutMs / 1000)}s.` : err instanceof Error ? err.message : "Failed to reach the matching service.",
      reason: aborted ? "timeout" : "unavailable",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** What the person sees when the engine fails; the raw error goes to the log. */
export function matchFailureMessage(reason: FailureReason | undefined, action = "find candidates"): string {
  switch (reason) {
    case "config": return `Candidate matching isn't set up on this server, so we can't ${action}. Ask an admin to add the matching service key.`;
    case "auth": return "The matching service rejected our key. Ask an admin to check the matching service settings.";
    case "timeout": return `The matching service took too long to ${action}. It is often slow on the first run of the day; try again.`;
    default: return `The matching service couldn't ${action} just now. Try again in a moment.`;
  }
}

/** Job -> ranked candidates. Pass a structured `job` (integration) or `jobText` (pasted JD). */
export async function matchCandidates(opts: {
  job?: JobPayload;
  jobText?: string;
  topK?: number;
}): Promise<{ success: boolean; candidates: MatchCandidate[]; error?: string; reason?: FailureReason }> {
  const result = await call<{ candidates: MatchCandidate[] }>(
    "/match",
    { job: opts.job, job_text: opts.jobText, top_k: opts.topK },
    MATCH_TIMEOUT_MS,
  );
  if (!result.ok) return { success: false, candidates: [], error: result.error, reason: result.reason };
  return { success: true, candidates: result.data.candidates || [] };
}

/** One resume vs a job -> fit verdict. Provide the resume inline (`analysis`) or by stored `resumeId`. */
export async function scoreResume(opts: {
  job?: JobPayload;
  jobText?: string;
  resumeId?: string;
  analysis?: ResumeAnalysis;
  candidateName?: string;
}): Promise<{ success: boolean; fit?: JobFit; error?: string; reason?: FailureReason }> {
  const result = await call<JobFit>(
    "/score",
    {
      job: opts.job,
      job_text: opts.jobText,
      resume_id: opts.resumeId,
      analysis: opts.analysis,
      candidate_name: opts.candidateName,
    },
    MATCH_TIMEOUT_MS,
  );
  if (!result.ok) return { success: false, error: result.error, reason: result.reason };
  return { success: true, fit: result.data };
}

/** Which of these resume ids are already indexed in the matching bank? */
export async function resumesIndexed(resumeIds: string[]): Promise<Record<string, boolean>> {
  if (resumeIds.length === 0) return {};
  const result = await call<{ indexed: Record<string, boolean> }>("/vectors/exists", { resume_ids: resumeIds }, STATUS_TIMEOUT_MS);
  if (!result.ok) return {};
  return result.data.indexed || {};
}

/** Add (or refresh) a parsed resume in the searchable bank. Safe to fire-and-forget. */
export async function embedResume(opts: {
  resumeId: string;
  analysis: ResumeAnalysis;
  candidateName?: string;
  source?: string;
}): Promise<{ success: boolean; error?: string }> {
  const result = await call<{ stored: boolean }>(
    "/embed",
    {
      resume_id: opts.resumeId,
      candidate_name: opts.candidateName,
      analysis: opts.analysis,
      source: opts.source || "application",
    },
    EMBED_TIMEOUT_MS,
  );
  if (!result.ok) return { success: false, error: result.error };
  return { success: true };
}
