// Orchestrates resume analysis for an application: pulls the resume file from
// S3, runs it through the extraction Lambda, and persists the structured result
// back onto the application. Server-side only.
//
// Personal information is never written back — only the structured resume
// sections (experience, education, skills, analytics, …) are stored.
import { getApplication, getResume, updateApplication } from "./dynamodb";
import { getResumeObject } from "./s3";
import { parseResumeBuffer } from "./resume-parser";

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

  return { success: true };
}
