// Maps an extraction result onto the fields of the new/edit applicant form.
//
// Pure and dependency-light on purpose: only TYPE imports touch the AWS modules
// so this stays safe to use from client components (see CLAUDE.md, a value
// import from lib/aws ships the SDK and its env references to the browser).
import type { ResumeAnalysis } from "@/lib/aws/dynamodb";
import { normalizeState } from "@/components/admin/theme";

/** What the extractor found about the person, as returned by /api/resume/parse. */
export interface ParsedResumeContact {
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
}

export interface ResumePrefill {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  skills: string[];
  experience: string;
}

/** Which prefill keys actually carry a value, drives the "filled from resume" summary. */
export type PrefillFilledKey = keyof ResumePrefill;

const clean = (v: unknown): string =>
  typeof v === "string" && v.trim() ? v.trim() : "";

/**
 * Split a full name into first / last. Everything after the first token is the
 * surname, so "Ana Maria Ruiz" keeps "Maria Ruiz" together rather than dropping
 * the middle name, losing part of a candidate's name is worse than a long
 * last-name field the recruiter can correct.
 */
function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

/**
 * Pull "Austin, TX" style locations apart. Only a state we recognise is used;
 * an unrecognised tail (a country, a region) is left out rather than guessed,
 * and the leading segment becomes the city.
 */
function splitLocation(location: string): { city: string; state: string } {
  const segments = location.split(",").map((s) => s.trim()).filter(Boolean);
  if (segments.length === 0) return { city: "", state: "" };
  if (segments.length === 1) {
    // A bare token could be either, treat a recognised state as a state.
    const asState = normalizeState(segments[0]);
    return asState ? { city: "", state: asState } : { city: segments[0], state: "" };
  }
  // Scan the tail segments for something that resolves to a US state.
  for (let i = segments.length - 1; i >= 1; i--) {
    const asState = normalizeState(segments[i]);
    if (asState) return { city: segments[0], state: asState };
  }
  return { city: segments[0], state: "" };
}

/** Technical skills first, in the order a recruiter would read them off a resume. */
function collectSkills(analysis: ResumeAnalysis, limit = 20): string[] {
  const s = analysis.skills;
  if (!s) return [];
  const ordered = [
    ...(s.programming_languages || []),
    ...(s.frameworks_and_libraries || []),
    ...(s.databases || []),
    ...(s.cloud_platforms || []),
    ...(s.tools_and_platforms || []),
    ...(s.technical_skills || []),
    ...(s.methodologies || []),
    ...(s.domain_skills || []),
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of ordered) {
    const skill = clean(raw);
    if (!skill) continue;
    const key = skill.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(skill);
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * The experience summary the form shows. The extractor's own professional
 * summary is preferred; without one, the most recent roles are listed so the
 * field is never left blank when the resume clearly has a work history.
 */
function buildExperienceSummary(analysis: ResumeAnalysis): string {
  const summary = clean(analysis.professional_summary) || clean(analysis.objective);
  const roles = (analysis.work_experience || []).slice(0, 4).map((role) => {
    const title = clean(role.job_title);
    const company = clean(role.company_name);
    const dates = [clean(role.start_date), role.is_current ? "Present" : clean(role.end_date)]
      .filter(Boolean)
      .join(" – ");
    const head = [title, company].filter(Boolean).join(" @ ");
    return [head, dates && `(${dates})`].filter(Boolean).join(" ");
  }).filter(Boolean);

  const years = analysis.analytics?.total_years_of_experience;
  const header = typeof years === "number" && years > 0
    ? `${years} year${years === 1 ? "" : "s"} of experience.`
    : "";

  return [header, summary, roles.length ? roles.map((r) => `• ${r}`).join("\n") : ""]
    .filter(Boolean)
    .join("\n\n");
}

/** Build the form prefill from an extraction result. Never throws on partial data. */
export function buildResumePrefill(
  analysis: ResumeAnalysis | undefined,
  contact?: ParsedResumeContact,
): ResumePrefill {
  const a = analysis || {};

  // Prefer the extractor's own split; fall back to dividing the full name.
  const split = splitName(clean(contact?.name));
  const firstName = clean(contact?.firstName) || split.firstName;
  const lastName = clean(contact?.lastName) || split.lastName;

  // The address on personal_information is populated far more often than
  // analytics.primary_location, which comes back null on plenty of resumes.
  const fromAnalytics = splitLocation(clean(a.analytics?.primary_location));
  const city = clean(contact?.city) || fromAnalytics.city;
  const state = normalizeState(clean(contact?.state)) || fromAnalytics.state;

  return {
    firstName,
    lastName,
    email: clean(contact?.email),
    phone: clean(contact?.phone),
    city,
    state,
    skills: collectSkills(a),
    experience: buildExperienceSummary(a),
  };
}

/** Human labels for what was filled, for the confirmation banner. */
export const PREFILL_LABELS: Record<PrefillFilledKey, string> = {
  firstName: "first name",
  lastName: "last name",
  email: "email",
  phone: "phone",
  city: "city",
  state: "state",
  skills: "skills",
  experience: "experience summary",
};

/** Keys that came back with something usable. */
export function filledKeys(prefill: ResumePrefill): PrefillFilledKey[] {
  return (Object.keys(PREFILL_LABELS) as PrefillFilledKey[]).filter((k) => {
    const v = prefill[k];
    return Array.isArray(v) ? v.length > 0 : !!v;
  });
}
