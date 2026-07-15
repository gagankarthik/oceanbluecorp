"use client";
import { toast } from "sonner";
import { AdminDetailSkeleton } from "@/components/admin/skeletons";

import { useState, useEffect, use, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, FileText,
  MessageSquareText, XCircle, Edit3, Loader2, History, Plus,
  Building2, BookmarkPlus, BookmarkCheck, UserCheck,
  UserX, Download, Clock, ExternalLink, Check,
  AlertCircle, Sparkles, RefreshCw,
} from "lucide-react";
import type { Application, NoteEntry } from "@/lib/aws/dynamodb";
import { ResumeAnalysisPanel } from "@/components/admin/resume-analysis-panel";
import { ResumeAnalysisEditDrawer } from "@/components/admin/resume-analysis-edit-drawer";
import { useAuth } from "@/lib/auth/AuthContext";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { useAdmin, usePageCrumb } from "@/components/admin/admin-provider";
import { tones, statusMeta, PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { fmtDate, fmtDateTime } from "@/lib/format";

interface CandidateDetail extends Application {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

type TabKey = "overview" | "activity" | "notes";

// Label/value pair for the applicant details definition grid.
function DetailItem({ label, value, mono }: { label: string; value?: React.ReactNode; mono?: boolean }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</dt>
      <dd className={cn("mt-1 text-sm text-slate-800 break-words", mono && "font-mono text-xs text-slate-600")}>
        {empty ? <span className="text-slate-300">—</span> : value}
      </dd>
    </div>
  );
}

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
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
      } catch { /* non-fatal — job details are supplementary */ }
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
            toast.success("Resume analyzed — results are ready");
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

  const handleBenchToggle = async () => {
    if (!candidate || benchSaving) return;
    setBenchSaving(true);
    const next = !candidate.addToTalentBench;
    setCandidate((p) => (p ? { ...p, addToTalentBench: next } : p));
    try { await patch({ addToTalentBench: next, ...(next && { benchAddedBy: user?.email || user?.id }) }); }
    catch {
      setCandidate((p) => (p ? { ...p, addToTalentBench: !next } : p));
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
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold">{error || "Candidate not found"}</p>
            <p className="text-sm text-slate-500 mt-1">This record may have been removed.</p>
          </div>
          <button onClick={() => router.push("/admin/applications")}
            className="px-4 py-2 bg-[var(--hz-cobalt)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--hz-cobalt-600)] transition-colors">
            Back to candidates
          </button>
        </div>
      </div>
    );
  }

  const isRejected = candidate.status === "rejected";
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === candidate.status);
  const notes: NoteEntry[] = candidate.notesHistory || [];
  const isOwner = candidate.ownership === user?.id;
  const statusTone = statusMeta[candidate.status as AppStatus]?.tone || "slate";
  const hasAnalysis = !!candidate.resumeAnalysis;

  const fade = (delay = 0) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as const } };

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-5">

      {/* ── Top action bar (breadcrumb lives in the top nav) ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg font-medium transition-all border border-transparent hover:border-slate-200">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex items-center gap-2">
          {candidate.jobId && (
            <Link href={`/admin/jobs/${candidate.jobId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:text-[var(--hz-cobalt)] hover:border-[var(--hz-cobalt)] text-xs font-semibold rounded-lg transition-colors">
              <Briefcase className="w-3.5 h-3.5" /> View job
            </Link>
          )}
          <button onClick={handleBenchToggle} disabled={benchSaving}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-60",
              candidate.addToTalentBench
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700 hover:bg-emerald-50",
            )}>
            {benchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              candidate.addToTalentBench ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            {candidate.addToTalentBench ? "In bench" : "Add to bench"}
          </button>
          <button onClick={() => openCandidateEditor({ candidate })}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] text-white text-xs font-semibold rounded-lg transition shadow-sm shadow-[rgba(29,78,216,0.2)]">
            <Edit3 className="w-3.5 h-3.5" /> Edit profile
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <motion.div {...fade(0.02)}>
        <AdminCard className="overflow-hidden">
          {/* status accent rail */}
          <div className={cn("h-1 w-full", tones[statusTone].solid)} />
          <div className="p-6">
            <div className="flex items-start gap-5 flex-wrap">
              <div className="ring-2 ring-slate-100 rounded-full shadow-sm inline-block flex-shrink-0">
                <Avatar name={candidate.name} email={candidate.email} size="xl" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h1 className="text-[26px] leading-tight font-bold text-slate-900 tracking-tight">
                      {candidate.name || "Unnamed candidate"}
                    </h1>
                    {candidate.jobTitle && (
                      <p className="mt-1 text-sm text-slate-500 font-medium flex items-center gap-1.5 flex-wrap">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.jobTitle}
                        {candidate.jobDepartment && <span className="text-slate-400">· {candidate.jobDepartment}</span>}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <StatusBadge status={candidate.status} withIcon size="md" />
                      {candidate.addToTalentBench && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                          <BookmarkCheck className="w-3 h-3" /> Talent bench
                        </span>
                      )}
                    </div>
                  </div>

                  {/* rating */}
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Rating</span>
                    <StarRating rating={candidate.rating || 0} onRate={handleRating} size="md" />
                    <span className="text-[10px] text-slate-400 tabular-nums">{candidate.rating ? `${candidate.rating} / 5` : "Not rated"}</span>
                  </div>
                </div>

                {/* contact links */}
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
                  <a href={`mailto:${candidate.email}`}
                    className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[var(--hz-cobalt)] transition-colors font-medium min-w-0 break-all">
                    <Mail className="w-4 h-4 text-slate-400" /> {candidate.email}
                  </a>
                  {candidate.phone && (
                    <a href={`tel:${candidate.phone}`}
                      className="inline-flex items-center gap-1.5 text-slate-600 hover:text-[var(--hz-cobalt)] transition-colors font-medium">
                      <Phone className="w-4 h-4 text-slate-400" /> {candidate.phone}
                    </a>
                  )}
                  {(candidate.city || candidate.state) && (
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <MapPin className="w-4 h-4 text-slate-400" /> {[candidate.city, candidate.state].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* details — kept in the header so identity + details read as one block */}
            <div className="mt-5 pt-5 border-t border-slate-100">
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4">
                <DetailItem label="Work authorization" value={candidate.workAuthorization} />
                <DetailItem label="Source" value={candidate.source} />
                <DetailItem label="Street address" value={candidate.address} />
                <DetailItem label="ZIP code" value={candidate.zipCode} />
                <DetailItem label="Applied" value={fmtDate(candidate.appliedAt)} />
                <DetailItem label="Added by" value={candidate.createdByName} />
              </dl>
            </div>
          </div>
        </AdminCard>
      </motion.div>

      {/* ── Pipeline card ── */}
      <motion.div {...fade(0.04)}>
        <AdminCard className="px-6 py-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Hiring pipeline</p>
              {statusSaving && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--hz-cobalt)] font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {PIPELINE_STAGES.map((stage, i) => {
                const t = tones[stage.tone];
                const isActive = stage.key === candidate.status;
                const isPast   = !isRejected && currentIdx > i;
                return (
                  <div key={stage.key} className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleStageClick(stage.key)}
                      disabled={statusSaving}
                      title={stage.label}
                      className={cn(
                        "flex-1 min-w-0 h-9 rounded-lg flex items-center justify-center gap-1.5 px-2 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-60 border",
                        isActive
                          ? cn(t.bg, "border-transparent shadow-sm ring-2 ring-offset-1", t.ring)
                          : isPast
                          ? cn(t.bg, "border-transparent opacity-80")
                          : "bg-white border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-600",
                      )}>
                      <span className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                        isActive || isPast ? t.dot : "bg-slate-200",
                      )}>
                        {isPast && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className={cn(
                        "truncate hidden sm:block",
                        isActive || isPast ? t.text : "text-slate-400",
                      )}>
                        {stage.label}
                      </span>
                    </button>
                    {i < PIPELINE_STAGES.length - 1 && (
                      <div className={cn("w-3 h-0.5 flex-shrink-0 rounded-full", isPast && !isRejected ? "bg-[var(--hz-cobalt)]" : "bg-slate-200")} />
                    )}
                  </div>
                );
              })}

              <div className="w-px h-6 bg-slate-200 mx-1 flex-shrink-0 hidden sm:block" />

              <button
                onClick={() => handleStageClick("rejected")}
                disabled={statusSaving}
                aria-label="Reject candidate"
                className={cn(
                  "h-9 rounded-lg flex items-center justify-center gap-1.5 px-3 text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-60 border flex-shrink-0",
                  isRejected
                    ? "bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-offset-1 ring-rose-200 shadow-sm"
                    : "bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/50 text-slate-400 hover:text-rose-600",
                )}>
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                  isRejected ? "bg-rose-500" : "bg-slate-200")}>
                  {isRejected && <XCircle className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className={cn("hidden sm:block", isRejected ? "text-rose-700" : "text-slate-400")}>Rejected</span>
              </button>
            </div>
        </AdminCard>
      </motion.div>

      {/* ── Body: main + sidebar ── */}
      <div className="grid lg:grid-cols-3 gap-5 items-start">

        {/* Left — tabs */}
        <motion.div className="lg:col-span-2 space-y-4" {...fade(0.06)}>
          {/* Tab bar */}
          <AdminCard className="flex overflow-hidden">
            {([
              { key: "overview" as TabKey, label: "Overview", icon: FileText,          count: undefined as number | undefined },
              { key: "notes"    as TabKey, label: "Notes",    icon: MessageSquareText, count: notes.length },
              { key: "activity" as TabKey, label: "Activity", icon: History,           count: candidate.statusHistory?.length },
            ]).map((tab) => {
              const Icon   = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors relative",
                    active
                      ? "text-[var(--hz-cobalt)] bg-[var(--hz-cobalt-100)]/40"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50",
                  )}>
                  {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--hz-cobalt)] rounded-full" />}
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center tabular-nums",
                      active ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]" : "bg-slate-100 text-slate-600",
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </AdminCard>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Experience (manual) — superseded by the parsed work history when analysis exists */}
              {!hasAnalysis && candidate.experience && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={Briefcase} title="Experience" />
                  <div className="px-5 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{candidate.experience}</p>
                  </div>
                </AdminCard>
              )}

              {/* Cover letter */}
              {candidate.coverLetter && (
                <AdminCard className="overflow-hidden">
                  <AdminCardHeader icon={FileText} title="Cover letter" />
                  <div className="px-5 py-4">
                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{candidate.coverLetter}</p>
                  </div>
                </AdminCard>
              )}

              {/* Résumé analysis (parsed details now live in Overview) */}
              {candidate.resumeAnalysis ? (
                <>
                  <AdminCard className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-lg bg-[var(--hz-cobalt-100)] flex items-center justify-center flex-shrink-0">
                          <Sparkles className="w-4 h-4 text-[var(--hz-cobalt)]" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">Résumé analysis</p>
                          {candidate.resumeAnalyzedAt && (
                            <p className="text-[11px] text-slate-400">Last analyzed {fmtDateTime(candidate.resumeAnalyzedAt)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => setAnalysisEditOpen(true)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] transition-colors">
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button onClick={handleAnalyze} disabled={analyzing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-slate-200 bg-white text-slate-700 rounded-lg hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] transition-colors disabled:opacity-60">
                          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          Re-analyze
                        </button>
                      </div>
                    </div>
                  </AdminCard>
                  <ResumeAnalysisPanel analysis={candidate.resumeAnalysis} />
                </>
              ) : candidate.resumeId ? (
                <AdminCard className="px-6 py-12 text-center">
                  {(candidate.resumeAnalysisStatus === "pending" || candidate.resumeAnalysisStatus === "processing") ? (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-[var(--hz-cobalt-100)] flex items-center justify-center mx-auto mb-3">
                        <Loader2 className="w-6 h-6 text-[var(--hz-cobalt)] animate-spin" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">Analyzing resume…</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Extracting experience, education, skills and more. This usually takes under a minute — the page will update automatically.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-2xl bg-[var(--hz-cobalt-100)] flex items-center justify-center mx-auto mb-3">
                        <Sparkles className="w-6 h-6 text-[var(--hz-cobalt)]" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">
                        {candidate.resumeAnalysisStatus === "failed" ? "Last analysis didn't finish" : "Resume not analyzed yet"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {candidate.resumeAnalysisStatus === "failed" && candidate.resumeAnalysisError
                          ? candidate.resumeAnalysisError
                          : "Extract structured experience, education, skills and more from the attached resume. This can take up to a minute."}
                      </p>
                      <button onClick={handleAnalyze} disabled={analyzing}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:opacity-60 transition shadow-sm shadow-[rgba(29,78,216,0.2)]">
                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {analyzing ? "Analyzing…" : candidate.resumeAnalysisStatus === "failed" ? "Retry analysis" : "Analyze resume"}
                      </button>
                    </>
                  )}
                </AdminCard>
              ) : (
                <AdminCard className="px-6 py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">No résumé details yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    No resume is attached. You can add skills, experience and other details manually.
                  </p>
                  <button onClick={() => setAnalysisEditOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] transition shadow-sm shadow-[rgba(29,78,216,0.2)]">
                    <Plus className="w-4 h-4" /> Add details manually
                  </button>
                </AdminCard>
              )}
            </div>
          )}

          {/* Notes tab */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Input */}
              <AdminCard className="overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
                  <Avatar name={user?.name || user?.email || "You"} size="xs" />
                  <span className="text-sm font-semibold text-slate-700">{user?.name || user?.email || "You"}</span>
                  <span className="text-xs text-slate-400">— add a note</span>
                </div>
                <div className="px-5 py-4">
                  <textarea
                    rows={3}
                    value={newNote}
                    autoComplete="off"
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                    placeholder="Interview feedback, next steps, anything the team should know…"
                    className="w-full px-0 py-0 text-sm text-slate-800 placeholder:text-slate-400 bg-transparent border-0 outline-none resize-none leading-relaxed"
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-slate-400">
                      {newNote.length > 0 ? `${newNote.length} characters` : "⌘↵ to save · visible to your team"}
                    </p>
                    <button onClick={handleAddNote} disabled={!newNote.trim() || addingNote}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] disabled:opacity-50 transition shadow-sm">
                      {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Post note
                    </button>
                  </div>
                </div>
              </AdminCard>

              {notes.length > 0 ? (
                <div className="space-y-3">
                  {[...notes].reverse().map((note) => (
                    <AdminCard key={note.id} hover className="overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                        <Avatar name={note.addedByName} size="xs" />
                        <span className="text-xs font-bold text-slate-700">{note.addedByName}</span>
                        <span className="text-[10px] text-slate-400 ml-auto tabular-nums">{fmtDateTime(note.addedAt)}</span>
                      </div>
                      <div className="px-5 py-4">
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{note.text}</p>
                      </div>
                    </AdminCard>
                  ))}
                </div>
              ) : (
                <AdminCard className="py-14 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                    <MessageSquareText className="w-6 h-6 text-slate-300" />
                  </div>
                  <p className="text-sm font-semibold text-slate-500">No notes yet</p>
                  <p className="text-xs text-slate-400 mt-1">Add the first note above</p>
                </AdminCard>
              )}
            </div>
          )}

          {/* Activity tab */}
          {activeTab === "activity" && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={History} title="Status history" count={candidate.statusHistory?.length} />
              <div className="px-5 py-4">
                {candidate.statusHistory && candidate.statusHistory.length > 0 ? (
                  <ol className="space-y-0">
                    {[...candidate.statusHistory].reverse().map((entry, i, arr) => {
                      const meta  = (statusMeta as Record<string, typeof statusMeta.pending>)[entry.status];
                      const t     = tones[meta?.tone || "slate"];
                      const Icon  = meta?.icon || Clock;
                      const isLast = i === arr.length - 1;
                      return (
                        <li key={i} className="flex gap-4 relative pb-5">
                          {!isLast && <div className="absolute left-[13px] top-7 bottom-0 w-px bg-slate-100" />}
                          <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white", t.bg)}>
                            <Icon className={cn("w-3.5 h-3.5", t.text)} />
                          </div>
                          <div className="flex-1 min-w-0 pt-0.5">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap">
                              <p className="text-sm">
                                <span className="font-semibold text-slate-900">Moved to {meta?.label || entry.status}</span>
                                {entry.changedByName && (
                                  <span className="text-slate-500 font-normal"> by <span className="font-medium text-slate-700">{entry.changedByName}</span></span>
                                )}
                              </p>
                              <span className="text-[11px] text-slate-400 flex-shrink-0 tabular-nums">{fmtDateTime(entry.changedAt)}</span>
                            </div>
                            {entry.notes && (
                              <p className="text-xs text-slate-600 mt-1.5 px-3 py-2 bg-slate-50 rounded-lg border border-slate-100 italic">
                                &ldquo;{entry.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                ) : (
                  <div className="text-center py-10">
                    <History className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400 font-medium">No activity recorded yet</p>
                  </div>
                )}
              </div>
            </AdminCard>
          )}
        </motion.div>

        {/* Right — sidebar */}
        <motion.div className="space-y-4 lg:sticky lg:top-20" {...fade(0.1)}>

          {/* Resume file */}
          <AdminCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Resume</h3>
            </div>
            <div className="p-4">
              {candidate.resumeId ? (
                <button onClick={handleViewResume}
                  className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-[var(--hz-cobalt-100)]/50 border border-slate-200 hover:border-[var(--hz-cobalt-100)] rounded-xl transition-all group text-left">
                  <div className="w-10 h-10 rounded-lg bg-[var(--hz-cobalt-100)] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[var(--hz-cobalt)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-[var(--hz-cobalt)] transition-colors">
                      {candidate.resumeFileName || "resume.pdf"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">View or download</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-[var(--hz-cobalt)] flex-shrink-0" />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 py-1">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400">No resume on file</p>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Application info */}
          <AdminCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Application</h3>
            </div>
            <dl className="divide-y divide-slate-100">
              {[
                { label: "App ID",    value: candidate.applicationId || candidate.id?.slice(0, 8), mono: true },
                { label: "Status",    value: candidate.status, badge: true },
                ...(candidate.updatedAt ? [{ label: "Updated", value: fmtDate(candidate.updatedAt) }] : []),
                ...(hasAnalysis && candidate.resumeAnalyzedAt ? [{ label: "Analyzed", value: fmtDate(candidate.resumeAnalyzedAt) }] : []),
              ].map(({ label, value, mono, badge }) => (
                <div key={label} className="flex items-center justify-between gap-3 px-5 py-2.5">
                  <dt className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0">{label}</dt>
                  <dd className="text-right min-w-0">
                    {badge && value ? (
                      <StatusBadge status={value as AppStatus} size="sm" />
                    ) : value ? (
                      <span className={cn(
                        "text-sm font-medium text-slate-800 truncate block",
                        mono && "font-mono text-xs text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded",
                      )}>
                        {value}
                      </span>
                    ) : (
                      <span className="text-slate-300 text-sm">—</span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </AdminCard>

          {/* Position */}
          {candidate.jobTitle && (
            <AdminCard className="overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
                <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Position</h3>
              </div>
              <div className="p-5">
                <Link href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"} className="group block">
                  <p className="text-sm font-bold text-slate-900 group-hover:text-[var(--hz-cobalt)] transition-colors">
                    {candidate.jobTitle}
                  </p>
                  <div className="mt-2 space-y-1">
                    {candidate.jobDepartment && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />{candidate.jobDepartment}
                      </p>
                    )}
                    {candidate.jobLocation && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />{candidate.jobLocation}
                      </p>
                    )}
                    {candidate.jobType && (
                      <p className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />{candidate.jobType}
                      </p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-[var(--hz-cobalt)] group-hover:gap-1.5 transition-all">
                    View job posting <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </AdminCard>
          )}

          {/* Owner */}
          <AdminCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Assigned recruiter</h3>
            </div>
            <div className="p-5">
              {candidate.ownership && candidate.ownershipName ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar name={candidate.ownershipName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{candidate.ownershipName}</p>
                      {candidate.ownershipClaimedAt && (
                        <p className="text-[10px] text-slate-400 mt-0.5">Since {fmtDate(candidate.ownershipClaimedAt)}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <button onClick={handleReleaseOwnership} disabled={ownerSaving}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors border border-transparent hover:border-rose-100">
                      {ownerSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                      Release
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleClaimOwnership} disabled={ownerSaving}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold border-2 border-dashed border-slate-200 text-slate-500 rounded-xl hover:border-[var(--hz-cobalt)] hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)]/40 transition-all">
                  {ownerSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                  Claim this candidate
                </button>
              )}
            </div>
          </AdminCard>

          {/* Created by */}
          {candidate.createdByName && (
            <div className="flex items-center gap-2 px-1">
              <Avatar name={candidate.createdByName} size="xs" />
              <p className="text-xs text-slate-400">
                Added by <span className="font-semibold text-slate-600">{candidate.createdByName}</span>
                {candidate.createdAt && <> · {fmtDate(candidate.createdAt)}</>}
              </p>
            </div>
          )}
        </motion.div>
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
