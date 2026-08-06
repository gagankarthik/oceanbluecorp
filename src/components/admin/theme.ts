import {
  Clock, Eye, MessageSquare, Mail, CheckCircle2, XCircle, FileText,
} from "lucide-react";

export type Tone =
  | "blue" | "indigo" | "violet" | "emerald" | "amber" | "rose" | "sky" | "slate" | "teal" | "cyan" | "purple";

export const tones: Record<Tone, {
  bg: string; soft: string; ring: string; text: string; dot: string; solid: string; gradFrom: string; gradTo: string;
}> = {
  blue:    { bg: "bg-[var(--adm-accent-soft)]", soft: "bg-[var(--adm-accent-soft)]", ring: "ring-[var(--adm-accent-soft)]", text: "text-[var(--adm-accent)]", dot: "bg-[var(--adm-accent)]", solid: "bg-[var(--adm-accent)]", gradFrom: "from-[var(--adm-accent)]", gradTo: "to-[var(--adm-accent-strong)]" },
  indigo:  { bg: "bg-indigo-50",  soft: "bg-indigo-100",  ring: "ring-indigo-200",  text: "text-[var(--adm-info)]",  dot: "bg-indigo-500",  solid: "bg-indigo-600",  gradFrom: "from-indigo-500",  gradTo: "to-indigo-600"  },
  violet:  { bg: "bg-violet-50",  soft: "bg-violet-100",  ring: "ring-violet-200",  text: "text-[var(--adm-info)]",  dot: "bg-violet-500",  solid: "bg-violet-600",  gradFrom: "from-violet-500",  gradTo: "to-violet-600"  },
  emerald: { bg: "bg-[var(--adm-success-soft)]", soft: "bg-emerald-100", ring: "ring-emerald-200", text: "text-[var(--adm-success)]", dot: "bg-emerald-500", solid: "bg-emerald-600", gradFrom: "from-emerald-500", gradTo: "to-emerald-600" },
  amber:   { bg: "bg-[var(--adm-warning-soft)]",   soft: "bg-amber-100",   ring: "ring-amber-200",   text: "text-[var(--adm-warning)]",   dot: "bg-amber-500",   solid: "bg-amber-600",   gradFrom: "from-amber-500",   gradTo: "to-amber-600"   },
  rose:    { bg: "bg-[var(--adm-danger-soft)]",    soft: "bg-rose-100",    ring: "ring-rose-200",    text: "text-[var(--adm-danger)]",    dot: "bg-rose-500",    solid: "bg-rose-600",    gradFrom: "from-rose-500",    gradTo: "to-rose-600"    },
  sky:     { bg: "bg-[var(--adm-accent-soft)]",     soft: "bg-sky-100",     ring: "ring-sky-200",     text: "text-[var(--adm-accent)]",     dot: "bg-sky-500",     solid: "bg-sky-600",     gradFrom: "from-sky-500",     gradTo: "to-sky-600"     },
  slate:   { bg: "bg-[var(--adm-surface-sunken)]",   soft: "bg-slate-100",   ring: "ring-slate-200",   text: "text-[var(--adm-ink-mute)]",   dot: "bg-slate-400",   solid: "bg-slate-600",   gradFrom: "from-slate-500",   gradTo: "to-slate-600"   },
  teal:    { bg: "bg-[var(--adm-success-soft)]",    soft: "bg-teal-100",    ring: "ring-teal-200",    text: "text-[var(--adm-success)]",    dot: "bg-teal-500",    solid: "bg-teal-600",    gradFrom: "from-teal-500",    gradTo: "to-teal-600"    },
  cyan:    { bg: "bg-cyan-50",    soft: "bg-cyan-100",    ring: "ring-cyan-200",    text: "text-cyan-700",    dot: "bg-cyan-500",    solid: "bg-cyan-600",    gradFrom: "from-cyan-500",    gradTo: "to-cyan-600"    },
  purple:  { bg: "bg-purple-50",  soft: "bg-purple-100",  ring: "ring-purple-200",  text: "text-purple-700",  dot: "bg-purple-500",  solid: "bg-purple-600",  gradFrom: "from-purple-500",  gradTo: "to-purple-600"  },
};

