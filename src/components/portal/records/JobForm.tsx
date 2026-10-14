"use client";

import * as React from "react";
import type { Job, Client, Vendor, SalaryPeriod } from "@/lib/aws/dynamodb";
import { JOB_LIST_HREF, JOB_LIST_LABEL, isPastDeadline, jobCategory, type JobCategory } from "@/lib/job-status";
import { fmtDate } from "@/lib/format";
import { US_STATES, normalizeState, SALARY_PERIODS } from "@/components/portal/console/theme";
import { workplaceOf, WORKPLACES, WORKPLACE_LABEL, type Workplace } from "@/lib/workplace";
import { RichTextEditor } from "@/components/portal/console/rich-text-editor";
import { renderListField } from "@/lib/rich-text";
import { useAuth, canSeeJobCommercials } from "@/lib/auth";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { useJobSummaries } from "@/hooks/use-console-data";
import {
  LIMITS, check, collectErrors, htmlText, isBlank, isNumber, maxLen, nonNegative, pastDateWarning, rangeInverted, required, toNumber,
} from "@/lib/form-validation";
import { JOB_TEXT_LIMITS, SKILLS_MAX, FEE_PCT_MAX } from "@/lib/job-input";
import { DEPARTMENTS, JOB_STATUS_COPY, JOB_TYPE_OPTIONS, jobStatusChoices } from "@/lib/job-options";
import { jobChecks, summarizeChecks } from "@/lib/job-quality";
import { jobTemplate } from "@/lib/job-templates";
import { DEFAULT_TARGET_MARGIN_PCT } from "@/lib/margin";
import type { PostingJob } from "@/components/site/JobPostingView";
import dynamic from "next/dynamic";
import { Button, ConfirmDialog, Page, PageHeader, Skeleton } from "@/components/portal/kit";
import {
  AddClientDialog, AddVendorDialog, Choice, Field, FeePreview, FormBanner, MarginPreview, MoneyInput, NativeSelect,
  PartnerPicker, RangeInput, SkillsInput, StaffMultiPicker, StaffPicker, TextArea, TextInput, type NewVendorInput, type StaffPerson,
} from "@/components/portal/fields";
import Icon from "@/components/portal/icons";
import { ActionMenu, type MenuEntry } from "./Menu";
import { SaveStateLine, Stepper, type SaveState, type StepDef } from "./form-steps";

// The posting preview only renders on Review, so it loads then.
const JobReview = dynamic(() => import("./JobPreview"), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-xl" />,
});

// Kept for existing imports; the lists live in lib/job-options.
export { DEPARTMENTS };
export const JOB_TYPES = JOB_TYPE_OPTIONS;
export type { NewVendorInput };
/** Staff row for the manager and assignee pickers. */
export type AssigneeUser = StaffPerson;

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: "state", label: "State role" },
  { value: "open", label: "Open role" },
];

type PayBasis = "hour" | "year";
const PAY_BASIS_OPTIONS: { value: PayBasis; label: string }[] = [
  { value: "hour", label: "Hourly" },
  { value: "year", label: "Annual" },
];

/** Contract work is priced by the hour; permanent roles by the year. */
const CONTRACT_TYPES = new Set(["contract", "contract-to-hire", "managed-teams"]);
export const payBasisFor = (type: string): PayBasis => (CONTRACT_TYPES.has(type) ? "hour" : "year");

const PRACTICE_GROUPS = [
  { label: "Technology", items: ["ERP Solutions", "Cloud Services", "Data & AI", "Salesforce", "Engineering", "Information and Computers"] },
  { label: "Delivery", items: ["Training", "PMO", "Operations"] },
];

// ── Job form state ─────────────────────────────────────────────────────────────

export interface JobFormData {
  title: string;
  status: Job["status"];
  category: JobCategory;
  department: string;
  /** "" only for a legacy remote record, whose real type has to be chosen. */
  type: Job["type"] | "";
  workplace: Workplace;
  location: string;
  state: string;
  clientId: string;
  clientName: string;
  clientNotes: string;
  vendorId: string;
  vendorName: string;
  submissionDueDate: string;
  clientBillRate: string;
  payRate: string;
  feePct: string;
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: SalaryPeriod;
  showPay: boolean;
  skills: string[];
  recruitmentManagerId: string;
  recruitmentManagerName: string;
  recruitmentManagerEmail: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedToEmails: string[];
  description: string;
  requirements: string;
  responsibilities: string;
  /** The enquiry a role was started from. Commercial. */
  sourceContactId: string;
}

export const DEFAULT_JOB_FORM: JobFormData = {
  title: "", status: "draft", category: "state", department: DEPARTMENTS[0], type: "full-time",
  workplace: "on-site", location: "", state: "", clientId: "", clientName: "", clientNotes: "",
  vendorId: "", vendorName: "", submissionDueDate: "",
  clientBillRate: "", payRate: "", feePct: "", salaryMin: "", salaryMax: "", salaryPeriod: "year", showPay: false, skills: [],
  recruitmentManagerId: "", recruitmentManagerName: "", recruitmentManagerEmail: "",
  assignedToIds: [], assignedToNames: [], assignedToEmails: [],
  description: "", requirements: "", responsibilities: "", sourceContactId: "",
};

/** Convert textarea bullet text to Job arrays */
export const parseLines = (text: string): string[] | undefined => {
  if (!text?.trim()) return undefined;
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return lines.length ? lines : undefined;
};

