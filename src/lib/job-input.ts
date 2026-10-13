// Server-side checks on a job write. Pure, so the rules are tested in isolation.

import { toNumber } from "./form-validation";
import { isPubliclyOpen } from "./job-status";
import { currencyCode } from "./salary";
import { WORKPLACES, isRemoteJob } from "./workplace";

export const JOB_STATUSES = ["active", "paused", "closed", "draft", "open", "on-hold"] as const;
export const JOB_TYPES = [
  "full-time", "part-time", "contract", "contract-to-hire", "direct-hire", "managed-teams",
] as const;
export const SALARY_PERIODS = ["year", "month", "week", "day", "hour"] as const;

/** Remote roles have no office, so a location is optional for them only. */
export const locationRequired = (job: { type?: string; workplace?: string }): boolean => !isRemoteJob(job);

/**
 * Remote was once a job type. A body that still sends `type: "remote"` (older
 * partner integrations) is split into a full-time role worked remotely, so the
 * legacy value is never written again.
 */
export function splitLegacyRemote<T extends { type?: unknown; workplace?: unknown }>(body: T): T {
  if (body.type !== "remote") return body;
  return { ...body, type: "full-time", workplace: body.workplace ?? "remote" };
}

const TEXT_LIMITS: Record<string, number> = {
  title: 200,
  department: 200,
  location: 200,
  state: 100,
  submissionDueDate: 40,
  postedByName: 200,
  description: 50_000,
  requirements: 50_000,
  responsibilities: 50_000,
};

type Salary = { min: number; max: number; currency: string; period?: (typeof SALARY_PERIODS)[number] };

/** A salary as stored, or an error. `null` clears it. */
export function parseSalary(raw: unknown): { ok: true; value: Salary | null } | { ok: false; error: string } {
  if (raw === null || raw === "") return { ok: true, value: null };
  if (typeof raw !== "object" || Array.isArray(raw)) return { ok: false, error: "salary must be an object" };
  const s = raw as Record<string, unknown>;
  // Same tolerance as the form (Postel): "$80,000" is 80000.
  const min = toNumber(s.min as string | number);
  const max = toNumber(s.max as string | number);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min < 0 || max < 0) {
    return { ok: false, error: "salary min and max must be numbers of zero or more" };
  }
  if (max < min) return { ok: false, error: "salary max must not be below min" };
  // Older forms sent a symbol ("$", "€"); store the ISO code.
  const currency = currencyCode(typeof s.currency === "string" ? s.currency : "");
  const period = s.period === undefined || s.period === ""
    ? undefined
    : (SALARY_PERIODS as readonly unknown[]).includes(s.period)
      ? (s.period as Salary["period"])
      : null;
  if (period === null) return { ok: false, error: `salary period must be one of: ${SALARY_PERIODS.join(", ")}` };
  return { ok: true, value: { min, max, currency, ...(period && { period }) } };
}

type StoredPlace = { type?: string; workplace?: string; location?: string };

/**
 * First problem with a job body, or null. `partial` is an update: absent
 * fields are left alone, and `current` is the stored record for the
 * location rule.
 */
export function jobInputError(
  rawBody: Record<string, unknown>,
  { partial = false, current }: { partial?: boolean; current?: StoredPlace } = {},
): string | null {
  const body = splitLegacyRemote(rawBody);
  if (!partial) {
    for (const field of ["title", "department", "type", "description"]) {
      if (typeof body[field] !== "string" || !(body[field] as string).trim()) return `Missing required field: ${field}`;
    }
  }
  if (body.status !== undefined && !(JOB_STATUSES as readonly unknown[]).includes(body.status)) {
    return `status must be one of: ${JOB_STATUSES.join(", ")}`;
  }
  if (body.type !== undefined && !(JOB_TYPES as readonly unknown[]).includes(body.type)) {
    return `type must be one of: ${JOB_TYPES.join(", ")}`;
  }
  if (body.workplace !== undefined && !(WORKPLACES as readonly unknown[]).includes(body.workplace)) {
    return `workplace must be one of: ${WORKPLACES.join(", ")}`;
  }
  for (const [field, max] of Object.entries(TEXT_LIMITS)) {
    const v = body[field];
    if (v === undefined || v === null || Array.isArray(v)) continue;
    if (typeof v !== "string") return `${field} must be text`;
    if (v.length > max) return `${field} must be ${max.toLocaleString("en-US")} characters or fewer`;
  }
  // A partial update is held to the rule only when it touches where the role is.
  const touchesPlace = !partial || body.location !== undefined || body.workplace !== undefined || body.type !== undefined;
  const workplace = body.workplace !== undefined
    ? { workplace: body.workplace as string }
    : { type: (body.type as string | undefined) ?? current?.type, workplace: current?.workplace };
  const location = body.location !== undefined
    ? (typeof body.location === "string" ? body.location.trim() : body.location)
    : current?.location?.trim();
  if (touchesPlace && locationRequired(workplace) && !location) {
    return "Missing required field: location";
  }
  if (body.salary !== undefined) {
    const salary = parseSalary(body.salary);
    if (!salary.ok) return salary.error;
  }
  return null;
}

/** When a write takes a posting live for the first time, the moment it did. */
export function publishedAtFor(
  status: string | undefined,
  existing?: { publishedAt?: string; status?: string },
  now = new Date(),
): string | undefined {
  if (existing?.publishedAt || !isPubliclyOpen(status)) return undefined;
  return now.toISOString();
}

type TeamJob = {
  postedByName?: string; postedByEmail?: string;
  recruitmentManagerName?: string; recruitmentManagerEmail?: string;
  assignedToNames?: string[]; assignedToEmails?: string[];
};

/** Poster, recruitment manager and assignees, each address once. */
export function jobTeamRecipients(job: TeamJob, { includePoster = true } = {}) {
  const out: Array<{ name: string; email: string }> = [];
  const seen = new Set<string>();
  const add = (email: string | undefined, name: string | undefined) => {
    const key = email?.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({ name: name || key.split("@")[0], email: email!.trim() });
  };
  if (includePoster) add(job.postedByEmail, job.postedByName);
  add(job.recruitmentManagerEmail, job.recruitmentManagerName);
  (job.assignedToEmails || []).forEach((e, i) => add(e, job.assignedToNames?.[i]));
  return out;
}
