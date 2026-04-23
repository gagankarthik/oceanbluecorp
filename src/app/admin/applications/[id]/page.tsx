"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  FileText,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Eye,
  User,
  Download,
  Edit3,
  Save,
  X,
  Loader2,
  History,
  StickyNote,
  Plus,
  ExternalLink,
  Globe,
  Hash,
  ChevronRight,
  Layers,
  UserCheck,
  UserX,
  BookmarkPlus,
  BookmarkCheck,
  AlertCircle,
  Zap,
  Award,
  Tag,
  Building2,
  Calendar,
} from "lucide-react";
import { Application, Job, NoteEntry } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

interface ApplicationDetail extends Application {
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

// ─── ATS Pipeline stages ───────────────────────────────────────────────────

const PIPELINE: {
  key: Application["status"];
  label: string;
  short: string;
  color: string;
  bg: string;
  ring: string;
  dot: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  { key: "pending",   label: "New",        short: "New",       color: "text-gray-600",   bg: "bg-gray-100",   ring: "ring-gray-300",   dot: "bg-gray-400",   icon: Clock },
  { key: "reviewing", label: "Screening",  short: "Screen",    color: "text-blue-700",   bg: "bg-blue-100",   ring: "ring-blue-400",   dot: "bg-blue-500",   icon: Eye },
  { key: "interview", label: "Interview",  short: "Interview", color: "text-purple-700", bg: "bg-purple-100", ring: "ring-purple-400", dot: "bg-purple-500", icon: MessageSquare },
  { key: "offered",   label: "Offered",    short: "Offered",   color: "text-amber-700",  bg: "bg-amber-100",  ring: "ring-amber-400",  dot: "bg-amber-500",  icon: Award },
  { key: "hired",     label: "Hired",      short: "Hired",     color: "text-emerald-700",bg: "bg-emerald-100",ring: "ring-emerald-400",dot: "bg-emerald-500",icon: CheckCircle2 },
];

const REJECTED_STAGE = {
  key: "rejected" as Application["status"],
  label: "Rejected",
  color: "text-rose-700",
  bg: "bg-rose-100",
  ring: "ring-rose-400",
  dot: "bg-rose-500",
  icon: XCircle,
};

type TabKey = "overview" | "notes" | "history";

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const cls =
    size === "lg" ? "w-20 h-20 text-2xl" :
    size === "md" ? "w-11 h-11 text-sm" :
    "w-8 h-8 text-xs";
  return (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-lg`}>
      {initials}
    </div>
  );
}

function StatPill({ label, value, color = "gray" }: { label: string; value: string | number; color?: "gray" | "blue" | "emerald" | "amber" }) {
  const colors = {
    gray: "bg-gray-50 text-gray-700 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
  };
  return (
    <div className={`flex flex-col items-center px-4 py-2.5 rounded-xl border ${colors[color]}`}>
      <span className="text-xl font-bold leading-none">{value}</span>
      <span className="text-xs mt-1 font-medium opacity-80">{label}</span>
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Status change
  const [statusSaving, setStatusSaving] = useState(false);

  // Rating
  const [hoverRating, setHoverRating] = useState(0);

  // Talent bench
  const [benchSaving, setBenchSaving] = useState(false);

  // Notes
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Ownership
  const [ownerSaving, setOwnerSaving] = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/applications/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Application not found");
        const application: Application = data.application;

        let extra: Partial<ApplicationDetail> = {};
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
        setApp({ ...application, ...extra });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // ── Handlers ─────────────────────────────────────────────────────────────
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

  const handleStageClick = async (stage: Application["status"]) => {
    if (!app || stage === app.status || statusSaving) return;
    setStatusSaving(true);
    try {
      const updated = await patch({ status: stage, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" });
      setApp((prev) => prev ? { ...prev, ...updated } : prev);
    } catch { alert("Failed to update status"); }
    finally { setStatusSaving(false); }
  };

  const handleRating = async (rating: number) => {
    if (!app) return;
    setApp((p) => p ? { ...p, rating } : p);
    try { await patch({ rating }); } catch { alert("Failed to update rating"); }
  };

  const handleBenchToggle = async () => {
    if (!app || benchSaving) return;
    setBenchSaving(true);
    const next = !app.addToTalentBench;
    setApp((p) => p ? { ...p, addToTalentBench: next } : p);
    try { await patch({ addToTalentBench: next }); }
    catch { setApp((p) => p ? { ...p, addToTalentBench: !next } : p); alert("Failed to update talent bench"); }
    finally { setBenchSaving(false); }
  };

  const handleClaimOwnership = async () => {
    if (!app || !user || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: user.id, ownershipName: user.name || user.email });
      setApp((p) => p ? { ...p, ...updated } : p);
    } catch { alert("Failed to claim ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleReleaseOwnership = async () => {
    if (!app || ownerSaving) return;
    setOwnerSaving(true);
    try {
      const updated = await patch({ ownership: "", ownershipName: "" });
      setApp((p) => p ? { ...p, ...updated } : p);
    } catch { alert("Failed to release ownership"); }
    finally { setOwnerSaving(false); }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !app || addingNote) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addNote: { text: newNote.trim(), addedBy: user?.id || "admin", addedByName: user?.name || user?.email || "Admin" },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setApp((p) => p ? { ...p, notesHistory: data.application.notesHistory } : p);
      setNewNote("");
    } catch { alert("Failed to add note"); }
    finally { setAddingNote(false); }
  };

  const handleViewResume = async () => {
    if (!app?.resumeId) return;
    try {
      const res = await fetch(`/api/resume/${app.resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed");
      window.open(data.downloadUrl, "_blank");
    } catch { alert("Failed to load resume. The file may have been deleted."); }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const fmtFull = (d: string) => new Date(d).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
  const ago = (d: string) => {
    const n = Math.floor((Date.now() - new Date(d).getTime()) / 86400000);
    if (n === 0) return "Today"; if (n === 1) return "Yesterday";
    if (n < 7) return `${n}d ago`; if (n < 30) return `${Math.floor(n / 7)}w ago`;
    return `${Math.floor(n / 30)}mo ago`;
  };

  // ── Loading / Error ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Loading applicant profile…</p>
      </div>
    </div>
  );