export type AppStatus =
  | "pending" | "reviewing" | "submitted" | "interview" | "offered" | "hired" | "rejected"
  | "active" | "inactive" | "paused" | "draft" | "closed" | "open" | "on-hold";

/**
 * Icon slot shared by the status/theme tables. Widened from `{ className }` to
 * the props these icons are actually given at call sites — stage marks take an
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
  pending:   { label: "New",       tone: "slate",   icon: Clock        },
  reviewing: { label: "Screening", tone: "blue",    icon: Eye          },
  submitted: { label: "Submitted", tone: "indigo",  icon: FileText     },
  interview: { label: "Interview", tone: "violet",  icon: MessageSquare},
  offered:   { label: "Offered",   tone: "amber",   icon: Mail         },
  hired:     { label: "Hired",     tone: "emerald", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  tone: "rose",    icon: XCircle      },
  active:    { label: "Active",    tone: "emerald", icon: CheckCircle2 },
  inactive:  { label: "Inactive",  tone: "slate",   icon: XCircle      },
  paused:    { label: "Paused",    tone: "amber",   icon: Clock        },
  draft:     { label: "Draft",     tone: "slate",   icon: FileText     },
  closed:    { label: "Closed",    tone: "rose",    icon: XCircle      },
  open:      { label: "Open",      tone: "emerald", icon: CheckCircle2 },
  "on-hold": { label: "On Hold",   tone: "amber",   icon: Clock        },
};

export const PIPELINE_STAGES: { key: AppStatus; label: string; tone: Tone }[] = [
  { key: "pending",   label: "New",       tone: "slate"   },
  { key: "reviewing", label: "Screening", tone: "blue"    },
  { key: "submitted", label: "Submitted", tone: "indigo"  },
  { key: "interview", label: "Interview", tone: "violet"  },
  { key: "offered",   label: "Offered",   tone: "amber"   },
  { key: "hired",     label: "Hired",     tone: "emerald" },
];

/**
 * Work authorization.
 *
 * This was a flat 11-item list that conflated three different things —
 * permanent status, employer-sponsored visas, and time-limited student or
 * dependent permits — so a recruiter scanning it could not tell the two facts
 * that actually drive a decision: whether the employer has to sponsor, and
 * whether the authorization expires.
 *
 * Both are now encoded per option:
 *   sponsorship "none"     — works for any employer, nothing to file
 *               "transfer" — already sponsored; a new employer files a transfer
 *               "required" — employer must sponsor to convert/continue
 *   timeLimited            — has an end date, so an expiry is worth capturing
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
    label: "Permanent — no sponsorship",
    options: [
      { value: "US Citizen",  label: "US Citizen",             sponsorship: "none", timeLimited: false },
      { value: "Green Card",  label: "Green Card (Permanent Resident)", sponsorship: "none", timeLimited: false },
    ],
  },
  {
    label: "Employment visa — transfer required",
    options: [
      { value: "H1-B",     label: "H-1B — Specialty Occupation", sponsorship: "transfer", timeLimited: true },
      { value: "L1 Visa",  label: "L-1 — Intracompany Transfer",  sponsorship: "transfer", timeLimited: true },
      { value: "O1 Visa",  label: "O-1 — Extraordinary Ability",  sponsorship: "transfer", timeLimited: true },
      { value: "E3 Visa",  label: "E-3 — Australian Specialty",   sponsorship: "transfer", timeLimited: true },
      { value: "TN Visa",  label: "TN — USMCA Professional",      sponsorship: "transfer", timeLimited: true },
    ],
  },
  {
    label: "Time-limited — sponsorship needed to continue",
    options: [
      { value: "OPT",     label: "OPT — Post-completion",        sponsorship: "required", timeLimited: true },
      { value: "CPT",     label: "CPT — Curricular training",    sponsorship: "required", timeLimited: true },
      { value: "H4 EAD",  label: "H-4 EAD — Dependent",          sponsorship: "required", timeLimited: true },
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

/** Stored values only — the shape list-page filters and <option> loops expect. */
export const WORK_AUTH_OPTIONS: string[] = WORK_AUTH_ALL.map((o) => o.value);

