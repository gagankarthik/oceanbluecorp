"use client";

import * as React from "react";
import type { Job, Client, Vendor, SalaryPeriod } from "@/lib/aws/dynamodb";
import { JOB_LIST_HREF, JOB_LIST_LABEL, isPastDeadline, jobCategory, type JobCategory } from "@/lib/job-status";
import { fmtDate } from "@/lib/format";
import { US_STATES, normalizeState, SALARY_PERIODS } from "@/components/admin/theme";
import { jobLocationLabel, workplaceOf, WORKPLACE_LABEL, type Workplace } from "@/lib/workplace";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { renderRichText, renderListField } from "@/lib/rich-text";
import { useAuth, canSeeJobCommercials } from "@/lib/auth";
import { useFormErrors } from "@/hooks/use-form-errors";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  LIMITS, check, collectErrors, htmlText, isBlank, maxLen, nonNegative, pastDateWarning, rangeInverted, required, toNumber,
} from "@/lib/form-validation";
import { JOB_TEXT_LIMITS } from "@/lib/job-input";
import { DEPARTMENTS, JOB_STATUS_COPY, JOB_TYPE_OPTIONS, jobStatusChoices } from "@/lib/job-options";
import { Badge, Button, ConfirmDialog, Drawer, Modal, Page, PageHeader } from "@/components/portal/kit";
import {
  AddClientDialog, AddVendorDialog, Choice, Field, FormBanner, LocationInput, MarginPreview, MoneyInput, NativeSelect,
  PartnerPicker, RangeInput, StaffMultiPicker, StaffPicker, TextArea, TextInput, type NewVendorInput, type StaffPerson,
} from "@/components/portal/fields";
import Icon from "@/components/portal/icons";
import { RequiredProgress, StepCard, StepList, StepRail, jumpToStep, useActiveStep, type StepInfo, type StepState } from "./form-steps";

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
    // A legacy string[] becomes a <ul>; HTML passes through.
    requirements: renderListField(job.requirements).__html,
    responsibilities: renderListField(job.responsibilities).__html,
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
    // Empty editors send undefined so an empty <ul></ul> or stray <br> isn't stored.
    requirements: data.requirements?.trim() ? data.requirements : undefined,
    responsibilities: data.responsibilities?.trim() ? data.responsibilities : undefined,
    // null, not undefined, so clearing the range clears it on the record.
    salary: data.salaryMin && data.salaryMax
      ? { min: toNumber(data.salaryMin), max: toNumber(data.salaryMax), currency: "$", period: data.salaryPeriod }
      : null,
    // Bill and pay rates are hourly; an annual role leaves the stored ones alone.
    clientBillRate: data.salaryPeriod === "hour" && data.clientBillRate ? toNumber(data.clientBillRate) : undefined,
    payRate: data.salaryPeriod === "hour" && data.payRate ? toNumber(data.payRate) : undefined,
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
  /** Shown above the first step, e.g. "Duplicated from …". */
  notice?: React.ReactNode;
}

type OptionalStep = "pay" | "client" | "team";

const SUMMARY_K = "w-20 shrink-0 text-mist-500";

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Three required steps (Role, Location, Description) and three optional ones
 * that fold until they hold something. Status lives in the save area: Publish
 * puts the role on the careers site, and crossing Active either way asks first.
 */
