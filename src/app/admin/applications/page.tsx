"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
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
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";

interface ApplicationWithJob extends Application {
  jobTitle?: string;
  jobDepartment?: string;
}

const statusConfig = {
  pending: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-700",
    icon: Clock,
  },
  reviewing: {
    label: "Under Review",
    color: "bg-blue-100 text-blue-700",
    icon: Eye,
  },
  interview: {
    label: "Interview",
    color: "bg-purple-100 text-purple-700",
    icon: MessageSquare,
  },
  offered: {
    label: "Offer Sent",
    color: "bg-cyan-100 text-cyan-700",
    icon: Mail,
  },
  hired: {
    label: "Hired",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    icon: XCircle,
  },
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

        const appsWithJobs = (appsData.applications || []).map((app: Application) => ({
          ...app,
          jobTitle: jobsMap.get(app.jobId)?.title || "Unknown Position",
          jobDepartment: jobsMap.get(app.jobId)?.department || "",
        }));

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

  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesPosition = positionFilter === "all" || app.jobTitle === positionFilter;
    return matchesSearch && matchesStatus && matchesPosition;
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

  const handleExportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Position", "Status", "Applied Date", "Rating"];
    const rows = filteredApplications.map((app) => [
      app.name,
      app.email,
      app.phone || "",
      app.jobTitle || "",
      app.status,
      new Date(app.appliedAt).toLocaleDateString(),
      app.rating?.toString() || "",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `applications-${new Date().toISOString().split("T")[0]}.csv`;
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

      // Open the presigned download URL in a new tab
      window.open(data.downloadUrl, "_blank");
    } catch (err) {
      alert("Failed to load resume. The file may have been deleted.");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-500">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">
            Review and manage job applications
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={filteredApplications.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Applications</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {stats.reviewing}
              </p>
              <p className="text-sm text-gray-600">In Progress</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.hired}</p>
              <p className="text-sm text-gray-600">Hired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or position..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
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
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
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

      {/* Applications list */}
      <div className="space-y-4">
        {filteredApplications.length > 0 ? (
          filteredApplications.map((app) => {
            const status = statusConfig[app.status as keyof typeof statusConfig] || statusConfig.pending;
            const isExpanded = expandedId === app.id;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
              >
                {/* Main row */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-semibold">
                        {app.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {app.name}
                          </h3>
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
                                  className={`w-4 h-4 ${
                                    star <= (app.rating || 0)
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3.5 h-3.5" />
                            {app.jobTitle}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${status.color}`}
                      >
                        <status.icon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50">
                    <div className="grid lg:grid-cols-3 gap-6">
                      {/* Contact & Info */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          <a
                            href={`mailto:${app.email}`}
                            className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                          >
                            <Mail className="w-4 h-4" />
                            {app.email}
                          </a>
                          {app.phone && (
                            <a
                              href={`tel:${app.phone}`}
                              className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                            >
                              <Phone className="w-4 h-4" />
                              {app.phone}
                            </a>
                          )}
                        </div>
                        {app.experience && (
                          <div className="pt-2">
                            <p className="text-sm text-gray-500">Experience</p>
                            <p className="font-medium text-gray-900">
                              {app.experience}
                            </p>
                          </div>
                        )}
                        {app.skills && app.skills.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Skills</p>
                            <div className="flex flex-wrap gap-2">
                              {app.skills.map((skill) => (
                                <span
                                  key={skill}
                                  className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
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
                        <h4 className="font-semibold text-gray-900">Documents</h4>
                        {app.resumeId ? (
                          <button
                            onClick={() => handleViewResume(app.resumeId)}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            View Resume
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <p className="text-sm text-gray-500">No resume uploaded</p>
                        )}
                        {app.coverLetter && (
                          <div>
                            <p className="text-sm text-gray-500 mb-2">Cover Letter</p>
                            <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">
                              {app.coverLetter}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-gray-900">
                          Update Status
                        </h4>
                        <select
                          value={app.status}
                          onChange={(e) =>
                            handleStatusChange(app.id, e.target.value as Application["status"])
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
                        >
                          <option value="pending">Pending Review</option>
                          <option value="reviewing">Under Review</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offer Sent</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>

                        {app.notes && (
                          <div>
                            <p className="text-sm text-gray-500 mb-1">Notes</p>
                            <p className="text-sm text-gray-700">{app.notes}</p>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <a
                            href={`mailto:${app.email}`}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm text-center"
                          >
                            Send Email
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {applications.length === 0
                ? "No applications yet"
                : "No applications found matching your criteria"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