/** Populate form from existing Job */
export function jobToFormData(job: Job): JobFormData {
  return {
    title: job.title || "",
    status: job.status || "draft",
    category: jobCategory(job),
    department: job.department || DEPARTMENTS[0],
    // Remote used to be a type; it now lives in workplace and the type is asked for.
    type: job.type === "remote" ? "" : job.type || "full-time",
    workplace: workplaceOf(job) || "on-site",
    location: job.location || "",
    // Legacy full names ("California") read as the code; a legacy "Remote" state reads as "".
    state: normalizeState(job.state),
    clientId: job.clientId || "",
    clientName: job.clientName || "",
    clientNotes: job.clientNotes || "",
    vendorId: job.vendorId || "",
    vendorName: job.vendorName || "",
    submissionDueDate: job.submissionDueDate?.split("T")[0] || "",
    clientBillRate: job.clientBillRate?.toString() || "",
    payRate: job.payRate?.toString() || "",
    feePct: job.feePct?.toString() || "",
    salaryMin: job.salary?.min?.toString() || "",
    salaryMax: job.salary?.max?.toString() || "",
    // Records without a period predate the field and are annual.
    salaryPeriod: job.salary?.period || "year",
    showPay: job.showPay === true,
    skills: job.skills || [],
    recruitmentManagerId: job.recruitmentManagerId || "",
    recruitmentManagerName: job.recruitmentManagerName || "",
    recruitmentManagerEmail: job.recruitmentManagerEmail || "",
    assignedToIds: job.assignedToIds || (job.assignedToId ? [job.assignedToId] : []),
    assignedToNames: job.assignedToNames || (job.assignedToName ? [job.assignedToName] : []),
    assignedToEmails: job.assignedToEmails || [],
    description: job.description || "",
    // A legacy string[] becomes a <ul>; HTML passes through.
    requirements: renderListField(job.requirements).__html,
    responsibilities: renderListField(job.responsibilities).__html,
    sourceContactId: job.sourceContactId || "",
  };
}

/**
 * A new draft seeded from another role: every field copied, title marked as a copy.
 * Id, posting ID, dates, applicants and history are not form fields, so the new
 * record gets its own; a deadline already past is dropped.
 */
export function duplicateFormData(job: Job): JobFormData {
  const d = jobToFormData(job);
  return {
    ...d,
    title: `Copy of ${d.title}`.slice(0, JOB_TEXT_LIMITS.title),
    status: "draft",
    submissionDueDate: isPastDeadline(job) ? "" : d.submissionDueDate,
    sourceContactId: "",
  };
}

const showsRates = (d: Pick<JobFormData, "salaryPeriod" | "type">) => d.salaryPeriod === "hour" || CONTRACT_TYPES.has(d.type);
const showsFee = (d: Pick<JobFormData, "salaryPeriod" | "type">) => d.type === "direct-hire" || (d.salaryPeriod === "year" && !CONTRACT_TYPES.has(d.type));

/** Build API payload from form data. Commercial fields only for roles that may price (the API strips them anyway). */
export function formDataToPayload(data: JobFormData, { canPrice = true }: { canPrice?: boolean } = {}) {
  const rates = showsRates(data);
  const commercial = canPrice
    ? {
        // Rates belong to contract pricing; a permanent role leaves stored ones alone.
        clientBillRate: rates && data.clientBillRate ? toNumber(data.clientBillRate) : undefined,
        payRate: rates && data.payRate ? toNumber(data.payRate) : undefined,
        // null clears a stored fee.
        feePct: showsFee(data) ? (data.feePct.trim() ? toNumber(data.feePct.replace(/%/g, "")) : null) : undefined,
        clientId: data.clientId || undefined,
        clientName: data.clientName || undefined,
        clientNotes: data.clientNotes || undefined,
        // Empty string, not undefined: JSON drops undefined, so "No vendor" could never clear one.
        vendorId: data.vendorId || "",
        vendorName: data.vendorName || "",
        // "" and [] rather than undefined, so removing the manager or the last assignee saves.
        recruitmentManagerId: data.recruitmentManagerId,
        recruitmentManagerName: data.recruitmentManagerName,
        recruitmentManagerEmail: data.recruitmentManagerEmail,
        assignedToIds: data.assignedToIds,
        assignedToNames: data.assignedToNames,
        assignedToEmails: data.assignedToEmails,
        sourceContactId: data.sourceContactId || undefined,
      }
    : {};
  return {
    title: data.title,
    category: data.category,
    department: data.department,
    location: data.location,
    state: data.state || undefined,
    type: data.type,
    workplace: data.workplace,
    description: data.description,
    // Empty editors send undefined so an empty <ul></ul> or stray <br> isn't stored.
    requirements: data.requirements?.trim() ? data.requirements : undefined,
    responsibilities: data.responsibilities?.trim() ? data.responsibilities : undefined,
    skills: data.skills,
    // null, not undefined, so clearing the range clears it on the record.
    salary: data.salaryMin && data.salaryMax
      ? { min: toNumber(data.salaryMin), max: toNumber(data.salaryMax), currency: "$", period: data.salaryPeriod }
      : null,
    showPay: data.showPay,
    status: data.status,
    submissionDueDate: data.submissionDueDate || undefined,
    ...commercial,
  };
}

/** POST /api/vendors for the form's "+ Add new vendor" option. */
export async function createVendorFromForm(vendorData: NewVendorInput): Promise<Vendor> {
  const res = await fetch("/api/vendors", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(vendorData),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "The vendor could not be added. Try again in a moment.");
  return json.vendor;
}

// ── Local drafts ───────────────────────────────────────────────────────────────

/** localStorage key for a form's backup: `portal.jobDraft.<userId>.<category>` or `.edit.<jobId>`. */
export const jobDraftKey = (userId: string, scope: string) => `portal.jobDraft.${userId}.${scope}`;

type StoredDraft = { savedAt: string; data: JobFormData };

function readDraft(key: string | undefined): StoredDraft | null {
  if (!key) return null;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as StoredDraft) : null;
    return parsed?.data && typeof parsed.data.title === "string" ? { ...parsed, data: { ...DEFAULT_JOB_FORM, ...parsed.data } } : null;
  } catch {
    return null;
  }
}

