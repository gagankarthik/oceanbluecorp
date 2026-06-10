"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User2, MapPin, Briefcase, Shield, FileText,
  Plus, X, Loader2, AlertTriangle, BookmarkPlus,
  BookmarkCheck, ChevronRight, Upload, File, ExternalLink, Star,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { statusMeta, SOURCE_OPTIONS, US_STATES, type AppStatus } from "@/components/admin/theme";
import { FormSection, Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { StarRating } from "@/components/admin/star-rating";
import { cn } from "@/lib/utils";

const VISA_OPTIONS = [
  "US Citizen", "Green Card", "H1-B", "H4 EAD", "OPT", "CPT",
  "TN Visa", "E3 Visa", "L1 Visa", "O1 Visa", "Other",
];

const COMMON_SKILLS = [
  "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
  "C#", ".NET", "AWS", "Azure", "GCP", "SQL", "PostgreSQL", "MongoDB",
  "Docker", "Kubernetes", "SAP", "Salesforce", "Oracle", "Excel",
  "Power BI", "Tableau", "Agile", "Scrum",
];

const PIPELINE_OPTIONS: AppStatus[] = ["pending", "reviewing", "submitted", "interview", "offered", "hired"];

function NewApplicationInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user } = useAuth();

  const [jobs, setJobs] = useState<Job[]>([]);
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
  const [jobId, setJobId]   = useState(params.get("jobId") ?? "");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState<AppStatus>("pending");
  const [source, setSource] = useState("");
  const [addToTalentBench, setAddToTalentBench] = useState(false);

  // Skills
  const [skills, setSkills]       = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [experience, setExperience] = useState("");

  // Visa
  const [workAuth, setWorkAuth]           = useState("");
  const [visaExpiry, setVisaExpiry]       = useState("");
  const [needsSponsorship, setNeedsSponsorship] = useState(false);

  // Rating / Notes
  const [rating, setRating] = useState(0);
  const [notes, setNotes]   = useState("");

  // Resume
  const [resumeFile, setResumeFile]           = useState<File | null>(null);
  const [resumeError, setResumeError]         = useState<string | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((d) => {
        const list: Job[] = d.jobs || [];
        setJobs(list);
        if (jobId) {
          const found = list.find((j) => j.id === jobId);
          if (found) setJobTitle(found.title);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) { setResumeError("Upload a PDF or Word document"); return; }
    if (file.size > 5 * 1024 * 1024) { setResumeError("File must be under 5MB"); return; }
    setResumeFile(file);
  };

  const uploadResume = async (userId: string): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      // The route uploads to S3 server-side (multipart/form-data) to avoid
      // browser→S3 CORS issues — send the file itself, not a presign request.
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", userId);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!firstName.trim() || !email.trim()) {
      setError("First name and email are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // Upload resume first if selected; use a temp ID (will be replaced with actual app ID if needed)
      let resumePayload: Record<string, string> = {};
      if (resumeFile) {
        const tempId = `new-${Date.now()}`;
        const uploaded = await uploadResume(tempId);
        if (!uploaded) { setSubmitting(false); return; }
        resumePayload = { resumeId: uploaded.resumeId, resumeFileName: uploaded.fileName, resumeFileKey: uploaded.fileKey };
      }

      const job = jobs.find((j) => j.id === jobId);
      const payload = {
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        name:      `${firstName.trim()} ${lastName.trim()}`.trim(),
        email:     email.trim(),
        phone:     phone.trim(),
        status,
        jobId:             jobId     || undefined,
        jobTitle:          jobTitle  || job?.title || undefined,
        source:            source    || undefined,
        workAuthorization: workAuth  || undefined,
        city, state, skills, experience, notes,
        rating: rating || undefined,
        addToTalentBench,
        ...(addToTalentBench && { benchAddedBy: user?.email || user?.id }),
        createdBy:     user?.email || "admin",
        createdByName: user?.name  || "Admin",
        userId:    "anonymous",
        appliedAt: new Date().toISOString(),
        ...resumePayload,
      };

      const res = await fetch("/api/applications", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create applicant");
      router.push(`/admin/candidates/${data.application.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setSubmitting(false);
    }
  };

  const isPermanent = ["US Citizen", "Green Card"].includes(workAuth);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin/applications" className="hover:text-[var(--hz-cobalt)] transition-colors font-medium">Applications</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold">New Applicant</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/applications"
            className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || resumeUploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:opacity-60 transition shadow-sm shadow-[rgba(29,78,216,0.2)]"
          >
            {(submitting || resumeUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {resumeUploading ? "Uploading…" : "Add Applicant"}
          </button>
        </div>
      </div>

      {/* Page title */}
      <div className="flex items-start gap-3">
        <div className="hidden sm:flex w-9 h-9 rounded-xl bg-[var(--hz-cobalt-100)] items-center justify-center flex-shrink-0">
          <User2 className="w-[18px] h-[18px] text-[var(--hz-cobalt)]" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-[22px] font-bold tracking-tight text-slate-900 leading-tight">Add New Applicant</h1>
          <p className="text-sm text-slate-500 mt-0.5">Fill in the details below to create a new candidate record.</p>
        </div>
      </div>

      {/* Job context banner — shown when navigating from a specific job */}
      {jobId && jobTitle && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[var(--hz-cobalt-100)]/60 border border-[var(--hz-cobalt-100)] rounded-xl">
          <div className="w-8 h-8 bg-[var(--hz-cobalt-100)] rounded-lg flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-4 h-4 text-[var(--hz-cobalt)]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-[var(--hz-cobalt)] uppercase tracking-wider">Applying for</p>
            <p className="text-sm font-semibold text-[var(--hz-cobalt)] truncate">{jobTitle}</p>
          </div>
          <Link
            href={`/admin/jobs/${jobId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--hz-cobalt)] hover:gap-1.5 transition-all flex-shrink-0"
          >
            View job <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* ── Body grid ── */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">

        {/* ── Left column (main) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Info */}
          <FormSection icon={User2} title="Personal Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" required>
                <FormInput value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
              </Field>
              <Field label="Last Name">
                <FormInput value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Smith" />
              </Field>
              <Field label="Email Address" required>
                <FormInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone Number">
                <FormInput type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </Field>
            </div>
          </FormSection>

          {/* Location */}
          <FormSection icon={MapPin} title="Location">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <FormInput value={city} onChange={(e) => setCity(e.target.value)} placeholder="Austin" />
              </Field>
              <Field label="State">
                <FormSelect value={state} onChange={(e) => setState(e.target.value)}>
                  <option value="">Select state…</option>
                  {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </Field>
            </div>
          </FormSection>

          {/* Skills & Experience */}
          <FormSection icon={Briefcase} title="Skills & Experience">
            <div className="space-y-5">
              <Field label="Skills">
                <div className="flex gap-2">
                  <FormInput
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
                    className="px-3 py-2 bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] transition flex-shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </Field>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-xs font-semibold rounded-full">
                      {s}
                      <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))} className="p-0.5 hover:bg-[var(--hz-cobalt)]/15 rounded-full transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                    <button key={s} type="button" onClick={() => addSkill(s)}
                      className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)] rounded-full border border-slate-200 hover:border-[var(--hz-cobalt-100)] transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>

              <Field label="Experience Summary">
                <FormTextarea
                  rows={4}
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="Brief summary of experience, industries, key achievements…"
                />
              </Field>
            </div>
          </FormSection>

          {/* Resume */}
          <FormSection icon={FileText} title="Resume">
            <div className="space-y-3">
              {resumeFile ? (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{resumeFile.name}</p>
                    <p className="text-xs text-slate-400 tabular-nums">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button type="button" onClick={() => setResumeFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--hz-cobalt-100)] bg-[var(--hz-cobalt-100)]/40 hover:bg-[var(--hz-cobalt-100)]/60 rounded-xl p-6 cursor-pointer transition-colors">
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="hidden" />
                  <Upload className="w-6 h-6 text-[var(--hz-cobalt)]" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Upload resume</p>
                    <p className="text-xs text-slate-400 mt-0.5">PDF or Word · max 5MB</p>
                  </div>
                </label>
              )}
              {resumeError && (
                <div className="flex items-center gap-2 p-2 bg-rose-50 border border-rose-200 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                  <p className="text-xs text-rose-600">{resumeError}</p>
                </div>
              )}
            </div>
          </FormSection>
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-5">

          {/* Position & Pipeline */}
          <FormSection icon={Briefcase} title="Position & Pipeline">
            <div className="space-y-3">
              <Field label="Job Posting">
                <FormSelect
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

              <Field label="Pipeline Stage">
                <FormSelect value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}>
                  {PIPELINE_OPTIONS.map((k) => (
                    <option key={k} value={k}>{statusMeta[k].label}</option>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Source">
                <FormSelect value={source} onChange={(e) => setSource(e.target.value)}>
                  <option value="">Select…</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </Field>

              <button
                type="button"
                onClick={() => setAddToTalentBench((v) => !v)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  addToTalentBench
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white",
                )}
              >
                {addToTalentBench
                  ? <BookmarkCheck className="w-4 h-4" />
                  : <BookmarkPlus  className="w-4 h-4" />}
                {addToTalentBench ? "In talent bench" : "Add to talent bench"}
              </button>
            </div>
          </FormSection>

          {/* Work Authorization */}
          <FormSection icon={Shield} title="Work Authorization">
            <div className="space-y-3">
              <Field label="Visa / Authorization">
                <FormSelect value={workAuth} onChange={(e) => setWorkAuth(e.target.value)}>
                  <option value="">Select…</option>
                  {VISA_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
                </FormSelect>
              </Field>

              {workAuth && !isPermanent && (
                <Field label="Expiry Date">
                  <FormInput type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} />
                </Field>
              )}

              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input
                  type="checkbox"
                  checked={needsSponsorship}
                  onChange={(e) => setNeedsSponsorship(e.target.checked)}
                  className="rounded border-slate-300 text-[var(--hz-cobalt)] w-4 h-4 flex-shrink-0"
                />
                <span className="text-sm text-slate-700">Requires sponsorship</span>
              </label>

              {workAuth && (
                <div className={cn(
                  "rounded-xl p-3 text-xs leading-relaxed",
                  isPermanent
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border border-amber-200 text-amber-700",
                )}>
                  {isPermanent
                    ? "✓ Permanent US work authorization."
                    : workAuth === "H1-B"
                      ? "H-1B requires employer sponsorship."
                      : ["OPT", "CPT"].includes(workAuth)
                        ? "OPT/CPT is time-limited — verify expiry before extending an offer."
                        : "Verify authorization docs before extending an offer."}
                </div>
              )}
            </div>
          </FormSection>

          {/* Rating & Notes */}
          <FormSection icon={Star} title="Rating & Notes">
            <div className="space-y-3">
              <Field label="Candidate Rating">
                <div className="flex items-center gap-1.5 py-1">
                  <StarRating rating={rating} onRate={(n) => setRating(n === rating ? 0 : n)} size="lg" />
                  {rating > 0 && <span className="text-xs text-slate-400 ml-1 tabular-nums">{rating}/5</span>}
                </div>
              </Field>

              <Field label="Internal Notes">
                <FormTextarea
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Interview impressions, concerns, next steps… (internal only)"
                />
              </Field>
            </div>
          </FormSection>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
          {error && (
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          )}
          <Link href="/admin/applications" className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || resumeUploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:opacity-60 transition shadow-sm shadow-[rgba(29,78,216,0.2)]"
          >
            {(submitting || resumeUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {resumeUploading ? "Uploading…" : "Add Applicant"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense>
      <NewApplicationInner />
    </Suspense>
  );
}