export function JobForm({
  mode, initialData, job, clients, vendors, hrUsers, submitting, serverError, onDismissError, onSubmit, onAddClient, onAddVendor, formId = "job-form", notice,
}: JobFormProps) {
  const { user } = useAuth();
  const seed = initialData || DEFAULT_JOB_FORM;
  const [data, setData] = React.useState<JobFormData>(seed);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showSteps, setShowSteps] = React.useState(false);
  const [changingCategory, setChangingCategory] = React.useState(false);
  const [confirmStatus, setConfirmStatus] = React.useState<Job["status"] | null>(null);
  /** Which save button started the request, for its spinner. */
  const [savingAs, setSavingAs] = React.useState<Job["status"] | null>(null);

  // Media authors postings but never prices them: commercial controls are removed, not disabled.
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
  const baseline = React.useMemo(() => snapshot(seed), [seed]);
  const dirty = snapshot(data) !== baseline;
  useUnsavedChanges(!submitting && dirty);

  const set = <K extends keyof JobFormData>(k: K, v: JobFormData[K]) => setData((prev) => ({ ...prev, [k]: v }));

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

  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(
    () => {
      const descText = htmlText(data.description);
      // The payload only sends a salary when both ends are set, so half a range would be dropped silently.
      const salaryHalf = !isBlank(data.salaryMin) !== !isBlank(data.salaryMax);
      return collectErrors({
        title: check(data.title, required("Enter a job title, like Senior Software Engineer."), maxLen(JOB_TEXT_LIMITS.title)),
        type: data.type ? undefined : "Choose the job type. Remote is now set under Workplace.",
        location: data.workplace === "remote"
          ? check(data.location, maxLen(JOB_TEXT_LIMITS.location))
          : check(data.location, required("Enter the city or location, like Columbus."), maxLen(JOB_TEXT_LIMITS.location)),
        clientNotes: check(data.clientNotes, maxLen(LIMITS.notes)),
        clientBillRate: canPrice ? check(data.clientBillRate, nonNegative("Enter the bill rate as a number, like 75.")) : undefined,
        payRate: canPrice ? check(data.payRate, nonNegative("Enter the pay rate as a number, like 55.")) : undefined,
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
    {
      title: "job-title", type: "job-type", location: "job-location", clientNotes: "job-client-notes",
      clientBillRate: "job-bill-rate", payRate: "job-pay-rate", salaryMin: "job-salary-min",
      salaryMax: "job-salary-max", description: "job-description",
    },
  );

  const deadlineWarning = pastDateWarning(
    data.submissionDueDate,
    "This deadline has already passed. Past-deadline roles close automatically, so pick a later date if it is still taking candidates.",
  );

  const isRemote = data.workplace === "remote";
  const hourly = data.salaryPeriod === "hour";
  // Older records may hold a day, week or month range; keep it until someone picks a basis.
  const legacyPeriod = hourly || data.salaryPeriod === "year" ? null : data.salaryPeriod;
  const periodShort = SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short ?? "";
  const typeLabel = JOB_TYPE_OPTIONS.find((t) => t.value === data.type)?.label || data.type;

  const descText = htmlText(data.description);
  const hasPay = (!isBlank(data.salaryMin) && !isBlank(data.salaryMax)) || (hourly && canPrice && !!(data.clientBillRate || data.payRate));
  const hasClient = !!(data.clientId || data.vendorId || data.submissionDueDate);
  const hasTeam = !!(data.recruitmentManagerId || data.assignedToIds.length);

  // Optional steps fold until they hold something; a step with an error always opens.
  const [openChoice, setOpenChoice] = React.useState<Partial<Record<OptionalStep, boolean>>>({});
  const stepOpen: Record<OptionalStep, boolean> = {
    pay: !!(errors.salaryMin || errors.salaryMax || errors.clientBillRate || errors.payRate) || (openChoice.pay ?? hasPay),
    client: !!errors.clientNotes || (openChoice.client ?? hasClient),
    team: openChoice.team ?? hasTeam,
  };
  const toggle = (k: OptionalStep) => setOpenChoice((p) => ({ ...p, [k]: !stepOpen[k] }));

  const steps: StepInfo[] = [
    { id: "step-role", title: "Role", required: true, state: data.title.trim() && data.type ? "done" : "todo" },
    { id: "step-location", title: "Location", required: !isRemote, state: isRemote || data.location.trim() ? "done" : "todo" },
    { id: "step-description", title: "Description", required: true, state: descText ? "done" : "todo" },
    { id: "step-pay", title: "Compensation", state: hasPay ? "done" : "optional" },
    { id: "step-client", title: canPrice ? "Client and deadline" : "Deadline", state: hasClient ? "done" : "optional" },
    ...(canPrice ? [{ id: "step-team", title: "Team", state: (hasTeam ? "done" : "optional") as StepState }] : []),
  ];
  const stepState = (id: string) => steps.find((s) => s.id === id)!.state;
  const activeStep = useActiveStep(steps.map((s) => s.id));
  const requiredLeft = steps.filter((s) => s.required && s.state !== "done").length;

  const jump = (id: string) => {
    const key = ({ "step-pay": "pay", "step-client": "client", "step-team": "team" } as const)[id as "step-pay"];
    if (key && !stepOpen[key]) setOpenChoice((p) => ({ ...p, [key]: true }));
    setShowSteps(false);
    jumpToStep(id);
  };

  // ── Saving ──
  const initialStatus = seed.status;
  const crossesActive = (to: Job["status"]) => (to === "active") !== (initialStatus === "active");

  const save = (status: Job["status"]) => {
    if (submitting) return;
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
    // Enter in a field: create saves a draft, edit keeps the chosen status.
    save(mode === "create" ? "draft" : data.status);
  };

  const listLabel = JOB_LIST_LABEL[data.category];
  const payLine = !isBlank(data.salaryMin) && !isBlank(data.salaryMax)
    ? `$${toNumber(data.salaryMin).toLocaleString()} – $${toNumber(data.salaryMax).toLocaleString()}${periodShort}`
    : "";
  const summary: { k: string; v: string }[] = [
    { k: "Title", v: data.title.trim() },
    { k: "Type", v: [typeLabel, WORKPLACE_LABEL[data.workplace]].filter(Boolean).join(" · ") },
    { k: "Location", v: jobLocationLabel(data) },
    { k: "Pay", v: payLine },
    { k: "Listed in", v: listLabel },
  ];

  const statusCopy = JOB_STATUS_COPY[data.status] ?? JOB_STATUS_COPY.draft;
  const statusSelect = (idSuffix: string) => (
    <Field label="Status" htmlFor={`job-status-${idSuffix}`} helper={statusCopy.detail}>
      <NativeSelect id={`job-status-${idSuffix}`} value={data.status} onChange={(e) => set("status", e.target.value as Job["status"])}>
        {jobStatusChoices(initialStatus).map((s) => (
          <option key={s} value={s}>
            {JOB_STATUS_COPY[s].label}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );

  const saveButtons = (stack: boolean) =>
    mode === "create" ? (
      <div className={`flex gap-2 ${stack ? "flex-col" : "flex-wrap"}`}>
        <Button icon="globe" loading={submitting && savingAs === "active"} disabled={submitting} onClick={() => save("active")} className={stack ? "w-full" : ""}>
          Publish
        </Button>
        <Button variant="secondary" loading={submitting && savingAs !== "active"} disabled={submitting} onClick={() => save("draft")} className={stack ? "w-full" : ""}>
          Save as draft
        </Button>
      </div>
    ) : (
      <Button icon="check" loading={submitting} onClick={() => save(data.status)} className={stack ? "w-full" : ""}>
        Save changes
      </Button>
    );

  const crossing = confirmStatus !== null;
  const toActive = confirmStatus === "active";

  return (
    <Page width="narrow">
      <PageHeader
        back={{ href: mode === "edit" && job ? `/portal/jobs/${job.id}${data.category === "open" ? "?category=open" : ""}` : JOB_LIST_HREF[data.category], label: mode === "edit" ? "Job" : listLabel }}
        title={`${mode === "create" ? "New" : "Edit"} ${data.category === "open" ? "open" : "state"} role`}
        description={mode === "create" ? "Three required steps; add the rest when you have them." : job?.title || undefined}
        meta={mode === "edit" && job?.postingId ? <span className="rounded-md bg-mist-100 px-2 py-0.5 font-mono text-[12px] text-mist-700">{job.postingId}</span> : undefined}
        actions={
          <Button variant="secondary" icon="eye" onClick={() => setShowPreview(true)}>
            Preview
          </Button>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17.5rem]">
        <form id={formId} noValidate onSubmit={handleFormSubmit} onBlur={revalidate} className="grid min-w-0 gap-6">
          <FormBanner message={serverError} onDismiss={onDismissError} />
          {notice && (
            <p className="flex items-start gap-2.5 rounded-xl bg-ocean-50 px-4 py-3 text-[14px] text-navy-900 ring-1 ring-inset ring-ocean-200">
              <Icon name="copy" className="mt-0.5 size-4 shrink-0 text-ocean-700" />
              <span className="min-w-0">{notice}</span>
            </p>
          )}

          <StepCard id="step-role" step={1} title="Role" description="What the job is called and how it is worked." state={stepState("step-role")} required>
            <div className="grid gap-5">
              <p className="flex flex-wrap items-center gap-2 text-[13px] text-mist-600">
                Listed under <Badge tone="blue">{listLabel}</Badge>
                <button type="button" onClick={() => setChangingCategory((v) => !v)} aria-expanded={changingCategory} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
                  {changingCategory ? "Done" : "Change"}
                </button>
              </p>
              {changingCategory && (
                <Choice label="Listed under" value={data.category} options={JOB_CATEGORIES} onChange={(c) => set("category", c)} className="sm:max-w-xs" />
              )}
              <Field label="Job title" required htmlFor="job-title" error={errors.title}>
                <TextInput
                  id="job-title"
                  {...invalidProps("title")}
                  maxLength={JOB_TEXT_LIMITS.title}
                  value={data.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Senior Software Engineer"
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Department" required htmlFor="job-department">
                  <NativeSelect id="job-department" value={data.department} onChange={(e) => set("department", e.target.value)}>
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                    {data.department && !DEPARTMENTS.includes(data.department) && <option value={data.department}>{data.department}</option>}
                  </NativeSelect>
                </Field>
                <Field label="Job type" required htmlFor="job-type" error={errors.type}>
                  <NativeSelect id="job-type" {...invalidProps("type")} value={data.type} onChange={(e) => set("type", e.target.value as Job["type"])}>
                    {!data.type && <option value="">Select job type…</option>}
                    {JOB_TYPE_OPTIONS.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </NativeSelect>
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
            required={!isRemote}
          >
            <LocationInput
              workplace
              cityRequired
              value={{ city: data.location, state: data.state, workplace: data.workplace }}
              onChange={(p) =>
                setData((prev) => ({
                  ...prev,
                  ...(p.city !== undefined && { location: p.city }),
                  ...(p.state !== undefined && { state: p.state }),
                  ...(p.workplace !== undefined && { workplace: p.workplace }),
                }))
              }
              ids={{ city: "job-location", state: "job-state", workplace: "job-workplace" }}
              errors={{ city: errors.location }}
              invalidProps={(k) => (k === "city" ? invalidProps("location") : {})}
              limits={{ city: JOB_TEXT_LIMITS.location }}
            />
          </StepCard>

          <StepCard
            id="step-description"
            step={3}
            title="Description"
            description="What candidates read: the role, then requirements and responsibilities."
            state={stepState("step-description")}
            required
          >
            <div className="grid gap-5">
              <Field label="Description" required labelId="job-description-label" htmlFor="job-description" error={errors.description}>
                <RichTextEditor
                  id="job-description"
                  labelledBy="job-description-label"
                  required
                  invalid={!!errors.description}
                  className={errors.description ? "border-[#f04438]" : undefined}
                  value={data.description}
                  onChange={(html) => set("description", html)}
                  placeholder="Describe the role, the team, and what makes it worth applying for…"
                />
              </Field>
              <Field label="Requirements" optional labelId="job-requirements-label" helper="Use the list button for bullet points.">
                <RichTextEditor
                  id="job-requirements"
                  labelledBy="job-requirements-label"
                  value={data.requirements}
                  onChange={(html) => set("requirements", html)}
                  placeholder="Bachelor's degree in Computer Science; 5+ years of experience; React and Node.js…"
                />
              </Field>
              <Field label="Responsibilities" optional labelId="job-responsibilities-label" helper="Use the list button for bullet points.">
                <RichTextEditor
                  id="job-responsibilities"
                  labelledBy="job-responsibilities-label"
                  value={data.responsibilities}
                  onChange={(html) => set("responsibilities", html)}
                  placeholder="Design and build new features; work with cross-functional teams; review code…"
                />
              </Field>
            </div>
          </StepCard>

          <StepCard
            id="step-pay"
            step={4}
            title="Compensation"
            description={hourly
              ? canPrice ? "Bill and pay rates, and the hourly range candidates see." : "The hourly range candidates see."
              : "The yearly salary range candidates see. Leave blank if not disclosed."}
            state={stepState("step-pay")}
            open={stepOpen.pay}
            onToggle={() => toggle("pay")}
          >
            <div className="grid gap-5">
              <Field label="Pay basis">
                <Choice
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
              {/* Rates are the placement margin (commercial); the range is public. */}
              {hourly && canPrice && (
                <div className="grid gap-4">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field label="Bill rate" htmlFor="job-bill-rate" error={errors.clientBillRate}>
                      <MoneyInput id="job-bill-rate" suffix="/hr" {...invalidProps("clientBillRate")} value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
                    </Field>
                    <Field label="Pay rate" htmlFor="job-pay-rate" error={errors.payRate}>
                      <MoneyInput id="job-pay-rate" suffix="/hr" {...invalidProps("payRate")} value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
                    </Field>
                  </div>
                  <MarginPreview bill={data.clientBillRate} pay={data.payRate} />
                </div>
              )}
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
            </div>
          </StepCard>

          <StepCard
            id="step-client"
            step={5}
            title={canPrice ? "Client and deadline" : "Deadline"}
            description={canPrice ? "Who the role is for, and when submissions close." : "When submissions close."}
            state={stepState("step-client")}
            open={stepOpen.client}
            onToggle={() => toggle("client")}
          >
            <div className="grid gap-5">
              <div className={`grid gap-5 ${canPrice ? "sm:grid-cols-2" : ""}`}>
                {canPrice && (
                  <Field label="Client" htmlFor="job-client">
                    <PartnerPicker<Client>
                      id="job-client"
                      kind="client"
                      items={clients}
                      value={data.clientId}
                      noneLabel="No client"
                      onChange={(id, c) =>
                        setData((prev) => (id ? { ...prev, clientId: id, clientName: c?.name || prev.clientName } : { ...prev, clientId: "", clientName: "", clientNotes: "" }))
                      }
                      renderCreate={(close, done) => <AddClientDialog onClose={close} onAdd={async (d) => { const c = await onAddClient(d); done(c); return c; }} />}
                    />
                  </Field>
                )}
                {canPrice && (
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
                )}
                <Field label="Submission deadline" htmlFor="job-deadline" warning={deadlineWarning} className={canPrice ? "sm:col-span-2 sm:max-w-[calc(50%-0.625rem)]" : "sm:max-w-xs"}>
                  <TextInput id="job-deadline" type="date" className="tabular-nums" value={data.submissionDueDate} onChange={(e) => set("submissionDueDate", e.target.value)} />
                </Field>
              </div>
              {canPrice && data.clientId && (
                <Field
                  label="Client notes"
                  htmlFor="job-client-notes"
                  error={errors.clientNotes}
                  hint={data.clientNotes.length > LIMITS.notes * 0.8 ? `${data.clientNotes.length.toLocaleString()} / ${LIMITS.notes.toLocaleString()}` : undefined}
                  helper="Visible to staff only."
                >
                  <TextArea
                    id="job-client-notes"
                    rows={3}
                    {...invalidProps("clientNotes")}
                    value={data.clientNotes}
                    onChange={(e) => set("clientNotes", e.target.value)}
                    placeholder="Anything the desk should know about this client"
                  />
                </Field>
              )}
            </div>
          </StepCard>

          {canPrice && (
            <StepCard
              id="step-team"
              step={6}
              title="Team"
              description="Who owns the requisition and who works it. Each gets the job's notifications."
              state={stepState("step-team")}
              open={stepOpen.team}
              onToggle={() => toggle("team")}
            >
              <div className="grid gap-5 sm:grid-cols-2">
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
                <Field label="Assignees" hint={data.assignedToIds.length ? `${data.assignedToIds.length} assigned` : undefined}>
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
            </StepCard>
          )}

          {mode === "edit" && job && (
            <dl className="flex flex-wrap gap-x-6 gap-y-1.5 rounded-xl bg-mist-50 px-5 py-3 text-[13px] ring-1 ring-inset ring-mist-200">
              {[
                ["Created", fmtDate(job.createdAt)],
                ["Updated", fmtDate(job.updatedAt)],
                ["Posted by", job.postedByName || "–"],
              ].map(([k, v]) => (
                <div key={k} className="flex gap-1.5">
                  <dt className="text-mist-500">{k}</dt>
                  <dd className="tabular-nums text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* Narrow screens: steps, status and the save actions stay in reach. */}
          <div className="sticky bottom-0 z-20 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-2 lg:hidden">
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-mist-0/95 px-3 py-3 shadow-[0_-4px_24px_rgba(16,24,40,0.08)] ring-1 ring-mist-200 backdrop-blur">
              <Button variant="ghost" icon="layers" onClick={() => setShowSteps(true)} className="shrink-0">
                Steps
              </Button>
              <p className="min-w-0 flex-1 truncate text-[13px] text-mist-600">
                {requiredLeft > 0 ? `${requiredLeft} required step${requiredLeft === 1 ? "" : "s"} left` : <span className="font-medium text-[#067647]">Ready to save</span>}
                {mode === "edit" && <span className="block truncate">Status: {statusCopy.label}</span>}
              </p>
              <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1">{saveButtons(false)}</div>
            </div>
          </div>
        </form>

        {/* Wide screens: progress, the steps, a live summary and the save actions. */}
        <StepRail
          steps={steps}
          active={activeStep}
          onJump={jump}
          className="sticky top-[5.5rem] hidden max-h-[calc(100svh-7rem)] lg:flex"
          summary={
            <dl className="grid gap-2 text-[13px]">
              {summary.map((row) => (
                <div key={row.k} className="flex gap-3">
                  <dt className={SUMMARY_K}>{row.k}</dt>
                  <dd className={`min-w-0 flex-1 truncate ${row.v ? "text-navy-900" : "text-mist-400"}`} title={row.v || undefined}>
                    {row.v || "Not set"}
                  </dd>
                </div>
              ))}
            </dl>
          }
          footer={
            <div className="grid gap-3">
              {mode === "edit" && statusSelect("rail")}
              {saveButtons(true)}
              <p className="text-center text-[12px] text-mist-600">
                {requiredLeft > 0
                  ? `${requiredLeft} required step${requiredLeft === 1 ? "" : "s"} left`
                  : mode === "create"
                    ? "Publish puts it on the careers site."
                    : statusCopy.public ? "Live on the careers site." : "Not on the careers site."}
              </p>
            </div>
          }
        />
      </div>

      {showSteps && (
        <Drawer title="Steps" onClose={() => setShowSteps(false)}>
          <div className="grid gap-5">
            <RequiredProgress steps={steps} />
            <StepList steps={steps} active={activeStep} onJump={jump} />
            {mode === "edit" && <div className="border-t border-mist-200 pt-5">{statusSelect("sheet")}</div>}
          </div>
        </Drawer>
      )}

      {crossing && (
        <ConfirmDialog
          tone="primary"
          title={toActive ? "Publish this role?" : "Take this role off the careers site?"}
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

      {showPreview && <PreviewModal data={data} typeLabel={typeLabel} onClose={() => setShowPreview(false)} />}
    </Page>
  );
}

// ── Preview ────────────────────────────────────────────────────────────────────

const PREVIEW_PROSE =
  "text-[14px] leading-relaxed text-mist-700 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p+p]:mt-3 [&_strong]:font-semibold [&_strong]:text-navy-900 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

function PreviewModal({ data, typeLabel, onClose }: { data: JobFormData; typeLabel: string; onClose: () => void }) {
  const sections = [
    { title: "About this role", html: data.description },
    { title: "Responsibilities", html: data.responsibilities },
    { title: "Requirements", html: data.requirements },
  ].filter((s) => htmlText(s.html));
  const stateName = US_STATES.find((s) => s.code === data.state)?.name;
  return (
    <Modal title="Public preview" description="How this posting reads on the careers site" size="xl" onClose={onClose}>
      <div className="grid gap-4">
        <div className="rounded-xl p-5 ring-1 ring-mist-200">
          <h3 className="text-[22px] font-semibold leading-tight text-navy-900">{data.title || "Untitled role"}</h3>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-mist-600">
            <span>{typeLabel}</span>
            <span>{jobLocationLabel(data) || stateName || "Location not set"}</span>
            {data.submissionDueDate && <span className="tabular-nums">Apply by {fmtDate(data.submissionDueDate)}</span>}
          </p>
          {data.salaryMin && data.salaryMax && (
            <p className="mt-3 text-[16px] font-semibold tabular-nums text-navy-900">
              ${toNumber(data.salaryMin).toLocaleString()} – ${toNumber(data.salaryMax).toLocaleString()}
              <span className="ml-1 text-[13px] font-medium text-mist-600">{SALARY_PERIODS.find((p) => p.value === data.salaryPeriod)?.short}</span>
            </p>
          )}
        </div>
        {sections.length === 0 ? (
          <p className="rounded-xl bg-mist-50 px-5 py-8 text-center text-[14px] text-mist-600">Write a description to see it here.</p>
        ) : (
          sections.map((s) => (
            <section key={s.title} className="rounded-xl p-5 ring-1 ring-mist-200">
              <h4 className="mb-2 text-[16px] font-semibold text-navy-900">{s.title}</h4>
              <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(s.html)} />
            </section>
          ))
        )}
      </div>
    </Modal>
  );
}
