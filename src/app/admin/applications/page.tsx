"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, Mail, Phone, Calendar, Eye, CheckCircle2, XCircle,
  Clock, MessageSquare, Star, Briefcase, Loader2, User, X, Trash2,
  Plus, Edit3, MapPin, Users, MoreHorizontal, AlertTriangle, Filter,
  ChevronDown, ArrowRight,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ApplicationWithJob extends Application {
  jobDepartment?: string;
  postedByName?: string;
  postedByEmail?: string;
}

// ── Config ────────────────────────────────────────────────────────────────────

const statusConfig: Record<string, { label: string; bg: string; dot: string; text: string; icon: React.FC<{ className?: string }> }> = {
  pending:   { label: "Pending",   bg: "bg-slate-100",   dot: "bg-slate-400",   text: "text-slate-700",   icon: Clock        },
  reviewing: { label: "Reviewing", bg: "bg-blue-100",    dot: "bg-blue-500",    text: "text-blue-700",    icon: Eye          },
  interview: { label: "Interview", bg: "bg-purple-100",  dot: "bg-purple-500",  text: "text-purple-700",  icon: MessageSquare},
  offered:   { label: "Offered",   bg: "bg-amber-100",   dot: "bg-amber-500",   text: "text-amber-700",   icon: Mail         },
  hired:     { label: "Hired",     bg: "bg-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle2 },
  rejected:  { label: "Rejected",  bg: "bg-rose-100",    dot: "bg-rose-500",    text: "text-rose-700",    icon: XCircle      },
  active:    { label: "Active",    bg: "bg-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700", icon: CheckCircle2 },
  inactive:  { label: "Inactive",  bg: "bg-slate-100",   dot: "bg-slate-400",   text: "text-slate-700",   icon: XCircle      },
};

const PIPELINE_STAGES = [
  { key: "pending",   label: "New",       color: "text-slate-600",   bar: "bg-slate-400"   },
  { key: "reviewing", label: "Screening", color: "text-blue-700",    bar: "bg-blue-500"    },
  { key: "interview", label: "Interview", color: "text-purple-700",  bar: "bg-purple-500"  },
  { key: "offered",   label: "Offered",   color: "text-amber-700",   bar: "bg-amber-500"   },
  { key: "hired",     label: "Hired",     color: "text-emerald-700", bar: "bg-emerald-500" },
];

const STATUS_TABS = [
  { key: "all",       label: "All"       },
  { key: "pending",   label: "Pending"   },
  { key: "reviewing", label: "Reviewing" },
  { key: "interview", label: "Interview" },
  { key: "offered",   label: "Offered"   },
  { key: "hired",     label: "Hired"     },
  { key: "rejected",  label: "Rejected"  },
] as const;

const WORK_AUTH_OPTIONS = [
  "US Citizen", "Green Card", "H1-B", "OPT", "CPT", "TN Visa", "Other",
];

const SOURCE_OPTIONS = [
  "LinkedIn", "Indeed", "Company Website", "Referral", "Agency", "Career Portal", "Other",
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

const defaultForm = {
  firstName: "", lastName: "", email: "", phone: "",
  status: "pending" as Application["status"],
  jobId: "", jobTitle: "",
  source: "" as Application["source"] | "",
  workAuthorization: "" as Application["workAuthorization"] | "",
  city: "", state: "",
  notes: "",
  skills: "",
  experience: "",
};

// ── Small UI helpers ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const sz = size === "lg" ? "w-11 h-11 text-sm" : size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]";
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {initials}
    </div>
  );
}

