"use client";

import * as React from "react";
import { Loader2, X, Plus } from "lucide-react";
import { IconFile, IconJob, IconLocation, IconShield, IconSparkles, IconStar, IconUpload, IconUser, IconWarning } from "./icons";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { Application, BenchType, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import {
  statusMeta, SOURCE_OPTIONS, US_STATES, COMMON_SKILLS, type AppStatus,
  WORK_AUTH_GROUPS, workAuthExpires, HIRE_TYPE_OPTIONS,
} from "./theme";
import { FormSection, Field, FormInput, FormSelect, FormTextarea } from "./forms/primitives";
import { StarRating } from "./star-rating";

// ── Tab config ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",  label: "Profile",  icon: IconUser    },
  { id: "resume",   label: "Resume",   icon: IconFile },
  { id: "skills",   label: "Skills",   icon: IconJob },
  { id: "visa",     label: "Visa",     icon: IconShield   },
  { id: "notes",    label: "Notes",    icon: IconStar },
] as const;

type TabId = typeof TABS[number]["id"];

// ── Resume upload constraints ──────────────────────────────────────────────────

const RESUME_MAX_BYTES = 5 * 1024 * 1024;
const RESUME_EXTENSIONS = [".pdf", ".doc", ".docx"];

// ── Default form ───────────────────────────────────────────────────────────────

const defaultForm = {
  firstName: "", lastName: "", email: "", phone: "",
  status: "pending" as AppStatus,
  jobId: "", jobTitle: "",
  source: "",
  hireType: "",
  city: "", state: "",
  // Skills tab
  skills: [] as string[],
  skillInput: "",
  experience: "",
  // Visa tab
  workAuthorization: "",
  visaExpiry: "",
  visaSponsorshipRequired: false,
  // Notes tab
  notes: "",
  rating: 0,
  addToTalentBench: false,
  benchType: "external" as BenchType,
};

type FormState = typeof defaultForm;

export type CandidateDrawerMode = "create" | "edit";

interface CandidateEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: CandidateDrawerMode;
  candidate?: Application | null;
  jobs?: Job[];
  defaultJobId?: string;
  onSaved?: (app: Application) => void;
}

