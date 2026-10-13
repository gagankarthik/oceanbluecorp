"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { IconClock, IconEye, IconHash, IconJob, IconLocation, IconSave } from "../icons";
import type { Job, Client, Vendor, SalaryPeriod } from "@/lib/aws/dynamodb";
import { jobCategory, type JobCategory } from "@/lib/job-status";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { US_STATES, normalizeState, SALARY_PERIODS } from "@/components/admin/theme";
import { WorkspaceButton, BackLink } from "@/components/admin/workspace";
import { Field, FormInput, MoneyInput, FormSelect, AssigneePicker, AssigneeUser, PersonPicker, SegmentedChoice } from "./primitives";
import { WORKPLACES, WORKPLACE_LABEL, jobLocationLabel, workplaceOf, type Workplace } from "@/lib/workplace";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { renderRichText, renderListField } from "@/lib/rich-text";
import { useAuth, canSeeJobCommercials } from "@/lib/auth";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  LIMITS, check, collectErrors, email, htmlText, isBlank, maxLen, nonNegative, pastDateWarning,
  payOverBillWarning, phone, rangeInverted, required, website,
} from "@/lib/form-validation";
import { FieldWarning, FormErrorBanner } from "./form-alert";
import { StepCard, StepRail, useActiveStep, type StepInfo, type StepState } from "./form-steps";

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  "ERP Solutions","Cloud Services","Data & AI","Salesforce","Engineering",
  "Information and Computers","Training","PMO","Operations",
];

export const JOB_TYPES: { value: Job["type"]; label: string }[] = [
  { value: "full-time",       label: "Full-time" },
  { value: "part-time",       label: "Part-time" },
  { value: "contract",        label: "Contract" },
  { value: "contract-to-hire",label: "Contract-to-hire" },
  { value: "direct-hire",     label: "Direct hire" },
  { value: "managed-teams",   label: "Managed teams" },
];

const WORKPLACE_OPTIONS = WORKPLACES.map((value) => ({ value, label: WORKPLACE_LABEL[value] }));

/** Hourly roles carry bill and pay rates and an hourly range; annual roles a yearly salary. */
type PayBasis = "hour" | "year";
const PAY_BASIS_OPTIONS: { value: PayBasis; label: string }[] = [
  { value: "hour", label: "Hourly" },
  { value: "year", label: "Annual" },
];

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: "state", label: "State role" },
  { value: "open",  label: "Open role" },
];

export const JOB_STATUSES: { value: Job["status"]; label: string }[] = [
  { value: "draft",    label: "Draft" },
  { value: "open",     label: "Open" },
  { value: "active",   label: "Active" },
  { value: "on-hold",  label: "On hold" },
  { value: "paused",   label: "Paused" },
  { value: "closed",   label: "Closed" },
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
  salaryMin: string;
  salaryMax: string;
  salaryPeriod: SalaryPeriod;
  recruitmentManagerId: string;
  recruitmentManagerName: string;
  recruitmentManagerEmail: string;
  assignedToIds: string[];
  assignedToNames: string[];
  assignedToEmails: string[];
  description: string;
  requirements: string;
  responsibilities: string;
}

export const DEFAULT_JOB_FORM: JobFormData = {
  title: "", status: "draft", category: "state", department: DEPARTMENTS[0], type: "full-time",
  workplace: "on-site", location: "", state: "", clientId: "", clientName: "", clientNotes: "",
  vendorId: "", vendorName: "", submissionDueDate: "",
  clientBillRate: "", payRate: "", salaryMin: "", salaryMax: "", salaryPeriod: "year",
  recruitmentManagerId: "", recruitmentManagerName: "", recruitmentManagerEmail: "",
  assignedToIds: [], assignedToNames: [], assignedToEmails: [],
  description: "", requirements: "", responsibilities: "",
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
    // Legacy records store the full name ("California"); the canonical stored
    // value is now the 2-letter code, so coerce on read or the picker blanks.
    // A legacy `state: "Remote"` normalises to "". Remote is a workplace.
    state: normalizeState(job.state),
    clientId: job.clientId || "",
    clientName: job.clientName || "",
    clientNotes: job.clientNotes || "",
    vendorId: job.vendorId || "",
    vendorName: job.vendorName || "",
    submissionDueDate: job.submissionDueDate?.split("T")[0] || "",
    clientBillRate: job.clientBillRate?.toString() || "",
    payRate: job.payRate?.toString() || "",
    salaryMin: job.salary?.min?.toString() || "",
    salaryMax: job.salary?.max?.toString() || "",
    // Records without a period predate the field and are annual.
    salaryPeriod: job.salary?.period || "year",
    recruitmentManagerId: job.recruitmentManagerId || "",
    recruitmentManagerName: job.recruitmentManagerName || "",
    recruitmentManagerEmail: job.recruitmentManagerEmail || "",
    assignedToIds: job.assignedToIds || (job.assignedToId ? [job.assignedToId] : []),
    assignedToNames: job.assignedToNames || (job.assignedToName ? [job.assignedToName] : []),
    assignedToEmails: job.assignedToEmails || [],
    description: job.description || "",
    // Seed the rich editor with HTML, a legacy string[] becomes a <ul>, HTML
    // passes through unchanged.
    requirements: renderListField(job.requirements).__html,
    responsibilities: renderListField(job.responsibilities).__html,
  };
}

