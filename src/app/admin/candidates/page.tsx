"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutGrid,
  LayoutList,
  Kanban,
  Mail,
  Phone,
  Calendar,
  FileText,
  Star,
  Eye,
  MessageSquare,
  Loader2,
  StickyNote,
  GripVertical,
  X,
  Download,
  MoreHorizontal,
  Briefcase,
  MapPin,
  Trash2,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";

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
  { id: "pending", label: "New", headerBg: "bg-gray-50 border-gray-200", dotColor: "bg-gray-400", colBg: "bg-gray-50/50" },
  { id: "reviewing", label: "Screening", headerBg: "bg-blue-50 border-blue-200", dotColor: "bg-blue-500", colBg: "bg-blue-50/30" },
  { id: "interview", label: "Interview", headerBg: "bg-purple-50 border-purple-200", dotColor: "bg-purple-500", colBg: "bg-purple-50/30" },
  { id: "offered", label: "Offered", headerBg: "bg-amber-50 border-amber-200", dotColor: "bg-amber-500", colBg: "bg-amber-50/30" },
  { id: "hired", label: "Hired", headerBg: "bg-emerald-50 border-emerald-200", dotColor: "bg-emerald-500", colBg: "bg-emerald-50/30" },
  { id: "rejected", label: "Rejected", headerBg: "bg-rose-50 border-rose-200", dotColor: "bg-rose-500", colBg: "bg-rose-50/30" },
];

