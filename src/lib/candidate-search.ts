// What a candidate search actually looks at.
//
// The Applications search used to match six identity fields — name, email,
// application id, job title, phone, city. That meant searching "java" found
// whoever applied to a job with Java in its TITLE, and missed every candidate
// whose resume is full of Java: the parsed analysis was already loaded in the
// browser and simply never consulted. A recruiter searching a skill is asking
// "who can do this", not "who applied to a role we happened to name that way".
//
// Type-only import, so this stays safe in client components.
import type { Application } from "@/lib/aws/dynamodb";

/** Collect the non-empty strings out of a possibly-missing array. */
function strings(values?: Array<string | null | undefined>): string[] {
  return (values || []).filter((v): v is string => typeof v === "string" && v.trim() !== "");
}

/**
 * Everything about a candidate that a search should match, as one lowercase
 * string.
 *
 * Deliberately includes the parsed resume: skills by every category the
 * extractor reports, job titles and employers from the work history, the
 * technologies used on each role, certifications, and the industry. Education
 * and personal detail are left out — searching "Austin" should find a candidate
 * in Austin, not everyone who went to university there.
 *
 * Long prose is left out too — the professional summary and per-role
 * descriptions. Recruiters search skills, employers and titles, not sentences,
 * and this string is sent to the browser for every candidate in a list: paragraphs
 * would put back most of the payload it exists to avoid. Full text is still on
 * the record itself, which the detail screen loads.
 */
export function candidateHaystack(app: Application): string {
  const parts: string[] = [
    ...strings([app.name, app.firstName, app.lastName, app.email, app.phone]),
    ...strings([app.applicationId, app.jobTitle, app.city, app.state]),
    ...strings([app.workAuthorization, app.source, app.hireType]),
    ...strings(app.skills),
  ];

  const analysis = app.resumeAnalysis;
  if (analysis) {
    const s = analysis.skills;
    if (s) {
      parts.push(
        ...strings(s.all_skills_raw), ...strings(s.technical_skills),
        ...strings(s.programming_languages), ...strings(s.frameworks_and_libraries),
        ...strings(s.databases), ...strings(s.cloud_platforms),
        ...strings(s.tools_and_platforms), ...strings(s.methodologies),
        ...strings(s.domain_skills), ...strings(s.other_skills),
      );
      for (const category of s.categories || []) parts.push(...strings(category.skills));
    }

    for (const role of analysis.work_experience || []) {
      parts.push(...strings([role.job_title, role.company_name]));
      parts.push(...strings(role.technologies_used));
    }

    for (const cert of analysis.certifications || []) {
      parts.push(...strings([cert.name, cert.issuing_organization]));
    }

    for (const project of analysis.projects || []) {
      parts.push(...strings([project.name, project.role]));
      parts.push(...strings(project.technologies));
    }

    const a = analysis.analytics;
    if (a) parts.push(...strings([a.primary_industry, a.career_level, ...(a.job_functions || [])]));
  }

  // Deduplicated: a skill repeated across five roles adds nothing to a substring
  // match, and every copy is bytes on the wire.
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(key);
  }
  return unique.join("  ");
}

/**
 * The haystack for a record, preferring one the server already built.
 *
 * List responses carry `searchText` and NOT `resumeAnalysis`: shipping every
 * parsed resume to the browser so it could be searched there cost 2.76MB across
 * 174 candidates, 88% of it analysis. Detail screens hold the full record, where
 * this falls back to computing the haystack directly.
 */
export function haystackOf(app: Application): string {
  return app.searchText || candidateHaystack(app);
}

/**
 * Split a query into terms, all of which must match (AND).
 *
 * "java aws" should mean both, which is how anyone types a skill search. A
 * single term behaves exactly as the old substring match did.
 */
export function searchTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

/** True when every term appears somewhere in the haystack. */
export function matchesTerms(haystack: string, terms: string[]): boolean {
  return terms.every((t) => haystack.includes(t));
}
