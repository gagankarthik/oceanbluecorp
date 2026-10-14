// Completeness and quality checks for a job posting. Pure: shared by the
// editor's Checks tab, the publish confirm and tests/job-quality.test.mjs.
// Blocking checks mirror the server rules (job-input.ts); the rest are advice.

export interface QualityInput {
  title: string;
  type: string;
  workplace?: string;
  location: string;
  /** Rich-text HTML */
  description: string;
  responsibilities: string;
  requirements: string;
  skills: string[];
  submissionDueDate: string;
  /** Commercial names; only checked when `canPrice` */
  clientName?: string;
  vendorName?: string;
  canPrice?: boolean;
}

export interface QualityCheck {
  id: string;
  /** DOM id of the control the check jumps to */
  field: string;
  /** What a passing posting has, in a few words */
  label: string;
  ok: boolean;
  blocking: boolean;
  /** Why it failed, or what to do */
  detail?: string;
}

export const ABOUT_WORDS = { min: 120, max: 700 } as const;
export const SKILLS_RANGE = { min: 3, max: 10 } as const;
export const MIN_BULLETS = 3;

/** Text of editor HTML; list items and paragraphs become separate words. */
export function plainText(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function wordCount(html: string | null | undefined): number {
  const t = plainText(html);
  return t ? t.split(" ").filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
}

/** List items with text; plain text without a list counts its non-empty lines. */
export function bulletCount(html: string | null | undefined): number {
  const s = html ?? "";
  const items = s.match(/<li\b[^>]*>([\s\S]*?)<\/li>/gi);
  if (items) return items.filter((li) => plainText(li)).length;
  if (/<[a-z][\s\S]*>/i.test(s)) return 0;
  return s.split("\n").filter((l) => l.trim()).length;
}

/** Bracketed template prompts still in the text, e.g. "[team size]". */
export function placeholders(text: string): string[] {
  return [...new Set(text.match(/\[[^\]\n]{2,60}\]/g) ?? [])];
}

/** Why a title would read badly on a job board, or null. */
export function titleProblem(title: string): string | null {
  const t = title.trim();
  if (!t) return null;
  if (/\p{Extended_Pictographic}/u.test(t)) return "Remove the emoji; job boards strip or reject them.";
  if (t.includes("!")) return "Drop the exclamation marks.";
  const letters = t.replace(/[^\p{L}]/gu, "");
  // Acronym-only titles ("SAP FICO SME") are fine; shouting a long word is not.
  if (letters.length >= 6 && letters === letters.toUpperCase() && /\p{Lu}{6,}/u.test(t)) {
    return "Use title case instead of all capitals.";
  }
  return null;
}

