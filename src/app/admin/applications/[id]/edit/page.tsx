"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, User2, MapPin, Briefcase, Shield, FileText,
  Star, Plus, X, Loader2, AlertTriangle, BookmarkPlus,
  BookmarkCheck, ChevronRight, Upload, File, Download, Trash2,
} from "lucide-react";
import { Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { statusMeta, SOURCE_OPTIONS, US_STATES, type AppStatus } from "@/components/admin/theme";
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
  const [addToTalentBench, setAddToTalentBench] = useState(false);

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
      fetch(`/api/applications/${id}`).then(r => r.json()),
      fetch("/api/jobs").then(r => r.json()),
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
        setAddToTalentBench(!!app.addToTalentBench);
        setSkills(app.skills || []);
        setExperience(app.experience || "");
        setWorkAuth(app.workAuthorization || "");
        setNeedsSponsorship(!!app.visaSponsorshipRequired);
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
    setSkills(p => [...p, t]);
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
    setExistingResume(null); // new file replaces existing
  };

  const uploadResume = async (): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id, fileName: resumeFile.name, fileType: resumeFile.type, fileSize: resumeFile.size }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      const s3 = await fetch(data.uploadUrl, { method: "PUT", body: resumeFile, headers: { "Content-Type": resumeFile.type } });
      if (!s3.ok) throw new Error("S3 upload failed");
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
    } catch { alert("Failed to download resume"); }
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

      const job = jobs.find(j => j.id === jobId);
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
        workAuthorization: workAuth || undefined,
        city, state, skills, experience, notes,
        rating: rating || undefined,
        addToTalentBench,
        ...(addToTalentBench && { benchAddedBy: user?.email || user?.id }),
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

  const isPermanent = ["US Citizen", "Green Card"].includes(workAuth);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">

      {/* Page header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg transition-all">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/admin/applications" className="hover:text-blue-600 transition-colors font-medium">Applications</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700 font-semibold">Edit Applicant</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/applications" className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="button" onClick={handleSubmit} disabled={submitting || resumeUploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
            {(submitting || resumeUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Edit Applicant</h1>
        <p className="text-sm text-slate-500 mt-1">Update the candidate&apos;s information below.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-4 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-rose-700">{error}</p>
        </div>
      )}

      {/* Body grid */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">

        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Personal Info */}
          <Card>
            <CardHeader icon={User2} color="blue" title="Personal Information" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First Name" required>
                <Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" autoFocus />
              </Field>
              <Field label="Last Name">
                <Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
              </Field>
              <Field label="Email Address" required>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
              </Field>
              <Field label="Phone Number">
                <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
              </Field>
            </div>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader icon={MapPin} color="emerald" title="Location" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="City">
                <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Austin" />
              </Field>
              <Field label="State">
                <Select value={state} onChange={e => setState(e.target.value)}>
                  <option value="">Select state…</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
          </Card>

          {/* Skills & Experience */}
          <Card>
            <CardHeader icon={Briefcase} color="violet" title="Skills & Experience" />
            <div className="space-y-5">
              <Field label="Skills">
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") { e.preventDefault(); addSkill(skillInput); }
                      if (e.key === ",") { e.preventDefault(); addSkill(skillInput); }
                    }}
                    placeholder="Type a skill and press Enter…" />
                  <button type="button" onClick={() => addSkill(skillInput)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </Field>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100">
                      {s}
                      <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))} className="p-0.5 hover:bg-blue-200 rounded-full transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick add</p>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter(s => !skills.includes(s)).map(s => (
                    <button key={s} type="button" onClick={() => addSkill(s)}
                      className="px-2.5 py-1 text-xs text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-full border border-slate-200 hover:border-blue-200 transition-colors">
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Experience Summary">
                <Textarea rows={4} value={experience} onChange={e => setExperience(e.target.value)}
                  placeholder="Brief summary of experience, industries, key achievements…" />
              </Field>
            </div>
          </Card>

          {/* Resume */}
          <Card>
            <CardHeader icon={FileText} color="slate" title="Resume" compact />
            <div className="space-y-3">
              {/* Existing resume */}
              {existingResume && !resumeFile && (
                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{existingResume.fileName}</p>
                    <p className="text-xs text-slate-400">Attached resume</p>
                  </div>
                  <button type="button" onClick={handleDownloadResume}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setExistingResume(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Remove">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* New file selected */}
              {resumeFile && (
                <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="w-9 h-9 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{resumeFile.name}</p>
                    <p className="text-xs text-emerald-600 font-medium">Will overwrite current resume on save</p>
                  </div>
                  <button type="button" onClick={() => setResumeFile(null)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Upload area */}
              {!resumeFile && (
                <label className={cn(
                  "flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-colors",
                  existingResume
                    ? "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                    : "border-blue-200 bg-blue-50/30 hover:bg-blue-50/60"
                )}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="hidden" />
                  <Upload className={cn("w-6 h-6", existingResume ? "text-slate-400" : "text-blue-400")} />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">
                      {existingResume ? "Replace resume" : "Upload resume"}
                    </p>
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
          </Card>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Position & Pipeline */}
          <Card>
            <CardHeader icon={Briefcase} color="blue" title="Position & Pipeline" compact />
            <div className="space-y-3">
              <Field label="Job Posting">
                <Select value={jobId} onChange={e => {
                  const j = jobs.find(x => x.id === e.target.value);
                  setJobId(e.target.value);
                  setJobTitle(j?.title || "");
                }}>
                  <option value="">Unassigned</option>
                  {jobs.filter(j => j.status === "open" || j.status === "active").map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Pipeline Stage">
                <Select value={status} onChange={e => setStatus(e.target.value as AppStatus)}>
                  {PIPELINE_OPTIONS.map(k => (
                    <option key={k} value={k}>{statusMeta[k].label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Source">
                <Select value={source} onChange={e => setSource(e.target.value)}>
                  <option value="">Select…</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </Field>
              <button type="button" onClick={() => setAddToTalentBench(v => !v)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all",
                  addToTalentBench
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-white"
                )}>
                {addToTalentBench ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                {addToTalentBench ? "In talent bench" : "Add to talent bench"}
              </button>
            </div>
          </Card>

          {/* Work Authorization */}
          <Card>
            <CardHeader icon={Shield} color="amber" title="Work Authorization" compact />
            <div className="space-y-3">
              <Field label="Visa / Authorization">
                <Select value={workAuth} onChange={e => setWorkAuth(e.target.value)}>
                  <option value="">Select…</option>
                  {VISA_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                </Select>
              </Field>
              {workAuth && !isPermanent && (
                <Field label="Expiry Date">
                  <Input type="date" value={visaExpiry} onChange={e => setVisaExpiry(e.target.value)} />
                </Field>
              )}
              <label className="flex items-center gap-2.5 cursor-pointer py-1">
                <input type="checkbox" checked={needsSponsorship} onChange={e => setNeedsSponsorship(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 w-4 h-4 flex-shrink-0" />
                <span className="text-sm text-slate-700">Requires sponsorship</span>
              </label>
              {workAuth && (
                <div className={cn(
                  "rounded-xl p-3 text-xs leading-relaxed",
                  isPermanent
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                    : "bg-amber-50 border border-amber-200 text-amber-700"
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
          </Card>

          {/* Rating & Notes */}
          <Card>
            <CardHeader icon={FileText} color="slate" title="Rating & Notes" compact />
            <div className="space-y-3">
              <Field label="Candidate Rating">
                <div className="flex items-center gap-1.5 py-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setRating(n === rating ? 0 : n)} className="transition-transform hover:scale-110">
                      <Star className={cn("w-6 h-6", n <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
                    </button>
                  ))}
                  {rating > 0 && <span className="text-xs text-slate-400 ml-1">{rating}/5</span>}
                </div>
              </Field>
              <Field label="Internal Notes">
                <Textarea rows={5} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Interview impressions, concerns, next steps… (internal only)" />
              </Field>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
          {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
          <Link href="/admin/applications" className="px-4 py-2 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </Link>
          <button type="button" onClick={handleSubmit} disabled={submitting || resumeUploading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
            {(submitting || resumeUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {resumeUploading ? "Uploading resume…" : "Save Changes"}
          </button>
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

// ── Primitives ──────────────────────────────────────────────────────────────────

type IconColor = "blue" | "emerald" | "violet" | "amber" | "slate";
const iconColors: Record<IconColor, string> = {
  blue:    "bg-blue-50 text-blue-600",
  emerald: "bg-emerald-50 text-emerald-600",
  violet:  "bg-violet-50 text-violet-600",
  amber:   "bg-amber-50 text-amber-600",
  slate:   "bg-slate-100 text-slate-500",
};

function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">{children}</div>;
}

function CardHeader({ icon: Icon, color, title, compact }: {
  icon: React.ComponentType<{ className?: string }>;
  color: IconColor;
  title: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", compact ? "mb-1" : "mb-2")}>
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", iconColors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <h2 className={cn("font-bold text-slate-900", compact ? "text-xs uppercase tracking-wider text-slate-500" : "text-sm")}>
        {title}
      </h2>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={cn(
      "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
      "transition-colors placeholder:text-slate-400",
      props.className,
    )} />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cn(
      "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
      "transition-colors text-slate-700",
      props.className,
    )}>
      {children}
    </select>
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={cn(
      "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white",
      "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
      "transition-colors placeholder:text-slate-400 resize-none",
      props.className,
    )} />
  );
}
