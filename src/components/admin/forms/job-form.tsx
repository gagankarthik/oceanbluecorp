"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { IconBuilding, IconCalendar, IconClock, IconEye, IconFile, IconHash, IconJob, IconLocation, IconMoney, IconSave, IconTruck, IconUserCheck } from "../icons";
import type { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { US_STATES, normalizeState } from "@/components/admin/theme";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { Field, FormInput, MoneyInput, FormSelect, AssigneePicker, AssigneeUser } from "./primitives";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { renderRichText, renderListField } from "@/lib/rich-text";
import { useAuth, canSeeJobCommercials } from "@/lib/auth";
import { useFormErrors } from "@/hooks/use-form-errors";
import {
  LIMITS, check, collectErrors, email, htmlText, isBlank, maxLen, nonNegative, pastDateWarning,
  payOverBillWarning, phone, rangeInverted, required, url,
} from "@/lib/form-validation";
import { FieldError, FieldWarning, FormErrorBanner } from "./form-alert";

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
  { value: "remote",          label: "Remote" },
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
  department: string;
  type: Job["type"];
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
  title: "", status: "draft", department: DEPARTMENTS[0], type: "full-time",
  location: "", state: "", clientId: "", clientName: "", clientNotes: "",
  vendorId: "", vendorName: "", submissionDueDate: "",
  clientBillRate: "", payRate: "", salaryMin: "", salaryMax: "",
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
    department: job.department || DEPARTMENTS[0],
    type: job.type || "full-time",
    location: job.location || "",
    // Legacy records store the full name ("California"); the canonical stored
    // value is now the 2-letter code, so coerce on read or the picker blanks.
    // A legacy `state: "Remote"` normalises to "". Remote is a job *type*.
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
    department: data.department,
    location: data.location,
    state: data.state || undefined,
    type: data.type,
    description: data.description,
    // Rich HTML now (server sanitizes on save). Empty editors send undefined so
    // an empty <ul></ul> or stray <br> isn't stored.
    requirements: data.requirements?.trim() ? data.requirements : undefined,
    responsibilities: data.responsibilities?.trim() ? data.responsibilities : undefined,
    salary: data.salaryMin && data.salaryMax
      ? { min: parseInt(data.salaryMin), max: parseInt(data.salaryMax), currency: "$" }
      : undefined,
    clientBillRate: data.clientBillRate ? parseFloat(data.clientBillRate) : undefined,
    payRate: data.payRate ? parseFloat(data.payRate) : undefined,
    status: data.status,
    submissionDueDate: data.submissionDueDate || undefined,
    clientId: data.clientId || undefined,
    clientName: data.clientName || undefined,
    clientNotes: data.clientNotes || undefined,
    vendorId: data.vendorId || undefined,
    vendorName: data.vendorName || undefined,
    recruitmentManagerId: data.recruitmentManagerId || undefined,
    recruitmentManagerName: data.recruitmentManagerName || undefined,
    recruitmentManagerEmail: data.recruitmentManagerEmail || undefined,
    assignedToIds: data.assignedToIds.length ? data.assignedToIds : undefined,
    assignedToNames: data.assignedToNames.length ? data.assignedToNames : undefined,
    assignedToEmails: data.assignedToEmails.length ? data.assignedToEmails : undefined,
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
  formId?: string;
}

