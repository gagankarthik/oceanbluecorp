"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, DollarSign, Calendar, Building2, UserCheck,
  X, Briefcase, FileText, Truck, Save, Eye, Hash, Clock, MapPin,
} from "lucide-react";
import type { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { US_STATES, normalizeState } from "@/components/admin/theme";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { Field, FormInput, MoneyInput, FormSelect, AssigneePicker, AssigneeUser } from "./primitives";
import { RichTextEditor } from "@/components/admin/rich-text-editor";
import { renderRichText, renderListField } from "@/lib/rich-text";

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEPARTMENTS = [
  "ERP Solutions","Cloud Services","Data & AI","Salesforce","Engineering",
  "Information and Computers","Training","PMO","Operations",
];

export const JOB_TYPES: { value: Job["type"]; label: string }[] = [
  { value: "full-time",       label: "Full-time" },
  { value: "part-time",       label: "Part-time" },
  { value: "contract",        label: "Contract" },
  { value: "contract-to-hire",label: "Contract-to-Hire" },
  { value: "direct-hire",     label: "Direct Hire" },
  { value: "managed-teams",   label: "Managed Teams" },
  { value: "remote",          label: "Remote" },
];

export const JOB_STATUSES: { value: Job["status"]; label: string }[] = [
  { value: "draft",    label: "Draft" },
  { value: "open",     label: "Open" },
  { value: "active",   label: "Active" },
  { value: "on-hold",  label: "On Hold" },
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
    // A legacy `state: "Remote"` normalises to "" — Remote is a job *type*.
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
    // Seed the rich editor with HTML — a legacy string[] becomes a <ul>, HTML
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
  onSubmit: (data: JobFormData) => void;
  onAddClient: (clientData: { name: string; websiteUrl: string; email: string; phone: string }) => Promise<Client>;
  formId?: string;
}

/** Lead-in line for a panel — replaces FormSection's header `description`. */
function PanelNote({ children }: { children: React.ReactNode }) {
  return <p className="mb-4 text-[13px] leading-relaxed text-[var(--adm-ink-subtle)]">{children}</p>;
}

// ── Component ──────────────────────────────────────────────────────────────────

export function JobForm({
  mode, initialData, job, clients, vendors, hrUsers, submitting, onSubmit, onAddClient, formId = "job-form",
}: JobFormProps) {
  const router = useRouter();
  const [data, setData] = React.useState<JobFormData>(initialData || DEFAULT_JOB_FORM);
  const [showPreview, setShowPreview] = React.useState(false);
  const [showAddClient, setShowAddClient] = React.useState(false);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(data);
  };

  const statusColor: Record<string, string> = {
    draft: "text-[var(--adm-ink-mute)]", open: "text-[var(--adm-success)]", active: "text-[var(--adm-accent)]",
    "on-hold": "text-[var(--adm-warning)]", paused: "text-[var(--adm-warning)]", closed: "text-[var(--adm-danger)]",
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === data.type)?.label || data.type;

  return (
    <>
      {/* Back leads the page, ahead of the title — the same position it holds
          on every record screen, rather than sitting in the action cluster on
          the far right where it competed with Save for the eye. */}
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* ── Header band ──
          Owned here rather than by /admin/jobs/new and /admin/jobs/[id]/edit:
          the form is the thing that knows the mode, the posting id and the
          submit state, and two pages rendering their own PageHeader on top of
          this one would duplicate the title and the toolbar. */}
      <PageHeader
        title={mode === "create" ? "Create Job Posting" : "Edit Job Posting"}
        subtitle={
          mode === "create"
            ? "Fill in the details to create a new job listing"
            : `Editing ${job?.title || "—"}`
        }
        icon={Briefcase}
        meta={mode === "edit" && job?.postingId ? (
          <span className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-accent-soft)] px-2 py-1 font-mono text-[12px] font-semibold text-[var(--adm-accent)]">
            <Hash className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            {job.postingId}
          </span>
        ) : undefined}
        actions={
          <>
            {/* "Back" and "Cancel" both called router.back(), so the header
                offered the same escape twice under two names. The single
                remaining one is the Back link above the title. */}
            <WorkspaceButton type="button" onClick={() => setShowPreview(true)}>
              <Eye className="h-4 w-4" />Preview
            </WorkspaceButton>
            {/* House pattern: the primary action sits in the header band and
                reaches the form below it through form=. */}
            <WorkspaceButton type="submit" form={formId} variant="primary" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {mode === "create" ? "Create Job" : "Save Changes"}
            </WorkspaceButton>
          </>
        }
      />

      {/* The measure is constrained here, not by the calling page. PageHeader
          breaks out of the main region's padding with -mx-5/-mx-6 to draw a
          full-bleed band, so a max-width wrapper around the whole component
          would leave the band sticking out past the form column on wide
          screens. Header spans, body is measured. */}
      <form id={formId} onSubmit={handleSubmit} className="mx-auto max-w-5xl space-y-4">
        {/* ── Job Details ── */}
        <AdminCard>
          <AdminCardHeader icon={Briefcase} title="Job details" />
          <div className="p-5">
            <PanelNote>The role title, category, and where it&rsquo;s based.</PanelNote>
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <Field label="Job Title" required htmlFor="job-title">
                    <FormInput
                      id="job-title"
                      required
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Department" required htmlFor="job-department">
                  <FormSelect id="job-department" required value={data.department} onChange={(e) => set("department", e.target.value)}>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Job Type" required htmlFor="job-type">
                  <FormSelect id="job-type" required value={data.type} onChange={(e) => set("type", e.target.value as Job["type"])}>
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </FormSelect>
                </Field>
                <Field label="City / Location" required htmlFor="job-location">
                  <FormInput id="job-location" required value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Columbus" />
                </Field>
                <Field label="State" htmlFor="job-state">
                  {/* Stores the 2-letter code; the shared list is the single
                      source of truth shared with Applications and the bench. */}
                  <FormSelect id="job-state" value={data.state} onChange={(e) => set("state", e.target.value)}>
                    <option value="">Select state…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </FormSelect>
                </Field>
              </div>
            </div>
          </div>
        </AdminCard>

        {/* ── Client / Vendor / Deadline ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AdminCard>
            <AdminCardHeader icon={Building2} title="Client" />
            <div className="p-5">
              <FormSelect aria-label="Client" value={data.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
                <option value="">Select client</option>
                <option value="add-new">+ Add New Client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </FormSelect>
              {data.clientId && data.clientId !== "add-new" && (
                <FormInput
                  aria-label="Client notes"
                  className="mt-2"
                  value={data.clientNotes}
                  onChange={(e) => set("clientNotes", e.target.value)}
                  placeholder="Client notes…"
                />
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader icon={Truck} title="Vendor" />
            <div className="p-5">
              <FormSelect aria-label="Vendor" value={data.vendorId || "none"} onChange={(e) => handleVendorSelect(e.target.value)}>
                <option value="none">No vendor</option>
                {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </FormSelect>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader icon={Calendar} title="Submission deadline" />
            <div className="p-5">
              <FormInput
                aria-label="Submission deadline"
                type="date"
                value={data.submissionDueDate}
                onChange={(e) => set("submissionDueDate", e.target.value)}
              />
            </div>
          </AdminCard>
        </div>

        {/* ── Compensation ── */}
        <AdminCard>
          <AdminCardHeader icon={DollarSign} title="Compensation" />
          <div className="p-5">
            <PanelNote>Optional rate and salary details — leave blank if not applicable.</PanelNote>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Bill Rate ($/hr)" htmlFor="job-bill-rate">
                <MoneyInput id="job-bill-rate" value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
              </Field>
              <Field label="Pay Rate ($/hr)" htmlFor="job-pay-rate">
                <MoneyInput id="job-pay-rate" value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
              </Field>
              <Field label="Min Salary (Annual)" htmlFor="job-salary-min">
                <MoneyInput id="job-salary-min" value={data.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="80,000" />
              </Field>
              <Field label="Max Salary (Annual)" htmlFor="job-salary-max">
                <MoneyInput id="job-salary-max" value={data.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="120,000" />
              </Field>
            </div>
          </div>
        </AdminCard>

        {/* ── Team Assignments ── */}
        <AdminCard>
          <AdminCardHeader icon={UserCheck} title="Team assignments" count={data.assignedToIds.length} />
          <div className="p-5">
            <PanelNote>Assign team members to receive notifications for this job posting.</PanelNote>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Field label="Recruitment Manager" htmlFor="job-manager">
                <FormSelect id="job-manager" value={data.recruitmentManagerId} onChange={(e) => handleManagerSelect(e.target.value)}>
                  <option value="">Select manager</option>
                  {hrUsers.map((u) => (
                    <option key={u.id} value={u.id}>{u.name || u.email} ({u.role})</option>
                  ))}
                </FormSelect>
              </Field>
              <Field label="Additional Assignees">
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

        {/* ── Job Description ── */}
        <AdminCard>
          <AdminCardHeader icon={FileText} title="Job description" />
          <div className="p-5">
            <PanelNote>
              What candidates see — describe the role, then list requirements and responsibilities.
            </PanelNote>
            <div className="space-y-4">
              <Field label="Description" required htmlFor="job-description">
                <RichTextEditor
                  id="job-description"
                  required
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

        {/* ── Record footer ── */}
        {mode === "edit" && job && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3 text-xs text-[var(--adm-ink-mute)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Created</span>
              {fmtDate(job.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Updated</span>
              {fmtDate(job.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Posted by</span>
              {job.postedByName || "—"}
            </span>
          </div>
        )}
      </form>

      {/* ── Add Client Modal ── */}
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

      {/* ── Preview Modal ── */}
      {showPreview && (
        <PreviewModal data={data} typeLabel={typeLabel} onClose={() => setShowPreview(false)} />
      )}
    </>
  );
}

// ── Shared modal button classes ────────────────────────────────────────────────

const modalPrimaryBtn =
  "inline-flex items-center gap-2 rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white " +
  "transition-colors hover:bg-[var(--adm-accent-strong)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] disabled:opacity-50";

const modalGhostBtn =
  "rounded-[8px] px-4 py-2 text-sm font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)] " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]";

const modalCloseBtn =
  "rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)] " +
  "focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onAdd(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-2 border-b border-[var(--adm-line)] px-5 py-3.5">
          <h2 className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
            <Building2 className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-mute)]" strokeWidth={1.75} aria-hidden="true" />
            Add New Client
          </h2>
          <button type="button" onClick={onClose} className={modalCloseBtn} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && (
            <p role="alert" className="rounded-[6px] border border-[var(--adm-danger)] bg-[var(--adm-danger-soft)] px-3 py-2 text-xs text-[var(--adm-danger)]">{error}</p>
          )}
          <Field label="Client Name" required htmlFor="client-name">
            <FormInput id="client-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
          </Field>
          <Field label="Website URL" required htmlFor="client-website">
            <FormInput id="client-website" required type="url" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="client-email">
              <FormInput id="client-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
            </Field>
            <Field label="Phone" htmlFor="client-phone">
              <FormInput id="client-phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className={modalGhostBtn}>Cancel</button>
            <button type="submit" disabled={submitting} className={modalPrimaryBtn}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}Add Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Preview Modal ──────────────────────────────────────────────────────────────

