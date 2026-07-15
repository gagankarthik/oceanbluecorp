"use client";
import { toast } from "sonner";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Download, Calendar, Eye, Star, X, Trash2, Plus, Edit3, Users,
  MoreHorizontal, AlertTriangle, Filter, ChevronDown,
  LayoutList, Columns, AlignJustify, BookmarkCheck,
  ArrowUpDown, ArrowUp, ArrowDown, XCircle,
} from "lucide-react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import ApplicationsLoading from "./loading";
import { useAdmin } from "@/components/admin/admin-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AdminCard } from "@/components/admin/admin-card";
import { SearchInput, FilterToggle, ViewMenu, BulkBar } from "@/components/admin/toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { statusMeta, tones, type AppStatus, type Tone } from "@/components/admin/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";

// ── Types ──────────────────────────────────────────────────────────────────────

interface App extends Application {
  jobDepartment?: string;
}

type ViewMode  = "table" | "kanban" | "list";
type SortField = "name" | "jobTitle" | "status" | "source" | "appliedAt" | "rating";
type SortDir   = "asc" | "desc";

// ── Config ─────────────────────────────────────────────────────────────────────

const PIPELINE = ["pending", "reviewing", "submitted", "interview", "offered", "hired"] as const;
const KANBAN_COLS = [...PIPELINE, "rejected"] as const;
const ALL_STATUSES = [...KANBAN_COLS] as string[];

// Stage hex colors for the pipeline flow (gradients/inline styles need hex, not classes).
const STAGE_COLOR: Record<string, string> = {
  pending:   "#94a3b8",
  reviewing: "#1d4ed8",
  submitted: "#4f46e5",
  interview: "#8b5cf6",
  offered:   "#f59e0b",
  hired:     "#10b981",
  rejected:  "#f43f5e",
};

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  ...KANBAN_COLS.map((k) => ({ key: k, label: statusMeta[k as AppStatus].label })),
];

const SOURCE_OPTIONS = ["LinkedIn", "Indeed", "Company Website", "Referral", "Agency", "Career Portal", "Other"];
const WORK_AUTH_OPTIONS = ["US Citizen", "Green Card", "H1-B", "H4 EAD", "OPT", "CPT", "TN Visa", "E3 Visa", "L1 Visa", "Other"];

