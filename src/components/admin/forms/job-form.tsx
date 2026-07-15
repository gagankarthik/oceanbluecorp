"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Loader2, DollarSign, Calendar, Building2, UserCheck,
  X, Briefcase, FileText, Truck, Save, Eye, Hash, Clock, MapPin,
} from "lucide-react";
import type { Job, Client, Vendor } from "@/lib/aws/dynamodb";
import { fmtDate } from "@/lib/format";
import { FormSection, Field, FormInput, MoneyInput, FormSelect, FormTextarea, AssigneePicker, AssigneeUser } from "./primitives";

// ── Constants ──────────────────────────────────────────────────────────────────

export const US_STATES = [
  "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
  "Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa",
  "Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan",
  "Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire",
  "New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio",
  "Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota",
  "Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia",
  "Wisconsin","Wyoming","Remote",
];

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
    state: job.state || "",
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
    requirements: Array.isArray(job.requirements) ? job.requirements.join("\n") : (job.requirements || ""),
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities.join("\n") : (job.responsibilities || ""),
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
    requirements: parseLines(data.requirements),
    responsibilities: parseLines(data.responsibilities),
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
    draft: "text-slate-700", open: "text-emerald-700", active: "text-[var(--hz-cobalt)]",
    "on-hold": "text-amber-700", paused: "text-amber-700", closed: "text-rose-700",
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === data.type)?.label || data.type;

  const reduceMotion = useReducedMotion();
  const section = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.04 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-0.5 grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-bold leading-tight tracking-tight text-slate-900">
                {mode === "create" ? "Create Job Posting" : "Edit Job Posting"}
              </h1>
              {mode === "edit" && job?.postingId && (
                <span className="inline-flex items-center gap-1 rounded-md border border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--hz-cobalt)]">
                  <Hash className="h-3 w-3" />{job.postingId}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
              {mode === "create"
                ? "Fill in the details to create a new job listing"
                : `Editing: ${job?.title || ""}`}
            </p>
          </div>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
          >
            <Eye className="h-4 w-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--hz-cobalt)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(29,78,216,0.2)] transition active:scale-[0.99] hover:bg-[var(--hz-cobalt-600)] disabled:opacity-50"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {mode === "create" ? "Create Job" : "Save Changes"}
          </button>
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* ── Job Details ── */}
        <motion.div {...section(0)}>
        <FormSection icon={Briefcase} title="Job Details" tone="blue" description="The role title, category, and where it's based.">
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Field label="Job Title" required>
                  <FormInput
                    required
                    value={data.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                  />
                </Field>
              </div>
              <Field label="Status">
                <FormSelect
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Department" required>
                <FormSelect required value={data.department} onChange={(e) => set("department", e.target.value)}>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </FormSelect>
              </Field>
              <Field label="Job Type" required>
                <FormSelect required value={data.type} onChange={(e) => set("type", e.target.value as Job["type"])}>
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </FormSelect>
              </Field>
              <Field label="City / Location" required>
                <FormInput required value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. Columbus" />
              </Field>
              <Field label="State">
                <FormSelect value={data.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Select state</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </Field>
            </div>
          </div>
        </FormSection>
        </motion.div>

        {/* ── Client / Vendor / Deadline ── */}
        <motion.div {...section(1)} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <FormSection icon={Building2} title="Client" tone="violet">
            <FormSelect value={data.clientId} onChange={(e) => handleClientSelect(e.target.value)}>
              <option value="">Select client</option>
              <option value="add-new">+ Add New Client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </FormSelect>
            {data.clientId && data.clientId !== "add-new" && (
              <FormInput
                className="mt-2"
                value={data.clientNotes}
                onChange={(e) => set("clientNotes", e.target.value)}
                placeholder="Client notes…"
              />
            )}
          </FormSection>

          <FormSection icon={Truck} title="Vendor" tone="teal">
            <FormSelect value={data.vendorId || "none"} onChange={(e) => handleVendorSelect(e.target.value)}>
              <option value="none">No vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </FormSelect>
          </FormSection>

          <FormSection icon={Calendar} title="Submission Deadline" tone="amber">
            <FormInput
              type="date"
              value={data.submissionDueDate}
              onChange={(e) => set("submissionDueDate", e.target.value)}
            />
          </FormSection>
        </motion.div>

        {/* ── Compensation ── */}
        <motion.div {...section(2)}>
        <FormSection icon={DollarSign} title="Compensation" tone="emerald" description="Optional rate and salary details — leave blank if not applicable.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
            <Field label="Bill Rate ($/hr)">
              <MoneyInput value={data.clientBillRate} onChange={(e) => set("clientBillRate", e.target.value)} placeholder="75.00" />
            </Field>
            <Field label="Pay Rate ($/hr)">
              <MoneyInput value={data.payRate} onChange={(e) => set("payRate", e.target.value)} placeholder="55.00" />
            </Field>
            <Field label="Min Salary (Annual)">
              <MoneyInput value={data.salaryMin} onChange={(e) => set("salaryMin", e.target.value)} placeholder="80,000" />
            </Field>
            <Field label="Max Salary (Annual)">
              <MoneyInput value={data.salaryMax} onChange={(e) => set("salaryMax", e.target.value)} placeholder="120,000" />
            </Field>
          </div>
        </FormSection>
        </motion.div>

        {/* ── Team Assignments ── */}
        <motion.div {...section(3)}>
        <FormSection
          icon={UserCheck}
          title="Team Assignments"
          tone="indigo"
          description="Assign team members to receive notifications for this job posting."
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Recruitment Manager">
              <FormSelect value={data.recruitmentManagerId} onChange={(e) => handleManagerSelect(e.target.value)}>
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
        </FormSection>
        </motion.div>

        {/* ── Job Description ── */}
        <motion.div {...section(4)}>
        <FormSection icon={FileText} title="Job Description" tone="sky" description="What candidates see — describe the role, then list requirements and responsibilities.">
          <div className="space-y-4">
            <Field label="Description" required>
              <FormTextarea
                required
                rows={6}
                value={data.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the role, team, and what makes this opportunity exciting…"
              />
            </Field>
            <Field label="Requirements" hint="One item per line">
              <FormTextarea
                rows={6}
                value={data.requirements}
                onChange={(e) => set("requirements", e.target.value)}
                placeholder={"Bachelor's degree in Computer Science\n5+ years of experience\nProficiency in React and Node.js"}
              />
            </Field>
            <Field label="Responsibilities" hint="One item per line">
              <FormTextarea
                rows={6}
                value={data.responsibilities}
                onChange={(e) => set("responsibilities", e.target.value)}
                placeholder={"Design and implement new features\nCollaborate with cross-functional teams\nConduct code reviews"}
              />
            </Field>
          </div>
        </FormSection>
        </motion.div>

        {/* ── Created / Posted by ── */}
        {mode === "edit" && job && (
          <motion.div
            {...section(5)}
            className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-xl border border-slate-200/80 bg-slate-50/70 px-4 py-3 text-xs text-slate-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Created</span>
              {fmtDate(job.createdAt)}
            </span>
            {job.updatedAt && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Updated</span>
                {fmtDate(job.updatedAt)}
              </span>
            )}
            {job.postedByName && (
              <span className="inline-flex items-center gap-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Posted by</span>
                {job.postedByName}
              </span>
            )}
          </motion.div>
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
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="flex items-center gap-2.5 text-base font-bold text-slate-900">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-violet-50">
              <Building2 className="h-4 w-4 text-violet-600" />
            </span>
            Add New Client
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">{error}</p>}
          <Field label="Client Name" required>
            <FormInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
          </Field>
          <Field label="Website URL" required>
            <FormInput required type="url" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Email">
              <FormInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
            </Field>
            <Field label="Phone">
              <FormInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-lg bg-[var(--hz-cobalt)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(29,78,216,0.2)] transition active:scale-[0.99] hover:bg-[var(--hz-cobalt-600)] disabled:opacity-50">
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
    <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-900/50 py-8 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true">
      <div className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-slate-100 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--hz-cobalt-100)]">
              <Eye className="h-4 w-4 text-[var(--hz-cobalt)]" />
            </span>
            <div>
              <h2 className="text-base font-bold text-slate-900">Public Preview</h2>
              <p className="text-xs text-slate-500">How this job appears to candidates</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h1 className="text-2xl font-bold text-slate-900 mb-4">{data.title || "Job Title"}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] rounded-full text-sm font-medium">
                <Briefcase className="w-4 h-4" />{typeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium">
                <MapPin className="w-4 h-4" />{data.location || "Location"}{data.state ? `, ${data.state}` : ""}
              </span>
              {data.submissionDueDate && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">
                  <Clock className="w-4 h-4" />Due {new Date(data.submissionDueDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {data.salaryMin && data.salaryMax && (
              <p className="text-lg font-semibold text-emerald-600">
                ${parseInt(data.salaryMin).toLocaleString()} – ${parseInt(data.salaryMax).toLocaleString()}
              </p>
            )}
          </div>
          {data.description && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3">About This Role</h2>
              <p className="text-slate-600 whitespace-pre-wrap text-sm leading-relaxed">{data.description}</p>
            </div>
          )}
          {data.responsibilities && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Responsibilities</h2>
              <pre className="text-slate-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{data.responsibilities}</pre>
            </div>
          )}
          {data.requirements && (
            <div className="bg-white rounded-xl p-6 border border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 mb-3">Requirements</h2>
              <pre className="text-slate-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{data.requirements}</pre>
            </div>
          )}
          <div className="bg-gradient-to-r from-[var(--hz-cobalt)] to-cyan-600 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to apply?</h3>
            <p className="text-[var(--hz-cobalt-100)] mb-4 text-sm">Join our team and help shape the future of enterprise IT.</p>
            <button className="px-6 py-3 bg-white text-[var(--hz-cobalt)] font-semibold rounded-lg shadow-lg cursor-default text-sm">
              Apply for this position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
