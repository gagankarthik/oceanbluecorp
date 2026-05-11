"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Download, Calendar, Eye, Star, Loader2, X, Trash2, Plus, Edit3, Users,
  MoreHorizontal, AlertTriangle, ChevronDown, ArrowRight,
  LayoutList, Columns, AlignJustify, BookmarkCheck,
  SlidersHorizontal, ArrowUpDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import { PageLoading } from "@/components/ui/ocean-spinner";
import { useAdmin } from "@/components/admin/admin-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface App extends Application {
  jobDepartment?: string;
}

type ViewMode  = "table" | "kanban" | "list";
type SortField = "name" | "jobTitle" | "status" | "source" | "appliedAt" | "rating";
type SortDir   = "asc" | "desc";

// ── Config ─────────────────────────────────────────────────────────────────────

const STAGE_META: Record<string, { label: string; bg: string; hdr: string; dot: string; text: string; ring: string }> = {
  pending:   { label: "New",       bg: "bg-slate-50",    hdr: "bg-slate-100",   dot: "bg-slate-400",   text: "text-slate-700",   ring: "ring-slate-200"   },
  reviewing: { label: "Screening", bg: "bg-blue-50",     hdr: "bg-blue-100",    dot: "bg-blue-500",    text: "text-blue-700",    ring: "ring-blue-200"    },
  interview: { label: "Interview", bg: "bg-violet-50",   hdr: "bg-violet-100",  dot: "bg-violet-500",  text: "text-violet-700",  ring: "ring-violet-200"  },
  offered:   { label: "Offered",   bg: "bg-amber-50",    hdr: "bg-amber-100",   dot: "bg-amber-500",   text: "text-amber-700",   ring: "ring-amber-200"   },
  hired:     { label: "Hired",     bg: "bg-emerald-50",  hdr: "bg-emerald-100", dot: "bg-emerald-500", text: "text-emerald-700", ring: "ring-emerald-200" },
  rejected:  { label: "Rejected",  bg: "bg-rose-50",     hdr: "bg-rose-100",    dot: "bg-rose-500",    text: "text-rose-700",    ring: "ring-rose-200"    },
};

const PIPELINE = ["pending","reviewing","interview","offered","hired"] as const;
const KANBAN_COLS = [...PIPELINE, "rejected"] as const;
const ALL_STATUSES = [...KANBAN_COLS] as string[];

const STATUS_FILTERS = [
  { key: "all",       label: "All"       },
  ...KANBAN_COLS.map(k => ({ key: k, label: STAGE_META[k].label })),
];

const SOURCE_OPTIONS = ["LinkedIn","Indeed","Company Website","Referral","Agency","Career Portal","Other"];
const WORK_AUTH_OPTIONS = ["US Citizen","Green Card","H1-B","H4 EAD","OPT","CPT","TN Visa","E3 Visa","L1 Visa","Other"];

// ── Tiny helpers ───────────────────────────────────────────────────────────────

function Avatar({ name, size = "md" }: { name: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase() || "?";
  const sz = { xs: "w-6 h-6 text-[9px]", sm: "w-8 h-8 text-[10px]", md: "w-9 h-9 text-xs", lg: "w-11 h-11 text-sm" }[size];
  return (
    <div className={cn("rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white flex-shrink-0", sz)}>
      {initials}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const m = STAGE_META[status] ?? STAGE_META.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold", m.bg, m.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", m.dot)} />
      {m.label}
    </span>
  );
}

function Stars({ rating, onRate }: { rating: number; onRate?: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button"
          onClick={() => onRate?.(n === rating ? 0 : n)}
          onMouseEnter={() => onRate && setHover(n)}
          onMouseLeave={() => setHover(0)}
          className={cn("transition-colors", onRate ? "cursor-pointer" : "cursor-default pointer-events-none")}>
          <Star className={cn("w-3.5 h-3.5", (hover || rating) >= n ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
        </button>
      ))}
    </div>
  );
}