function PreviewModal({ data, typeLabel, onClose }: { data: JobFormData; typeLabel: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/50 py-8" onClick={onClose} role="dialog" aria-modal="true">
      <div className="my-auto w-full max-w-4xl overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] shadow-lg" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Eye className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-mute)]" strokeWidth={1.75} aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-semibold text-[var(--adm-ink)]">Public Preview</h2>
              <p className="truncate text-xs text-[var(--adm-ink-subtle)]">How this job appears to candidates</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className={modalCloseBtn} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6">
            <h1 className="mb-4 text-2xl font-bold text-[var(--adm-ink)]">{data.title || "—"}</h1>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-accent-soft)] px-2.5 py-1 text-[13px] font-semibold text-[var(--adm-accent)]">
                <Briefcase className="h-3.5 w-3.5 flex-none" aria-hidden="true" />{typeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1 text-[13px] font-medium text-[var(--adm-ink-mute)]">
                <MapPin className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                {data.location || "—"}{data.state ? `, ${data.state}` : ""}
              </span>
              {data.submissionDueDate && (
                <span className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-warning)] bg-[var(--adm-warning-soft)] px-2.5 py-1 text-[13px] font-medium text-[var(--adm-warning)]">
                  <Clock className="h-3.5 w-3.5 flex-none" aria-hidden="true" />Due {fmtDate(data.submissionDueDate)}
                </span>
              )}
            </div>
            {data.salaryMin && data.salaryMax && (
              <p className="text-lg font-semibold tabular-nums text-[var(--adm-success)]">
                ${parseInt(data.salaryMin).toLocaleString()} – ${parseInt(data.salaryMax).toLocaleString()}
              </p>
            )}
          </div>

          {data.description && (
            <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6">
              <h2 className="mb-3 text-[17px] font-bold text-[var(--adm-ink)]">About This Role</h2>
              <div
                className="text-sm leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={renderRichText(data.description)}
              />
            </div>
          )}
          {data.responsibilities && (
            <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6">
              <h2 className="mb-3 text-[17px] font-bold text-[var(--adm-ink)]">Responsibilities</h2>
              <div
                className="text-sm leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={renderRichText(data.responsibilities)}
              />
            </div>
          )}
          {data.requirements && (
            <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6">
              <h2 className="mb-3 text-[17px] font-bold text-[var(--adm-ink)]">Requirements</h2>
              <div
                className="text-sm leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5"
                dangerouslySetInnerHTML={renderRichText(data.requirements)}
              />
            </div>
          )}

          {/* Flat re-cut of the old cobalt→cyan gradient banner. */}
          <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6 text-center">
            <h3 className="text-[17px] font-bold text-[var(--adm-ink)]">Ready to apply?</h3>
            <p className="mt-1 text-sm text-[var(--adm-ink-subtle)]">Join our team and help shape the future of enterprise IT.</p>
            <span
              aria-hidden="true"
              className="mt-4 inline-flex cursor-default items-center rounded-[8px] bg-[var(--adm-accent)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Apply for this position
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