export function clearJobDraft(key: string | undefined) {
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Private mode or storage blocked.
  }
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface JobFormProps {
  mode: "create" | "edit";
  initialData?: JobFormData;
  job?: Job | null;
  clients: Client[];
  vendors: Vendor[];
  hrUsers: AssigneeUser[];
  submitting: boolean;
  /** Save failure from the page, shown above the form. */
  serverError?: string | null;
  onDismissError?: () => void;
  /** Receives the data with the status the save chose. */
  onSubmit: (data: JobFormData) => void;
  onAddClient: (clientData: { name: string; websiteUrl: string; email: string; phone: string }) => Promise<Client>;
  onAddVendor: (vendorData: NewVendorInput) => Promise<Vendor>;
  formId?: string;
  /** One quiet line under the title, e.g. "Copy of …". */
  notice?: React.ReactNode;
  /** localStorage backup of unsaved work; see jobDraftKey */
  draftKey?: string;
  /** Saves a draft record in place (edit, status draft only). Never called for live or open roles. */
  onAutosave?: (data: JobFormData) => Promise<void>;
  /** "Copy an existing role" beside the title */
  onCopyFrom?: (jobId: string) => void;
}

const AUTOSAVE_MS = 1500;

// Field key → control id, for jumps, focus and the touched set.
const IDS = {
  title: "job-title", type: "job-type", location: "job-location", clientNotes: "job-client-notes",
  clientBillRate: "job-bill-rate", payRate: "job-pay-rate", feePct: "job-fee", salaryMin: "job-salary-min",
  salaryMax: "job-salary-max", description: "job-description",
} as const;
type ErrKey = keyof typeof IDS;

function jumpTo(id: string) {
  requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.focus({ preventScroll: true });
  });
}

/** Counter once a field passes 80% of its limit. */
const counter = (len: number, max: number) => (len >= max * 0.8 ? `${len.toLocaleString()} / ${max.toLocaleString()}` : undefined);


type StepId = "basics" | "posting" | "pay" | "internal" | "review";

/** Blocking fields per step: Next checks only these. */
const STEP_ERRORS: Record<StepId, ErrKey[]> = {
  basics: ["title", "type", "location"],
  posting: ["description"],
  pay: ["salaryMin", "salaryMax"],
  internal: ["clientNotes", "clientBillRate", "payRate", "feePct"],
  review: [],
};

/** Which step holds a control, for jumps from Review. */
const FIELD_STEP: Record<string, StepId> = {
  "job-title": "basics", "job-department": "basics", "job-type": "basics", "job-workplace": "basics", "job-location": "basics", "job-state": "basics",
  "job-description": "posting", "job-responsibilities": "posting", "job-requirements": "posting", "job-skills": "posting",
  "job-deadline": "pay", "job-pay-basis": "pay", "job-salary-min": "pay", "job-salary-max": "pay", "job-show-pay": "pay",
  "job-client": "internal", "job-vendor": "internal", "job-client-notes": "internal", "job-bill-rate": "internal", "job-pay-rate": "internal", "job-fee": "internal",
};

const STEP_LABEL: Record<StepId, string> = {
  basics: "Basics",
  posting: "Posting",
  pay: "Pay and deadline",
  internal: "Internal",
  review: "Review",
};

const linkCls = "inline-flex min-h-8 items-center gap-1 text-adm-base font-medium text-ocean-700 underline-offset-4 hover:underline disabled:opacity-[var(--opacity-disabled)]";

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * A role in four or five short steps (Internal only for roles that price),
 * ending on Review: the posting as the careers site prints it, then Publish.
 * Field state lives here, so moving between steps loses nothing.
 */
