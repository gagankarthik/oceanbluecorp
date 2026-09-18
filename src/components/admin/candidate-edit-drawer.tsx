"use client";

import * as React from "react";
import { flushSync } from "react-dom";
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
import { WorkspaceButton } from "./workspace";
import { StarRating } from "./star-rating";
import { FormErrorBanner, FieldWarning } from "./forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import { LIMITS, check, collectErrors, email, maxLen, pastDateWarning, phone, required } from "@/lib/form-validation";

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

type ErrorField = "firstName" | "lastName" | "email" | "phone" | "city" | "experience" | "notes";

// Only the active tab is mounted, so a failing field's tab must open before it can take focus.
const FIELD_TAB: Record<ErrorField, TabId> = {
  firstName: "profile", lastName: "profile", email: "profile", phone: "profile", city: "profile",
  experience: "skills", notes: "notes",
};

const FIELD_IDS: Record<ErrorField, string> = {
  firstName: "cand-first-name", lastName: "cand-last-name", email: "cand-email", phone: "cand-phone",
  city: "cand-city", experience: "cand-experience", notes: "cand-notes",
};

function validateCandidate(form: FormState) {
  return collectErrors<ErrorField>({
    firstName: check(form.firstName, required("Enter the applicant's first name."), maxLen(LIMITS.name)),
    lastName: check(form.lastName, maxLen(LIMITS.name)),
    email: check(
      form.email,
      required("Enter the applicant's email, like name@company.com."),
      email("That email doesn't look complete. Use the form name@company.com."),
      maxLen(LIMITS.email),
    ),
    phone: check(form.phone, phone()),
    city: check(form.city, maxLen(LIMITS.name)),
    experience: check(form.experience, maxLen(LIMITS.notes)),
    notes: check(form.notes, maxLen(LIMITS.notes)),
  });
}

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

  // Resume, a new applicant added from this drawer had no way to attach one,
  // so their record could never be parsed. The file is uploaded on submit and
  // the API queues extraction from there.
  const [resumeFile, setResumeFile] = React.useState<File | null>(null);
  const [resumeError, setResumeError] = React.useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = React.useState(false);
  const [existingResume, setExistingResume] = React.useState<{ id: string; fileName: string } | null>(null);

  const { errors, validateAll, revalidate, reset, invalidProps } = useFormErrors<ErrorField>(
    () => validateCandidate(form),
    FIELD_IDS,
  );

  React.useEffect(() => {
    if (!open) return;
    setError(null);
    reset();
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
  }, [open, candidate, defaultJobId, reset]);

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
   * Windows has been known to hand over an empty string, a MIME allow-list
   * rejected perfectly good resumes. The extraction service reads the bytes
   * regardless, so the extension is the honest gate here.
   */
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!RESUME_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      setResumeError("Choose a PDF or Word document (.pdf, .doc or .docx).");
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setResumeError("This file is larger than 5 MB. Choose a smaller copy of the resume.");
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
      if (!res.ok) throw new Error(data.error || "The resume didn't upload. Try again, or remove it and save without one.");
      return { resumeId: data.resumeId, resumeFileName: resumeFile.name, resumeFileKey: data.fileKey };
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "The resume didn't upload. Try again, or remove it and save without one.");
      return null;
    } finally {
      setResumeUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || resumeUploading) return;
    const failing = Object.keys(validateCandidate(form)) as ErrorField[];
    if (failing.length) {
      const tabs = new Set(failing.map((f) => FIELD_TAB[f]));
      if (!tabs.has(activeTab)) {
        const first = TABS.find((t) => tabs.has(t.id))!.id;
        flushSync(() => setActiveTab(first));
      }
    }
    if (!validateAll()) return;
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
      if (!res.ok) throw new Error(data.error || "The applicant couldn't be saved. Try again in a moment.");
      onSaved?.(data.application);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The applicant couldn't be saved. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  const isPermanentAuth = ["US Citizen", "Green Card"].includes(form.workAuthorization);
  const busy = submitting || resumeUploading;
  const tabHasError = (tab: TabId) =>
    (Object.keys(errors) as ErrorField[]).some((f) => FIELD_TAB[f] === tab);
  const visaWarning = workAuthExpires(form.workAuthorization)
    ? pastDateWarning(form.visaExpiry, "This date has passed. Check it, or update the work authorization.")
    : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" showCloseButton={false} overlayClassName="bg-[var(--adm-scrim)]" className="flex w-full flex-col gap-0 bg-[var(--adm-surface-sunken)] p-0 sm:max-w-[560px]">
        <div className="flex flex-shrink-0 items-start justify-between gap-3 border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface)] px-4 pb-0 pt-4">
          <div className="min-w-0">
            <SheetTitle className="truncate text-[16px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">
              {mode === "create" ? "Add applicant" : "Edit applicant"}
            </SheetTitle>
            <SheetDescription className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-mute)]">
              {mode === "create" ? "Enter the applicant's details below." : "Update this applicant's information."}
            </SheetDescription>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div role="tablist" aria-label="Applicant sections" className="flex flex-shrink-0 gap-1 overflow-x-auto border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "-mb-px inline-flex h-10 flex-none items-center gap-1.5 border-b-2 px-2.5 text-[13px] font-medium transition-colors duration-150",
                  isActive
                    ? "border-[var(--adm-accent)] text-[var(--adm-ink)]"
                    : "border-transparent text-[var(--adm-ink-mute)] hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]",
                )}
              >
                <tab.icon
                  className={cn("h-3.5 w-3.5", isActive ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")}
                  aria-hidden="true"
                />
                {tab.label}
                {tabHasError(tab.id) && (
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-[var(--adm-danger)]" role="img" aria-label="has errors" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} onBlur={revalidate} noValidate className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            <FormErrorBanner message={error} onDismiss={() => setError(null)} />

            {activeTab === "profile" && (
              <>
                <FormSection icon={IconUser} title="Personal info">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="First name" required htmlFor={FIELD_IDS.firstName} error={errors.firstName}>
                      <FormInput id={FIELD_IDS.firstName} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Jane" {...invalidProps("firstName")} />
                    </Field>
                    <Field label="Last name" htmlFor={FIELD_IDS.lastName} error={errors.lastName}>
                      <FormInput id={FIELD_IDS.lastName} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Smith" {...invalidProps("lastName")} />
                    </Field>
                    <Field label="Email" required htmlFor={FIELD_IDS.email} error={errors.email}>
                      <FormInput id={FIELD_IDS.email} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="jane@example.com" {...invalidProps("email")} />
                    </Field>
                    <Field label="Phone" htmlFor={FIELD_IDS.phone} error={errors.phone}>
                      <FormInput id={FIELD_IDS.phone} type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+1 (555) 000-0000" {...invalidProps("phone")} />
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={IconLocation} title="Location">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="City" htmlFor={FIELD_IDS.city} error={errors.city}>
                      <FormInput id={FIELD_IDS.city} value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="Austin" {...invalidProps("city")} />
                    </Field>
                    <Field label="State">
                      <FormSelect value={form.state} onChange={(e) => set("state", e.target.value)}>
                        <option value="">Select state…</option>
                        {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                      </FormSelect>
                    </Field>
                  </div>
                </FormSection>

                <FormSection icon={IconJob} title="Position and pipeline">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    <Field label="Talent bench">
                      <label className="flex h-9 cursor-pointer items-center gap-2.5 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 transition-colors hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]">
                        <input type="checkbox" autoComplete="off" checked={form.addToTalentBench} onChange={(e) => set("addToTalentBench", e.target.checked)} className="size-4 shrink-0 rounded border-[var(--adm-line)] accent-[var(--adm-accent)]" />
                        <span className="text-[14px] text-[var(--adm-ink)]">Add to bench</span>
                      </label>
                    </Field>
                    {form.addToTalentBench && (
                      <Field label="Talent pool" helper={POOL_META[form.benchType].hint}>
                        <FormSelect value={form.benchType} onChange={(e) => set("benchType", e.target.value as BenchType)}>
                          {POOL_ORDER.map((p) => (
                            <option key={p} value={p}>
                              {POOL_META[p].label}, {POOL_META[p].badge.toLowerCase()}
                            </option>
                          ))}
                        </FormSelect>
                      </Field>
                    )}
                  </div>
                </FormSection>
              </>
            )}

            {activeTab === "resume" && (
              <FormSection icon={IconFile} title="Resume">
                <div className="space-y-3">
                  {resumeFile ? (
                    <div className="flex items-center gap-3 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-2.5">
                      <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-[var(--adm-ink)]">{resumeFile.name}</p>
                        <p className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                          {(resumeFile.size / 1024).toFixed(0)} KB · ready to upload
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setResumeFile(null)}
                        aria-label="Remove selected resume"
                        className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : existingResume ? (
                    <div className="flex items-center gap-3 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-2.5">
                      <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-success-ink)]" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-[var(--adm-ink)]">{existingResume.fileName}</p>
                        <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">Currently on file</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExistingResume(null)}
                        aria-label="Detach resume"
                        className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
                      >
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  ) : null}

                  {!resumeFile && (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--adm-line-strong)] bg-[var(--adm-surface)] px-4 py-6 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]">
                      <input
                        type="file"
                        accept={RESUME_EXTENSIONS.join(",")}
                        onChange={handleResumeSelect}
                        className="sr-only"
                      />
                      <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      <span className="text-center">
                        <span className="block text-[13.5px] font-medium text-[var(--adm-ink)]">
                          {existingResume ? "Upload a replacement" : "Upload resume"}
                        </span>
                        <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">PDF or Word · max 5MB</span>
                      </span>
                    </label>
                  )}

                  {resumeError && (
                    <p role="alert" className="flex items-start gap-2 rounded-[10px] bg-[var(--adm-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--adm-danger-ink)]">
                      <IconWarning className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                      {resumeError}
                    </p>
                  )}

                  <p className="flex items-start gap-2 rounded-[10px] bg-[var(--adm-surface-sunken)] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                    <IconSparkles className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                    Saving with a resume attached extracts the full profile, work history, education,
                    skills, certifications and projects, onto the candidate record. It usually takes
                    under a minute and appears on their page automatically.
                  </p>
                </div>
              </FormSection>
            )}

            {activeTab === "skills" && (
              <>
                <FormSection icon={IconJob} title="Skills">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <FormInput
                        aria-label="Add a skill"
                        value={form.skillInput}
                        onChange={(e) => set("skillInput", e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); addSkill(form.skillInput); }
                          if (e.key === ",") { e.preventDefault(); addSkill(form.skillInput); }
                        }}
                        placeholder="Type a skill and press Enter…"
                      />
                      <WorkspaceButton onClick={() => addSkill(form.skillInput)} aria-label="Add skill" className="w-9 flex-shrink-0 px-0">
                        <Plus aria-hidden="true" />
                      </WorkspaceButton>
                    </div>

                    {form.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <span key={skill} className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-accent-soft)] py-0.5 pl-2 pr-0.5 text-[12.5px] font-medium text-[var(--adm-accent)]">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
                              aria-label={`Remove ${skill}`}
                              className="grid h-5 w-5 place-items-center rounded-[6px] transition-colors hover:bg-[var(--adm-accent-tint)]"
                            >
                              <X className="h-3 w-3" aria-hidden="true" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div>
                      <p className="mb-2 text-[12.5px] text-[var(--adm-ink-subtle)]">Common skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COMMON_SKILLS.filter((s) => !form.skills.includes(s)).map((skill) => (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => addSkill(skill)}
                            className="inline-flex h-7 items-center gap-1 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2 text-[12.5px] text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
                          >
                            <Plus className="h-3 w-3 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                            {skill}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </FormSection>

                <FormSection icon={IconFile} title="Experience">
                  <Field label="Experience summary" htmlFor={FIELD_IDS.experience} error={errors.experience}>
                    <FormTextarea id={FIELD_IDS.experience} {...invalidProps("experience")} rows={5} value={form.experience} onChange={(e) => set("experience", e.target.value)} placeholder="Brief summary of the candidate's experience, industries, key achievements…" />
                  </Field>
                </FormSection>
              </>
            )}

            {activeTab === "visa" && (
              <FormSection icon={IconShield} title="Work authorization and visa">
                <div className="space-y-4">
                  <Field label="Work authorization / visa status">
                    <FormSelect value={form.workAuthorization} onChange={(e) => set("workAuthorization", e.target.value)}>
                      <option value="">Select status…</option>
                      {WORK_AUTH_GROUPS.map((g) => (
                        <optgroup key={g.label} label={g.label}>
                          {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </optgroup>
                      ))}
                    </FormSelect>
                  </Field>

                  {/* Only where an expiry is a real fact */}
                  {workAuthExpires(form.workAuthorization) && (
                    <Field label="Visa or OPT expiry date" htmlFor="cand-visa-expiry">
                      <FormInput id="cand-visa-expiry" type="date" value={form.visaExpiry} onChange={(e) => set("visaExpiry", e.target.value)} />
                      <FieldWarning>{visaWarning}</FieldWarning>
                    </Field>
                  )}

                  <Field label="Sponsorship">
                    <label className="flex cursor-pointer items-center gap-3 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-2.5 transition-colors hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)]">
                      <input
                        type="checkbox"
                        autoComplete="off"
                        checked={form.visaSponsorshipRequired}
                        onChange={(e) => set("visaSponsorshipRequired", e.target.checked)}
                        className="size-4 shrink-0 rounded border-[var(--adm-line)] accent-[var(--adm-accent)]"
                      />
                      <div>
                        <p className="text-[14px] font-medium text-[var(--adm-ink)]">Requires sponsorship</p>
                        <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">Candidate will need H-1B or similar sponsorship</p>
                      </div>
                    </label>
                  </Field>

                  {form.workAuthorization && (
                    <p
                      className={cn(
                        "rounded-[10px] px-3 py-2.5 text-[13px] leading-relaxed",
                        isPermanentAuth
                          ? "bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]"
                          : "bg-[var(--adm-warning-soft)] text-[var(--adm-warning-ink)]",
                      )}
                    >
                      {isPermanentAuth
                        ? "This candidate has permanent work authorization in the US."
                        : form.workAuthorization === "H1-B"
                          ? "H-1B holders require employer sponsorship to maintain status."
                          : ["OPT", "CPT"].includes(form.workAuthorization)
                            ? "OPT/CPT is time-limited. Verify the expiry date before extending an offer."
                            : "Verify work authorization documents before extending an offer."}
                    </p>
                  )}
                </div>
              </FormSection>
            )}

            {activeTab === "notes" && (
              <>
                <FormSection icon={IconStar} title="Rating">
                  <Field label="Candidate rating">
                    <div className="flex h-9 items-center gap-2 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3">
                      <StarRating rating={form.rating} onRate={(n) => set("rating", n === form.rating ? 0 : n)} size="md" />
                      {form.rating > 0 && (
                        <span className="ml-1 text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{form.rating}/5</span>
                      )}
                    </div>
                  </Field>
                </FormSection>

                <FormSection icon={IconFile} title="Internal notes">
                  <Field label="Notes" hint="Internal only, not visible to the candidate" htmlFor={FIELD_IDS.notes} error={errors.notes}>
                    <FormTextarea id={FIELD_IDS.notes} {...invalidProps("notes")} rows={8} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Interview impressions, concerns, next steps…" />
                  </Field>
                </FormSection>
              </>
            )}
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
            <WorkspaceButton variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
              Cancel
            </WorkspaceButton>
            <WorkspaceButton type="submit" variant="primary" disabled={busy} className="flex-1 sm:flex-none">
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
              {resumeUploading ? "Uploading resume…" : mode === "create" ? "Add applicant" : "Save changes"}
            </WorkspaceButton>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
