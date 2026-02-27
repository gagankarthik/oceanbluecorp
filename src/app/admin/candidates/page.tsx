"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Filter,
  LayoutGrid,
  LayoutList,
  Kanban,
  Mail,
  Phone,
  Calendar,
  FileText,
  User,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  Loader2,
  ChevronDown,
  ChevronUp,
  StickyNote,
  GripVertical,
  X,
  Send,
  CalendarPlus,
  History,
  Download,
  MoreHorizontal,
  Briefcase,
  MapPin,
  Trash2,
  Plus,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";

interface CandidateWithJob extends Application {
  jobTitle?: string;
  jobDepartment?: string;
  jobLocation?: string;
  postedByName?: string;
  postedByEmail?: string;
}

interface ActivityItem {
  id: string;
  type: "status_change" | "note_added" | "email_sent" | "interview_scheduled" | "application_received";
  message: string;
  timestamp: string;
  user?: string;
}

const pipelineStages = [
  { id: "pending", label: "New", color: "bg-slate-100 border-slate-300", dotColor: "bg-slate-500" },
  { id: "reviewing", label: "Screening", color: "bg-blue-50 border-blue-200", dotColor: "bg-blue-500" },
  { id: "interview", label: "Interview", color: "bg-purple-50 border-purple-200", dotColor: "bg-purple-500" },
  { id: "offered", label: "Offer", color: "bg-amber-50 border-amber-200", dotColor: "bg-amber-500" },
  { id: "hired", label: "Hired", color: "bg-green-50 border-green-200", dotColor: "bg-green-500" },
  { id: "rejected", label: "Rejected", color: "bg-red-50 border-red-200", dotColor: "bg-red-500" },
];

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
  pending: { label: "New", color: "bg-slate-100 text-slate-700 border-slate-300", dotColor: "bg-slate-500" },
  reviewing: { label: "Screening", color: "bg-blue-50 text-blue-700 border-blue-200", dotColor: "bg-blue-500" },
  interview: { label: "Interview", color: "bg-purple-50 text-purple-700 border-purple-200", dotColor: "bg-purple-500" },
  offered: { label: "Offer Sent", color: "bg-amber-50 text-amber-700 border-amber-200", dotColor: "bg-amber-500" },
  hired: { label: "Hired", color: "bg-green-50 text-green-700 border-green-200", dotColor: "bg-green-500" },
  rejected: { label: "Rejected", color: "bg-red-50 text-red-700 border-red-200", dotColor: "bg-red-500" },
};

type ViewMode = "list" | "cards" | "kanban";

