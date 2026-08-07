"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import type { Application, BenchType, Job, NoteEntry } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { AdminDetailSkeleton } from "@/components/admin/skeletons";
import { ResumeAnalysisPanel } from "@/components/admin/resume-analysis-panel";
import { ResumeAnalysisEditDrawer } from "@/components/admin/resume-analysis-edit-drawer";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { JobFitCard } from "@/components/admin/job-fit-card";
import { PipelinePanel } from "@/components/admin/pipeline-panel";
import { WorkspaceButton } from "@/components/admin/workspace";
import { EmptyState } from "@/components/admin/empty-state";
import { RecordBar } from "@/components/admin/candidate/record-bar";
import { StageRail } from "@/components/admin/candidate/stage-rail";
import { ApplicantDetails } from "@/components/admin/candidate/applicant-details";
import { RecordSidebar } from "@/components/admin/candidate/record-sidebar";
import { NotesTab } from "@/components/admin/candidate/notes-tab";
import { ActivityTab } from "@/components/admin/candidate/activity-tab";
import {
  IconPipeline, IconAlert, IconEdit, IconFile, IconHistory,
  IconMessageText, IconRefresh, IconSparkles,
} from "@/components/admin/icons";
import { useAdmin, usePageCrumb } from "@/components/admin/admin-provider";
import { type AppStatus } from "@/components/admin/theme";
// Still needed by handleBenchChange, which resolves the candidate's current
// pool before deciding whether a change is a no-op.
import { POOL_LABEL, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { TERMINAL } from "@/lib/pipeline";

interface CandidateDetail extends Application {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

type TabKey = "overview" | "resume" | "pipeline" | "activity" | "notes";

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { openCandidateEditor } = useAdmin();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [statusSaving, setStatusSaving] = useState(false);
  const [benchSaving, setBenchSaving]   = useState(false);
  const [ownerSaving, setOwnerSaving]   = useState(false);
  const [newNote, setNewNote]   = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisEditOpen, setAnalysisEditOpen] = useState(false);
  /** The linked requisition, for the pipeline panel's client/vendor/rate defaults. */
  const [jobDetail, setJobDetail] = useState<Job | null>(null);
  /** One unattended retry per visit — not per render, and not a loop. */
  const autoRetried = useRef(false);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Candidate not found");
      // Render the candidate immediately; the linked job's details are enriched
      // in a separate non-blocking effect below so the job fetch never blocks paint.
      setCandidate(data.application as CandidateDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchCandidate(); }, [fetchCandidate]);

  // Enrich with the linked job's details — fetched once per job, off the render path.
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
        // Kept whole as well as flattened: the pipeline panel defaults a
        // submission's client, vendor and rates from the requisition, so a
        // recruiter is not retyping what the job already says.
        setJobDetail((jd.job as Job) ?? null);
        setCandidate((p) => (p ? {
          ...p,
          jobTitle:      p.jobTitle || jd.job?.title,
          jobDepartment: jd.job?.department,
          jobLocation:   jd.job?.location,
          jobType:       jd.job?.type,
        } : p));
      } catch { /* non-fatal, job details are supplementary */ }
    })();
    return () => { cancelled = true; };
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
        const updated = data.application as CandidateDetail;
        setCandidate((prev) => (prev ? { ...prev, ...updated } : prev));
        if (updated.resumeAnalysisStatus === "completed" || updated.resumeAnalysisStatus === "failed") {
          clearInterval(timer);
          if (updated.resumeAnalysisStatus === "completed") {
            toast.success("Resume analyzed, results are ready");
          }
        }
      } catch { /* non-fatal */ }
    }, 5000);
    return () => clearInterval(timer);
  }, [candidate?.resumeAnalysisStatus, id]);

  // Show the application code (e.g. APP-2026-0103) as the top-nav breadcrumb.
  usePageCrumb(candidate?.applicationId);

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/applications/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Request failed");
    const data = await res.json();
    return data.application as Application;
  };

  const handleStageClick = async (stage: AppStatus) => {
    if (!candidate || stage === candidate.status || statusSaving) return;
    setStatusSaving(true);
    try {
      const updated = await patch({ status: stage, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { toast.error("Failed to update status"); }
    finally { setStatusSaving(false); }
  };

  const handleRating = async (rating: number) => {
    if (!candidate) return;
    const next = rating === candidate.rating ? 0 : rating;
    setCandidate((p) => (p ? { ...p, rating: next } : p));
    try { await patch({ rating: next }); } catch { toast.error("Failed to update rating"); }
  };

  /** Put the candidate in a pool, or take them off the bench entirely (null). */
  const handleBenchChange = async (pool: BenchType | null) => {
    if (!candidate || benchSaving) return;
    const current: BenchType | null = candidate.addToTalentBench ? poolOf(candidate) : null;
    if (pool === current) return;
    setBenchSaving(true);
    const prev = candidate;
    setCandidate((p) => (p ? { ...p, addToTalentBench: !!pool, benchType: pool || p.benchType } : p));
    try {
      await patch(pool
        ? { addToTalentBench: true, benchType: pool, benchAddedBy: user?.email || user?.id }
        : { addToTalentBench: false });
      toast.success(pool ? `Added to ${POOL_LABEL[pool]}` : "Removed from bench");
    } catch {
      setCandidate(prev);
      toast.error("Failed to update talent bench");
    } finally { setBenchSaving(false); }
  };

  const handleClaimOwnership = async () => {
    if (!candidate || !user || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: user.id, ownershipName: user.name || user.email });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { toast.error("Failed to claim ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleReleaseOwnership = async () => {
    if (!candidate || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: "", ownershipName: "" });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { toast.error("Failed to release ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !candidate || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addNote: { text: newNote.trim(), addedBy: user?.id || "admin", addedByName: user?.name || user?.email || "Admin" } }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCandidate((p) => (p ? { ...p, notesHistory: data.application.notesHistory } : p));
      setNewNote("");
    } catch { toast.error("Failed to add note"); }
    finally { setAddingNote(false); }
  };

  const handleViewResume = async () => {
    if (!candidate?.resumeId) return;
    try {
      const res = await fetch(`/api/resume/${candidate.resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      window.open(data.downloadUrl, "_blank");
    } catch { toast.error("Failed to load resume. The file may have been deleted."); }
  };

  /**
   * Run the analysis. `auto` is the unattended retry: it says nothing on the way
   * in and nothing on failure, because nobody asked for it — only a success is
   * worth interrupting the page for.
   */
  const handleAnalyze = async ({ auto = false }: { auto?: boolean } = {}) => {
    if (!candidate?.resumeId || analyzing) return;
    setAnalyzing(true);
    const toastId = auto ? undefined : toast.loading("Analyzing resume… this can take up to a minute.");
    try {
      const res = await fetch(`/api/applications/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setCandidate((p) => (p ? { ...p, ...(data.application as CandidateDetail) } : p));
      if (!auto) setActiveTab("overview");
      toast.success("Resume analyzed", { id: toastId });
    } catch (err) {
      if (auto) {
        // The record now carries the fresh failure and its retryable flag; the
        // panel shows it. A toast on a retry nobody asked for is just noise.
        console.error("[candidate] automatic resume re-analysis failed:", err);
        await refreshAnalysisState();
      } else {
        toast.error(err instanceof Error ? err.message : "Analysis failed", { id: toastId });
      }
    } finally {
      setAnalyzing(false);
    }
  };

  /** Pull just the analysis fields back after an unattended attempt. */
  const refreshAnalysisState = async () => {
    try {
      const res = await fetch(`/api/applications/${id}`);
      if (!res.ok) return;
      const data = await res.json();
      setCandidate((p) => (p ? { ...p, ...(data.application as CandidateDetail) } : p));
    } catch { /* non-fatal — the stale message stays on screen */ }
  };

  // A failed analysis retries itself once per visit. Most failures are not about
  // this candidate at all (a rejected extraction token, the service down, a
  // timeout), so the record should heal on the next view rather than sit on
  // "didn't finish" until somebody notices the button. Dead ends — no resume, the
  // file gone from storage, a document nothing can be read from — are flagged
  // non-retryable server-side and left alone. Records that failed before the flag
  // existed have it undefined, and get one chance.
  useEffect(() => {
    if (autoRetried.current || analyzing) return;
    if (!candidate?.resumeId) return;
    if (candidate.resumeAnalysisStatus !== "failed") return;
    if (candidate.resumeAnalysisRetryable === false) return;
    autoRetried.current = true;
    void handleAnalyze({ auto: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate?.resumeId, candidate?.resumeAnalysisStatus, candidate?.resumeAnalysisRetryable]);

  /* The pinned header's height is measured, not assumed. The sidebar is also
     sticky, and its top offset has to clear this block — which changes height
     with the candidate (a long name wraps, a missing phone shortens the contact
     row, the bench chip appears and disappears). A hard-coded offset is right
     for exactly one record; a ResizeObserver is right for all of them. */
  const headerRef = useRef<HTMLDivElement>(null);
  const [headerH, setHeaderH] = useState(0);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setHeaderH(e.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, [candidate?.id]);

  if (loading) return <AdminDetailSkeleton />;

  if (error || !candidate) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-[6px] bg-[var(--adm-danger-soft)]">
            <IconAlert className="h-6 w-6 text-[var(--adm-danger)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--adm-ink)]">{error || "Candidate not found"}</p>
            <p className="mt-1 text-sm text-[var(--adm-ink-subtle)]">This record may have been removed.</p>
          </div>
          <WorkspaceButton variant="primary" onClick={() => router.push("/admin/applications")}>
            Back to candidates
          </WorkspaceButton>
        </div>
      </div>
    );
  }

  const notes: NoteEntry[] = candidate.notesHistory || [];
  const history = candidate.statusHistory || [];

  // How long the candidate has been sitting in the current stage; falls back
  // to the application date for records with no history entries.
  const stageSince = [...history].reverse().find((h) => h.status === candidate.status)?.changedAt
    || candidate.appliedAt;
  const stageSinceDate = new Date(stageSince);
  const daysInStage = isNaN(stageSinceDate.getTime())
    ? null
    : Math.max(0, Math.floor((Date.now() - stageSinceDate.getTime()) / 86400000));
  const isOwner = candidate.ownership === user?.id;
  const hasAnalysis = !!candidate.resumeAnalysis;

  /* Terminal candidates (hired / rejected) get a different page order. The fit
     score is a decision aid; once the decision is made it is a historical
     artifact, and giving it the top slot on a hired candidate spends the best
     space on the page answering a question nobody is still asking. */
  const isTerminal = TERMINAL.has(candidate.status);

  const TABS = [
    { key: "overview" as TabKey, label: "Overview", icon: IconFile,        count: undefined as number | undefined },
    // The parsed resume — work history, skills, education, projects — is ~1,660px
    // of reference material. It was the default view; it is now a tab, so the
    // Overview answers "who is this and should we proceed" in one screen.
    { key: "resume"   as TabKey, label: "Resume",   icon: IconSparkles,    count: undefined as number | undefined },
    { key: "pipeline" as TabKey, label: "Pipeline", icon: IconPipeline,    count: undefined as number | undefined },
    { key: "notes"    as TabKey, label: "Notes",    icon: IconMessageText, count: notes.length },
    { key: "activity" as TabKey, label: "Activity", icon: IconHistory,     count: history.length },
  ];

  /* The analyse call-to-action. Defined once and placed by state rather than
     duplicated: it belongs on Overview when there is nothing to read yet (it is
     an action), and stands in for the Resume tab's content when that tab is
     opened before anything has been parsed. */
  const analysisCta = candidate.resumeId ? (
    <AdminCard>
      {/* `analyzing` is included so an automatic retry shows as work in progress
          instead of leaving the previous failure on screen. */}
      {analyzing || candidate.resumeAnalysisStatus === "pending" || candidate.resumeAnalysisStatus === "processing" ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--adm-accent)]" />
          </span>
          <p className="mt-3 text-sm font-medium text-[var(--adm-ink-mute)]">Analyzing resume…</p>
          <p className="mt-1 max-w-sm text-xs text-[var(--adm-ink-subtle)]">
            Extracting experience, education, skills and more. This usually takes under a minute, the page will update automatically.
          </p>
        </div>
      ) : (
        <EmptyState
          icon={IconSparkles}
          tone="blue"
          title={candidate.resumeAnalysisStatus === "failed" ? "Last analysis didn't finish" : "Resume not analyzed yet"}
          description={
            candidate.resumeAnalysisStatus === "failed" && candidate.resumeAnalysisError
              ? candidate.resumeAnalysisError
              : "Extract structured experience, education, skills and more from the attached resume. This can take up to a minute."
          }
          action={
            <WorkspaceButton variant="primary" onClick={() => void handleAnalyze()} disabled={analyzing}>
              {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconSparkles className="h-4 w-4" />}
              {analyzing ? "Analyzing…" : candidate.resumeAnalysisStatus === "failed" ? "Retry analysis" : "Analyze resume"}
            </WorkspaceButton>
          }
        />
      )}
    </AdminCard>
  ) : (
    <AdminCard>
      <EmptyState
        icon={IconSparkles}
        title="No resume details yet"
        description="No resume is attached. You can add skills, experience and other details manually."
        action={
          <WorkspaceButton variant="primary" onClick={() => setAnalysisEditOpen(true)}>
            <Plus className="h-4 w-4" /> Add details manually
          </WorkspaceButton>
        }
      />
    </AdminCard>
  );

  return (
    <div className="pb-10">
      <button
        onClick={() => router.back()}
        className="mb-2 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* ── Pinned record bar ──
          Identity, status, stage and the primary action stay on screen for the
          whole record. Previously this was ordinary content at the top, so from
          the second screen down there was nothing saying whose record this was
          and no way to act on it without scrolling back up and losing your
          place. Negative margins let the condensed state span the full content
          width so its rule reads as chrome rather than as a floating card. */}
      {/* ── Pinned record header ──
          Identity, contact, rating, every action AND the tab bar, held at the
          top while everything below scrolls under them. `-top-6` with a
          matching `pt-6`, not `top-0`: the scroll container carries 24px of
          padding and a sticky element offsets from the padding edge, so at
          `top-0` the block parks 24px down and content scrolls visibly through
          the strip above it.

          Solid `--adm-canvas`, never `bg-[var(--adm-canvas)]/95` — Tailwind's
          opacity modifier cannot dilute a CSS variable, the utility compiles to
          nothing, and the bar renders fully transparent with the card beneath
          reading straight through the pinned text. (Found exactly that way.) */}
      <div
        ref={headerRef}
        className="sticky -top-6 z-20 -mx-4 border-b border-[var(--adm-line)] bg-[var(--adm-canvas)] px-4 pb-3 pt-6 sm:-mx-6 sm:px-6"
      >
        <RecordBar
          candidate={candidate}
          statusSaving={statusSaving}
          benchSaving={benchSaving}
          ownerSaving={ownerSaving}
          onStage={handleStageClick}
          onRate={handleRating}
          onBench={handleBenchChange}
          onClaim={handleClaimOwnership}
          onEdit={() => openCandidateEditor({ candidate })}
        />

        {/* Tabs ride with the header rather than sitting in the main column:
            they navigate the whole record, and pinned alongside it they never
            require scrolling back to the top of ~4,000px to switch view. */}
        <div className="-mb-3 mt-3 flex overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                aria-pressed={active}
                className={cn(
                  "inline-flex flex-none items-center gap-2 border-b-2 px-4 py-2.5 text-[13.5px] font-semibold transition-colors",
                  active
                    ? "border-[var(--adm-accent)] text-[var(--adm-accent)]"
                    : "border-transparent text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]",
                )}
              >
                <Icon className="h-4 w-4 flex-none" />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span
                    className={cn(
                      "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                      active
                        ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                        : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Decision strip ──
          The fit verdict takes the prime slot only while the decision is still
          open. On a hired or rejected candidate it is history, and it moves
          into Overview below the application's own details. */}
      {!isTerminal && hasAnalysis && (
        <div className="mb-4">
          <JobFitCard applicationId={id} />
        </div>
      )}

      <div
        className="mt-4 grid items-start gap-4 lg:grid-cols-3"
        style={{ "--rec-head": `${headerH}px` } as React.CSSProperties}
      >
        <div className="space-y-4 lg:col-span-2">
          {/* ── Overview: who is this, and should we proceed ── */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <ApplicantDetails candidate={candidate} onEdit={() => openCandidateEditor({ candidate })} />

              {/* Manual experience, superseded by the parsed history when analysis exists */}
              {!hasAnalysis && candidate.experience && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconFile} title="Experience" />
                  <div className="px-5 py-4">
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                      {candidate.experience}
                    </p>
                  </div>
                </AdminCard>
              )}

              {candidate.coverLetter && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconFile} title="Cover letter" />
                  <div className="px-5 py-4">
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                      {candidate.coverLetter}
                    </p>
                  </div>
                </AdminCard>
              )}

              {/* The fit verdict, for candidates whose decision is already made. */}
              {isTerminal && hasAnalysis && <JobFitCard applicationId={id} />}

              {!hasAnalysis && analysisCta}
            </div>
          )}

          {/* ── Resume: the parsed record, as reference ── */}
          {activeTab === "resume" && (
            <div className="space-y-4">
              {hasAnalysis ? (
                <>
                  <AdminCard className="overflow-hidden">
                    <AdminCardHeader
                      icon={IconSparkles}
                      title="Resume analysis"
                      tone="blue"
                      action={
                        <div className="flex flex-none items-center gap-2">
                          <button
                            onClick={() => setAnalysisEditOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]"
                          >
                            <IconEdit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => void handleAnalyze()}
                            disabled={analyzing}
                            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)] disabled:opacity-60"
                          >
                            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <IconRefresh className="h-3.5 w-3.5" />}
                            Re-analyze
                          </button>
                        </div>
                      }
                    />
                    {candidate.resumeAnalyzedAt && (
                      <p className="px-5 py-2.5 text-[12px] text-[var(--adm-ink-subtle)]">
                        Last analyzed {fmtDateTime(candidate.resumeAnalyzedAt)}
                      </p>
                    )}
                  </AdminCard>
                  <ResumeAnalysisPanel analysis={candidate.resumeAnalysis!} />
                </>
              ) : (
                analysisCta
              )}
            </div>
          )}

          {/* ── Pipeline: the stage rail, plus submissions and placements ── */}
          {activeTab === "pipeline" && (
            <div className="space-y-4">
              <StageRail
                candidate={candidate}
                saving={statusSaving}
                daysInStage={daysInStage}
                onStage={handleStageClick}
              />
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
                onStatusAdvanced={(status) => {
                  // The stage moved server-side as a consequence of the event;
                  // mirror it here so the record bar and rail agree without a reload.
                  setCandidate((p) => (p ? { ...p, status: status as CandidateDetail["status"] } : p));
                }}
              />
            </div>
          )}

          {activeTab === "notes" && (
            <NotesTab
              notes={notes}
              authorName={user?.name || user?.email || "You"}
              value={newNote}
              onChange={setNewNote}
              onSubmit={handleAddNote}
              saving={addingNote}
            />
          )}

          {activeTab === "activity" && <ActivityTab history={history} />}
        </div>

        <RecordSidebar
          candidate={candidate}
          isOwner={isOwner}
          ownerSaving={ownerSaving}
          hasAnalysis={hasAnalysis}
          onClaim={handleClaimOwnership}
          onRelease={handleReleaseOwnership}
          onViewResume={handleViewResume}
        />
      </div>

      <ResumeAnalysisEditDrawer
        open={analysisEditOpen}
        onOpenChange={setAnalysisEditOpen}
        application={candidate}
        onSaved={(app) => setCandidate((p) => (p ? { ...p, ...(app as CandidateDetail) } : p))}
      />
    </div>
  );
}
