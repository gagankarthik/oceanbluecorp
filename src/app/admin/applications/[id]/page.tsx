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
  Calendar,
  Download,
  Edit3,
  Save,
  X,
  Loader2,
  History,
  StickyNote,
  Plus,
  Trash2,
  ExternalLink,
  Globe,
  Hash,
} from "lucide-react";
import { Application, Job, NoteEntry } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

interface ApplicationDetail extends Application {
  jobTitle?: string;
  jobDepartment?: string;
  jobLocation?: string;
  jobType?: string;
}

const statusConfig = {
  pending: { label: "New", color: "bg-gray-100 text-gray-700 border-gray-200", dotColor: "bg-gray-400", icon: Clock },
  reviewing: { label: "Screening", color: "bg-blue-100 text-blue-700 border-blue-200", dotColor: "bg-blue-500", icon: Eye },
  interview: { label: "Interview", color: "bg-purple-100 text-purple-700 border-purple-200", dotColor: "bg-purple-500", icon: MessageSquare },
  offered: { label: "Offered", color: "bg-amber-100 text-amber-700 border-amber-200", dotColor: "bg-amber-500", icon: Mail },
  hired: { label: "Hired", color: "bg-emerald-100 text-emerald-700 border-emerald-200", dotColor: "bg-emerald-500", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-rose-100 text-rose-700 border-rose-200", dotColor: "bg-rose-500", icon: XCircle },
};

type TabKey = "overview" | "notes" | "history";

function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const sizeClass = size === "lg" ? "w-16 h-16 text-xl" : "w-9 h-9 text-sm";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [app, setApp] = useState<ApplicationDetail | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");

  // Inline edit state
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<Application["status"]>("pending");
  const [hoverRating, setHoverRating] = useState(0);

  // Notes state
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/applications/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Application not found");
        const application: Application = data.application;
        setApp(application);
        setNewStatus(application.status);

        // Fetch job details if available
        if (application.jobId) {
          const jobRes = await fetch(`/api/jobs/${application.jobId}`);
          if (jobRes.ok) {
            const jobData = await jobRes.json();
            const jobRecord: Job = jobData.job;
            setJob(jobRecord);
            setApp((prev) =>
              prev
                ? {
                    ...prev,
                    jobTitle: application.jobTitle || jobRecord.title,
                    jobDepartment: jobRecord.department,
                    jobLocation: jobRecord.location,
                    jobType: jobRecord.type,
                  }
                : prev
            );
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleStatusSave = async () => {
    if (!app || newStatus === app.status) { setEditingStatus(false); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changedBy: user?.id, changedByName: user?.name || user?.email || "Admin" }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setApp((prev) => prev ? { ...prev, ...data.application } : prev);
    } catch {
      alert("Failed to update status");
    } finally {
      setSaving(false);
      setEditingStatus(false);
    }
  };

  const handleRatingChange = async (rating: number) => {
    if (!app) return;
    setApp((prev) => prev ? { ...prev, rating } : prev);
    try {
      await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } catch {
      alert("Failed to update rating");
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !app) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addNote: { text: newNote.trim(), addedBy: user?.id || "admin", addedByName: user?.name || user?.email || "Admin" },
        }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const data = await res.json();
      setApp((prev) => prev ? { ...prev, notesHistory: data.application.notesHistory } : prev);
      setNewNote("");
    } catch {
      alert("Failed to add note");
    } finally {
      setAddingNote(false);
    }
  };

  const handleViewResume = async () => {
    if (!app?.resumeId) return;
    try {
      const res = await fetch(`/api/resume/${app.resumeId}`);
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Failed to get resume");
      window.open(data.downloadUrl, "_blank");
    } catch {
      alert("Failed to load resume. The file may have been deleted.");
    }
  };

  const fmt = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  const fmtTime = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const d = Math.floor(diff / 86400000);
    if (d === 0) return "Today";
    if (d === 1) return "Yesterday";
    if (d < 7) return `${d}d ago`;
    if (d < 30) return `${Math.floor(d / 7)}w ago`;
    return `${Math.floor(d / 30)}mo ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading application...</p>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium">{error || "Application not found"}</p>
          <button onClick={() => router.back()} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
  const StatusIcon = status.icon;
  const notes: NoteEntry[] = app.notesHistory || [];

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Application</p>
              {app.applicationId && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-500">
                  <Hash className="w-3 h-3" />{app.applicationId}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {app.jobId && (
              <Link
                href={`/admin/jobs/${app.jobId}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />View Job
              </Link>
            )}
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              All Applications
            </Link>
          </div>
        </div>

        {/* Profile Banner */}
        <div className="px-5 pb-5 border-t border-gray-100 pt-4">
          <div className="flex items-start gap-4">
            <Avatar name={app.name} size="lg" />
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500">
                <a href={`mailto:${app.email}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                  <Mail className="w-3.5 h-3.5" />{app.email}
                </a>
                {app.phone && (
                  <a href={`tel:${app.phone}`} className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                    <Phone className="w-3.5 h-3.5" />{app.phone}
                  </a>
                )}
                {(app.city || app.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />{[app.city, app.state].filter(Boolean).join(", ")}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {/* Status badge / editor */}
                {editingStatus ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as Application["status"])}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <option value="pending">New</option>
                      <option value="reviewing">Screening</option>
                      <option value="interview">Interview</option>
                      <option value="offered">Offered</option>
                      <option value="hired">Hired</option>
                      <option value="rejected">Rejected</option>
                    </select>
                    <button onClick={handleStatusSave} disabled={saving} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => { setEditingStatus(false); setNewStatus(app.status); }} className="p-1 text-gray-400 hover:bg-gray-100 rounded">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingStatus(true)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${status.color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                    <Edit3 className="w-3 h-3 ml-0.5 opacity-60" />
                  </button>
                )}
                {app.source && (
                  <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    via {app.source}
                  </span>
                )}
                {app.workAuthorization && (
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                    <Globe className="w-3 h-3 inline mr-1" />{app.workAuthorization}
                  </span>
                )}
              </div>
            </div>
            {/* Rating */}
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <p className="text-xs text-gray-400 font-medium">Rating</p>
              <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    className="focus:outline-none"
                  >
                    <Star className={`w-5 h-5 transition-colors ${star <= (hoverRating || app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">{app.rating ? `${app.rating}/5` : "Unrated"}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-200">
              {(["overview", "notes", "history"] as TabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab === "notes" ? `Notes (${notes.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="p-5 space-y-5">
                {/* Job Applied For */}
                {app.jobTitle && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Position Applied</h3>
                    <div className="p-3 bg-gray-50 rounded-lg flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">{app.jobTitle}</p>
                        {app.jobDepartment && <p className="text-sm text-gray-500">{app.jobDepartment}</p>}
                        {(app.jobLocation || app.jobType) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {[app.jobLocation, app.jobType?.replace(/-/g, " ")].filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>
                      {app.jobId && (
                        <Link href={`/admin/jobs/${app.jobId}`} className="text-blue-600 hover:text-blue-700 flex-shrink-0">
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Details */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Contact Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <a href={`mailto:${app.email}`} className="text-gray-700 hover:text-blue-600">{app.email}</a>
                    </div>
                    {app.phone && (
                      <div className="flex items-center gap-3 text-sm">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${app.phone}`} className="text-gray-700 hover:text-blue-600">{app.phone}</a>
                      </div>
                    )}
                    {app.address && (
                      <div className="flex items-start gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">
                          {[app.address, app.city, app.state, app.zipCode].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Skills */}
                {app.skills && app.skills.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {app.skills.map((skill) => (
                        <span key={skill} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Experience */}
                {app.experience && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Experience</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.experience}</p>
                  </div>
                )}

                {/* Cover Letter */}
                {app.coverLetter && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Cover Letter</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{app.coverLetter}</p>
                  </div>
                )}
              </div>
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && (
              <div className="p-5 space-y-4">
                {/* Add Note */}
                <div className="space-y-2">
                  <textarea
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add a note..."
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={!newNote.trim() || addingNote}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                {notes.length > 0 ? (
                  <div className="space-y-3">
                    {[...notes].reverse().map((note) => (
                      <div key={note.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{note.text}</p>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                          <User className="w-3 h-3" />
                          <span>{note.addedByName}</span>
                          <span>·</span>
                          <span>{fmtTime(note.addedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <StickyNote className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No notes yet</p>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="p-5">
                {app.statusHistory && app.statusHistory.length > 0 ? (
                  <div className="relative space-y-4">
                    {[...app.statusHistory].reverse().map((entry, i) => {
                      const s = statusConfig[entry.status as keyof typeof statusConfig] || statusConfig.pending;
                      return (
                        <div key={i} className="flex items-start gap-3">
                          <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${s.dotColor}`} />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.label}</p>
                            <p className="text-xs text-gray-400">
                              {entry.changedByName || "System"} · {fmtTime(entry.changedAt)}
                            </p>
                            {entry.notes && (
                              <p className="text-xs text-gray-600 mt-1 italic">{entry.notes}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {/* Applied entry */}
                    <div className="flex items-start gap-3">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 bg-gray-300" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Applied</p>
                        <p className="text-xs text-gray-400">{fmtTime(app.appliedAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <History className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">No status changes recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-4">
          {/* Application Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Application Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Applied</span>
                <span className="text-gray-900 font-medium">{fmt(app.appliedAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Time</span>
                <span className="text-gray-500">{timeAgo(app.appliedAt)}</span>
              </div>
              {app.source && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="text-gray-900 font-medium">{app.source}</span>
                </div>
              )}
              {app.workAuthorization && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Work Auth</span>
                  <span className="text-gray-900 font-medium text-right text-xs">{app.workAuthorization}</span>
                </div>
              )}
              {app.ownershipName && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Owner</span>
                  <span className="text-gray-900 font-medium">{app.ownershipName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Resume */}
          {app.resumeId && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Resume</h3>
              <button
                onClick={handleViewResume}
                className="w-full flex items-center gap-2 p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-colors group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                <span className="text-sm text-gray-700 group-hover:text-blue-600 truncate flex-1 text-left">
                  {app.resumeFileName || "View Resume"}
                </span>
                <Download className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
              </button>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <a
                href={`mailto:${app.email}`}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4 text-gray-400" />Email Applicant
              </a>
              {app.phone && (
                <a
                  href={`tel:${app.phone}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Phone className="w-4 h-4 text-gray-400" />Call Applicant
                </a>
              )}
              {app.jobId && (
                <Link
                  href={`/admin/jobs/${app.jobId}`}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Briefcase className="w-4 h-4 text-gray-400" />View Job Posting
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
