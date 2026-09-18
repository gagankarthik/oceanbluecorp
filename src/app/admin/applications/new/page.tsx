"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Plus, X, Loader2, ExternalLink,
} from "lucide-react";
import {
  IconJob, IconFile, IconWarning, IconUpload, IconSave, IconSparkles, IconEdit,
} from "@/components/admin/icons";
import type { BenchType, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  PIPELINE_STAGES, SOURCE_OPTIONS, US_STATES, COMMON_SKILLS,
  WORK_AUTH_GROUPS, workAuthExpires, workAuthNeedsSponsorship,
  HIRE_TYPE_OPTIONS, type AppStatus,
} from "@/components/admin/theme";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Field, FormInput, FormSelect, FormTextarea } from "@/components/admin/forms/primitives";
import { FormErrorBanner, FieldWarning } from "@/components/admin/forms/form-alert";
import { useFormErrors } from "@/hooks/use-form-errors";
import {
  check, collectErrors, required, maxLen, email as emailRule, phone as phoneRule,
  pastDateWarning, LIMITS,
} from "@/lib/form-validation";
import { StarRating } from "@/components/admin/star-rating";
import { Checkbox } from "@/components/ui/checkbox";
import {
  buildResumePrefill, filledKeys, PREFILL_LABELS, type ResumePrefill,
} from "@/lib/resume-prefill";
import { cn } from "@/lib/utils";

/** Ties the action-bar submit button to the form it sits outside of. */
const FORM_ID = "applicant-form";