export function JobForm({
  mode, initialData, job, clients, vendors, hrUsers, submitting, serverError, onDismissError, onSubmit, onAddClient, onAddVendor,
  formId = "job-form", notice, draftKey, onAutosave, onCopyFrom,
}: JobFormProps) {
  const { user } = useAuth();
  const seed = initialData || DEFAULT_JOB_FORM;
  const [data, setData] = React.useState<JobFormData>(seed);
  const [confirmStatus, setConfirmStatus] = React.useState<Job["status"] | null>(null);
  /** Which save button started the request, for its spinner. */
  const [savingAs, setSavingAs] = React.useState<Job["status"] | null>(null);

  // Media authors postings but never prices them: the Internal step does not exist for it.
  const canPrice = canSeeJobCommercials(user?.role);
  const steps: StepId[] = canPrice ? ["basics", "posting", "pay", "internal", "review"] : ["basics", "posting", "pay", "review"];
  const stepDefs: StepDef[] = steps.map((id) => ({ id, label: STEP_LABEL[id] }));
  const [stepIdx, setStepIdx] = React.useState(0);
  const [reached, setReached] = React.useState(mode === "edit" ? steps.length - 1 : 0);
  const step = steps[Math.min(stepIdx, steps.length - 1)];
  const [moreOpen, setMoreOpen] = React.useState(() => !!(seed.clientNotes || seed.recruitmentManagerId || seed.assignedToIds.length));

  React.useEffect(() => {
    if (initialData) setData(initialData);
  }, [initialData]);

  // Rich-text fields compare by text: the editor rewrites "" as "<p></p>" on mount.
  const snapshot = (d: JobFormData) => JSON.stringify({
    ...d,
    description: htmlText(d.description),
    requirements: htmlText(d.requirements),
    responsibilities: htmlText(d.responsibilities),
  });
  const seedSnap = React.useMemo(() => snapshot(seed), [seed]);
  const [baseline, setBaseline] = React.useState(seedSnap);
  React.useEffect(() => setBaseline(seedSnap), [seedSnap]);
  const currentSnap = snapshot(data);
  const dirty = currentSnap !== baseline;
  useUnsavedChanges(!submitting && dirty);

  const { errors, validateAll, validateSome, failing, revalidate, invalidProps, clear } = useFormErrors<ErrKey>(
    () => {
      const descText = htmlText(data.description);
      // The payload only sends a salary when both ends are set, so half a range would be dropped silently.
      const salaryHalf = !isBlank(data.salaryMin) !== !isBlank(data.salaryMax);
      const fee = data.feePct.replace(/%/g, "");
      return collectErrors({
        title: check(data.title, required("Enter a job title, like Senior Software Engineer."), maxLen(JOB_TEXT_LIMITS.title)),
        type: data.type ? undefined : "Choose the job type. Remote is now set under Workplace.",
        location: data.workplace === "remote"
          ? check(data.location, maxLen(JOB_TEXT_LIMITS.location))
          : check(data.location, required("Enter the city, like Columbus, or set the workplace to Remote."), maxLen(JOB_TEXT_LIMITS.location)),
        clientNotes: canPrice ? check(data.clientNotes, maxLen(LIMITS.notes)) : undefined,
        clientBillRate: canPrice && showsRates(data) ? check(data.clientBillRate, nonNegative("Enter the bill rate as a number, like 75.")) : undefined,
        payRate: canPrice && showsRates(data) ? check(data.payRate, nonNegative("Enter the pay rate as a number, like 55.")) : undefined,
        feePct: canPrice && showsFee(data) && fee.trim() && !(isNumber(fee) && toNumber(fee) >= 0 && toNumber(fee) <= FEE_PCT_MAX)
          ? `Enter the fee as a percentage from 0 to ${FEE_PCT_MAX}, like 20.`
          : undefined,
        salaryMin:
          check(data.salaryMin, nonNegative("Enter the minimum pay as a number, like 80000.")) ??
          (salaryHalf && isBlank(data.salaryMin) ? "Add a minimum too, or clear the maximum." : undefined),
        salaryMax:
          check(data.salaryMax, nonNegative("Enter the maximum pay as a number, like 120000.")) ??
          (salaryHalf && isBlank(data.salaryMax) ? "Add a maximum too, or clear the minimum." : undefined) ??
          (rangeInverted(data.salaryMin, data.salaryMax) ? "The maximum is lower than the minimum." : undefined),
        description: !descText
          ? "Describe the role so candidates know what they are applying for."
          : check(descText, maxLen(LIMITS.description)),
      });
    },
    IDS,
    { touched: true },
  );

  const ERR_OF: Partial<Record<keyof JobFormData, ErrKey>> = {
    title: "title", type: "type", location: "location", clientNotes: "clientNotes", clientBillRate: "clientBillRate",
    payRate: "payRate", feePct: "feePct", salaryMin: "salaryMin", salaryMax: "salaryMax", description: "description",
  };
  const set = <K extends keyof JobFormData>(k: K, v: JobFormData[K]) => {
    setData((prev) => ({ ...prev, [k]: v }));
    const e = ERR_OF[k];
    if (e) clear(e);
  };

  // A figure typed for one basis is wrong by orders of magnitude on the other,
  // so switching parks the range and restores it on the way back.
  const parkedRange = React.useRef<Partial<Record<SalaryPeriod, { min: string; max: string }>>>({});
  const setPayBasis = (basis: SalaryPeriod) => {
    setData((prev) => {
      if (basis === prev.salaryPeriod) return prev;
      parkedRange.current[prev.salaryPeriod] = { min: prev.salaryMin, max: prev.salaryMax };
      const back = parkedRange.current[basis];
      return { ...prev, salaryPeriod: basis, salaryMin: back?.min ?? "", salaryMax: back?.max ?? "" };
    });
    clear("salaryMin");
    clear("salaryMax");
  };
  // The basis follows the job type until someone types a figure.
  const setType = (type: Job["type"]) => {
    setData((prev) => {
      const untouched = isBlank(prev.salaryMin) && isBlank(prev.salaryMax);
      return { ...prev, type, ...(untouched && { salaryPeriod: payBasisFor(type) }) };
    });
    clear("type");
  };

  const handleManagerSelect = (u: AssigneeUser | null) => {
    // The manager is notified as manager, so they leave the assignee list.
    setData((prev) => {
      const idx = u ? prev.assignedToIds.indexOf(u.id) : -1;
      const drop = <T,>(list: T[]) => (idx >= 0 ? list.filter((_, i) => i !== idx) : list);
      return {
        ...prev,
        recruitmentManagerId: u?.id || "",
        recruitmentManagerName: u ? u.name || u.email : "",
        recruitmentManagerEmail: u?.email || "",
        assignedToIds: drop(prev.assignedToIds),
        assignedToNames: drop(prev.assignedToNames),
        assignedToEmails: drop(prev.assignedToEmails),
      };
    });
  };
  const addAssignee = (u: AssigneeUser) =>
    setData((prev) => (prev.assignedToIds.includes(u.id) ? prev : {
      ...prev,
      assignedToIds: [...prev.assignedToIds, u.id],
      assignedToNames: [...prev.assignedToNames, u.name || u.email],
      assignedToEmails: [...prev.assignedToEmails, u.email],
    }));
  const removeAssignee = (idx: number) =>
    setData((prev) => ({
      ...prev,
      assignedToIds: prev.assignedToIds.filter((_, i) => i !== idx),
      assignedToNames: prev.assignedToNames.filter((_, i) => i !== idx),
      assignedToEmails: prev.assignedToEmails.filter((_, i) => i !== idx),
    }));

  // An enquiry names a company; link it to the client record of that name once the list arrives.
  React.useEffect(() => {
    if (!canPrice || data.clientId || !data.clientName || !clients.length) return;
    const hit = clients.find((c) => c.name.trim().toLowerCase() === data.clientName.trim().toLowerCase());
    if (hit) setData((prev) => ({ ...prev, clientId: hit.id, clientName: hit.name }));
  }, [canPrice, clients, data.clientId, data.clientName]);

  // ── Steps ──
  const headingRef = React.useRef<HTMLHeadingElement>(null);
  const pendingField = React.useRef<string | null>(null);
  const firstRender = React.useRef(true);

  // ?step=n survives a refresh; read once, the step count is fixed for a role.
  React.useEffect(() => {
    const n = Number(new URLSearchParams(window.location.search).get("step"));
    if (Number.isInteger(n) && n >= 2 && n <= steps.length) {
      setStepIdx(n - 1);
      setReached((r) => Math.max(r, n - 1));
    }
  }, []);

  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (stepIdx === 0) url.searchParams.delete("step");
    else url.searchParams.set("step", String(stepIdx + 1));
    window.history.replaceState(window.history.state, "", url);
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (pendingField.current) {
      jumpTo(pendingField.current);
      pendingField.current = null;
    } else {
      headingRef.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [stepIdx]);

  const goTo = (target: number) => {
    if (target <= stepIdx) return setStepIdx(target);
    // Forward: every step on the way must pass its blocking checks.
    for (let i = stepIdx; i < target; i++) {
      if (failing(STEP_ERRORS[steps[i]]).length) {
        if (i !== stepIdx) setStepIdx(i);
        requestAnimationFrame(() => validateSome(STEP_ERRORS[steps[i]]));
        return;
      }
    }
    setStepIdx(target);
    setReached((r) => Math.max(r, target));
  };
  const next = () => {
    if (!validateSome(STEP_ERRORS[step])) return;
    goTo(stepIdx + 1);
  };
  const jumpToField = (field: string) => {
    const target = steps.indexOf(FIELD_STEP[field] ?? "basics");
    if (target === stepIdx) return jumpTo(field);
    pendingField.current = field;
    setStepIdx(Math.max(0, target));
  };
  const invalidSteps = steps.map((s, i) => (STEP_ERRORS[s].some((k) => errors[k]) ? i : -1)).filter((i) => i >= 0);

  // ── Autosave ──
  const initialStatus = seed.status;
  const remoteAutosave = mode === "edit" && !!onAutosave && initialStatus === "draft" && data.status === "draft";
  const [saveState, setSaveState] = React.useState<SaveState>({ kind: "idle" });
  const [restore, setRestore] = React.useState<StoredDraft | null>(null);
  const restoreChecked = React.useRef(false);

  React.useEffect(() => {
    if (restoreChecked.current || !draftKey) return;
    restoreChecked.current = true;
    const stored = readDraft(draftKey);
    if (stored && snapshot(stored.data) !== seedSnap && (htmlText(stored.data.description) || stored.data.title.trim())) setRestore(stored);
  }, [draftKey, seedSnap]);

  const latest = React.useRef(data);
  latest.current = data;
  React.useEffect(() => {
    if (!dirty || submitting) return;
    const t = window.setTimeout(async () => {
      const d = latest.current;
      // An unanswered restore offer keeps its draft.
      if (draftKey && !restore) {
        try {
          window.localStorage.setItem(draftKey, JSON.stringify({ savedAt: new Date().toISOString(), data: d } satisfies StoredDraft));
        } catch {
          // Storage full or blocked: the in-memory form still holds the work.
        }
      }
      // Only what the server would accept; otherwise it stays a local backup until it does.
      if (remoteAutosave && onAutosave && d.title.trim() && d.type && (d.workplace === "remote" || d.location.trim())) {
        setSaveState({ kind: "saving" });
        try {
          await onAutosave(d);
          setBaseline(snapshot(d));
          clearJobDraft(draftKey);
          setSaveState({ kind: "saved", at: new Date() });
        } catch {
          setSaveState({ kind: "error", message: "Not saved. Kept on this device." });
        }
      } else if (draftKey && !restore) {
        setSaveState({ kind: "saved", at: new Date() });
      }
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(t);
  }, [currentSnap, dirty, submitting, restore, remoteAutosave, draftKey]);

  // ── Suggestions (shown on Review only) ──
  const quality = summarizeChecks(
    jobChecks({
      title: data.title, type: data.type, workplace: data.workplace, location: data.location,
      description: data.description, responsibilities: data.responsibilities, requirements: data.requirements,
      skills: data.skills, submissionDueDate: data.submissionDueDate,
      clientName: data.clientName, vendorName: data.vendorName, canPrice,
    }),
  );

  const editorsFull = !!(htmlText(data.description) && htmlText(data.responsibilities) && htmlText(data.requirements));
  const insertTemplate = () => {
    const t = jobTemplate(data.department, data.type || "full-time");
    setData((prev) => ({
      ...prev,
      description: htmlText(prev.description) ? prev.description : t.description,
      responsibilities: htmlText(prev.responsibilities) ? prev.responsibilities : t.responsibilities,
      requirements: htmlText(prev.requirements) ? prev.requirements : t.requirements,
      skills: prev.skills.length ? prev.skills : t.skills,
    }));
    clear("description");
  };

  // ── Saving ──
  const crossesActive = (to: Job["status"]) => (to === "active") !== (initialStatus === "active");

  const save = (status: Job["status"]) => {
    if (submitting) return;
    const bad = steps.find((s) => failing(STEP_ERRORS[s]).length);
    if (bad) {
      const i = steps.indexOf(bad);
      if (i !== stepIdx) setStepIdx(i);
      requestAnimationFrame(() => validateSome(STEP_ERRORS[bad]));
      return;
    }
    if (!validateAll()) return;
    if (crossesActive(status)) {
      setConfirmStatus(status);
      return;
    }
    setSavingAs(status);
    onSubmit({ ...data, status });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Enter in a field moves on; it never publishes.
    if (step !== "review") next();
  };

  const listLabel = JOB_LIST_LABEL[data.category];
  const isRemote = data.workplace === "remote";
  const hourly = data.salaryPeriod === "hour";
  // Older records may hold a day, week or month range; keep it until someone picks a basis.
  const legacyPeriod = hourly || data.salaryPeriod === "year" ? null : data.salaryPeriod;
  const periodShort = SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short ?? "";
  const hasRange = !isBlank(data.salaryMin) && !isBlank(data.salaryMax);
  const deadlineWarning = pastDateWarning(data.submissionDueDate, "This date has passed. Past-deadline roles close automatically.");
  const statusCopy = JOB_STATUS_COPY[data.status] ?? JOB_STATUS_COPY.draft;
  const unknownState = !!data.state && !US_STATES.some((s) => s.code === data.state);

  const { jobs: recent } = useJobSummaries(mode === "create" && !!onCopyFrom);
  const recentRoles = React.useMemo(
    () => [...(recent ?? [])].sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")).slice(0, 20),
    [recent],
  );

  const posting: PostingJob = {
    postingId: job?.postingId,
    title: data.title,
    department: data.department,
    location: data.location,
    state: data.state,
    type: data.type,
    workplace: data.workplace,
    description: data.description,
    requirements: data.requirements,
    responsibilities: data.responsibilities,
    submissionDueDate: data.submissionDueDate,
    skills: data.skills,
    salary: hasRange ? { min: toNumber(data.salaryMin), max: toNumber(data.salaryMax), currency: "USD", period: data.salaryPeriod } : null,
    showPay: data.showPay,
  };

  const statusMenu: MenuEntry[] = [
    { kind: "label", label: "Status after saving" },
    ...jobStatusChoices(initialStatus).map((s) => ({
      label: JOB_STATUS_COPY[s].label,
      hint: JOB_STATUS_COPY[s].detail,
      checked: data.status === s,
      onSelect: () => set("status", s),
    })),
  ];

  const crossing = confirmStatus !== null;
  const toActive = confirmStatus === "active";
  const left = quality.advisoryLeft.length;
  const isLast = step === "review";
  const tap = "max-lg:min-h-11";
  const savedAt = restore ? new Date(restore.savedAt) : null;

  return (
    <Page width="narrow">
      <PageHeader
        back={{
          href: mode === "edit" && job ? `/portal/jobs/${job.id}${data.category === "open" ? "?category=open" : ""}` : JOB_LIST_HREF[data.category],
          label: mode === "edit" ? "Job" : listLabel,
        }}
        title={mode === "create" ? "New role" : "Edit role"}
        meta={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
            {mode === "edit" && (
              <ActionMenu
                label="Status"
                items={statusMenu}
                width="w-72"
                align="start"
                trigger={
                  <button
                    type="button"
                    aria-label={`Status: ${statusCopy.label}. Change status`}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-[var(--color-border-control)] hover:bg-mist-50"
                  >
                    {statusCopy.label}
                    {data.status !== initialStatus && <span className="font-normal text-mist-600">(unsaved)</span>}
                    <Icon name="chevronDown" className="size-4" />
                  </button>
                }
              />
            )}
            {mode === "create" && onCopyFrom && !dirty && (
              <ActionMenu
                label="Copy an existing role"
                width="w-80"
                align="start"
                items={
                  recentRoles.length
                    ? recentRoles.map((j) => ({ label: j.title, hint: j.postingId, onSelect: () => onCopyFrom(j.id) }))
                    : [{ kind: "label", label: recent ? "No roles yet" : "Loading roles…" }]
                }
                trigger={
                  <button type="button" className={linkCls}>
                    Copy an existing role
                  </button>
                }
              />
            )}
          </span>
        }
        description={mode === "edit" ? [job?.postingId, job?.title].filter(Boolean).join(" · ") || undefined : notice}
        actions={
          <>
            <SaveStateLine state={saveState} className="hidden sm:block" />
            {mode === "create" ? (
              <Button variant="secondary" loading={submitting && savingAs === "draft"} disabled={submitting} onClick={() => save("draft")}>
                Save draft
              </Button>
            ) : (
              !isLast && (
                <Button variant="secondary" loading={submitting} onClick={() => save(data.status)}>
                  Save changes
                </Button>
              )
            )}
          </>
        }
      />

      {restore && savedAt && (
        <p role="status" className="flex flex-wrap items-center gap-x-3 text-adm-base text-mist-700">
          You have unsaved work from {fmtDate(restore.savedAt)}, {savedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase()}.
          <button type="button" className={linkCls} onClick={() => { setData(restore.data); setRestore(null); }}>
            Restore
          </button>
          <button type="button" className={linkCls} onClick={() => { clearJobDraft(draftKey); setRestore(null); }}>
            Discard
          </button>
        </p>
      )}

      <FormBanner message={serverError} onDismiss={onDismissError} />

      <form id={formId} noValidate onSubmit={handleFormSubmit} onBlur={revalidate} className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
        <div className="border-b border-mist-200 px-5 py-4 lg:px-8">
          <Stepper steps={stepDefs} current={stepIdx} reachable={reached} invalid={invalidSteps} onGo={goTo} />
        </div>

        <div className="grid gap-6 px-5 py-6 lg:px-8 lg:py-8">
          <div>
            <h2 ref={headingRef} tabIndex={-1} className="text-adm-lg font-semibold text-navy-900 focus-visible:outline-none!">
              {STEP_LABEL[step]}
            </h2>
            {step === "internal" && (
              <p className="mt-1 flex items-center gap-1.5 text-adm-base text-mist-600">
                <Icon name="lock" className="size-4" />
                Never shown to candidates.
              </p>
            )}
          </div>

          {step === "basics" && (
            <>
              <Field label="Job title" htmlFor="job-title" hint={counter(data.title.length, JOB_TEXT_LIMITS.title) ?? "Required"} error={errors.title}>
                <TextInput
                  id="job-title"
                  aria-required
                  {...invalidProps("title")}
                  maxLength={JOB_TEXT_LIMITS.title}
                  value={data.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </Field>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Practice" htmlFor="job-department">
                  <NativeSelect id="job-department" value={data.department} onChange={(e) => set("department", e.target.value)}>
                    {PRACTICE_GROUPS.map((g) => (
                      <optgroup key={g.label} label={g.label}>
                        {g.items.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    {data.department && !DEPARTMENTS.includes(data.department) && <option value={data.department}>{data.department}</option>}
                  </NativeSelect>
                </Field>
                <Field label="Job type" htmlFor="job-type" error={errors.type}>
                  <NativeSelect id="job-type" aria-required {...invalidProps("type")} value={data.type} onChange={(e) => setType(e.target.value as Job["type"])}>
                    {!data.type && <option value="">Select job type…</option>}
                    {JOB_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </NativeSelect>
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Workplace" htmlFor="job-workplace">
                  <Choice
                    id="job-workplace"
                    label="Workplace"
                    value={data.workplace}
                    options={WORKPLACES.map((w) => ({ value: w, label: WORKPLACE_LABEL[w] }))}
                    onChange={(w) => {
                      set("workplace", w);
                      clear("location");
                    }}
                  />
                </Field>
                {/* Defaults to the list the form was opened from (?category=). */}
                <Field label="Role type" htmlFor="job-category">
                  <Choice id="job-category" label="Role type" value={data.category} options={JOB_CATEGORIES} onChange={(c) => set("category", c)} />
                </Field>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="City" htmlFor="job-location" hint={isRemote ? "Optional" : "Required"} error={errors.location}>
                  <TextInput
                    id="job-location"
                    aria-required={!isRemote}
                    {...invalidProps("location")}
                    maxLength={JOB_TEXT_LIMITS.location}
                    value={data.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder={isRemote ? "Leave blank if anywhere" : "e.g. Columbus"}
                  />
                </Field>
                <Field label="State" htmlFor="job-state" optional>
                  <NativeSelect id="job-state" value={data.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state…</option>
                    {US_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.name}
                      </option>
                    ))}
                    {unknownState && <option value={data.state}>{data.state}</option>}
                  </NativeSelect>
                </Field>
              </div>
            </>
          )}

          {step === "posting" && (
            <>
              <Field
                label="About the role"
                labelId="job-description-label"
                htmlFor="job-description"
                hint={counter(htmlText(data.description).length, LIMITS.description) ?? "Required"}
                error={errors.description}
              >
                {!editorsFull && (
                  <button type="button" onClick={insertTemplate} className={`${linkCls} mb-2`}>
                    Insert template
                  </button>
                )}
                <RichTextEditor
                  id="job-description"
                  labelledBy="job-description-label"
                  required
                  invalid={!!errors.description}
                  className={errors.description ? "border-status-danger-mark" : undefined}
                  value={data.description}
                  onChange={(html) => set("description", html)}
                  placeholder="The team, what they are building, and what this person will own…"
                />
              </Field>
              <Field label="What you will do" optional labelId="job-responsibilities-label">
                <RichTextEditor
                  id="job-responsibilities"
                  labelledBy="job-responsibilities-label"
                  value={data.responsibilities}
                  onChange={(html) => set("responsibilities", html)}
                  placeholder="Design and build new features; review code; work with product…"
                />
              </Field>
              <Field label="What you bring" optional labelId="job-requirements-label">
                <RichTextEditor
                  id="job-requirements"
                  labelledBy="job-requirements-label"
                  value={data.requirements}
                  onChange={(html) => set("requirements", html)}
                  placeholder="5+ years with React and Node.js; experience with AWS…"
                />
              </Field>
              <Field label="Skills" htmlFor="job-skills" optional>
                <SkillsInput
                  id="job-skills"
                  value={data.skills}
                  onChange={(v) => set("skills", v)}
                  suggestions={jobTemplate(data.department, data.type || "full-time").skills}
                  max={SKILLS_MAX}
                />
              </Field>
            </>
          )}

          {step === "pay" && (
            <>
              <Field label="Apply by" htmlFor="job-deadline" optional warning={deadlineWarning} className="sm:max-w-xs">
                <TextInput id="job-deadline" type="date" className="tabular-nums" value={data.submissionDueDate} onChange={(e) => set("submissionDueDate", e.target.value)} />
              </Field>
              <Field label="Pay basis" htmlFor="job-pay-basis">
                <Choice
                  id="job-pay-basis"
                  label="Pay basis"
                  value={data.salaryPeriod}
                  options={[
                    ...PAY_BASIS_OPTIONS,
                    ...(legacyPeriod ? [{ value: legacyPeriod, label: SALARY_PERIODS.find((p) => p.value === legacyPeriod)!.label }] : []),
                  ]}
                  onChange={setPayBasis}
                  className="sm:max-w-xs"
                />
              </Field>
              <RangeInput
                ids={{ min: "job-salary-min", max: "job-salary-max" }}
                labels={hourly ? { min: "Minimum rate", max: "Maximum rate" } : { min: "Minimum salary", max: "Maximum salary" }}
                min={data.salaryMin}
                max={data.salaryMax}
                onMin={(v) => set("salaryMin", v)}
                onMax={(v) => set("salaryMax", v)}
                suffix={periodShort}
                errors={{ min: errors.salaryMin, max: errors.salaryMax }}
                invalidProps={(k) => invalidProps(k === "min" ? "salaryMin" : "salaryMax")}
                placeholders={hourly ? { min: "45", max: "65" } : data.salaryPeriod === "year" ? { min: "80,000", max: "120,000" } : {}}
              />
              <div>
                <label htmlFor="job-show-pay" className="flex min-h-10 cursor-pointer items-center gap-4">
                  <span className="text-adm-base font-medium text-navy-900">Show pay on posting</span>
                  <input
                    id="job-show-pay"
                    type="checkbox"
                    role="switch"
                    aria-describedby="job-show-pay-help"
                    checked={data.showPay}
                    onChange={(e) => set("showPay", e.target.checked)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-6 w-10 shrink-0 rounded-full bg-mist-500 transition-colors duration-150 peer-checked:bg-ocean-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ocean-600 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-mist-0 after:shadow-sm after:transition-transform after:duration-150 peer-checked:after:translate-x-4"
                  />
                </label>
                <p id="job-show-pay-help" className="mt-1 text-adm-xs leading-snug text-mist-600">
                  {data.showPay
                    ? hasRange ? "The range appears on the careers site and in Google Jobs." : "Add a minimum and maximum, or nothing shows."
                    : "Off: candidates do not see pay. Cleveland, and Columbus from 2027, require ranges on postings; check with counsel."}
                </p>
              </div>
            </>
          )}

          {step === "internal" && canPrice && (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Client" htmlFor="job-client" helper={!data.clientId && data.clientName ? `From the enquiry: ${data.clientName}.` : undefined}>
                  <PartnerPicker<Client>
                    id="job-client"
                    kind="client"
                    items={clients}
                    value={data.clientId}
                    noneLabel="No client"
                    onChange={(id, c) =>
                      setData((prev) => (id ? { ...prev, clientId: id, clientName: c?.name || prev.clientName } : { ...prev, clientId: "", clientName: "" }))
                    }
                    renderCreate={(close, done) => <AddClientDialog onClose={close} onAdd={async (d) => { const c = await onAddClient(d); done(c); return c; }} />}
                  />
                </Field>
                <Field label="Vendor" htmlFor="job-vendor">
                  <PartnerPicker<Vendor>
                    id="job-vendor"
                    kind="vendor"
                    items={vendors}
                    value={data.vendorId}
                    noneLabel="No vendor"
                    onChange={(id, v) => setData((prev) => ({ ...prev, vendorId: id, vendorName: id ? v?.name || prev.vendorName : "" }))}
                    renderCreate={(close, done) => (
                      <AddVendorDialog
                        leads={hrUsers.filter((u) => u.role === "admin" || u.role === "hr")}
                        defaultLeadId={user?.id}
                        onClose={close}
                        onAdd={async (d) => { const v = await onAddVendor(d); done(v); return v; }}
                      />
                    )}
                  />
                </Field>
              </div>
              {showsRates(data) && (
                <div className="grid gap-4">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Field label="Bill rate" htmlFor="job-bill-rate" error={errors.clientBillRate}>
                      <MoneyInput id="job-bill-rate" suffix="/hr" {...invalidProps("clientBillRate")} value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
                    </Field>
                    <Field label="Pay rate" htmlFor="job-pay-rate" error={errors.payRate}>
                      <MoneyInput id="job-pay-rate" suffix="/hr" {...invalidProps("payRate")} value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
                    </Field>
                  </div>
                  <MarginPreview bill={data.clientBillRate} pay={data.payRate} targetMarginPct={job?.targetMarginPct ?? DEFAULT_TARGET_MARGIN_PCT} />
                </div>
              )}
              {showsFee(data) && (
                <div className="grid gap-4">
                  <Field label="Placement fee" htmlFor="job-fee" error={errors.feePct} className="sm:max-w-xs">
                    <div className="relative">
                      <TextInput
                        id="job-fee"
                        inputMode="decimal"
                        {...invalidProps("feePct")}
                        value={data.feePct}
                        onChange={(e) => set("feePct", e.target.value)}
                        placeholder="20"
                        className="pr-9 tabular-nums"
                      />
                      <span aria-hidden className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-adm-base text-mist-600">
                        %
                      </span>
                    </div>
                  </Field>
                  <FeePreview feePct={data.feePct} min={data.salaryMin} max={data.salaryMax} />
                </div>
              )}
              <div>
                <button type="button" aria-expanded={moreOpen} aria-controls="job-more" onClick={() => setMoreOpen((v) => !v)} className={linkCls}>
                  {moreOpen ? "Fewer details" : "Add more details"}
                  <Icon name="chevronDown" className={`size-4 transition-transform duration-200 ${moreOpen ? "rotate-180" : ""}`} />
                </button>
                {moreOpen && (
                  <div id="job-more" className="mt-4 grid gap-6">
                    <Field label="Client notes" htmlFor="job-client-notes" error={errors.clientNotes} hint={counter(data.clientNotes.length, LIMITS.notes)}>
                      <TextArea
                        id="job-client-notes"
                        rows={3}
                        {...invalidProps("clientNotes")}
                        value={data.clientNotes}
                        onChange={(e) => set("clientNotes", e.target.value)}
                        placeholder="Anything the desk should know about this client"
                      />
                    </Field>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <Field label="Recruitment manager">
                        <StaffPicker
                          label="Recruitment manager"
                          people={hrUsers}
                          value={data.recruitmentManagerId}
                          fallbackName={data.recruitmentManagerName}
                          noneLabel="No manager"
                          onChange={(_, p) => handleManagerSelect(p)}
                        />
                      </Field>
                      <Field label="Assignees">
                        <StaffMultiPicker
                          label="Assignees"
                          people={hrUsers}
                          values={data.assignedToIds}
                          names={data.assignedToNames}
                          exclude={data.recruitmentManagerId ? [data.recruitmentManagerId] : []}
                          onAdd={addAssignee}
                          onRemove={(_, i) => removeAssignee(i)}
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {step === "review" && <JobReview job={posting} jobId={job?.id} suggestions={quality.advisoryLeft} onJump={jumpToField} />}
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 rounded-b-xl border-t border-mist-200 bg-mist-0 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {stepIdx > 0 ? (
            <Button variant="ghost" icon="chevronLeft" onClick={() => goTo(stepIdx - 1)} className={tap}>
              Back
            </Button>
          ) : (
            <span />
          )}
          {!isLast ? (
            <Button type="submit" icon="chevronRight" className={tap}>
              Next
            </Button>
          ) : mode === "create" ? (
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
              <button type="button" disabled={submitting} onClick={() => save("open")} className={linkCls}>
                Save as internal (not on website)
              </button>
              <Button icon="globe" loading={submitting && savingAs === "active"} disabled={submitting} onClick={() => save("active")} className={tap}>
                Publish
              </Button>
            </div>
          ) : (
            <Button icon="check" loading={submitting} onClick={() => save(data.status)} className={tap}>
              Save changes
            </Button>
          )}
        </div>
      </form>

      {crossing && (
        <ConfirmDialog
          tone="primary"
          title={toActive ? (left ? `${left} suggestion${left === 1 ? "" : "s"} left. Publish anyway?` : "Publish this role?") : "Take this role off the careers site?"}
          body={
            toActive
              ? "It goes live on the careers site and starts taking applications straight away."
              : `Saving it as ${JOB_STATUS_COPY[confirmStatus!].label} removes the posting from the careers site. Candidates can no longer apply.`
          }
          confirmLabel={toActive ? "Publish" : "Save and unpublish"}
          busy={submitting}
          onCancel={() => setConfirmStatus(null)}
          onConfirm={() => {
            const status = confirmStatus!;
            setConfirmStatus(null);
            setSavingAs(status);
            set("status", status);
            onSubmit({ ...data, status });
          }}
        />
      )}
    </Page>
  );
}