/** Lead-in line for a panel. */
function PanelNote({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{children}</p>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function JobForm({
  mode, initialData, job, clients, vendors, hrUsers, submitting, serverError, onDismissError, onSubmit, onAddClient, formId = "job-form",
}: JobFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [data, setData] = React.useState<JobFormData>(initialData || DEFAULT_JOB_FORM);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showAddClient, setShowAddClient] = React.useState(false);

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
    if (vendorId === "none" || !vendorId) { set("vendorId", ""); set("vendorName", ""); return; }
    const vendor = vendors.find((v) => v.id === vendorId);
    set("vendorId", vendorId);
    set("vendorName", vendor?.name || "");
  };

  const handleManagerSelect = (userId: string) => {
    if (!userId) { set("recruitmentManagerId", ""); set("recruitmentManagerName", ""); set("recruitmentManagerEmail", ""); return; }
    const u = hrUsers.find((u) => u.id === userId);
    set("recruitmentManagerId", userId);
    set("recruitmentManagerName", u?.name || u?.email || "");
    set("recruitmentManagerEmail", u?.email || "");
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
        location: check(data.location, required("Enter the city or location, like Columbus."), maxLen(LIMITS.title)),
        clientNotes: check(data.clientNotes, maxLen(LIMITS.notes)),
        clientBillRate: canPrice ? check(data.clientBillRate, nonNegative("Enter the bill rate as a number, like 75.")) : undefined,
        payRate: canPrice ? check(data.payRate, nonNegative("Enter the pay rate as a number, like 55.")) : undefined,
        salaryMin:
          check(data.salaryMin, nonNegative("Enter the minimum salary as a number, like 80000.")) ??
          (salaryHalf && isBlank(data.salaryMin) ? "Add a minimum salary too, or clear the maximum." : undefined),
        salaryMax:
          check(data.salaryMax, nonNegative("Enter the maximum salary as a number, like 120000.")) ??
          (salaryHalf && isBlank(data.salaryMax) ? "Add a maximum salary too, or clear the minimum." : undefined) ??
          (rangeInverted(data.salaryMin, data.salaryMax) ? "The maximum salary is lower than the minimum." : undefined),
        description: !descText
          ? "Describe the role so candidates know what they are applying for."
          : check(descText, maxLen(LIMITS.description)),
      });
    },
    {
      title: "job-title", location: "job-location", clientNotes: "job-client-notes",
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
    "on-hold": "text-[var(--adm-warning-ink)]", paused: "text-[var(--adm-warning-ink)]", closed: "text-[var(--adm-danger-ink)]",
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === data.type)?.label || data.type;

  return (
    <>
      {/* Back leads the page, as on every record screen, instead of competing with Save. */}
      <button
        type="button"
        onClick={() => router.back()}
        className="-ml-1 mb-2 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" /> Back
      </button>

      {/* Owned by the form, which knows the mode, posting id and submit state. */}
      <PageHeader
        className="mb-5"
        title={mode === "create" ? "New job posting" : "Edit job posting"}
        info={mode === "create" ? "Fill in the details to create a new job listing." : undefined}
        subtitle={mode === "create" ? undefined : `Editing ${job?.title || "–"}`}
        meta={mode === "edit" && job?.postingId ? (
          <span className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-surface-2)] px-2 py-0.5 font-mono text-[12px] font-medium text-[var(--adm-ink-mute)]">
            <IconHash className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
            {job.postingId}
          </span>
        ) : undefined}
        actions={
          <>
            <WorkspaceButton type="button" onClick={() => setShowPreview(true)}>
              <IconEye aria-hidden="true" />Preview
            </WorkspaceButton>
            {/* The primary sits in the header and reaches the form below through form=. */}
            <WorkspaceButton type="submit" form={formId} variant="primary" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSave aria-hidden="true" />}
              {mode === "create" ? "Create job" : "Save changes"}
            </WorkspaceButton>
          </>
        }
      />

      {/* @container: field grids size off the form column, not the window, which
          sits inside a pane already narrowed by the sidebar. */}
      <form id={formId} noValidate onSubmit={handleSubmit} onBlur={revalidate} className="@container mx-auto max-w-5xl space-y-4 lg:space-y-5">
        <FormErrorBanner message={serverError} onDismiss={onDismissError} />
        <AdminCard>
          <AdminCardHeader icon={IconJob} title="Job details" />
          <div className="p-4">
            <PanelNote>The role title, category, and where it&rsquo;s based.</PanelNote>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-3">
                <div className="@2xl:col-span-2">
                  <Field label="Job title" required htmlFor="job-title" error={errors.title}>
                    <FormInput
                      id="job-title"
                      required
                      {...invalidProps("title")}
                      value={data.title}
                      onChange={(e) => set("title", e.target.value)}
                      placeholder="e.g. Senior Software Engineer"
                    />
                  </Field>
                </div>
                <Field label="Status" htmlFor="job-status">
                  <FormSelect
                    id="job-status"
                    value={data.status}
                    onChange={(e) => set("status", e.target.value as Job["status"])}
                    className={statusColor[data.status]}
                  >
                    {JOB_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </FormSelect>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @3xl:grid-cols-4">
                <Field label="Department" required htmlFor="job-department">
                  <FormSelect id="job-department" required value={data.department} onChange={(e) => set("department", e.target.value)}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Job type" required htmlFor="job-type">
                  <FormSelect id="job-type" required value={data.type} onChange={(e) => set("type", e.target.value as Job["type"])}>
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FormSelect>
                </Field>
                <Field label="City or location" required htmlFor="job-location" error={errors.location}>
                  <FormInput id="job-location" required {...invalidProps("location")} value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Columbus" />
                </Field>
                <Field label="State" htmlFor="job-state">
                  {/* Stores the 2-letter code, shared with Applications and the bench. */}
                  <FormSelect id="job-state" value={data.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </FormSelect>
                </Field>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Three cards for a recruiter, one for media: the deadline is public and
            stays, client and vendor are commercial and go. */}
        <div className={cn("grid grid-cols-1 gap-4", canPrice && "@2xl:grid-cols-3")}>
          {canPrice && (
          <AdminCard>
            <AdminCardHeader icon={IconBuilding} title="Client" />
            <div className="space-y-2 p-4">
              <FormSelect aria-label="Client" value={data.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                <option value="">Select client</option>
                <option value="add-new">+ Add new client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FormSelect>
              {data.clientId && data.clientId !== "add-new" && (
                <>
                  <FormInput
                    id="job-client-notes"
                    aria-label="Client notes"
                    {...invalidProps("clientNotes")}
                    value={data.clientNotes}
                    onChange={(e) => set("clientNotes", e.target.value)}
                    placeholder="Client notes…"
                  />
                  <FieldError id="job-client-notes-error">{errors.clientNotes}</FieldError>
                </>
              )}
            </div>
          </AdminCard>
          )}

          {canPrice && (
          <AdminCard>
            <AdminCardHeader icon={IconTruck} title="Vendor" />
            <div className="p-4">
              <FormSelect aria-label="Vendor" value={data.vendorId || "none"} onChange={(e) => handleVendorSelect(e.target.value)}>
                <option value="none">No vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </FormSelect>
            </div>
          </AdminCard>
          )}

          <AdminCard>
            <AdminCardHeader icon={IconCalendar} title="Submission deadline" />
            <div className="p-4">
              <FormInput
                id="job-deadline"
                aria-label="Submission deadline"
                type="date"
                value={data.submissionDueDate}
                onChange={(e) => set("submissionDueDate", e.target.value)}
              />
              <FieldWarning>{deadlineWarning}</FieldWarning>
            </div>
          </AdminCard>
        </div>

        <AdminCard>
          <AdminCardHeader icon={IconMoney} title="Compensation" />
          <div className="p-4">
            <PanelNote>
              {canPrice
                ? "Optional rate and salary details. Leave blank if not applicable."
                : "The salary range candidates see on the posting. Leave blank if not disclosed."}
            </PanelNote>
            {/* Bill and pay rate are the placement margin; the salary range is
                public. Different audiences, so only the first pair is gated. */}
            <div className={cn("grid grid-cols-1 gap-4 @xl:grid-cols-2", canPrice && "@3xl:grid-cols-4")}>
              {canPrice && (
              <Field label="Bill rate ($/hr)" htmlFor="job-bill-rate" error={errors.clientBillRate}>
                <MoneyInput id="job-bill-rate" {...invalidProps("clientBillRate")} value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
              </Field>
              )}
              {canPrice && (
              <Field label="Pay rate ($/hr)" htmlFor="job-pay-rate" error={errors.payRate}>
                <MoneyInput id="job-pay-rate" {...invalidProps("payRate")} value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
                {!errors.payRate && <FieldWarning>{payWarning}</FieldWarning>}
              </Field>
              )}
              <Field label="Min salary (annual)" htmlFor="job-salary-min" error={errors.salaryMin}>
                <MoneyInput id="job-salary-min" {...invalidProps("salaryMin")} value={data.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="80,000" />
              </Field>
              <Field label="Max salary (annual)" htmlFor="job-salary-max" error={errors.salaryMax}>
                <MoneyInput id="job-salary-max" {...invalidProps("salaryMax")} value={data.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="120,000" />
              </Field>
            </div>
          </div>
        </AdminCard>

        {canPrice && (
        <AdminCard>
          <AdminCardHeader icon={IconUserCheck} title="Team assignments" count={data.assignedToIds.length} />
          <div className="p-4">
            <PanelNote>Assign team members to receive notifications for this job posting.</PanelNote>
            <div className="grid grid-cols-1 gap-4 @xl:grid-cols-2">
              <Field label="Recruitment manager" htmlFor="job-manager">
                <FormSelect id="job-manager" value={data.recruitmentManagerId} onChange={(e) => handleManagerSelect(e.target.value)}>
                  <option value="">Select manager</option>
                  {hrUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                  ))}
                </FormSelect>
              </Field>
              <Field label="Additional assignees">
                <AssigneePicker
                  users={hrUsers}
                  selectedIds={data.assignedToIds}
                  selectedNames={data.assignedToNames}
                  selectedEmails={data.assignedToEmails}
                  onToggle={toggleAssignee}
                />
              </Field>
            </div>
          </div>
        </AdminCard>
        )}

        <AdminCard>
          <AdminCardHeader icon={IconFile} title="Job description" />
          <div className="p-4">
            <PanelNote>
              What candidates see. Describe the role, then list requirements and responsibilities.
            </PanelNote>
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
          </div>
        </AdminCard>

        {mode === "edit" && job && (
          <dl className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3 text-[13px]">
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

      {showPreview && (
        <PreviewModal data={data} typeLabel={typeLabel} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

// ── Modal chrome ───────────────────────────────────────────────────────────────

function ModalClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Close"
      className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
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
      websiteUrl: check(form.websiteUrl, required("Enter the client's website, like https://acme.com."), url(), maxLen(LIMITS.url)),
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
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[var(--adm-scrim)] p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-client-title"
    >
      <div
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-md flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
          <h2 id="add-client-title" className="min-w-0 truncate text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
            Add new client
          </h2>
          <ModalClose onClose={onClose} />
        </div>
        <form noValidate onSubmit={handleSubmit} onBlur={revalidate} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          <FormErrorBanner message={error} onDismiss={() => setError(null)} />
          <Field label="Client name" required htmlFor="client-name" error={errors.name}>
            <FormInput id="client-name" required {...invalidProps("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
          </Field>
          <Field label="Website URL" required htmlFor="client-website" error={errors.websiteUrl}>
            <FormInput id="client-website" required type="url" {...invalidProps("websiteUrl")} value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="client-email" error={errors.email}>
              <FormInput id="client-email" type="email" {...invalidProps("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
            </Field>
            <Field label="Phone" htmlFor="client-phone" error={errors.phone}>
              <FormInput id="client-phone" type="tel" {...invalidProps("phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <WorkspaceButton variant="ghost" onClick={onClose}>Cancel</WorkspaceButton>
            <WorkspaceButton type="submit" variant="primary" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" aria-hidden="true" />}Add client
            </WorkspaceButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

const PREVIEW_PROSE =
  "text-[14px] leading-relaxed text-[var(--adm-ink-mute)] [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5";

function PreviewModal({ data, typeLabel, onClose }: { data: JobFormData; typeLabel: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-[var(--adm-scrim)] px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-preview-title"
    >
      <div
        className="my-auto w-full max-w-4xl overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] shadow-[var(--adm-shadow-lg)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
          <div className="min-w-0">
            <h2 id="job-preview-title" className="truncate text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Public preview</h2>
            <p className="truncate text-[13px] text-[var(--adm-ink-mute)]">How this job appears to candidates</p>
          </div>
          <ModalClose onClose={onClose} />
        </div>

        <div className="space-y-4 p-4">
          <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            <h1 className="mb-3 text-[24px] font-semibold leading-8 tracking-[-0.025em] text-[var(--adm-ink)]">{data.title || "–"}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-[var(--adm-ink-mute)]">
              <span className="inline-flex items-center gap-1.5">
                <IconJob className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />{typeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                {data.location || "–"}{data.state ? `, ${data.state}` : ""}
              </span>
              {data.submissionDueDate && (
                <span className="inline-flex items-center gap-1.5">
                  <IconClock className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <span className="tabular-nums">Due {fmtDate(data.submissionDueDate)}</span>
                </span>
              )}
            </div>
            {data.salaryMin && data.salaryMax && (
              <p className="text-[18px] font-semibold tabular-nums text-[var(--adm-ink)]">
                ${parseInt(data.salaryMin).toLocaleString()} – ${parseInt(data.salaryMax).toLocaleString()}
              </p>
            )}
          </div>

          {data.description && (
            <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">About this role</h2>
              <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.description)} />
            </div>
          )}
          {data.responsibilities && (
            <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Responsibilities</h2>
              <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.responsibilities)} />
            </div>
          )}
          {data.requirements && (
            <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <h2 className="mb-3 text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Requirements</h2>
              <div className={PREVIEW_PROSE} dangerouslySetInnerHTML={renderRichText(data.requirements)} />
            </div>
          )}

          <div className="rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 text-center">
            <h3 className="text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Ready to apply?</h3>
            <p className="mt-1 text-[14px] text-[var(--adm-ink-mute)]">Join our team and help shape the future of enterprise IT.</p>
            {/* Inert stand-in for the public page's apply button. */}
            <span
              aria-hidden="true"
              className="mt-4 inline-flex h-9 cursor-default items-center rounded-[10px] bg-[var(--adm-accent)] px-5 text-[13.5px] font-semibold text-white"
            >
              Apply for this position
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