/** "Acme Corp, Inc." → "Acme Corp", so a leak of the short name is caught too. */
function coreName(name: string): string {
  return name
    .replace(/[,.]?\s+(inc|llc|l\.l\.c|ltd|limited|corp|corporation|co|company|plc|gmbh|group|holdings)\.?$/i, "")
    .replace(/[,.]+$/, "")
    .trim();
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Client or vendor names that appear in public text. Names under three letters are ignored. */
export function nameLeaks(publicText: string, names: (string | undefined)[]): string[] {
  const hits: string[] = [];
  for (const raw of names) {
    const name = raw?.trim();
    if (!name) continue;
    const forms = [...new Set([name, coreName(name)])].filter((f) => f.replace(/[^\p{L}\p{N}]/gu, "").length >= 3);
    if (forms.some((f) => new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRe(f)}($|[^\\p{L}\\p{N}])`, "iu").test(publicText))) hits.push(name);
  }
  return hits;
}

/** Wording that narrows who applies, with a plainer alternative. */
export const INCLUSIVE_TERMS: { term: string; pattern: RegExp; suggestion: string }[] = [
  { term: "rockstar", pattern: /\brock ?stars?\b/i, suggestion: "skilled, expert" },
  { term: "ninja", pattern: /\bninjas?\b/i, suggestion: "expert" },
  { term: "guru", pattern: /\bgurus?\b/i, suggestion: "specialist" },
  { term: "wizard", pattern: /\bwizards?\b/i, suggestion: "expert" },
  { term: "superstar", pattern: /\bsuperstars?\b/i, suggestion: "strong performer" },
  { term: "digital native", pattern: /\bdigital natives?\b/i, suggestion: "comfortable with digital tools" },
  { term: "young", pattern: /\b(young|youthful)\b/i, suggestion: "describe the work, not the age" },
  { term: "recent graduate", pattern: /\brecent (college )?grad(uate)?s?\b/i, suggestion: "early-career" },
  { term: "he / his", pattern: /\b(he|his|him|himself|she|her|hers|herself)\b/i, suggestion: "you, they, the engineer" },
  { term: "manpower", pattern: /\bmanpower\b/i, suggestion: "staffing, people, workforce" },
  { term: "chairman", pattern: /\bchairman\b/i, suggestion: "chair" },
  { term: "salesman", pattern: /\bsales(man|men)\b/i, suggestion: "salesperson" },
  { term: "foreman", pattern: /\bforem[ae]n\b/i, suggestion: "supervisor, lead" },
  { term: "guys", pattern: /\bguys\b/i, suggestion: "everyone, the team" },
  { term: "native English", pattern: /\bnative (english|speaker)/i, suggestion: "fluent in English" },
  { term: "culture fit", pattern: /\bculture fit\b/i, suggestion: "shares our values" },
  { term: "aggressive", pattern: /\baggressive\b/i, suggestion: "ambitious, proactive" },
  { term: "dominant", pattern: /\bdominan(t|ce)\b/i, suggestion: "leading" },
  { term: "able-bodied", pattern: /\bable[- ]bodied\b/i, suggestion: "describe the physical task" },
  { term: "blacklist", pattern: /\b(black|white)[- ]?list/i, suggestion: "blocklist, allowlist" },
];

export function inclusiveLanguageHits(text: string): { term: string; suggestion: string }[] {
  return INCLUSIVE_TERMS.filter((t) => t.pattern.test(text)).map(({ term, suggestion }) => ({ term, suggestion }));
}

function todayIso(now: Date): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Every check in the order the form asks for the fields. */
export function jobChecks(input: QualityInput, now: Date = new Date()): QualityCheck[] {
  const remote = input.workplace === "remote";
  const about = wordCount(input.description);
  const doBullets = bulletCount(input.responsibilities);
  const bringBullets = bulletCount(input.requirements);
  const skills = input.skills.filter((s) => s.trim()).length;
  const publicText = [
    input.title,
    plainText(input.description),
    plainText(input.responsibilities),
    plainText(input.requirements),
    input.skills.join(" "),
  ].join(" \n ");
  const titleIssue = titleProblem(input.title);
  const open = placeholders(publicText);
  const words = inclusiveLanguageHits(publicText);
  const deadline = input.submissionDueDate?.slice(0, 10);

  const checks: QualityCheck[] = [
    { id: "title", field: "job-title", label: "Job title", blocking: true, ok: !!input.title.trim(), detail: "Enter a job title." },
    { id: "type", field: "job-type", label: "Job type", blocking: true, ok: !!input.type, detail: "Choose the job type." },
    {
      id: "location",
      field: "job-location",
      label: remote ? "Location (optional for remote)" : "City",
      blocking: true,
      ok: remote || !!input.location.trim(),
      detail: "Enter the city, or set the workplace to Remote.",
    },
    { id: "description", field: "job-description", label: "About the role", blocking: true, ok: about > 0, detail: "Describe the role." },
    {
      id: "about-length",
      field: "job-description",
      label: `About the role, ${ABOUT_WORDS.min}–${ABOUT_WORDS.max} words`,
      blocking: false,
      ok: about >= ABOUT_WORDS.min && about <= ABOUT_WORDS.max,
      detail: about < ABOUT_WORDS.min
        ? `${plural(about, "word")} so far. Say what the team does and why the role exists.`
        : `${plural(about, "word")}. Trim it; long intros lose candidates.`,
    },
    {
      id: "do-bullets",
      field: "job-responsibilities",
      label: `What you will do, ${MIN_BULLETS}+ points`,
      blocking: false,
      ok: doBullets >= MIN_BULLETS,
      detail: doBullets ? `${plural(doBullets, "point")}. Add the day-to-day work.` : "Add the day-to-day work as a list.",
    },
    {
      id: "bring-bullets",
      field: "job-requirements",
      label: `What you bring, ${MIN_BULLETS}+ points`,
      blocking: false,
      ok: bringBullets >= MIN_BULLETS,
      detail: bringBullets ? `${plural(bringBullets, "point")}. List the must-haves.` : "List the must-haves.",
    },
    {
      id: "skills",
      field: "job-skills",
      label: `Skills, ${SKILLS_RANGE.min}–${SKILLS_RANGE.max}`,
      blocking: false,
      ok: skills >= SKILLS_RANGE.min && skills <= SKILLS_RANGE.max,
      detail: skills > SKILLS_RANGE.max
        ? `${skills} skills. Keep the ${SKILLS_RANGE.max} that decide a hire; matching weighs them all equally.`
        : `${plural(skills, "skill")}. Skills drive search and bench matching.`,
    },
    {
      id: "deadline",
      field: "job-deadline",
      label: "Apply-by date in the future",
      blocking: false,
      ok: !!deadline && deadline >= todayIso(now),
      detail: deadline ? "That date has passed; past-deadline roles close automatically." : "Set a date. Google Jobs shows it, and stale postings close themselves.",
    },
    {
      id: "title-style",
      field: "job-title",
      label: "Title without capitals, emoji or !",
      blocking: false,
      ok: !titleIssue,
      detail: titleIssue ?? undefined,
    },
    {
      id: "placeholders",
      field: "job-description",
      label: "Template prompts filled in",
      blocking: false,
      ok: open.length === 0,
      detail: open.length ? `Fill in ${open.slice(0, 3).join(", ")}${open.length > 3 ? ` and ${open.length - 3} more` : ""}.` : undefined,
    },
    {
      id: "inclusive",
      field: "job-description",
      label: "Inclusive wording",
      blocking: false,
      ok: words.length === 0,
      detail: words.length ? words.map((w) => `“${w.term}” → ${w.suggestion}`).join("; ") : undefined,
    },
  ];

  if (input.canPrice) {
    const leaks = nameLeaks(publicText, [input.clientName, input.vendorName]);
    checks.push({
      id: "name-leak",
      field: "job-description",
      label: "Client and vendor kept off the posting",
      blocking: false,
      ok: leaks.length === 0,
      detail: leaks.length ? `${leaks.join(" and ")} appear${leaks.length === 1 ? "s" : ""} in the public text.` : undefined,
    });
  }
  return checks;
}

export interface QualitySummary {
  passed: number;
  total: number;
  blockingLeft: QualityCheck[];
  advisoryLeft: QualityCheck[];
}

export function summarizeChecks(checks: QualityCheck[]): QualitySummary {
  return {
    passed: checks.filter((c) => c.ok).length,
    total: checks.length,
    blockingLeft: checks.filter((c) => c.blocking && !c.ok),
    advisoryLeft: checks.filter((c) => !c.blocking && !c.ok),
  };
}

/**
 * Google Jobs readiness of a JobPosting object. Required properties block the
 * listing; recommended ones only improve it. `datePosted` is set on publish.
 */
export function googleJobsReadiness(ld: Record<string, unknown>): { ready: boolean; missing: string[]; recommended: string[] } {
  const has = (k: string) => {
    const v = ld[k];
    return v !== undefined && v !== null && !(typeof v === "string" && !v.trim());
  };
  const missing: string[] = [];
  if (!has("title")) missing.push("title");
  if (!has("description") || !plainText(String(ld.description ?? ""))) missing.push("description");
  if (!has("hiringOrganization")) missing.push("hiring organization");
  const remote = ld.jobLocationType === "TELECOMMUTE";
  const address = (ld.jobLocation as { address?: Record<string, unknown> } | undefined)?.address;
  if (!remote && !(address && (address.addressLocality || address.addressRegion))) missing.push("location");
  const recommended: string[] = [];
  if (!has("validThrough")) recommended.push("apply-by date");
  if (!has("baseSalary")) recommended.push("pay range shown");
  if (!has("employmentType") || ld.employmentType === "OTHER") recommended.push("job type");
  return { ready: missing.length === 0, missing, recommended };
}
