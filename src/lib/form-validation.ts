// Client-side form checks for the admin screens. Pure: no React, no AWS.
// The server validates again; these exist so a mistake is named next to the
// field instead of coming back as a 400.

/** A rule returns a message when the value fails, undefined when it passes. */
export type Rule = (value: string) => string | undefined;

export type FieldErrors<K extends string = string> = Partial<Record<K, string>>;

// ── Predicates ────────────────────────────────────────────────────────────────

export const isBlank = (v: string | null | undefined): boolean => !v || !v.trim();

/** Text content of editor HTML, so "<p><br></p>" counts as empty. */
export const htmlText = (html: string | null | undefined): string =>
  (html ?? "").replace(/<[^>]*>/g, " ").replace(/&nbsp;|&#160;/g, " ").replace(/\s+/g, " ").trim();

// Deliberately loose: one @, a dot in the domain, no spaces. Real deliverability
// is Cognito's / the mail server's problem, not a regex's.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const isEmail = (v: string): boolean => EMAIL_RE.test(v.trim());

// Lenient on purpose: people paste "+1 (614) 555-0100 ext" variants. Only the
// characters and the digit count are checked.
const PHONE_CHARS_RE = /^[\d\s+().-]+$/;
export function isPhone(v: string): boolean {
  const s = v.trim();
  if (!PHONE_CHARS_RE.test(s)) return false;
  const digits = s.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 20;
}

export function isUrl(v: string): boolean {
  try {
    const u = new URL(v.trim());
    return (u.protocol === "http:" || u.protocol === "https:") && u.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Finite number, blank excluded. */
export function isNumber(v: string): boolean {
  if (isBlank(v)) return false;
  return Number.isFinite(Number(v.trim()));
}

/** "YYYY-MM-DD" (a date input's value) in the viewer's local calendar. */
export function todayIso(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ── Rules ─────────────────────────────────────────────────────────────────────
// Format rules skip blank values, so an optional field only fails when filled
// in wrongly. Pair with `required` to make it mandatory.

export const required = (message: string): Rule => (v) => (isBlank(v) ? message : undefined);

export const maxLen = (max: number, message?: string): Rule => (v) =>
  v && v.trim().length > max
    ? message ?? `Keep this under ${max.toLocaleString()} characters (it is ${v.trim().length.toLocaleString()}).`
    : undefined;

export const email = (message = "Enter an email address, like name@company.com."): Rule => (v) =>
  isBlank(v) || isEmail(v) ? undefined : message;

export const phone = (message = "Enter a phone number with 7 to 20 digits, like (614) 555-0100."): Rule => (v) =>
  isBlank(v) || isPhone(v) ? undefined : message;

export const url = (message = "Enter a full web address starting with https://, like https://example.com."): Rule => (v) =>
  isBlank(v) || isUrl(v) ? undefined : message;

export const nonNegative = (message = "Enter a number of zero or more."): Rule => (v) =>
  isBlank(v) || (isNumber(v) && Number(v) >= 0) ? undefined : message;

export const minLen = (min: number, message?: string): Rule => (v) =>
  isBlank(v) || v.trim().length >= min ? undefined : message ?? `Use at least ${min} characters.`;

// Cognito pool policy. Cognito counts only this set as a symbol; a wider test
// would pass here and still be refused server-side.
const PASSWORD_NEEDS: { label: string; test: (v: string) => boolean }[] = [
  { label: "8 characters", test: (v) => v.length >= 8 },
  { label: "an uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { label: "a lowercase letter", test: (v) => /[a-z]/.test(v) },
  { label: "a number", test: (v) => /\d/.test(v) },
  { label: "a symbol", test: (v) => /[\^$*.[\]{}()?"!@#%&/\\,><':;|_~`+=-]/.test(v) },
];

/** Labels of the policy requirements `v` does not meet yet. */
export const passwordNeeds = (v: string): string[] =>
  PASSWORD_NEEDS.filter((r) => !r.test(v)).map((r) => r.label);

export const strongPassword = (): Rule => (v) => {
  if (isBlank(v)) return undefined;
  const missing = passwordNeeds(v);
  if (!missing.length) return undefined;
  const list = missing.length > 1 ? `${missing.slice(0, -1).join(", ")} and ${missing[missing.length - 1]}` : missing[0];
  return `The password still needs ${list}.`;
};

/** First failing rule's message, or undefined. */
export function check(value: string | null | undefined, ...rules: Rule[]): string | undefined {
  const v = value ?? "";
  for (const rule of rules) {
    const msg = rule(v);
    if (msg) return msg;
  }
  return undefined;
}

/** Drops the passing entries so `Object.keys(result)` is the failing fields. */
export function collectErrors<K extends string>(entries: Record<K, string | undefined>): FieldErrors<K> {
  const out: FieldErrors<K> = {};
  for (const key of Object.keys(entries) as K[]) {
    if (entries[key]) out[key] = entries[key];
  }
  return out;
}

export const hasErrors = (errors: FieldErrors): boolean => Object.keys(errors).length > 0;

// ── Warnings (shown, never blocking) ──────────────────────────────────────────

/** Pay above bill means the placement loses money; worth saying, not stopping. */
export function payOverBillWarning(pay: string, bill: string): string | undefined {
  if (!isNumber(pay) || !isNumber(bill)) return undefined;
  return Number(pay) > Number(bill)
    ? "Pay rate is higher than the bill rate, so this placement would run at a loss."
    : undefined;
}

export function pastDateWarning(date: string, message = "This date has already passed.", now?: Date): string | undefined {
  if (isBlank(date)) return undefined;
  return date.slice(0, 10) < todayIso(now) ? message : undefined;
}

/** Both ISO dates present and the end is before the start. */
export function endBeforeStart(start: string, end: string): boolean {
  if (isBlank(start) || isBlank(end)) return false;
  return end.slice(0, 10) < start.slice(0, 10);
}

/** Max below min, both numeric. */
export function rangeInverted(min: string, max: string): boolean {
  return isNumber(min) && isNumber(max) && Number(max) < Number(min);
}

// ── Shared limits ─────────────────────────────────────────────────────────────

export const LIMITS = {
  name: 100,
  title: 120,
  short: 200,
  email: 254,
  url: 2048,
  notes: 5000,
  description: 20000,
} as const;
