/* Careers facts shared by /careers and every job page. Copy supplied and
   confirmed by the business; change it here, not at a call site. */

export const CAREER_BENEFITS = [
  { title: "Health insurance", desc: "Comprehensive medical, dental, and vision coverage for you and your family." },
  { title: "Retirement plans", desc: "Robust 401(k) and savings options to help you build a secure financial future." },
  { title: "Paid time off", desc: "Generous vacation and sick leave so you have time to rest and recharge." },
] as const;

/** Where candidates send a resume. Matches the address on /contact. */
export const HR_EMAIL = "hr@oceanbluecorp.com";

export const EEO_STATEMENT =
  "Ocean Blue is an equal opportunity employer. We do not discriminate on the basis of race, color, religion, sex, sexual orientation, gender identity, national origin, disability, or veteran status.";

export type WorkMode = "Remote" | "Hybrid" | "On-site";

/**
 * Work arrangement, read from how postings already state it: a "Remote",
 * "Hybrid" or "Onsite" marker in the title or location, or the remote job
 * type. Null when the posting does not say, rather than a guess.
 */
export function workMode(job: { title?: string; location?: string; type?: string }): WorkMode | null {
  const text = `${job.title ?? ""} ${job.location ?? ""}`;
  if (/\bhybrid\b/i.test(text)) return "Hybrid";
  if (job.type === "remote" || /\bremote\b/i.test(text)) return "Remote";
  if (/\bon-?site\b/i.test(text)) return "On-site";
  return null;
}