/** Build API payload from form data */
export function formDataToPayload(data: JobFormData) {
  return {
    title: data.title,
    category: data.category,
    department: data.department,
    location: data.location,
    state: data.state || undefined,
    type: data.type,
    workplace: data.workplace,
    description: data.description,
    // Rich HTML now (server sanitizes on save). Empty editors send undefined so
    // an empty <ul></ul> or stray <br> isn't stored.
    requirements: data.requirements?.trim() ? data.requirements : undefined,
    responsibilities: data.responsibilities?.trim() ? data.responsibilities : undefined,
    // null, not undefined, so clearing the range clears it on the record.
    salary: data.salaryMin && data.salaryMax
      ? { min: parseFloat(data.salaryMin), max: parseFloat(data.salaryMax), currency: "$", period: data.salaryPeriod }
      : null,
    // Bill and pay rates are hourly; an annual role leaves the stored ones alone.
    clientBillRate: data.salaryPeriod === "hour" && data.clientBillRate ? parseFloat(data.clientBillRate) : undefined,
    payRate: data.salaryPeriod === "hour" && data.payRate ? parseFloat(data.payRate) : undefined,
    status: data.status,
    submissionDueDate: data.submissionDueDate || undefined,
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
  };
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
  onSubmit: (data: JobFormData) => void;
  onAddClient: (clientData: { name: string; websiteUrl: string; email: string; phone: string }) => Promise<Client>;
  onAddVendor: (vendorData: NewVendorInput) => Promise<Vendor>;
  formId?: string;
}

export type NewVendorInput = Pick<Vendor, "name" | "contactPerson" | "email" | "vendorLeadId" | "vendorLeadName" | "vendorLeadRole">;

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

// ── Component ──────────────────────────────────────────────────────────────────

