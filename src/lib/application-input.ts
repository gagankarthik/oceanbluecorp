// Size and shape checks on a staff application write. Public posts already go
// through PUBLIC_APPLICATION_SCHEMA; staff bodies carry more fields, so they get
// limits here rather than a closed schema.

export const APPLICATION_STATUSES = [
  "pending", "reviewing", "submitted", "interview", "offered", "hired", "rejected", "active", "inactive",
] as const;

const TEXT_LIMITS: Record<string, number> = {
  name: 200, firstName: 100, lastName: 100, email: 254, phone: 40, linkedinUrl: 2048,
  address: 300, city: 100, state: 100, zipCode: 20,
  jobId: 64, source: 100, workAuthorization: 100, hireType: 40, visaExpiry: 40,
  ownership: 254, ownershipName: 200, statusNote: 2000,
  experience: 20_000, coverLetter: 20_000, notes: 5_000,
  resumeId: 128, resumeFileName: 255, resumeFileKey: 1024,
};

/** First problem with a staff application body, or null. */
export function applicationInputError(body: Record<string, unknown>): string | null {
  if (body.status !== undefined && !(APPLICATION_STATUSES as readonly unknown[]).includes(body.status)) {
    return "Invalid status value";
  }
  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    const v = body[field];
    if (v === undefined || v === null) continue;
    if (typeof v !== "string") return `${field} must be text`;
    if (v.length > max) return `${field} must be ${max.toLocaleString("en-US")} characters or fewer`;
  }
  if (body.skills !== undefined) {
    if (!Array.isArray(body.skills) || body.skills.length > 200 || body.skills.some((s) => typeof s !== "string" || s.length > 100)) {
      return "skills must be a list of up to 200 short strings";
    }
  }
  if (body.rating !== undefined && body.rating !== null) {
    const r = Number(body.rating);
    if (!Number.isInteger(r) || r < 0 || r > 5) return "rating must be a whole number from 0 to 5";
  }
  return null;
}

// Bookkeeping a save writes on its own; never reported as a staff edit.
const UNTRACKED = new Set([
  "updatedAt", "statusHistory", "notesHistory", "activity", "tasks", "name",
  "jobFit", "jobFitAt", "jobFitJobId", "ownershipClaimedAt", "ownershipName", "benchAddedBy",
  "resumeAnalysisStatus", "resumeAnalysisError", "resumeAnalysisAttempts", "resumeAnalysisRetryable",
  "resumeAnalyzedAt", "resumeFileName", "resumeFileKey",
]);

/** Fields an update actually changes, for the change log. */
export function changedFields(before: Record<string, unknown>, updates: Record<string, unknown>): string[] {
  const same = (a: unknown, b: unknown) =>
    JSON.stringify(a ?? "") === JSON.stringify(b ?? "");
  return Object.keys(updates)
    .filter((k) => !UNTRACKED.has(k) && updates[k] !== undefined && !same(before[k], updates[k]))
    .sort();
}

const FIELD_LABELS: Record<string, string> = {
  firstName: "first name", lastName: "last name", linkedinUrl: "LinkedIn", zipCode: "ZIP code",
  jobId: "job", jobTitle: "job", workAuthorization: "work authorization", hireType: "type of hire",
  visaSponsorshipRequired: "sponsorship", visaExpiry: "visa expiry", addToTalentBench: "bench",
  benchType: "pool", resumeId: "resume", resumeAnalysis: "parsed resume", coverLetter: "cover letter",
};

/** "Changed email, phone and stage" */
export function describeChange(fields: string[]): string {
  const labels = [...new Set(fields.map((f) => FIELD_LABELS[f] ?? (f === "status" ? "stage" : f)))];
  if (labels.length === 0) return "Saved with no changes";
  const list = labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
  return `Changed ${list}`;
}

/** The kind of change log entry an edit gets. */
export function changeKind(fields: string[]): "edit" | "bench" | "ownership" | "resume" {
  if (fields.includes("resumeId")) return "resume";
  if (fields.includes("addToTalentBench") || fields.includes("benchType")) return "bench";
  if (fields.length > 0 && fields.every((f) => f === "ownership")) return "ownership";
  return "edit";
}

/** An existing candidate the new one may duplicate. */
export interface DuplicateMatch {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  status: string;
  matchedOn: Array<"email" | "name">;
}

/** Lookup key for the email index: trimmed, lowercased. */
export function emailKeyOf(email: string | null | undefined): string | undefined {
  const k = (email ?? "").trim().toLowerCase();
  return k || undefined;
}

/**
 * Lookup key for the name index: "José  O'Neil-Smith" → "jose o neil smith".
 * Accents, case, punctuation and spacing don't make two people different.
 */
export function nameKeyOf(
  app: { name?: string | null; firstName?: string | null; lastName?: string | null },
): string | undefined {
  const raw = [app.firstName, app.lastName].filter(Boolean).join(" ") || app.name || "";
  const k = raw
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  // A single token ("jane") would match half the database.
  return k.includes(" ") ? k : undefined;
}
