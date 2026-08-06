// Orchestrates resume analysis for an application: pulls the resume file from
// S3, runs it through the extraction Lambda, and persists the structured result
// back onto the application. Server-side only.
//
// Personal information is never written back — only the structured resume
// sections (experience, education, skills, analytics, …) are stored.
import type { ResumeAnalysis } from "./dynamodb";
import { getApplication, getJob, getResume, updateApplication } from "./dynamodb";
import { getResumeObject } from "./s3";
import { parseResumeBuffer } from "./resume-parser";
import { embedResume, scoreResume, jobToPayload } from "./match-candidates";

export interface AnalyzeResult {
  success: boolean;
  error?: string;
  status?: number; // suggested HTTP status for API callers
  /** True when trying again later could plausibly succeed. */
  retryable?: boolean;
}

/**
 * How many times an application may fail before it stops retrying itself. A
 * document that defeats the extractor would otherwise re-run a 30–90s Lambda on
 * every page view, forever.
 */
export const MAX_ANALYSIS_ATTEMPTS = 5;

/**
 * Dead ends — nothing about these changes by waiting. Everything else (token
 * rejected, service 5xx, timeout, network) is treated as retryable, because
 * those are fixed by an env var or by the service coming back, and the record
 * should heal itself once they are.
 */
function isDeadEnd(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("no resume") ||
    m.includes("file record not found") ||
    m.includes("missing from storage") ||
    m.includes("unsupported") ||
    // The engine's own rejections for documents it cannot read: a scan, a photo
    // of a page, an encrypted file. Re-running the pipeline changes nothing.
    m.includes("readable text") ||
    m.includes("password") ||
    m.includes("empty")
  );
}

/**
 * Analyze the resume attached to an application and store the result.
 * Safe to call in the background (fire-and-forget) or awaited from a route.
 */
export async function analyzeApplicationResume(
  applicationId: string,
  /** Cognito sub of the staff member who triggered this, for the engine's log. */
  subject?: string,
  /**
   * An extraction this caller already ran, to be stored instead of running the
   * pipeline again. The new-applicant screen reads the resume up front to fill
   * the form, so without this the same document went through a 30–90 second,
   * ten-agent LLM run twice for one record — paid for twice.
   */
  options?: { analysis?: ResumeAnalysis },
): Promise<AnalyzeResult> {
  // 1. Load the application
  const appResult = await getApplication(applicationId);
  if (!appResult.success || !appResult.data) {
    return { success: false, error: "Application not found", status: 404 };
  }
  const app = appResult.data;

  // Record a failure along with whether it is worth retrying, so the UI can heal
  // itself without a recruiter clicking "Retry analysis" on every record.
  const attemptsSoFar = app.resumeAnalysisAttempts || 0;
  const fail = async (message: string, status: number): Promise<AnalyzeResult> => {
    const retryable = !isDeadEnd(message) && attemptsSoFar + 1 < MAX_ANALYSIS_ATTEMPTS;
    await updateApplication(applicationId, {
      resumeAnalysisStatus: "failed",
      resumeAnalysisError: message,
      resumeAnalysisRetryable: retryable,
      resumeAnalysisAttempts: attemptsSoFar + 1,
    }).catch(() => {});
    return { success: false, error: message, status, retryable };
  };

  if (!app.resumeId) {
    return { success: false, error: "This application has no resume to analyze", status: 400, retryable: false };
  }

  // 2–4. Get a structured analysis: reuse the caller's, or read the file and run
  // the extraction pipeline over it.
  let analysis = options?.analysis;

  if (!analysis) {
    const resumeResult = await getResume(app.resumeId);
    if (!resumeResult.success || !resumeResult.data) {
      return fail("Resume file record not found", 404);
    }
    const resume = resumeResult.data;

    // Mark as processing so the UI can reflect in-flight state on reload.
    await updateApplication(applicationId, { resumeAnalysisStatus: "processing" }).catch(() => {});

    const object = await getResumeObject(resume.fileKey);
    if (!object.success || !object.body) {
      const msg = object.notFound ? "Resume file is missing from storage" : object.error || "Failed to read resume file";
      return fail(msg, 502);
    }

    const parsed = await parseResumeBuffer(
      object.body,
      resume.fileName || "resume",
      resume.fileType || object.contentType || "application/octet-stream",
      subject
    );

    if (!parsed.success || !parsed.analysis) {
      return fail(parsed.error || "Resume analysis failed", 502);
    }
    analysis = parsed.analysis;
  }

  // 5. Persist the structured result
  const saveResult = await updateApplication(applicationId, {
    resumeAnalysis: analysis,
    resumeAnalyzedAt: new Date().toISOString(),
    resumeAnalysisStatus: "completed",
    resumeAnalysisError: "",
    // Clear the failure trail so a record that heals doesn't carry a stale
    // attempt count into some future failure.
    resumeAnalysisRetryable: false,
    resumeAnalysisAttempts: 0,
  });

  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save analysis", status: 500 };
  }

  // Index this candidate in the matching engine so it's searchable immediately.
  // Best-effort: a matching-service hiccup must not fail resume analysis.
  const embedded = await embedResume({
    resumeId: applicationId,
    analysis,
    candidateName: app.name,
    source: "application",
  });
  if (!embedded.success) {
    console.error(`[analyze] matching-engine embed failed (non-fatal) for ${applicationId}: ${embedded.error}`);
  }

  // Auto-score this candidate against the job they applied for, so the
  // application shows "matched / not matched" + missing skills without anyone
  // clicking. Best-effort — never fails the analysis.
  if (app.jobId) {
    try {
      const jobRes = await getJob(app.jobId);
      if (jobRes.success && jobRes.data) {
        const scored = await scoreResume({
          job: jobToPayload(jobRes.data),
          analysis,
          candidateName: app.name,
          resumeId: applicationId,
        });
        if (scored.success && scored.fit) {
          const f = scored.fit;
          await updateApplication(applicationId, {
            jobFit: {
              fitScore: f.fit_score,
              qualified: f.qualified,
              verdict: f.verdict,
              matchedSkills: f.matched_skills || [],
              missingSkills: f.missing_skills || [],
              rationale: f.rationale ?? null,
            },
            jobFitAt: new Date().toISOString(),
          });
        } else if (!scored.success) {
          console.error(`[analyze] job-fit scoring failed (non-fatal) for ${applicationId}: ${scored.error}`);
        }
      }
    } catch (e) {
      console.error(`[analyze] job-fit auto-score errored (non-fatal) for ${applicationId}:`, e);
    }
  }

  return { success: true };
}