function StarRating({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onRate?.(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={`w-4 h-4 transition-colors ${onRate ? "cursor-pointer" : "cursor-default"}`}>
          <Star className={`w-4 h-4 ${(hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
        </button>
      ))}
    </div>
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
    <input {...props} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-gray-400 ${props.className ?? ""}`} />
  );
}

function FormSelect({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors text-gray-700 ${props.className ?? ""}`}>
      {children}
    </select>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [showFilters, setShowFilters]   = useState(false);
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Drawer
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [drawerMode, setDrawerMode]   = useState<"create" | "edit">("create");
  const [editingApp, setEditingApp]   = useState<ApplicationWithJob | null>(null);
  const [appForm, setAppForm]         = useState(defaultForm);
  const [submitting, setSubmitting]   = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);

  // ── Data ──────────────────────────────────────────────────────────────────

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, jobsRes] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
      const appsData = await appsRes.json();
      const jobsData = await jobsRes.json();
      if (!appsRes.ok || !jobsRes.ok) throw new Error("Failed to fetch data");

      const jobsArr: Job[] = jobsData.jobs || [];
      setJobs(jobsArr);
      const jobsMap = new Map(jobsArr.map(j => [j.id, j]));

      const enriched = (appsData.applications || []).map((a: Application) => {
        const job = a.jobId ? jobsMap.get(a.jobId) : null;
        return { ...a, jobTitle: a.jobTitle || job?.title || "", jobDepartment: job?.department || "", postedByName: job?.postedByName };
      });
      enriched.sort((a: ApplicationWithJob, b: ApplicationWithJob) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );
      setApplications(enriched);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const positions = [...new Set(applications.map(a => a.jobTitle).filter(Boolean))];

  const filteredApps = applications.filter(app => {
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || [app.name, app.email, app.applicationId, app.jobTitle, app.phone].some(f => f?.toLowerCase().includes(q));
    const matchStatus   = statusFilter   === "all" || app.status   === statusFilter;
    const matchPosition = positionFilter === "all" || app.jobTitle === positionFilter;
    return matchSearch && matchStatus && matchPosition;
  });

  const statusCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? applications.length : applications.filter(a => a.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>);

  const pipelineStats = PIPELINE_STAGES.map(s => ({
    ...s,
    count: applications.filter(a => a.status === s.key).length,
  }));

  // ── CRUD handlers ─────────────────────────────────────────────────────────

  const openCreate = () => {
    setDrawerMode("create");
    setEditingApp(null);
    setAppForm(defaultForm);
    setFormError(null);
    setDrawerOpen(true);
  };

  const openEdit = (app: ApplicationWithJob) => {
    setDrawerMode("edit");
    setEditingApp(app);
    setAppForm({
      firstName:         app.firstName || (app.name?.split(" ")[0] ?? ""),
      lastName:          app.lastName  || (app.name?.split(" ").slice(1).join(" ") ?? ""),
      email:             app.email || "",
      phone:             app.phone || "",
      status:            app.status || "pending",
      jobId:             app.jobId || "",
      jobTitle:          app.jobTitle || "",
      source:            app.source || "",
      workAuthorization: app.workAuthorization || "",
      city:              app.city || "",
      state:             app.state || "",
      notes:             app.notes || "",
      skills:            (app.skills || []).join(", "),
      experience:        app.experience || "",
    });
    setFormError(null);
    setDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.firstName.trim() || !appForm.email.trim()) {
      setFormError("First name and email are required.");
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        firstName:         appForm.firstName.trim(),
        lastName:          appForm.lastName.trim(),
        name:              `${appForm.firstName.trim()} ${appForm.lastName.trim()}`.trim(),
        email:             appForm.email.trim(),
        phone:             appForm.phone.trim(),
        status:            appForm.status,
        jobId:             appForm.jobId || undefined,
        jobTitle:          appForm.jobTitle || undefined,
        source:            appForm.source || undefined,
        workAuthorization: appForm.workAuthorization || undefined,
        city:              appForm.city,
        state:             appForm.state,
        notes:             appForm.notes,
        skills:            appForm.skills ? appForm.skills.split(",").map(s => s.trim()).filter(Boolean) : [],
        experience:        appForm.experience,
        createdBy:         user?.email || "admin",
        createdByName:     user?.name || "Admin",
      };

      if (drawerMode === "create") {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, userId: "anonymous", appliedAt: new Date().toISOString() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create application");
        await fetchData();
      } else {
        const res = await fetch(`/api/applications/${editingApp!.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update application");
        setApplications(prev => prev.map(a => a.id === editingApp!.id ? { ...a, ...data.application } : a));
      }
      setDrawerOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, changedBy: user?.id, changedByName: user?.name || "Admin" }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch {
      alert("Failed to update status");
      fetchData();
    }
  };

  const handleRatingChange = async (appId: string, rating: number) => {
    setApplications(prev => prev.map(a => a.id === appId ? { ...a, rating } : a));
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
    } catch { fetchData(); }
  };

  const handleDelete = async (appId: string) => {
    try {
      const res = await fetch(`/api/applications/${appId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setApplications(prev => prev.filter(a => a.id !== appId));
      setDeleteConfirm(null);
    } catch { alert("Failed to delete application"); }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => fetch(`/api/applications/${id}`, { method: "DELETE" })));
      setApplications(prev => prev.filter(a => !selectedIds.includes(a.id)));
      setSelectedIds([]);
      setBulkDeleteConfirm(false);
    } catch { alert("Failed to delete applications"); }
  };

  const exportCSV = () => {
    const headers = ["App ID","Name","Email","Phone","Job","Status","Source","Applied"];
    const rows = filteredApps.map(a => [
      a.applicationId || "", a.name || "", a.email, a.phone || "",
      a.jobTitle || "", a.status, a.source || "",
      new Date(a.appliedAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `applications_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // ── Loading / Error ───────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
        <p className="text-sm text-gray-500">Loading applications…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-600">{error}</p>
        <button onClick={fetchData} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Retry</button>
      </div>
    </div>
  );

  const allSelected = filteredApps.length > 0 && filteredApps.every(a => selectedIds.includes(a.id));

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Applications</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track candidates through the hiring pipeline</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Add Applicant
          </button>
        </div>
      </div>

      {/* ── ATS Pipeline strip ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-1 sm:gap-2">
          {pipelineStats.map((stage, i) => (
            <div key={stage.key} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
              <button
                onClick={() => setStatusFilter(statusFilter === stage.key ? "all" : stage.key)}
                className={`flex-1 min-w-0 text-center py-2 px-2 rounded-lg border transition-all ${
                  statusFilter === stage.key
                    ? "bg-blue-50 border-blue-300 ring-1 ring-blue-400"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}>
                <p className={`text-lg sm:text-xl font-bold leading-none ${stage.color}`}>{stage.count}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate font-medium">{stage.label}</p>
              </button>
              {i < pipelineStats.length - 1 && (
                <ArrowRight className="w-3 h-3 text-gray-300 flex-shrink-0 hidden sm:block" />
              )}
            </div>
          ))}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className="hidden sm:block w-px h-8 bg-gray-200" />
            <div className="text-center px-3">
              <p className="text-lg sm:text-xl font-bold text-rose-600 leading-none">{applications.filter(a => a.status === "rejected").length}</p>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1 font-medium">Rejected</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search name, email, job…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg font-medium transition-colors ${showFilters ? "bg-blue-50 border-blue-300 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
            <Filter className="w-4 h-4" />Filters
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-gray-500 font-medium">{selectedIds.length} selected</span>
              <button onClick={() => setBulkDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-rose-600 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
              <button onClick={() => setSelectedIds([])}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Extra filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-3 pt-1">
            <div className="min-w-[180px]">
              <FieldLabel>Position</FieldLabel>
              <FormSelect value={positionFilter} onChange={e => setPositionFilter(e.target.value)}>
                <option value="all">All Positions</option>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </FormSelect>
            </div>
          </div>
        )}

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

      <p className="text-xs text-gray-400 px-0.5 -mt-1">{filteredApps.length} of {applications.length} applications</p>

      {/* ── Mobile cards ── */}
      <div className="grid gap-3 lg:hidden">
        {filteredApps.length > 0 ? filteredApps.map(app => (
          <div key={app.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 hover:border-blue-200 transition-colors">
            <div className="flex items-start gap-3 mb-3">
              <Avatar name={app.name || app.email} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <button onClick={() => router.push(`/admin/applications/${app.id}`)} className="font-semibold text-sm text-gray-900 hover:text-blue-600 transition-colors text-left truncate">
                    {app.name || "—"}
                  </button>
                  <StatusBadge status={app.status} />
                </div>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{app.jobTitle || "No position"}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-gray-500 mb-3">
              <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" />{app.email}</div>
              {app.phone && <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" />{app.phone}</div>}
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <StarRating rating={app.rating || 0} onRate={r => handleRatingChange(app.id, r)} />
              <div className="flex items-center gap-1">
                <button onClick={() => router.push(`/admin/applications/${app.id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye className="h-4 w-4" /></button>
                <button onClick={() => openEdit(app)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"><Edit3 className="h-4 w-4" /></button>
                <button onClick={() => setDeleteConfirm(app.id)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </div>
        )) : (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <Users className="h-12 w-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No applications found</h3>
            <p className="text-sm text-gray-400 mb-4">{applications.length === 0 ? "Add your first applicant" : "Try adjusting your filters"}</p>
            {applications.length === 0 && <button onClick={openCreate} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add Applicant</button>}
          </div>
        )}
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" checked={allSelected}
                      onChange={e => setSelectedIds(e.target.checked ? filteredApps.map(a => a.id) : [])}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                    />
                  </th>
                  {["Applicant","Job","Status","Source","Applied","Rating","Actions"].map((h, i) => (
                    <th key={i} className={`py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider ${i === 6 ? "text-right" : "text-left"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredApps.map(app => (
                  <tr key={app.id} className={`hover:bg-blue-50/20 transition-colors group ${selectedIds.includes(app.id) ? "bg-blue-50/30" : ""}`}>
                    <td className="py-3.5 px-4">
                      <input type="checkbox" checked={selectedIds.includes(app.id)}
                        onChange={e => setSelectedIds(prev => e.target.checked ? [...prev, app.id] : prev.filter(id => id !== app.id))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={app.name || app.email} size="sm" />
                        <div className="min-w-0">
                          <button onClick={() => router.push(`/admin/applications/${app.id}`)}
                            className="text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors text-left block truncate max-w-[160px]">
                            {app.name || "—"}
                          </button>
                          <p className="text-xs text-gray-400 truncate max-w-[160px]">{app.email}</p>
                          {app.applicationId && (
                            <span className="font-mono text-[10px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded">{app.applicationId}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[160px]">{app.jobTitle || <span className="text-gray-300">No position</span>}</p>
                      {app.jobDepartment && <p className="text-xs text-gray-400 mt-0.5">{app.jobDepartment}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <select value={app.status}
                        onChange={e => handleStatusChange(app.id, e.target.value as Application["status"])}
                        className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-gray-700 cursor-pointer">
                        {Object.entries(statusConfig).map(([k, v]) => (
                          !["active","inactive"].includes(k) && <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{app.source || "—"}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <StarRating rating={app.rating || 0} onRate={r => handleRatingChange(app.id, r)} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 text-gray-300 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white border border-gray-200 shadow-lg rounded-xl w-44">
                          <DropdownMenuItem onClick={() => router.push(`/admin/applications/${app.id}`)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-gray-400" />View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(app)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-gray-400" />Edit</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setDeleteConfirm(app.id)} className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                            <Trash2 className="h-4 w-4 mr-2" />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredApps.length === 0 && (
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">No applications found</h3>
              <p className="text-sm text-gray-400 mb-5">{applications.length === 0 ? "Add your first candidate to get started" : "Try adjusting your search or filters"}</p>
              {applications.length === 0 && (
                <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                  <Plus className="w-4 h-4" />Add Applicant
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Create / Edit Drawer ── */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="right" showCloseButton={false} className="w-full sm:max-w-[540px] p-0 flex flex-col gap-0">
          <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <SheetTitle className="text-base font-bold text-gray-900">
                {drawerMode === "create" ? "Add New Applicant" : "Edit Applicant"}
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 mt-0.5">
                {drawerMode === "create" ? "Manually enter candidate details." : "Update the candidate information below."}
              </SheetDescription>
            </div>
            <button onClick={() => setDrawerOpen(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {formError && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-700">{formError}</p>
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>First Name</FieldLabel>
                <FormInput placeholder="Jane" value={appForm.firstName} onChange={e => setAppForm(p => ({ ...p, firstName: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Last Name</FieldLabel>
                <FormInput placeholder="Smith" value={appForm.lastName} onChange={e => setAppForm(p => ({ ...p, lastName: e.target.value }))} />
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel required>Email</FieldLabel>
                <FormInput type="email" placeholder="jane@example.com" value={appForm.email} onChange={e => setAppForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <FormInput type="tel" placeholder="+1 (555) 000-0000" value={appForm.phone} onChange={e => setAppForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>

            {/* Status + Job */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Status</FieldLabel>
                <FormSelect value={appForm.status} onChange={e => setAppForm(p => ({ ...p, status: e.target.value as Application["status"] }))}>
                  {Object.entries(statusConfig).filter(([k]) => !["active","inactive"].includes(k)).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </FormSelect>
              </div>
              <div>
                <FieldLabel>Job Position</FieldLabel>
                <FormSelect value={appForm.jobId} onChange={e => {
                  const job = jobs.find(j => j.id === e.target.value);
                  setAppForm(p => ({ ...p, jobId: e.target.value, jobTitle: job?.title || "" }));
                }}>
                  <option value="">Select a job…</option>
                  {jobs.filter(j => j.status === "open" || j.status === "active").map(j => (
                    <option key={j.id} value={j.id}>{j.title}</option>
                  ))}
                </FormSelect>
              </div>
            </div>

            {/* Source + Work Auth */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Source</FieldLabel>
                <FormSelect value={appForm.source} onChange={e => setAppForm(p => ({ ...p, source: e.target.value as Application["source"] }))}>
                  <option value="">Select source…</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </div>
              <div>
                <FieldLabel>Work Authorization</FieldLabel>
                <FormSelect value={appForm.workAuthorization} onChange={e => setAppForm(p => ({ ...p, workAuthorization: e.target.value as Application["workAuthorization"] }))}>
                  <option value="">Select…</option>
                  {WORK_AUTH_OPTIONS.map(w => <option key={w} value={w}>{w}</option>)}
                </FormSelect>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>City</FieldLabel>
                <FormInput placeholder="Austin" value={appForm.city} onChange={e => setAppForm(p => ({ ...p, city: e.target.value }))} />
              </div>
              <div>
                <FieldLabel>State</FieldLabel>
                <FormSelect value={appForm.state} onChange={e => setAppForm(p => ({ ...p, state: e.target.value }))}>
                  <option value="">Select state…</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </FormSelect>
              </div>
            </div>

            {/* Skills */}
            <div>
              <FieldLabel>Skills <span className="text-gray-400 font-normal">(comma-separated)</span></FieldLabel>
              <FormInput placeholder="React, TypeScript, Node.js…" value={appForm.skills} onChange={e => setAppForm(p => ({ ...p, skills: e.target.value }))} />
            </div>

            {/* Experience */}
            <div>
              <FieldLabel>Experience Summary</FieldLabel>
              <textarea rows={2} placeholder="Brief experience summary…" value={appForm.experience}
                onChange={e => setAppForm(p => ({ ...p, experience: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-gray-400 resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <FieldLabel>Internal Notes</FieldLabel>
              <textarea rows={3} placeholder="Add any notes about this candidate…" value={appForm.notes}
                onChange={e => setAppForm(p => ({ ...p, notes: e.target.value }))}
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
                {drawerMode === "create" ? "Add Applicant" : "Save Changes"}
              </button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* ── Delete single confirmation ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete application?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">This action is permanent and cannot be undone.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk delete confirmation ── */}
      {bulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""}?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 leading-relaxed">This action is permanent and cannot be undone.</p>
            <div className="flex items-center gap-3">
              <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleBulkDelete} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors">Yes, Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
