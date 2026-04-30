"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, DollarSign, Calendar, Building2, UserCheck,
  X, Briefcase, FileText, Truck, Save, Eye, Hash, Clock, MapPin,
} from "lucide-react";
import { Job, Client, Vendor } from "@/lib/aws/dynamodb";
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
  "ERP Solutions","Cloud Services","Data & AI","Salesforce",
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
    draft: "text-gray-700", open: "text-emerald-700", active: "text-blue-700",
    "on-hold": "text-amber-700", paused: "text-amber-700", closed: "text-rose-700",
  };

  const typeLabel = JOB_TYPES.find((t) => t.value === data.type)?.label || data.type;

  return (
    <>
      {/* Sticky header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">
                {mode === "create" ? "Create Job Posting" : "Edit Job Posting"}
              </h1>
              {mode === "edit" && job?.postingId && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                  <Hash className="w-3 h-3" />{job.postingId}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">
              {mode === "create"
                ? "Fill in the details to create a new job listing"
                : `Editing: ${job?.title || ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {mode === "create" ? "Create Job" : "Save Changes"}
          </button>
        </div>
      </div>

      <form id={formId} onSubmit={handleSubmit} className="space-y-5">
        {/* ── Job Details ── */}
        <FormSection icon={Briefcase} title="Job Details">
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

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* ── Client / Vendor / Deadline ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <FormSection icon={Building2} title="Client">
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

          <FormSection icon={Truck} title="Vendor">
            <FormSelect value={data.vendorId || "none"} onChange={(e) => handleVendorSelect(e.target.value)}>
              <option value="none">No vendor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </FormSelect>
          </FormSection>

          <FormSection icon={Calendar} title="Submission Deadline">
            <FormInput
              type="date"
              value={data.submissionDueDate}
              onChange={(e) => set("submissionDueDate", e.target.value)}
            />
          </FormSection>
        </div>

        {/* ── Compensation ── */}
        <FormSection icon={DollarSign} title="Compensation">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* ── Team Assignments ── */}
        <FormSection
          icon={UserCheck}
          title="Team Assignments"
          description="Assign team members to receive notifications for this job posting."
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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

        {/* ── Job Description ── */}
        <FormSection icon={FileText} title="Job Description">
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

        {/* ── Created / Posted by ── */}
        {mode === "edit" && job && (
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              <span>Created: {new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              {job.updatedAt && <span>Updated: {new Date(job.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
              {job.postedByName && <span>Posted by: {job.postedByName}</span>}
            </div>
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-purple-600" />Add New Client
          </h2>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-3">{error}</p>}
          <Field label="Client Name" required>
            <FormInput required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Acme Corporation" />
          </Field>
          <Field label="Website URL" required>
            <FormInput required type="url" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://example.com" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email">
              <FormInput type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" />
            </Field>
            <Field label="Phone">
              <FormInput type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(555) 123-4567" />
            </Field>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}Add Client
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-gray-100 rounded-xl shadow-2xl w-full max-w-4xl my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 rounded-t-xl z-10">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-base font-semibold text-gray-900">Public Preview</h2>
              <p className="text-xs text-gray-500">How this job appears to candidates</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{data.title || "Job Title"}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                <Briefcase className="w-4 h-4" />{typeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
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
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">About This Role</h2>
              <p className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">{data.description}</p>
            </div>
          )}
          {data.responsibilities && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Responsibilities</h2>
              <pre className="text-gray-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{data.responsibilities}</pre>
            </div>
          )}
          {data.requirements && (
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Requirements</h2>
              <pre className="text-gray-600 whitespace-pre-wrap font-sans text-sm leading-relaxed">{data.requirements}</pre>
            </div>
          )}
          <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Ready to apply?</h3>
            <p className="text-blue-100 mb-4 text-sm">Join our team and help shape the future of enterprise IT.</p>
            <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg shadow-lg cursor-default text-sm">
              Apply for this position
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