const sLabel = (s: string) => statusMeta[s as AppStatus]?.label ?? s;
const sTone = (s: string): Tone => statusMeta[s as AppStatus]?.tone ?? "slate";

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const { openCandidateEditor, candidateRevision, setJobs: setCtxJobs } = useAdmin();

  // ── Data state
  const [applications, setApplications] = useState<App[]>([]);
  const [, setJobs]    = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  // ── View / sort
  const [view, setView]           = useState<ViewMode>("table");
  const [sortField, setSortField] = useState<SortField>("appliedAt");
  const [sortDir, setSortDir]     = useState<SortDir>("desc");

  // ── Filters
  const [search, setSearch]             = useState("");
  const debouncedSearch                 = useDebouncedValue(search, 250);
  const [statusFilter, setStatusFilter] = useState("all");
  const [posFilter, setPosFilter]       = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [authFilter, setAuthFilter]     = useState("all");
  const [minRating, setMinRating]       = useState(0);
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [filtersOpen, setFiltersOpen]   = useState(false);
  const [pipelineOpen, setPipelineOpen] = useState(true);

  // ── Selection + modals
  const [selected, setSelected]             = useState<string[]>([]);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting]             = useState(false);

  // ── Deep-link filters (dashboard drill-through: ?status=…&view=…) ───────────
  // Read straight from the URL on mount so we don't need a Suspense boundary.
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const status = sp.get("status");
    if (status) setStatusFilter(status);
    const v = sp.get("view");
    if (v === "table" || v === "kanban" || v === "list") setView(v as ViewMode);
  }, []);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [candidateRevision]);

  const load = async () => {
    try {
      setLoading(true);
      const [ar, jr] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
      const ad = await ar.json(); const jd = await jr.json();
      if (!ar.ok || !jr.ok) throw new Error("Failed to fetch");
      const jArr: Job[] = jd.jobs || [];
      setJobs(jArr); setCtxJobs(jArr);
      const jMap = new Map(jArr.map((j) => [j.id, j]));
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

  const positions = useMemo(() => [...new Set(applications.map((a) => a.jobTitle).filter(Boolean))], [applications]);

  const activeFilterCount = [
    posFilter !== "all", sourceFilter !== "all", authFilter !== "all",
    minRating > 0, !!dateFrom, !!dateTo,
  ].filter(Boolean).length;

  const filtered = useMemo(() => applications.filter((a) => {
    const q = debouncedSearch.toLowerCase();
    if (q && ![a.name, a.email, a.applicationId, a.jobTitle, a.phone].some((f) => f?.toLowerCase().includes(q))) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (posFilter    !== "all" && a.jobTitle !== posFilter) return false;
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (authFilter   !== "all" && a.workAuthorization !== authFilter) return false;
    if (minRating > 0 && (a.rating || 0) < minRating) return false;
    if (dateFrom && new Date(a.appliedAt) < new Date(dateFrom)) return false;
    if (dateTo   && new Date(a.appliedAt) > new Date(dateTo + "T23:59:59")) return false;
    return true;
  }), [applications, debouncedSearch, statusFilter, posFilter, sourceFilter, authFilter, minRating, dateFrom, dateTo]);

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
    Object.fromEntries(ALL_STATUSES.map((s) => [s, applications.filter((a) => a.status === s).length])),
  [applications]);
  const pipelineMax = Math.max(1, ...PIPELINE.map((k) => pipelineCounts[k] || 0));

  // ── Handlers ───────────────────────────────────────────────────────────────

  const sort = (f: SortField) => {
    if (sortField === f) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(f); setSortDir("asc"); }
  };

  const patchStatus = async (id: string, status: Application["status"]) => {
    setApplications((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, changedBy: user?.id, changedByName: user?.name || "Admin" }),
    }).catch(() => { toast.error("Failed to update status"); load(); });
  };

  const patchRating = async (id: string, rating: number) => {
    setApplications((p) => p.map((a) => (a.id === id ? { ...a, rating } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }),
    }).catch(() => load());
  };

  const deleteOne = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/applications/${deleteId}`, { method: "DELETE" });
      setApplications((p) => p.filter((a) => a.id !== deleteId));
      toast.success("Application deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const deleteBulk = async () => {
    setDeleting(true);
    try {
      await Promise.all(selected.map((id) => fetch(`/api/applications/${id}`, { method: "DELETE" })));
      setApplications((p) => p.filter((a) => !selected.includes(a.id)));
      toast.success(`${selected.length} application${selected.length > 1 ? "s" : ""} deleted`);
      setSelected([]);
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); setBulkDeleteOpen(false); }
  };

  const exportCSV = () => {
    const headers = ["ID", "Name", "Email", "Phone", "Job", "Status", "Source", "Work Auth", "Applied", "Rating"];
    const rows = sorted.map((a) => [
      a.applicationId || "", a.name || "", a.email, a.phone || "",
      a.jobTitle || "", a.status, a.source || "", a.workAuthorization || "",
      fmtDate(a.appliedAt), String(a.rating || ""),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = `applications_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setPosFilter("all");
    setSourceFilter("all"); setAuthFilter("all"); setMinRating(0);
    setDateFrom(""); setDateTo("");
  };

  // active-filter chips
  const filterChips: { label: string; clear: () => void }[] = [
    ...(posFilter !== "all" ? [{ label: `Position: ${posFilter}`, clear: () => setPosFilter("all") }] : []),
    ...(sourceFilter !== "all" ? [{ label: `Source: ${sourceFilter}`, clear: () => setSourceFilter("all") }] : []),
    ...(authFilter !== "all" ? [{ label: `Auth: ${authFilter}`, clear: () => setAuthFilter("all") }] : []),
    ...(minRating > 0 ? [{ label: `${minRating}+ stars`, clear: () => setMinRating(0) }] : []),
    ...(dateFrom ? [{ label: `From ${fmtDate(dateFrom)}`, clear: () => setDateFrom("") }] : []),
    ...(dateTo ? [{ label: `To ${fmtDate(dateTo)}`, clear: () => setDateTo("") }] : []),
  ];

  // ── Loading / error ────────────────────────────────────────────────────────

  if (loading) return <ApplicationsLoading />;
  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-600">{error}</p>
        <button onClick={load} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)] transition-colors">Retry</button>
      </div>
    </div>
  );

  const allSelected = sorted.length > 0 && sorted.every((a) => selected.includes(a.id));
  const fade = (delay = 0) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3, delay, ease: [0.22, 1, 0.36, 1] as const } };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">

      {/* ── Header ── */}
      <PageHeader
        title="Applications"
        subtitle={`${applications.length} total · ${filtered.length} matching filters`}
        icon={Users}
        actions={
          <>
            <PageHeaderButton variant="secondary" onClick={exportCSV}>
              <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
            </PageHeaderButton>
            <PageHeaderButton variant="primary" onClick={() => openCandidateEditor({ mode: "create" })}>
              <Plus className="w-4 h-4" />Add Applicant
            </PageHeaderButton>
          </>
        }
      />

      {/* ── Pipeline flow ── */}
      <motion.div {...fade(0.06)}>
        <AdminCard className="overflow-hidden">
          <div className={cn("flex items-center justify-between gap-2 px-4 py-3", pipelineOpen && "border-b border-slate-100")}>
            <button
              type="button"
              onClick={() => setPipelineOpen((o) => !o)}
              aria-expanded={pipelineOpen}
              className="flex min-w-0 items-center gap-2.5 text-left"
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-[var(--hz-cobalt-100)]">
                <Filter className="h-4 w-4 text-[var(--hz-cobalt)]" strokeWidth={2} />
              </span>
              <h3 className="text-sm font-bold text-slate-900">Hiring pipeline</h3>
              <span className="hidden text-[11px] text-slate-400 sm:inline">{applications.length} candidates</span>
              <ChevronDown className={cn("h-4 w-4 flex-shrink-0 text-slate-400 transition-transform duration-200", !pipelineOpen && "-rotate-90")} />
            </button>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")} className="inline-flex flex-shrink-0 items-center gap-1 text-[11px] font-bold text-[var(--hz-cobalt)] hover:underline">
                <X className="h-3 w-3" /> Clear
              </button>
            )}
          </div>

          {pipelineOpen && (
          <div className="flex items-stretch overflow-x-auto px-4 py-5">
            {PIPELINE.map((key, i) => {
              const meta = statusMeta[key as AppStatus];
              const Icon = meta.icon;
              const color = STAGE_COLOR[key];
              const count = pipelineCounts[key] || 0;
              const active = statusFilter === key;
              const dim = statusFilter !== "all" && !active;
              const pct = Math.round(((count || 0) / pipelineMax) * 100);
              const prev = i > 0 ? (pipelineCounts[PIPELINE[i - 1]] || 0) : null;
              const conv = prev && prev > 0 ? Math.round((count / prev) * 100) : null;
              return (
                <React.Fragment key={key}>
                  {/* connector */}
                  {i > 0 && (
                    <div className="flex w-7 flex-shrink-0 flex-col items-center justify-center sm:w-10">
                      <div className="relative h-[3px] w-full rounded-full" style={{ background: `linear-gradient(90deg, ${STAGE_COLOR[PIPELINE[i - 1]]}, ${color})` }}>
                        <span className="absolute -right-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rotate-45 rounded-[1px]" style={{ background: color }} />
                      </div>
                      {conv !== null && (
                        <span className="mt-1.5 rounded-full bg-white px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-slate-500 shadow-sm ring-1 ring-slate-100">{conv}%</span>
                      )}
                    </div>
                  )}
                  {/* node */}
                  <button
                    onClick={() => setStatusFilter(active ? "all" : key)}
                    title={`Filter by ${meta.label}`}
                    style={active
                      ? { borderColor: color, boxShadow: `0 12px 28px -10px ${color}80`, background: `${color}0a` }
                      : undefined}
                    className={cn(
                      "group relative flex min-w-[100px] flex-1 flex-col rounded-2xl border-2 p-3 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      active ? "-translate-y-0.5" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
                      dim && "opacity-55 hover:opacity-100",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid h-8 w-8 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: color + "1f", color }}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums" style={{ color: active ? color : "#0f172a" }}>{count}</span>
                    </div>
                    <p className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">{meta.label}</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </button>
                </React.Fragment>
              );
            })}

            {/* rejected — terminal, off the main flow */}
            <div className="ml-2 flex flex-shrink-0 items-center sm:ml-3">
              <div className="mx-1 h-14 w-px bg-slate-200 sm:mx-2" />
              <button
                onClick={() => setStatusFilter(statusFilter === "rejected" ? "all" : "rejected")}
                title="Filter by Rejected"
                style={statusFilter === "rejected"
                  ? { borderColor: STAGE_COLOR.rejected, boxShadow: `0 12px 28px -10px ${STAGE_COLOR.rejected}80`, background: `${STAGE_COLOR.rejected}0a` }
                  : undefined}
                className={cn(
                  "group relative flex min-w-[100px] flex-col rounded-2xl border-2 p-3 text-left transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  statusFilter === "rejected" ? "-translate-y-0.5" : "border-slate-200 bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
                  statusFilter !== "all" && statusFilter !== "rejected" && "opacity-55 hover:opacity-100",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="grid h-8 w-8 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ background: STAGE_COLOR.rejected + "1f" }}>
                    <XCircle className="h-4 w-4" style={{ color: STAGE_COLOR.rejected }} strokeWidth={2} />
                  </span>
                  <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums" style={{ color: statusFilter === "rejected" ? STAGE_COLOR.rejected : "#0f172a" }}>{pipelineCounts.rejected || 0}</span>
                </div>
                <p className="mt-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">Rejected</p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${Math.round(((pipelineCounts.rejected || 0) / pipelineMax) * 100)}%`, background: STAGE_COLOR.rejected }} />
                </div>
              </button>
            </div>
          </div>
          )}
        </AdminCard>
      </motion.div>

      {/* ── Toolbar ── */}
      <motion.div {...fade(0.1)}>
        <AdminCard className="p-3 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, job, ID…" />

            <FilterToggle
              open={filtersOpen}
              activeCount={activeFilterCount}
              onClick={() => setFiltersOpen((v) => !v)}
            />

            <ViewMenu
              options={[
                { value: "table",  label: "Table",  icon: LayoutList },
                { value: "kanban", label: "Kanban", icon: Columns },
                { value: "list",   label: "List",   icon: AlignJustify },
              ]}
              value={view}
              onChange={setView}
            />

            <BulkBar count={selected.length} onClear={() => setSelected([])}>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />Delete
              </button>
            </BulkBar>
          </div>

          {/* Expandable filters */}
          {filtersOpen && (
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Position</label>
                  <select value={posFilter} onChange={(e) => setPosFilter(e.target.value)} autoComplete="off" className={selectCls}>
                    <option value="all">All Positions</option>
                    {positions.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Source</label>
                  <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} autoComplete="off" className={selectCls}>
                    <option value="all">All Sources</option>
                    {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Work Auth</label>
                  <select value={authFilter} onChange={(e) => setAuthFilter(e.target.value)} autoComplete="off" className={selectCls}>
                    <option value="all">All</option>
                    {WORK_AUTH_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Min Rating</label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} type="button" aria-label="Set minimum rating" onClick={() => setMinRating(n === minRating ? 0 : n)}>
                        <Star aria-hidden="true" className={cn("w-5 h-5 transition-colors", n <= minRating ? "fill-amber-400 text-amber-400" : "text-slate-200 hover:text-amber-300")} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Applied From</label>
                  <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} autoComplete="off" className={selectCls} />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Applied To</label>
                  <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} autoComplete="off" className={selectCls} />
                </div>
              </div>
            </div>
          )}

          {/* Status pills */}
          <div className="flex flex-wrap gap-1">
            {STATUS_FILTERS.map((tab) => {
              const count = tab.key === "all" ? applications.length : pipelineCounts[tab.key] || 0;
              const active = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                    active ? "bg-[var(--hz-cobalt)] text-white shadow-sm" : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {tab.label}
                  <span className={cn(
                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none tabular-nums",
                    active ? "bg-white/25 text-white" : "bg-slate-200 text-slate-600",
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active-filter chips */}
          {filterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">Filters</span>
              {filterChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={chip.clear}
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] text-[11px] font-semibold rounded-full hover:bg-[var(--hz-cobalt-100)]/70 transition-colors"
                >
                  {chip.label}
                  <X className="w-3 h-3" />
                </button>
              ))}
              <button onClick={clearFilters} className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 hover:underline ml-1">
                Clear all
              </button>
            </div>
          )}
        </AdminCard>
      </motion.div>

      {/* ── Views ── */}
      <motion.div {...fade(0.14)}>
        {view === "table" && (
          <TableView
            apps={sorted} allSelected={allSelected} selected={selected}
            onSelectAll={(all) => setSelected(all ? sorted.map((a) => a.id) : [])}
            onSelect={(id, on) => setSelected((p) => (on ? [...p, id] : p.filter((x) => x !== id)))}
            onView={(id) => router.push(`/admin/candidates/${id}`)}
            onEdit={(app) => openCandidateEditor({ candidate: app, mode: "edit" })}
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
            onView={(id) => router.push(`/admin/candidates/${id}`)}
            onEdit={(app) => openCandidateEditor({ candidate: app, mode: "edit" })}
            onDelete={setDeleteId}
            onStatusChange={patchStatus}
            onRating={patchRating}
          />
        )}

        {view === "list" && (
          <ListView
            apps={sorted}
            onView={(id) => router.push(`/admin/candidates/${id}`)}
            onEdit={(app) => openCandidateEditor({ candidate: app, mode: "edit" })}
            onDelete={setDeleteId}
            onStatusChange={patchStatus}
            onRating={patchRating}
            empty={applications.length === 0}
            onAdd={() => openCandidateEditor({ mode: "create" })}
          />
        )}
      </motion.div>

      {/* ── Confirm dialogs ── */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete application?"
        body="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={deleteOne}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.length} application${selected.length > 1 ? "s" : ""}?`}
        body="This is permanent and cannot be undone."
        confirmLabel="Delete All"
        busy={deleting}
        onConfirm={deleteBulk}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </div>
  );
}

const selectCls =
  "w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)] text-slate-700 transition-colors";

// ── TABLE VIEW ─────────────────────────────────────────────────────────────────

interface RowActions {
  onView: (id: string) => void;
  onEdit: (app: App) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
  onRating: (id: string, r: number) => void;
}
interface SharedProps extends RowActions {
  apps: App[];
}

// Shared 3-dot (kebab) row actions for the table & list views.
function RowActionsMenu({ app, onView, onEdit, onDelete, onStatusChange }: {
  app: App;
  onView: (id: string) => void;
  onEdit: (app: App) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button title="Actions" className="rounded-lg p-2.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-700">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
        <DropdownMenuItem onClick={() => onView(app.id)} className="cursor-pointer rounded-lg text-sm"><Eye className="mr-2 h-4 w-4 text-slate-400" />View profile</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(app)} className="cursor-pointer rounded-lg text-sm"><Edit3 className="mr-2 h-4 w-4 text-slate-400" />Edit</DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Move to</p>
          {KANBAN_COLS.filter((c) => c !== app.status).map((c) => (
            <button key={c} onClick={() => onStatusChange(app.id, c as Application["status"])}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1 text-left text-xs text-slate-700 transition-colors hover:bg-slate-50">
              <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", tones[sTone(c)].dot)} />{sLabel(c)}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(app.id)} className="cursor-pointer rounded-lg text-sm text-rose-600 focus:bg-rose-50 focus:text-rose-600">
          <Trash2 className="mr-2 h-4 w-4" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-[var(--hz-cobalt)]" /> : <ArrowDown className="w-3 h-3 text-[var(--hz-cobalt)]" />;
  };
  const Th = ({ field, label, className }: { field?: SortField; label: string; className?: string }) => (
    <th className={cn("py-3 px-4 text-left", className)}>
      {field ? (
        <button onClick={() => onSort(field)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-900 transition-colors">
          {label}<SortIcon field={field} />
        </button>
      ) : (
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
      )}
    </th>
  );

  if (apps.length === 0 && empty) return <EmptyState onAdd={onAdd} />;

  return (
    <AdminCard className="overflow-hidden">
      {apps.length === 0 ? (
        <NoResults />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="py-3 px-4 w-10">
                  <input type="checkbox" checked={allSelected} onChange={(e) => onSelectAll(e.target.checked)}
                    className="rounded border-slate-300 text-[var(--hz-cobalt)] cursor-pointer" />
                </th>
                <Th field="name"      label="Applicant" />
                <Th field="jobTitle"  label="Job" />
                <Th field="status"    label="Stage" />
                <Th field="source"    label="Source" />
                <Th field="appliedAt" label="Applied" />
                <Th field="rating"    label="Rating" />
                <th className="py-3 px-4 text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((app) => (
                <tr key={app.id} className={cn("transition-colors group hover:bg-[var(--hz-cobalt-100)]/30", selected.includes(app.id) && "bg-[var(--hz-cobalt-100)]/40")}>
                  <td className="py-3.5 px-4">
                    <input type="checkbox" checked={selected.includes(app.id)}
                      onChange={(e) => onSelect(app.id, e.target.checked)}
                      className="rounded border-slate-300 text-[var(--hz-cobalt)] cursor-pointer" />
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={app.name} email={app.email} size="sm" />
                      <div className="min-w-0">
                        <button onClick={() => shared.onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-[var(--hz-cobalt)] transition-colors text-left block truncate max-w-[180px]">
                          {app.name || "—"}
                        </button>
                        <p className="text-xs text-slate-400 truncate max-w-[180px]">{app.email}</p>
                        {app.phone && <p className="text-[11px] text-slate-400 truncate max-w-[180px]">{app.phone}</p>}
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          {app.applicationId && <span className="font-mono text-[10px] text-[var(--hz-cobalt)] bg-[var(--hz-cobalt-100)] px-1 py-0.5 rounded">{app.applicationId}</span>}
                          {app.addToTalentBench && (
                            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                              <BookmarkCheck className="h-2.5 w-2.5" />Bench
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="text-sm font-medium text-slate-800 truncate max-w-[160px]">{app.jobTitle || <span className="text-slate-300">—</span>}</p>
                    {app.jobDepartment && <p className="text-xs text-slate-400 mt-0.5">{app.jobDepartment}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <select value={app.status} onChange={(e) => shared.onStatusChange(app.id, e.target.value as Application["status"])} autoComplete="off"
                      className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)] text-slate-700 cursor-pointer">
                      {ALL_STATUSES.map((s) => <option key={s} value={s}>{sLabel(s)}</option>)}
                    </select>
                  </td>
                  <td className="py-3.5 px-4">
                    {app.source
                      ? <span className="text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">{app.source}</span>
                      : <span className="text-slate-300 text-sm">—</span>}
                    {app.workAuthorization && <p className="mt-1 truncate max-w-[130px] text-[11px] text-slate-400">{app.workAuthorization}</p>}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      {fmtDate(app.appliedAt)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <StarRating rating={app.rating || 0} onRate={(r) => shared.onRating(app.id, r === app.rating ? 0 : r)} />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end">
                      <RowActionsMenu app={app} onView={shared.onView} onEdit={shared.onEdit} onDelete={shared.onDelete} onStatusChange={shared.onStatusChange} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}

// ── KANBAN VIEW ────────────────────────────────────────────────────────────────

function KanbanView({ apps, ...shared }: SharedProps) {
  const [dragId, setDragId]     = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const grouped = useMemo(() =>
    Object.fromEntries(KANBAN_COLS.map((k) => [k, apps.filter((a) => a.status === k)])),
  [apps]);

  const handleDrop = (col: string) => {
    if (dragId && dragId !== col) {
      const app = apps.find((a) => a.id === dragId);
      if (app && app.status !== col) shared.onStatusChange(dragId, col as Application["status"]);
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-3 min-w-max">
        {KANBAN_COLS.map((col) => {
          const t = tones[sTone(col)];
          const list = grouped[col] || [];
          const isOver = dragOver === col;
          return (
            <div key={col} className="w-64 flex flex-col"
              onDragOver={(e) => { e.preventDefault(); setDragOver(col); }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
              onDrop={() => handleDrop(col)}>
              {/* Column header */}
              <div className={cn("flex items-center justify-between px-3 py-2.5 rounded-t-2xl border border-b-0 transition-colors", t.soft, t.ring, isOver && "ring-2 ring-[var(--hz-cobalt)]")}>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full flex-shrink-0", t.dot)} />
                  <span className={cn("text-[11px] font-bold uppercase tracking-wider", t.text)}>{sLabel(col)}</span>
                </div>
                <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full tabular-nums", t.bg, t.text)}>{list.length}</span>
              </div>
              {/* Cards */}
              <div className={cn(
                "flex-1 border border-t-0 rounded-b-2xl overflow-y-auto max-h-[calc(100vh-420px)] min-h-[120px] p-2 space-y-2 transition-colors",
                t.bg, t.ring,
                isOver && "ring-2 ring-[var(--hz-cobalt)] ring-inset bg-[var(--hz-cobalt-100)]/40",
              )}>
                {list.length === 0 ? (
                  <div className={cn("py-8 text-center rounded-xl border-2 border-dashed transition-colors", isOver ? "border-[var(--hz-cobalt)]" : "border-transparent")}>
                    <p className="text-xs text-slate-400 font-medium">{isOver ? "Drop here" : "No applicants"}</p>
                  </div>
                ) : list.map((app) => (
                  <KanbanCard key={app.id} app={app} isDragging={dragId === app.id}
                    onDragStart={() => setDragId(app.id)}
                    onDragEnd={() => { setDragId(null); setDragOver(null); }}
                    {...shared} />
                ))}
                {list.length > 0 && isOver && (
                  <div className="h-14 border-2 border-dashed border-[var(--hz-cobalt)] rounded-xl flex items-center justify-center">
                    <p className="text-xs text-[var(--hz-cobalt)] font-semibold">Drop here</p>
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

function KanbanCard({ app, onView, onEdit, onDelete, onStatusChange, onRating, isDragging, onDragStart, onDragEnd }: RowActions & {
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
        "bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm hover:shadow-md hover:border-[var(--hz-cobalt-100)] transition-all group cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-40 scale-95 shadow-none",
      )}>
      {/* Top row */}
      <div className="flex items-start gap-2 mb-2">
        <Avatar name={app.name} email={app.email} size="sm" />
        <div className="flex-1 min-w-0">
          <button onClick={() => onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-[var(--hz-cobalt)] transition-colors text-left block truncate w-full">
            {app.name || "—"}
          </button>
          {app.jobTitle && <p className="text-xs text-slate-500 truncate mt-0.5">{app.jobTitle}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Application actions" className="p-2.5 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors opacity-0 group-hover:opacity-100">
              <MoreHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white border border-slate-200 shadow-lg rounded-xl w-44">
            <DropdownMenuItem onClick={() => onView(app.id)} className="text-sm rounded-lg cursor-pointer"><Eye className="h-4 w-4 mr-2 text-slate-400" />View Profile</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(app)} className="text-sm rounded-lg cursor-pointer"><Edit3 className="h-4 w-4 mr-2 text-slate-400" />Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Move to</p>
              {KANBAN_COLS.filter((c) => c !== app.status).map((c) => (
                <button key={c} onClick={() => onStatusChange(app.id, c as Application["status"])}
                  className="w-full text-left flex items-center gap-2 px-2 py-1 rounded-md text-xs text-slate-700 hover:bg-slate-50 transition-colors">
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", tones[sTone(c)].dot)} />{sLabel(c)}
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
          {skills.map((s) => <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] rounded-full">{s}</span>)}
          {(app.skills || []).length > 3 && <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-full">+{(app.skills || []).length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <StarRating rating={app.rating || 0} onRate={(r) => onRating(app.id, r === app.rating ? 0 : r)} />
        <div className="flex items-center gap-1 text-[10px] text-slate-400 tabular-nums">
          <Calendar className="w-3 h-3" />
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      </div>

      {app.source && <p className="text-[10px] text-slate-400 mt-1.5 font-medium">{app.source}</p>}
    </div>
  );
}

// ── LIST VIEW ──────────────────────────────────────────────────────────────────

function ListView({ apps, empty, onAdd, ...shared }: SharedProps & { empty: boolean; onAdd: () => void }) {
  if (apps.length === 0 && empty) return <EmptyState onAdd={onAdd} />;

  return (
    <AdminCard className="overflow-hidden">
      {apps.length === 0 ? (
        <NoResults />
      ) : (
        <div className="divide-y divide-slate-100">
          {apps.map((app) => {
            const skills = (app.skills || []).slice(0, 4);
            return (
              <div key={app.id} className="px-4 py-3.5 hover:bg-slate-50 transition-colors group flex items-center gap-4">
                <Avatar name={app.name} email={app.email} size="md" />

                {/* Main info */}
                <div className="flex-1 min-w-0 grid sm:grid-cols-3 gap-2">
                  {/* Col 1: identity */}
                  <div className="min-w-0">
                    <button onClick={() => shared.onView(app.id)} className="text-sm font-semibold text-slate-900 hover:text-[var(--hz-cobalt)] transition-colors text-left block truncate">
                      {app.name || "—"}
                    </button>
                    <p className="text-xs text-slate-400 truncate">{app.email}</p>
                    {app.phone && <p className="text-xs text-slate-400 truncate">{app.phone}</p>}
                    {skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {skills.map((s) => <span key={s} className="px-1.5 py-0.5 text-[10px] font-medium bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] rounded-full">{s}</span>)}
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
                    <StarRating rating={app.rating || 0} onRate={(r) => shared.onRating(app.id, r === app.rating ? 0 : r)} />
                    <div className="flex items-center gap-1 text-xs text-slate-400 tabular-nums">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />{fmtDate(app.appliedAt)}
                    </div>
                    {app.addToTalentBench && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        <BookmarkCheck className="w-3 h-3" />Bench
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center">
                  <RowActionsMenu app={app} onView={shared.onView} onEdit={shared.onEdit} onDelete={shared.onDelete} onStatusChange={shared.onStatusChange} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}

// ── SHARED HELPERS ─────────────────────────────────────────────────────────────

function NoResults() {
  return (
    <div className="py-16 text-center">
      <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
      <p className="text-sm font-semibold text-slate-600 mb-1">No results</p>
      <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <AdminCard className="py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Users className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1">No applicants yet</h3>
      <p className="text-sm text-slate-400 mb-5">Add your first candidate to start tracking the pipeline.</p>
      <button onClick={onAdd} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--hz-cobalt-600)] active:scale-[0.99] transition">
        <Plus className="w-4 h-4" />Add Applicant
      </button>
    </AdminCard>
  );
}