export function CandidateEditDrawer({
  open, onOpenChange, mode: modeProp, candidate, jobs = [], defaultJobId, onSaved,
}: CandidateEditDrawerProps) {
  const { user } = useAuth();
  const mode: CandidateDrawerMode = modeProp || (candidate ? "edit" : "create");
  const [form, setForm] = React.useState<FormState>(defaultForm);
  const [activeTab, setActiveTab] = React.useState<TabId>("profile");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // Resume — a new applicant added from this drawer had no way to attach one,
  // so their record could never be parsed. The file is uploaded on submit and
  // the API queues extraction from there.
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = React.useState(false);
  const [existingResume, setExistingResume] = React.useState<{ id: string; fileName: string } | null>(null);

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    setActiveTab("profile");
    setResumeFile(null);
    setResumeError(null);
    setExistingResume(
      candidate?.resumeId
        ? { id: candidate.resumeId, fileName: candidate.resumeFileName || "Resume on file" }
        : null,
    );
    if (candidate) {
      const rawSkills = candidate.skills || [];
      setForm({
        firstName: candidate.firstName || (candidate.name?.split(" ")[0] ?? ""),
        lastName: candidate.lastName || (candidate.name?.split(" ").slice(1).join(" ") ?? ""),
        email: candidate.email || "",
        phone: candidate.phone || "",
        status: (candidate.status as AppStatus) || "pending",
        jobId: candidate.jobId || "",
        jobTitle: candidate.jobTitle || "",
        source: candidate.source || "",
        hireType: candidate.hireType || "",
        city: candidate.city || "",
        state: candidate.state || "",
        skills: rawSkills,
        skillInput: "",
        experience: candidate.experience || "",
        workAuthorization: candidate.workAuthorization || "",
        // Both visa fields were reset to blank on load and left out of the
        // payload, so opening and saving a record silently wiped them.
        visaExpiry: candidate.visaExpiry || "",
        visaSponsorshipRequired: !!candidate.visaSponsorshipRequired,
        notes: candidate.notes || "",
        rating: candidate.rating || 0,
        addToTalentBench: !!candidate.addToTalentBench,
        benchType: candidate.benchType
          || (candidate.status === "hired" ? "internal" : "external"),
      });
    } else {
      setForm({ ...defaultForm, jobId: defaultJobId || "" });
    }
  }, [open, candidate, defaultJobId]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  // Skill chip helpers
  const addSkill = (skill: string) => {
    const s = skill.trim();
    if (!s || form.skills.includes(s)) return;
    set("skills", [...form.skills, s]);
    set("skillInput", "");
  };

  const removeSkill = (skill: string) =>
    set("skills", form.skills.filter((s) => s !== skill));

  /**
   * Validate by file extension rather than by MIME type. Browsers report
   * inconsistent types for .doc/.docx depending on what is installed, and
   * Windows has been known to hand over an empty string — a MIME allow-list
   * rejected perfectly good resumes. The extraction service reads the bytes
   * regardless, so the extension is the honest gate here.
   */
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!RESUME_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setResumeError("Upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setResumeError("File must be under 5MB");
      return;
    }
    setResumeFile(file);
  };

  const uploadResume = async (
    ownerId: string,
  ): Promise<{ resumeId: string; resumeFileName: string; resumeFileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", ownerId);
      const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resume upload failed");
      return { resumeId: data.resumeId, resumeFileName: resumeFile.name, resumeFileKey: data.fileKey };
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Resume upload failed");
      return null;
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.email.trim()) {
      setError("First name and email are required.");
      setActiveTab("profile");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Resume goes up first: the create/update call carries the reference, and
      // the API queues extraction off the back of it.
      let resumePayload: Record<string, string> = {};
      if (resumeFile) {
        const uploaded = await uploadResume(candidate?.id || `applicant-${Date.now()}`);
        if (!uploaded) {
          setActiveTab("resume");
          setSubmitting(false);
          return;
        }
        resumePayload = uploaded;
      } else if (mode === "edit" && !existingResume && candidate?.resumeId) {
        // The recruiter detached the resume that was on file.
        resumePayload = { resumeId: "", resumeFileName: "", resumeFileKey: "" };
      }

      const job = jobs.find((j) => j.id === form.jobId);
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        status: form.status,
        jobId: form.jobId || undefined,
        jobTitle: form.jobTitle || job?.title || undefined,
        source: form.source || undefined,
        hireType: form.hireType || undefined,
        workAuthorization: form.workAuthorization || undefined,
        visaSponsorshipRequired: form.visaSponsorshipRequired,
        visaExpiry: form.visaExpiry,
        city: form.city,
        state: form.state,
        skills: form.skills,
        experience: form.experience,
        notes: form.notes,
        rating: form.rating || undefined,
        addToTalentBench: form.addToTalentBench,
        ...(form.addToTalentBench && {
          benchType: form.benchType,
          benchAddedBy: user?.email || user?.id,
        }),
        createdBy: user?.email || "admin",
        createdByName: user?.name || "Admin",
        ...resumePayload,
      };
      let res: Response;
      if (mode === "create") {
        res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, userId: "anonymous", appliedAt: new Date().toISOString() }),
        });
      } else {
        res = await fetch(`/api/applications/${candidate!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save candidate");
      onSaved?.(data.application);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[580px] p-0 flex flex-col gap-0 bg-[var(--adm-surface-sunken)]">
        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--adm-surface)] border-b border-[var(--adm-line)] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[6px] bg-[var(--adm-accent-soft)] flex items-center justify-center">
              <IconUser className="w-[18px] h-[18px] text-[var(--adm-accent)]" />
            </div>
            <div>
              <SheetTitle className="text-[15px] font-bold text-[var(--adm-ink)]">
                {mode === "create" ? "Add Applicant" : "Edit Applicant"}
              </SheetTitle>
              <SheetDescription className="text-xs text-[var(--adm-ink-subtle)] mt-0.5">
                {mode === "create" ? "Enter applicant details below" : "Update applicant information"}
              </SheetDescription>
            </div>
          </div>
          <button type="button" onClick={() => onOpenChange(false)} aria-label="Close" className="p-1.5 text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] rounded-[6px] transition-colors">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Tab nav */}
        <div className="flex-shrink-0 bg-[var(--adm-surface)] border-b border-[var(--adm-line)] px-4">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-colors border-b-2",
                  activeTab === tab.id
                    ? "text-[var(--adm-accent)] border-[var(--adm-accent)]"
                    : "text-[var(--adm-ink-subtle)] border-transparent hover:text-[var(--adm-ink-mute)]",
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3 bg-[var(--adm-danger-soft)] border border-[var(--adm-danger)] rounded-[6px]">
                <IconWarning className="w-4 h-4 text-[var(--adm-danger)] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--adm-danger)] leading-relaxed">{error}</p>
              </div>
            )}

            {/* ── Profile tab ── */}
            {activeTab === "profile" && (
              <>
                <FormSection icon={IconUser} title="Personal Info">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="First name" required>
                      <FormInput value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Jane" />
                    </Field>
                    <Field label="Last name">
                      <FormInput value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" />
                    </Field>
                    <Field label="Email" required>
                      <FormInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" />
                    </Field>
                    <Field label="Phone">
                      <FormInput type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={IconLocation} title="Location">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="City">
                      <FormInput value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" />
                    </Field>
                    <Field label="State">
                      <FormSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select state…</option>
                        {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </FormSelect>
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={IconJob} title="Position & Pipeline">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Field label="Pipeline status">
                      <FormSelect value={form.status} onChange={(e) => set("status", e.target.value as AppStatus)}>
                        {Object.entries(statusMeta)
                          .filter(([k]) => !["active", "inactive", "paused", "draft", "closed", "open", "on-hold"].includes(k))
                          .map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </FormSelect>
                    </Field>
                    <Field label="Job posting">
                      <FormSelect
                        value={form.jobId}
                        onChange={(e) => {
                          const job = jobs.find((j) => j.id === e.target.value);
                          set("jobId", e.target.value);
                          set("jobTitle", job?.title || "");
                        }}
                      >
                        <option value="">Unassigned</option>
                        {jobs.filter((j) => j.status === "open" || j.status === "active").map((j) => (
                          <option key={j.id} value={j.id}>{j.title}</option>
                        ))}
                      </FormSelect>
                    </Field>
                    <Field label="Source">
                      <FormSelect value={form.source} onChange={(e) => set("source", e.target.value)}>
                        <option value="">Select source…</option>
                        {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </FormSelect>
                    </Field>
                    <Field label="Type of hire">
                      <FormSelect value={form.hireType} onChange={(e) => set("hireType", e.target.value)}>
                        <option value="">Select…</option>
                        {HIRE_TYPE_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </FormSelect>
                    </Field>
                    <Field label="Add to talent bench">
                      <label className="flex items-center gap-2 px-3 py-2 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)] cursor-pointer hover:bg-[var(--adm-row-hover)] transition-colors">
                        <input type="checkbox" autoComplete="off" checked={form.addToTalentBench} onChange={(e) => set("addToTalentBench", e.target.checked)} className="size-4 shrink-0 rounded border-[var(--adm-line)] accent-[var(--adm-accent)]" />
                        <span className="text-sm text-[var(--adm-ink-mute)]">Add to bench</span>
                      </label>
                    </Field>
                    {form.addToTalentBench && (
                      <Field label="Talent pool" helper={POOL_META[form.benchType].hint}>
                        <FormSelect value={form.benchType} onChange={(e) => set("benchType", e.target.value as BenchType)}>
                          {POOL_ORDER.map((p) => (
                            <option key={p} value={p}>
                              {POOL_META[p].label} — {POOL_META[p].badge.toLowerCase()}
                            </option>
                          ))}
                        </FormSelect>
                      </Field>
                    )}
                  </div>
                </FormSection>
              </>
            )}

            {/* ── Resume tab ── */}
            {activeTab === "resume" && (
              <FormSection icon={IconFile} title="Resume">
                <div className="space-y-3">
                  {resumeFile ? (
                    <div className="flex items-center gap-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                        <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{resumeFile.name}</p>
                        <p className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">
                          {(resumeFile.size / 1024).toFixed(0)} KB · ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        aria-label="Remove selected resume"
                        className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : existingResume ? (
                    <div className="flex items-center gap-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3">
                      <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-success-soft)]">
                        <IconFile className="h-4 w-4 text-[var(--adm-success)]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{existingResume.fileName}</p>
                        <p className="text-xs text-[var(--adm-ink-subtle)]">Currently on file</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExistingResume(null)}
                        aria-label="Detach resume"
                        className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}

                  {!resumeFile && (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[8px] border border-dashed border-[var(--adm-line)] bg-[var(--adm-surface)] p-6 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]">
                      <input
                        type="file"
                        accept={RESUME_EXTENSIONS.join(",")}
                        onChange={handleResumeSelect}
                        className="sr-only"
                      />
                      <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      <span className="text-center">
                        <span className="block text-sm font-semibold text-[var(--adm-ink-mute)]">
                          {existingResume ? "Upload a replacement" : "Upload resume"}
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--adm-ink-subtle)]">PDF or Word · max 5MB</span>
                      </span>
                    </label>
                  )}

                  {resumeError && (
                    <p role="alert" className="flex items-start gap-2 rounded-[6px] border border-[var(--adm-danger)] bg-[var(--adm-danger-soft)] px-2.5 py-2 text-xs text-[var(--adm-danger)]">
                      <IconWarning className="mt-px h-3.5 w-3.5 flex-none" aria-hidden="true" />
                      {resumeError}
                    </p>
                  )}

                  <p className="flex items-start gap-2 rounded-[6px] bg-[var(--adm-accent-tint)] px-3 py-2.5 text-xs leading-relaxed text-[var(--adm-ink-mute)]">
                    <IconSparkles className="mt-px h-3.5 w-3.5 flex-none text-[var(--adm-accent)]" aria-hidden="true" />
                    Saving with a resume attached extracts the full profile — work history, education,
                    skills, certifications and projects — onto the candidate record. It usually takes
                    under a minute and appears on their page automatically.
                  </p>
                </div>
              </FormSection>
            )}

            {/* ── Skills tab ── */}
            {activeTab === "skills" && (
              <>
                <FormSection icon={IconJob} title="Skills">
                  <div className="space-y-3">
                    {/* Skill chip input */}
                    <div className="flex gap-2">
                      <FormInput
                        value={form.skillInput}
                        onChange={(e) => set("skillInput", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addSkill(form.skillInput); }
                          if (e.key === ",") { e.preventDefault(); addSkill(form.skillInput); }
                        }}
                        placeholder="Type a skill and press Enter…"
                      />
                      <button
                        type="button"
                        onClick={() => addSkill(form.skillInput)}
                        aria-label="Add skill"
                        className="px-3 py-2 bg-[var(--adm-accent)] text-white rounded-[8px] hover:bg-[var(--adm-accent-strong)] active:scale-[0.99] transition flex-shrink-0"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Added skills */}
                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 bg-[var(--adm-accent-soft)] text-[var(--adm-accent)] text-xs font-medium rounded-[4px]">
                            {skill}
                            <button type="button" onClick={() => removeSkill(skill)} aria-label="Remove skill" className="p-0.5 hover:bg-white/60 rounded-[4px] transition-colors">
                              <X className="w-3 h-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Common skill suggestions */}
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--adm-ink-subtle)] uppercase tracking-wider mb-2">Common skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="px-2.5 py-1 text-xs text-[var(--adm-ink-mute)] bg-[var(--adm-surface-2)] hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)] rounded-[4px] border border-[var(--adm-line)] hover:border-[var(--adm-accent-soft)] transition-colors"
                          >
                            + {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={IconFile} title="Experience">
                  <Field label="Experience summary">
                    <FormTextarea rows={5} value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Brief summary of candidate's experience, industries, key achievements…" />
                  </Field>
                </FormSection>
              </>
            )}

            {/* ── Visa tab ── */}
            {activeTab === "visa" && (
              <FormSection icon={IconShield} title="Work Authorization & Visa Status">
                <div className="space-y-4">
                  <Field label="Work Authorization / Visa Status">
                    <FormSelect value={form.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}>
                      <option value="">Select status…</option>
                      {WORK_AUTH_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </optgroup>
                      ))}
                    </FormSelect>
                  </Field>

                  {/* Visa expiry — only where an expiry is a real fact */}
                  {workAuthExpires(form.workAuthorization) && (
                    <Field label="Visa / OPT Expiry Date">
                      <FormInput type="date" value={form.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} />
                    </Field>
                  )}

                  <Field label="Sponsorship">
                    <label className="flex items-center gap-3 px-3 py-2.5 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)] cursor-pointer hover:bg-[var(--adm-row-hover)] transition-colors">
                      <input
                        type="checkbox"
                        autoComplete="off"
                        checked={form.visaSponsorshipRequired}
                        onChange={(e) => set("visaSponsorshipRequired", e.target.checked)}
                        className="size-4 shrink-0 rounded border-[var(--adm-line)] accent-[var(--adm-accent)]"
                      />
                      <div>
                        <p className="text-sm font-medium text-[var(--adm-ink-mute)]">Requires sponsorship</p>
                        <p className="text-xs text-[var(--adm-ink-subtle)]">Candidate will need H-1B or similar sponsorship</p>
                      </div>
                    </label>
                  </Field>

                  {/* Authorization status info box */}
                  {form.workAuthorization && (
                    <div className={cn(
                      "rounded-[6px] p-3 text-xs",
                      ["US Citizen", "Green Card"].includes(form.workAuthorization)
                        ? "bg-[var(--adm-success-soft)] border border-[var(--adm-success)] text-[var(--adm-success)]"
                        : "bg-[var(--adm-warning-soft)] border border-[var(--adm-warning)] text-[var(--adm-warning)]",
                    )}>
                      {["US Citizen", "Green Card"].includes(form.workAuthorization)
                        ? "✓ This candidate has permanent work authorization in the US."
                        : form.workAuthorization === "H1-B"
                          ? "H-1B holders require employer sponsorship to maintain status."
                          : ["OPT", "CPT"].includes(form.workAuthorization)
                            ? "OPT/CPT is time-limited — verify expiry date before extending an offer."
                            : "Verify work authorization documents before extending an offer."}
                    </div>
                  )}
                </div>
              </FormSection>
            )}

            {/* ── Notes tab ── */}
            {activeTab === "notes" && (
              <>
                <FormSection icon={IconStar} title="Rating">
                  <Field label="Candidate rating">
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-[var(--adm-line)] rounded-[8px] bg-[var(--adm-surface)]">
                      <StarRating rating={form.rating} onRate={(n) => set("rating", n === form.rating ? 0 : n)} size="md" />
                      {form.rating > 0 && (
                        <span className="text-xs text-[var(--adm-ink-subtle)] ml-1 tabular-nums">{form.rating}/5</span>
                      )}
                    </div>
                  </Field>
                </FormSection>

                <FormSection icon={IconFile} title="Internal Notes">
                  <Field label="Notes" hint="Internal only — not visible to candidate">
                    <FormTextarea rows={8} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview impressions, concerns, next steps…" />
                  </Field>
                </FormSection>
              </>
            )}
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 left-0 right-0 bg-[var(--adm-surface)] border-t border-[var(--adm-line)] px-5 py-3 flex items-center gap-3">
            <button type="button" onClick={() => onOpenChange(false)} className="flex-1 px-4 py-2.5 text-sm font-semibold border border-[var(--adm-line)] text-[var(--adm-ink-mute)] rounded-[8px] hover:bg-[var(--adm-row-hover)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting || resumeUploading} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-[var(--adm-accent)] text-white rounded-[8px] hover:bg-[var(--adm-accent-strong)] active:scale-[0.99] disabled:opacity-60 transition">
              {(submitting || resumeUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
              {resumeUploading ? "Uploading resume…" : mode === "create" ? "Add Applicant" : "Save Changes"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
