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
  MapPin,
  DollarSign,
  Users,
  Edit3,
  Building2,
  Hash,
  Globe,
  TrendingUp,
  Share2,
  Copy,
  Check,
  UserCheck,
  UsersRound,
  Receipt,
  Wallet,
  Bell,
  FileCheck,
  Target,
  AlertCircle,
  CalendarClock,
  Handshake,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";

interface ApplicationWithJob extends Application {
  jobTitle?: string;
  jobDepartment?: string;
}

const statusConfig = {
  pending: {
    label: "New",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dotColor: "bg-gray-400",
  },
  reviewing: {
    label: "Screening",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    dotColor: "bg-blue-500",
  },
  interview: {
    label: "Interview",
    color: "bg-purple-100 text-purple-700 border-purple-200",
    dotColor: "bg-purple-500",
  },
  offered: {
    label: "Offered",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    dotColor: "bg-amber-500",
  },
  hired: {
    label: "Hired",
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    color: "bg-rose-100 text-rose-700 border-rose-200",
    dotColor: "bg-rose-500",
  },
};

const jobStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "text-emerald-700", bg: "bg-emerald-100" },
  open: { label: "Open", color: "text-emerald-700", bg: "bg-emerald-100" },
  paused: { label: "Paused", color: "text-amber-700", bg: "bg-amber-100" },
  "on-hold": { label: "On Hold", color: "text-amber-700", bg: "bg-amber-100" },
  draft: { label: "Draft", color: "text-gray-700", bg: "bg-gray-100" },
  closed: { label: "Closed", color: "text-rose-700", bg: "bg-rose-100" },
};

type ViewMode = "table" | "cards";
type DateRange = "all" | "today" | "week" | "month";

