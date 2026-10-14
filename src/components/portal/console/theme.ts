import {
  Archive, Clock, Eye, MessageSquare, Mail, CheckCircle2, XCircle, FileText,
} from "lucide-react";
import type { SalaryPeriod } from "@/lib/aws/dynamodb";

export type Tone =
  | "blue" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky" | "slate" | "teal" | "cyan" | "purple";

/**
 * Tone classes. Categorical tones are neutral or cobalt tints on one sequential
 * ramp (--adm-seq-1…5); green, amber and red belong to success, warning and
 * danger only. Every badge pairs its colour with a label or icon, so no state
 * is carried by hue alone. The legacy names stay so callers keep compiling.
 */
type ToneClasses = { bg: string; soft: string; ring: string; line: string; text: string; dot: string };

const cobalt = (dot: string, text = "text-[var(--adm-accent)]", bg = "bg-[var(--adm-accent-tint)]"): ToneClasses => ({
  bg, soft: "bg-[var(--adm-accent-soft)]", ring: "ring-[var(--adm-info-line)]", line: "border-[var(--adm-info-line)]", text, dot,
});
const neutral = (dot: string, text: string): ToneClasses => ({
  bg: "bg-[var(--adm-surface-2)]", soft: "bg-[var(--adm-surface-2)]", ring: "ring-[var(--adm-line)]", line: "border-[var(--adm-line)]", text, dot,
});
// Spelled out, not built from a template: Tailwind only sees whole class names.
const FEEDBACK: Record<"success" | "warning" | "danger", ToneClasses> = {
  success: { bg: "bg-[var(--adm-success-soft)]", soft: "bg-[var(--adm-success-soft)]", ring: "ring-[var(--adm-success-line)]", line: "border-[var(--adm-success-line)]", text: "text-[var(--adm-success-ink)]", dot: "bg-[var(--adm-success)]" },
  warning: { bg: "bg-[var(--adm-warning-soft)]", soft: "bg-[var(--adm-warning-soft)]", ring: "ring-[var(--adm-warning-line)]", line: "border-[var(--adm-warning-line)]", text: "text-[var(--adm-warning-ink)]", dot: "bg-[var(--adm-warning)]" },
  danger:  { bg: "bg-[var(--adm-danger-soft)]",  soft: "bg-[var(--adm-danger-soft)]",  ring: "ring-[var(--adm-danger-line)]",  line: "border-[var(--adm-danger-line)]",  text: "text-[var(--adm-danger-ink)]",  dot: "bg-[var(--adm-danger)]" },
};

export const tones: Record<Tone, ToneClasses> = {
  sky:     cobalt("bg-[var(--adm-seq-1)]"),
  cyan:    cobalt("bg-[var(--adm-seq-2)]"),
  blue:    cobalt("bg-[var(--adm-seq-3)]", "text-[var(--adm-accent)]", "bg-[var(--adm-accent-soft)]"),
  indigo:  cobalt("bg-[var(--adm-seq-4)]", "text-[var(--adm-accent-strong)]", "bg-[var(--adm-accent-soft)]"),
  violet:  cobalt("bg-[var(--adm-seq-5)]", "text-[var(--adm-accent-press)]", "bg-[var(--adm-accent-soft)]"),
  purple:  cobalt("bg-[var(--adm-seq-5)]", "text-[var(--adm-accent-press)]", "bg-[var(--adm-accent-soft)]"),
  teal:    neutral("bg-[var(--adm-ink-mute)]", "text-[var(--adm-ink)]"),
  slate:   neutral("bg-[var(--adm-mark-neutral)]", "text-[var(--adm-ink-mute)]"),
  emerald: FEEDBACK.success,
  amber:   FEEDBACK.warning,
  rose:    FEEDBACK.danger,
};

/**
 * Raw CSS colour per tone, for inline styles, dots and editable controls that
 * need a value rather than a class. Every value clears 4.5:1 as text on white;
 * tests/contrast.test.mjs resolves these through globals.css and fails if one
 * stops doing so. Semantic tones point at the -ink tokens, tuned for text.
 */
export const toneColor: Record<Tone, string> = {
  sky:     "var(--adm-accent)",
  cyan:    "var(--adm-accent)",
  blue:    "var(--adm-accent)",
  indigo:  "var(--adm-accent-strong)",
  violet:  "var(--adm-accent-press)",
  purple:  "var(--adm-accent-press)",
  teal:    "var(--adm-ink-mute)",
  slate:   "var(--adm-ink-subtle)",
  emerald: "var(--adm-success-ink)",
  amber:   "var(--adm-warning-ink)",
  rose:    "var(--adm-danger-ink)",
};

