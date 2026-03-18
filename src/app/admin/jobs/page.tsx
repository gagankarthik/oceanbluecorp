"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Users,
  MapPin,
  Briefcase,
  CheckCircle2,
  Copy,
  Loader2,
  DollarSign,
  Download,
  Eye,
  MoreHorizontal,
  Building2,
  LayoutList,
  AlignJustify,
  Truck,
  Calendar,
  X,
  PauseCircle,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Job } from "@/lib/aws/dynamodb";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TableView = "compact" | "detailed";

const statusConfig = {
  open: { label: "Open", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  active: { label: "Active", bg: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  "on-hold": { label: "On Hold", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  paused: { label: "Paused", bg: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  draft: { label: "Draft", bg: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
  closed: { label: "Closed", bg: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
};

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "open", label: "Open" },
  { key: "draft", label: "Draft" },
  { key: "on-hold", label: "On Hold" },
  { key: "closed", label: "Closed" },
];

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [tableView, setTableView] = useState<TableView>("compact");

  const exportJobsToExcel = () => {
    const headers = ["Job ID","Title","Client","Vendor","Location","Status","Pay Rate","Bill Rate","Manager","Created Date","Deadline"];
    const rows = filteredJobs.map(job => [
      job.postingId || "",
      job.title,
      job.clientName || "",
      (job as Job & { vendorName?: string }).vendorName || "",
      `${job.location}${job.state ? `, ${job.state}` : ""}`,
      job.status,
      job.payRate ? `$${job.payRate}/hr` : "",
      job.clientBillRate ? `$${job.clientBillRate}/hr` : "",
      job.recruitmentManagerName || "",
      new Date(job.createdAt).toLocaleDateString(),
      job.submissionDueDate ? new Date(job.submissionDueDate).toLocaleDateString() : "N/A",
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.map(cell => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `jobs_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/jobs");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to fetch jobs");
      setJobs(data.jobs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const jobWithVendor = job as Job & { vendorName?: string };
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      jobWithVendor.vendorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.postingId?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (jobId: string, newStatus: Job["status"]) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      setJobs(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
    } catch {
      alert("Failed to update job status");
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete job");
      setJobs(prev => prev.filter(job => job.id !== jobId));
      setShowDeleteConfirm(null);
    } catch {
      alert("Failed to delete job");
    }
  };

  const handleDuplicate = async (job: Job) => {
    setDuplicating(job.id);
    try {
      const response = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to duplicate job");
      }
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate job");
    } finally {
      setDuplicating(null);
    }
  };

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? jobs.length : jobs.filter(j => j.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  const stats = {
    total: jobs.length,
    active: jobs.filter(j => j.status === "active" || j.status === "open").length,
    draft: jobs.filter(j => j.status === "draft").length,
    onHold: jobs.filter(j => j.status === "on-hold" || j.status === "paused").length,
    closed: jobs.filter(j => j.status === "closed").length,
    totalApplicants: jobs.reduce((sum, j) => sum + (j.applicationsCount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 mx-auto animate-spin" />
          <p className="text-gray-500 text-sm">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Briefcase className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-rose-600 text-sm">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
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
            <h1 className="text-2xl font-bold text-gray-900">Job Postings</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-sm font-semibold">{jobs.length}</span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage job listings and track applications</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportJobsToExcel} className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => router.push("/admin/jobs/new")} className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">New Job</span>
          </button>
        </div>
      </div>

      {/* Stats Row - clickable to filter */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Active / Open", value: stats.active, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", key: "active", icon: CheckCircle2 },
          { label: "Draft", value: stats.draft, color: "text-gray-600", bg: "bg-gray-50 border-gray-200", key: "draft", icon: FileText },
          { label: "On Hold", value: stats.onHold, color: "text-amber-700", bg: "bg-amber-50 border-amber-200", key: "on-hold", icon: PauseCircle },
          { label: "Total Applicants", value: stats.totalApplicants, color: "text-blue-700", bg: "bg-blue-50 border-blue-200", key: null, icon: TrendingUp },
        ].map(stat => (
          <button
            key={stat.label}
            onClick={() => stat.key && setStatusFilter(statusFilter === stat.key ? "all" : stat.key)}
            className={`${stat.bg} border rounded-xl p-4 text-left transition-all hover:shadow-sm ${stat.key && statusFilter === stat.key ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="border border-gray-200 rounded-xl bg-white shadow-sm p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, client, vendor, location..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
          {/* View toggle (desktop) */}
          <div className="hidden lg:flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button onClick={() => setTableView("compact")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors ${tableView === "compact" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <LayoutList className="h-4 w-4" />Compact
            </button>
            <button onClick={() => setTableView("detailed")} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm transition-colors border-l border-gray-200 ${tableView === "detailed" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-50"}`}>
              <AlignJustify className="h-4 w-4" />Detailed
            </button>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${statusFilter === tab.key ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"}`}>{statusCounts[tab.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400">{filteredJobs.length} of {jobs.length} jobs</p>

      {/* Mobile Cards */}
      <div className="grid gap-3 lg:hidden">
        {filteredJobs.length > 0 ? filteredJobs.map(job => {
          const jobWithVendor = job as Job & { vendorName?: string };
          return (
            <div key={job.id} className="border border-gray-200 rounded-xl bg-white shadow-sm p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  {job.postingId && <span className="font-mono text-xs text-blue-600 font-medium">{job.postingId}</span>}
                  <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left truncate block text-sm mt-0.5">
                    {job.title}
                  </button>
                  <p className="text-xs text-gray-400 capitalize">{job.type}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                {job.clientName && <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" />{job.clientName}</div>}
                {jobWithVendor.vendorName && <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-gray-400" />{jobWithVendor.vendorName}</div>}
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{job.location}{job.state ? `, ${job.state}` : ""}</div>
                {job.payRate && <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" />${job.payRate}/hr</div>}
                <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-gray-400" />{job.applicationsCount || 0} applicants</div>
              </div>
              <div className="flex items-center justify-end gap-1 pt-3 border-t border-gray-100">
                <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></button>
                <button onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => handleDuplicate(job)} disabled={duplicating === job.id} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
                  {duplicating === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                </button>
                <button onClick={() => setShowDeleteConfirm(job.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          );
        }) : (
          <div className="border border-gray-200 rounded-xl bg-white p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-sm text-gray-400 mb-4">{jobs.length === 0 ? "Create your first job posting" : "No jobs match your filters"}</p>
            {jobs.length === 0 && <button onClick={() => router.push("/admin/jobs/new")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create First Job</button>}
          </div>
        )}
      </div>

      {/* Desktop Table — Compact */}
      <div className="hidden lg:block">
        {tableView === "compact" && (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Job ID","Title","Client","Location","Status","Created",""].map((h, i) => (
                    <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredJobs.map(job => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-xs text-blue-600 font-medium">{job.postingId || "—"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left">{job.title}</button>
                        <p className="text-xs text-gray-400 capitalize">{job.type}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {job.clientName ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <Building2 className="h-3.5 w-3.5 text-gray-400" />{job.clientName}
                        </div>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />{job.location}{job.state ? `, ${job.state}` : ""}
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><StatusBadge status={job.status} /></td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}><Edit3 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(job)} disabled={duplicating === job.id}>
                            {duplicating === job.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setShowDeleteConfirm(job.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredJobs.length === 0 && (
              <div className="py-16 text-center">
                <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs found</h3>
                <p className="text-sm text-gray-400 mb-4">{jobs.length === 0 ? "Create your first job posting" : "No jobs match your current filters"}</p>
                {jobs.length === 0 && <button onClick={() => router.push("/admin/jobs/new")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create First Job</button>}
              </div>
            )}
          </div>
        )}

        {/* Desktop Table — Detailed */}
        {tableView === "detailed" && (
          <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {["Job ID","Title","Client","Vendor","Location","Pay Rate","Bill Rate","Status","Manager","Applicants","Created","Deadline",""].map((h, i) => (
                      <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 12 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.map(job => {
                    const jobWithVendor = job as Job & { vendorName?: string };
                    return (
                      <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-4"><span className="font-mono text-xs text-blue-600 font-medium">{job.postingId || "—"}</span></td>
                        <td className="py-3.5 px-4">
                          <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors text-left">{job.title}</button>
                          <p className="text-xs text-gray-400 capitalize">{job.type}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          {job.clientName ? <div className="flex items-center gap-1.5 text-sm text-gray-700"><Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.clientName}</div> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          {jobWithVendor.vendorName ? <div className="flex items-center gap-1.5 text-sm text-gray-700"><Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{jobWithVendor.vendorName}</div> : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.location}{job.state ? `, ${job.state}` : ""}</div>
                        </td>
                        <td className="py-3.5 px-4">{job.payRate ? <span className="text-sm font-medium text-gray-900">${job.payRate}/hr</span> : <span className="text-gray-400">—</span>}</td>
                        <td className="py-3.5 px-4">{job.clientBillRate ? <span className="text-sm font-medium text-gray-900">${job.clientBillRate}/hr</span> : <span className="text-gray-400">—</span>}</td>
                        <td className="py-3.5 px-4">
                          <select value={job.status} onChange={(e) => handleStatusChange(job.id, e.target.value as Job["status"])} className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700">
                            {["open","active","closed","on-hold","draft"].map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          {job.recruitmentManagerName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {job.recruitmentManagerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-600">{job.recruitmentManagerName}</span>
                            </div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1 text-sm text-gray-600"><Users className="h-3.5 w-3.5 text-gray-400" />{job.applicationsCount || 0}</div>
                        </td>
                        <td className="py-3.5 px-4"><span className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                        <td className="py-3.5 px-4">
                          {job.submissionDueDate ? (
                            <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5 text-gray-400" />{new Date(job.submissionDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><MoreHorizontal className="h-4 w-4" /></button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white">
                              <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}/edit`)}><Edit3 className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(job)} disabled={duplicating === job.id}>
                                {duplicating === job.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setShowDeleteConfirm(job.id)} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50">
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredJobs.length === 0 && (
                <div className="py-16 text-center">
                  <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs found</h3>
                  <p className="text-sm text-gray-400 mb-4">{jobs.length === 0 ? "Create your first job posting" : "No jobs match your current filters"}</p>
                  {jobs.length === 0 && <button onClick={() => router.push("/admin/jobs/new")} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create First Job</button>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">Delete Job?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">This action cannot be undone. All associated data will be removed.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 text-sm font-medium bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