/** Look up an option's metadata by its stored value. */
export function workAuthMeta(value?: string | null): WorkAuthOption | undefined {
  return value ? WORK_AUTH_ALL.find((o) => o.value === value) : undefined;
}

/**
 * Whether an expiry date is meaningful for this authorization. Drives whether
 * the forms render the expiry field — a US citizen has no expiry to record, and
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
 * Type of hire — the engagement a candidate is placed on.
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

/** Stored values only — the shape filters and <option> loops expect. */
export const HIRE_TYPE_VALUES: string[] = HIRE_TYPE_OPTIONS.map((o) => o.value);

/** Display label for a stored hire-type value; unknown values pass through. */
export function hireTypeLabel(value?: string | null): string {
  if (!value) return "";
  return HIRE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/**
 * Categorical chart palette — consume IN ORDER, never cycled.
 *
 * Validated with the dataviz six-checks validator against the #ffffff panel
 * surface, in `--pairs all` mode (any two series may end up adjacent in a
 * donut or a stacked bar, so adjacent-only checking is not enough here):
 *
 *   Lightness band      PASS   all 5 inside L 0.43–0.77
 *   Chroma floor        PASS   all 5 >= 0.1
 *   CVD separation      WARN   worst pair violet/cobalt ΔE 7.8 (protan)
 *   Normal-vision floor PASS   worst pair ΔE 15.5
 *   Contrast vs surface PASS   all 5 >= 3:1
 *
 * The protan WARN sits in the 6–8 floor band, which is legal ONLY alongside
 * secondary encoding — so every chart built on this palette ships a legend,
 * direct value labels, and a 2px surface gap between fills. Do not drop those
 * affordances without re-validating.
 *
 * The previous palette (cobalt/violet/cyan/emerald/amber/pink/slate) FAILED:
 * emerald↔cyan were ΔE 12.5 even at normal vision, and cyan/emerald/amber all
 * fell under 3:1 against white.
 *
 * Recharts needs literal values, not CSS vars, for SVG fills in all browsers.
 */
export const CHART_COLORS = [
  "#1d4ed8", // cobalt  — primary series
  "#ea580c", // orange
  "#0d9488", // teal
  "#a855f7", // violet
  "#be123c", // rose
] as const;

/**
 * Reserved neutral for an explicit "Other"/unattributed bucket. Deliberately
 * below the categorical chroma floor — it is not an identity slot and must
 * never be handed out as "series 6". Past five real categories, roll the tail
 * into this bucket rather than inventing a hue.
 */
export const CHART_NEUTRAL = "#64748b";

/**
 * Status series — fixed meanings across every admin chart, and reserved: these
 * never stand in for a categorical slot. Stepped to match the --adm-* semantic
 * tokens in globals.css so a chart mark and its status chip are the same ink,
 * and darkened from the old emerald-500/amber-500/rose-500 which all sat under
 * 3:1 on white. Always paired with an icon or label, never colour alone.
 */
export const SERIES = {
  primary: "#1d4ed8", // volume / main metric
  success: "#059669", // hired, completed
  warning: "#d97706", // offered, at-risk
  danger:  "#e11d48", // rejected, failed
  neutral: "#64748b", // unstarted / other
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
 * location silently failed — a candidate in "TX" never matched a job in "Texas".
 *
 * The canonical stored value is the CODE. Pickers display the name and submit
 * the code; `normalizeState` converts legacy full-name records on read, so
 * existing rows keep working without a migration.
 *
 * "Remote" is deliberately absent — it is a job *type*, and JOB_TYPES in
 * job-form.tsx already carries it. Putting it in the state list made "Remote"
 * and "Texas" mutually exclusive, which they are not.
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