export function JobForm({
  mode, initialData, job, clients, vendors, hrUsers, submitting, serverError, onDismissError, onSubmit, onAddClient, onAddVendor, formId = "job-form",
}: JobFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = React.useState<JobFormData>(initialData || DEFAULT_JOB_FORM);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showAddClient, setShowAddClient] = React.useState(false);
  const [showAddVendor, setShowAddVendor] = React.useState(false);

  /* Media authors postings but never prices them, so client, vendor, rates and
     team assignment are not rendered for it — removed, not disabled
     (DESIGN_SYSTEM §5): a media account will never gain these, and a column of
     greyed-out controls is a screen full of dead ends.

     Read from the session here rather than taken as a prop so a third page
     rendering this form cannot forget to pass it. The API enforces the same
     split independently; this is the courtesy half. */
  const canPrice = canSeeJobCommercials(user?.role);

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
  const baseline = React.useMemo(() => snapshot(initialData || DEFAULT_JOB_FORM), [initialData]);
  useUnsavedChanges(!submitting && snapshot(data) !== baseline);

  const set = <K extends keyof JobFormData>(k: K, v: JobFormData[K]) =>
    setData((prev) => ({ ...prev, [k]: v }));

  const handleClientSelect = (clientId: string) => {
    if (clientId === "add-new") { setShowAddClient(true); return; }
    if (!clientId) { set("clientId", ""); set("clientName", ""); set("clientNotes", ""); return; }
    const client = clients.find((c) => c.id === clientId);
    set("clientId", clientId);
    set("clientName", client?.name || "");
  };

  const handleVendorSelect = (vendorId: string) => {
    if (vendorId === "add-new") { setShowAddVendor(true); return; }
    if (vendorId === "none" || !vendorId) { set("vendorId", ""); set("vendorName", ""); return; }
    const vendor = vendors.find((v) => v.id === vendorId);
    set("vendorId", vendorId);
    set("vendorName", vendor?.name || "");
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
  };

  const toggleAssignee = (u: AssigneeUser) => {
    const idx = data.assignedToIds.indexOf(u.id);
    if (idx >= 0) {
      setData((prev) => ({
        ...prev,
        assignedToIds: prev.assignedToIds.filter((_, i) => i !== idx),
        assignedToNames: prev.assignedToNames.filter((_, i) => i !== idx),
        assignedToEmails: prev.assignedToEmails.filter((_, i) => i !== idx),
      }));
    } else {
      setData((prev) => ({
        ...prev,
        assignedToIds: [...prev.assignedToIds, u.id],
        assignedToNames: [...prev.assignedToNames, u.name || u.email],
        assignedToEmails: [...prev.assignedToEmails, u.email],
      }));
    }
  };

  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () => {
      const descText = htmlText(data.description);
      // The payload only sends a salary when both ends are set, so half a range would be dropped silently.
      const salaryHalf = !isBlank(data.salaryMin) !== !isBlank(data.salaryMax);
      return collectErrors({
        title: check(data.title, required("Enter a job title, like Senior Software Engineer."), maxLen(LIMITS.title)),
        type: data.type ? undefined : "Choose the job type. Remote is now set under Workplace.",
        location: data.workplace === "remote"
          ? check(data.location, maxLen(LIMITS.title))
          : check(data.location, required("Enter the city or location, like Columbus."), maxLen(LIMITS.title)),
        clientNotes: check(data.clientNotes, maxLen(LIMITS.notes)),
        clientBillRate: canPrice ? check(data.clientBillRate, nonNegative("Enter the bill rate as a number, like 75.")) : undefined,
        payRate: canPrice ? check(data.payRate, nonNegative("Enter the pay rate as a number, like 55.")) : undefined,
        salaryMin:
          check(data.salaryMin, nonNegative("Enter the minimum pay as a number, like 80000.")) ??
          (salaryHalf && isBlank(data.salaryMin) ? "Add a minimum salary too, or clear the maximum." : undefined),
        salaryMax:
          check(data.salaryMax, nonNegative("Enter the maximum pay as a number, like 120000.")) ??
          (salaryHalf && isBlank(data.salaryMax) ? "Add a maximum salary too, or clear the minimum." : undefined) ??
          (rangeInverted(data.salaryMin, data.salaryMax) ? "The maximum salary is lower than the minimum." : undefined),
        description: !descText
          ? "Describe the role so candidates know what they are applying for."
          : check(descText, maxLen(LIMITS.description)),
      });
    },
    {
      title: "job-title", type: "job-type", location: "job-location", clientNotes: "job-client-notes",
      clientBillRate: "job-bill-rate", payRate: "job-pay-rate", salaryMin: "job-salary-min",
      salaryMax: "job-salary-max", description: "job-description",
    },
  );

  const payWarning = canPrice ? payOverBillWarning(data.payRate, data.clientBillRate) : undefined;
  const deadlineWarning = pastDateWarning(
    data.submissionDueDate,
    "This deadline has already passed. Pick a later date if the role is still taking candidates.",
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateAll()) return;
    onSubmit(data);
  };

  const statusColor: Record<string, string> = {
    draft: "text-[var(--adm-ink-mute)]", open: "text-[var(--adm-success-ink)]", active: "text-[var(--adm-accent)]",
    "on-hold": "text-[var(--adm-warning-ink)]", paused: "text-[var(--adm-warning-ink)]", closed: "text-[var(--adm-ink-mute)]",
  };

  const isRemote = data.workplace === "remote";
  const hourly = data.salaryPeriod === "hour";
  // Older records may hold a day, week or month range; keep it until someone picks a basis.
  const legacyPeriod = hourly || data.salaryPeriod === "year" ? null : data.salaryPeriod;
  const periodUnit = `$${SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short ?? ""}`;
  const typeLabel = JOB_TYPES.find((t) => t.value === data.type)?.label || data.type;

  const descText = htmlText(data.description);
  const hasPay = (!isBlank(data.salaryMin) && !isBlank(data.salaryMax)) || (hourly && canPrice && !!(data.clientBillRate || data.payRate));
  const steps: StepInfo[] = [
    { id: "step-role", title: "Role", required: true, state: data.title.trim() && data.type ? "done" : "todo" },
    { id: "step-location", title: "Location", required: true, state: isRemote || data.location.trim() ? "done" : "todo" },
    { id: "step-description", title: "Description", required: true, state: descText ? "done" : "todo" },
    { id: "step-pay", title: "Compensation", state: hasPay ? "done" : "optional" },
    {
      id: "step-client",
      title: canPrice ? "Client and deadline" : "Deadline",
      state: data.clientId || data.vendorId || data.submissionDueDate ? "done" : "optional",
    },
    ...(canPrice
      ? [{ id: "step-team", title: "Team", state: (data.recruitmentManagerId || data.assignedToIds.length ? "done" : "optional") as StepState }]
      : []),
  ];
  const stepState = (id: string) => steps.find((s) => s.id === id)!.state;
  const activeStep = useActiveStep(steps.map((s) => s.id));
  const requiredLeft = steps.filter((s) => s.required && s.state !== "done").length;

  const payLine = !isBlank(data.salaryMin) && !isBlank(data.salaryMax)
    ? `$${Number(data.salaryMin).toLocaleString()} – $${Number(data.salaryMax).toLocaleString()}${SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short ?? ""}`
    : "";
  const summary: { k: string; v: string }[] = [
    { k: "Title", v: data.title.trim() },
    { k: "Type", v: [typeLabel, WORKPLACE_LABEL[data.workplace]].filter(Boolean).join(" · ") },
    { k: "Location", v: jobLocationLabel(data) },
    { k: "Pay", v: payLine },
    { k: "Status", v: JOB_STATUSES.find((s) => s.value === data.status)?.label ?? data.status },
  ];
  const submitLabel = mode === "create" ? "Create job" : "Save changes";

  return (
    <>
      <BackLink onClick={() => router.back()} />

      <header className="mx-auto mb-5 flex max-w-6xl flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-adm-lg font-semibold leading-7 tracking-[-0.02em] text-[var(--adm-ink)]">
            {mode === "create" ? "New" : "Edit"} {data.category === "open" ? "open" : "state"} role
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-adm-xs text-[var(--adm-ink-mute)]">
            {mode === "create" ? "Three required steps, the rest when you have them." : `Editing ${job?.title || "–"}`}
            {mode === "edit" && job?.postingId && (
              <span className="inline-flex items-center gap-1 rounded-[var(--adm-radius-chip)] bg-[var(--adm-surface-2)] px-2 py-0.5 font-mono text-adm-xs font-medium text-[var(--adm-ink-mute)]">
                <IconHash className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                {job.postingId}
              </span>
            )}
          </p>
        </div>
        <WorkspaceButton type="button" onClick={() => setShowPreview(true)}>
          <IconEye aria-hidden="true" />Preview
        </WorkspaceButton>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        {/* @container: field grids size off the form column, not the window. */}
        <form id={formId} noValidate onSubmit={handleSubmit} onBlur={revalidate} className="@container min-w-0 space-y-4">
          <FormErrorBanner message={serverError} onDismiss={onDismissError} />

          <StepCard id="step-role" step={1} title="Role" description="What the job is called and where it is listed." state={stepState("step-role")}>
            <div className="space-y-4">
              <Field label="Job title" required htmlFor="job-title" error={errors.title}>
                <FormInput
                  id="job-title"
                  required
                  {...invalidProps("title")}
                  value={data.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                  className="h-10 text-adm-md"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
                <Field label="Department" required htmlFor="job-department">
                  <FormSelect id="job-department" required value={data.department} onChange={(e) => set("department", e.target.value)}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Job type" required htmlFor="job-type" error={errors.type}>
                  <FormSelect id="job-type" required {...invalidProps("type")} value={data.type} onChange={(e) => set("type", e.target.value as Job["type"])}>
                    {!data.type && <option value="">Select job type…</option>}
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Listed under" htmlFor="job-category">
                  <FormSelect id="job-category" value={data.category} onChange={(e) => set("category", e.target.value as JobCategory)}>
                    {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Status" htmlFor="job-status" helper={data.status === "draft" ? "Drafts stay off the careers page." : undefined}>
                  <FormSelect
                    id="job-status"
                    value={data.status}
                    onChange={(e) => set("status", e.target.value as Job["status"])}
                    className={statusColor[data.status]}
                  >
                    {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </FormSelect>
                </Field>
              </div>
            </div>
          </StepCard>

          <StepCard
            id="step-location"
            step={2}
            title="Location"
            description={isRemote ? "Remote roles can leave the city and state blank." : "Where the work happens."}
            state={stepState("step-location")}
          >
            <div className="space-y-4">
              <Field label="Workplace" htmlFor="job-workplace">
                <SegmentedChoice
                  id="job-workplace"
                  label="Workplace"
                  value={data.workplace}
                  options={WORKPLACE_OPTIONS}
                  onChange={(v) => set("workplace", v)}
                  className="@xl:max-w-sm"
                />
              </Field>
              <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
                <Field label="City" required={!isRemote} hint={isRemote ? "Optional" : undefined} htmlFor="job-location" error={errors.location}>
                  <FormInput id="job-location" required={!isRemote} {...invalidProps("location")} value={data.location} onChange={(e) => set("location", e.target.value)} placeholder={isRemote ? "Leave blank if anywhere" : "e.g. Columbus"} />
                </Field>
                <Field label="State" hint={isRemote ? "Optional" : undefined} htmlFor="job-state">
                  {/* Stores the 2-letter code, shared with Applications and the bench. */}
                  <FormSelect id="job-state" value={data.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </FormSelect>
                </Field>
              </div>
            </div>
          </StepCard>

          <StepCard
            id="step-description"
            step={3}
            title="Description"
            description="What candidates read. Describe the role, then list requirements and responsibilities."
            state={stepState("step-description")}
          >
            <div className="space-y-4">
              <Field label="Description" required htmlFor="job-description" error={errors.description}>
                <RichTextEditor
                  id="job-description"
                  required
                  className={errors.description ? "border-[var(--adm-danger)]" : undefined}
                  value={data.description}
                  onChange={(html) => set("description", html)}
                  placeholder="Describe the role, team, and what makes this opportunity exciting…"
                />
              </Field>
              <Field label="Requirements" hint="Use the list button for bullet points" htmlFor="job-requirements">
                <RichTextEditor
                  id="job-requirements"
                  value={data.requirements}
                  onChange={(html) => set("requirements", html)}
                  placeholder="Bachelor's degree in Computer Science; 5+ years of experience; proficiency in React and Node.js…"
                />
              </Field>
              <Field label="Responsibilities" hint="Use the list button for bullet points" htmlFor="job-responsibilities">
                <RichTextEditor
                  id="job-responsibilities"
                  value={data.responsibilities}
                  onChange={(html) => set("responsibilities", html)}
                  placeholder="Design and implement new features; collaborate with cross-functional teams; conduct code reviews…"
                />
              </Field>
            </div>
          </StepCard>

          <StepCard
            id="step-pay"
            step={4}
            title="Compensation"
            description={hourly
              ? canPrice ? "Bill and pay rates, and the hourly range candidates see." : "The hourly range candidates see. Leave blank if not disclosed."
              : "The yearly salary range candidates see. Leave blank if not disclosed."}
            state={stepState("step-pay")}
          >
            <SegmentedChoice
              label="Pay basis"
              value={data.salaryPeriod}
              options={[
                ...PAY_BASIS_OPTIONS,
                ...(legacyPeriod ? [{ value: legacyPeriod, label: SALARY_PERIODS.find((p) => p.value === legacyPeriod)!.label }] : []),
              ]}
              onChange={setPayBasis}
              className="mb-4 @xl:max-w-[16rem]"
            />
            {/* Bill and pay rate are the placement margin; the range is public.
                Different audiences, so only the rates are gated. */}
            <div className={cn("grid grid-cols-1 gap-4 @xl:grid-cols-2", hourly && canPrice && "@3xl:grid-cols-4")}>
              {hourly && canPrice && (
              <Field label="Bill rate ($/hr)" htmlFor="job-bill-rate" error={errors.clientBillRate}>
                <MoneyInput id="job-bill-rate" {...invalidProps("clientBillRate")} value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
              </Field>
              )}
              {hourly && canPrice && (
              <Field label="Pay rate ($/hr)" htmlFor="job-pay-rate" error={errors.payRate}>
                <MoneyInput id="job-pay-rate" {...invalidProps("payRate")} value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
                {!errors.payRate && <FieldWarning>{payWarning}</FieldWarning>}
              </Field>
              )}
              <Field label={hourly ? "Min rate ($/hr)" : `Min salary (${periodUnit})`} htmlFor="job-salary-min" error={errors.salaryMin}>
                <MoneyInput id="job-salary-min" {...invalidProps("salaryMin")} value={data.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder={hourly ? "45" : data.salaryPeriod === "year" ? "80000" : ""} />
              </Field>
              <Field label={hourly ? "Max rate ($/hr)" : `Max salary (${periodUnit})`} htmlFor="job-salary-max" error={errors.salaryMax}>
                <MoneyInput id="job-salary-max" {...invalidProps("salaryMax")} value={data.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder={hourly ? "65" : data.salaryPeriod === "year" ? "120000" : ""} />
              </Field>
            </div>
          </StepCard>

          {/* Client and vendor are commercial, so media sees only the deadline. */}
          <StepCard
            id="step-client"
            step={5}
            title={canPrice ? "Client and deadline" : "Deadline"}
            description={canPrice ? "Who the role is for, and when submissions close." : "When submissions close."}
            state={stepState("step-client")}
          >
            <div className={cn("grid grid-cols-1 gap-4", canPrice && "@xl:grid-cols-2 @3xl:grid-cols-3")}>
              {canPrice && (
                <Field label="Client" htmlFor="job-client">
                  <FormSelect id="job-client" value={data.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                    <option value="">Select client</option>
                    <option value="add-new">+ Add new client</option>
                    {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </FormSelect>
                </Field>
              )}
              {canPrice && (
                <Field label="Vendor" htmlFor="job-vendor">
                  <FormSelect id="job-vendor" value={data.vendorId || "none"} onChange={(e) => handleVendorSelect(e.target.value)}>
                    <option value="none">No vendor</option>
                    <option value="add-new">+ Add new vendor</option>
                    {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </FormSelect>
                </Field>
              )}
              <Field label="Submission deadline" htmlFor="job-deadline">
                <FormInput
                  id="job-deadline"
                  type="date"
                  value={data.submissionDueDate}
                  onChange={(e) => set("submissionDueDate", e.target.value)}
                />
                <FieldWarning>{deadlineWarning}</FieldWarning>
              </Field>
            </div>
            {canPrice && data.clientId && data.clientId !== "add-new" && (
              <Field label="Client notes" htmlFor="job-client-notes" error={errors.clientNotes} className="mt-4">
                <FormInput
                  id="job-client-notes"
                  {...invalidProps("clientNotes")}
                  value={data.clientNotes}
                  onChange={(e) => set("clientNotes", e.target.value)}
                  placeholder="Anything the desk should know about this client"
                />
              </Field>
            )}
          </StepCard>

          {canPrice && (
            <StepCard
              id="step-team"
              step={6}
              title="Team"
              description="Who owns the requisition and who is working it. Each gets the job's notifications."
              state={stepState("step-team")}
            >
              <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2">
                <Field label="Recruitment manager" htmlFor="job-manager">
                  <PersonPicker
                    id="job-manager"
                    users={hrUsers}
                    selectedId={data.recruitmentManagerId}
                    selectedName={data.recruitmentManagerName}
                    selectedEmail={data.recruitmentManagerEmail}
                    placeholder="Search for a manager…"
                    onChange={handleManagerSelect}
                  />
                </Field>
                <Field
                  label="Assignees"
                  hint={data.assignedToIds.length ? `${data.assignedToIds.length} assigned` : undefined}
                  htmlFor="job-assignees"
                >
                  <AssigneePicker
                    id="job-assignees"
                    users={hrUsers}
                    selectedIds={data.assignedToIds}
                    selectedNames={data.assignedToNames}
                    selectedEmails={data.assignedToEmails}
                    exclude={data.recruitmentManagerId ? [data.recruitmentManagerId] : []}
                    onToggle={toggleAssignee}
                  />
                </Field>
              </div>
            </StepCard>
          )}

          {mode === "edit" && job && (
            <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3 text-adm-xs">
              <div className="inline-flex items-center gap-1.5">
                <dt className="text-[var(--adm-ink-subtle)]">Created</dt>
                <dd className="tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(job.createdAt)}</dd>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <dt className="text-[var(--adm-ink-subtle)]">Updated</dt>
                <dd className="tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(job.updatedAt)}</dd>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <dt className="text-[var(--adm-ink-subtle)]">Posted by</dt>
                <dd className="text-[var(--adm-ink-mute)]">{job.postedByName || "–"}</dd>
              </div>
            </dl>
          )}
        </form>

        {/* Wide screens: progress, a live summary and the one primary action. */}
        <StepRail
          steps={steps}
          active={activeStep}
          // The main pane is the scroller; keep the rail inside it.
          className="sticky top-0 hidden max-h-[calc(100dvh-56px-64px)] lg:flex"
          summary={
            <dl className="space-y-2 text-adm-xs">
              {summary.map((row) => (
                <div key={row.k} className="flex gap-3">
                  <dt className="w-16 flex-none text-[var(--adm-ink-subtle)]">{row.k}</dt>
                  <dd className={cn("min-w-0 flex-1 truncate", row.v ? "text-[var(--adm-ink)]" : "text-[var(--adm-ink-subtle)]")} title={row.v || undefined}>
                    {row.v || "Not set"}
                  </dd>
                </div>
              ))}
            </dl>
          }
          footer={
            <>
              <WorkspaceButton type="submit" form={formId} variant="primary" disabled={submitting} className="w-full">
                {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSave aria-hidden="true" />}
                {submitting ? (mode === "create" ? "Creating…" : "Saving…") : submitLabel}
              </WorkspaceButton>
              {requiredLeft > 0 && (
                <p className="mt-2 text-center text-adm-xs text-[var(--adm-ink-subtle)]">
                  {requiredLeft} required step{requiredLeft === 1 ? "" : "s"} left
                </p>
              )}
            </>
          }
        />
      </div>

      {/* Narrow screens: the primary action stays in reach at the bottom. */}
      <div className="sticky -bottom-5 z-20 -mx-5 -mb-5 mt-4 flex items-center justify-between gap-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-3 sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:px-6 lg:hidden">
        <p className="min-w-0 text-adm-xs text-[var(--adm-ink-mute)]">
          {requiredLeft > 0
            ? <>{requiredLeft} required step{requiredLeft === 1 ? "" : "s"} left</>
            : <span className="font-medium text-[var(--adm-success-ink)]">Ready to save</span>}
        </p>
        <WorkspaceButton type="submit" form={formId} variant="primary" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSave aria-hidden="true" />}
          {submitting ? (mode === "create" ? "Creating…" : "Saving…") : submitLabel}
        </WorkspaceButton>
      </div>

      {showAddClient && (
        <AddClientModal
          onClose={() => setShowAddClient(false)}
          onAdd={async (clientData) => {
            const client = await onAddClient(clientData);
            setData((prev) => ({ ...prev, clientId: client.id, clientName: client.name }));
            setShowAddClient(false);
          }}
        />
      )}

      {showAddVendor && (
        <AddVendorModal
          leads={hrUsers.filter((u) => u.role === "admin" || u.role === "hr")}
          defaultLeadId={user?.id}
          onClose={() => setShowAddVendor(false)}
          onAdd={async (vendorData) => {
            const vendor = await onAddVendor(vendorData);
            setData((prev) => ({ ...prev, vendorId: vendor.id, vendorName: vendor.name }));
            setShowAddVendor(false);
          }}
        />
      )}

      {showPreview && (
        <PreviewModal data={data} typeLabel={typeLabel} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

// ── Add Client Modal ───────────────────────────────────────────────────────────

function AddClientModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: { name: string; websiteUrl: string; email: string; phone: string }) => Promise<void>;
}) {
  const [form, setForm] = React.useState({ name: "", websiteUrl: "", email: "", phone: "" });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () => collectErrors({
      name: check(form.name, required("Enter the client's company name."), maxLen(LIMITS.name)),
      websiteUrl: check(form.websiteUrl, required("Enter the client's website, like www.acme.com."), website(), maxLen(LIMITS.url)),
      email: check(form.email, email("Enter the client's email, like contact@acme.com."), maxLen(LIMITS.email)),
      phone: check(form.phone, phone()),
    }),
    { name: "client-name", websiteUrl: "client-website", email: "client-email", phone: "client-phone" },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateAll()) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The client could not be added. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={(next) => { if (!next) onClose(); }}
      title="Add new client"
      size="sm"
      busy={submitting}
      footer={
        <>
          <WorkspaceButton onClick={onClose}>Cancel</WorkspaceButton>
          <WorkspaceButton type="submit" form="add-client-form" variant="primary" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}Add client
          </WorkspaceButton>
        </>
      }
    >
      <form id="add-client-form" noValidate onSubmit={handleSubmit} onBlur={revalidate} className="space-y-4">
        <FormErrorBanner message={error} onDismiss={() => setError(null)} />
        <Field label="Client name" required htmlFor="client-name" error={errors.name}>
          <FormInput id="client-name" required {...invalidProps("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
        </Field>
        <Field label="Website URL" required htmlFor="client-website" error={errors.websiteUrl}>
          <FormInput id="client-website" required type="text" inputMode="url" autoComplete="url" {...invalidProps("websiteUrl")} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="www.example.com" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Email" htmlFor="client-email" error={errors.email}>
            <FormInput id="client-email" type="email" {...invalidProps("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
          </Field>
          <Field label="Phone" htmlFor="client-phone" error={errors.phone}>
            <FormInput id="client-phone" type="tel" {...invalidProps("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
          </Field>
        </div>
      </form>
    </AdminDialog>
  );
}

// ── Add Vendor Modal ───────────────────────────────────────────────────────────

function AddVendorModal({
  leads,
  defaultLeadId,
  onClose,
  onAdd,
}: {
  leads: AssigneeUser[];
  defaultLeadId?: string;
  onClose: () => void;
  onAdd: (data: NewVendorInput) => Promise<void>;
}) {
  const [form, setForm] = React.useState({
    name: "", contactPerson: "", email: "",
    vendorLeadId: leads.some((u) => u.id === defaultLeadId) ? defaultLeadId! : "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () => collectErrors({
      name: check(form.name, required("Enter the vendor's company name."), maxLen(LIMITS.name)),
      contactPerson: check(form.contactPerson, maxLen(LIMITS.name)),
      email: check(form.email, email("Enter the vendor's email, like contact@acme.com."), maxLen(LIMITS.email)),
      vendorLeadId: check(form.vendorLeadId, required("Choose who leads this vendor.")),
    }),
    { name: "vendor-name", contactPerson: "vendor-contact", email: "vendor-email", vendorLeadId: "vendor-lead" },
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!validateAll()) return;
    const lead = leads.find((u) => u.id === form.vendorLeadId);
    if (!lead) return;
    setSubmitting(true);
    setError(null);
    try {
      await onAdd({
        name: form.name,
        contactPerson: form.contactPerson,
        email: form.email,
        vendorLeadId: lead.id,
        vendorLeadName: lead.name || lead.email,
        vendorLeadRole: lead.role as "admin" | "hr",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "The vendor could not be added. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminDialog
      open
      onOpenChange={(next) => { if (!next) onClose(); }}
      title="Add new vendor"
      size="sm"
      busy={submitting}
      footer={
        <>
          <WorkspaceButton onClick={onClose}>Cancel</WorkspaceButton>
          <WorkspaceButton type="submit" form="add-vendor-form" variant="primary" disabled={submitting}>
            {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}Add vendor
          </WorkspaceButton>
        </>
      }
    >
      <form id="add-vendor-form" noValidate onSubmit={handleSubmit} onBlur={revalidate} className="space-y-4">
        <FormErrorBanner message={error} onDismiss={() => setError(null)} />
        <Field label="Vendor name" required htmlFor="vendor-name" error={errors.name}>
          <FormInput id="vendor-name" required {...invalidProps("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Staffing" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Contact person" htmlFor="vendor-contact" error={errors.contactPerson}>
            <FormInput id="vendor-contact" {...invalidProps("contactPerson")} value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="Jane Doe" />
          </Field>
          <Field label="Email" htmlFor="vendor-email" error={errors.email}>
            <FormInput id="vendor-email" type="email" {...invalidProps("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
          </Field>
        </div>
        <Field label="Vendor lead" required htmlFor="vendor-lead" error={errors.vendorLeadId}>
          <FormSelect id="vendor-lead" required {...invalidProps("vendorLeadId")} value={form.vendorLeadId} onChange={(e) => setForm({ ...form, vendorLeadId: e.target.value })}>
            <option value="">Select lead</option>
            {leads.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </FormSelect>
        </Field>
      </form>
    </AdminDialog>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

const PREVIEW_PROSE =
  "text-adm-base leading-relaxed text-[var(--adm-ink-mute)] [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

function PreviewModal({ data, typeLabel, onClose }: { data: JobFormData; typeLabel: string; onClose: () => void }) {
  return (
    <AdminDialog
      open
      onOpenChange={(next) => { if (!next) onClose(); }}
      title="Public preview"
      description="How this job appears to candidates"
      size="xl"
      bodyClassName="space-y-4 bg-[var(--adm-surface-sunken)] sm:p-4"
    >
      <div className="rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
        <h1 className="mb-3 text-adm-xl font-semibold leading-8 tracking-[-0.025em] text-[var(--adm-ink)]">{data.title || "–"}</h1>
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-adm-xs text-[var(--adm-ink-mute)]">
          <span className="inline-flex items-center gap-1.5">
            <IconJob className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />{typeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            {jobLocationLabel(data) || "–"}
          </span>
          {data.submissionDueDate && (
            <span className="inline-flex items-center gap-1.5">
              <IconClock className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="tabular-nums">Due {fmtDate(data.submissionDueDate)}</span>
            </span>
          )}
        </div>
        {data.salaryMin && data.salaryMax && (
          <p className="text-adm-md font-semibold tabular-nums text-[var(--adm-ink)]">
            ${Number(data.salaryMin).toLocaleString()} – ${Number(data.salaryMax).toLocaleString()}
            <span className="ml-1 text-adm-xs font-medium text-[var(--adm-ink-mute)]">
              {SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short}
            </span>
          </p>
        )}
      </div>

      {data.description && (
        <div className="rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
          <h2 className="mb-3 text-adm-md font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">About this role</h2>
          <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.description)} />
        </div>
      )}
      {data.responsibilities && (
        <div className="rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
          <h2 className="mb-3 text-adm-md font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Responsibilities</h2>
          <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.responsibilities)} />
        </div>
      )}
      {data.requirements && (
        <div className="rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
          <h2 className="mb-3 text-adm-md font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Requirements</h2>
          <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.requirements)} />
        </div>
      )}

      <div className="rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 text-center">
        <h3 className="text-adm-md font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Ready to apply?</h3>
        <p className="mt-1 text-adm-base text-[var(--adm-ink-mute)]">Join our team and help shape the future of enterprise IT.</p>
        {/* Inert stand-in for the public page's apply button. */}
        <span
          aria-hidden="true"
          className="mt-4 inline-flex h-9 cursor-default items-center rounded-[var(--adm-radius-control)] bg-[var(--adm-accent)] px-5 text-adm-base font-semibold text-white"
        >
          Apply for this position
        </span>
      </div>
    </AdminDialog>
  );
}