const statusConfig: Record<string, { label: string; bg: string; dot: string }> = {
  pending: { label: "New", bg: "bg-gray-100 text-gray-700", dot: "bg-gray-400" },
  reviewing: { label: "Screening", bg: "bg-blue-100 text-blue-800", dot: "bg-blue-500" },
  interview: { label: "Interview", bg: "bg-purple-100 text-purple-800", dot: "bg-purple-500" },
  offered: { label: "Offered", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  hired: { label: "Hired", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  rejected: { label: "Rejected", bg: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
};

type ViewMode = "list" | "cards" | "kanban";

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function CandidateAvatar({ name }: { name: string }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
      {initials}
    </div>
  );
}

const US_STATES = ["Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

export default function CandidatesPage() {
  const router = useRouter();
  const { user } = useAuth();
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
  const [detailTab, setDetailTab] = useState<"overview" | "skills" | "notes" | "history">("overview");
  const [showNewCandidateModal, setShowNewCandidateModal] = useState(false);
  const [creatingCandidate, setCreatingCandidate] = useState(false);
  const [newCandidateForm, setNewCandidateForm] = useState({
    firstName: "", lastName: "", email: "", phone: "", address: "", city: "",
    state: "", zipCode: "", skills: "", experience: "",
    workAuthorization: "" as "" | "US Citizen" | "Green Card" | "H1-B" | "OPT/CPT" | "TN Visa" | "Other",
    source: "Other" as "LinkedIn" | "Indeed" | "Company Website" | "Referral" | "Agency" | "Career Portal" | "Other",
    notes: "", jobId: "", addToTalentBench: true,
    status: "pending" as Application["status"],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsRes, jobsRes] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
        const appsData = await appsRes.json();
        const jobsData = await jobsRes.json();
        const fetchedJobs = jobsData.jobs || [];
        setJobs(fetchedJobs);
        const jobsMap = new Map<string, Job>((jobsData.jobs || []).map((job: Job) => [job.id, job]));
        const candidatesWithJobs = (appsData.applications || []).map((app: Application) => {
          const job = app.jobId ? jobsMap.get(app.jobId) : undefined;
          return { ...app, jobTitle: job?.title || "Unknown Position", jobDepartment: job?.department || "", jobLocation: job?.location || "", postedByName: job?.postedByName, postedByEmail: job?.postedByEmail };
        });
        setCandidates(candidatesWithJobs);
        const activities: Record<string, ActivityItem[]> = {};
        candidatesWithJobs.forEach((c: CandidateWithJob) => {
          activities[c.id] = [{ id: `${c.id}-1`, type: "application_received", message: `Application received for ${c.jobTitle}`, timestamp: c.appliedAt }];
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

  const positions = [...new Set(candidates.map(c => c.jobTitle).filter(Boolean))];

  const filteredCandidates = candidates.filter(c => {
    const name = c.name || "";
    const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    const matchesPosition = positionFilter === "all" || c.jobTitle === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
  });

  const candidatesByStage = pipelineStages.reduce((acc, stage) => {
    acc[stage.id] = filteredCandidates.filter(c => c.status === stage.id);
    return acc;
  }, {} as Record<string, CandidateWithJob[]>);

  const handleStatusChange = async (candidateId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${candidateId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, status: newStatus as Application["status"] } : c));
      setActivityLog(prev => ({
        ...prev,
        [candidateId]: [{ id: `${candidateId}-${Date.now()}`, type: "status_change", message: `Status changed to ${statusConfig[newStatus]?.label || newStatus}`, timestamp: new Date().toISOString(), user: "You" }, ...(prev[candidateId] || [])],
      }));
    } catch {
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
      await fetch(`/api/applications/${candidateId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }) });
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, rating } : c));
    } catch {
      console.error("Failed to update rating");
    }
  };

  const handleNotesSave = async (candidateId: string) => {
    try {
      await fetch(`/api/applications/${candidateId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ notes: noteText }) });
      setCandidates(prev => prev.map(c => c.id === candidateId ? { ...c, notes: noteText } : c));
      setActivityLog(prev => ({
        ...prev,
        [candidateId]: [{ id: `${candidateId}-${Date.now()}`, type: "note_added", message: "Note added", timestamp: new Date().toISOString(), user: "You" }, ...(prev[candidateId] || [])],
      }));
      setEditingNoteId(null);
      setNoteText("");
    } catch {
      alert("Failed to save notes");
    }
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      const data = await response.json();
      if (data.success && data.downloadUrl) window.open(data.downloadUrl, "_blank");
    } catch {
      alert("Failed to load resume");
    }
  };

  const handleDeleteCandidate = async (candidateId: string, candidateName: string) => {
    if (!confirm(`Delete ${candidateName}'s application? This cannot be undone.`)) return;
    try {
      const response = await fetch(`/api/applications/${candidateId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setCandidates(prev => prev.filter(c => c.id !== candidateId));
      setSelectedCandidate(null);
    } catch {
      alert("Failed to delete candidate");
    }
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingCandidate(true);
    try {
      const selectedJob = jobs.find(j => j.id === newCandidateForm.jobId);
      const payload = {
        firstName: newCandidateForm.firstName,
        lastName: newCandidateForm.lastName,
        name: `${newCandidateForm.firstName} ${newCandidateForm.lastName}`.trim(),
        email: newCandidateForm.email,
        phone: newCandidateForm.phone || undefined,
        address: newCandidateForm.address || undefined,
        city: newCandidateForm.city || undefined,
        state: newCandidateForm.state || undefined,
        zipCode: newCandidateForm.zipCode || undefined,
        skills: newCandidateForm.skills ? newCandidateForm.skills.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        experience: newCandidateForm.experience || undefined,
        workAuthorization: newCandidateForm.workAuthorization || undefined,
        source: newCandidateForm.source,
        notes: newCandidateForm.notes || undefined,
        jobId: newCandidateForm.jobId || undefined,
        jobTitle: selectedJob?.title || undefined,
        status: newCandidateForm.status,
        addToTalentBench: newCandidateForm.addToTalentBench,
        createdBy: user?.id,
        createdByName: user?.name || user?.email,
        userId: "manual-entry",
      };
      const response = await fetch("/api/applications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create candidate");
      }
      const data = await response.json();
      const job = newCandidateForm.jobId ? jobs.find(j => j.id === newCandidateForm.jobId) : undefined;
      const newCandidate: CandidateWithJob = { ...data.application, jobTitle: job?.title || "No Position", jobDepartment: job?.department || "", jobLocation: job?.location || "" };
      setCandidates(prev => [newCandidate, ...prev]);
      setNewCandidateForm({ firstName: "", lastName: "", email: "", phone: "", address: "", city: "", state: "", zipCode: "", skills: "", experience: "", workAuthorization: "", source: "Other", notes: "", jobId: "", addToTalentBench: true, status: "pending" });
      setShowNewCandidateModal(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create candidate");
    } finally {
      setCreatingCandidate(false);
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  const handleExportCSV = () => {
    const headers = ["Name","Email","Phone","Position","Department","Status","Rating","Applied Date"];
    const rows = filteredCandidates.map(c => [c.name, c.email, c.phone || "", c.jobTitle || "", c.jobDepartment || "", statusConfig[c.status]?.label || c.status, c.rating?.toString() || "", new Date(c.appliedAt).toLocaleDateString()]);
    const csvContent = [headers.join(","), ...rows.map(r => r.map(cell => `"${cell}"`).join(","))].join("\n");
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
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading candidates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{filteredCandidates.length}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage your recruitment pipeline</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            {([["kanban", Kanban], ["cards", LayoutGrid], ["list", LayoutList]] as [ViewMode, React.ElementType][]).map(([mode, Icon]) => (
              <button key={mode} onClick={() => setViewMode(mode)} title={`${mode} view`}
                className={`p-2 transition-colors ${viewMode === mode ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"} ${mode !== "kanban" ? "border-l border-gray-200" : ""}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          <button onClick={handleExportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => setShowNewCandidateModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">New Candidate</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search by name, email, or position..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700">
            <option value="all">All Stages</option>
            {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select value={positionFilter} onChange={e => setPositionFilter(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white text-gray-700">
            <option value="all">All Positions</option>
            {positions.map(p => <option key={p} value={p!}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {pipelineStages.map(stage => (
            <div key={stage.id} className="flex-shrink-0 w-72" onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, stage.id)}>
              {/* Column Header */}
              <div className={`rounded-t-xl px-4 py-3 border ${stage.headerBg} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${stage.dotColor}`} />
                  <span className="text-sm font-semibold text-gray-800">{stage.label}</span>
                </div>
                <span className="text-xs font-bold text-gray-500 bg-white/70 px-2 py-0.5 rounded-full">{candidatesByStage[stage.id]?.length || 0}</span>
              </div>
              {/* Column Body */}
              <div className={`${stage.colBg} rounded-b-xl border border-t-0 border-gray-200 p-3 min-h-[480px] space-y-2.5`}>
                {candidatesByStage[stage.id]?.map(candidate => (
                  <div key={candidate.id} draggable onDragStart={() => setDraggedCandidate(candidate)} onDragEnd={() => setDraggedCandidate(null)} onClick={() => setSelectedCandidate(candidate)}
                    className={`bg-white rounded-xl border border-gray-200 p-3.5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all ${draggedCandidate?.id === candidate.id ? "opacity-50 rotate-1" : ""}`}>
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {(candidate.name || "NA").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{candidate.name || "Unknown"}</h4>
                        <p className="text-xs text-gray-500 truncate">{candidate.jobTitle}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-0.5">
                            {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= (candidate.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />)}
                          </div>
                          <span className="text-[10px] text-gray-400">{formatTimeAgo(candidate.appliedAt)}</span>
                        </div>
                      </div>
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                    </div>
                  </div>
                ))}
                {candidatesByStage[stage.id]?.length === 0 && (
                  <div className="flex items-center justify-center h-32 text-xs text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">Drop candidates here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
            <div key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className="border border-gray-200 rounded-xl bg-white shadow-sm p-5 cursor-pointer hover:shadow-md hover:border-gray-300 transition-all">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                  {(candidate.name || "NA").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900 truncate">{candidate.name || "Unknown"}</h4>
                  <p className="text-xs text-gray-400 truncate">{candidate.email}</p>
                </div>
                <StatusBadge status={candidate.status} />
              </div>
              <div className="space-y-1.5 mb-4">
                {candidate.jobTitle && <div className="flex items-center gap-2 text-xs text-gray-600"><Briefcase className="w-3.5 h-3.5 text-gray-400" />{candidate.jobTitle}</div>}
                {candidate.jobLocation && <div className="flex items-center gap-2 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5 text-gray-400" />{candidate.jobLocation}</div>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} onClick={e => { e.stopPropagation(); handleRatingChange(candidate.id, s); }}>
                      <Star className={`w-4 h-4 ${s <= (candidate.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                    </button>
                  ))}
                </div>
                <span className="text-xs text-gray-400">{formatTimeAgo(candidate.appliedAt)}</span>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-16 text-center border border-gray-200 rounded-xl bg-white">
              <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No candidates found</h3>
              <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Position</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Stage</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Rating</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Applied</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCandidates.length > 0 ? filteredCandidates.map(candidate => (
                <tr key={candidate.id} onClick={() => setSelectedCandidate(candidate)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {(candidate.name || "NA").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{candidate.name || "Unknown"}</p>
                        <p className="text-xs text-gray-400">{candidate.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <p className="text-sm text-gray-900">{candidate.jobTitle}</p>
                    {candidate.jobDepartment && <p className="text-xs text-gray-400">{candidate.jobDepartment}</p>}
                  </td>
                  <td className="px-4 py-3.5">
                    <select value={candidate.status} onChange={e => { e.stopPropagation(); handleStatusChange(candidate.id, e.target.value); }} onClick={e => e.stopPropagation()}
                      className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-gray-700">
                      {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={e => { e.stopPropagation(); handleRatingChange(candidate.id, s); }}>
                          <Star className={`w-3.5 h-3.5 ${s <= (candidate.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell text-xs text-gray-500">{formatTimeAgo(candidate.appliedAt)}</td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {candidate.resumeId && (
                        <button onClick={e => { e.stopPropagation(); if (candidate.resumeId) handleViewResume(candidate.resumeId); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FileText className="w-4 h-4" />
                        </button>
                      )}
                      <a href={`mailto:${candidate.email}`} onClick={e => e.stopPropagation()} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Mail className="w-4 h-4" />
                      </a>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={6} className="py-16 text-center">
                  <Briefcase className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No candidates found</h3>
                  <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Detail Panel */}
      {selectedCandidate && (() => {
        const progressStages = pipelineStages.filter(s => s.id !== "rejected");
        const currentStageIdx = progressStages.findIndex(s => s.id === selectedCandidate.status);
        const isRejected = selectedCandidate.status === "rejected";
        const initials = (selectedCandidate.name || "NA").split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedCandidate(null)}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>

              {/* Gradient Header */}
              <div className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 px-8 py-6 text-white flex-shrink-0">
                <button onClick={() => setSelectedCandidate(null)} className="absolute top-4 right-4 p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-xl font-bold">{selectedCandidate.name || "Unknown"}</h2>
                      {isRejected ? (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/30 text-rose-100 border border-rose-400/30">Rejected</span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/20 text-white border border-white/30">{statusConfig[selectedCandidate.status]?.label || selectedCandidate.status}</span>
                      )}
                    </div>
                    <p className="text-blue-100 text-sm mt-0.5">{selectedCandidate.jobTitle || "General Application"}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-blue-200 flex-wrap">
                      <span>ID: {selectedCandidate.id.slice(-8).toUpperCase()}</span>
                      {selectedCandidate.jobDepartment && <span>· {selectedCandidate.jobDepartment}</span>}
                      <span>· Applied {new Date(selectedCandidate.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>

                {/* Pipeline Stepper */}
                <div className="mt-5">
                  <div className="flex items-center gap-0">
                    {progressStages.map((stage, idx) => {
                      const isActive = selectedCandidate.status === stage.id;
                      const isPast = !isRejected && currentStageIdx > idx;
                      const isFuture = isRejected || currentStageIdx < idx;
                      return (
                        <div key={stage.id} className="flex items-center flex-1 min-w-0">
                          <button
                            onClick={() => { handleStatusChange(selectedCandidate.id, stage.id); setSelectedCandidate({ ...selectedCandidate, status: stage.id as Application["status"] }); }}
                            className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg transition-all ${isActive ? "bg-white/20" : "hover:bg-white/10"}`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${isActive ? "bg-white text-blue-700 border-white" : isPast ? "bg-white/80 text-blue-700 border-white/80" : "bg-transparent border-white/40 text-white/50"}`}>
                              {isPast ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                            </div>
                            <span className={`text-[10px] font-medium whitespace-nowrap ${isActive ? "text-white" : isPast ? "text-blue-100" : "text-white/50"}`}>{stage.label}</span>
                          </button>
                          {idx < progressStages.length - 1 && (
                            <div className={`h-0.5 w-4 flex-shrink-0 mx-0.5 ${isPast || isActive ? "bg-white/60" : "bg-white/20"}`} />
                          )}
                        </div>
                      );
                    })}
                    {/* Rejected off-track indicator */}
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      <div className={`h-0.5 w-3 ${isRejected ? "bg-rose-300" : "bg-white/20"}`} />
                      <button
                        onClick={() => { handleStatusChange(selectedCandidate.id, "rejected"); setSelectedCandidate({ ...selectedCandidate, status: "rejected" as Application["status"] }); }}
                        className={`flex flex-col items-center gap-1 py-2 px-2 rounded-lg transition-all ${isRejected ? "bg-rose-500/30" : "hover:bg-white/10"}`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isRejected ? "bg-rose-400 border-rose-300 text-white" : "border-white/30 text-white/40"}`}>
                          <XCircle className="w-4 h-4" />
                        </div>
                        <span className={`text-[10px] font-medium ${isRejected ? "text-rose-200" : "text-white/40"}`}>Rejected</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden flex">
                {/* Left Sidebar */}
                <div className="w-64 flex-shrink-0 border-r border-gray-100 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
                  {/* Contact Info */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</h3>
                    <div className="space-y-2.5">
                      <a href={`mailto:${selectedCandidate.email}`} className="flex items-start gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                        <Mail className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="break-all leading-tight">{selectedCandidate.email}</span>
                      </a>
                      {selectedCandidate.phone && (
                        <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 transition-colors group">
                          <Phone className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                          {selectedCandidate.phone}
                        </a>
                      )}
                      {selectedCandidate.address && (
                        <div className="flex items-start gap-2.5 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{[selectedCandidate.address, selectedCandidate.city, selectedCandidate.state].filter(Boolean).join(", ")}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Job Info */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Position</h3>
                    <div className="space-y-2">
                      {selectedCandidate.jobTitle && <div className="flex items-center gap-2 text-sm text-gray-700"><Briefcase className="w-4 h-4 text-gray-400 flex-shrink-0" />{selectedCandidate.jobTitle}</div>}
                      {selectedCandidate.jobDepartment && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /></span>{selectedCandidate.jobDepartment}</div>}
                      {selectedCandidate.source && <div className="flex items-center gap-2 text-sm text-gray-600"><span className="w-4 h-4 flex-shrink-0 inline-flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /></span>via {selectedCandidate.source}</div>}
                      {selectedCandidate.workAuthorization && <div className="flex items-center gap-2 text-sm text-gray-600"><CheckCircle2 className="w-4 h-4 text-gray-400 flex-shrink-0" />{selectedCandidate.workAuthorization}</div>}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Rating</h3>
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <button key={s} onClick={() => { handleRatingChange(selectedCandidate.id, s); setSelectedCandidate({ ...selectedCandidate, rating: s }); }} className="p-0.5 transition-transform hover:scale-110">
                          <Star className={`w-5 h-5 transition-colors ${s <= (selectedCandidate.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Resume */}
                  <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Resume</h3>
                    {selectedCandidate.resumeId ? (
                      <button onClick={() => { if (selectedCandidate.resumeId) handleViewResume(selectedCandidate.resumeId); }} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors border border-blue-100">
                        <FileText className="w-4 h-4" /> View Resume
                      </button>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No resume uploaded</p>
                    )}
                  </div>

                  {/* Delete */}
                  <div className="pt-3 border-t border-gray-200">
                    <button onClick={() => handleDeleteCandidate(selectedCandidate.id, selectedCandidate.name || "candidate")} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-lg text-sm transition-colors border border-transparent hover:border-rose-100">
                      <Trash2 className="w-4 h-4" /> Delete Application
                    </button>
                  </div>
                </div>

                {/* Right Panel with Tabs */}
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Tab Bar */}
                  <div className="flex items-center gap-1 px-6 pt-4 pb-0 border-b border-gray-100 bg-white flex-shrink-0">
                    {(["overview", "skills", "notes", "history"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setDetailTab(tab)}
                        className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors capitalize ${detailTab === tab ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-y-auto p-6">
                    {/* Overview Tab */}
                    {detailTab === "overview" && (
                      <div className="space-y-5">
                        {selectedCandidate.experience && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Experience</h3>
                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">{selectedCandidate.experience}</div>
                          </div>
                        )}
                        {selectedCandidate.coverLetter && (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cover Letter</h3>
                            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed border border-gray-100 whitespace-pre-wrap">{selectedCandidate.coverLetter}</div>
                          </div>
                        )}
                        {!selectedCandidate.experience && !selectedCandidate.coverLetter && (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageSquare className="w-10 h-10 text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">No overview information available</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Skills Tab */}
                    {detailTab === "skills" && (
                      <div>
                        {selectedCandidate.skills && selectedCandidate.skills.length > 0 ? (
                          <div>
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Skills & Expertise</h3>
                            <div className="flex flex-wrap gap-2">
                              {selectedCandidate.skills.map((s: string) => (
                                <span key={s} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-100 hover:bg-blue-100 transition-colors">{s}</span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Star className="w-10 h-10 text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">No skills listed</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes Tab */}
                    {detailTab === "notes" && (
                      <div className="space-y-4">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Internal Notes</h3>
                        {editingNoteId === selectedCandidate.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={noteText}
                              onChange={e => setNoteText(e.target.value)}
                              className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none min-h-[160px]"
                              placeholder="Add internal notes about this candidate..."
                            />
                            <div className="flex gap-2">
                              <button onClick={() => handleNotesSave(selectedCandidate.id)} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">Save Note</button>
                              <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {selectedCandidate.notes ? (
                              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{selectedCandidate.notes}</div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-gray-200 rounded-xl mb-3">
                                <StickyNote className="w-8 h-8 text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400">No notes yet</p>
                              </div>
                            )}
                            <button
                              onClick={() => { setEditingNoteId(selectedCandidate.id); setNoteText(selectedCandidate.notes || ""); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg font-medium transition-colors"
                            >
                              <StickyNote className="w-4 h-4" />{selectedCandidate.notes ? "Edit Note" : "Add Note"}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* History Tab */}
                    {detailTab === "history" && (
                      <div>
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Status History</h3>
                        {selectedCandidate.statusHistory && selectedCandidate.statusHistory.length > 0 ? (
                          <div className="space-y-0">
                            {[...selectedCandidate.statusHistory].reverse().map((entry: { status: string; changedAt: string; changedByName?: string; changedByEmail?: string; note?: string }, idx: number) => {
                              const cfg = statusConfig[entry.status] || statusConfig.pending;
                              const isLast = idx === selectedCandidate.statusHistory!.length - 1;
                              return (
                                <div key={idx} className="flex gap-4">
                                  <div className="flex flex-col items-center">
                                    <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 border-2 border-white shadow ${cfg.dot}`} />
                                    {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" />}
                                  </div>
                                  <div className={`pb-5 ${isLast ? "" : ""}`}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
                                        <span className={`w-1 h-1 rounded-full ${cfg.dot}`} />{cfg.label}
                                      </span>
                                      <span className="text-xs text-gray-500">{new Date(entry.changedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {entry.changedByName || entry.changedByEmail || "System"}
                                    </p>
                                    {entry.note && <p className="text-xs text-gray-600 mt-1 italic">&ldquo;{entry.note}&rdquo;</p>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-16 text-center">
                            <Clock className="w-10 h-10 text-gray-200 mb-3" />
                            <p className="text-sm text-gray-400">No status history yet</p>
                          </div>
                        )}

                        {/* Activity log */}
                        {(activityLog[selectedCandidate.id] || []).length > 0 && (
                          <div className="mt-6 pt-5 border-t border-gray-100">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Activity</h3>
                            <div className="space-y-3">
                              {(activityLog[selectedCandidate.id] || []).map(activity => (
                                <div key={activity.id} className="flex items-start gap-3">
                                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-sm text-gray-700">{activity.message}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{formatTimeAgo(activity.timestamp)}{activity.user ? ` · ${activity.user}` : ""}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* New Candidate Modal */}
      {showNewCandidateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewCandidateModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-bold text-gray-900">New Candidate</h2>
              <button onClick={() => setShowNewCandidateModal(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreateCandidate} className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">First Name <span className="text-rose-500">*</span></label>
                    <input required value={newCandidateForm.firstName} onChange={e => setNewCandidateForm({ ...newCandidateForm, firstName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Last Name <span className="text-rose-500">*</span></label>
                    <input required value={newCandidateForm.lastName} onChange={e => setNewCandidateForm({ ...newCandidateForm, lastName: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="Last name" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Email <span className="text-rose-500">*</span></label>
                    <input required type="email" value={newCandidateForm.email} onChange={e => setNewCandidateForm({ ...newCandidateForm, email: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="email@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" value={newCandidateForm.phone} onChange={e => setNewCandidateForm({ ...newCandidateForm, phone: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Job Position</label>
                    <select value={newCandidateForm.jobId} onChange={e => setNewCandidateForm({ ...newCandidateForm, jobId: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">No specific position</option>
                      {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Source</label>
                    <select value={newCandidateForm.source} onChange={e => setNewCandidateForm({ ...newCandidateForm, source: e.target.value as typeof newCandidateForm.source })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      {["LinkedIn","Indeed","Company Website","Referral","Agency","Career Portal","Other"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Work Authorization</label>
                    <select value={newCandidateForm.workAuthorization} onChange={e => setNewCandidateForm({ ...newCandidateForm, workAuthorization: e.target.value as typeof newCandidateForm.workAuthorization })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      <option value="">Select authorization</option>
                      {["US Citizen","Green Card","H1-B","OPT/CPT","TN Visa","Other"].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Initial Status</label>
                    <select value={newCandidateForm.status} onChange={e => setNewCandidateForm({ ...newCandidateForm, status: e.target.value as Application["status"] })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white">
                      {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Skills (comma separated)</label>
                  <input value={newCandidateForm.skills} onChange={e => setNewCandidateForm({ ...newCandidateForm, skills: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="React, Node.js, Python..." />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <textarea value={newCandidateForm.notes} onChange={e => setNewCandidateForm({ ...newCandidateForm, notes: e.target.value })} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none min-h-[80px]" placeholder="Internal notes..." />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="talentBench" checked={newCandidateForm.addToTalentBench} onChange={e => setNewCandidateForm({ ...newCandidateForm, addToTalentBench: e.target.checked })} className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <label htmlFor="talentBench" className="text-sm text-gray-600 cursor-pointer">Add to talent bench for future opportunities</label>
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setShowNewCandidateModal(false)} className="px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={creatingCandidate} className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {creatingCandidate && <Loader2 className="w-4 h-4 animate-spin" />}Create Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