export default function CandidatesPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateWithJob | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [draggedCandidate, setDraggedCandidate] = useState<CandidateWithJob | null>(null);
  const [activityLog, setActivityLog] = useState<Record<string, ActivityItem[]>>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsRes, jobsRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/jobs"),
        ]);

        const appsData = await appsRes.json();
        const jobsData = await jobsRes.json();

        setJobs(jobsData.jobs || []);

        const jobsMap = new Map<string, Job>(
          (jobsData.jobs || []).map((job: Job) => [job.id, job])
        );

        const candidatesWithJobs = (appsData.applications || []).map((app: Application) => {
          const job = app.jobId ? jobsMap.get(app.jobId) : undefined;
          return {
            ...app,
            jobTitle: job?.title || "Unknown Position",
            jobDepartment: job?.department || "",
            jobLocation: job?.location || "",
            postedByName: job?.postedByName,
            postedByEmail: job?.postedByEmail,
          };
        });

        setCandidates(candidatesWithJobs);

        // Generate mock activity log
        const activities: Record<string, ActivityItem[]> = {};
        candidatesWithJobs.forEach((c: CandidateWithJob) => {
          activities[c.id] = [
            {
              id: `${c.id}-1`,
              type: "application_received",
              message: `Application received for ${c.jobTitle}`,
              timestamp: c.appliedAt,
            },
          ];
        });
        setActivityLog(activities);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const positions = [...new Set(candidates.map((c) => c.jobTitle).filter(Boolean))];

  const filteredCandidates = candidates.filter((c) => {
    const candidateName = c.name || "";
    const candidateEmail = c.email || "";
    const matchesSearch =
      candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPosition = positionFilter === "all" || c.jobTitle === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const candidatesByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = filteredCandidates.filter((c) => c.status === stage.id);
    return acc;
  }, {} as Record<string, CandidateWithJob[]>);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, status: newStatus as Application["status"] } : c))
      );

      // Add to activity log
      const candidate = candidates.find((c) => c.id === candidateId);
      if (candidate) {
        setActivityLog((prev) => ({
          ...prev,
          [candidateId]: [
            {
              id: `${candidateId}-${Date.now()}`,
              type: "status_change",
              message: `Status changed to ${statusConfig[newStatus]?.label || newStatus}`,
              timestamp: new Date().toISOString(),
              user: "You",
            },
            ...(prev[candidateId] || []),
          ],
        }));
      }
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    if (draggedCandidate && draggedCandidate.status !== targetStatus) {
      handleStatusChange(draggedCandidate.id, targetStatus);
    }
    setDraggedCandidate(null);
  };

  const handleRatingChange = async (candidateId: string, rating: number) => {
    try {
      await fetch(`/api/applications/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, rating } : c))
      );
    } catch (err) {
      console.error("Failed to update rating");
    }
  };

  const handleNotesSave = async (candidateId: string) => {
    try {
      await fetch(`/api/applications/${candidateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });

      setCandidates((prev) =>
        prev.map((c) => (c.id === candidateId ? { ...c, notes: noteText } : c))
      );

      setActivityLog((prev) => ({
        ...prev,
        [candidateId]: [
          {
            id: `${candidateId}-${Date.now()}`,
            type: "note_added",
            message: "Note added",
            timestamp: new Date().toISOString(),
            user: "You",
          },
          ...(prev[candidateId] || []),
        ],
      }));

      setEditingNoteId(null);
      setNoteText("");
    } catch (err) {
      alert("Failed to save notes");
    }
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      const data = await response.json();
      if (data.success && data.downloadUrl) {
        window.open(data.downloadUrl, "_blank");
      }
    } catch (err) {
      alert("Failed to load resume");
    }
  };

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Are you sure you want to delete ${candidateName}'s application? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${candidateId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete candidate");
      }

      setCandidates((prev) => prev.filter((c) => c.id !== candidateId));
      setSelectedCandidate(null);
    } catch (err) {
      alert("Failed to delete candidate");
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Position", "Department", "Status", "Rating", "Applied Date"];
    const rows = filteredCandidates.map((c) => [
      c.name,
      c.email,
      c.phone || "",
      c.jobTitle || "",
      c.jobDepartment || "",
      statusConfig[c.status]?.label || c.status,
      c.rating?.toString() || "",
      new Date(c.appliedAt).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Candidates</h1>
          <p className="text-slate-600 mt-1">
            Manage your recruitment pipeline - {filteredCandidates.length} candidates
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "kanban"
                  ? "bg-white shadow-sm text-cyan-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Kanban view"
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white shadow-sm text-cyan-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "list"
                  ? "bg-white shadow-sm text-cyan-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => router.push("/admin/candidate-applications/new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Application
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none bg-white"
            >
              <option value="all">All Stages</option>
              {pipelineStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none bg-white"
            >
              <option value="all">All Positions</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map((stage) => (
            <div
              key={stage.id}
              className="flex-shrink-0 w-80"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className={`rounded-t-xl px-4 py-3 border ${stage.color}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                    <span className="font-semibold text-slate-800">{stage.label}</span>
                  </div>
                  <span className="text-sm font-medium text-slate-600 bg-white/50 px-2 py-0.5 rounded-full">
                    {candidatesByStage[stage.id]?.length || 0}
                  </span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-b-xl border border-t-0 border-slate-200 p-3 min-h-[500px] space-y-3">
                {candidatesByStage[stage.id]?.map((candidate) => (
                  <div
                    key={candidate.id}
                    draggable
                    onDragStart={() => setDraggedCandidate(candidate)}
                    onDragEnd={() => setDraggedCandidate(null)}
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`bg-white rounded-xl border border-slate-200 p-4 cursor-pointer hover:shadow-md transition-all ${
                      draggedCandidate?.id === candidate.id ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {(candidate.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 truncate">{candidate.name || "Unknown"}</h4>
                        <p className="text-sm text-slate-500 truncate">{candidate.jobTitle}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= (candidate.rating || 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">{formatTimeAgo(candidate.appliedAt)}</span>
                        </div>
                      </div>
                      <GripVertical className="w-4 h-4 text-slate-300" />
                    </div>
                  </div>
                ))}
                {candidatesByStage[stage.id]?.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    No candidates
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              onClick={() => setSelectedCandidate(candidate)}
              className="bg-white rounded-xl border border-slate-200 p-5 cursor-pointer hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                  {(candidate.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900">{candidate.name || "Unknown"}</h4>
                  <p className="text-sm text-slate-500 truncate">{candidate.email}</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase className="w-4 h-4" />
                  <span className="truncate">{candidate.jobTitle}</span>
                </div>
                {candidate.jobLocation && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate">{candidate.jobLocation}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${statusConfig[candidate.status]?.color}`}>
                  {statusConfig[candidate.status]?.label}
                </div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRatingChange(candidate.id, star);
                      }}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          star <= (candidate.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300 hover:text-amber-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Candidate</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Position</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Stage</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Rating</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Applied</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCandidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                        {(candidate.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{candidate.name || "Unknown"}</p>
                        <p className="text-sm text-slate-500">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{candidate.jobTitle}</p>
                    <p className="text-sm text-slate-500">{candidate.jobDepartment}</p>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={candidate.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        handleStatusChange(candidate.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${statusConfig[candidate.status]?.color} cursor-pointer`}
                    >
                      {pipelineStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRatingChange(candidate.id, star);
                          }}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= (candidate.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{formatTimeAgo(candidate.appliedAt)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {candidate.resumeId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (candidate.resumeId) handleViewResume(candidate.resumeId);
                          }}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <a
                        href={`mailto:${candidate.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg"
                      >
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Detail Modal */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {(selectedCandidate.name || "NA").split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">{selectedCandidate.name || "Unknown"}</h2>
                  <p className="text-slate-500">{selectedCandidate.jobTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCandidate(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Contact & Info */}
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-cyan-600">
                        <Mail className="w-4 h-4" />
                        {selectedCandidate.email}
                      </a>
                      {selectedCandidate.phone && (
                        <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-cyan-600">
                          <Phone className="w-4 h-4" />
                          {selectedCandidate.phone}
                        </a>
                      )}
                      <div className="flex items-center gap-3 text-sm text-slate-600">
                        <Calendar className="w-4 h-4" />
                        Applied {new Date(selectedCandidate.appliedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Documents</h3>
                    {selectedCandidate.resumeId ? (
                      <button
                        onClick={() => {
                          if (selectedCandidate.resumeId) handleViewResume(selectedCandidate.resumeId);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 transition-colors w-full"
                      >
                        <FileText className="w-4 h-4" />
                        View Resume
                      </button>
                    ) : (
                      <p className="text-sm text-slate-400">No resume uploaded</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Rating</h3>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => handleRatingChange(selectedCandidate.id, star)}
                          className="p-1"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              star <= (selectedCandidate.rating || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-slate-300 hover:text-amber-300"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Pipeline Stage</h3>
                    <select
                      value={selectedCandidate.status}
                      onChange={(e) => {
                        handleStatusChange(selectedCandidate.id, e.target.value);
                        setSelectedCandidate({ ...selectedCandidate, status: e.target.value as Application["status"] });
                      }}
                      className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none"
                    >
                      {pipelineStages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Cover Letter & Notes */}
                <div className="space-y-6">
                  {selectedCandidate.coverLetter && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-4">Cover Letter</h3>
                      <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                        {selectedCandidate.coverLetter}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <StickyNote className="w-4 h-4" />
                      Internal Notes
                    </h3>
                    {editingNoteId === selectedCandidate.id ? (
                      <div className="space-y-3">
                        <textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none"
                          rows={4}
                          placeholder="Add notes about this candidate..."
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleNotesSave(selectedCandidate.id)}
                            className="px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteText("");
                            }}
                            className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {selectedCandidate.notes ? (
                          <div
                            onClick={() => {
                              setEditingNoteId(selectedCandidate.id);
                              setNoteText(selectedCandidate.notes || "");
                            }}
                            className="bg-amber-50 p-4 rounded-xl text-sm text-slate-700 cursor-pointer hover:bg-amber-100 transition-colors"
                          >
                            {selectedCandidate.notes}
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingNoteId(selectedCandidate.id);
                              setNoteText("");
                            }}
                            className="text-sm text-cyan-600 hover:text-cyan-700"
                          >
                            + Add notes
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <a
                        href={`mailto:${selectedCandidate.email}`}
                        className="flex items-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full"
                      >
                        <Send className="w-4 h-4 text-cyan-600" />
                        <span className="text-sm font-medium">Send Email</span>
                      </a>
                      <button className="flex items-center gap-3 px-4 py-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors w-full">
                        <CalendarPlus className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Schedule Interview</span>
                      </button>
                      <button
                        onClick={() => handleDeleteCandidate(selectedCandidate.id, selectedCandidate.name || "this candidate")}
                        className="flex items-center gap-3 px-4 py-2.5 border border-red-200 rounded-xl hover:bg-red-50 transition-colors w-full text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Delete Candidate</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Activity Timeline */}
                <div>
                  <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Activity Timeline
                  </h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {(activityLog[selectedCandidate.id] || []).map((activity) => (
                      <div key={activity.id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                          {activity.type === "status_change" && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                          {activity.type === "note_added" && <StickyNote className="w-4 h-4 text-amber-500" />}
                          {activity.type === "email_sent" && <Mail className="w-4 h-4 text-green-500" />}
                          {activity.type === "interview_scheduled" && <Calendar className="w-4 h-4 text-purple-500" />}
                          {activity.type === "application_received" && <FileText className="w-4 h-4 text-cyan-500" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-slate-700">{activity.message}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {formatTimeAgo(activity.timestamp)}
                            {activity.user && ` by ${activity.user}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredCandidates.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <User className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">
            {candidates.length === 0 ? "No candidates yet" : "No candidates match your filters"}
          </p>
        </div>
      )}
    </div>
  );
}
