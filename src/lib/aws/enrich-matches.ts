// Resolve matching-engine results back to what they actually are in this app.
// The engine only knows opaque resume_ids: a resume-bank S3 key, or an
// application id (talent-bench profiles and applicants). The UI needs to know
// which, a bank hit links to a downloadable file and gets its identity from
// the parsed contact card; an application hit links to the candidate's
// profile page. Server-side only (reads DynamoDB).
import { getApplicationsByIds, getBankResumeContacts } from "./dynamodb";
import { parseResumeBankKey } from "./s3";
import { isVisibleApplication, type Viewer } from "@/lib/bench";

export type MatchOrigin = "bank" | "bench" | "applicant";

export interface MatchEnrichment {
  origin: MatchOrigin;
  profileId?: string; // application id → /admin/candidates/{id}
  email?: string;
  phone?: string;
  fileName?: string;  // bank resumes only
  bankId?: string;    // base64url key → GET /api/resume-bank/{bankId} for a download URL
}

/**
 * Attach origin, identity and navigation data to each match. One batched read
 * covers the bank hits and one the application hits. A hit in a colleague's
 * private pool is dropped, as everywhere else. A failed lookup degrades to a
 * plain hit rather than failing the response. A bank file that was deleted
 * is dropped too: the engine keeps its vector, the contact card records the
 * deletion.
 */
export async function enrichMatches<T extends { resume_id: string; candidate_name?: string | null }>(
  candidates: T[],
  viewer: Viewer,
): Promise<(T & MatchEnrichment)[]> {
  const bankKeys = candidates.map((c) => c.resume_id).filter((id) => id.startsWith("resume-bank/"));
  const appIds = candidates.map((c) => c.resume_id).filter((id) => !id.startsWith("resume-bank/"));
  const [contacts, appsResult] = await Promise.all([
    getBankResumeContacts(bankKeys),
    getApplicationsByIds(appIds).catch(() => ({ success: false as const, data: undefined })),
  ]);
  const apps = new Map((appsResult.data || []).map((a) => [a.id, a]));

  const visible = candidates.filter((c) => {
    if (contacts[c.resume_id]?.deleted) return false;
    const app = apps.get(c.resume_id);
    return !app || isVisibleApplication(app, viewer);
  });

  return visible.map((c) => {
      if (c.resume_id.startsWith("resume-bank/")) {
        const meta = parseResumeBankKey(c.resume_id);
        const contact = contacts[c.resume_id];
        return {
          ...c,
          origin: "bank" as const,
          fileName: meta.fileName || c.resume_id.split("/").pop(),
          bankId: Buffer.from(c.resume_id).toString("base64url"),
          candidate_name: contact?.name || c.candidate_name || meta.candidateName || null,
          email: contact?.email,
          phone: contact?.phone,
        };
      }
      const app = apps.get(c.resume_id);
      if (app) {
        return {
          ...c,
          origin: app.addToTalentBench ? ("bench" as const) : ("applicant" as const),
          profileId: app.id,
          email: app.email,
          phone: app.phone,
          candidate_name: c.candidate_name || app.name || null,
        };
      }
      return { ...c, origin: "applicant" as const };
  });
}
