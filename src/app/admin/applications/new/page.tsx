"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import {
  IconJob, IconWarning, IconSave, IconSparkles, IconEdit, IconGroup,
} from "@/components/admin/icons";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { POOL_LABEL, poolOf } from "@/lib/bench";
import { EmptyState } from "@/components/admin/empty-state";
import { SearchInput } from "@/components/admin/toolbar";
import { PageHeader } from "@/components/admin/page-header";
import { WorkspaceButton } from "@/components/admin/workspace";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { FormErrorBanner } from "@/components/admin/forms/form-alert";
import { CandidateForm, returnPath } from "@/components/admin/candidate-form/candidate-form";
import {
  useCandidateForm, RESUME_ACCEPT, type CandidateFormValues,
} from "@/hooks/use-candidate-form";
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
/** Bleeds to the edges of main's `p-4 sm:p-5 lg:p-6` so it spans the pane. */
const actionBarCls = "sticky bottom-0 z-20 -mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-[var(--adm-line)] bg-[var(--adm-surface)]/95 px-4 py-3 backdrop-blur sm:-mx-5 sm:-mb-5 sm:px-5 lg:-mx-6 lg:-mb-6 lg:px-6";

function NewApplicationInner() {
  const router = useRouter();
  const params = useSearchParams();
  // ?bench=1 is the talent bench's "Add profile": on the bench, and back there after saving.
  const forBench = params.get("bench") === "1";
  const returnTo = returnPath(params.get("return")) ?? (forBench ? "/admin/bench" : null);
  const initialJobId = params.get("jobId") ?? "";

  const initial = useMemo<Partial<CandidateFormValues>>(
    () => (forBench ? { addToTalentBench: true, status: "active", jobId: initialJobId } : { jobId: initialJobId }),
    [forBench, initialJobId],
  );
  const form = useCandidateForm({ mode: "create", initial });
  const { values, setValues } = form;

  const [jobs, setJobs] = useState<Job[]>([]);

  // The form stays hidden until the recruiter chooses: reading the resume first
  // fills most of it in, and an empty form invites re-typing what the document says.
  const [mode, setMode] = useState<"choose" | "reading" | "bench" | "form">("choose");
  // Bench route: the profile's fields and stored resume go into a NEW application.
  const [benchList, setBenchList]       = useState<Application[] | null>(null);
  const [benchError, setBenchError]     = useState<string | null>(null);
  const [benchQuery, setBenchQuery]     = useState("");
  const [benchPicking, setBenchPicking] = useState<string | null>(null);
  const [benchFrom, setBenchFrom]       = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  // Separate from the file's own error: a failed READ must be visible from the top of the page.
  const [parseError, setParseError] = useState<string | null>(null);
  const [prefillFrom, setPrefillFrom]     = useState<string | null>(null);
  const [prefillFields, setPrefillFields] = useState<string[]>([]);
  // Sent with the record so the server stores it instead of re-running the 30–90s pipeline.
  const [parsedAnalysis, setParsedAnalysis] = useState<unknown>(null);
  // By identity, not name: many files are called "resume.pdf".
  const parsedFile = useRef<File | null>(null);

  useEffect(() => {
    fetch("/api/jobs?fields=summary")
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .catch(() => { /* the job picker stays empty; the record can still be saved */ });
  }, []);

  const openBench = () => {
    form.setResumeError(null);
    setMode("bench");
    if (benchList) return;
    setBenchError(null);
    fetch("/api/applications?bench=1&fields=summary")
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Couldn't load the talent bench.");
        setBenchList(d.applications || []);
      })
      .catch((err) => setBenchError(err instanceof Error ? err.message : "Couldn't load the talent bench."));
  };

  const pickFromBench = async (row: Application) => {
    setBenchPicking(row.id);
    // The list is a summary; the full record carries the stored resume analysis.
    let app = row;
    try {
      const r = await fetch(`/api/applications/${row.id}`);
      const d = await r.json();
      if (r.ok && d.application) app = d.application;
    } catch { /* the list row is enough to fill the form */ }

    const [first, ...rest] = (app.name || "").split(" ");
    setValues((v) => ({
      ...v,
      firstName: app.firstName || first || "",
      lastName: app.lastName || rest.join(" "),
      email: app.email || "",
      phone: app.phone || "",
      linkedinUrl: app.linkedinUrl || "",
      address: app.address || "",
      city: app.city || "",
      state: app.state || "",
      zipCode: app.zipCode || "",
      skills: app.skills || [],
      experience: app.experience || "",
      workAuthorization: app.workAuthorization || "",
      visaExpiry: app.visaExpiry || "",
      visaSponsorshipRequired: !!app.visaSponsorshipRequired,
      hireType: app.hireType || "",
    }));
    form.setExistingResume(app.resumeId
      ? { id: app.resumeId, fileName: app.resumeFileName || "Resume", fileKey: app.resumeFileKey, analysis: app.resumeAnalysis, origin: "bench" }
      : null);
    form.setIgnoreDuplicateId(app.id);
    setBenchFrom(app.name || app.email);
    setBenchPicking(null);
    setMode("form");
  };

  const benchMatches = (benchList || []).filter((a) => {
    const q = benchQuery.trim().toLowerCase();
    return !q || [a.name, a.email, a.jobTitle, ...(a.skills || [])].some((f) => f?.toLowerCase().includes(q));
  });

  const forgetPrefill = () => {
    setPrefillFrom(null);
    setPrefillFields([]);
    setParsedAnalysis(null);
    setParseError(null);
    parsedFile.current = null;
  };

  /** Fill blanks only and merge skills: what the recruiter typed beats the parser's guess. */
  const applyPrefill = (p: ResumePrefill) => {
    setValues((v) => {
      const seen = new Set(v.skills.map((s) => s.toLowerCase()));
      return {
        ...v,
        firstName: v.firstName || p.firstName,
        lastName: v.lastName || p.lastName,
        email: v.email || p.email,
        phone: v.phone || p.phone,
        city: v.city || p.city,
        state: v.state || p.state,
        experience: v.experience || p.experience,
        skills: [...v.skills, ...p.skills.filter((s) => !seen.has(s.toLowerCase()))],
      };
    });
  };

  /** Read a resume into the form. Nothing is stored; a failed read never blocks the record. */
  const parseResumeFile = async (file: File) => {
    setParsing(true);
    setParseError(null);
    try {
      // Raw binary, not multipart: Amplify's SSR layer drops the multipart boundary.
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
        forgetPrefill();
        setParseError("Nothing usable could be read from this resume, fill the form in manually. The file will still be attached.");
        return;
      }
      applyPrefill(prefill);
      setPrefillFrom(file.name);
      setPrefillFields(filled.map((k) => PREFILL_LABELS[k]));
      setParsedAnalysis(data.analysis ?? null);
      parsedFile.current = file;
    } catch (err) {
      forgetPrefill();
      setParseError(err instanceof Error ? err.message : "Could not read this resume");
    } finally {
      setParsing(false);
    }
  };

  /**
   * Chooser path: read the file BEFORE showing the form. `applyPrefill` keeps
   * typed values, so typing during the parse would silently discard parsed ones.
   */
  const handleStartFromResume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be re-picked after an error
    setParseError(null);
    if (!file) return;
    if (form.selectResume(file)) return;
    setMode("reading");
    // A failed or empty parse still hands over to a form the recruiter can type in.
    void parseResumeFile(file).finally(() => setMode("form"));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const saved = await form.submit({
      jobs,
      // Only when it describes the file actually being attached.
      resumeAnalysis: parsedAnalysis && parsedFile.current === form.resumeFile ? parsedAnalysis : undefined,
    });
    if (saved) router.push(returnTo ?? `/admin/candidates/${saved.id}`);
  };

  const busy = form.busy || parsing;
  const jobTitle = values.jobTitle || jobs.find((j) => j.id === values.jobId)?.title;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <button type="button" onClick={() => router.back()} className={backLinkCls}>
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />Back
        </button>
        <PageHeader
          className="mb-0 mt-2"
          title={forBench ? "Add bench profile" : "New applicant"}
          info={forBench ? "Add a candidate to the talent bench" : "Create a candidate record and place it on the pipeline"}
          meta={values.jobId && jobTitle ? (
            <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[var(--adm-ink-mute)]">
              <IconJob className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />
              <span className="min-w-0 truncate">
                Applying for <span className="font-medium text-[var(--adm-ink)]">{jobTitle}</span>
              </span>
              <Link
                href={`/admin/jobs/${values.jobId}`}
                className="inline-flex flex-none items-center gap-1 rounded-[6px] px-1 font-medium text-[var(--adm-accent)] transition-colors hover:bg-[var(--adm-accent-tint)]"
              >
                View job<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </Link>
            </p>
          ) : undefined}
        />
      </div>

      <FormErrorBanner message={form.error} onDismiss={() => form.setError(null)} />

      {mode === "choose" ? (
        <AdminCard>
          <AdminCardHeader title="How do you want to add this candidate?" subtitle="Reading a resume fills most of the form for you to check." />
          <div className={cn("grid gap-3 p-4", forBench ? "sm:grid-cols-2" : "sm:grid-cols-3")}>
            <label className={choiceCls}>
              <input type="file" accept={RESUME_ACCEPT} onChange={handleStartFromResume} className="sr-only" />
              <IconSparkles className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-accent)]" aria-hidden="true" />
              <span className="mt-3 text-[14px] font-semibold text-[var(--adm-ink)]">Upload a resume</span>
              <span className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                Name, contact, location, skills and experience are read from the document and filled in for you to check.
              </span>
              <span className="mt-2 text-[12.5px] text-[var(--adm-ink-subtle)]">PDF or Word, up to 5 MB</span>
            </label>

            <button
              type="button"
              onClick={() => { form.setResumeError(null); setMode("form"); }}
              className={cn(choiceCls, "text-left")}
            >
              <IconEdit className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-accent)]" aria-hidden="true" />
              <span className="mt-3 text-[14px] font-semibold text-[var(--adm-ink)]">Enter details manually</span>
              <span className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                Fill the form in yourself. A resume can still be attached at the end, and read at any point.
              </span>
            </button>

            {!forBench && (
              <button type="button" onClick={openBench} className={cn(choiceCls, "text-left")}>
                <IconGroup className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)] transition-colors group-hover:text-[var(--adm-accent)]" aria-hidden="true" />
                <span className="mt-3 text-[14px] font-semibold text-[var(--adm-ink)]">Pick from talent bench</span>
                <span className="mt-1 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                  Choose someone already on the bench. Their details and resume are carried over for you to check.
                </span>
              </button>
            )}
          </div>
          {form.resumeError && (
            <p role="alert" className={cn(inlineErrorCls, "mx-4 mb-4")}>
              <IconWarning className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {form.resumeError}
            </p>
          )}
        </AdminCard>
      ) : mode === "bench" ? (
        <AdminCard>
          <AdminCardHeader title="Pick from talent bench" count={benchList?.length} />
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
            <SearchInput value={benchQuery} onChange={setBenchQuery} placeholder="Search name, email or skill…" />
            <WorkspaceButton variant="ghost" className="ml-auto" onClick={() => setMode("choose")}>Back</WorkspaceButton>
          </div>
          {benchError ? (
            <EmptyState variant="error" title="Couldn't load the talent bench" description={benchError} />
          ) : !benchList ? (
            <div className="flex items-center justify-center gap-2 px-5 py-12 text-[13.5px] text-[var(--adm-ink-mute)]" role="status">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />Loading the bench…
            </div>
          ) : benchMatches.length === 0 ? (
            <EmptyState
              title={benchList.length === 0 ? "Nobody on the bench yet" : "No matching bench profiles"}
              description={benchList.length === 0 ? "Add candidates to the bench from their record, then pick them here." : "Try a different name, email or skill."}
            />
          ) : (
            <ul className="max-h-[60vh] divide-y divide-[var(--adm-line-soft)] overflow-y-auto">
              {benchMatches.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    disabled={!!benchPicking}
                    onClick={() => void pickFromBench(a)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--adm-surface-2)] disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-[var(--adm-ink)]">{a.name || a.email}</span>
                      <span className="block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">
                        {[a.email, a.jobTitle, (a.skills || []).slice(0, 4).join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex-none text-[12.5px] text-[var(--adm-ink-mute)]">{POOL_LABEL[poolOf(a)]}</span>
                    {benchPicking === a.id && <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-accent)]" aria-hidden="true" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </AdminCard>
      ) : mode === "reading" ? (
        <AdminCard>
          <div className="flex flex-col items-center px-5 py-12 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />
            <p className="mt-4 text-[15px] font-semibold text-[var(--adm-ink)]" role="status" aria-live="polite">
              Reading {form.resumeFile?.name ?? "the resume"}…
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
                Still reading {form.resumeFile?.name ?? "the resume"}; empty fields may fill in shortly.
                Anything you type stays as you typed it.
              </p>
            </div>
          )}

          {benchFrom && (
            <div className={cn(wellCls, "flex items-start gap-2.5 border-[var(--adm-line)] bg-[var(--adm-accent-tint)]")}>
              <IconGroup className="mt-0.5 h-4 w-4 flex-none text-[var(--adm-accent)]" aria-hidden="true" />
              <p className="text-[13.5px] text-[var(--adm-ink-mute)]">
                Filled from <span className="font-medium text-[var(--adm-ink)]">{benchFrom}</span>&apos;s bench profile.
                Check the values before saving; they stay on the bench.
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
              {form.resumeFile && (
                <WorkspaceButton className="h-8 px-3 text-[13px]" onClick={() => void parseResumeFile(form.resumeFile!)}>
                  Try again
                </WorkspaceButton>
              )}
            </div>
          )}
        </>
      )}

      <CandidateForm
        form={form}
        jobs={jobs}
        id={FORM_ID}
        onSubmit={handleSubmit}
        hidden={mode !== "form"}
        autoFocus
        onResumeFileChange={(file) => (file ? setParseError(null) : forgetPrefill())}
        resumeFileActions={form.resumeFile && parsedFile.current !== form.resumeFile ? (
          // A resume attached late in a manual entry can still fill the blanks.
          <WorkspaceButton className="h-8 px-3 text-[13px]" onClick={() => void parseResumeFile(form.resumeFile!)} disabled={parsing}>
            {parsing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSparkles aria-hidden="true" />}
            {parsing ? "Reading…" : "Fill form from resume"}
          </WorkspaceButton>
        ) : undefined}
      />

      <div className={cn(actionBarCls, mode !== "form" && "hidden")}>
        <p className="min-w-0 text-[13px] font-medium text-[var(--adm-danger-ink)]">
          {Object.keys(form.errors).length > 0 ? "Fix the highlighted fields to add this candidate." : form.error}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <WorkspaceButton onClick={() => router.push(returnTo ?? "/admin/applications")}>
            Cancel
          </WorkspaceButton>
          <WorkspaceButton type="submit" form={FORM_ID} variant="primary" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <IconSave />}
            {parsing ? "Reading resume…" : form.uploading ? "Uploading…" : forBench ? "Add to bench" : "Add applicant"}
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
