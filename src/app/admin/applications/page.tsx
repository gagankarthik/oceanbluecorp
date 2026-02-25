"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  Calendar,
  FileText,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Star,
  Briefcase,
  Loader2,
  LayoutGrid,
  LayoutList,
  StickyNote,
  User,
  X,
  CalendarDays,
  Trash2,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";

interface ApplicationWithJob extends Application {
  jobTitle?: string;
  jobDepartment?: string;
  postedByName?: string;
  postedByEmail?: string;
  postedByRole?: string;
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  reviewing: {
    label: "Under Review",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
    icon: MessageSquare,
  },
  offered: {
    label: "Offer Sent",
    color: "bg-cyan-50 text-cyan-700 border-cyan-200",
    dotColor: "bg-cyan-500",
    icon: Mail,
  },
  hired: {
    label: "Hired",
    color: "bg-green-50 text-green-700 border-green-200",
    dotColor: "bg-green-500",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-50 text-red-700 border-red-200",
    dotColor: "bg-red-500",
    icon: XCircle,
  },
};

type ViewMode = "table" | "cards";
type DateRange = "all" | "today" | "week" | "month" | "custom";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Fetch applications and jobs from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [appsResponse, jobsResponse] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/jobs"),
        ]);

        const appsData = await appsResponse.json();
        const jobsData = await jobsResponse.json();

        if (!appsResponse.ok || !jobsResponse.ok) {
          throw new Error("Failed to fetch data");
        }

        setJobs(jobsData.jobs || []);

        // Merge job info with applications
        const jobsMap = new Map<string, Job>(
          (jobsData.jobs || []).map((job: Job) => [job.id, job])
        );

        const appsWithJobs = (appsData.applications || []).map((app: Application) => {
          const job = jobsMap.get(app.jobId);
          return {
            ...app,
            jobTitle: job?.title || "Unknown Position",
            jobDepartment: job?.department || "",
            postedByName: job?.postedByName,
            postedByEmail: job?.postedByEmail,
            postedByRole: job?.postedByRole,
          };
        });

        setApplications(appsWithJobs);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const positions = [...new Set(applications.map((a) => a.jobTitle).filter(Boolean))];
  const recruiters = [...new Set(applications.map((a) => a.postedByName).filter(Boolean))] as string[];

  // Date filtering logic
  const isWithinDateRange = (dateStr: string) => {
    if (dateRange === "all") return true;

    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dateRange === "today") {
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      return dateOnly.getTime() === today.getTime();
    }

    if (dateRange === "week") {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return date >= weekAgo;
    }

    if (dateRange === "month") {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return date >= monthAgo;
    }

    if (dateRange === "custom") {
      const from = customDateFrom ? new Date(customDateFrom) : null;
      const to = customDateTo ? new Date(customDateTo) : null;
      if (from && to) {
        return date >= from && date <= new Date(to.getTime() + 86400000);
      }
      if (from) return date >= from;
      if (to) return date <= new Date(to.getTime() + 86400000);
    }

    return true;
  };

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPosition = positionFilter === "all" || app.jobTitle === positionFilter;
    const matchesRecruiter = recruiterFilter === "all" || app.postedByName === recruiterFilter;
    const matchesDate = isWithinDateRange(app.appliedAt);
    return matchesSearch && matchesStatus && matchesPosition && matchesRecruiter && matchesDate;
  });

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );
    } catch (err) {
      alert("Failed to update application status");
    }
  };

  const handleRatingChange = async (appId: string, rating: number) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) {
        throw new Error("Failed to update rating");
      }

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, rating } : app))
      );
    } catch (err) {
      alert("Failed to update rating");
    }
  };

  const handleNotesSave = async (appId: string) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: noteText }),
      });

      if (!response.ok) {
        throw new Error("Failed to save notes");
      }

      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, notes: noteText } : app
        )
      );
      setEditingNoteId(null);
      setNoteText("");
    } catch (err) {
      alert("Failed to save notes");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Position", "Department", "Status", "Applied Date", "Rating", "Experience", "Skills", "Cover Letter", "Notes", "Posted By"];
    const rows = filteredApplications.map((app) => [
      `"${app.name}"`,
      `"${app.email}"`,
      `"${app.phone || ""}"`,
      `"${app.jobTitle || ""}"`,
      `"${app.jobDepartment || ""}"`,
      `"${app.status}"`,
      `"${new Date(app.appliedAt).toLocaleDateString()}"`,
      `"${app.rating?.toString() || ""}"`,
      `"${app.experience || ""}"`,
      `"${app.skills?.join(", ") || ""}"`,
      `"${(app.coverLetter || "").replace(/"/g, '""')}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
      `"${app.postedByName || ""}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleViewResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to get resume");
      }

      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      alert("Failed to load resume. The file may have been deleted.");
    }
  };

  const handleDeleteApplication = async (appId: string, appName: string) => {
    if (!confirm(`Are you sure you want to delete the application from ${appName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete application");
      }

      setApplications((prev) => prev.filter((app) => app.id !== appId));
      setExpandedId(null);
    } catch (err) {
      alert("Failed to delete application");
    }
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter(
      (a) => a.status === "reviewing" || a.status === "interview"
    ).length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return formatDate(dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto mb-3 animate-spin" />
          <p className="text-gray-500 text-sm">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-rose-500 text-sm mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Review and manage job applications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "cards"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Card view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white shadow-sm text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
              title="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredApplications.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-xs text-gray-500">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center">
              <Eye className="w-4 h-4 text-violet-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.reviewing}</p>
              <p className="text-xs text-gray-500">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.hired}</p>
              <p className="text-xs text-gray-500">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-3">
          {/* Search and Filter Toggle Row */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg transition-all whitespace-nowrap ${
                showFilters || statusFilter !== "all" || positionFilter !== "all" || recruiterFilter !== "all" || dateRange !== "all"
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
              {(statusFilter !== "all" || positionFilter !== "all" || recruiterFilter !== "all" || dateRange !== "all") && (
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
                  {[statusFilter !== "all", positionFilter !== "all", recruiterFilter !== "all", dateRange !== "all"].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Position</label>
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Positions</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Recruiter</label>
                  <select
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Recruiters</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter} value={recruiter}>
                        {recruiter}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date Range</label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as DateRange)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>

              {/* Custom Date Range */}
              {dateRange === "custom" && (
                <div className="flex flex-wrap items-center gap-2">
                  <label className="text-xs font-medium text-gray-500">From:</label>
                  <input
                    type="date"
                    value={customDateFrom}
                    onChange={(e) => setCustomDateFrom(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <label className="text-xs font-medium text-gray-500">To:</label>
                  <input
                    type="date"
                    value={customDateTo}
                    onChange={(e) => setCustomDateTo(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Active Filters & Clear */}
              {(statusFilter !== "all" || positionFilter !== "all" || recruiterFilter !== "all" || dateRange !== "all") && (
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-xs text-gray-500">Active:</span>
                  {statusFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      {statusFilter}
                      <button onClick={() => setStatusFilter("all")} className="hover:text-gray-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {positionFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs max-w-[150px] truncate">
                      {positionFilter}
                      <button onClick={() => setPositionFilter("all")} className="hover:text-gray-900 flex-shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {recruiterFilter !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      {recruiterFilter}
                      <button onClick={() => setRecruiterFilter("all")} className="hover:text-gray-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  {dateRange !== "all" && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                      {dateRange === "custom" ? `${customDateFrom || "..."} - ${customDateTo || "..."}` : dateRange}
                      <button onClick={() => { setDateRange("all"); setCustomDateFrom(""); setCustomDateTo(""); }} className="hover:text-gray-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setPositionFilter("all");
                      setRecruiterFilter("all");
                      setDateRange("all");
                      setCustomDateFrom("");
                      setCustomDateTo("");
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-auto"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          {filteredApplications.length} of {applications.length} applications
        </p>
      </div>

      {/* Table View - Hidden on mobile, shown on lg+ */}
      {viewMode === "table" && filteredApplications.length > 0 && (
        <div className="hidden lg:block bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Applicant</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Position</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Applied</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Posted By</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApplications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                            {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{app.name}</p>
                            <p className="text-xs text-gray-500">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{app.jobTitle}</p>
                        <p className="text-xs text-gray-500">{app.jobDepartment}</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(app.id, star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-3.5 h-3.5 transition-colors ${
                                  star <= (app.rating || 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-gray-300 hover:text-amber-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-600">{formatTimeAgo(app.appliedAt)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {app.postedByName ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-2.5 h-2.5 text-gray-600" />
                            </div>
                            <span className="text-xs text-gray-700">{app.postedByName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                          className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${status.color}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingNoteId(app.id);
                              setNoteText(app.notes || "");
                            }}
                            className={`p-1.5 rounded-md transition-all ${
                              app.notes ? "text-blue-600 hover:bg-blue-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            }`}
                            title={app.notes ? "View Notes" : "Add Notes"}
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                          {app.resumeId && (
                            <button
                              onClick={() => handleViewResume(app.resumeId)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                              title="View Resume"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={`mailto:${app.email}`}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mobile Table View - Shows cards instead */}
      {viewMode === "table" && filteredApplications.length > 0 && (
        <div className="lg:hidden space-y-3">
          {filteredApplications.map((app) => {
            const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
            return (
              <div key={app.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-xs">
                      {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{app.name}</p>
                      <p className="text-xs text-gray-500">{app.jobTitle}</p>
                    </div>
                  </div>
                  <select
                    value={app.status}
                    onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                    className={`px-2 py-1 rounded-md text-xs font-medium border cursor-pointer ${status.color}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="reviewing">Reviewing</option>
                    <option value="interview">Interview</option>
                    <option value="offered">Offered</option>
                    <option value="hired">Hired</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => handleRatingChange(app.id, star)}>
                        <Star className={`w-3.5 h-3.5 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                      </button>
                    ))}
                    <span className="text-xs text-gray-500 ml-2">{formatTimeAgo(app.appliedAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {app.resumeId && (
                      <button onClick={() => handleViewResume(app.resumeId)} className="p-1.5 text-gray-400 hover:text-blue-600">
                        <FileText className="w-4 h-4" />
                      </button>
                    )}
                    <a href={`mailto:${app.email}`} className="p-1.5 text-gray-400 hover:text-blue-600">
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {filteredApplications.length > 0 ? (
            filteredApplications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
              const isExpanded = expandedId === app.id;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-200 transition-all"
                >
                  {/* Main row */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                            <h3 className="font-medium text-gray-900 truncate">{app.name}</h3>
                            {/* Rating - hidden on mobile */}
                            <div className="hidden sm:flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRatingChange(app.id, star);
                                  }}
                                  className="focus:outline-none"
                                >
                                  <Star
                                    className={`w-3.5 h-3.5 transition-colors ${
                                      star <= (app.rating || 0)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-gray-300 hover:text-amber-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              <span className="truncate max-w-[120px] sm:max-w-none">{app.jobTitle}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatTimeAgo(app.appliedAt)}
                            </span>
                            {app.postedByName && (
                              <span className="hidden md:flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {app.postedByName}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs font-medium ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          {status.label}
                        </span>
                        {/* Mobile status dot only */}
                        <span className={`sm:hidden w-2.5 h-2.5 rounded-full ${status.dotColor}`} />
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Contact & Info */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h4>
                          <div className="space-y-2 text-sm">
                            <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                              <Mail className="w-3.5 h-3.5" />
                              <span className="truncate">{app.email}</span>
                            </a>
                            {app.phone && (
                              <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                <Phone className="w-3.5 h-3.5" />
                                {app.phone}
                              </a>
                            )}
                          </div>
                          {app.skills && app.skills.length > 0 && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1.5">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {app.skills.slice(0, 4).map((skill) => (
                                  <span key={skill} className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                    {skill}
                                  </span>
                                ))}
                                {app.skills.length > 4 && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                                    +{app.skills.length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Documents */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents</h4>
                          {app.resumeId ? (
                            <button
                              onClick={() => handleViewResume(app.resumeId)}
                              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              View Resume
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <p className="text-sm text-gray-400">No resume</p>
                          )}
                          {app.coverLetter && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Cover Letter</p>
                              <p className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 line-clamp-3">
                                {app.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                            <StickyNote className="w-3 h-3" />
                            Notes
                          </h4>
                          {editingNoteId === app.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                                rows={3}
                                placeholder="Add notes..."
                              />
                              <div className="flex items-center gap-2">
                                <button onClick={() => handleNotesSave(app.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">
                                  Save
                                </button>
                                <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs hover:bg-gray-50">
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {app.notes ? (
                                <div
                                  onClick={(e) => { e.stopPropagation(); setEditingNoteId(app.id); setNoteText(app.notes || ""); }}
                                  className="text-xs text-gray-700 bg-amber-50 p-2 rounded border border-amber-200 cursor-pointer hover:bg-amber-100 line-clamp-3"
                                >
                                  {app.notes}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setEditingNoteId(app.id); setNoteText(""); }}
                                  className="text-xs text-gray-500 hover:text-blue-600"
                                >
                                  + Add notes
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</h4>
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewing">Reviewing</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <a
                            href={`mailto:${app.email}`}
                            className="block w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm text-center font-medium"
                          >
                            Send Email
                          </a>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteApplication(app.id, app.name);
                            }}
                            className="w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Application
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">
                {applications.length === 0 ? "No applications yet" : "No applications match your filters"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Notes Modal */}
      {editingNoteId && viewMode === "table" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Application Notes</h2>
              <button
                onClick={() => { setEditingNoteId(null); setNoteText(""); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                rows={5}
                placeholder="Add notes about this applicant..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => { setEditingNoteId(null); setNoteText(""); }}
                className="px-4 py-2 text-sm text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleNotesSave(editingNoteId)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
