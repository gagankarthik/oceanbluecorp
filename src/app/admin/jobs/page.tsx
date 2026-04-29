"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Edit3, Trash2, Users, MapPin, Briefcase,
  CheckCircle2, Copy, Loader2, DollarSign, Download, Eye,
  MoreHorizontal, Building2, LayoutList, AlignJustify, Truck,
  Calendar, PauseCircle, FileText, TrendingUp, X, AlertTriangle,
} from "lucide-react";
import { Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

type TableView = "compact" | "detailed";

const JOB_TYPES = ["full-time", "part-time", "contract", "temporary", "remote", "internship"];
const JOB_STATUSES: Array<{ value: Job["status"]; label: string }> = [
  { value: "draft",    label: "Draft" },
  { value: "open",     label: "Open" },
  { value: "active",   label: "Active" },
  { value: "on-hold",  label: "On Hold" },
  { value: "closed",   label: "Closed" },
];

const statusConfig: Record<string, { label: string; bg: string; dot: string; text: string }> = {
  open:    { label: "Open",    bg: "bg-emerald-50",  dot: "bg-emerald-500", text: "text-emerald-700" },
  active:  { label: "Active",  bg: "bg-emerald-50",  dot: "bg-emerald-500", text: "text-emerald-700" },
  "on-hold": { label: "On Hold", bg: "bg-amber-50",  dot: "bg-amber-500",   text: "text-amber-700"  },
  paused:  { label: "Paused",  bg: "bg-amber-50",    dot: "bg-amber-500",   text: "text-amber-700"  },
  draft:   { label: "Draft",   bg: "bg-gray-100",    dot: "bg-gray-400",    text: "text-gray-600"   },
  closed:  { label: "Closed",  bg: "bg-rose-50",     dot: "bg-rose-500",    text: "text-rose-700"   },
};

const STATUS_TABS = [
  { key: "all",     label: "All" },
  { key: "active",  label: "Active" },
  { key: "open",    label: "Open" },
  { key: "draft",   label: "Draft" },
  { key: "on-hold", label: "On Hold" },
  { key: "closed",  label: "Closed" },
];

const defaultJobForm = {
  title: "",
  status: "draft" as Job["status"],
  department: "",
  location: "",
  state: "",
  type: "full-time" as Job["type"],
  clientName: "",
  payRate: "",
  clientBillRate: "",
  description: "",
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text} border border-transparent`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function FieldLabel({ required, children }: { required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
      {children}{required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
  );
}

function FormInput({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-gray-400 ${props.className ?? ""}`}
    />
  );
}

function FormSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-gray-700 ${props.className ?? ""}`}
    >
      {children}
    </select>
  );
}

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [jobs, setJobs]                   = useState<Job[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [duplicating, setDuplicating]     = useState<string | null>(null);
  const [tableView, setTableView]         = useState<TableView>("compact");

  // Drawer state
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [drawerMode, setDrawerMode]       = useState<"create" | "edit">("create");
  const [editingJob, setEditingJob]       = useState<Job | null>(null);
  const [jobForm, setJobForm]             = useState(defaultJobForm);
  const [submitting, setSubmitting]       = useState(false);
  const [formError, setFormError]         = useState<string | null>(null);

  const canEdit = user?.role !== UserRole.RECRUITER;

  // ── Data fetching ────────────────────────────────────────────────────────

  useEffect(() => { fetchJobs(); }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");

      const fetchedJobs: Job[] = data.jobs || [];
      const now = new Date();
      const toClose = fetchedJobs.filter(
        j => j.submissionDueDate && new Date(j.submissionDueDate) < now && j.status !== "closed"
      );

      if (toClose.length > 0) {
        await Promise.all(toClose.map(j =>
          fetch(`/api/jobs/${j.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "closed" }),
          })
        ));
        const closedIds = new Set(toClose.map(j => j.id));
        setJobs(fetchedJobs.map(j => closedIds.has(j.id) ? { ...j, status: "closed" } : j));
      } else {
        setJobs(fetchedJobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  };

  // ── Drawer helpers ───────────────────────────────────────────────────────

  const openCreate = () => {
    setDrawerMode("create");
    setEditingJob(null);
    setJobForm(defaultJobForm);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (job: Job) => {
    setDrawerMode("edit");
    setEditingJob(job);
    setJobForm({
      title:          job.title,
      status:         job.status,
      department:     job.department,
      location:       job.location,
      state:          job.state || "",
      type:           job.type,
      clientName:     job.clientName || "",
      payRate:        job.payRate ? String(job.payRate) : "",
      clientBillRate: job.clientBillRate ? String(job.clientBillRate) : "",
      description:    job.description,
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleJobSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { title, department, location, type, description } = jobForm;
    if (!title.trim() || !department.trim() || !location.trim() || !type || !description.trim()) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        ...jobForm,
        payRate:        jobForm.payRate        ? Number(jobForm.payRate)        : undefined,
        clientBillRate: jobForm.clientBillRate ? Number(jobForm.clientBillRate) : undefined,
        createdBy:      user?.email || "admin",
        postedByName:   user?.name,
        postedByEmail:  user?.email,
        postedByRole:   user?.role,
      };

      if (drawerMode === "create") {
        const res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create job");
        setJobs(prev => [data.job, ...prev]);
      } else {
        const res = await fetch(`/api/jobs/${editingJob!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update job");
        setJobs(prev => prev.map(j => j.id === editingJob!.id ? data.job : j));
      }
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // ── CRUD helpers ─────────────────────────────────────────────────────────

  const handleStatusChange = async (jobId: string, newStatus: Job["status"]) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
    } catch { alert("Failed to update job status"); }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setShowDeleteConfirm(null);
    } catch { alert("Failed to delete job"); }
  };

  const handleDuplicate = async (job: Job) => {
    setDuplicating(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to duplicate"); }
      await fetchJobs();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate job");
    } finally { setDuplicating(null); }
  };

  const exportCSV = () => {
    const headers = ["Job ID","Title","Client","Location","Status","Pay Rate","Bill Rate","Manager","Created","Deadline"];
    const rows = filteredJobs.map(job => [
      job.postingId || "",
      job.title,
      job.clientName || "",
      `${job.location}${job.state ? `, ${job.state}` : ""}`,
      job.status,
      job.payRate        ? `$${job.payRate}/hr`        : "",
      job.clientBillRate ? `$${job.clientBillRate}/hr` : "",
      job.recruitmentManagerName || "",
      new Date(job.createdAt).toLocaleDateString(),
      job.submissionDueDate ? new Date(job.submissionDueDate).toLocaleDateString() : "",
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `jobs_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // ── Derived data ─────────────────────────────────────────────────────────

  const filteredJobs = jobs.filter(job => {
    const jv = job as Job & { vendorName?: string };
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [job.title, job.department, job.location, job.clientName, jv.vendorName, job.postingId]
      .some(f => f?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || job.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? jobs.length : jobs.filter(j => j.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  const stats = {
    active:         jobs.filter(j => j.status === "active" || j.status === "open").length,
    draft:          jobs.filter(j => j.status === "draft").length,
    onHold:         jobs.filter(j => j.status === "on-hold" || j.status === "paused").length,
    totalApplicants:jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0),
  };

  // ── Loading / Error states ───────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
        <p className="text-sm text-gray-500">Loading job postings…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-600">{error}</p>
        <button onClick={fetchJobs} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Job Postings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage open roles and track candidate pipelines</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          {canEdit && (
            <button onClick={openCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
              <Plus className="w-4 h-4" />New Job
            </button>
          )}
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([
          { label: "Active / Open",    value: stats.active,          icon: CheckCircle2, color: "text-emerald-600", border: "border-l-emerald-400", bg: "bg-emerald-50/60", filterKey: "active" },
          { label: "Draft",            value: stats.draft,           icon: FileText,     color: "text-slate-600",   border: "border-l-slate-300",   bg: "bg-slate-50/60",   filterKey: "draft"  },
          { label: "On Hold",          value: stats.onHold,          icon: PauseCircle,  color: "text-amber-600",   border: "border-l-amber-400",   bg: "bg-amber-50/60",   filterKey: "on-hold"},
          { label: "Total Applicants", value: stats.totalApplicants, icon: TrendingUp,   color: "text-blue-600",    border: "border-l-blue-400",    bg: "bg-blue-50/60",    filterKey: null     },
        ] as const).map(s => (
          <button key={s.label}
            onClick={() => s.filterKey && setStatusFilter(statusFilter === s.filterKey ? "all" : s.filterKey)}
            className={`flex items-center gap-3 p-4 rounded-xl border border-l-4 ${s.border} bg-white ${s.bg} text-left hover:shadow-sm transition-all ${s.filterKey && statusFilter === s.filterKey ? "ring-2 ring-blue-400 ring-offset-1" : ""}`}>
            <div className={`p-2 rounded-lg bg-white shadow-sm border border-gray-100 flex-shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className={`text-2xl font-bold ${s.color} leading-none`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search title, client, location…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="hidden lg:flex items-center rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            {(["compact", "detailed"] as const).map((v, i) => (
              <button key={v} onClick={() => setTableView(v)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${i > 0 ? "border-l border-gray-200" : ""} ${tableView === v ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                {v === "compact" ? <LayoutList className="h-3.5 w-3.5" /> : <AlignJustify className="h-3.5 w-3.5" />}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                statusFilter === tab.key ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
              }`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${
                statusFilter === tab.key ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}>{statusCounts[tab.key] || 0}</span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 -mt-1 px-0.5">{filteredJobs.length} of {jobs.length} jobs</p>

      {/* ── Mobile cards ── */}
      <div className="grid gap-3 lg:hidden">
        {filteredJobs.length > 0 ? filteredJobs.map(job => {
          const jv = job as Job & { vendorName?: string };
          return (
            <div key={job.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:border-blue-200 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  {job.postingId && <span className="font-mono text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{job.postingId}</span>}
                  <button onClick={() => router.push(`/admin/jobs/${job.id}`)}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block text-sm mt-1.5 truncate">
                    {job.title}
                  </button>
                  <p className="text-xs text-gray-400 capitalize mt-0.5">{job.type}</p>
                </div>
                <StatusBadge status={job.status} />
              </div>
              <div className="space-y-1 text-xs text-gray-500 mb-4">
                {job.clientName && <div className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-gray-400" />{job.clientName}</div>}
                {jv.vendorName  && <div className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-gray-400" />{jv.vendorName}</div>}
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-400" />{job.location}{job.state ? `, ${job.state}` : ""}</div>
                {job.payRate    && <div className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-gray-400" />${job.payRate}/hr pay · ${job.clientBillRate}/hr bill</div>}
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{job.applicationsCount || 0} applicants</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></button>
                  {canEdit && <>
                    <button onClick={() => openEdit(job)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                    <button onClick={() => setShowDeleteConfirm(job.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </>}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Briefcase className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs found</h3>
            <p className="text-sm text-gray-400 mb-4">{jobs.length === 0 ? "Create your first job posting" : "No jobs match your filters"}</p>
            {jobs.length === 0 && canEdit && <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Post a Job</button>}
          </div>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {tableView === "compact" ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    {["Job ID","Title","Client","Location","Status","Created","Actions"].map((h, i) => (
                      <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{job.postingId || "—"}</span>
                      </td>
                      <td className="py-3.5 px-4 w-[220px]">
                        <div className="w-[190px] overflow-hidden">
                          <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block truncate w-full">{job.title}</button>
                          <p className="text-xs text-gray-400 capitalize mt-0.5 truncate">{job.department} · {job.type}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {job.clientName
                          ? <div className="flex items-center gap-1.5 text-sm text-gray-700"><Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.clientName}</div>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.location}{job.state ? `, ${job.state}` : ""}</div>
                      </td>
                      <td className="py-3.5 px-4"><StatusBadge status={job.status} /></td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-xl w-44">
                            <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-gray-400" />View Details</DropdownMenuItem>
                            {canEdit && <>
                              <DropdownMenuItem onClick={() => openEdit(job)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-gray-400" />Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(job)} disabled={duplicating === job.id} className="text-sm rounded-lg cursor-pointer">
                                {duplicating === job.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400" /> : <Copy className="h-4 w-4 mr-2 text-gray-400" />}Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setShowDeleteConfirm(job.id)} className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                                <Trash2 className="h-4 w-4 mr-2" />Delete
                              </DropdownMenuItem>
                            </>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px]">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-200">
                    {["Job ID","Title","Client","Vendor","Location","Pay Rate","Bill Rate","Status","Manager","Applicants","Created","Deadline","Actions"].map((h, i) => (
                      <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 12 ? "text-right" : "text-left"}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredJobs.map(job => {
                    const jv = job as Job & { vendorName?: string };
                    return (
                      <tr key={job.id} className="hover:bg-blue-50/30 transition-colors group">
                        <td className="py-3.5 px-4"><span className="font-mono text-[11px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">{job.postingId || "—"}</span></td>
                        <td className="py-3.5 px-4 w-[180px]">
                          <div className="w-[155px] overflow-hidden">
                            <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block truncate w-full">{job.title}</button>
                            <p className="text-xs text-gray-400 capitalize mt-0.5 truncate">{job.type}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">{job.clientName ? <div className="flex items-center gap-1.5 text-sm text-gray-700"><Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.clientName}</div> : <span className="text-gray-300">—</span>}</td>
                        <td className="py-3.5 px-4">{jv.vendorName ? <div className="flex items-center gap-1.5 text-sm text-gray-700"><Truck className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{jv.vendorName}</div> : <span className="text-gray-300">—</span>}</td>
                        <td className="py-3.5 px-4"><div className="flex items-center gap-1.5 text-sm text-gray-600"><MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />{job.location}{job.state ? `, ${job.state}` : ""}</div></td>
                        <td className="py-3.5 px-4">{job.payRate ? <span className="text-sm font-semibold text-gray-800">${job.payRate}/hr</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="py-3.5 px-4">{job.clientBillRate ? <span className="text-sm font-semibold text-gray-800">${job.clientBillRate}/hr</span> : <span className="text-gray-300">—</span>}</td>
                        <td className="py-3.5 px-4">
                          {canEdit ? (
                            <select value={job.status} onChange={e => handleStatusChange(job.id, e.target.value as Job["status"])}
                              className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 cursor-pointer">
                              {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          ) : <StatusBadge status={job.status} />}
                        </td>
                        <td className="py-3.5 px-4">
                          {job.recruitmentManagerName ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                                {job.recruitmentManagerName.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()}
                              </div>
                              <span className="text-xs text-gray-600 truncate max-w-[100px]">{job.recruitmentManagerName}</span>
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3.5 px-4"><div className="flex items-center gap-1 text-sm text-gray-600"><Users className="h-3.5 w-3.5 text-gray-400" />{job.applicationsCount || 0}</div></td>
                        <td className="py-3.5 px-4"><span className="text-xs text-gray-500">{new Date(job.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span></td>
                        <td className="py-3.5 px-4">
                          {job.submissionDueDate
                            ? <div className="flex items-center gap-1 text-xs text-gray-500"><Calendar className="h-3.5 w-3.5 text-gray-400" />{new Date(job.submissionDueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                            : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                                <MoreHorizontal className="h-4 w-4" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-xl w-44">
                              <DropdownMenuItem onClick={() => router.push(`/admin/jobs/${job.id}`)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-gray-400" />View Details</DropdownMenuItem>
                              {canEdit && <>
                                <DropdownMenuItem onClick={() => openEdit(job)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-gray-400" />Edit</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDuplicate(job)} disabled={duplicating === job.id} className="text-sm rounded-lg cursor-pointer">
                                  {duplicating === job.id ? <Loader2 className="h-4 w-4 mr-2 animate-spin text-gray-400" /> : <Copy className="h-4 w-4 mr-2 text-gray-400" />}Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => setShowDeleteConfirm(job.id)} className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                                  <Trash2 className="h-4 w-4 mr-2" />Delete
                                </DropdownMenuItem>
                              </>}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredJobs.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Briefcase className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No jobs found</h3>
              <p className="text-sm text-gray-400 mb-5">{jobs.length === 0 ? "Post your first job to start tracking candidates" : "Try adjusting your search or filters"}</p>
              {jobs.length === 0 && canEdit && (
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />Post a Job
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[520px] p-0 flex flex-col gap-0">
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold text-gray-900">
                {drawerMode === "create" ? "Post a New Job" : "Edit Job Posting"}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 mt-0.5">
                {drawerMode === "create" ? "Fill in the details to create a new position." : "Update the job details below."}
              </SheetDescription>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleJobSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formError && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{formError}</p>
              </div>
            )}

            {/* Job title */}
            <div>
              <FieldLabel required>Job Title</FieldLabel>
              <FormInput
                placeholder="e.g. Senior Software Engineer"
                value={jobForm.title}
                onChange={e => setJobForm(p => ({ ...p, title: e.target.value }))}
              />
            </div>

            {/* Status + Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Status</FieldLabel>
                <FormSelect value={jobForm.status} onChange={e => setJobForm(p => ({ ...p, status: e.target.value as Job["status"] }))}>
                  {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </FormSelect>
              </div>
              <div>
                <FieldLabel required>Job Type</FieldLabel>
                <FormSelect value={jobForm.type} onChange={e => setJobForm(p => ({ ...p, type: e.target.value as Job["type"] }))}>
                  {JOB_TYPES.map(t => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </FormSelect>
              </div>
            </div>

            {/* Department + Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Department</FieldLabel>
                <FormInput placeholder="e.g. Engineering" value={jobForm.department} onChange={e => setJobForm(p => ({ ...p, department: e.target.value }))} />
              </div>
              <div>
                <FieldLabel required>City / Location</FieldLabel>
                <FormInput placeholder="e.g. Austin" value={jobForm.location} onChange={e => setJobForm(p => ({ ...p, location: e.target.value }))} />
              </div>
            </div>

            {/* State + Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>State</FieldLabel>
                <FormInput placeholder="e.g. TX" value={jobForm.state} onChange={e => setJobForm(p => ({ ...p, state: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Client Name</FieldLabel>
                <FormInput placeholder="e.g. Acme Corp" value={jobForm.clientName} onChange={e => setJobForm(p => ({ ...p, clientName: e.target.value }))} />
              </div>
            </div>

            {/* Pay Rate + Bill Rate */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Pay Rate ($/hr)</FieldLabel>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <FormInput className="pl-8" type="number" placeholder="0" min="0" value={jobForm.payRate} onChange={e => setJobForm(p => ({ ...p, payRate: e.target.value }))} />
                </div>
              </div>
              <div>
                <FieldLabel>Bill Rate ($/hr)</FieldLabel>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <FormInput className="pl-8" type="number" placeholder="0" min="0" value={jobForm.clientBillRate} onChange={e => setJobForm(p => ({ ...p, clientBillRate: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <FieldLabel required>Job Description</FieldLabel>
              <textarea
                rows={5}
                placeholder="Describe the role, responsibilities, and requirements…"
                value={jobForm.description}
                onChange={e => setJobForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => setDrawerOpen(false)}
                className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {drawerMode === "create" ? "Post Job" : "Save Changes"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete this job?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">This action is permanent and cannot be undone. All associated data will be removed.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