const ITEMS_PER_PAGE = 10;

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { user } = useAuth();

  // RECRUITER role has view-only access to jobs
  const canEditJobs = user?.role !== UserRole.RECRUITER;

  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmails, setShareEmails] = useState("");
  const [shareMessage, setShareMessage] = useState("");
  const [copied, setCopied] = useState(false);

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

        if (!jobResponse.ok) throw new Error(jobData.error || "Failed to fetch job");
        if (!appsResponse.ok) throw new Error(appsData.error || "Failed to fetch applications");

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

  const totalPages = Math.ceil(filteredApplications.length / ITEMS_PER_PAGE);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, dateRange]);

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, status: newStatus } : app)));
    } catch {
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
      if (!response.ok) throw new Error("Failed to update rating");
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, rating } : app)));
    } catch {
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
      if (!response.ok) throw new Error("Failed to save notes");
      setApplications((prev) => prev.map((app) => (app.id === appId ? { ...app, notes: noteText } : app)));
      setEditingNoteId(null);
      setNoteText("");
    } catch {
      alert("Failed to save notes");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Status", "Applied Date", "Rating", "Notes"];
    const rows = filteredApplications.map((app) => [
      `"${app.name}"`,
      `"${app.email}"`,
      `"${app.phone || ""}"`,
      `"${app.status}"`,
      `"${new Date(app.appliedAt).toLocaleDateString()}"`,
      `"${app.rating?.toString() || ""}"`,
      `"${(app.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
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
      if (!response.ok || !data.success) throw new Error(data.error || "Failed to get resume");
      window.open(data.downloadUrl, "_blank");
    } catch {
      alert("Failed to load resume. The file may have been deleted.");
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return formatDate(dateStr);
  };

  const stats = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    inProgress: applications.filter((a) => ["reviewing", "interview", "offered"].includes(a.status)).length,
    hired: applications.filter((a) => a.status === "hired").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  const getJobUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/careers/${jobId}`;
    }
    return "";
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getJobUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Failed to copy link");
    }
  };

  const handleShareViaEmail = () => {
    if (!job) return;
    const emails = shareEmails.split(",").map((e) => e.trim()).filter(Boolean);
    if (emails.length === 0) {
      alert("Please enter at least one email address");
      return;
    }

    const jobUrl = getJobUrl();
    const subject = encodeURIComponent(`Job Opportunity: ${job.title} at Ocean Blue Corporation`);
    const salaryInfo = job.salary ? `\nSalary Range: $${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}` : "";
    const body = encodeURIComponent(
      `${shareMessage ? shareMessage + "\n\n" : ""}I wanted to share this job opportunity with you:\n\n` +
      `Position: ${job.title}\n` +
      `Department: ${job.department}\n` +
      `Location: ${job.location}\n` +
      `Type: ${job.type}${salaryInfo}\n\n` +
      `View and apply here: ${jobUrl}\n\n` +
      `Best regards`
    );

    window.open(`mailto:${emails.join(",")}?subject=${subject}&body=${body}`, "_blank");
    setShowShareModal(false);
    setShareEmails("");
    setShareMessage("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading job details...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-gray-900 font-medium">{error || "Job not found"}</p>
          <button
            onClick={() => router.push("/admin/jobs")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            Back to Jobs
          </button>
        </div>
      </div>
    );
  }

  const jobStatus = jobStatusConfig[job.status] || jobStatusConfig.draft;

  // Calculate days until due
  const getDaysUntilDue = () => {
    if (!job.submissionDueDate) return null;
    const due = new Date(job.submissionDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysUntilDue = getDaysUntilDue();
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
  const isDueSoon = daysUntilDue !== null && daysUntilDue >= 0 && daysUntilDue <= 3;

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <button onClick={() => router.push("/admin/jobs")} className="mt-0.5 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {job.postingId && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-mono rounded">
                      <Hash className="w-3 h-3" />{job.postingId}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${jobStatus.bg} ${jobStatus.color}`}>
                    {jobStatus.label}
                  </span>
                  {isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                      <AlertCircle className="w-3 h-3" />Overdue
                    </span>
                  )}
                  {isDueSoon && !isOverdue && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded">
                      <CalendarClock className="w-3 h-3" />Due Soon
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 mt-1 truncate">{job.title}</h1>
                <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500 flex-wrap">
                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{job.department}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}{job.state && `, ${job.state}`}</span>
                  <span className="flex items-center gap-1 capitalize"><Briefcase className="w-3.5 h-3.5" />{job.type.replace(/-/g, " ")}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => setShowShareModal(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 text-sm font-medium rounded-lg transition-colors">
                <Share2 className="w-4 h-4" />Share
              </button>
              {canEditJobs && (
                <button onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4" />Edit
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ATS Pipeline Stats - Prominent Section */}
        <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-100">
          <div className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <Target className="w-3.5 h-3.5" />ATS Pipeline
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                <p className="text-[10px] text-gray-500 uppercase font-medium">Total</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded">
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">{stats.pending}</span>
                  <span className="text-xs text-gray-500">New</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span className="text-sm font-semibold text-purple-700">{stats.inProgress}</span>
                  <span className="text-xs text-purple-600">Active</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-semibold text-emerald-700">{stats.hired}</span>
                  <span className="text-xs text-emerald-600">Hired</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 rounded">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-sm font-semibold text-rose-700">{stats.rejected}</span>
                  <span className="text-xs text-rose-600">Rejected</span>
                </div>
              </div>
            </div>
            {stats.total > 0 && (
              <div className="ml-auto flex items-center gap-2">
                <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden flex">
                  {stats.hired > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${(stats.hired / stats.total) * 100}%` }} />}
                  {stats.inProgress > 0 && <div className="bg-purple-500 h-full" style={{ width: `${(stats.inProgress / stats.total) * 100}%` }} />}
                  {stats.pending > 0 && <div className="bg-gray-400 h-full" style={{ width: `${(stats.pending / stats.total) * 100}%` }} />}
                  {stats.rejected > 0 && <div className="bg-rose-400 h-full" style={{ width: `${(stats.rejected / stats.total) * 100}%` }} />}
                </div>
                <span className="text-xs text-gray-500">{stats.total > 0 ? Math.round((stats.hired / stats.total) * 100) : 0}% hired</span>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Info Grid */}
        <div className="px-5 py-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-3">
            {/* Client & Vendor */}
            {job.clientName && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Globe className="w-3 h-3" />Client</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.clientName}</p>
                {job.clientNotes && <p className="text-xs text-gray-500 truncate">{job.clientNotes}</p>}
              </div>
            )}
            {job.vendorName && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Handshake className="w-3 h-3" />Vendor</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.vendorName}</p>
              </div>
            )}

            {/* Salary & Rates */}
            {job.salary && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><DollarSign className="w-3 h-3" />Salary Range</p>
                <p className="text-sm font-medium text-emerald-600">${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}</p>
              </div>
            )}
            {job.clientBillRate && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Receipt className="w-3 h-3" />Bill Rate</p>
                <p className="text-sm font-medium text-gray-900">${job.clientBillRate}/hr</p>
              </div>
            )}
            {job.payRate && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Wallet className="w-3 h-3" />Pay Rate</p>
                <p className="text-sm font-medium text-gray-900">${job.payRate}/hr</p>
              </div>
            )}

            {/* Dates */}
            {job.submissionDueDate && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><CalendarClock className="w-3 h-3" />Due Date</p>
                <p className={`text-sm font-medium ${isOverdue ? "text-red-600" : isDueSoon ? "text-amber-600" : "text-gray-900"}`}>
                  {formatDate(job.submissionDueDate)}
                  {daysUntilDue !== null && (
                    <span className="text-xs font-normal ml-1">
                      ({isOverdue ? `${Math.abs(daysUntilDue)}d overdue` : daysUntilDue === 0 ? "Today" : `${daysUntilDue}d left`})
                    </span>
                  )}
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />Posted</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(job.createdAt)}</p>
            </div>
            {job.updatedAt && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Updated</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(job.updatedAt)}</p>
              </div>
            )}

            {/* Team Assignments */}
            {job.recruitmentManagerName && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><UserCheck className="w-3 h-3" />Recruitment Manager</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.recruitmentManagerName}</p>
                {job.recruitmentManagerEmail && <p className="text-xs text-gray-500 truncate">{job.recruitmentManagerEmail}</p>}
              </div>
            )}
            {job.assignedToNames && job.assignedToNames.length > 0 && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><UsersRound className="w-3 h-3" />Assigned Team</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.assignedToNames.join(", ")}</p>
              </div>
            )}
            {job.postedByName && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><User className="w-3 h-3" />Posted By</p>
                <p className="text-sm font-medium text-gray-900 truncate">{job.postedByName}</p>
                {job.postedByRole && <p className="text-xs text-gray-500 capitalize">{job.postedByRole}</p>}
              </div>
            )}

            {/* Notification Status */}
            {job.notificationSentAt && (
              <div className="space-y-0.5">
                <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium flex items-center gap-1"><Bell className="w-3 h-3" />Notified</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(job.notificationSentAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Description & Requirements Toggle */}
        {(job.description || (job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0) || (job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0)) && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                <FileCheck className="w-4 h-4 text-gray-400" />
                <span>Job Description & Requirements</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto group-open:rotate-180 transition-transform" />
              </summary>
              <div className="mt-3 space-y-4 text-sm">
                {job.description && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Description</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{job.description}</p>
                  </div>
                )}
                {job.responsibilities && Array.isArray(job.responsibilities) && job.responsibilities.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Responsibilities</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                      {job.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {job.requirements && Array.isArray(job.requirements) && job.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Requirements</h4>
                    <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                      {job.requirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Filters & Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">New</option>
              <option value="reviewing">Screening</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 transition-colors ${viewMode === "table" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <LayoutList className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("cards")}
                className={`p-2 border-l border-gray-200 transition-colors ${viewMode === "cards" ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={handleExportCSV}
              disabled={filteredApplications.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Showing {paginatedApplications.length} of {filteredApplications.length} candidates
          {filteredApplications.length !== applications.length && ` (filtered from ${applications.length})`}
        </p>
      </div>

      {/* Table View */}
      {viewMode === "table" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {paginatedApplications.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Candidate</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Applied</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes</th>
                    <th className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedApplications.map((app) => {
                    const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
                    return (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{app.name}</p>
                              <p className="text-xs text-gray-500 truncate">{app.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button key={star} onClick={() => handleRatingChange(app.id, star)} className="focus:outline-none">
                                <Star className={`w-3.5 h-3.5 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200 hover:text-amber-300"}`} />
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-gray-600">{formatTimeAgo(app.appliedAt)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium border cursor-pointer focus:outline-none ${status.color}`}
                          >
                            <option value="pending">New</option>
                            <option value="reviewing">Screening</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => { setEditingNoteId(app.id); setNoteText(app.notes || ""); }}
                            className={`flex items-center gap-1 text-xs ${app.notes ? "text-blue-600" : "text-gray-400"} hover:text-blue-700`}
                          >
                            <StickyNote className="w-3.5 h-3.5" />
                            {app.notes ? "View" : "Add"}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {app.resumeId && (
                              <button onClick={() => app.resumeId && handleViewResume(app.resumeId)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Resume">
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
                            <a href={`mailto:${app.email}`} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Send Email">
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
          ) : (
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No candidates found</h3>
              <p className="text-xs text-gray-500">{applications.length === 0 ? "No applications for this position yet" : "Try adjusting your filters"}</p>
            </div>
          )}
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="space-y-3">
          {paginatedApplications.length > 0 ? (
            paginatedApplications.map((app) => {
              const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
              const isExpanded = expandedId === app.id;
              return (
                <div key={app.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:border-gray-300 transition-all">
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {app.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold text-gray-900">{app.name}</h3>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button key={star} onClick={(e) => { e.stopPropagation(); handleRatingChange(app.id, star); }}>
                                  <Star className={`w-3 h-3 ${star <= (app.rating || 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                            <span>{app.email}</span>
                            <span>{formatTimeAgo(app.appliedAt)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotColor}`} />
                          {status.label}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact & Info</h4>
                          <div className="space-y-2 text-sm">
                            <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                              <Mail className="w-4 h-4 text-gray-400" />{app.email}
                            </a>
                            {app.phone && (
                              <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-blue-600">
                                <Phone className="w-4 h-4 text-gray-400" />{app.phone}
                              </a>
                            )}
                          </div>
                          {app.skills && app.skills.length > 0 && (
                            <div className="pt-2">
                              <p className="text-xs text-gray-500 mb-1.5">Skills</p>
                              <div className="flex flex-wrap gap-1">
                                {app.skills.slice(0, 5).map((skill) => (
                                  <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{skill}</span>
                                ))}
                                {app.skills.length > 5 && <span className="text-xs text-gray-400">+{app.skills.length - 5}</span>}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Documents & Notes</h4>
                          {app.resumeId ? (
                            <button onClick={() => app.resumeId && handleViewResume(app.resumeId)} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700">
                              <FileText className="w-4 h-4" />View Resume<ExternalLink className="w-3 h-3" />
                            </button>
                          ) : (
                            <p className="text-sm text-gray-400">No resume uploaded</p>
                          )}
                          {editingNoteId === app.id ? (
                            <div className="space-y-2">
                              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none" rows={3} placeholder="Add notes..." />
                              <div className="flex gap-2">
                                <button onClick={() => handleNotesSave(app.id)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700">Save</button>
                                <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50">Cancel</button>
                              </div>
                            </div>
                          ) : app.notes ? (
                            <div onClick={(e) => { e.stopPropagation(); setEditingNoteId(app.id); setNoteText(app.notes || ""); }} className="text-sm text-gray-700 bg-amber-50 p-3 rounded-lg border border-amber-200 cursor-pointer hover:bg-amber-100">
                              {app.notes}
                            </div>
                          ) : (
                            <button onClick={(e) => { e.stopPropagation(); setEditingNoteId(app.id); setNoteText(""); }} className="text-sm text-gray-500 hover:text-blue-600">+ Add notes</button>
                          )}
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</h4>
                          <select
                            value={app.status}
                            onChange={(e) => handleStatusChange(app.id, e.target.value as Application["status"])}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                          >
                            <option value="pending">New</option>
                            <option value="reviewing">Screening</option>
                            <option value="interview">Interview</option>
                            <option value="offered">Offered</option>
                            <option value="hired">Hired</option>
                            <option value="rejected">Rejected</option>
                          </select>
                          <a href={`mailto:${app.email}`} className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm text-center font-medium rounded-lg transition-colors">
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
            <div className="bg-white rounded-xl border border-gray-200 py-16 text-center">
              <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">No candidates found</h3>
              <p className="text-xs text-gray-500">{applications.length === 0 ? "No applications for this position yet" : "Try adjusting your filters"}</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          <p className="text-sm text-gray-600">Page {currentPage} of {totalPages}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">First</button>
            <button onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 mx-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => totalPages <= 5 || page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <div key={page} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1.5 text-gray-400 text-sm">...</span>}
                    <button onClick={() => setCurrentPage(page)} className={`w-8 h-8 rounded-lg text-sm font-medium ${currentPage === page ? "bg-blue-600 text-white" : "hover:bg-gray-100"}`}>{page}</button>
                  </div>
                ))}
            </div>
            <button onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Last</button>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {editingNoteId && viewMode === "table" && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditingNoteId(null); setNoteText(""); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Candidate Notes</h2>
              <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" rows={5} placeholder="Add notes about this candidate..." />
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => { setEditingNoteId(null); setNoteText(""); }} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg text-sm">Cancel</button>
              <button onClick={() => handleNotesSave(editingNoteId)} className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm">Save Notes</button>
            </div>
          </div>
        </div>
      )}

      {/* Share Job Modal */}
      {showShareModal && job && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Share Job</h2>
                <p className="text-sm text-gray-500 mt-0.5">{job.title}</p>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Copy Link Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getJobUrl()}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      copied
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">or share via email</span>
                </div>
              </div>

              {/* Email Share Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Addresses
                  <span className="font-normal text-gray-400 ml-1">(comma separated)</span>
                </label>
                <input
                  type="text"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  placeholder="john@example.com, jane@example.com"
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Message
                  <span className="font-normal text-gray-400 ml-1">(optional)</span>
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  placeholder="Hi! I thought you might be interested in this opportunity..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Job Preview */}
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <p className="text-sm font-medium text-gray-900">{job.title}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {job.department} • {job.location} • {job.type}
                  {job.salary && ` • $${job.salary.min.toLocaleString()} - $${job.salary.max.toLocaleString()}`}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button onClick={() => setShowShareModal(false)} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg text-sm">
                Cancel
              </button>
              <button
                onClick={handleShareViaEmail}
                disabled={!shareEmails.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
