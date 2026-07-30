// Resolve matching-engine results back to what they actually are in this app.
// The engine only knows opaque resume_ids: a resume-bank S3 key, or an
// application id (talent-bench profiles and applicants). The UI needs to know
// which — a bank hit links to a downloadable file and gets its identity from
// the parsed contact card; an application hit links to the candidate's
// profile page. Server-side only (reads DynamoDB).
import { getApplication, getBankResumeContacts } from "./dynamodb";
import { parseResumeBankKey } from "./s3";

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
 * covers every bank hit; application hits are per-candidate GetItems on a
 * topK-sized list. A failed lookup degrades to a plain hit rather than
 * failing the response.
 */
export async function enrichMatches<T extends { resume_id: string; candidate_name?: string | null }>(
  candidates: T[],
): Promise<(T & MatchEnrichment)[]> {
  const bankKeys = candidates.map((c) => c.resume_id).filter((id) => id.startsWith("resume-bank/"));
  const contacts = await getBankResumeContacts(bankKeys);

  return Promise.all(
    candidates.map(async (c) => {
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
      try {
        const res = await getApplication(c.resume_id);
        if (res.success && res.data) {
          const app = res.data;
          return {
            ...c,
            origin: app.addToTalentBench ? ("bench" as const) : ("applicant" as const),
            profileId: app.id,
            email: app.email,
            phone: app.phone,
            candidate_name: c.candidate_name || app.name || null,
          };
        }
      } catch {
        /* lookup is best-effort */
      }
      return { ...c, origin: "applicant" as const };
    }),
  );
}