export type AppStatus =
  | "pending" | "reviewing" | "submitted" | "interview" | "offered" | "hired" | "rejected"
  | "active" | "inactive" | "paused" | "draft" | "closed" | "open" | "on-hold";

/**
 * Icon slot shared by the status/theme tables. Widened from `{ className }` to
 * the props these icons are actually given at call sites, stage marks take an
 * inline `style` colour (the stage ramp is computed, so it can't be a class)
 * and panel headers set `strokeWidth`. Lucide accepts all SVG props, so this
 * only makes the declared type match reality.
 */
type ThemeIcon = React.ComponentType<{
  className?: string;
  style?: React.CSSProperties;
  strokeWidth?: number;
}>;

export const statusMeta: Record<AppStatus, { label: string; tone: Tone; icon: ThemeIcon }> = {
  // Pipeline: neutral, then the cobalt ramp deepening toward the offer; green only once hired.
  pending:   { label: "New",       tone: "slate",   icon: Clock        },
  reviewing: { label: "Screening", tone: "sky",     icon: Eye          },
  submitted: { label: "Submitted", tone: "blue",    icon: FileText     },
  interview: { label: "Interview", tone: "indigo",  icon: MessageSquare},
  offered:   { label: "Offered",   tone: "violet",  icon: Mail         },
  hired:     { label: "Hired",     tone: "emerald", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  tone: "rose",    icon: XCircle      },
  active:    { label: "Active",    tone: "emerald", icon: CheckCircle2 },
  inactive:  { label: "Inactive",  tone: "slate",   icon: XCircle      },
  paused:    { label: "Paused",    tone: "amber",   icon: Clock        },
  // Job lifecycle: draft (pre-live) and closed (ended) are both neutral, told apart by label and icon.
  draft:     { label: "Draft",     tone: "slate",   icon: FileText     },
  closed:    { label: "Closed",    tone: "slate",   icon: Archive      },
  open:      { label: "Open",      tone: "blue",    icon: CheckCircle2 }, // in-flight, as kit JOB_STATUS_TONE
  "on-hold": { label: "On hold",   tone: "amber",   icon: Clock        },
};

/**
 * A status's colour as a CSS value, for dots, inline styles and editable
 * controls. Unknown statuses fall back to the neutral tone rather than throwing:
 * these strings come from the database, and a status nobody has themed yet
 * should render plainly, not break the row it is in.
 */
export const statusColor = (status: string): string =>
  toneColor[statusMeta[status as AppStatus]?.tone ?? "slate"];

export const PIPELINE_STAGES: { key: AppStatus; label: string; tone: Tone }[] = [
  { key: "pending",   label: "New",       tone: "slate"   },
  { key: "reviewing", label: "Screening", tone: "sky"     },
  { key: "submitted", label: "Submitted", tone: "blue"    },
  { key: "interview", label: "Interview", tone: "indigo"  },
  { key: "offered",   label: "Offered",   tone: "violet"  },
  { key: "hired",     label: "Hired",     tone: "emerald" },
];

/**
 * Work authorization.
 *
 * This was a flat 11-item list that conflated three different things,
 * permanent status, employer-sponsored visas, and time-limited student or
 * dependent permits, so a recruiter scanning it could not tell the two facts
 * that actually drive a decision: whether the employer has to sponsor, and
 * whether the authorization expires.
 *
 * Both are now encoded per option:
 *   sponsorship "none"    , works for any employer, nothing to file
 *               "transfer", already sponsored; a new employer files a transfer
 *               "required", employer must sponsor to convert/continue
 *   timeLimited           , has an end date, so an expiry is worth capturing
 *
 * Forms render these as <optgroup>s and use `timeLimited` to decide whether to
 * show the expiry field at all, instead of showing a date input that is
 * meaningless for a US citizen.
 */
export interface WorkAuthOption {
  value: string;
  label: string;
  sponsorship: "none" | "transfer" | "required";
  timeLimited: boolean;
}

