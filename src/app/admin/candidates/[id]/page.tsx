"use client";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft, Check, ChevronDown, ExternalLink, Loader2, Plus,
} from "lucide-react";
import type { Application, BenchType, NoteEntry } from "@/lib/aws/dynamodb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth/AuthContext";
import { AdminDetailSkeleton } from "@/components/admin/skeletons";
import { ResumeAnalysisPanel } from "@/components/admin/resume-analysis-panel";
import { ResumeAnalysisEditDrawer } from "@/components/admin/resume-analysis-edit-drawer";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { JobFitCard } from "@/components/admin/job-fit-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { EmptyState } from "@/components/admin/empty-state";
import {
  IconPipeline, IconAlert, IconBookmarkCheck, IconBookmarkPlus, IconJob,
  IconBuilding, IconClock, IconDownload, IconEdit, IconFile, IconHistory,
  IconMail, IconLocation, IconMessageText, IconPhone, IconRefresh,
  IconSparkles, IconUserCheck, IconUserX, IconError,
} from "@/components/admin/icons";
import { useAdmin, usePageCrumb } from "@/components/admin/admin-provider";
import { tones, statusMeta, PIPELINE_STAGES, hireTypeLabel, type AppStatus } from "@/components/admin/theme";
import { POOL_LABEL, POOL_META, POOL_ORDER, poolOf } from "@/lib/bench";
import { cn } from "@/lib/utils";
import { fmtDate, fmtDateTime } from "@/lib/format";

