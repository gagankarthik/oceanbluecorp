// Orchestrates resume analysis for an application: pulls the resume file from
// S3, runs it through the extraction Lambda, and persists the structured result
// back onto the application. Server-side only.
//
// Personal information is never written back — only the structured resume
// sections (experience, education, skills, analytics, …) are stored.
import { getApplication, getJob, getResume, updateApplication } from "./dynamodb";
import { getResumeObject } from "./s3";
import { parseResumeBuffer } from "./resume-parser";
import { embedResume, scoreResume, jobToPayload } from "./match-candidates";

export interface AnalyzeResult {
  success: boolean;
  error?: string;
  status?: number; // suggested HTTP status for API callers
}

/**
 * Analyze the resume attached to an application and store the result.
 * Safe to call in the background (fire-and-forget) or awaited from a route.
 */
export async function analyzeApplicationResume(applicationId: string): Promise<AnalyzeResult> {
  // 1. Load the application
  const appResult = await getApplication(applicationId);
  if (!appResult.success || !appResult.data) {
    return { success: false, error: "Application not found", status: 404 };
  }
  const app = appResult.data;

  if (!app.resumeId) {
    return { success: false, error: "This application has no resume to analyze", status: 400 };
  }

  // 2. Resolve the resume file metadata
  const resumeResult = await getResume(app.resumeId);
  if (!resumeResult.success || !resumeResult.data) {
    await updateApplication(applicationId, {
      resumeAnalysisStatus: "failed",
      resumeAnalysisError: "Resume file record not found",
    }).catch(() => {});
    return { success: false, error: "Resume file record not found", status: 404 };
  }
  const resume = resumeResult.data;

  // Mark as processing so the UI can reflect in-flight state on reload.
  await updateApplication(applicationId, { resumeAnalysisStatus: "processing" }).catch(() => {});

  // 3. Download the file bytes from S3
  const object = await getResumeObject(resume.fileKey);
  if (!object.success || !object.body) {
    const msg = object.notFound ? "Resume file is missing from storage" : object.error || "Failed to read resume file";
    await updateApplication(applicationId, {
      resumeAnalysisStatus: "failed",
      resumeAnalysisError: msg,
    }).catch(() => {});
    return { success: false, error: msg, status: 502 };
  }

  // 4. Run the extraction Lambda
  const parsed = await parseResumeBuffer(
    object.body,
    resume.fileName || "resume",
    resume.fileType || object.contentType || "application/octet-stream"
  );

  if (!parsed.success || !parsed.analysis) {
    const msg = parsed.error || "Resume analysis failed";
    await updateApplication(applicationId, {
      resumeAnalysisStatus: "failed",
      resumeAnalysisError: msg,
    }).catch(() => {});
    return { success: false, error: msg, status: 502 };
  }

  // 5. Persist the structured result
  const saveResult = await updateApplication(applicationId, {
    resumeAnalysis: parsed.analysis,
    resumeAnalyzedAt: new Date().toISOString(),
    resumeAnalysisStatus: "completed",
    resumeAnalysisError: "",
  });

  if (!saveResult.success) {
    return { success: false, error: saveResult.error || "Failed to save analysis", status: 500 };
  }

  // Index this candidate in the matching engine so it's searchable immediately.
  // Best-effort: a matching-service hiccup must not fail resume analysis.
  const embedded = await embedResume({
    resumeId: applicationId,
    analysis: parsed.analysis,
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
          analysis: parsed.analysis,
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
