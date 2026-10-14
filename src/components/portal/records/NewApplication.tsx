"use client";

import React, { useMemo, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { POOL_LABEL, poolOf } from "@/lib/bench";
import { CandidateForm, returnLabel, returnPath } from "@/components/portal/records/CandidateForm";
import { useCandidateForm, type CandidateFormValues } from "@/hooks/use-candidate-form";
import { buildResumePrefill, filledKeys, PREFILL_LABELS, type ResumePrefill } from "@/lib/resume-prefill";
import { useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { Button, EmptyState, ErrorState, Page, PageHeader, Panel, Skeleton, Spinner } from "@/components/portal/kit";
import { FieldError, FormBanner, Notice, RESUME_ACCEPT, RESUME_HINT, StickyActions } from "@/components/portal/fields";
import Icon from "@/components/portal/icons";

/** Ties the action-bar submit button to the form it sits outside of. */
const FORM_ID = "applicant-form";
// One choice on the first step: equal cards with icon, title, line and hint
const OPTION = "flex h-full flex-col rounded-xl p-5 text-left transition-colors";

function NewApplicationInner() {
  const router = useRouter();
  const params = useSearchParams();
  // ?bench=1 is the talent bench's "Add profile": on the bench, and back there after saving.
  const forBench = params.get("bench") === "1";
  const returnTo = returnPath(params.get("return")) ?? (forBench ? "/portal/talent-bench" : null);
  const initialJobId = params.get("jobId") ?? "";

  const initial = useMemo<Partial<CandidateFormValues>>(
    () => (forBench ? { addToTalentBench: true, status: "active", jobId: initialJobId } : { jobId: initialJobId }),
    [forBench, initialJobId],
  );
  const form = useCandidateForm({ mode: "create", initial });
  const { values, setValues } = form;

  // The job picker stays empty on failure; the record can still be saved.
  const { jobs: jobList } = useJobSummaries();
  const jobs = useMemo<Job[]>(() => jobList ?? [], [jobList]);

  // The form stays hidden until the recruiter chooses: reading the resume first
  // fills most of it in, and an empty form invites re-typing what the document says.
  const [mode, setMode] = useState<"choose" | "reading" | "bench" | "form">("choose");
  // Bench route: the profile's fields and stored resume go into a NEW application.
  const [benchWanted, setBenchWanted] = useState(false);
  const benchRes = useApplicationSummaries({ bench: true, enabled: benchWanted });
  const benchList = benchRes.applications ?? null;
  const benchError = !benchList && benchRes.error ? benchRes.error.message || "Couldn't load the talent bench." : null;
  const [benchQuery, setBenchQuery] = useState("");
  const [benchPicking, setBenchPicking] = useState<string | null>(null);
  const [benchFrom, setBenchFrom] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  // Separate from the file's own error: a failed READ must be visible from the top of the page.
  const [parseError, setParseError] = useState<string | null>(null);
  const [prefillFrom, setPrefillFrom] = useState<string | null>(null);
  const [prefillFields, setPrefillFields] = useState<string[]>([]);
  // Sent with the record so the server stores it instead of re-running the 30–90s pipeline.
  const [parsedAnalysis, setParsedAnalysis] = useState<unknown>(null);
  // By identity, not name: many files are called "resume.pdf".
  const parsedFile = useRef<File | null>(null);
  const [dropping, setDropping] = useState(false);

  const openBench = () => {
    form.setResumeError(null);
    setMode("bench");
    if (!benchWanted) setBenchWanted(true);
    else if (benchError) void benchRes.reload();
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
      if (!res.ok) throw new Error(data.error || "Couldn't read this resume. Try again.");

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
      setParseError(err instanceof Error ? err.message : "Couldn't read this resume. Try again.");
    } finally {
      setParsing(false);
    }
  };

  /**
   * Chooser path: read the file BEFORE showing the form. `applyPrefill` keeps
   * typed values, so typing during the parse would silently discard parsed ones.
   */
  const startFromResume = (file: File | undefined) => {
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
    if (saved) router.push(returnTo ?? `/portal/candidates/${saved.id}`);
  };

  const busy = form.busy || parsing;
  const jobTitle = values.jobTitle || jobs.find((j) => j.id === values.jobId)?.title;
  const back = returnTo
    ? { href: returnTo, label: returnLabel(returnTo) }
    : initialJobId
      ? { href: `/portal/jobs/${initialJobId}`, label: "Job" }
      : { href: "/portal/applications", label: "Applications" };
  const errorCount = Object.keys(form.errors).length;

  return (
    <Page width="narrow">
      <PageHeader
        back={back}
        icon={forBench ? "bench" : "inbox"}
        title={forBench ? "Add bench profile" : "New applicant"}
        description={
          values.jobId && jobTitle ? (
            <>
              Applying for <span className="font-medium text-navy-900">{jobTitle}</span> ·{" "}
              <Link href={`/portal/jobs/${values.jobId}`} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
                View job
              </Link>
            </>
          ) : forBench ? (
            "Add a candidate to the talent bench."
          ) : (
            "Create a candidate record and place it on the pipeline."
          )
        }
      />

      <FormBanner message={form.error} onDismiss={() => form.setError(null)} />

      {mode === "choose" && (
        <Panel title="How do you want to add this candidate?" description="Reading a resume fills most of the form for you to check.">
          <div className={`grid gap-3 ${forBench ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDropping(true);
              }}
              onDragLeave={() => setDropping(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDropping(false);
                startFromResume(e.dataTransfer.files?.[0]);
              }}
              className={`${OPTION} cursor-pointer border-2 border-dashed focus-within:ring-2 focus-within:ring-ocean-600 ${
                dropping ? "border-ocean-500 bg-ocean-50" : "border-ocean-300 bg-ocean-50/50 hover:border-ocean-500 hover:bg-ocean-50"
              }`}
            >
              <input
                type="file"
                accept={RESUME_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = ""; // let the same file be re-picked after an error
                  startFromResume(file);
                }}
              />
              <span className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-lg bg-ocean-600 text-white">
                  <Icon name="upload" className="size-5" />
                </span>
                <span className="rounded-full bg-mist-0 px-2 py-0.5 text-[12px] font-medium text-ocean-700 ring-1 ring-inset ring-ocean-200">Fastest</span>
              </span>
              <span className="mt-3 text-[15px] font-semibold text-navy-900">Upload a resume</span>
              <span className="mt-1 text-[14px] text-mist-600">We read the name, contact, skills and experience and fill the form for you to check.</span>
              <span className="mt-auto pt-3 text-[12px] text-mist-500">{RESUME_HINT}. Drop it here or click.</span>
            </label>
            <button
              type="button"
              onClick={() => {
                form.setResumeError(null);
                setMode("form");
              }}
              className={`${OPTION} ring-1 ring-inset ring-mist-300 hover:bg-mist-50 hover:ring-mist-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600`}
            >
              <span className="grid size-10 place-items-center rounded-lg bg-mist-100 text-navy-800">
                <Icon name="edit" className="size-5" />
              </span>
              <span className="mt-3 text-[15px] font-semibold text-navy-900">Enter details manually</span>
              <span className="mt-1 text-[14px] text-mist-600">Type the essentials now and attach a resume later if you have one.</span>
              <span className="mt-auto pt-3 text-[12px] text-mist-500">Only name and email are required.</span>
            </button>
            {!forBench && (
              <button type="button" onClick={openBench} className={`${OPTION} ring-1 ring-inset ring-mist-300 hover:bg-mist-50 hover:ring-mist-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600`}>
                <span className="grid size-10 place-items-center rounded-lg bg-mist-100 text-navy-800">
                  <Icon name="bench" className="size-5" />
                </span>
                <span className="mt-3 text-[15px] font-semibold text-navy-900">Pick from talent bench</span>
                <span className="mt-1 text-[14px] text-mist-600">Put someone already on the bench forward for a role, with their details carried over.</span>
                <span className="mt-auto pt-3 text-[12px] text-mist-500">Searches both pools.</span>
              </button>
            )}
          </div>
          <FieldError>{form.resumeError}</FieldError>
        </Panel>
      )}

      {mode === "bench" && (
        <Panel
          title="Pick from talent bench"
          description={benchList ? `${benchList.length} on the bench. Their details and resume are copied into a new application.` : undefined}
          action={
            <Button variant="ghost" icon="chevronLeft" onClick={() => setMode("choose")}>
              Back
            </Button>
          }
          padded={false}
        >
          <div className="border-b border-mist-200 p-4">
            <label className="relative block">
              <span className="sr-only">Search the bench</span>
              <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
              <input
                type="search"
                autoComplete="off"
                value={benchQuery}
                onChange={(e) => setBenchQuery(e.target.value)}
                placeholder="Search name, email or skill"
                className="h-10 w-full rounded-lg bg-mist-0 pl-9 pr-3 text-[14px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600"
              />
            </label>
          </div>
          {benchError ? (
            <ErrorState framed={false} title="Couldn't load the talent bench" message={benchError} onRetry={() => void benchRes.reload()} retrying={benchRes.isLoading} />
          ) : !benchList ? (
            <ul role="status" aria-label="Loading the bench" className="divide-y divide-mist-100">
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="size-9 rounded-full" />
                  <span className="grid flex-1 gap-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-64 max-w-full" />
                  </span>
                </li>
              ))}
            </ul>
          ) : benchMatches.length === 0 ? (
            <EmptyState
              compact
              variant={benchList.length === 0 ? "plain" : "no-results"}
              icon="bench"
              title={benchList.length === 0 ? "Nobody on the bench yet" : "No matching bench profiles"}
              body={benchList.length === 0 ? "Add candidates to the bench from their record, then pick them here." : "Try a different name, email or skill."}
              onClearFilters={benchList.length ? () => setBenchQuery("") : undefined}
            />
          ) : (
            <ul className="scroll-thin max-h-[60vh] divide-y divide-mist-100 overflow-y-auto">
              {benchMatches.map((a) => (
                <li key={a.id}>
                  <button
                    type="button"
                    disabled={!!benchPicking}
                    onClick={() => void pickFromBench(a)}
                    className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-mist-50 disabled:opacity-60"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[14px] font-medium text-navy-900">{a.name || a.email}</span>
                      <span className="block truncate text-[12px] text-mist-600">
                        {[a.email, a.jobTitle, (a.skills || []).slice(0, 4).join(", ")].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="hidden shrink-0 text-[12px] text-mist-600 sm:block">{POOL_LABEL[poolOf(a)]}</span>
                    {benchPicking === a.id ? <Spinner className="size-4 text-ocean-600" /> : <Icon name="chevronRight" className="size-4 shrink-0 text-mist-400" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}

      {mode === "reading" && (
        <Panel>
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <Spinner className="size-7 text-ocean-600" />
            <p className="mt-4 text-[16px] font-semibold text-navy-900" role="status" aria-live="polite">
              Reading {form.resumeFile?.name ?? "the resume"}…
            </p>
            <p className="mt-1.5 max-w-md text-[14px] leading-relaxed text-mist-600">
              Pulling out name, contact details, location, skills and experience. This usually takes a few seconds and can take up to a
              minute. The form opens filled in, ready for you to check.
            </p>
            <Button variant="ghost" className="mt-5" onClick={() => setMode("form")}>
              Skip and fill it in myself
            </Button>
          </div>
        </Panel>
      )}

      {mode === "form" && (
        <>
          {parsing && (
            <Notice tone="info" icon="refresh" role="status">
              Still reading {form.resumeFile?.name ?? "the resume"}; empty fields may fill in shortly. Anything you type stays as you typed it.
            </Notice>
          )}
          {benchFrom && (
            <Notice tone="info" icon="bench">
              Filled from <span className="font-medium">{benchFrom}</span>&apos;s bench profile. Check the values before saving; they stay on the bench.
            </Notice>
          )}
          {!parsing && prefillFrom && (
            <Notice tone="info" icon="sparkle">
              Filled from <span className="font-medium">{prefillFrom}</span>: {prefillFields.join(", ")}. Check the values before saving; the file will be
              attached to the record.
            </Notice>
          )}
          {/* A failed read is not a failed record: the form still works and the file is still attached. */}
          {!parsing && parseError && (
            <Notice
              tone="warning"
              role="alert"
              action={
                form.resumeFile ? (
                  <Button size="sm" variant="secondary" onClick={() => void parseResumeFile(form.resumeFile!)}>
                    Try again
                  </Button>
                ) : undefined
              }
            >
              Couldn&apos;t read the resume, enter the details below instead. {parseError}
            </Notice>
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
        resumeFileActions={
          form.resumeFile && parsedFile.current !== form.resumeFile ? (
            // A resume attached late in a manual entry can still fill the blanks.
            <Button size="sm" variant="secondary" icon="sparkle" loading={parsing} onClick={() => void parseResumeFile(form.resumeFile!)}>
              {parsing ? "Reading…" : "Fill form from resume"}
            </Button>
          ) : undefined
        }
      />

      {mode === "form" && (
        <StickyActions
          status={
            errorCount > 0 ? (
              <span className="font-medium text-[#b42318]">Fix the highlighted fields to add this candidate.</span>
            ) : (
              "First name and email are all you need to save."
            )
          }
        >
          <Button variant="secondary" onClick={() => router.push(returnTo ?? "/portal/applications")}>
            Cancel
          </Button>
          <Button icon="check" loading={busy} onClick={() => (document.getElementById(FORM_ID) as HTMLFormElement | null)?.requestSubmit()}>
            {parsing ? "Reading resume…" : form.uploading ? "Uploading…" : forBench ? "Add to bench" : "Add applicant"}
          </Button>
        </StickyActions>
      )}
    </Page>
  );
}

export function NewApplication() {
  return (
    <Suspense>
      <NewApplicationInner />
    </Suspense>
  );
}