interface CandidateDetail extends Application {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

type TabKey = "overview" | "activity" | "notes";

/** Label/value pair for the applicant details definition grid. */
function DetailItem({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[13px] font-medium text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="mt-1 break-words text-[14px] text-[var(--adm-ink)]">
        {empty ? <span className="text-[var(--adm-ink-subtle)]">—</span> : value}
      </dd>
    </div>
  );
}

/** Right-aligned metadata row used by the sidebar panels. */
function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <dt className="flex-none text-[13px] font-medium text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[13.5px] text-[var(--adm-ink)]">
        {empty ? <span className="text-[var(--adm-ink-subtle)]">—</span> : value}
      </dd>
    </div>
  );
}

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

  const handleAnalyze = async () => {
    if (!candidate?.resumeId || analyzing) return;
    setAnalyzing(true);
    const toastId = toast.loading("Analyzing resume… this can take up to a minute.");
    try {
      const res = await fetch(`/api/applications/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setCandidate((p) => (p ? { ...p, ...(data.application as CandidateDetail) } : p));
      setActiveTab("overview");
      toast.success("Resume analyzed", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Analysis failed", { id: toastId });
    } finally {
      setAnalyzing(false);
    }
  };

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

  const isRejected = candidate.status === "rejected";
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === candidate.status);
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
  const rejectedEntry = isRejected
    ? [...history].reverse().find((h) => h.status === "rejected")
    : undefined;
  const isOwner = candidate.ownership === user?.id;
  const hasAnalysis = !!candidate.resumeAnalysis;
  const location = [candidate.city, candidate.state].filter(Boolean).join(", ");

  const TABS = [
    { key: "overview" as TabKey, label: "Overview", icon: IconFile,          count: undefined as number | undefined },
    { key: "notes"    as TabKey, label: "Notes",    icon: IconMessageText, count: notes.length },
    { key: "activity" as TabKey, label: "Activity", icon: IconHistory,           count: history.length },
  ];

  return (
    <div className="space-y-5 pb-10">

      {/* ── Record header ──
          Plain content on the canvas. This was a full-bleed white band with a
          bottom rule, the same treatment that was rejected across the app.
          A record screen still states its title — that is the candidate's name,
          which nothing else on screen carries — but it does not need a frame
          around it to do so. */}
      <div>
        <button
          onClick={() => router.back()}
          className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar name={candidate.name} email={candidate.email} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[22px] font-bold leading-tight tracking-[-0.015em] text-[var(--adm-ink)]">
                  {candidate.name || "Unnamed candidate"}
                </h1>
                {candidate.applicationId && (
                  <span className="rounded-[4px] bg-[var(--adm-accent-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--adm-accent)]">
                    {candidate.applicationId}
                  </span>
                )}
                <StatusBadge status={candidate.status} withIcon size="md" />
                {candidate.addToTalentBench && (
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.03em]",
                    poolOf(candidate) === "internal"
                      ? "border-[var(--adm-accent-soft)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                      : "border-emerald-200 bg-[var(--adm-success-soft)] text-[var(--adm-success)]",
                  )}>
                    <IconBookmarkCheck className="h-3 w-3" /> {POOL_LABEL[poolOf(candidate)]}
                  </span>
                )}
              </div>

              {candidate.jobTitle && (
                <p className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[13.5px] text-[var(--adm-ink-subtle)]">
                  <IconJob className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                  {candidate.jobTitle}
                  {candidate.jobDepartment && <span className="text-[var(--adm-ink-subtle)]">· {candidate.jobDepartment}</span>}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
                <a href={`mailto:${candidate.email}`}
                  className="inline-flex min-w-0 items-center gap-1.5 break-all text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]">
                  <IconMail className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{candidate.email}
                </a>
                {candidate.phone && (
                  <a href={`tel:${candidate.phone}`}
                    className="inline-flex items-center gap-1.5 text-[var(--adm-ink-mute)] transition-colors hover:text-[var(--adm-accent)]">
                    <IconPhone className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{candidate.phone}
                  </a>
                )}
                {location && (
                  <span className="inline-flex items-center gap-1.5 text-[var(--adm-ink-subtle)]">
                    <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 lg:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {candidate.jobId && (
                <WorkspaceButton onClick={() => router.push(`/admin/jobs/${candidate.jobId}`)}>
                  <IconJob className="h-4 w-4" /><span className="hidden sm:inline">View job</span>
                </WorkspaceButton>
              )}

              {/* Claiming lives up here — it was buried in the last sidebar
                  card, below the fold on every screen size. */}
              {!candidate.ownership && (
                <WorkspaceButton onClick={handleClaimOwnership} disabled={ownerSaving}>
                  {ownerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconUserCheck className="h-4 w-4" />}
                  Claim
                </WorkspaceButton>
              )}

              {/* Adding to the bench is a choice of pool, not a blind toggle. */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <WorkspaceButton disabled={benchSaving}>
                    {benchSaving
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : candidate.addToTalentBench
                        ? <IconBookmarkCheck className="h-4 w-4 text-[var(--adm-success)]" />
                        : <IconBookmarkPlus className="h-4 w-4" />}
                    {candidate.addToTalentBench ? `In ${POOL_LABEL[poolOf(candidate)]}` : "Add to bench"}
                    <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                  </WorkspaceButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={4}
                  className="min-w-[240px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-lg"
                >
                  {POOL_ORDER.map((pool) => {
                    const selected = candidate.addToTalentBench && poolOf(candidate) === pool;
                    return (
                      <DropdownMenuItem
                        key={pool}
                        onClick={() => handleBenchChange(pool)}
                        className={cn(
                          "flex cursor-pointer items-start gap-2 rounded-[4px] px-2 py-2",
                          selected && "text-[var(--adm-accent)]",
                        )}
                      >
                        <Check className={cn("mt-0.5 h-3.5 w-3.5 flex-none", selected ? "opacity-100" : "opacity-0")} />
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-[13px] font-semibold", !selected && "text-[var(--adm-ink)]")}>
                            {POOL_LABEL[pool]}
                          </span>
                          <span className="mt-0.5 block text-[11.5px] font-normal text-[var(--adm-ink-subtle)]">
                            {POOL_META[pool].hint}
                          </span>
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  {candidate.addToTalentBench && (
                    <>
                      <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
                      <DropdownMenuItem
                        onClick={() => handleBenchChange(null)}
                        className="flex cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-[13px] font-medium text-[var(--adm-danger)]"
                      >
                        <span className="w-3.5 flex-none" />
                        Remove from bench
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <WorkspaceButton variant="primary" onClick={() => openCandidateEditor({ candidate })}>
                <IconEdit className="h-4 w-4" />Edit profile
              </WorkspaceButton>
            </div>

            {/* Rating is a control, not a read-only figure, so it lives with the
                toolbar rather than being duplicated as a KPI tile. */}
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-[var(--adm-ink-subtle)]">Rating</span>
              <StarRating rating={candidate.rating || 0} onRate={handleRating} size="md" />
              <span className="text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">
                {candidate.rating ? `${candidate.rating} / 5` : "Not rated"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stage control ──
          A stepper, not a strip: numbered nodes on a progress track, completed
          stages checked off in the single cobalt accent, the current node
          haloed with time-in-stage under it. Rejecting is terminal and off the
          ordered flow, so it lives as an action in the card header instead of
          masquerading as a seventh stage. */}
      <AdminCard className="overflow-hidden">
        <AdminCardHeader
          icon={IconPipeline}
          title="Hiring pipeline"
          action={
            <div className="flex flex-none items-center gap-3">
              {statusSaving ? (
                <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--adm-accent)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
                </span>
              ) : (
                <span className="hidden text-[12.5px] text-[var(--adm-ink-subtle)] md:inline">
                  Click a stage to move this candidate
                </span>
              )}
              <button
                onClick={() => handleStageClick("rejected")}
                disabled={statusSaving || isRejected}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                  isRejected
                    ? "border-rose-200 bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]"
                    : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)] hover:border-rose-200 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)] disabled:opacity-60",
                )}
              >
                <IconError className="h-3.5 w-3.5" />
                {isRejected ? "Rejected" : "Reject"}
              </button>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <div className="min-w-[600px] px-6 pb-5 pt-6">
            <div className="relative">
              {/* Track runs between the first and last node centers; the fill
                  advances to the current stage. */}
              <div
                className="absolute top-[15px] h-[2px] rounded-full bg-[var(--adm-line)]"
                style={{
                  left: `${50 / PIPELINE_STAGES.length}%`,
                  right: `${50 / PIPELINE_STAGES.length}%`,
                }}
              >
                <div
                  className="h-full rounded-full bg-[var(--adm-accent)] transition-[width] duration-300"
                  style={{
                    width: isRejected || currentIdx <= 0
                      ? "0%"
                      : `${(currentIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                  }}
                />
              </div>

              <div className="relative flex">
                {PIPELINE_STAGES.map((stage, i) => {
                  const isActive = !isRejected && stage.key === candidate.status;
                  const isPast   = !isRejected && currentIdx > i;
                  return (
                    <button
                      key={stage.key}
                      onClick={() => handleStageClick(stage.key)}
                      disabled={statusSaving || isActive}
                      aria-pressed={isActive}
                      title={isActive ? stage.label : `Move to ${stage.label}`}
                      className="group flex flex-1 flex-col items-center gap-2 disabled:cursor-default"
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 place-items-center rounded-full border-2 text-[12.5px] font-bold tabular-nums transition-all duration-150",
                          isActive
                            ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                            : isPast
                              ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white group-hover:shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                              : cn(
                                "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)]",
                                !statusSaving && "group-hover:border-[var(--adm-accent)] group-hover:text-[var(--adm-accent)]",
                              ),
                          isRejected && "opacity-55 group-hover:opacity-100",
                        )}
                      >
                        {isPast ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                      </span>
                      <span className="flex flex-col items-center gap-0.5">
                        <span
                          className={cn(
                            "text-[12px] font-semibold leading-none transition-colors",
                            isActive
                              ? "text-[var(--adm-ink)]"
                              : isPast
                                ? "text-[var(--adm-ink-mute)]"
                                : "text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-accent)]",
                          )}
                        >
                          {stage.label}
                        </span>
                        {isActive && daysInStage !== null && (
                          <span className="text-[10.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                            {daysInStage === 0 ? "moved today" : `${daysInStage}d in stage`}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {isRejected && (
              <p className="mt-5 rounded-[6px] border border-rose-200 bg-[var(--adm-danger-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--adm-danger)]">
                This candidate was rejected{rejectedEntry ? ` on ${fmtDate(rejectedEntry.changedAt)}` : ""}
                {rejectedEntry?.changedByName ? ` by ${rejectedEntry.changedByName}` : ""}. Click any stage to reopen them.
              </p>
            )}
          </div>
        </div>
      </AdminCard>

      {/* ── Body: main + sidebar ── */}
      <div className="grid items-start gap-4 lg:grid-cols-3">

        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          {/* Tab bar */}
          <AdminCard className="overflow-hidden">
            <div className="flex px-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    aria-pressed={active}
                    className={cn(
                      "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[13.5px] font-semibold transition-colors",
                      active
                        ? "border-[var(--adm-accent)] text-[var(--adm-accent)]"
                        : "border-transparent text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]",
                    )}
                  >
                    <Icon className="h-4 w-4 flex-none" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className={cn(
                        "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                        active ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]" : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
                      )}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </AdminCard>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Applicant details */}
              <AdminCard className="overflow-hidden">
                <AdminCardHeader icon={IconFile} title="Applicant details" />
                <dl className="grid grid-cols-2 gap-x-6 gap-y-4 px-5 py-4 sm:grid-cols-3">
                  <DetailItem label="Work authorization" value={candidate.workAuthorization} />
                  <DetailItem label="Type of hire" value={hireTypeLabel(candidate.hireType)} />
                  <DetailItem label="Source" value={candidate.source} />
                  <DetailItem
                    label="Visa expiry"
                    value={candidate.visaExpiry ? fmtDate(candidate.visaExpiry) : undefined}
                  />
                  <DetailItem
                    label="Sponsorship"
                    value={candidate.visaSponsorshipRequired ? "Required" : undefined}
                  />
                  <DetailItem label="Street address" value={candidate.address} />
                  <DetailItem label="ZIP code" value={candidate.zipCode} />
                  <DetailItem label="Applied" value={fmtDate(candidate.appliedAt)} />
                  <DetailItem label="Added by" value={candidate.createdByName} />
                </dl>
              </AdminCard>

              {/* Experience (manual), superseded by the parsed work history when analysis exists */}
              {!hasAnalysis && candidate.experience && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconJob} title="Experience" />
                  <div className="px-5 py-4">
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">{candidate.experience}</p>
                  </div>
                </AdminCard>
              )}

              {/* Cover letter */}
              {candidate.coverLetter && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={IconFile} title="Cover letter" />
                  <div className="px-5 py-4">
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">{candidate.coverLetter}</p>
                  </div>
                </AdminCard>
              )}

              {/* Resume analysis (parsed details live in Overview) */}
              {candidate.resumeAnalysis ? (
                <>
                  <AdminCard className="overflow-hidden">
                    <AdminCardHeader
                      icon={IconSparkles}
                      title="Resume analysis"
                      tone="blue"
                      action={
                        <div className="flex flex-none items-center gap-2">
                          <button onClick={() => setAnalysisEditOpen(true)}
                            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]">
                            <IconEdit className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button onClick={handleAnalyze} disabled={analyzing}
                            className="inline-flex items-center gap-1.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-[12px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)] disabled:opacity-60">
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
                  <JobFitCard applicationId={id} />
                  <ResumeAnalysisPanel analysis={candidate.resumeAnalysis} />
                </>
              ) : candidate.resumeId ? (
                <AdminCard>
                  {(candidate.resumeAnalysisStatus === "pending" || candidate.resumeAnalysisStatus === "processing") ? (
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
                        <WorkspaceButton variant="primary" onClick={handleAnalyze} disabled={analyzing}>
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
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              <AdminCard className="overflow-hidden">
                <div className="flex items-center gap-2 border-b border-[var(--adm-line)] px-5 py-3">
                  <Avatar name={user?.name || user?.email || "You"} size="xs" />
                  <span className="text-[13.5px] font-semibold text-[var(--adm-ink-mute)]">{user?.name || user?.email || "You"}</span>
                  <span className="text-[12px] text-[var(--adm-ink-subtle)]">add a note</span>
                </div>
                <div className="px-5 py-4">
                  <textarea
                    rows={3}
                    value={newNote}
                    autoComplete="off"
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                    placeholder="Interview feedback, next steps, anything the team should know…"
                    className="w-full resize-none border-0 bg-transparent p-0 text-[13.5px] leading-relaxed text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
                  />
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--adm-line-soft)] pt-3">
                    <p className="text-[11.5px] text-[var(--adm-ink-subtle)]">
                      {newNote.length > 0 ? `${newNote.length} characters` : "⌘↵ to save · visible to your team"}
                    </p>
                    <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
                      className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--adm-accent)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)] disabled:opacity-50">
                      {addingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                      Post note
                    </button>
                  </div>
                </div>
              </AdminCard>

              {notes.length > 0 ? (
                <AdminCard className="overflow-hidden">
                  <div className="divide-y divide-[var(--adm-line-soft)]">
                    {[...notes].reverse().map((note) => (
                      <div key={note.id} className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={note.addedByName} size="xs" />
                          <span className="text-[12.5px] font-semibold text-[var(--adm-ink-mute)]">{note.addedByName}</span>
                          <span className="ml-auto text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDateTime(note.addedAt)}</span>
                        </div>
                        <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">{note.text}</p>
                      </div>
                    ))}
                  </div>
                </AdminCard>
              ) : (
                <AdminCard>
                  <EmptyState icon={IconMessageText} title="No notes yet" description="Add the first note above." />
                </AdminCard>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={IconHistory} title="Status history" count={history.length} />
              {history.length > 0 ? (
                <ol className="px-5 py-4">
                  {[...history].reverse().map((entry, i, arr) => {
                    const meta  = (statusMeta as Record<string, typeof statusMeta.pending>)[entry.status];
                    const t     = tones[meta?.tone || "slate"];
                    const Icon  = meta?.icon || IconClock;
                    const isLast = i === arr.length - 1;
                    return (
                      <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                        {!isLast && <div className="absolute bottom-0 left-[13px] top-7 w-px bg-[var(--adm-line-soft)]" />}
                        <span className={cn("grid h-7 w-7 flex-none place-items-center rounded-full", t.bg)}>
                          <Icon className={cn("h-3.5 w-3.5", t.text)} />
                        </span>
                        <div className="min-w-0 flex-1 pt-0.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[13.5px]">
                              <span className="font-semibold text-[var(--adm-ink)]">Moved to {meta?.label || entry.status}</span>
                              {entry.changedByName && (
                                <span className="font-normal text-[var(--adm-ink-subtle)]"> by <span className="font-medium text-[var(--adm-ink-mute)]">{entry.changedByName}</span></span>
                              )}
                            </p>
                            <span className="flex-none text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDateTime(entry.changedAt)}</span>
                          </div>
                          {entry.notes && (
                            <p className="mt-1.5 rounded-[4px] border border-[var(--adm-line-soft)] bg-[var(--adm-zebra)] px-3 py-2 text-[12.5px] italic text-[var(--adm-ink-mute)]">
                              &ldquo;{entry.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <EmptyState icon={IconHistory} title="No activity recorded yet" description="Stage changes will appear here." />
              )}
            </AdminCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-20">

          {/* Owner — first card: whose desk this candidate is on is the first
              thing a teammate opening the record wants to know. */}
          <AdminCard className="overflow-hidden">
            <AdminCardHeader icon={IconUserCheck} title="Assigned recruiter" />
            <div className="p-5">
              {candidate.ownership && candidate.ownershipName ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={candidate.ownershipName} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-semibold text-[var(--adm-ink)]">{candidate.ownershipName}</p>
                      {candidate.ownershipClaimedAt && (
                        <p className="mt-0.5 text-[11.5px] text-[var(--adm-ink-subtle)]">Since {fmtDate(candidate.ownershipClaimedAt)}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={handleReleaseOwnership} disabled={ownerSaving}
                      className="inline-flex flex-none items-center gap-1 rounded-[4px] border border-transparent px-2 py-1 text-[11px] font-semibold text-[var(--adm-danger)] transition-colors hover:border-rose-200 hover:bg-[var(--adm-danger-soft)] disabled:opacity-60">
                      {ownerSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <IconUserX className="h-3 w-3" />}
                      Release
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleClaimOwnership} disabled={ownerSaving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[6px] border border-dashed border-[var(--adm-line)] px-3 py-2.5 text-[13px] font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)] hover:text-[var(--adm-accent)] disabled:opacity-60">
                  {ownerSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <IconUserCheck className="h-4 w-4" />}
                  Claim this candidate
                </button>
              )}
            </div>
          </AdminCard>

          {/* Resume file */}
          <AdminCard className="overflow-hidden">
            <AdminCardHeader icon={IconFile} title="Resume" />
            <div className="p-4">
              {candidate.resumeId ? (
                <button onClick={handleViewResume}
                  className="group flex w-full items-center gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-zebra)] p-3 text-left transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]">
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                    <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
                      {candidate.resumeFileName || "resume.pdf"}
                    </span>
                    <span className="mt-0.5 block text-[12px] text-[var(--adm-ink-subtle)]">View or download</span>
                  </span>
                  <IconDownload className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-accent)]" />
                </button>
              ) : (
                <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">No resume on file</p>
              )}
            </div>
          </AdminCard>

          {/* Application metadata */}
          <AdminCard className="overflow-hidden">
            <AdminCardHeader icon={IconClock} title="Application" />
            <dl className="divide-y divide-[var(--adm-line-soft)]">
              <MetaRow
                label="App ID"
                value={
                  (candidate.applicationId || candidate.id?.slice(0, 8))
                    ? <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[11.5px] text-[var(--adm-ink-mute)]">
                        {candidate.applicationId || candidate.id?.slice(0, 8)}
                      </span>
                    : undefined
                }
              />
              <MetaRow label="Status" value={<StatusBadge status={candidate.status} size="sm" />} />
              {candidate.addToTalentBench && (
                <MetaRow
                  label="Pool"
                  value={`${POOL_LABEL[poolOf(candidate)]} (${POOL_META[poolOf(candidate)].badge})`}
                />
              )}
              <MetaRow label="Applied" value={fmtDate(candidate.appliedAt)} />
              {candidate.updatedAt && <MetaRow label="Updated" value={fmtDate(candidate.updatedAt)} />}
              {hasAnalysis && candidate.resumeAnalyzedAt && (
                <MetaRow label="Analyzed" value={fmtDate(candidate.resumeAnalyzedAt)} />
              )}
            </dl>
          </AdminCard>

          {/* Position */}
          {candidate.jobTitle && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={IconJob} title="Position" />
              <div className="p-5">
                <Link href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"} className="group block">
                  <p className="text-[13.5px] font-semibold text-[var(--adm-ink)] transition-colors group-hover:text-[var(--adm-accent)]">
                    {candidate.jobTitle}
                  </p>
                  <div className="mt-2 space-y-1">
                    {candidate.jobDepartment && (
                      <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                        <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{candidate.jobDepartment}
                      </p>
                    )}
                    {candidate.jobLocation && (
                      <p className="flex items-center gap-1.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                        <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{candidate.jobLocation}
                      </p>
                    )}
                    {candidate.jobType && (
                      <p className="flex items-center gap-1.5 text-[12.5px] capitalize text-[var(--adm-ink-subtle)]">
                        <IconClock className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{candidate.jobType.replace(/-/g, " ")}
                      </p>
                    )}
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--adm-accent)]">
                    View job posting <ExternalLink className="h-3 w-3" />
                  </span>
                </Link>
              </div>
            </AdminCard>
          )}

          {/* Created by */}
          {candidate.createdByName && (
            <div className="flex items-center gap-2 px-1">
              <Avatar name={candidate.createdByName} size="xs" />
              <p className="text-[12px] text-[var(--adm-ink-subtle)]">
                Added by <span className="font-semibold text-[var(--adm-ink-mute)]">{candidate.createdByName}</span>
                {candidate.createdAt && <> · {fmtDate(candidate.createdAt)}</>}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Resume analysis editor */}
      <ResumeAnalysisEditDrawer
        open={analysisEditOpen}
        onOpenChange={setAnalysisEditOpen}
        application={candidate}
        onSaved={(app) => setCandidate((p) => (p ? { ...p, ...(app as CandidateDetail) } : p))}
      />
    </div>
  );
}