  if (error || !app) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <p className="text-gray-900 font-semibold">{error || "Application not found"}</p>
        <button onClick={() => router.back()} className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Go Back
        </button>
      </div>
    </div>
  );

  const isRejected = app.status === "rejected";
  const currentStageIdx = PIPELINE.findIndex((s) => s.key === app.status);
  const notes: NoteEntry[] = app.notesHistory || [];
  const isOwner = app.ownership === user?.id;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-8">

      {/* ── Top Nav ── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-500 hover:text-gray-900 hover:bg-white border border-transparent hover:border-gray-200 rounded-lg text-sm font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <span className="text-gray-300">/</span>
          <Link href="/admin/applications" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">All Applications</Link>
          {app.applicationId && (
            <>
              <span className="text-gray-300">/</span>
              <span className="text-sm text-gray-900 font-medium font-mono">{app.applicationId}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {app.jobId && (
            <Link
              href={`/admin/jobs/${app.jobId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 text-sm font-medium rounded-lg transition-colors"
            >
              <Briefcase className="w-3.5 h-3.5" /> View Job
            </Link>
          )}
          <button
            onClick={handleBenchToggle}
            disabled={benchSaving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border transition-all ${
              app.addToTalentBench
                ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:text-emerald-700"
            } disabled:opacity-60`}
          >
            {benchSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : app.addToTalentBench ? (
              <BookmarkCheck className="w-3.5 h-3.5" />
            ) : (
              <BookmarkPlus className="w-3.5 h-3.5" />
            )}
            {app.addToTalentBench ? "In Talent Bench" : "Add to Talent Bench"}
          </button>
        </div>
      </div>

      {/* ── Profile Card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm ">

        <div className="px-6 pb-5 pt-4 space-y-4">
          {/* Avatar overlapping banner */}
          <div className="flex items-end justify-between mb-4">
            <div className="flex items-end gap-4">
              <div className="ring-4 ring-white rounded-full">
                <Avatar name={app.name} size="lg" />
              </div>
              <div className="pb-1">
                <h1 className="text-xl font-bold text-gray-900">{app.name}</h1>
                {app.jobTitle && (
                  <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                    <Briefcase className="w-3.5 h-3.5" />
                    {app.jobTitle}
                    {app.jobDepartment && <span className="text-gray-400">· {app.jobDepartment}</span>}
                  </p>
                )}
              </div>
            </div>

            {/* Star rating */}
            <div className="flex flex-col items-end gap-1 pb-1">
              <span className="text-xs text-gray-400 font-medium">Rating</span>
              <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => handleRating(s)} onMouseEnter={() => setHoverRating(s)} className="focus:outline-none transition-transform hover:scale-110">
                    <Star className={`w-6 h-6 ${s <= (hoverRating || app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400">{app.rating ? `${app.rating} / 5` : "Not rated"}</span>
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
            <a href={`mailto:${app.email}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
              <Mail className="w-4 h-4 text-gray-400" /> {app.email}
            </a>
            {app.phone && (
              <a href={`tel:${app.phone}`} className="flex items-center gap-1.5 hover:text-blue-600 transition-colors">
                <Phone className="w-4 h-4 text-gray-400" /> {app.phone}
              </a>
            )}
            {(app.city || app.state) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-gray-400" /> {[app.city, app.state].filter(Boolean).join(", ")}
              </span>
            )}
            {app.workAuthorization && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                <Globe className="w-3 h-3" /> {app.workAuthorization}
              </span>
            )}
            {app.source && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                <Tag className="w-3 h-3" /> {app.source}
              </span>
            )}
            {app.addToTalentBench && (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium">
                <BookmarkCheck className="w-3 h-3" /> Talent Bench
              </span>
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            <StatPill label="Applied" value={ago(app.appliedAt)} color="gray" />
            {app.statusHistory && app.statusHistory.length > 0 && (
              <StatPill label="Stage Changes" value={app.statusHistory.length} color="blue" />
            )}
            {notes.length > 0 && <StatPill label="Notes" value={notes.length} color="amber" />}
            {app.rating && <StatPill label="Stars" value={`${app.rating}/5`} color="amber" />}
            {app.skills && app.skills.length > 0 && <StatPill label="Skills" value={app.skills.length} color="blue" />}
          </div>
        </div>
      </div>

      {/* ── ATS Pipeline ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">ATS Pipeline</h2>
          </div>
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
              <XCircle className="w-3.5 h-3.5" /> Rejected
            </span>
          )}
          {statusSaving && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
        </div>

        {/* Stage bar */}
        <div className="relative">
          {/* Connector line */}
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 z-0 mx-10" />
          {/* Progress fill */}
          {!isRejected && currentStageIdx >= 0 && (
            <div
              className="absolute top-5 left-10 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 z-0 transition-all duration-500"
              style={{ width: `calc(${(currentStageIdx / (PIPELINE.length - 1)) * 100}% - 0px)` }}
            />
          )}

          <div className="relative z-10 flex items-start justify-between">
            {PIPELINE.map((stage, idx) => {
              const isActive = app.status === stage.key;
              const isPast = !isRejected && currentStageIdx > idx;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.key}
                  onClick={() => handleStageClick(stage.key)}
                  disabled={statusSaving}
                  className="flex flex-col items-center gap-2 group flex-1 disabled:cursor-not-allowed"
                  title={`Move to ${stage.label}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shadow-sm ${
                    isActive
                      ? `${stage.bg} border-current ${stage.color} ring-4 ${stage.ring} ring-opacity-30`
                      : isPast
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-white border-gray-200 text-gray-400 group-hover:border-gray-400"
                  }`}>
                    {isPast ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4.5 h-4.5" />}
                  </div>
                  <div className="text-center">
                    <p className={`text-xs font-semibold ${isActive ? stage.color : isPast ? "text-blue-600" : "text-gray-400"}`}>
                      {stage.short}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Reject / un-reject */}
        <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
          <p className="text-xs text-gray-400">Click a stage above to advance the candidate.</p>
          <button
            onClick={() => handleStageClick(isRejected ? "pending" : "rejected")}
            disabled={statusSaving}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg border transition-all disabled:opacity-50 ${
              isRejected
                ? "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
                : "border-rose-200 text-rose-600 hover:bg-rose-50"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            {isRejected ? "Restore to Pipeline" : "Reject Candidate"}
          </button>
        </div>
      </div>

      {/* ── Main Content + Sidebar ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ─ Left: Tabs ─ */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex border-b border-gray-100 bg-gray-50/60">
              {(["overview", "notes", "history"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-5 py-3.5 text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-white border-b-2 border-blue-600 text-blue-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "overview" && <Layers className="w-3.5 h-3.5" />}
                  {tab === "notes" && <StickyNote className="w-3.5 h-3.5" />}
                  {tab === "history" && <History className="w-3.5 h-3.5" />}
                  {tab === "notes" ? `Notes ${notes.length > 0 ? `(${notes.length})` : ""}` :
                   tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* ── Overview Tab ── */}
            {activeTab === "overview" && (
              <div className="p-6 space-y-6">
                {/* Job applied */}
                {app.jobTitle && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Position Applied For</h3>
                    <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-blue-200 flex-shrink-0">
                        <Briefcase className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{app.jobTitle}</p>
                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                          {app.jobDepartment && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{app.jobDepartment}</span>}
                          {app.jobLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{app.jobLocation}</span>}
                          {app.jobType && <span className="capitalize">{app.jobType.replace(/-/g, " ")}</span>}
                        </div>
                      </div>
                      {app.jobId && (
                        <Link href={`/admin/jobs/${app.jobId}`} className="flex-shrink-0 p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </section>
                )}

                {/* Contact */}
                <section>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Contact Details</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <a href={`mailto:${app.email}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Email</p>
                        <p className="text-sm text-gray-900 truncate group-hover:text-blue-600">{app.email}</p>
                      </div>
                    </a>
                    {app.phone && (
                      <a href={`tel:${app.phone}`} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all group">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Phone</p>
                          <p className="text-sm text-gray-900 group-hover:text-blue-600">{app.phone}</p>
                        </div>
                      </a>
                    )}
                    {(app.address || app.city) && (
                      <div className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 sm:col-span-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">Address</p>
                          <p className="text-sm text-gray-900">{[app.address, app.city, app.state, app.zipCode].filter(Boolean).join(", ")}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Skills */}
                {app.skills && app.skills.length > 0 && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Experience */}
                {app.experience && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Experience</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.experience}</p>
                    </div>
                  </section>
                )}

                {/* Cover Letter */}
                {app.coverLetter && (
                  <section>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Cover Letter</h3>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.coverLetter}</p>
                    </div>
                  </section>
                )}
              </div>
            )}

            {/* ── Notes Tab ── */}
            {activeTab === "notes" && (
              <div className="p-6 space-y-5">
                {/* Add note */}
                <div className="rounded-xl border border-gray-200 overflow-hidden focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/10 transition-all">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Write a note about this candidate…"
                    rows={4}
                    className="w-full px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none resize-none bg-white"
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddNote(); }}
                  />
                  <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                    <span className="text-xs text-gray-400">⌘+Enter to submit</span>
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addingNote}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes list */}
                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {[...notes].reverse().map((note, i) => {
                      const isRecent = i === 0;
                      return (
                        <div key={note.id} className={`rounded-xl border p-4 transition-all ${isRecent ? "border-blue-200 bg-blue-50/50" : "border-gray-100 bg-gray-50/60"}`}>
                          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-gray-200/70">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-white" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">{note.addedByName}</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-xs text-gray-400">{fmtFull(note.addedAt)}</span>
                            {isRecent && <span className="ml-auto text-[10px] font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Latest</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <StickyNote className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No notes yet</p>
                    <p className="text-xs text-gray-400 mt-1">Add a note to track your thoughts on this candidate.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── History Tab ── */}
            {activeTab === "history" && (
              <div className="p-6">
                {(app.statusHistory && app.statusHistory.length > 0) ? (
                  <ol className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                    {[...app.statusHistory].reverse().map((entry, i) => {
                      const s = PIPELINE.find((p) => p.key === entry.status) ||
                        (entry.status === "rejected" ? REJECTED_STAGE : null);
                      const Icon = s?.icon || Clock;
                      return (
                        <li key={i} className="ml-6">
                          <span className={`absolute -left-3.5 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white ${s?.bg || "bg-gray-100"}`}>
                            <Icon className={`w-3.5 h-3.5 ${s?.color || "text-gray-500"}`} />
                          </span>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-semibold ${s?.color || "text-gray-700"}`}>{s?.label || entry.status}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {entry.changedByName || "System"} · {fmtFull(entry.changedAt)}
                              </p>
                              {entry.notes && (
                                <p className="text-xs text-gray-600 italic mt-1 bg-gray-50 px-2 py-1 rounded">{entry.notes}</p>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                    {/* Applied entry at the bottom */}
                    <li className="ml-6">
                      <span className="absolute -left-3.5 w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                      <p className="text-sm font-semibold text-gray-600">Applied</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtFull(app.appliedAt)}</p>
                    </li>
                  </ol>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <History className="w-7 h-7 text-gray-300" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">No stage changes yet</p>
                    <p className="text-xs text-gray-400 mt-1">Use the pipeline above to move this candidate forward.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─ Right: Sidebar ─ */}
        <div className="space-y-4">

          {/* Application metadata */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Application Info</h3>
            <div className="space-y-2.5">
              {[
                { label: "App ID", value: app.applicationId || app.id.slice(0, 8), mono: true },
                { label: "Applied", value: fmt(app.appliedAt) },
                { label: "Time Since", value: ago(app.appliedAt) },
                app.source ? { label: "Source", value: app.source } : null,
                app.workAuthorization ? { label: "Work Auth", value: app.workAuthorization } : null,
                app.createdByName ? { label: "Created By", value: app.createdByName } : null,
                app.updatedAt ? { label: "Last Updated", value: fmt(app.updatedAt) } : null,
              ].filter(Boolean).map((row) => row && (
                <div key={row.label} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-400 flex-shrink-0">{row.label}</span>
                  <span className={`text-xs font-semibold text-gray-800 text-right ${row.mono ? "font-mono" : ""}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ownership */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ownership</h3>
            {app.ownershipName ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <div className="w-9 h-9 rounded-full bg-emerald-200 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{app.ownershipName}</p>
                    {app.ownershipClaimedAt && (
                      <p className="text-xs text-gray-400">Claimed {ago(app.ownershipClaimedAt)}</p>
                    )}
                  </div>
                </div>
                {(isOwner) && (
                  <button
                    onClick={handleReleaseOwnership}
                    disabled={ownerSaving}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {ownerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                    Release Ownership
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400">No owner assigned. Claim to take responsibility.</p>
                <button
                  onClick={handleClaimOwnership}
                  disabled={ownerSaving}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {ownerSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                  Claim Ownership
                </button>
              </div>
            )}
          </div>

          {/* Talent Bench */}
          <div className={`rounded-2xl border shadow-sm p-4 transition-all ${app.addToTalentBench ? "bg-emerald-50 border-emerald-200" : "bg-white border-gray-200"}`}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Talent Bench</h3>
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${app.addToTalentBench ? "bg-emerald-200" : "bg-gray-100"}`}>
                {app.addToTalentBench
                  ? <BookmarkCheck className="w-4.5 h-4.5 text-emerald-700" />
                  : <BookmarkPlus className="w-4.5 h-4.5 text-gray-400" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${app.addToTalentBench ? "text-emerald-800" : "text-gray-700"}`}>
                  {app.addToTalentBench ? "Added to Talent Bench" : "Not in Talent Bench"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {app.addToTalentBench
                    ? "This candidate is saved for future opportunities."
                    : "Save this candidate for future openings."}
                </p>
              </div>
            </div>
            <button
              onClick={handleBenchToggle}
              disabled={benchSaving}
              className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all disabled:opacity-50 ${
                app.addToTalentBench
                  ? "border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {benchSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               app.addToTalentBench ? <BookmarkCheck className="w-3.5 h-3.5" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              {app.addToTalentBench ? "Remove from Bench" : "Add to Talent Bench"}
            </button>
          </div>

          {/* Resume */}
          {app.resumeId && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Resume</h3>
              <button
                onClick={handleViewResume}
                className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-xl transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-medium text-gray-900 group-hover:text-blue-700 truncate">
                    {app.resumeFileName || "Resume"}
                  </p>
                  <p className="text-xs text-gray-400">Click to open</p>
                </div>
                <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <a href={`mailto:${app.email}`}
                className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-xl transition-colors group">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                </div>
                Email Applicant
                <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-blue-400" />
              </a>
              {app.phone && (
                <a href={`tel:${app.phone}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-xl transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 transition-colors">
                    <Phone className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  Call Applicant
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-purple-400" />
                </a>
              )}
              {app.jobId && (
                <Link href={`/admin/jobs/${app.jobId}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-200 transition-colors">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  View Job Posting
                  <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-indigo-400" />
                </Link>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
