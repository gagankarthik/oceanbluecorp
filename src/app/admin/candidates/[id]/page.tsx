"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Plus, SearchX } from "lucide-react";
import type { IconComponent } from "@/components/admin/icons";
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
  IconPipeline, IconEdit, IconFile, IconHistory,
  IconMessageText, IconRefresh, IconSparkles,
} from "@/components/admin/icons";
import { useAdmin, usePageCrumb } from "@/components/admin/admin-provider";
import { statusMeta, type AppStatus } from "@/components/admin/theme";
// Still needed by handleBenchChange, which resolves the candidate's current
// pool before deciding whether a change is a no-op.
import { POOL_LABEL, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";
import { TERMINAL } from "@/lib/pipeline";
import { undoable } from "@/lib/undo";

/** Loader2 as an EmptyState icon, for the in-progress analysis state. */
const SpinnerIcon: IconComponent = ({ className, strokeWidth }) => (
  <Loader2 className={cn(className, "animate-spin")} strokeWidth={Number(strokeWidth) || 1.5} />
);

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
  const [missing, setMissing]     = useState(false);
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
  /** One unattended retry per visit, not per render, and not a loop. */
  const autoRetried = useRef(false);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/applications/${id}`);
      if (res.status === 404) { setMissing(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // Render the candidate immediately; the linked job's details are enriched
      // in a separate non-blocking effect below so the job fetch never blocks paint.
      setCandidate(data.application as CandidateDetail);
    } catch (err) {
      console.error("Failed to load candidate:", err);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchCandidate(); }, [fetchCandidate]);

  // Enrich with the linked job's details, fetched once per job, off the render path.
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

  /**
   * Move the candidate to a stage, and say so.
   *
   * This was silent on success: the rail moved and nothing else happened, so a
   * misclick on a six-node stepper was invisible until somebody noticed the
   * candidate was in the wrong place. It is also exactly reversible, so it
   * gets an undo rather than a confirm, a confirm on the most-used control on
   * the screen would be intolerable, which is precisely why the action was
   * left unguarded in the first place.
   */
  const handleStageClick = async (stage: AppStatus) => {
    if (!candidate || stage === candidate.status || statusSaving) return;
    const previous = candidate.status;
    setStatusSaving(true);
    try {
      const updated = await patch({ status: stage, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
      undoable({
        message: `Moved to ${statusMeta[stage]?.label ?? stage}`,
        undo: async () => {
          const back = await patch({ status: previous, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" });
          setCandidate((p) => (p ? { ...p, ...back } : p));
        },
      });
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
      undoable({
        message: pool ? `Added to ${POOL_LABEL[pool]}` : "Removed from bench",
        undo: async () => {
          await patch(current
            ? { addToTalentBench: true, benchType: current, benchAddedBy: user?.email || user?.id }
            : { addToTalentBench: false });
          setCandidate((p) => (p ? { ...p, addToTalentBench: !!current, benchType: current || p.benchType } : p));
        },
      });
    } catch {
      setCandidate(prev);
      toast.error("Failed to update talent bench");
    } finally { setBenchSaving(false); }
  };

  /* Claim and release both succeeded silently. Ownership is a claim ON A
     SHARED RECORD, it tells the rest of the team whose desk this is, so
     "did that register?" is a real question, and the only answer was a chip
     quietly changing in the corner of the toolbar. Both are exactly
     reversible, so each reports and offers the inverse. */
  const applyOwner = async (ownership: string, ownershipName: string) => {
    const updated = await patch({ ownership, ownershipName });
    setCandidate((p) => (p ? { ...p, ...updated } : p));
  };

  const handleClaimOwnership = async () => {
    if (!candidate || !user || ownerSaving) return;
    setOwnerSaving(true);
    try {
      await applyOwner(user.id, user.name || user.email || "");
      undoable({
        message: "You now own this candidate",
        undo: () => applyOwner("", ""),
      });
    } catch { toast.error("Failed to claim ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleReleaseOwnership = async () => {
    if (!candidate || ownerSaving) return;
    const prevId = candidate.ownership || "";
    const prevName = candidate.ownershipName || "";
    setOwnerSaving(true);
    try {
      await applyOwner("", "");
      undoable({
        message: "Released, this candidate is unassigned",
        undo: () => applyOwner(prevId, prevName),
      });
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
   * in and nothing on failure, because nobody asked for it, only a success is
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
    } catch { /* non-fatal, the stale message stays on screen */ }
  };

  // A failed analysis retries itself once per visit. Most failures are not about
  // this candidate at all (a rejected extraction token, the service down, a
  // timeout), so the record should heal on the next view rather than sit on
  // "didn't finish" until somebody notices the button. Dead ends, no resume, the
  // file gone from storage, a document nothing can be read from, are flagged
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
     sticky, and its top offset has to clear this block, which changes height
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

  if (error || missing || !candidate) {
    const failed = !!error && !missing;
    return (
      <div className="pb-10">
        <BackLink onClick={() => router.back()} />
        <AdminCard>
          <EmptyState
            variant={failed ? "error" : "fresh"}
            icon={failed ? undefined : SearchX}
            title={failed ? "Couldn't load this candidate" : "This candidate doesn't exist"}
            description={failed ? (error ?? undefined) : "The record may have been removed, or the link is out of date."}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {failed && (
                  <WorkspaceButton variant="primary" onClick={() => void fetchCandidate()}>Try again</WorkspaceButton>
                )}
                <WorkspaceButton onClick={() => router.push("/admin/applications")}>
                  Back to candidates
                </WorkspaceButton>
              </div>
            }
          />
        </AdminCard>
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
    // The parsed resume, work history, skills, education, projects, is ~1,660px
    // of reference material. It was the default view; it is now a tab, so the
    // Overview answers "who is this and should we proceed" in one screen.
    { key: "resume"   as TabKey, label: "Resume",   icon: IconSparkles,    count: undefined as number | undefined },
    { key: "pipeline" as TabKey, label: "Pipeline", icon: IconPipeline,    count: undefined as number | undefined },
    { key: "notes"    as TabKey, label: "Notes",    icon: IconMessageText, count: notes.length },
    { key: "activity" as TabKey, label: "Activity", icon: IconHistory,     count: history.length },
  ];

  /* The analyse call-to-action, placed by state: on Overview when there is
     nothing to read yet, and in place of the Resume tab's content. Buttons are
     secondary; the record's one filled action is "Edit profile". */
  const analysisCta = candidate.resumeId ? (
    <AdminCard>
      {/* `analyzing` included so an automatic retry shows as work in progress. */}
      {analyzing || candidate.resumeAnalysisStatus === "pending" || candidate.resumeAnalysisStatus === "processing" ? (
        <EmptyState
          icon={SpinnerIcon}
          title="Analyzing resume…"
          description="Extracting experience, education, skills and more. This usually takes under a minute; the page updates automatically."
        />
      ) : (
        <EmptyState
          icon={IconSparkles}
          title={candidate.resumeAnalysisStatus === "failed" ? "Last analysis didn't finish" : "Resume not analyzed yet"}
          description={
            candidate.resumeAnalysisStatus === "failed" && candidate.resumeAnalysisError
              ? candidate.resumeAnalysisError
              : "Extract structured experience, education, skills and more from the attached resume. This can take up to a minute."
          }
          action={
            <WorkspaceButton onClick={() => void handleAnalyze()} disabled={analyzing}>
              {analyzing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconSparkles aria-hidden="true" />}
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
          <WorkspaceButton onClick={() => setAnalysisEditOpen(true)}>
            <Plus aria-hidden="true" /> Add details manually
          </WorkspaceButton>
        }
      />
    </AdminCard>
  );

  return (
    <div className="pb-10">
      {/* Pinned record header: back, identity, contact, actions and the tab bar
          stay put while the record scrolls beneath. It bleeds to the main
          padding (p-4 sm:p-5 lg:p-6): negative margins span the full width, the
          matching negative `top` + `pt` park it flush against the scroll edge,
          and `-mt` removes the doubled gap before it sticks. Solid canvas: an
          opacity modifier on a CSS variable renders transparent. */}
      <div
        ref={headerRef}
        className="sticky -top-4 z-20 -mx-4 -mt-4 border-b border-[var(--adm-line)] bg-[var(--adm-canvas)] px-4 pt-4 sm:-top-5 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5 lg:-top-6 lg:-mx-6 lg:-mt-6 lg:px-6 lg:pt-6"
      >
        <BackLink onClick={() => router.back()} />

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

        {/* Tabs ride with the header: they navigate the whole record. */}
        <div role="tablist" aria-label="Candidate record" className="-mb-px mt-3 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex h-10 flex-none items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium transition-colors duration-150",
                  active
                    ? "border-[var(--adm-accent)] text-[var(--adm-ink)]"
                    : "border-transparent text-[var(--adm-ink-mute)] hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]",
                )}
              >
                <Icon
                  className={cn("h-4 w-4 flex-none", active ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")}
                  aria-hidden="true"
                />
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-px text-[12px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* The fit verdict leads only while the decision is open; on a hired or
          rejected candidate it is history and moves into Overview. */}
      {!isTerminal && hasAnalysis && (
        <div className="mt-4">
          <JobFitCard applicationId={id} />
        </div>
      )}

      <div
        className="mt-4 grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_288px] xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5"
        style={{ "--rec-head": `${headerH}px` } as React.CSSProperties}
      >
        <div className="min-w-0 space-y-4">
          {activeTab === "overview" && (
            <div className="space-y-4">
              <ApplicantDetails candidate={candidate} onEdit={() => openCandidateEditor({ candidate })} />

              {/* Manual experience, superseded by the parsed history when analysis exists */}
              {!hasAnalysis && candidate.experience && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconFile} title="Experience" />
                  <p className="whitespace-pre-line p-4 text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
                    {candidate.experience}
                  </p>
                </AdminCard>
              )}

              {candidate.coverLetter && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconFile} title="Cover letter" />
                  <p className="whitespace-pre-line p-4 text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
                    {candidate.coverLetter}
                  </p>
                </AdminCard>
              )}

              {isTerminal && hasAnalysis && <JobFitCard applicationId={id} />}

              {!hasAnalysis && analysisCta}
            </div>
          )}

          {activeTab === "resume" && (
            <div className="space-y-4">
              {hasAnalysis ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <div className="min-w-0">
                      <h2 className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--adm-ink)]">Resume analysis</h2>
                      {candidate.resumeAnalyzedAt && (
                        <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
                          Last analyzed <span className="tabular-nums">{fmtDateTime(candidate.resumeAnalyzedAt)}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <WorkspaceButton onClick={() => setAnalysisEditOpen(true)}>
                        <IconEdit aria-hidden="true" /> Edit
                      </WorkspaceButton>
                      <WorkspaceButton onClick={() => void handleAnalyze()} disabled={analyzing}>
                        {analyzing ? <Loader2 className="animate-spin" aria-hidden="true" /> : <IconRefresh aria-hidden="true" />}
                        Re-analyze
                      </WorkspaceButton>
                    </div>
                  </div>
                  <ResumeAnalysisPanel analysis={candidate.resumeAnalysis!} />
                </>
              ) : (
                analysisCta
              )}
            </div>
          )}

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

/** Same geometry as RecordHeader's back link. */
function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <div className="mb-2">
      <button
        type="button"
        onClick={onClick}
        className="-ml-1 inline-flex items-center gap-1 rounded-[6px] px-1 py-0.5 text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-ink)]"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back
      </button>
    </div>
  );
}