function fmt(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const { openCandidateEditor, candidateRevision, setJobs: setCtxJobs } = useAdmin();

  // ── Data state
  const [applications, setApplications] = useState<App[]>([]);
  const [jobs,         setJobs]         = useState<Job[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // ── View / sort
  const [view,     setView]     = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("appliedAt");
  const [sortDir,   setSortDir]   = useState<SortDir>("desc");

  // ── Filters
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [posFilter,    setPosFilter]    = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [authFilter,   setAuthFilter]   = useState("all");
  const [minRating,    setMinRating]    = useState(0);
  const [dateFrom,     setDateFrom]     = useState("");
  const [dateTo,       setDateTo]       = useState("");
  const [filtersOpen,  setFiltersOpen]  = useState(false);

  // ── Selection + modals
  const [selected,       setSelected]       = useState<string[]>([]);
  const [deleteId,       setDeleteId]       = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => { load(); }, [candidateRevision]);

  const load = async () => {
    try {
      setLoading(true);
      const [ar, jr] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
      const ad = await ar.json(); const jd = await jr.json();
      if (!ar.ok || !jr.ok) throw new Error("Failed to fetch");
      const jArr: Job[] = jd.jobs || [];
      setJobs(jArr); setCtxJobs(jArr);
      const jMap = new Map(jArr.map(j => [j.id, j]));
      const list: App[] = (ad.applications || []).map((a: Application) => {
        const j = a.jobId ? jMap.get(a.jobId) : null;
        return { ...a, jobTitle: a.jobTitle || j?.title || "", jobDepartment: j?.department || "" };
      });
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setApplications(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const positions = useMemo(() => [...new Set(applications.map(a => a.jobTitle).filter(Boolean))], [applications]);

  const activeFilterCount = [
    posFilter !== "all", sourceFilter !== "all", authFilter !== "all",
    minRating > 0, !!dateFrom, !!dateTo,
  ].filter(Boolean).length;

  const filtered = useMemo(() => applications.filter(a => {
    const q = search.toLowerCase();
    if (q && ![ a.name, a.email, a.applicationId, a.jobTitle, a.phone ].some(f => f?.toLowerCase().includes(q))) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (posFilter    !== "all" && a.jobTitle !== posFilter)  return false;
    if (sourceFilter !== "all" && a.source   !== sourceFilter) return false;
    if (authFilter   !== "all" && a.workAuthorization !== authFilter) return false;
    if (minRating > 0 && (a.rating || 0) < minRating) return false;
    if (dateFrom && new Date(a.appliedAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(a.appliedAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [applications, search, statusFilter, posFilter, sourceFilter, authFilter, minRating, dateFrom, dateTo]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va: string | number = "", vb: string | number = "";
      if (sortField === "name")      { va = a.name || ""; vb = b.name || ""; }
      if (sortField === "jobTitle")  { va = a.jobTitle || ""; vb = b.jobTitle || ""; }
      if (sortField === "status")    { va = a.status || ""; vb = b.status || ""; }
      if (sortField === "source")    { va = a.source || ""; vb = b.source || ""; }
      if (sortField === "appliedAt") { va = a.appliedAt; vb = b.appliedAt; }
      if (sortField === "rating")    { va = a.rating || 0; vb = b.rating || 0; }
      return (va < vb ? -1 : va > vb ? 1 : 0) * (sortDir === "asc" ? 1 : -1);
    });
    return arr;
  }, [filtered, sortField, sortDir]);

  const pipelineCounts = useMemo(() =>
    Object.fromEntries(ALL_STATUSES.map(s => [s, applications.filter(a => a.status === s).length])),
  [applications]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const sort = (f: SortField) => {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(f); setSortDir("asc"); }
  };

  const patchStatus = async (id: string, status: Application["status"]) => {
    setApplications(p => p.map(a => a.id === id ? { ...a, status } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, changedBy: user?.id, changedByName: user?.name || "Admin" }),
    }).catch(() => { alert("Failed to update status"); load(); });
  };

  const patchRating = async (id: string, rating: number) => {
    setApplications(p => p.map(a => a.id === id ? { ...a, rating } : a));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }),
    }).catch(() => load());
  };

  const deleteOne = async (id: string) => {
    await fetch(`/api/applications/${id}`, { method: "DELETE" });
    setApplications(p => p.filter(a => a.id !== id));
    setDeleteId(null);
  };

  const deleteBulk = async () => {
    await Promise.all(selected.map(id => fetch(`/api/applications/${id}`, { method: "DELETE" })));
    setApplications(p => p.filter(a => !selected.includes(a.id)));
    setSelected([]); setBulkDeleteOpen(false);
  };

  const exportCSV = () => {
    const headers = ["ID","Name","Email","Phone","Job","Status","Source","Work Auth","Applied","Rating"];
    const rows = sorted.map(a => [
      a.applicationId||"", a.name||"", a.email, a.phone||"",
      a.jobTitle||"", a.status, a.source||"", a.workAuthorization||"",
      fmt(a.appliedAt), String(a.rating||""),
    ]);
    const csv = [headers,...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `applications_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setPosFilter("all");
    setSourceFilter("all"); setAuthFilter("all"); setMinRating(0);
    setDateFrom(""); setDateTo("");
  };

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return <PageLoading label="Loading applications…" />;
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-600">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Retry</button>
      </div>
    </div>
  );

  const allSelected = sorted.length > 0 && sorted.every(a => selected.includes(a.id));

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{applications.length} total · {filtered.length} matching filters</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
            <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
          </button>
          <button onClick={() => openCandidateEditor({ mode: "create" })}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm">
            <Plus className="w-4 h-4" />Add Applicant
          </button>
        </div>
      </div>

      {/* ── Pipeline overview ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          {PIPELINE.map((key, i) => {
            const m = STAGE_META[key];
            const count = pipelineCounts[key] || 0;
            const active = statusFilter === key;
            return (
              <div key={key} className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <button onClick={() => setStatusFilter(active ? "all" : key)}
                  className={cn("flex-1 min-w-0 text-center py-2 px-2 rounded-lg border transition-all",
                    active ? `${m.bg} border-current ${m.text} ring-1 ring-current/30` : "border-slate-200 hover:border-slate-300 hover:bg-slate-50")}>
                  <p className={cn("text-xl font-bold leading-none", active ? m.text : "text-slate-700")}>{count}</p>
                  <p className="text-[10px] sm:text-xs text-slate-500 mt-1 truncate font-medium">{m.label}</p>
                </button>
                {i < PIPELINE.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 flex-shrink-0 hidden sm:block" />}
              </div>
            );
          })}
          <div className="hidden sm:block w-px h-8 bg-slate-200 mx-1 flex-shrink-0" />
          <button onClick={() => setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")}
            className={cn("text-center px-3 py-2 rounded-lg border transition-all flex-shrink-0",
              statusFilter === "rejected" ? "bg-rose-50 border-rose-300 text-rose-700 ring-1 ring-rose-200" : "border-slate-200 hover:bg-slate-50")}>
            <p className={cn("text-xl font-bold leading-none", statusFilter === "rejected" ? "text-rose-700" : "text-slate-700")}>{pipelineCounts.rejected || 0}</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 font-medium">Rejected</p>
          </button>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-3 space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input type="text" placeholder="Search name, email, job, ID…" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors" />
          </div>

          {/* Filters toggle */}
          <button onClick={() => setFiltersOpen(v => !v)}
            className={cn("inline-flex items-center gap-1.5 px-3 py-2 text-sm border rounded-lg font-medium transition-colors",
              filtersOpen || activeFilterCount > 0 ? "bg-blue-50 border-blue-300 text-blue-700" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
            <SlidersHorizontal className="w-4 h-4" />Filters
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full leading-none">{activeFilterCount}</span>
            )}
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", filtersOpen && "rotate-180")} />
          </button>

          {/* View switcher */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
            {([
              { mode: "table",  Icon: LayoutList,   title: "Table"  },
              { mode: "kanban", Icon: Columns,       title: "Kanban" },
              { mode: "list",   Icon: AlignJustify,  title: "List"   },
            ] as const).map(({ mode, Icon, title }, i) => (
              <button key={mode} title={title} onClick={() => setView(mode)}
                className={cn("px-3 py-2 text-xs font-medium transition-colors flex items-center gap-1.5",
                  i > 0 && "border-l border-slate-200",
                  view === mode ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100")}>
                <Icon className="w-3.5 h-3.5" /><span className="hidden sm:inline">{title}</span>
              </button>
            ))}
          </div>

          {/* Bulk actions */}
          {selected.length > 0 && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-slate-500 font-medium">{selected.length} selected</span>
              <button onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors">
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
              <button onClick={() => setSelected([])} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Expandable filters */}
        {filtersOpen && (
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Position</label>
                <select value={posFilter} onChange={e => setPosFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700">
                  <option value="all">All Positions</option>
                  {positions.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Source</label>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700">
                  <option value="all">All Sources</option>
                  {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Work Auth</label>
                <select value={authFilter} onChange={e => setAuthFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700">
                  <option value="all">All</option>
                  {WORK_AUTH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Min Rating</label>
                <div className="flex items-center gap-1 py-1">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setMinRating(n === minRating ? 0 : n)}>
                      <Star className={cn("w-5 h-5 transition-colors", n <= minRating ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300")} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Applied From</label>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Applied To</label>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700" />
              </div>
            </div>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline">
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Status pills */}
        <div className="flex flex-wrap gap-1">
          {STATUS_FILTERS.map(tab => {
            const count = tab.key === "all" ? applications.length : pipelineCounts[tab.key] || 0;
            const active = statusFilter === tab.key;
            return (
              <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  active ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100")}>
                {tab.label}
                <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                  active ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Views ── */}
      {view === "table" && (
        <TableView
          apps={sorted} allSelected={allSelected} selected={selected}
          onSelectAll={all => setSelected(all ? sorted.map(a => a.id) : [])}
          onSelect={(id, on) => setSelected(p => on ? [...p, id] : p.filter(x => x !== id))}
          onView={id => router.push(`/admin/candidates/${id}`)}
          onEdit={app => openCandidateEditor({ candidate: app, mode: "edit" })}
          onDelete={setDeleteId}
          onStatusChange={patchStatus}
          onRating={patchRating}
          sortField={sortField} sortDir={sortDir} onSort={sort}
          empty={applications.length === 0}
          onAdd={() => openCandidateEditor({ mode: "create" })}
        />
      )}

      {view === "kanban" && (
        <KanbanView
          apps={filtered}
          onView={id => router.push(`/admin/candidates/${id}`)}
          onEdit={app => openCandidateEditor({ candidate: app, mode: "edit" })}
          onDelete={setDeleteId}
          onStatusChange={patchStatus}
          onRating={patchRating}
        />
      )}

      {view === "list" && (
        <ListView
          apps={sorted}
          onView={id => router.push(`/admin/candidates/${id}`)}
          onEdit={app => openCandidateEditor({ candidate: app, mode: "edit" })}
          onDelete={setDeleteId}
          onStatusChange={patchStatus}
          onRating={patchRating}
          empty={applications.length === 0}
          onAdd={() => openCandidateEditor({ mode: "create" })}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteId && (
        <Modal>
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete application?</h3>
          <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">This action is permanent and cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={() => deleteOne(deleteId)} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700">Delete</button>
          </div>
        </Modal>
      )}

      {bulkDeleteOpen && (
        <Modal>
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete {selected.length} application{selected.length > 1 ? "s" : ""}?</h3>
          <p className="text-sm text-slate-500 text-center mb-6">This is permanent and cannot be undone.</p>
          <div className="flex gap-3">
            <button onClick={() => setBulkDeleteOpen(false)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={deleteBulk} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700">Delete All</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── TABLE VIEW ─────────────────────────────────────────────────────────────────

interface SharedProps {
  apps: App[];
  onView: (id: string) => void;
  onEdit: (app: App) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
  onRating: (id: string, r: number) => void;
}

function TableView({ apps, allSelected, selected, onSelectAll, onSelect, sortField, sortDir, onSort, empty, onAdd, ...shared }: SharedProps & {
  allSelected: boolean; selected: string[];
  onSelectAll: (all: boolean) => void;
  onSelect: (id: string, on: boolean) => void;
  sortField: SortField; sortDir: SortDir; onSort: (f: SortField) => void;
  empty: boolean; onAdd: () => void;
}) {
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
  };
  const Th = ({ field, label, className }: { field?: SortField; label: string; className?: string }) => (
    <th className={cn("py-3 px-4 text-left", className)}>
      {field ? (
        <button onClick={() => onSort(field)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors">
          {label}<SortIcon field={field} />
        </button>
      ) : (
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      )}
    </th>
  );

  if (apps.length === 0 && empty) return <EmptyState onAdd={onAdd} />;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {apps.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No results</p>
          <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" checked={allSelected} onChange={e => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                </th>
                <Th field="name"      label="Applicant" />
                <Th field="jobTitle"  label="Job" />
                <Th field="status"    label="Stage" />
                <Th field="source"    label="Source" />
                <Th field="appliedAt" label="Applied" />
                <Th field="rating"    label="Rating" />
                <th className="py-3 px-4 text-right">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map(app => (
                <tr key={app.id} className={cn("hover:bg-blue-50/20 transition-colors group", selected.includes(app.id) && "bg-blue-50/30")}>
                  <td className="py-3.5 px-4">
                    <input type="checkbox" checked={selected.includes(app.id)}
                      onChange={e => onSelect(app.id, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 cursor-pointer" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={app.name || app.email} size="sm" />
                      <div className="min-w-0">
                        <button onClick={() => shared.onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left block truncate max-w-[160px]">
                          {app.name || "—"}
                        </button>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{app.email}</p>
                        {app.applicationId && <span className="font-mono text-[10px] text-blue-500 bg-blue-50 px-1 py-0.5 rounded">{app.applicationId}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[160px]">{app.jobTitle || <span className="text-slate-300">—</span>}</p>
                    {app.jobDepartment && <p className="text-xs text-slate-400 mt-0.5">{app.jobDepartment}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <select value={app.status} onChange={e => shared.onStatusChange(app.id, e.target.value as Application["status"])}
                      className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 cursor-pointer">
                      {ALL_STATUSES.map(s => <option key={s} value={s}>{STAGE_META[s].label}</option>)}
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {app.source
                      ? <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{app.source}</span>
                      : <span className="text-slate-300 text-sm">—</span>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {fmt(app.appliedAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <Stars rating={app.rating || 0} onRate={r => shared.onRating(app.id, r)} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 text-slate-300 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg rounded-xl w-44">
                        <DropdownMenuItem onClick={() => shared.onView(app.id)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-slate-400" />View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => shared.onEdit(app)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-slate-400" />Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => shared.onDelete(app.id)} className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
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
      )}
    </div>
  );
}

// ── KANBAN VIEW ────────────────────────────────────────────────────────────────

function KanbanView({ apps, ...shared }: SharedProps) {
  const [dragId, setDragId]       = React.useState<string | null>(null);
  const [dragOver, setDragOver]   = React.useState<string | null>(null);

  const grouped = useMemo(() =>
    Object.fromEntries(KANBAN_COLS.map(k => [k, apps.filter(a => a.status === k)])),
  [apps]);

  const handleDrop = (col: string) => {
    if (dragId && dragId !== col) {
      const app = apps.find(a => a.id === dragId);
      if (app && app.status !== col) {
        shared.onStatusChange(dragId, col as Application["status"]);
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLS.map(col => {
          const m    = STAGE_META[col];
          const list = grouped[col] || [];
          const isOver = dragOver === col;
          return (
            <div key={col} className="w-64 flex flex-col"
              onDragOver={e => { e.preventDefault(); setDragOver(col); }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={() => handleDrop(col)}>
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-xl border border-b-0 transition-colors", m.hdr, m.ring, isOver && "ring-2 ring-blue-400")}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", m.dot)} />
                  <span className={cn("text-xs font-bold uppercase tracking-wider", m.text)}>{m.label}</span>
                </div>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", m.bg, m.text)}>{list.length}</span>
              </div>
              {/* Cards */}
              <div className={cn(
                "flex-1 border border-t-0 rounded-b-xl overflow-y-auto max-h-[calc(100vh-380px)] min-h-[120px] p-2 space-y-2 transition-colors",
                m.bg, m.ring,
                isOver && "ring-2 ring-blue-400 ring-inset bg-blue-50/40",
              )}>
                {list.length === 0 ? (
                  <div className={cn("py-8 text-center rounded-xl border-2 border-dashed transition-colors", isOver ? "border-blue-300" : "border-transparent")}>
                    <p className="text-xs text-slate-400 font-medium">{isOver ? "Drop here" : "No applicants"}</p>
                  </div>
                ) : list.map(app => (
                  <KanbanCard key={app.id} app={app} apps={apps} isDragging={dragId === app.id}
                    onDragStart={() => setDragId(app.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    {...shared} />
                ))}
                {list.length > 0 && isOver && (
                  <div className="h-14 border-2 border-dashed border-blue-300 rounded-xl flex items-center justify-center">
                    <p className="text-xs text-blue-400 font-semibold">Drop here</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KanbanCard({ app, onView, onEdit, onDelete, onStatusChange, onRating, isDragging, onDragStart, onDragEnd }: SharedProps & {
  app: App;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const skills = (app.skills || []).slice(0, 3);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 scale-95 shadow-none",
      )}>
      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <Avatar name={app.name || app.email} size="sm" />
        <div className="flex-1 min-w-0">
          <button onClick={() => onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left block truncate w-full">
            {app.name || "—"}
          </button>
          {app.jobTitle && <p className="text-xs text-slate-500 truncate mt-0.5">{app.jobTitle}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-1 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg rounded-xl w-44">
            <DropdownMenuItem onClick={() => onView(app.id)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-slate-400" />View Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(app)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-slate-400" />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Move to</p>
              {KANBAN_COLS.filter(c => c !== app.status).map(c => (
                <button key={c} onClick={() => onStatusChange(app.id, c as Application["status"])}
                  className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", STAGE_META[c].dot)} />{STAGE_META[c].label}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(app.id)} className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
              <Trash2 className="h-4 w-4 mr-2" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {skills.map(s => <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>)}
          {(app.skills || []).length > 3 && <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-full">+{(app.skills || []).length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <Stars rating={app.rating || 0} onRate={r => onRating(app.id, r)} />
        <div className="flex items-center gap-1 text-[10px] text-slate-400">
          <Calendar className="w-3 h-3" />
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      </div>

      {app.source && (
        <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{app.source}</p>
      )}
    </div>
  );
}

// ── LIST VIEW ──────────────────────────────────────────────────────────────────

function ListView({ apps, empty, onAdd, ...shared }: SharedProps & { empty: boolean; onAdd: () => void }) {
  if (apps.length === 0 && empty) return <EmptyState onAdd={onAdd} />;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {apps.length === 0 ? (
        <div className="py-16 text-center">
          <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600 mb-1">No results</p>
          <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {apps.map(app => {
            const skills = (app.skills || []).slice(0, 4);
            return (
              <div key={app.id} className="px-4 py-3.5 hover:bg-blue-50/20 transition-colors group flex items-center gap-4">
                {/* Avatar */}
                <Avatar name={app.name || app.email} size="md" />

                {/* Main info */}
                <div className="flex-1 min-w-0 grid sm:grid-cols-3 gap-2">
                  {/* Col 1: identity */}
                  <div className="min-w-0">
                    <button onClick={() => shared.onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left block truncate">
                      {app.name || "—"}
                    </button>
                    <p className="text-xs text-slate-400 truncate">{app.email}</p>
                    {app.phone && <p className="text-xs text-slate-400 truncate">{app.phone}</p>}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {skills.map(s => <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-50 text-blue-700 rounded-full border border-blue-100">{s}</span>)}
                        {(app.skills || []).length > 4 && <span className="px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-full">+{(app.skills || []).length - 4}</span>}
                      </div>
                    )}
                  </div>

                  {/* Col 2: position + source */}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{app.jobTitle || <span className="text-slate-300">No position</span>}</p>
                    {app.jobDepartment && <p className="text-xs text-slate-400 mt-0.5">{app.jobDepartment}</p>}
                    {app.source && <span className="inline-flex items-center mt-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{app.source}</span>}
                    {app.workAuthorization && <p className="text-xs text-slate-400 mt-1">{app.workAuthorization}</p>}
                  </div>

                  {/* Col 3: meta */}
                  <div className="flex sm:flex-col sm:items-end gap-2">
                    <StatusBadge status={app.status} />
                    <Stars rating={app.rating || 0} onRate={r => shared.onRating(app.id, r)} />
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />{fmt(app.appliedAt)}
                    </div>
                    {app.addToTalentBench && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <BookmarkCheck className="w-3 h-3" />Bench
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => shared.onView(app.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View profile">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => shared.onEdit(app)} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Edit">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button onClick={() => shared.onDelete(app.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── SHARED HELPERS ─────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">No applicants yet</h3>
      <p className="text-sm text-slate-400 mb-5">Add your first candidate to start tracking the pipeline.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700">
        <Plus className="w-4 h-4" />Add Applicant
      </button>
    </div>
  );
}

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">{children}</div>
    </div>
  );
}