export const WORK_AUTH_GROUPS: { label: string; options: WorkAuthOption[] }[] = [
  {
    label: "Permanent, no sponsorship",
    options: [
      { value: "US Citizen",  label: "US Citizen",             sponsorship: "none", timeLimited: false },
      { value: "Green Card",  label: "Green Card (Permanent Resident)", sponsorship: "none", timeLimited: false },
    ],
  },
  {
    label: "Employment visa, transfer required",
    options: [
      { value: "H1-B",     label: "H-1B. Specialty Occupation", sponsorship: "transfer", timeLimited: true },
      { value: "L1 Visa",  label: "L-1. Intracompany Transfer",  sponsorship: "transfer", timeLimited: true },
      { value: "O1 Visa",  label: "O-1. Extraordinary Ability",  sponsorship: "transfer", timeLimited: true },
      { value: "E3 Visa",  label: "E-3. Australian Specialty",   sponsorship: "transfer", timeLimited: true },
      { value: "TN Visa",  label: "TN. USMCA Professional",      sponsorship: "transfer", timeLimited: true },
    ],
  },
  {
    label: "Time-limited, sponsorship needed to continue",
    options: [
      { value: "OPT",     label: "OPT. Post-completion",        sponsorship: "required", timeLimited: true },
      { value: "CPT",     label: "CPT. Curricular training",    sponsorship: "required", timeLimited: true },
      { value: "H4 EAD",  label: "H-4 EAD. Dependent",          sponsorship: "required", timeLimited: true },
    ],
  },
  {
    label: "Other",
    options: [
      { value: "Other", label: "Other / Not specified", sponsorship: "required", timeLimited: false },
    ],
  },
];

/** Every option, flattened. Used by filters and by legacy-value checks. */
export const WORK_AUTH_ALL: WorkAuthOption[] = WORK_AUTH_GROUPS.flatMap((g) => g.options);

/** Stored values only, the shape list-page filters and <option> loops expect. */
export const WORK_AUTH_OPTIONS: string[] = WORK_AUTH_ALL.map((o) => o.value);

/** Look up an option's metadata by its stored value. */
export function workAuthMeta(value?: string | null): WorkAuthOption | undefined {
  return value ? WORK_AUTH_ALL.find((o) => o.value === value) : undefined;
}

/**
 * Whether an expiry date is meaningful for this authorization. Drives whether
 * the forms render the expiry field, a US citizen has no expiry to record, and
 * an always-visible date input invited junk data.
 */
export function workAuthExpires(value?: string | null): boolean {
  return workAuthMeta(value)?.timeLimited ?? false;
}

/**
 * Whether selecting this authorization implies the employer must sponsor.
 * Used to default the sponsorship flag rather than making the recruiter restate
 * something the visa type already tells us. Still overridable on the form.
 */
export function workAuthNeedsSponsorship(value?: string | null): boolean {
  const m = workAuthMeta(value);
  return m ? m.sponsorship !== "none" : false;
}

export const SOURCE_OPTIONS = [
  "LinkedIn", "Indeed", "Company Website", "Referral", "Agency", "Career Portal", "Other",
];

/**
 * Type of hire, the engagement a candidate is placed on.
 *
 * This is the candidate's payroll/contracting arrangement, not the
 * requisition's employment type: one contract req can be filled W2 by one
 * consultant and corp-to-corp by another. Values are the stored strings and
 * mirror the HireType union in lib/aws/dynamodb.ts.
 */
export interface HireTypeOption {
  value: string;
  label: string;
  hint: string;
}

export const HIRE_TYPE_OPTIONS: HireTypeOption[] = [
  { value: "W2",               label: "W2",               hint: "On our payroll, taxes withheld" },
  { value: "C2C",              label: "C2C (Corp-to-Corp)", hint: "Through the candidate's own company or a vendor" },
  { value: "1099",             label: "1099",             hint: "Independent contractor, no withholding" },
  { value: "Full-time",        label: "Full-time / Permanent", hint: "Direct placement with the client" },
  { value: "Contract-to-Hire", label: "Contract-to-Hire", hint: "Contract first, conversion later" },
  { value: "Internal",         label: "Internal / Employee", hint: "Our own employee" },
];

/** Stored values only, the shape filters and <option> loops expect. */
export const HIRE_TYPE_VALUES: string[] = HIRE_TYPE_OPTIONS.map((o) => o.value);