const backLinkCls = "-ml-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)]";
const wellCls = "rounded-[12px] border px-4 py-3";
const choiceCls = "group flex cursor-pointer flex-col rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 transition-[border-color,box-shadow] duration-150 hover:border-[var(--adm-line-strong)] hover:shadow-[var(--adm-shadow-md)] focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]";
const inlineErrorCls = "flex items-center gap-1.5 rounded-[10px] bg-[var(--adm-danger-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--adm-danger-ink)]";
const skillChipCls = "inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-accent-soft)] py-0.5 pl-2 pr-1 text-[12.5px] font-medium text-[var(--adm-accent)]";
const suggestionCls = "rounded-[6px] border border-dashed border-[var(--adm-line-strong)] px-2 py-0.5 text-[12.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]";
const iconBtnDangerCls = "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]";
const dropzoneCls = "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-[var(--adm-line-strong)] bg-[var(--adm-surface-sunken)] p-5 transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)] focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]";
const checkWellCls = "flex cursor-pointer items-start gap-2.5 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-3.5 py-3 transition-colors hover:border-[var(--adm-line-strong)]";
const checkboxCls = "border-[var(--adm-line-strong)] data-[state=checked]:border-[var(--adm-accent)] data-[state=checked]:bg-[var(--adm-accent)]";
/** Bleeds to the edges of main's `p-4 sm:p-5 lg:p-6` so it spans the pane. */
const actionBarCls = "sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6";

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
  const [hireType, setHireType] = useState("");
  const [addToTalentBench, setAddToTalentBench] = useState(false);
  const [benchType, setBenchType] = useState<BenchType>("external");

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

  // How this record is being created. The form stays hidden until the recruiter
  // chooses, because reading the resume first fills most of it in, offering the
  // empty form straight away buries that and invites re-typing what the document
  // already says.
  const [mode, setMode] = useState<"choose" | "reading" | "form">("choose");
  const [parsing, setParsing] = useState(false);
  // Kept apart from resumeError: that one belongs to the file itself (wrong type,
  // too big, upload failed) and shows in the Documents card. A failed READ is
  // about the form the recruiter is looking at, and has to be visible from the
  // top of the page, buried at the bottom it reads as nothing having happened.
  const [parseError, setParseError] = useState<string | null>(null);
  // Which file the current values came from, and what it filled, shown so the
  // recruiter knows exactly what to double-check before saving.
  const [prefillFrom, setPrefillFrom]     = useState<string | null>(null);
  const [prefillFields, setPrefillFields] = useState<string[]>([]);
  // The extraction behind that prefill, sent with the new record so the server
  // stores it instead of putting the same document through the 30–90s pipeline a
  // second time. Kept opaque here, this screen only reads it via the prefill.
  const [parsedAnalysis, setParsedAnalysis] = useState<unknown>(null);
  /**
   * WHICH file that analysis describes, by object identity rather than by name.
   * Recruiters hand around a great many files called "resume.pdf", and comparing
   * names would let one candidate's parsed analysis be filed against another's
   * record the moment two uploads happened to share a filename.
   */
  const parsedFile = useRef<File | null>(null);

  useEffect(() => {
    fetch("/api/jobs?fields=summary")
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

  // Judged on the extension, not the MIME type: browsers report .doc/.docx
  // inconsistently and a valid resume was being turned away as the wrong type.
  const validateResume = (file: File): string | null => {
    const name = file.name.toLowerCase();
    if (![".pdf", ".doc", ".docx"].some((ext) => name.endsWith(ext))) {
      return "Upload a PDF or Word document (.pdf, .doc, .docx).";
    }
    if (file.size > 5 * 1024 * 1024) return "Choose a file under 5 MB.";
    return null;
  };

  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);
    setParseError(null);
    if (!file) return;
    const invalid = validateResume(file);
    if (invalid) { setResumeError(invalid); return; }
    setResumeFile(file);
  };

  /**
   * Fill blanks only, and merge skills. A field the recruiter already typed wins
   * over the extractor, they are looking at the person's application, the
   * parser is guessing from a document.
   */
  const applyPrefill = (p: ResumePrefill) => {
    setFirstName((v) => v || p.firstName);
    setLastName((v)  => v || p.lastName);
    setEmail((v)     => v || p.email);
    setPhone((v)     => v || p.phone);
    setCity((v)      => v || p.city);
    setState((v)     => v || p.state);
    setExperience((v) => v || p.experience);
    setSkills((prev) => {
      const seen = new Set(prev.map((s) => s.toLowerCase()));
      return [...prev, ...p.skills.filter((s) => !seen.has(s.toLowerCase()))];
    });
  };

  /**
   * Read a resume and fill the form from it. Nothing is stored yet, the file is
   * attached on save like any other, so a failed read never blocks the record:
   * the recruiter just types it in.
   */
  const parseResumeFile = async (file: File) => {
    setParsing(true);
    setParseError(null);
    try {
      // Raw binary + headers, not multipart: Amplify's SSR layer drops the
      // multipart boundary and request.formData() throws on the route side.
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(file.name),
          "x-file-type": file.type || "application/octet-stream",
        },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not read this resume");

      const prefill = buildResumePrefill(data.analysis, data.contact ?? undefined);
      const filled = filledKeys(prefill);
      if (filled.length === 0) {
        // Nothing to show for it, so nothing is claimed: no prefill banner, and
        // no analysis carried over from whatever was read before this file.
        setPrefillFrom(null);
        setPrefillFields([]);
        setParsedAnalysis(null);
        parsedFile.current = null;
        setParseError("Nothing usable could be read from this resume, fill the form in manually. The file will still be attached.");
        return;
      }
      applyPrefill(prefill);
      setPrefillFrom(file.name);
      setPrefillFields(filled.map((k) => PREFILL_LABELS[k]));
      setParsedAnalysis(data.analysis ?? null);
      parsedFile.current = file;
    } catch (err) {
      setPrefillFrom(null);
      setPrefillFields([]);
      setParsedAnalysis(null);
      parsedFile.current = null;
      setParseError(err instanceof Error ? err.message : "Could not read this resume");
    } finally {
      setParsing(false);
    }
  };

  /**
   * Chooser path: take the file and READ IT BEFORE showing the form.
   *
   * This used to drop straight to the form with a banner reading "you can start
   * filling the form meanwhile", which was worse than it sounds. `applyPrefill`
   * keeps whatever is already in a field (`(v) => v || p.firstName`) so the
   * recruiter's own typing wins, meaning anything typed during the parse
   * silently DISCARDS the parsed value for that field. The banner invited
   * exactly the work that defeats the feature, and there was no way to tell
   * afterwards which fields had lost.
   *
   * So the read gets its own step. Nothing to race, nothing thrown away, and
   * the form appears already filled, which is the thing being offered.
   */
  const handleStartFromResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after an error
    setResumeError(null);
    setParseError(null);
    if (!file) return;
    const invalid = validateResume(file);
    if (invalid) { setResumeError(invalid); return; }
    setResumeFile(file);
    setMode("reading");
    // Land on the form once the read settles, however it settles: a failed or
    // empty parse still has to hand over to a form the recruiter can type in.
    void parseResumeFile(file).finally(() => setMode("form"));
  };

  const uploadResume = async (userId: string): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;
    setResumeUploading(true);
    try {
      // The route uploads to S3 server-side (multipart/form-data) to avoid
      // browser→S3 CORS issues, send the file itself, not a presign request.
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", userId);
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
      // Upload resume first if selected; use a temp ID (will be replaced with actual app ID if needed)
      let resumePayload: Record<string, unknown> = {};
      if (resumeFile) {
        const tempId = `new-${Date.now()}`;
        const uploaded = await uploadResume(tempId);
        if (!uploaded) { setSubmitting(false); return; }
        resumePayload = { resumeId: uploaded.resumeId, resumeFileName: uploaded.fileName, resumeFileKey: uploaded.fileKey };
        // Only when it belongs to the file actually being attached, swapping the
        // resume after a prefill must not file the previous document's analysis
        // against the new one.
        if (parsedAnalysis && parsedFile.current === resumeFile) {
          resumePayload.resumeAnalysis = parsedAnalysis;
        }
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
        hireType:          hireType  || undefined,
        workAuthorization: workAuth  || undefined,
        visaSponsorshipRequired: needsSponsorship,
        ...(visaExpiry && { visaExpiry }),
        city, state, skills, experience, notes,
        rating: rating || undefined,
        addToTalentBench,
        ...(addToTalentBench && { benchAddedBy: user?.email || user?.id, benchType }),
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
      if (!res.ok) throw new Error(data.error || "The applicant could not be saved. Try again in a moment.");
      router.push(`/admin/candidates/${data.application.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The applicant could not be saved. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  // Sponsorship and expiry are properties of the authorization type, so they
  // come from the shared table rather than a hardcoded pair of values.
  const isPermanent = !workAuthNeedsSponsorship(workAuth);
  const showExpiry  = workAuthExpires(workAuth);
  const busy = submitting || resumeUploading || parsing;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <PageHeader
          className="mb-0 mt-2"
          title="New applicant"
          info="Create a candidate record and place it on the pipeline"
          meta={jobId && jobTitle ? (
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[var(--adm-ink-mute)]">
              <IconJob className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="min-w-0 truncate">
                Applying for <span className="font-medium text-[var(--adm-ink)]">{jobTitle}</span>
              </span>
              <Link
                href={`/admin/jobs/${jobId}`}
                className="inline-flex flex-none items-center gap-1 rounded-[6px] px-1 font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]"
              >
                View job<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </p>
          ) : undefined}
        />
      </div>

      <FormErrorBanner message={error} onDismiss={() => setError(null)} />

      {/* Both routes end at the same form; uploading first only pre-fills it. */}
      {mode === "choose" ? (
        <AdminCard>
          <AdminCardHeader title="How do you want to add this candidate?" subtitle="Reading a resume fills most of the form for you to check." />
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <label className={choiceCls}>
              <input type="file" accept=".pdf,.doc,.docx" onChange={handleStartFromResume} className="sr-only" />
              <IconSparkles className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-accent)]" aria-hidden="true" />
              <span className="mt-3 text-[14px] font-semibold text-[var(--adm-ink)]">Upload a resume</span>
              <span className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                Name, contact, location, skills and experience are read from the document and filled in for you to check.
              </span>
              <span className="mt-2 text-[12.5px] text-[var(--adm-ink-subtle)]">PDF or Word, up to 5MB</span>
            </label>

            <button
              type="button"
              onClick={() => { setResumeError(null); setMode("form"); }}
              className={cn(choiceCls, "text-left")}
            >
              <IconEdit className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-accent)]" aria-hidden="true" />
              <span className="mt-3 text-[14px] font-semibold text-[var(--adm-ink)]">Enter details manually</span>
              <span className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                Fill the form in yourself. A resume can still be attached at the end, and read at any point.
              </span>
            </button>
          </div>
          {resumeError && (
            <p role="alert" className={cn(inlineErrorCls, "mx-4 mb-4")}>
              <IconWarning className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {resumeError}
            </p>
          )}
        </AdminCard>
      ) : mode === "reading" ? (
        // Its own step: a typed value beats a parsed one, so editing during the read would lose data.
        <AdminCard>
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />
            <p className="mt-4 text-[15px] font-semibold text-[var(--adm-ink)]" role="status" aria-live="polite">
              Reading {resumeFile?.name ?? "the resume"}…
            </p>
            <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
              Pulling out name, contact details, location, skills and experience. This usually takes a few
              seconds and can take up to a minute. The form opens filled in, ready for you to check.
            </p>
            <WorkspaceButton variant="ghost" className="mt-5" onClick={() => setMode("form")}>
              Skip and fill it in myself
            </WorkspaceButton>
          </div>
        </AdminCard>
      ) : (
        <>
          {parsing && (
            <div className={cn(wellCls, "flex items-center gap-2.5 border-[var(--adm-line)] bg-[var(--adm-accent-tint)]")}>
              <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-accent)]" aria-hidden="true" />
              <p className="text-[13.5px] text-[var(--adm-ink-mute)]" role="status" aria-live="polite">
                Still reading {resumeFile?.name ?? "the resume"}; empty fields may fill in shortly.
                Anything you type stays as you typed it.
              </p>
            </div>
          )}

          {!parsing && prefillFrom && (
            <div className={cn(wellCls, "flex items-start gap-2.5 border-[var(--adm-line)] bg-[var(--adm-accent-tint)]")}>
              <IconSparkles className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-accent)]" aria-hidden="true" />
              <p className="text-[13.5px] text-[var(--adm-ink-mute)]">
                Filled from <span className="font-medium text-[var(--adm-ink)]">{prefillFrom}</span>: {prefillFields.join(", ")}.
                Check the values before saving; the file will be attached to the record.
              </p>
            </div>
          )}

          {/* A failed read is not a failed record: the form still works and the file is still attached. */}
          {!parsing && parseError && (
            <div role="alert" className={cn(wellCls, "flex flex-wrap items-start gap-2.5 border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)]")}>
              <IconWarning className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-warning-ink)]" aria-hidden="true" />
              <p className="min-w-0 flex-1 text-[13.5px] text-[var(--adm-warning-ink)]">
                Couldn&apos;t read the resume, enter the details below instead. {parseError}
              </p>
              {resumeFile && (
                <WorkspaceButton className="h-8 px-3 text-[13px]" onClick={() => void parseResumeFile(resumeFile)}>
                  Try again
                </WorkspaceButton>
              )}
            </div>
          )}
        </>
      )}

      <form
        id={FORM_ID}
        onSubmit={handleSubmit}
        onBlur={revalidate}
        noValidate
        className={cn("grid grid-cols-1 items-start gap-4 lg:grid-cols-3", mode === "choose" && "hidden")}
      >
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
              {resumeFile ? (
                <div className={cn(wellCls, "flex flex-wrap items-center gap-3 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] py-3")}>
                  <IconFile className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{resumeFile.name}</p>
                    <p className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{(resumeFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    {/* A resume attached late in a manual entry can still fill the blanks. */}
                    {parsedFile.current !== resumeFile && (
                      <WorkspaceButton
                        className="h-8 px-3 text-[13px]"
                        onClick={() => void parseResumeFile(resumeFile)}
                        disabled={parsing}
                      >
                        {parsing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSparkles aria-hidden="true" />}
                        {parsing ? "Reading…" : "Fill form from resume"}
                      </WorkspaceButton>
                    )}
                    <button
                      type="button"
                      aria-label="Remove resume"
                      onClick={() => {
                        setResumeFile(null); setPrefillFrom(null); setPrefillFields([]);
                        setParsedAnalysis(null); setParseError(null);
                        parsedFile.current = null;
                      }}
                      className={iconBtnDangerCls}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className={dropzoneCls}>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleResumeSelect} className="sr-only" />
                  <IconUpload className="h-5 w-5 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                  <span className="text-center">
                    <span className="block text-[14px] font-medium text-[var(--adm-ink)]">Upload resume</span>
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
                </FormSelect>
              </Field>

              {showExpiry && (
                <Field label="Expiry date" htmlFor="visaExpiry">
                  <FormInput id="visaExpiry" type="date" value={visaExpiry} onChange={(e) => setVisaExpiry(e.target.value)} className="tabular-nums" />
                  <FieldWarning>{pastDateWarning(visaExpiry, "This authorization has already expired. Check it before submitting the candidate.")}</FieldWarning>
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

      <div className={cn(actionBarCls, mode === "choose" && "hidden")}>
        <p className="min-w-0 text-[13px] font-medium text-[var(--adm-danger-ink)]">
          {Object.keys(errors).length > 0 ? "Fix the highlighted fields to add this applicant." : error}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceButton onClick={() => router.push("/admin/applications")}>
            Cancel
          </WorkspaceButton>
          <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <IconSave />}
            {parsing ? "Reading resume…" : resumeUploading ? "Uploading…" : "Add applicant"}
          </WorkspaceButton>
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
