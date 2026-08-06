"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, X, Loader2,
} from "lucide-react";
import {
  IconUser, IconLocation, IconJob, IconShield, IconFile, IconPipeline,
  IconWarning, IconUpload, IconDownload, IconTrash, IconStar, IconEdit, IconSave,
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
import { AdminFormSkeleton } from "@/components/admin/skeletons";
import { Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { StarRating } from "@/components/admin/star-rating";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/** Ties the header / action-bar submit buttons to the form they sit outside of. */
const FORM_ID = "applicant-edit-form";


function EditApplicationInner() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      fetch(`/api/applications/${id}`).then((r) => r.json()),
      fetch("/api/jobs").then((r) => r.json()),
    ]).then(([appData, jobsData]) => {
      const app = appData.application;
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
    }).catch(() => setError("Failed to load application"))
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
      setResumeError("Upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) { setResumeError("File must be under 5MB"); return; }
    setResumeFile(file);
    setExistingResume(null); // new file replaces existing
  };

  const uploadResume = async (): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      // The route uploads to S3 server-side (multipart/form-data) to avoid
      // browser→S3 CORS issues — send the file itself, not a presign request.
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", id);
      const res = await fetch("/api/resume/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return { resumeId: data.resumeId, fileName: resumeFile.name, fileKey: data.fileKey };
    } catch (err) {
      setResumeError(err instanceof Error ? err.message : "Upload failed");
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
    } catch { toast.error("Failed to download resume"); }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      setError("First name and email are required.");
      return;
    }
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
      if (!res.ok) throw new Error(data.error || "Failed to save");
      router.push(`/admin/candidates/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  // Sponsorship and expiry are properties of the authorization type, so they
  // come from the shared table rather than a hardcoded pair of values.
  const isPermanent = !workAuthNeedsSponsorship(workAuth);
  const showExpiry  = workAuthExpires(workAuth);
  const busy = submitting || resumeUploading;
  const recordName = `${firstName} ${lastName}`.trim();

  if (loading) return <AdminFormSkeleton />;

  return (
    <div className="space-y-5">

      {/* Back leads the page, ahead of the title — same position on every
          record screen. */}
      <button
        type="button"
        onClick={() => router.back()}
        className="-mb-1 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <PageHeader
        title={recordName || "Edit Applicant"}
        subtitle={email || "Update the candidate record and pipeline stage"}
        icon={IconEdit}
        // Save and Cancel live in the anchored bar at the foot of the form and
        // were ALSO repeated up here, so a long form offered two identical
        // commits at once. Back has moved to the top of the page.
      />

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-4 py-3">
          <IconWarning className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-danger)]" aria-hidden="true" />
          <p className="text-sm text-[var(--adm-danger)]">{error}</p>
        </div>
      )}

      <form id={FORM_ID} onSubmit={handleSubmit} className="grid items-start gap-4 lg:grid-cols-3">

        {/* ── Primary record ── */}
        <div className="space-y-4 lg:col-span-2">

          <AdminCard>
            <AdminCardHeader icon={IconUser} title="Candidate details" />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="First name" required htmlFor="firstName">
                <FormInput id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
              </Field>
              <Field label="Last name" htmlFor="lastName">
                <FormInput id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </Field>
              <Field label="Email address" required htmlFor="email">
                <FormInput id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone number" htmlFor="phone">
                <FormInput id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader icon={IconLocation} title="Location" />
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
              <Field label="City" htmlFor="city">
                <FormInput id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
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
            <AdminCardHeader icon={IconJob} title="Skills & experience" count={skills.length} />
            <div className="space-y-5 p-5">
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
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput)}
                    aria-label="Add skill"
                    className="flex-none rounded-[8px] bg-[var(--adm-accent)] px-3 text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </Field>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-accent-soft)] py-1 pl-2.5 pr-1.5 text-xs font-semibold text-[var(--adm-accent)]">
                      {s}
                      <button
                        type="button"
                        aria-label={`Remove ${s}`}
                        onClick={() => setSkills((p) => p.filter((x) => x !== s))}
                        className="rounded-[4px] p-0.5 transition-colors hover:bg-[var(--adm-surface)]/70"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1 text-xs text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)] hover:text-[var(--adm-accent)]"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Experience summary" htmlFor="experience">
                <FormTextarea
                  id="experience"
                  rows={4}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Brief summary of experience, industries, key achievements…"
                />
              </Field>
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader icon={IconFile} title="Documents" />
            <div className="space-y-3 p-5">
              {/* Attached resume already on the record */}
              {existingResume && !resumeFile && (
                <div className="flex items-center gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                    <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{existingResume.fileName}</p>
                    <p className="text-xs text-[var(--adm-ink-subtle)]">Attached resume</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadResume}
                    aria-label="Download resume"
                    title="Download"
                    className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]"
                  >
                    <IconDownload className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setExistingResume(null)}
                    aria-label="Remove resume"
                    title="Remove"
                    className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
                  >
                    <IconTrash className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Newly selected file, replaces the attachment on save */}
              {resumeFile && (
                <div className="flex items-center gap-3 rounded-[6px] border border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] p-3">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-success-soft)]">
                    <IconFile className="h-4 w-4 text-[var(--adm-success)]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{resumeFile.name}</p>
                    <p className="text-xs font-medium text-[var(--adm-success)]">Will overwrite the current resume on save</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    aria-label="Remove resume"
                    className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {!resumeFile && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-6 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="sr-only" />
                  <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" />
                  <span className="text-center">
                    <span className="block text-sm font-semibold text-[var(--adm-ink-mute)]">
                      {existingResume ? "Replace resume" : "Upload resume"}
                    </span>
                    <span className="mt-0.5 block text-xs text-[var(--adm-ink-subtle)]">PDF or Word · max 5MB</span>
                  </span>
                </label>
              )}

              {resumeError && (
                <p role="alert" className="flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] px-2.5 py-2 text-xs text-[var(--adm-danger)]">
                  <IconWarning className="h-3.5 w-3.5 flex-none text-[var(--adm-danger)]" aria-hidden="true" />
                  {resumeError}
                </p>
              )}
            </div>
          </AdminCard>
        </div>

        {/* ── Placement & assessment ── */}
        <div className="space-y-4">

          <AdminCard>
            <AdminCardHeader icon={IconPipeline} title="Position & pipeline" />
            <div className="space-y-4 p-5">
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

              <label
                htmlFor="addToTalentBench"
                className="flex cursor-pointer items-start gap-2.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3 py-2.5"
              >
                <Checkbox
                  id="addToTalentBench"
                  checked={addToTalentBench}
                  onCheckedChange={(v) => setAddToTalentBench(v === true)}
                  className="mt-0.5 border-[var(--adm-line)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-[var(--adm-ink)]">Add to talent bench</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--adm-ink-subtle)]">Keep this candidate available for future requisitions.</span>
                </span>
              </label>

              {addToTalentBench && (
                <Field label="Talent pool" htmlFor="benchType" helper={POOL_META[benchType].hint}>
                  <FormSelect id="benchType" value={benchType} onChange={(e) => setBenchType(e.target.value as BenchType)}>
                    {POOL_ORDER.map((p) => (
                      <option key={p} value={p}>
                        {POOL_META[p].label} — {POOL_META[p].badge.toLowerCase()}
                      </option>
                    ))}
                  </FormSelect>
                </Field>
              )}
            </div>
          </AdminCard>

          <AdminCard>
            <AdminCardHeader icon={IconShield} title="Work authorization" />
            <div className="space-y-4 p-5">
              <Field label="Visa / authorization" htmlFor="workAuth">
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
                </Field>
              )}

              <label htmlFor="needsSponsorship" className="flex cursor-pointer items-center gap-2.5">
                <Checkbox
                  id="needsSponsorship"
                  checked={needsSponsorship}
                  onCheckedChange={(v) => setNeedsSponsorship(v === true)}
                  className="border-[var(--adm-line)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]"
                />
                <span className="text-sm text-[var(--adm-ink-mute)]">Requires sponsorship</span>
              </label>

              {workAuth && (
                <p className={cn(
                  "rounded-[6px] border p-3 text-xs leading-relaxed",
                  isPermanent
                    ? "border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] text-[var(--adm-success)]"
                    : "border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)] text-[var(--adm-warning)]",
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
            <AdminCardHeader icon={IconStar} title="Rating & notes" />
            <div className="space-y-4 p-5">
              <Field label="Candidate rating">
                <div className="flex items-center gap-2 py-1">
                  <StarRating rating={rating} onRate={(n) => setRating(n === rating ? 0 : n)} size="lg" />
                  <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{rating > 0 ? `${rating}/5` : "—"}</span>
                </div>
              </Field>

              <Field label="Internal notes" htmlFor="notes" helper="Visible to staff only">
                <FormTextarea
                  id="notes"
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

      {/* ── Anchored action bar — Save stays reachable on a long form ── */}
      <div className="sticky bottom-0 z-20 -mx-5 -mb-5 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/90 px-5 py-3 backdrop-blur lg:-mx-6 lg:-mb-6 lg:px-6">
        {error && <p className="mr-auto text-[13px] font-medium text-[var(--adm-danger)]">{error}</p>}
        <WorkspaceButton type="button" onClick={() => router.push("/admin/applications")}>
          Cancel
        </WorkspaceButton>
        <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSave className="h-4 w-4" />}
          {resumeUploading ? "Uploading resume…" : "Save Changes"}
        </WorkspaceButton>
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
