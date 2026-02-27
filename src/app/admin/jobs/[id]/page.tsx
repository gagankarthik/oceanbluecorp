"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
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
  ChevronLeft,
  ChevronRight,
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
  MapPin,
  DollarSign,
  Users,
  Edit3,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";

interface ApplicationWithJob extends Application {
  jobTitle?: string;
  jobDepartment?: string;
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

const jobStatusConfig = {
  active: {
    label: "Active",
    color: "bg-green-100 text-green-700",
  },
  paused: {
    label: "Paused",
    color: "bg-yellow-100 text-yellow-700",
  },
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700",
  },
  closed: {
    label: "Closed",
    color: "bg-red-100 text-red-700",
  },
};

type ViewMode = "table" | "cards";
type DateRange = "all" | "today" | "week" | "month" | "custom";

const ITEMS_PER_PAGE = 10;

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customDateFrom, setCustomDateFrom] = useState("");
  const [customDateTo, setCustomDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Notes
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  // Fetch job and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobResponse, appsResponse] = await Promise.all([
          fetch(`/api/jobs/${jobId}`),
          fetch(`/api/applications?jobId=${jobId}`),
        ]);

        const jobData = await jobResponse.json();
        const appsData = await appsResponse.json();

        if (!jobResponse.ok) {
          throw new Error(jobData.error || "Failed to fetch job");
        }

        if (!appsResponse.ok) {
          throw new Error(appsData.error || "Failed to fetch applications");
        }

        setJob(jobData.job);
        setApplications(
          (appsData.applications || []).map((app: Application) => ({
            ...app,
            jobTitle: jobData.job?.title,
            jobDepartment: jobData.job?.department,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId]);

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
      (app.phone?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesDate = isWithinDateRange(app.appliedAt);
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange, customDateFrom, customDateTo]);

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
    const headers = ["Name", "Email", "Phone", "Status", "Applied Date", "Rating", "Experience", "Skills", "Cover Letter", "Notes"];
    const rows = filteredApplications.map((app) => [
      `"${app.name}"`,
      `"${app.email}"`,
      `"${app.phone || ""}"`,
      `"${app.status}"`,
      `"${new Date(app.appliedAt).toLocaleDateString()}"`,
      `"${app.rating?.toString() || ""}"`,
      `"${app.experience || ""}"`,
      `"${app.skills?.join(", ") || ""}"`,
      `"${(app.coverLetter || "").replace(/"/g, '""')}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${job?.title?.replace(/\s+/g, "_") || "job"}_applications_${new Date().toISOString().split("T")[0]}.csv`;
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

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    reviewing: applications.filter(
      (a) => a.status === "reviewing" || a.status === "interview"
    ).length,
    hired: applications.filter((a) => a.status === "hired").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-cyan-600 mx-auto mb-4 animate-spin" />
          <p className="text-slate-500">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Job not found"}</p>
          <button
            onClick={() => router.push("/admin/jobs")}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const jobStatus = jobStatusConfig[job.status as keyof typeof jobStatusConfig] || jobStatusConfig.draft;

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/jobs")}
          className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${jobStatus.color}`}>
              {jobStatus.label}
            </span>
          </div>
          <p className="text-slate-600 mt-1">
            View and manage all applications for this position
          </p>
        </div>
        <button
          onClick={() => router.push(`/admin/jobs?edit=${job.id}`)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          Edit Job
        </button>
      </div>

      {/* Job Info Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Department</p>
              <p className="font-medium text-slate-900">{job.department}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Location</p>
              <p className="font-medium text-slate-900">{job.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Type</p>
              <p className="font-medium text-slate-900 capitalize">{job.type}</p>
            </div>
          </div>
          {job.salary && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Salary Range</p>
                <p className="font-medium text-slate-900">
                  ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}
                </p>
              </div>
            </div>
          )}
          {job.submissionDueDate && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Due Date</p>
                <p className="font-medium text-slate-900">{formatDate(job.submissionDueDate)}</p>
              </div>
            </div>
          )}
          {job.postedByName && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                <User className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Posted By</p>
                <p className="font-medium text-slate-900">{job.postedByName}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Application Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
              <p className="text-sm text-slate-600">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.pending}</p>
              <p className="text-sm text-slate-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.reviewing}</p>
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.hired}</p>
              <p className="text-sm text-slate-600">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Candidates</h2>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
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
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-md transition-all ${
                viewMode === "table"
                  ? "bg-white shadow-sm text-cyan-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
              title="Table view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            disabled={filteredApplications.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-3 flex-wrap">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewing">Reviewing</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl transition-all ${
                  showFilters || dateRange !== "all"
                    ? "bg-cyan-50 border-cyan-300 text-cyan-700"
                    : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Date Filter
                {dateRange !== "all" && (
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                )}
              </button>
            </div>
          </div>

          {/* Date Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Filter by date:</span>
                {[
                  { value: "all", label: "All Time" },
                  { value: "today", label: "Today" },
                  { value: "week", label: "Last 7 Days" },
                  { value: "month", label: "Last 30 Days" },
                  { value: "custom", label: "Custom Range" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDateRange(option.value as DateRange)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      dateRange === option.value
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}

                {dateRange === "custom" && (
                  <div className="flex items-center gap-2 ml-2">
                    <input
                      type="date"
                      value={customDateFrom}
                      onChange={(e) => setCustomDateFrom(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                    <span className="text-slate-400">to</span>
                    <input
                      type="date"
                      value={customDateTo}
                      onChange={(e) => setCustomDateTo(e.target.value)}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm"
                    />
                  </div>
                )}

                {dateRange !== "all" && (
                  <button
                    onClick={() => {
                      setDateRange("all");
                      setCustomDateFrom("");
                      setCustomDateTo("");
                    }}
                    className="text-sm text-slate-500 hover:text-slate-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Showing {paginatedApplications.length} of {filteredApplications.length} candidates
          {filteredApplications.length !== applications.length && (
            <span className="text-slate-400"> (filtered from {applications.length} total)</span>
          )}
        </p>
      </div>

      {/* Table View */}
      {viewMode === "table" && paginatedApplications.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Candidate</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Rating</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Applied</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-900">Notes</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedApplications.map((app) => {
                  const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{app.name}</p>
                            <p className="text-sm text-slate-500">{app.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => handleRatingChange(app.id, star)}
                              className="focus:outline-none"
                            >
                              <Star
                                className={`w-4 h-4 transition-colors ${
                                  star <= (app.rating || 0)
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-slate-300 hover:text-amber-300"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">{formatTimeAgo(app.appliedAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${status.color} cursor-pointer`}
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Reviewing</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => {
                            setEditingNoteId(app.id);
                            setNoteText(app.notes || "");
                          }}
                          className={`flex items-center gap-1.5 text-sm ${
                            app.notes ? "text-cyan-600" : "text-slate-400"
                          } hover:text-cyan-700`}
                        >
                          <StickyNote className="w-4 h-4" />
                          {app.notes ? "View" : "Add"}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {app.resumeId && (
                            <button
                              onClick={() => {
                                if (app.resumeId) handleViewResume(app.resumeId);
                              }}
                              className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
                              title="View Resume"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                          )}
                          <a
                            href={`mailto:${app.email}`}
                            className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
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

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          {paginatedApplications.length > 0 ? (
            paginatedApplications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
              const isExpanded = expandedId === app.id;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-cyan-200 transition-all shadow-sm"
                >
                  {/* Main row */}
                  <div
                    className="p-5 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-cyan-500/20">
                          {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold text-slate-900">{app.name}</h3>
                            {/* Rating */}
                            <div className="flex items-center gap-0.5">
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
                                    className={`w-4 h-4 transition-colors ${
                                      star <= (app.rating || 0)
                                        ? "fill-amber-400 text-amber-400"
                                        : "text-slate-300 hover:text-amber-300"
                                    }`}
                                  />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              {app.email}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatTimeAgo(app.appliedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${status.color}`}>
                          <span className={`w-2 h-2 rounded-full ${status.dotColor}`} />
                          <span className="text-xs font-medium">{status.label}</span>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 p-5 bg-slate-50/50">
                      <div className="grid lg:grid-cols-4 gap-6">
                        {/* Contact & Info */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900">Contact</h4>
                          <div className="space-y-2 text-sm">
                            <a
                              href={`mailto:${app.email}`}
                              className="flex items-center gap-2 text-slate-600 hover:text-cyan-600"
                            >
                              <Mail className="w-4 h-4" />
                              {app.email}
                            </a>
                            {app.phone && (
                              <a
                                href={`tel:${app.phone}`}
                                className="flex items-center gap-2 text-slate-600 hover:text-cyan-600"
                              >
                                <Phone className="w-4 h-4" />
                                {app.phone}
                              </a>
                            )}
                          </div>
                          {app.experience && (
                            <div className="pt-2">
                              <p className="text-sm text-slate-500">Experience</p>
                              <p className="font-medium text-slate-900">{app.experience}</p>
                            </div>
                          )}
                          {app.skills && app.skills.length > 0 && (
                            <div>
                              <p className="text-sm text-slate-500 mb-2">Skills</p>
                              <div className="flex flex-wrap gap-1.5">
                                {app.skills.map((skill) => (
                                  <span
                                    key={skill}
                                    className="px-2 py-0.5 bg-cyan-100 text-cyan-700 rounded-md text-xs font-medium"
                                  >
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Cover Letter & Resume */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900">Documents</h4>
                          {app.resumeId ? (
                            <button
                              onClick={() => {
                                if (app.resumeId) handleViewResume(app.resumeId);
                              }}
                              className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700"
                            >
                              <FileText className="w-4 h-4" />
                              View Resume
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <p className="text-sm text-slate-500">No resume uploaded</p>
                          )}
                          {app.coverLetter && (
                            <div>
                              <p className="text-sm text-slate-500 mb-2">Cover Letter</p>
                              <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 line-clamp-4">
                                {app.coverLetter}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Notes Section */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                            <StickyNote className="w-4 h-4" />
                            Notes
                          </h4>
                          {editingNoteId === app.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none text-sm"
                                rows={4}
                                placeholder="Add notes about this candidate..."
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleNotesSave(app.id)}
                                  className="px-3 py-1.5 bg-cyan-600 text-white rounded-lg text-sm hover:bg-cyan-700"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNoteId(null);
                                    setNoteText("");
                                  }}
                                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {app.notes ? (
                                <div
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNoteId(app.id);
                                    setNoteText(app.notes || "");
                                  }}
                                  className="text-sm text-slate-700 bg-amber-50 p-3 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100 transition-colors"
                                >
                                  {app.notes}
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingNoteId(app.id);
                                    setNoteText("");
                                  }}
                                  className="text-sm text-slate-500 hover:text-cyan-600"
                                >
                                  + Add notes
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-slate-900">Update Status</h4>
                          <select
                            value={app.status}
                            onChange={(e) =>
                              handleStatusChange(app.id, e.target.value as Application["status"])
                            }
                            className="w-full px-4 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none bg-white"
                          >
                            <option value="pending">Pending Review</option>
                            <option value="reviewing">Under Review</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offer Sent</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>

                          <a
                            href={`mailto:${app.email}`}
                            className="block w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-colors text-sm text-center font-medium shadow-lg shadow-cyan-500/20"
                          >
                            Send Email
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {applications.length === 0
                  ? "No applications yet for this position"
                  : "No candidates found matching your criteria"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-4 py-3 shadow-sm">
          <div className="text-sm text-slate-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              First
            </button>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .map((page, idx, arr) => (
                  <div key={page} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== page - 1 && (
                      <span className="px-2 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                        currentPage === page
                          ? "bg-cyan-600 text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Last
            </button>
          </div>
        </div>
      )}

      {/* Notes Modal for Table View */}
      {editingNoteId && viewMode === "table" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Candidate Notes</h2>
              <button
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteText("");
                }}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none resize-none"
                rows={6}
                placeholder="Add notes about this candidate..."
              />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
              <button
                onClick={() => {
                  setEditingNoteId(null);
                  setNoteText("");
                }}
                className="px-4 py-2.5 text-slate-700 font-medium hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleNotesSave(editingNoteId)}
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all shadow-lg shadow-cyan-500/25"
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