/** Display label for a stored hire-type value; unknown values pass through. */
export function hireTypeLabel(value?: string | null): string {
  if (!value) return "";
  return HIRE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/**
 * Chart palette, consumed IN ORDER, never cycled. Ocean and the mist neutral
 * alternating in lightness, so adjacent series separate without a second hue;
 * every chart also ships a legend and direct labels. All five are 3:1+ on white.
 * Recharts needs literal values for SVG fills; these mirror styles/colors.css.
 */
export const CHART_COLORS = [
  "#0a72c0", // ocean-600, primary series
  "#3a4e5d", // mist-700
  "#3794d4", // ocean-400
  "#0c3e66", // ocean-900
  "#6e8291", // mist-500
] as const;

/** The "Other" bucket: quieter than any series, always labelled. */
export const CHART_NEUTRAL = "#98a9b4"; // mist-400

/**
 * Status series with fixed meanings, matching the --adm-* fills. Always paired
 * with an icon or label, never colour alone.
 */
export const SERIES = {
  primary: "#0a72c0", // --adm-accent: volume / main metric
  success: "#079455", // --adm-success: hired, completed
  warning: "#dc6803", // --adm-warning: at-risk
  danger:  "#b42318", // --adm-danger: rejected, failed
  neutral: "#98a9b4", // --adm-mark-neutral: unstarted / other
} as const;

/**
 * Quick-add skill suggestions for the candidate forms. Both application forms
 * carried an identical private copy, so adding a skill in one place silently
 * left the other behind.
 */
export const COMMON_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
  "C#", ".NET", "AWS", "Azure", "GCP", "SQL", "PostgreSQL", "MongoDB",
  "Docker", "Kubernetes", "SAP", "Salesforce", "Oracle", "Excel",
  "Power BI", "Tableau", "Agile", "Scrum",
];

/**
 * US states, as {code, name} pairs.
 *
 * The app had THREE copies of this list in two incompatible formats: this file
 * held 2-letter codes (used by Applications, the candidate drawer and the
 * resume/bench filters), while job-form.tsx and bench/page.tsx each held their
 * own 51-item list of full names with "Remote" appended. Jobs and Applications
 * therefore wrote `state` in different formats, so any cross-module match on
 * location silently failed, a candidate in "TX" never matched a job in "Texas".
 *
 * The canonical stored value is the CODE. Pickers display the name and submit
 * the code; `normalizeState` converts legacy full-name records on read, so
 * existing rows keep working without a migration.
 *
 * "Remote" is deliberately absent: it is a job's workplace (src/lib/workplace.ts).
 * Putting it in the state list made "Remote" and "Texas" mutually exclusive,
 * which they are not.
 */
export const US_STATES: { code: string; name: string }[] = [
  { code: "AL", name: "Alabama" },        { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },        { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },     { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },    { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },        { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },         { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },       { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },           { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },       { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },          { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },      { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },       { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },       { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },     { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" }, { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },           { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },         { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },   { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },   { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },          { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },        { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },     { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },      { code: "WY", name: "Wyoming" },
  { code: "DC", name: "District of Columbia" },
];

/**
 * Coerce any stored state value to its canonical 2-letter code.
 *
 * Accepts a code in any case ("ca"), a full name ("California"), or a blank.
 * Returns "" for anything unrecognised rather than guessing, so a bad value
 * shows as empty in a picker instead of silently selecting the wrong state.
 */
export function normalizeState(value?: string | null): string {
  if (!value) return "";
  const v = value.trim();
  if (!v) return "";
  const upper = v.toUpperCase();
  if (US_STATES.some((s) => s.code === upper)) return upper;
  const byName = US_STATES.find((s) => s.name.toLowerCase() === v.toLowerCase());
  return byName ? byName.code : "";
}

/**
 * A record's state as a canonical 2-letter code. Legacy rows stored the full
 * name ("Texas"); unrecognised values pass through rather than disappearing.
 */
export function stateOf(value?: string | null): string {
  return normalizeState(value) || value?.trim() || "";
}

export const STATE_NAME = new Map(US_STATES.map((s) => [s.code, s.name]));

/** Job pay periods; a salary without one is annual. */
export const SALARY_PERIODS: { value: SalaryPeriod; label: string; short: string }[] = [
  { value: "hour",  label: "Per hour",  short: "/hr" },
  { value: "day",   label: "Per day",   short: "/day" },
  { value: "week",  label: "Per week",  short: "/wk" },
  { value: "month", label: "Per month", short: "/mo" },
  { value: "year",  label: "Per year",  short: "/yr" },
];
