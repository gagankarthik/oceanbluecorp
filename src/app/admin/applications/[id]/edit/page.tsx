"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, X, Loader2, SearchX,
} from "lucide-react";
import { EmptyState } from "@/components/admin/empty-state";
import {
  IconFile, IconWarning, IconUpload, IconDownload, IconTrash, IconSave,
} from "@/components/admin/icons";
import type { BenchType, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  PIPELINE_STAGES, SOURCE_OPTIONS, US_STATES, COMMON_SKILLS,
  WORK_AUTH_OPTIONS, WORK_AUTH_GROUPS, workAuthExpires, workAuthNeedsSponsorship,
  HIRE_TYPE_OPTIONS, type AppStatus,
} from "@/components/admin/theme";
import { POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Skel } from "@/components/admin/skeletons";
import { Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { FormErrorBanner, FieldWarning } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import {
  check, collectErrors, required, maxLen, email as emailRule, phone as phoneRule,
  pastDateWarning, LIMITS,
} from "@/lib/form-validation";
import { StarRating } from "@/components/admin/star-rating";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** Ties the action-bar submit button to the form it sits outside of. */
const FORM_ID = "applicant-edit-form";

const backLinkCls = "-ml-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)]";
const wellCls = "rounded-[12px] border px-4 py-3";
const inlineErrorCls = "flex items-center gap-1.5 rounded-[10px] bg-[var(--adm-danger-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--adm-danger-ink)]";
const skillChipCls = "inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-accent-soft)] py-0.5 pl-2 pr-1 text-[12.5px] font-medium text-[var(--adm-accent)]";
const suggestionCls = "rounded-[6px] border border-dashed border-[var(--adm-line-strong)] px-2 py-0.5 text-[12.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]";
const iconBtnCls = "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]";
const iconBtnDangerCls = "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]";
const dropzoneCls = "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--adm-line-strong)] bg-[var(--adm-surface-sunken)] p-5 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)] focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]";
const checkWellCls = "flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3.5 py-3 transition-colors hover:border-[var(--adm-line-strong)]";
const checkboxCls = "border-[var(--adm-line-strong)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]";
/** Bleeds to the edges of main's `p-4 sm:p-5 lg:p-6` so it spans the pane. */
const actionBarCls = "sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6";

function EditApplicationInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [missing, setMissing] = useState(false);

  // Personal
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [phone, setPhone]         = useState("");

  // Location
  const [city, setCity]   = useState("");
  const [state, setState] = useState("");

  // Position
  const [jobId, setJobId]       = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus]     = useState<AppStatus>("pending");
  const [source, setSource]     = useState("");
  const [hireType, setHireType] = useState("");
  const [addToTalentBench, setAddToTalentBench] = useState(false);
  const [benchType, setBenchType] = useState<BenchType>("external");

  // Skills
  const [skills, setSkills]         = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("");

  // Visa
  const [workAuth, setWorkAuth]                 = useState("");
  const [visaExpiry, setVisaExpiry]             = useState("");
  const [needsSponsorship, setNeedsSponsorship] = useState(false);

  // Rating / Notes
  const [rating, setRating] = useState(0);
  const [notes, setNotes]   = useState("");

  // Resume
  const [resumeFile, setResumeFile]           = useState<File | null>(null);
  const [resumeError, setResumeError]         = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [existingResume, setExistingResume]   = useState<{ id: string; fileName: string; fileKey?: string } | null>(null);

  // Load application + jobs in parallel
  useEffect(() => {
    Promise.all([
      fetch(`/api/applications/${id}`).then((r) => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
      fetch("/api/jobs?fields=summary").then((r) => r.json()),
    ]).then(([appData, jobsData]) => {
      const app = appData?.application;
      if (!app) { setMissing(true); return; }
      const jArr: Job[] = jobsData.jobs || [];
      setJobs(jArr);

      if (app) {
        const fn = app.firstName || app.name?.split(" ")[0] || "";
        const ln = app.lastName  || app.name?.split(" ").slice(1).join(" ") || "";
        setFirstName(fn);
        setLastName(ln);
        setEmail(app.email || "");
        setPhone(app.phone || "");
        setCity(app.city || "");
        setState(app.state || "");
        setJobId(app.jobId || "");
        setJobTitle(app.jobTitle || "");
        setStatus((app.status as AppStatus) || "pending");
        setSource(app.source || "");
        setHireType(app.hireType || "");
        setAddToTalentBench(!!app.addToTalentBench);
        setBenchType(poolOf(app));
        setSkills(app.skills || []);
        setExperience(app.experience || "");
        setWorkAuth(app.workAuthorization || "");
        setNeedsSponsorship(!!app.visaSponsorshipRequired);
        setVisaExpiry(app.visaExpiry || "");
        setRating(app.rating || 0);
        setNotes(app.notes || "");
        if (app.resumeId && app.resumeFileName) {
          setExistingResume({ id: app.resumeId, fileName: app.resumeFileName, fileKey: app.resumeFileKey });
        }
      }
    }).catch(() => setError("This applicant could not be loaded. Refresh the page to try again."))
      .finally(() => setLoading(false));
  }, [id]);

  const addSkill = (s: string) => {
    const t = s.trim();
    if (!t || skills.includes(t)) return;
    setSkills((p) => [...p, t]);
    setSkillInput("");
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);
    if (!file) return;
    // Extension, not MIME type: browsers report .doc/.docx inconsistently and
    // a MIME allow-list turned away valid resumes.
    const name = file.name.toLowerCase();
    if (![".pdf", ".doc", ".docx"].some((ext) => name.endsWith(ext))) {
      setResumeError("Upload a PDF or Word document (.pdf, .doc, .docx).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setResumeError("Choose a file under 5 MB."); return; }
    setResumeFile(file);
    setExistingResume(null); // new file replaces existing
  };

  const uploadResume = async (): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      // The route uploads to S3 server-side (multipart/form-data) to avoid
      // browser→S3 CORS issues, send the file itself, not a presign request.
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", id);
      const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "The resume could not be uploaded. Try again, or save without it.");
      return { resumeId: data.resumeId, fileName: resumeFile.name, fileKey: data.fileKey };
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "The resume could not be uploaded. Try again, or save without it.");
      return null;
    } finally {
      setResumeUploading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!existingResume) return;
    try {
      const res = await fetch(`/api/resume/${existingResume.id}`);
      const data = await res.json();
      if (res.ok) window.open(data.downloadUrl, "_blank");
    } catch { toast.error("The resume could not be downloaded. Try again."); }
  };

  const { errors, validateAll, revalidate, invalidProps } = useFormErrors(() => collectErrors({
    firstName:  check(firstName, required("Enter the candidate's first name."), maxLen(LIMITS.name)),
    lastName:   check(lastName, maxLen(LIMITS.name)),
    email:      check(email, required("Enter the candidate's email, like name@company.com."), emailRule("Enter a valid email, like name@company.com."), maxLen(LIMITS.email)),
    phone:      check(phone, phoneRule()),
    city:       check(city, maxLen(LIMITS.name)),
    experience: check(experience, maxLen(LIMITS.notes)),
    notes:      check(notes, maxLen(LIMITS.notes)),
  }));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (submitting) return;
    if (!validateAll()) return;
    setSubmitting(true);
    setError(null);
    try {
      let resumePayload: Record<string, string> = {};
      if (resumeFile) {
        const uploaded = await uploadResume();
        if (!uploaded) { setSubmitting(false); return; }
        resumePayload = { resumeId: uploaded.resumeId, resumeFileName: uploaded.fileName, resumeFileKey: uploaded.fileKey };
      } else if (existingResume) {
        resumePayload = { resumeId: existingResume.id, resumeFileName: existingResume.fileName };
      }

      const job = jobs.find((j) => j.id === jobId);
      const payload = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        name:      `${firstName.trim()} ${lastName.trim()}`.trim(),
        email:     email.trim(),
        phone:     phone.trim(),
        status,
        jobId:             jobId    || undefined,
        jobTitle:          jobTitle || job?.title || undefined,
        source:            source   || undefined,
        hireType:          hireType || undefined,
        workAuthorization: workAuth || undefined,
        visaSponsorshipRequired: needsSponsorship,
        // Sent unconditionally, not spread-if-truthy: on an edit form an empty
        // string is a real instruction to clear the date. Omitting the key made
        // the server keep the old value, so an expiry could never be removed.
        visaExpiry,
        city, state, skills, experience, notes,
        rating: rating || undefined,
        addToTalentBench,
        ...(addToTalentBench && { benchAddedBy: user?.email || user?.id, benchType }),
        changedBy:     user?.id,
        changedByName: user?.name || "Admin",
        ...resumePayload,
      };

      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Your changes could not be saved. Try again in a moment.");
      router.push(`/admin/candidates/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Your changes could not be saved. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  // Sponsorship and expiry are properties of the authorization type, so they
  // come from the shared table rather than a hardcoded pair of values.
  const isPermanent = !workAuthNeedsSponsorship(workAuth);
  const showExpiry  = workAuthExpires(workAuth);
  const busy = submitting || resumeUploading;
  const recordName = `${firstName} ${lastName}`.trim();

  if (loading) return <EditSkeleton />;

  if (missing) {
    return (
      <div className="space-y-4 lg:space-y-5">
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <AdminCard>
          <EmptyState
            icon={SearchX}
            title="This applicant doesn't exist"
            description="The record may have been removed, or the link is out of date."
            action={
              <WorkspaceButton onClick={() => router.push("/admin/applications")}>Back to applications</WorkspaceButton>
            }
          />
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <PageHeader
          className="mb-0 mt-2"
          title={recordName || "Edit applicant"}
          subtitle={email || "Update the candidate record and pipeline stage"}
        />
      </div>

      <FormErrorBanner message={error} onDismiss={() => setError(null)} />

      <form id={FORM_ID} onSubmit={handleSubmit} onBlur={revalidate} noValidate className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <AdminCard>
            <AdminCardHeader title="Candidate details" />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="First name" required htmlFor="firstName" error={errors.firstName}>
                <FormInput id="firstName" {...invalidProps("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
              </Field>
              <Field label="Last name" htmlFor="lastName" error={errors.lastName}>
                <FormInput id="lastName" {...invalidProps("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </Field>
              <Field label="Email address" required htmlFor="email" error={errors.email}>
                <FormInput id="email" type="email" {...invalidProps("email")} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone number" htmlFor="phone" error={errors.phone}>
                <FormInput id="phone" type="tel" {...invalidProps("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Location" />
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              <Field label="City" htmlFor="city" error={errors.city}>
                <FormInput id="city" {...invalidProps("city")} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
              </Field>
              <Field label="State" htmlFor="state">
                <FormSelect id="state" value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state…</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </FormSelect>
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Skills and experience" count={skills.length} />
            <div className="space-y-4 p-4">
              <Field label="Skills" htmlFor="skillInput" helper="Press Enter or comma to add">
                <div className="flex gap-2">
                  <FormInput
                    id="skillInput"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
                      if (e.key === ",")     { e.preventDefault(); addSkill(skillInput); }
                    }}
                    placeholder="Type a skill and press Enter…"
                  />
                  <WorkspaceButton onClick={() => addSkill(skillInput)} aria-label="Add skill" className="w-9 px-0">
                    <Plus aria-hidden="true" />
                  </WorkspaceButton>
                </div>
              </Field>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className={skillChipCls}>
                      {s}
                      <button
                        type="button"
                        aria-label={`Remove ${s}`}
                        onClick={() => setSkills((p) => p.filter((x) => x !== s))}
                        className="rounded-[4px] p-0.5 transition-colors hover:bg-[var(--adm-accent)]/15"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-[13px] font-medium text-[var(--adm-ink-mute)]">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button key={s} type="button" onClick={() => addSkill(s)} className={suggestionCls}>
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Experience summary" htmlFor="experience" error={errors.experience}>
                <FormTextarea
                  id="experience"
                  {...invalidProps("experience")}
                  rows={4}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Brief summary of experience, industries, key achievements…"
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Documents" />
            <div className="space-y-3 p-4">
              {existingResume && !resumeFile && (
                <div className={cn(wellCls, "flex items-center gap-3 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] py-3")}>
                  <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{existingResume.fileName}</p>
                    <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">Attached resume</p>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      onClick={handleDownloadResume}
                      aria-label="Download resume"
                      title="Download"
                      className={iconBtnCls}
                    >
                      <IconDownload className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setExistingResume(null)}
                      aria-label="Remove resume"
                      title="Remove"
                      className={iconBtnDangerCls}
                    >
                      <IconTrash className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}

              {resumeFile && (
                <div className={cn(wellCls, "flex items-center gap-3 border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] py-3")}>
                  <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-success-ink)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{resumeFile.name}</p>
                    <p className="text-[12.5px] font-medium text-[var(--adm-success-ink)]">Replaces the current resume on save</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    aria-label="Remove resume"
                    className={iconBtnDangerCls}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {!resumeFile && (
                <label className={dropzoneCls}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="sr-only" />
                  <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <span className="text-center">
                    <span className="block text-[14px] font-medium text-[var(--adm-ink)]">
                      {existingResume ? "Replace resume" : "Upload resume"}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">PDF or Word, up to 5MB</span>
                  </span>
                </label>
              )}

              {resumeError && (
                <p role="alert" className={inlineErrorCls}>
                  <IconWarning className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                  {resumeError}
                </p>
              )}
            </div>
          </AdminCard>
        </div>

        <div className="min-w-0 space-y-4">
          <AdminCard>
            <AdminCardHeader title="Position and pipeline" />
            <div className="space-y-4 p-4">
              <Field label="Job posting" htmlFor="jobId">
                <FormSelect
                  id="jobId"
                  value={jobId}
                  onChange={(e) => {
                    const j = jobs.find((x) => x.id === e.target.value);
                    setJobId(e.target.value);
                    setJobTitle(j?.title || "");
                  }}
                >
                  <option value="">Unassigned</option>
                  {jobs.filter((j) => j.status === "open" || j.status === "active").map((j) => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Pipeline stage" htmlFor="status">
                <FormSelect id="status" value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}>
                  {PIPELINE_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Source" htmlFor="source">
                <FormSelect id="source" value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Select…</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </Field>

              <Field
                label="Type of hire"
                htmlFor="hireType"
                helper={HIRE_TYPE_OPTIONS.find((o) => o.value === hireType)?.hint}
              >
                <FormSelect id="hireType" value={hireType} onChange={(e) => setHireType(e.target.value)}>
                  <option value="">Select…</option>
                  {HIRE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </FormSelect>
              </Field>

              <label htmlFor="addToTalentBench" className={checkWellCls}>
                <Checkbox
                  id="addToTalentBench"
                  checked={addToTalentBench}
                  onCheckedChange={(v) => setAddToTalentBench(v === true)}
                  className={cn("mt-0.5", checkboxCls)}
                />
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium text-[var(--adm-ink)]">Add to talent bench</span>
                  <span className="mt-0.5 block text-[12.5px] text-[var(--adm-ink-subtle)]">Keep this candidate available for future requisitions.</span>
                </span>
              </label>

              {addToTalentBench && (
                <Field label="Talent pool" htmlFor="benchType" helper={POOL_META[benchType].hint}>
                  <FormSelect id="benchType" value={benchType} onChange={(e) => setBenchType(e.target.value as BenchType)}>
                    {POOL_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {POOL_META[p].label} , {POOL_META[p].badge.toLowerCase()}
                      </option>
                    ))}
                  </FormSelect>
                </Field>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Work authorization" />
            <div className="space-y-4 p-4">
              <Field label="Visa or authorization" htmlFor="workAuth">
                <FormSelect id="workAuth" value={workAuth} onChange={(e) => setWorkAuth(e.target.value)}>
                  <option value="">Select…</option>
                  {WORK_AUTH_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  ))}
                  {/* Keep a legacy stored value selectable rather than silently blanking it. */}
                  {workAuth && !WORK_AUTH_OPTIONS.includes(workAuth) && (
                    <option value={workAuth}>{workAuth}</option>
                  )}
                </FormSelect>
              </Field>

              {showExpiry && (
                <Field label="Expiry date" htmlFor="visaExpiry">
                  <FormInput id="visaExpiry" type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="tabular-nums" />
                  <FieldWarning>{pastDateWarning(visaExpiry, "This authorization has already expired. Confirm the current status with the candidate.")}</FieldWarning>
                </Field>
              )}

              <label htmlFor="needsSponsorship" className="flex cursor-pointer items-center gap-2.5">
                <Checkbox
                  id="needsSponsorship"
                  checked={needsSponsorship}
                  onCheckedChange={(v) => setNeedsSponsorship(v === true)}
                  className={checkboxCls}
                />
                <span className="text-[14px] text-[var(--adm-ink-mute)]">Requires sponsorship</span>
              </label>

              {workAuth && (
                <p className={cn(
                  wellCls,
                  "py-2.5 text-[13px] leading-relaxed",
                  isPermanent
                    ? "border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] text-[var(--adm-success-ink)]"
                    : "border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)] text-[var(--adm-warning-ink)]",
                )}>
                  {isPermanent
                    ? "Permanent US work authorization."
                    : workAuth === "H1-B"
                      ? "H-1B requires employer sponsorship."
                      : ["OPT", "CPT"].includes(workAuth)
                        ? "OPT/CPT is time-limited, verify expiry before extending an offer."
                        : "Verify authorization docs before extending an offer."}
                </p>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader title="Rating and notes" />
            <div className="space-y-4 p-4">
              <Field label="Candidate rating">
                <div className="flex items-center gap-2 py-1">
                  <StarRating rating={rating} onRate={(n) => setRating(n === rating ? 0 : n)} size="lg" />
                  <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{rating > 0 ? `${rating}/5` : "–"}</span>
                </div>
              </Field>

              <Field label="Internal notes" htmlFor="notes" helper="Visible to staff only" error={errors.notes}>
                <FormTextarea
                  id="notes"
                  {...invalidProps("notes")}
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Interview impressions, concerns, next steps…"
                />
              </Field>
            </div>
          </AdminCard>
        </div>
      </form>

      <div className={actionBarCls}>
        <p className="min-w-0 text-[13px] font-medium text-[var(--adm-danger-ink)]">
          {Object.keys(errors).length > 0 ? "Fix the highlighted fields to save." : error}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceButton onClick={() => router.push("/admin/applications")}>
            Cancel
          </WorkspaceButton>
          <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <IconSave />}
            {resumeUploading ? "Uploading resume…" : "Save changes"}
          </WorkspaceButton>
        </div>
      </div>
    </div>
  );
}

/** Mirrors the form: back link and title, then a two-thirds / one-third card grid. */
function EditSkeleton() {
  const card = (fields: number, cols: string) => (
    <div className="rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
      <div className="border-b border-[var(--adm-line-soft)] px-4 py-4">
        <Skel className="h-4 w-36" />
      </div>
      <div className={cn("grid gap-4 p-4", cols)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skel className="h-3.5 w-24" />
            <Skel className="h-9 w-full rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="space-y-4 lg:space-y-5" aria-busy="true" aria-label="Loading applicant">
      <div className="space-y-2">
        <Skel className="h-3.5 w-12" />
        <Skel className="h-6 w-56" />
        <Skel className="h-3.5 w-44" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {card(4, "grid-cols-1 sm:grid-cols-2")}
          {card(2, "grid-cols-1 sm:grid-cols-2")}
          {card(2, "grid-cols-1")}
        </div>
        <div className="space-y-4">
          {card(4, "grid-cols-1")}
          {card(1, "grid-cols-1")}
        </div>
      </div>
    </div>
  );
}

export default function EditApplicationPage() {
  return (
    <Suspense>
      <EditApplicationInner />
    </Suspense>
  );
}
