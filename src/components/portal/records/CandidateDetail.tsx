"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { Application, BenchType, Job, PipelineRecord, Submission } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { usePageCrumb } from "@/components/portal/console/provider";
import { refreshApplications, useJobSummaries } from "@/hooks/use-console-data";
import { statusMeta, type AppStatus } from "@/components/portal/console/theme";
import { POOL_LABEL, POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { fmtDateTime } from "@/lib/format";
import { TERMINAL } from "@/lib/pipeline";
import { jobLocationLabel } from "@/lib/workplace";
import { Badge, Button, DetailSkeleton, EmptyState, ErrorState, Page, PageHeader, Panel, Spinner, usePortalRouter } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { CandidateEditDrawer } from "./CandidateEditDrawer";
import { EmailComposer } from "./EmailComposer";
import { ActionMenu, type MenuEntry } from "./Menu";
import { FactLine, RecordTabs } from "./parts";
import { JobFitCard } from "./JobFitCard";
import { PipelinePanel, PipelineRecordDrawer } from "./PipelinePanel";
import { ResumeAnalysisPanel, ResumeAnalysisSkeleton } from "./ResumeAnalysis";
import { ResumeAnalysisEditDrawer } from "./ResumeAnalysisEditDrawer";
import { ActivityTab, ApplicantDetails, NotesTab, RecordRail, StageBadge, StageTrack, TasksTab, type CandidateDetail as Detail } from "./candidate";

type TabKey = "overview" | "resume" | "pipeline" | "tasks" | "notes" | "activity";

/**
 * The candidate record: identity header, a pinned stage strip with the tabs,
 * then the tab body beside a reference rail. Stage, bench and ownership moves
 * act at once and offer Undo, the same as the applications list.
 */
export function CandidateDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const notify = useToast();
  const router = usePortalRouter();

  const [candidate, setCandidate] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [statusSaving, setStatusSaving] = useState(false);
  const [benchSaving, setBenchSaving] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisEditOpen, setAnalysisEditOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  /** Snapshot being edited; a background refresh must not reset the drawer's form. */
  const [editing, setEditing] = useState<Detail | null>(null);
  const editOpen = !!editing;
  /** The linked requisition, for the pipeline panel's client/vendor/rate defaults. */
  const [jobDetail, setJobDetail] = useState<Job | null>(null);
  /** The record form a stage move opens: Submitted asks for the submission, Interview for the interview. */
  const [stageForm, setStageForm] = useState<{ kind: "submission" | "interview"; parent: Submission | null } | null>(null);
  const [pipelineVersion, setPipelineVersion] = useState(0);
  /** One unattended retry per visit, not per render, and not a loop. */
  const autoRetried = useRef(false);

  // The edit drawer's job picker; only fetched once someone opens it.
  const { jobs: jobList } = useJobSummaries(editOpen);
  const jobs = useMemo(() => jobList ?? (jobDetail ? [jobDetail] : []), [jobList, jobDetail]);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/applications/${id}`);
      if (res.status === 404) {
        setMissing(true);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setCandidate(data.application as Detail);
    } catch (err) {
      console.error("Failed to load candidate:", err);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCandidate();
  }, [fetchCandidate]);

  /** Re-reads the record without the skeleton, e.g. to pick up server-written activity. */
  const refreshRecord = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCandidate((p) => (p ? { ...p, ...(data.application as Detail) } : p));
    } catch { /* non-fatal */ }
  }, [id]);

  // Enrich with the linked job's details, once per job, off the render path.
  const jobEnrichedRef = useRef<string | null>(null);
  useEffect(() => {
    const jobId = candidate?.jobId;
    if (!jobId || jobEnrichedRef.current === jobId) return;
    jobEnrichedRef.current = jobId;
    let cancelled = false;
    (async () => {
      try {
        const jr = await fetch(`/api/jobs/${jobId}`);
        if (!jr.ok || cancelled) return;
        const jd = await jr.json();
        // Kept whole: the pipeline panel defaults client, vendor and rates from it.
        setJobDetail((jd.job as Job) ?? null);
        setCandidate((p) =>
          p
            ? {
                ...p,
                jobTitle: p.jobTitle || jd.job?.title,
                jobDepartment: jd.job?.department,
                jobLocation: jd.job ? jobLocationLabel(jd.job) : undefined,
                jobType: jd.job?.type,
              }
            : p,
        );
      } catch { /* supplementary */ }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidate?.jobId]);

  // Poll every 5 s while the background resume analysis is running.
  useEffect(() => {
    const status = candidate?.resumeAnalysisStatus;
    if (status !== "pending" && status !== "processing") return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/applications/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        const updated = data.application as Detail;
        setCandidate((prev) => (prev ? { ...prev, ...updated } : prev));
        if (updated.resumeAnalysisStatus === "completed" || updated.resumeAnalysisStatus === "failed") {
          clearInterval(timer);
          if (updated.resumeAnalysisStatus === "completed") notify("Resume analyzed. The results are ready.");
        }
      } catch { /* non-fatal */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [candidate?.resumeAnalysisStatus, id, notify]);

  usePageCrumb(candidate?.applicationId);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    void refreshApplications();
    return data.application as Application;
  };

  /** Reversible, so it reports with Undo rather than asking first. */
  const handleStage = async (stage: AppStatus, offerUndo = true) => {
    if (!candidate || stage === candidate.status || statusSaving) return;
    const previous = candidate.status;
    setStatusSaving(true);
    try {
      const updated = await patch({ status: stage });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
      if (stage === "submitted") setStageForm({ kind: "submission", parent: null });
      else if (stage === "interview") void openInterviewForm();
      if (offerUndo) {
        notify(`${candidate.name || "Candidate"} moved to ${statusMeta[stage]?.label ?? stage}`, {
          undo: () => {
            void patch({ status: previous })
              .then((back) => setCandidate((p) => (p ? { ...p, ...back } : p)))
              .catch(() => notify("Couldn't undo that. The change is still applied.", { tone: "error" }));
          },
        });
      }
    } catch {
      notify("Couldn't change the stage. Try again.", { tone: "error" });
    } finally {
      setStatusSaving(false);
    }
  };

  /** Hangs the interview off the latest live submission, when there is one. */
  const openInterviewForm = async () => {
    let parent: Submission | null = null;
    try {
      const res = await fetch(`/api/pipeline?applicationId=${encodeURIComponent(id)}`);
      if (res.ok) {
        const records: PipelineRecord[] = (await res.json()).records || [];
        parent =
          records
            .filter((r): r is Submission => r.kind === "submission" && r.status !== "rejected" && r.status !== "withdrawn")
            .sort((a, b) => (b.occurredAt || "").localeCompare(a.occurredAt || ""))[0] ?? null;
      }
    } catch { /* recorded unattached */ }
    setStageForm({ kind: "interview", parent });
  };

  const handleRating = async (rating: number) => {
    if (!candidate) return;
    const prev = candidate.rating;
    setCandidate((p) => (p ? { ...p, rating } : p));
    try {
      await patch({ rating });
    } catch {
      setCandidate((p) => (p && p.rating === rating ? { ...p, rating: prev } : p));
      notify("Couldn't save the rating. Try again.", { tone: "error" });
    }
  };

  /** Put the candidate in a pool, or take them off the bench (null). */
  const handleBench = async (pool: BenchType | null) => {
    if (!candidate || benchSaving) return;
    const current: BenchType | null = candidate.addToTalentBench ? poolOf(candidate) : null;
    if (pool === current) return;
    setBenchSaving(true);
    const prev = candidate;
    setCandidate((p) => (p ? { ...p, addToTalentBench: !!pool, benchType: pool || p.benchType } : p));
    try {
      await patch(pool ? { addToTalentBench: true, benchType: pool } : { addToTalentBench: false });
      notify(pool ? `Added to ${POOL_LABEL[pool]}` : "Removed from the bench", {
        undo: () => {
          void patch(current ? { addToTalentBench: true, benchType: current } : { addToTalentBench: false })
            .then(() => setCandidate((p) => (p ? { ...p, addToTalentBench: !!current, benchType: current || p.benchType } : p)))
            .catch(() => notify("Couldn't undo that. The change is still applied.", { tone: "error" }));
        },
      });
    } catch {
      setCandidate(prev);
      notify("Couldn't update the talent bench. Try again.", { tone: "error" });
    } finally {
      setBenchSaving(false);
    }
  };

  const applyOwner = async (ownership: string, ownershipName: string) => {
    const updated = await patch({ ownership, ownershipName });
    setCandidate((p) => (p ? { ...p, ...updated } : p));
  };
  const undoOwner = (ownership: string, name: string) => () => {
    void applyOwner(ownership, name).catch(() => notify("Couldn't undo that. The change is still applied.", { tone: "error" }));
  };

  const handleClaim = async () => {
    if (!candidate || !user || ownerSaving) return;
    setOwnerSaving(true);
    try {
      await applyOwner(user.id, user.name || user.email || "");
      notify("You now own this candidate", { undo: undoOwner("", "") });
    } catch {
      notify("Couldn't claim ownership. Try again.", { tone: "error" });
    } finally {
      setOwnerSaving(false);
    }
  };

  const handleRelease = async () => {
    if (!candidate || ownerSaving) return;
    const prevId = candidate.ownership || "";
    const prevName = candidate.ownershipName || "";
    setOwnerSaving(true);
    try {
      await applyOwner("", "");
      notify("Released. This candidate is unassigned.", { undo: undoOwner(prevId, prevName) });
    } catch {
      notify("Couldn't release ownership. Try again.", { tone: "error" });
    } finally {
      setOwnerSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !candidate || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addNote: { text: newNote.trim() } }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCandidate((p) => (p ? { ...p, notesHistory: data.application.notesHistory } : p));
      setNewNote("");
      void refreshApplications();
    } catch {
      notify("Couldn't add the note. Try again.", { tone: "error" });
    } finally {
      setAddingNote(false);
    }
  };

  const handleViewResume = async () => {
    if (!candidate?.resumeId) return;
    try {
      const res = await fetch(`/api/resume/${candidate.resumeId}?applicationId=${encodeURIComponent(candidate.id)}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      window.open(data.downloadUrl, "_blank");
    } catch {
      notify("Couldn't open the resume; the file may have been deleted. Try again.", { tone: "error" });
    }
  };

  /** `auto` is the unattended retry: silent on the way in and on failure. */
  const handleAnalyze = async ({ auto = false }: { auto?: boolean } = {}) => {
    if (!candidate?.resumeId || analyzing) return;
    setAnalyzing(true);
    if (!auto) notify("Analyzing the resume. This can take up to a minute.", { tone: "info" });
    try {
      const res = await fetch(`/api/applications/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't analyze the resume. Try again.");
      setCandidate((p) => (p ? { ...p, ...(data.application as Detail) } : p));
      if (!auto) setActiveTab("overview");
      notify("Resume analyzed");
    } catch (err) {
      if (auto) {
        console.error("[candidate] automatic resume re-analysis failed:", err);
        await refreshRecord();
      } else {
        notify(err instanceof Error ? err.message : "Couldn't analyze the resume. Try again.", { tone: "error" });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  // A failed analysis retries itself once per visit, unless the server marked it a dead end.
  useEffect(() => {
    if (autoRetried.current || analyzing) return;
    if (!candidate?.resumeId) return;
    if (candidate.resumeAnalysisStatus !== "failed") return;
    if (candidate.resumeAnalysisRetryable === false) return;
    autoRetried.current = true;
    void handleAnalyze({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.resumeId, candidate?.resumeAnalysisStatus, candidate?.resumeAnalysisRetryable]);

  // The pinned strip's height, so the sticky rail parks below it.
  const stripRef = useRef<HTMLDivElement>(null);
  const [stripH, setStripH] = useState(0);
  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setStripH(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [candidate?.id]);

  const back = candidate?.addToTalentBench ? { href: "/portal/talent-bench", label: "Talent bench" } : { href: "/portal/applications", label: "Applications" };

  if (loading) return <DetailSkeleton label="Loading candidate" />;

  if (error || missing || !candidate) {
    return (
      <Page>
        <PageHeader back={back} title="Candidate" />
        {error && !missing ? (
          <ErrorState title="Couldn't load this candidate" message={error} onRetry={() => void fetchCandidate()} />
        ) : (
          <EmptyState
            framed
            icon="search"
            title="This candidate doesn't exist"
            body="The record may have been removed, or the link is out of date."
            primary={{ label: "Go to applications", href: "/portal/applications" }}
          />
        )}
      </Page>
    );
  }

  const notes = candidate.notesHistory || [];
  const history = candidate.statusHistory || [];
  const activity = candidate.activity || [];
  const tasks = candidate.tasks || [];
  const openTasks = tasks.filter((t) => !t.done).length;
  const legacyNote = candidate.notes?.trim() && !notes.some((n) => n.id === "legacy" || n.text === candidate.notes) ? 1 : 0;

  const stageSince = [...history].reverse().find((h) => h.status === candidate.status)?.changedAt || candidate.appliedAt;
  const sinceDate = new Date(stageSince);
  const daysInStage = isNaN(sinceDate.getTime()) ? null : Math.max(0, Math.floor((Date.now() - sinceDate.getTime()) / 86400000));
  const isOwner = candidate.ownership === user?.id;
  const hasAnalysis = !!candidate.resumeAnalysis;
  // Once hired or rejected the fit score is history, so it drops below the details.
  const isTerminal = TERMINAL.has(candidate.status);
  const pool = candidate.addToTalentBench ? poolOf(candidate) : null;
  const location = [candidate.city, candidate.state].filter(Boolean).join(", ");

  const tabs = [
    { key: "overview" as TabKey, label: "Overview", icon: "dashboard" as const },
    { key: "resume" as TabKey, label: "Resume", icon: "resume" as const },
    { key: "pipeline" as TabKey, label: "Pipeline", icon: "funnel" as const },
    { key: "tasks" as TabKey, label: "Tasks", icon: "check" as const, count: openTasks },
    { key: "notes" as TabKey, label: "Notes", icon: "quote" as const, count: notes.length + legacyNote },
    { key: "activity" as TabKey, label: "Activity", icon: "activity" as const, count: history.length + activity.length },
  ];

  const analysing = analyzing || candidate.resumeAnalysisStatus === "pending" || candidate.resumeAnalysisStatus === "processing";
  const analysisCta = candidate.resumeId ? (
    analysing ? (
      <div className="grid gap-4">
        <p role="status" className="flex items-start gap-2.5 rounded-lg bg-ocean-50 px-4 py-3 text-adm-base text-navy-900 ring-1 ring-inset ring-ocean-200">
          <Spinner className="mt-0.5 size-4 text-ocean-700" />
          <span>
            <span className="font-semibold">Analyzing the resume…</span> Extracting experience, education and skills. Usually under a minute; the page updates by itself.
          </span>
        </p>
        <ResumeAnalysisSkeleton />
      </div>
    ) : (
      <EmptyState
        framed
        icon="sparkle"
        title={candidate.resumeAnalysisStatus === "failed" ? "The last analysis didn't finish" : "Resume not analyzed yet"}
        body={
          candidate.resumeAnalysisStatus === "failed" && candidate.resumeAnalysisError
            ? candidate.resumeAnalysisError
            : "Extract structured experience, education and skills from the attached resume. This can take up to a minute."
        }
        primary={{ label: candidate.resumeAnalysisStatus === "failed" ? "Retry analysis" : "Analyze resume", icon: "sparkle", onClick: () => void handleAnalyze() }}
      />
    )
  ) : (
    <EmptyState
      framed
      icon="resume"
      title="No resume details yet"
      body="No resume is attached. Add skills, experience and education by hand, or attach a resume from Edit profile."
      primary={{ label: "Add details manually", icon: "plus", onClick: () => setAnalysisEditOpen(true) }}
    />
  );

  const benchMenu: MenuEntry[] = [
    { kind: "label", label: "Talent bench" },
    ...POOL_ORDER.map((p) => ({
      label: pool === p ? `In ${POOL_LABEL[p]}` : `Add to ${POOL_LABEL[p]}`,
      hint: POOL_META[p].hint,
      checked: pool === p,
      onSelect: () => void handleBench(p),
    })),
    ...(candidate.addToTalentBench ? [{ label: "Remove from the bench", icon: "x" as const, danger: true, onSelect: () => void handleBench(null) }] : []),
  ];

  return (
    <Page>
      <PageHeader
        back={back}
        title={candidate.name || "Unnamed candidate"}
        meta={
          <>
            <StageBadge status={candidate.status} />
            {pool && <Badge tone={pool === "internal" ? "blue" : "green"}>{POOL_LABEL[pool]}</Badge>}
            {!candidate.ownership && <Badge tone="red" dot>Unclaimed</Badge>}
          </>
        }
        description={
          <>
            {candidate.jobTitle && (
              <span className="block">
                Applied for{" "}
                {candidate.jobId ? (
                  <a href={`/portal/jobs/${candidate.jobId}`} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
                    {candidate.jobTitle}
                  </a>
                ) : (
                  <span className="font-medium text-navy-900">{candidate.jobTitle}</span>
                )}
                {candidate.jobDepartment && ` · ${candidate.jobDepartment}`}
              </span>
            )}
            <FactLine
              items={[
                ...(candidate.email ? [{ icon: "mail" as const, text: <a href={`mailto:${candidate.email}`} className="hover:underline">{candidate.email}</a> }] : []),
                ...(candidate.phone ? [{ icon: "phone" as const, text: <a href={`tel:${candidate.phone}`} className="tabular-nums hover:underline">{candidate.phone}</a> }] : []),
                ...(location ? [{ icon: "map" as const, text: location }] : []),
              ]}
            />
          </>
        }
        actions={
          <>
            {candidate.email && (
              <Button variant="secondary" icon="mail" onClick={() => setEmailOpen(true)}>
                Email
              </Button>
            )}
            <Button variant="secondary" icon="edit" onClick={() => setEditing(candidate)}>
              Edit profile
            </Button>
            <ActionMenu
              width="w-72"
              items={[
                ...(candidate.jobId ? [{ label: "View job posting", icon: "briefcase" as const, onSelect: () => router.push(`/portal/jobs/${candidate.jobId}`) }] : []),
                ...(!candidate.ownership ? [{ label: "Claim this candidate", icon: "userCheck" as const, onSelect: () => void handleClaim() }] : []),
                { label: "Edit on a full page", icon: "external" as const, onSelect: () => router.push(`/portal/applications/${id}/edit?return=/portal/candidates/${id}`) },
                { kind: "separator" },
                ...benchMenu,
              ]}
            />
          </>
        }
      />

      {/* Pinned while the record scrolls: where they are, the next move, and the tabs. */}
      <div ref={stripRef} className="sticky top-16 z-20 grid gap-3 rounded-xl bg-mist-0 p-4 ring-1 ring-mist-200 sm:pb-0">
        <StageTrack status={candidate.status} saving={statusSaving} daysInStage={daysInStage} onStage={(s) => void handleStage(s)} />
        <RecordTabs label="Candidate record" tabs={tabs} value={activeTab} onChange={setActiveTab} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]" style={{ "--strip": `${stripH}px` } as React.CSSProperties}>
        <div className="grid min-w-0 gap-6">
          {activeTab === "overview" && (
            <>
              {!isTerminal && hasAnalysis && <JobFitCard applicationId={id} />}
              <ApplicantDetails candidate={candidate} onEdit={() => setEditing(candidate)} />
              {!hasAnalysis && candidate.experience && (
                <Panel title="Experience">
                  <p className="whitespace-pre-line text-adm-base leading-normal text-mist-700">{candidate.experience}</p>
                </Panel>
              )}
              {candidate.coverLetter && (
                <Panel title="Cover letter">
                  <p className="whitespace-pre-line text-adm-base leading-normal text-mist-700">{candidate.coverLetter}</p>
                </Panel>
              )}
              {isTerminal && hasAnalysis && <JobFitCard applicationId={id} />}
              {!hasAnalysis && analysisCta}
            </>
          )}

          {activeTab === "resume" &&
            (hasAnalysis ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-adm-md font-semibold text-navy-900">Resume analysis</h2>
                    {candidate.resumeAnalyzedAt && <p className="text-adm-base text-mist-600">Last analyzed <span className="tabular-nums">{fmtDateTime(candidate.resumeAnalyzedAt)}</span></p>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" icon="edit" onClick={() => setAnalysisEditOpen(true)}>
                      Edit
                    </Button>
                    <Button variant="secondary" icon="refresh" loading={analyzing} onClick={() => void handleAnalyze()}>
                      Re-analyze
                    </Button>
                  </div>
                </div>
                <ResumeAnalysisPanel analysis={candidate.resumeAnalysis!} />
              </>
            ) : (
              analysisCta
            ))}

          {activeTab === "pipeline" && (
            <PipelinePanel
              applicationId={id}
              candidateName={candidate.name}
              jobId={candidate.jobId}
              jobTitle={candidate.jobTitle}
              defaultClientId={jobDetail?.clientId}
              defaultClientName={jobDetail?.clientName}
              defaultVendorId={jobDetail?.vendorId}
              defaultVendorName={jobDetail?.vendorName}
              defaultBillRate={jobDetail?.clientBillRate}
              defaultPayRate={jobDetail?.payRate}
              onStatusAdvanced={(status) => setCandidate((p) => (p ? { ...p, status: status as Detail["status"] } : p))}
              refreshKey={pipelineVersion}
            />
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={notes}
              legacy={candidate.notes}
              legacyAt={candidate.appliedAt}
              authorName={user?.name || user?.email || "You"}
              value={newNote}
              onChange={setNewNote}
              onSubmit={handleAddNote}
              saving={addingNote}
            />
          )}

          {activeTab === "tasks" && user && (
            <TasksTab
              applicationId={id}
              tasks={tasks}
              me={{ id: user.id, name: user.name || user.email || "Me" }}
              onChange={(next) => {
                setCandidate((p) => (p ? { ...p, tasks: next } : p));
                void refreshRecord();
              }}
            />
          )}

          {activeTab === "activity" && <ActivityTab history={history} activity={activity} />}
        </div>

        <div className="min-w-0 lg:sticky lg:top-[calc(var(--strip,7rem)+5.5rem)]">
          <RecordRail
            candidate={candidate}
            isOwner={isOwner}
            ownerSaving={ownerSaving}
            hasAnalysis={hasAnalysis}
            onClaim={() => void handleClaim()}
            onRelease={() => void handleRelease()}
            onRate={(n) => void handleRating(n)}
            onViewResume={() => void handleViewResume()}
            onOpenTasks={() => setActiveTab("tasks")}
          />
        </div>
      </div>

      {/* Opened by a move to Submitted or Interview; cancelling keeps the move. */}
      {stageForm && (
        <PipelineRecordDrawer
          key={stageForm.kind}
          kind={stageForm.kind}
          record={null}
          parentSubmission={stageForm.parent}
          applicationId={id}
          candidateName={candidate.name}
          jobId={candidate.jobId}
          jobTitle={candidate.jobTitle}
          defaults={{
            clientId: jobDetail?.clientId, clientName: jobDetail?.clientName,
            vendorId: jobDetail?.vendorId, vendorName: jobDetail?.vendorName,
            billRate: jobDetail?.clientBillRate, payRate: jobDetail?.payRate,
          }}
          onClose={() => setStageForm(null)}
          onSaved={(advanced) => {
            setStageForm(null);
            setPipelineVersion((v) => v + 1);
            if (advanced) setCandidate((p) => (p ? { ...p, status: advanced as Detail["status"] } : p));
            void refreshRecord();
          }}
        />
      )}

      <EmailComposer
        open={emailOpen}
        onOpenChange={setEmailOpen}
        applicationId={id}
        candidate={candidate}
        senderName={user?.name || user?.email || ""}
        onSent={() => void refreshRecord()}
      />

      <CandidateEditDrawer
        open={editOpen}
        onOpenChange={(o) => !o && setEditing(null)}
        mode="edit"
        candidate={editing}
        jobs={jobs}
        onSaved={(saved) => {
          setCandidate((p) => (p ? { ...p, ...(saved as Detail) } : p));
          // A job change re-enriches the job facts.
          jobEnrichedRef.current = null;
          void refreshRecord();
        }}
      />

      <ResumeAnalysisEditDrawer
        open={analysisEditOpen}
        onOpenChange={setAnalysisEditOpen}
        application={candidate}
        onSaved={(app) => setCandidate((p) => (p ? { ...p, ...(app as Detail) } : p))}
      />
    </Page>
  );
}
