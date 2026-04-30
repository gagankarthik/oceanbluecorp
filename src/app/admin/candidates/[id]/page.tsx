"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Phone, MapPin, Briefcase, FileText, Star, MessageSquareText,
  XCircle, Edit3, Loader2, History, Plus, Hash, Building2, Calendar,
  BookmarkPlus, BookmarkCheck, UserCheck, UserX, Download, Tag,
  Clock, ArrowRight, Check, ExternalLink, AlertCircle,
} from "lucide-react";
import { Application, Job, NoteEntry } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { SectionCard } from "@/components/admin/section-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { useAdmin } from "@/components/admin/admin-provider";
import { tones, statusMeta, PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

interface CandidateDetail extends Application {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

type TabKey = "overview" | "activity" | "notes";

export default function CandidateDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { openCandidateEditor } = useAdmin();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [statusSaving, setStatusSaving] = useState(false);
  const [benchSaving, setBenchSaving] = useState(false);
  const [ownerSaving, setOwnerSaving] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const fetchCandidate = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/applications/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Candidate not found");
      const application: Application = data.application;

      let extra: Partial<CandidateDetail> = {};
      if (application.jobId) {
        const jr = await fetch(`/api/jobs/${application.jobId}`);
        if (jr.ok) {
          const jd = await jr.json();
          extra = {
            jobTitle: application.jobTitle || jd.job?.title,
            jobDepartment: jd.job?.department,
            jobLocation: jd.job?.location,
            jobType: jd.job?.type,
          };
        }
      }
      setCandidate({ ...application, ...extra });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void fetchCandidate(); }, [fetchCandidate]);

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
      const updated = await patch({
        status: stage, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin",
      });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { alert("Failed to update status"); }
    finally { setStatusSaving(false); }
  };

  const handleRating = async (rating: number) => {
    if (!candidate) return;
    const next = rating === candidate.rating ? 0 : rating;
    setCandidate((p) => (p ? { ...p, rating: next } : p));
    try { await patch({ rating: next }); } catch { alert("Failed to update rating"); }
  };

  const handleBenchToggle = async () => {
    if (!candidate || benchSaving) return;
    setBenchSaving(true);
    const next = !candidate.addToTalentBench;
    setCandidate((p) => (p ? { ...p, addToTalentBench: next } : p));
    try { await patch({ addToTalentBench: next, ...(next && { benchAddedBy: user?.email || user?.id }) }); }
    catch {
      setCandidate((p) => (p ? { ...p, addToTalentBench: !next } : p));
      alert("Failed to update talent bench");
    } finally { setBenchSaving(false); }
  };

  const handleClaimOwnership = async () => {
    if (!candidate || !user || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: user.id, ownershipName: user.name || user.email });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { alert("Failed to claim ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleReleaseOwnership = async () => {
    if (!candidate || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: "", ownershipName: "" });
      setCandidate((p) => (p ? { ...p, ...updated } : p));
    } catch { alert("Failed to release ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !candidate || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addNote: {
            text: newNote.trim(),
            addedBy: user?.id || "admin",
            addedByName: user?.name || user?.email || "Admin",
          },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setCandidate((p) => (p ? { ...p, notesHistory: data.application.notesHistory } : p));
      setNewNote("");
    } catch { alert("Failed to add note"); }
    finally { setAddingNote(false); }
  };

  const handleViewResume = async () => {
    if (!candidate?.resumeId) return;
    try {
      const res = await fetch(`/api/resume/${candidate.resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      window.open(data.downloadUrl, "_blank");
    } catch { alert("Failed to load resume. The file may have been deleted."); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading candidate profile…</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-7 h-7 text-rose-500" />
          </div>
          <div>
            <p className="text-slate-900 font-semibold">{error || "Candidate not found"}</p>
            <p className="text-sm text-slate-500 mt-1">The record you&apos;re looking for may have been removed.</p>
          </div>
          <button
            onClick={() => router.push("/admin/applications")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to candidates
          </button>
        </div>
      </div>
    );
  }

  const isRejected = candidate.status === "rejected";
  const currentStageIdx = PIPELINE_STAGES.findIndex((s) => s.key === candidate.status);
  const notes: NoteEntry[] = candidate.notesHistory || [];
  const isOwner = candidate.ownership === user?.id;
  const skills = candidate.skills || [];

  return (
    <div className="space-y-5 pb-8">
      {/* ── Top breadcrumb + actions ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-200 rounded-lg font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-slate-300">/</span>
          <Link href="/admin/applications" className="text-slate-500 hover:text-blue-600 transition-colors">
            Applications
          </Link>
          {candidate.applicationId && (
            <>
              <span className="text-slate-300">/</span>
              <span className="text-slate-900 font-mono text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded font-semibold">
                {candidate.applicationId}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {candidate.jobId && (
            <Link
              href={`/admin/jobs/${candidate.jobId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-300 text-xs font-semibold rounded-lg transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" /> View job
            </Link>
          )}
          <button
            onClick={handleBenchToggle}
            disabled={benchSaving}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-60",
              candidate.addToTalentBench
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:text-emerald-700",
            )}
          >
            {benchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
              candidate.addToTalentBench ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
            {candidate.addToTalentBench ? "In bench" : "Add to bench"}
          </button>
          <PageHeaderButton variant="primary" onClick={() => openCandidateEditor({ candidate })}>
            <Edit3 className="w-3.5 h-3.5" /> Edit
          </PageHeaderButton>
        </div>
      </div>

      {/* ── Identity card ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.04)] overflow-hidden">
        {/* Banner with subtle gradient */}
        <div className="h-20 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 relative">
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "20px 20px",
          }} />
        </div>

        <div className="px-5 sm:px-6 pb-5 -mt-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-end gap-4 min-w-0">
              <div className="ring-4 ring-white rounded-full">
                <Avatar name={candidate.name || candidate.email} size="xl" />
              </div>
              <div className="pb-1 min-w-0">
                <h1 className="text-xl font-bold text-slate-900 truncate">{candidate.name || "Unnamed candidate"}</h1>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500 mt-1">
                  {candidate.jobTitle && (
                    <span className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span className="font-medium text-slate-700">{candidate.jobTitle}</span>
                      {candidate.jobDepartment && <span className="text-slate-400">· {candidate.jobDepartment}</span>}
                    </span>
                  )}
                  <StatusBadge status={candidate.status} withIcon size="md" />
                  {candidate.addToTalentBench && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                      <BookmarkCheck className="w-3 h-3" /> Bench
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Rating block */}
            <div className="flex flex-col items-end pb-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Rating</span>
              <StarRating rating={candidate.rating || 0} onRate={handleRating} size="lg" />
              <span className="text-xs text-slate-400 mt-1">
                {candidate.rating ? `${candidate.rating} / 5` : "Not rated"}
              </span>
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4 text-sm">
            <a href={`mailto:${candidate.email}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors group">
              <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              <span>{candidate.email}</span>
            </a>
            {candidate.phone && (
              <a href={`tel:${candidate.phone}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition-colors group">
                <Phone className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
                <span>{candidate.phone}</span>
              </a>
            )}
            {(candidate.city || candidate.state) && (
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {[candidate.city, candidate.state].filter(Boolean).join(", ")}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 text-slate-500 ml-auto">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Applied {fmtDate(candidate.appliedAt)}
            </span>
          </div>
        </div>

        {/* Pipeline strip */}
        <div className="border-t border-slate-100 bg-slate-50/40 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-2.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pipeline progression</p>
            {statusSaving && <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />}
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {PIPELINE_STAGES.map((stage, i) => {
              const t = tones[stage.tone];
              const isActive = stage.key === candidate.status;
              const isPast = !isRejected && currentStageIdx >= i && i < currentStageIdx;
              const isFuture = isRejected || currentStageIdx < i;
              return (
                <div key={stage.key} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                  <button
                    onClick={() => handleStageClick(stage.key)}
                    disabled={statusSaving}
                    className={cn(
                      "flex-1 min-w-0 rounded-lg border-2 px-2 sm:px-3 py-2 text-left transition-all disabled:opacity-50",
                      isActive
                        ? `${t.bg} border-transparent ring-2 ring-offset-1 ring-offset-white ${t.ring} shadow-sm`
                        : isPast
                        ? `${t.bg} border-transparent opacity-90`
                        : "bg-white border-dashed border-slate-200 hover:border-slate-300",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0",
                        isActive || isPast ? t.dot : "bg-slate-200",
                      )}>
                        {isPast && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <p className={cn(
                        "text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate",
                        isActive || isPast ? t.text : "text-slate-400",
                      )}>
                        {stage.label}
                      </p>
                    </div>
                  </button>
                  {i < PIPELINE_STAGES.length - 1 && (
                    <ArrowRight className={cn("w-3 h-3 flex-shrink-0", isPast ? t.text : "text-slate-300")} />
                  )}
                </div>
              );
            })}
            <div className="hidden sm:block w-px h-7 bg-slate-200 mx-1" />
            <button
              onClick={() => handleStageClick("rejected")}
              disabled={statusSaving}
              className={cn(
                "min-w-[80px] sm:min-w-[100px] rounded-lg border-2 px-2 sm:px-3 py-2 text-left transition-all disabled:opacity-50",
                isRejected
                  ? "bg-rose-50 border-transparent ring-2 ring-offset-1 ring-offset-white ring-rose-200 shadow-sm"
                  : "bg-white border-dashed border-slate-200 hover:border-rose-300 hover:bg-rose-50/40",
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn("w-4 h-4 rounded-full flex items-center justify-center", isRejected ? "bg-rose-500" : "bg-slate-200")}>
                  {isRejected && <XCircle className="w-2.5 h-2.5 text-white" />}
                </span>
                <p className={cn("text-[11px] sm:text-xs font-bold uppercase tracking-wider truncate", isRejected ? "text-rose-700" : "text-slate-400")}>
                  Rejected
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        {([
          { key: "overview" as TabKey, label: "Overview", icon: FileText, count: undefined as number | undefined },
          { key: "activity" as TabKey, label: "Activity", icon: History, count: candidate.statusHistory?.length },
          { key: "notes"    as TabKey, label: "Notes",    icon: MessageSquareText, count: notes.length },
        ]).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors",
                active ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn("rounded-full px-1.5 py-0 text-[10px] font-bold", active ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600")}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      {activeTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-5 lg:col-span-2">
            {/* Skills */}
            <SectionCard
              title="Skills"
              icon={Tag}
              actions={
                <PageHeaderButton variant="ghost" onClick={() => openCandidateEditor({ candidate })} className="text-xs">
                  <Edit3 className="w-3 h-3" /> Edit
                </PageHeaderButton>
              }
            >
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No skills listed</p>
              )}
            </SectionCard>

            {/* Experience */}
            {candidate.experience && (
              <SectionCard title="Experience summary" icon={Briefcase}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{candidate.experience}</p>
              </SectionCard>
            )}

            {/* Cover letter */}
            {candidate.coverLetter && (
              <SectionCard title="Cover letter" icon={FileText}>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{candidate.coverLetter}</p>
              </SectionCard>
            )}

            {/* Resume */}
            <SectionCard title="Resume" icon={FileText}>
              {candidate.resumeId ? (
                <button
                  onClick={handleViewResume}
                  className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-blue-50 hover:border-blue-200 transition-colors group text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center group-hover:border-blue-300 flex-shrink-0">
                    <FileText className="w-5 h-5 text-slate-400 group-hover:text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{candidate.resumeFileName || "Resume"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Click to download or preview</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                </button>
              ) : (
                <p className="text-sm text-slate-400 italic">No resume on file</p>
              )}
            </SectionCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick info */}
            <SectionCard title="Candidate info" icon={Hash}>
              <dl className="space-y-2.5 text-sm">
                <InfoRow label="Application ID" value={candidate.applicationId || candidate.id?.slice(0, 8)} mono />
                <InfoRow label="Source" value={candidate.source} />
                <InfoRow label="Work auth" value={candidate.workAuthorization} />
                <InfoRow label="Applied" value={fmtFull(candidate.appliedAt)} />
                {candidate.updatedAt && <InfoRow label="Last updated" value={fmtFull(candidate.updatedAt)} />}
              </dl>
            </SectionCard>

            {/* Job context */}
            {candidate.jobTitle && (
              <SectionCard title="Position" icon={Briefcase}>
                <Link
                  href={candidate.jobId ? `/admin/jobs/${candidate.jobId}` : "#"}
                  className="block p-3 -m-1 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <p className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {candidate.jobTitle}
                  </p>
                  <div className="mt-1 space-y-0.5 text-xs text-slate-500">
                    {candidate.jobDepartment && (
                      <p className="flex items-center gap-1.5"><Building2 className="w-3 h-3" />{candidate.jobDepartment}</p>
                    )}
                    {candidate.jobLocation && (
                      <p className="flex items-center gap-1.5"><MapPin className="w-3 h-3" />{candidate.jobLocation}</p>
                    )}
                    {candidate.jobType && (
                      <p className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{candidate.jobType}</p>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 group-hover:gap-1.5 transition-all">
                    Open job <ExternalLink className="w-3 h-3" />
                  </span>
                </Link>
              </SectionCard>
            )}

            {/* Ownership */}
            <SectionCard title="Owner" icon={UserCheck}>
              {candidate.ownership && candidate.ownershipName ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar name={candidate.ownershipName} size="sm" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{candidate.ownershipName}</p>
                      {candidate.ownershipClaimedAt && (
                        <p className="text-[10px] text-slate-400">Since {fmtDate(candidate.ownershipClaimedAt)}</p>
                      )}
                    </div>
                  </div>
                  {isOwner && (
                    <button
                      onClick={handleReleaseOwnership}
                      disabled={ownerSaving}
                      className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    >
                      <UserX className="w-3 h-3" /> Release
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleClaimOwnership}
                  disabled={ownerSaving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold border border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {ownerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  Claim candidate
                </button>
              )}
            </SectionCard>

            {/* Created by */}
            {candidate.createdByName && (
              <div className="text-xs text-slate-400 px-1">
                Added by <span className="font-medium text-slate-600">{candidate.createdByName}</span>
                {candidate.createdAt && <> · {fmtDate(candidate.createdAt)}</>}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "activity" && (
        <SectionCard title="Status history" icon={History}>
          {candidate.statusHistory && candidate.statusHistory.length > 0 ? (
            <ol className="space-y-0">
              {[...candidate.statusHistory].reverse().map((entry, i, arr) => {
                const meta = (statusMeta as Record<string, typeof statusMeta.pending>)[entry.status];
                const t = tones[meta?.tone || "slate"];
                const Icon = meta?.icon || Clock;
                return (
                  <li key={i} className="flex gap-3 relative pb-4">
                    {i < arr.length - 1 && <div className="absolute left-[14px] top-7 bottom-0 w-px bg-slate-200" />}
                    <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0", t.bg)}>
                      <Icon className={cn("w-3.5 h-3.5", t.text)} />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <p className="text-sm">
                        <span className="font-semibold text-slate-900">Moved to {meta?.label || entry.status}</span>
                        {entry.changedByName && <span className="text-slate-500"> by <span className="font-medium text-slate-700">{entry.changedByName}</span></span>}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{fmtFull(entry.changedAt)}</p>
                      {entry.notes && (
                        <p className="text-xs text-slate-600 mt-1.5 px-2.5 py-1.5 bg-slate-50 rounded-md italic">&ldquo;{entry.notes}&rdquo;</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-slate-400 italic text-center py-6">No activity yet</p>
          )}
        </SectionCard>
      )}

      {activeTab === "notes" && (
        <div className="space-y-4">
          <SectionCard title="Add a note" icon={Plus}>
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Share an update, interview feedback, or anything the team should know…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400 resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-slate-400">
                {newNote.length > 0 ? `${newNote.length} chars` : "Notes are visible to your team only"}
              </p>
              <button
                onClick={handleAddNote}
                disabled={!newNote.trim() || addingNote}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {addingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Add note
              </button>
            </div>
          </SectionCard>

          {notes.length > 0 ? (
            <div className="space-y-3">
              {[...notes].reverse().map((note) => (
                <div key={note.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar name={note.addedByName} size="xs" />
                      <span className="text-xs font-semibold text-slate-700 truncate">{note.addedByName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtFull(note.addedAt)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <SectionCard>
              <div className="text-center py-6">
                <MessageSquareText className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 font-medium">No notes yet</p>
                <p className="text-xs text-slate-400 mt-1">Be the first to share an update</p>
              </div>
            </SectionCard>
          )}
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value?: string | number | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</dt>
      <dd className={cn("text-sm font-medium text-slate-700 text-right truncate", mono && "font-mono text-xs text-slate-600")}>
        {value || <span className="text-slate-300">—</span>}
      </dd>
    </div>
  );
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function fmtFull(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}
