"use client";
import { toast } from "sonner";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Plus, Search, Edit3, Trash2, Users, MapPin, Briefcase,
  CheckCircle2, Copy, Loader2, DollarSign, Download, Eye,
  MoreHorizontal, Building2, LayoutList, AlignJustify, Truck,
  Calendar, PauseCircle, FileText, AlertTriangle, X,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { AdminCard } from "@/components/admin/admin-card";
import { StatCard } from "@/components/admin/stat-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import JobsLoading from "./loading";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TableView = "compact" | "detailed";

const JOB_STATUSES: Array<{ value: Job["status"]; label: string }> = [
  { value: "draft",    label: "Draft" },
  { value: "open",     label: "Open" },
  { value: "active",   label: "Active" },
  { value: "on-hold",  label: "On Hold" },
  { value: "closed",   label: "Closed" },
];

const STATUS_TABS = [
  { key: "all",     label: "All" },
  { key: "active",  label: "Active" },
  { key: "open",    label: "Open" },
  { key: "draft",   label: "Draft" },
  { key: "on-hold", label: "On Hold" },
  { key: "closed",  label: "Closed" },
];

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();

  const [jobs, setJobs]                   = useState<Job[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting]           = useState(false);
  const [duplicating, setDuplicating]     = useState<string | null>(null);
  const [tableView, setTableView]         = useState<TableView>("compact");

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

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
    } catch { toast.error("Failed to update job status"); }
  };

  const handleDelete = async (jobId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs(prev => prev.filter(j => j.id !== jobId));
      setShowDeleteConfirm(null);
    } catch { toast.error("Failed to delete job"); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (job: Job) => {
    setDuplicating(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to duplicate"); }
      await fetchJobs();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate job");
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

  const filteredJobs = useMemo(() => jobs.filter(job => {
    const jv = job as Job & { vendorName?: string };
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || [job.title, job.department, job.location, job.clientName, jv.vendorName, job.postingId]
      .some(f => f?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || job.status === statusFilter;
    return matchSearch && matchStatus;
  }), [jobs, debouncedSearch, statusFilter]);

  const statusCounts = useMemo(() => STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? jobs.length : jobs.filter(j => j.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>), [jobs]);

  const now = Date.now();
  const stats = {
    total:  jobs.length,
    active: jobs.filter(j => j.status === "active" || j.status === "open").length,
    draft:  jobs.filter(j => j.status === "draft").length,
    closingSoon: jobs.filter(j => {
      if (!j.submissionDueDate || j.status === "closed") return false;
      const diff = new Date(j.submissionDueDate).getTime() - now;
      return diff >= 0 && diff <= 7 * 86400000;
    }).length,
  };

  const hasActiveFilters = statusFilter !== "all" || debouncedSearch.trim() !== "";
  const clearFilters = () => { setStatusFilter("all"); setSearchQuery(""); };

  // ── Loading / Error states ───────────────────────────────────────────────

  if (loading) return <JobsLoading />;

  if (error) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-3">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
        <p className="text-sm text-rose-600">{error}</p>
        <button onClick={fetchJobs} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg hover:bg-[var(--hz-cobalt-600)]">Retry</button>
      </div>
    </div>
  );

  const fadeUp = (i: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] as const },
        };

  const empty = (
    <div className="py-16 text-center">
      <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-slate-100">
        <Briefcase className="h-8 w-8 text-slate-300" />
      </div>
      <h3 className="mb-1 text-base font-bold text-slate-900">No jobs found</h3>
      <p className="mb-5 text-sm text-slate-400">
        {jobs.length === 0 ? "Post your first job to start tracking candidates" : "Try adjusting your search or filters"}
      </p>
      {jobs.length === 0 ? (
        canEdit && (
          <button onClick={() => router.push("/admin/jobs/new")} className="inline-flex items-center gap-2 rounded-lg bg-[var(--hz-cobalt)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--hz-cobalt-600)]">
            <Plus className="h-4 w-4" />Post a Job
          </button>
        )
      ) : (
        hasActiveFilters && (
          <button onClick={clearFilters} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50">
            <X className="h-4 w-4" />Clear filters
          </button>
        )
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">

      {/* ── Page header ── */}
      <PageHeader
        title="Job Postings"
        subtitle="Manage open roles and track candidate pipelines"
        icon={Briefcase}
        actions={
          <>
            <PageHeaderButton variant="secondary" onClick={exportCSV}>
              <Download className="w-4 h-4" /><span className="hidden sm:inline">Export</span>
            </PageHeaderButton>
            {canEdit && (
              <PageHeaderButton variant="primary" onClick={() => router.push("/admin/jobs/new")}>
                <Plus className="w-4 h-4" />New Job
              </PageHeaderButton>
            )}
          </>
        }
      />

      {/* ── KPI strip ── */}
      <motion.div {...fadeUp(0)} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard size="sm" label="Total Jobs"    value={stats.total}       icon={Briefcase}    tone="blue" />
        <StatCard size="sm" label="Active / Open" value={stats.active}      icon={CheckCircle2} tone="emerald" />
        <StatCard size="sm" label="Drafts"        value={stats.draft}       icon={FileText}     tone="slate" />
        <StatCard size="sm" label="Closing Soon"  value={stats.closingSoon} icon={PauseCircle}  tone="amber" hint="Due within 7 days" />
      </motion.div>

      {/* ── Filter bar ── */}
      <motion.div {...fadeUp(1)}>
        <AdminCard className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search title, client, location…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm transition-colors focus:border-[var(--hz-cobalt)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
              />
            </div>
            <div className="hidden items-center overflow-hidden rounded-lg border border-slate-200 bg-slate-50 xl:flex">
              {(["compact", "detailed"] as const).map((v, i) => (
                <button key={v} onClick={() => setTableView(v)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-colors ${i > 0 ? "border-l border-slate-200" : ""} ${tableView === v ? "bg-[var(--hz-cobalt)] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
                  {v === "compact" ? <LayoutList className="h-3.5 w-3.5" /> : <AlignJustify className="h-3.5 w-3.5" />}
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Status pill tabs */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {STATUS_TABS.map(tab => {
              const isActive = statusFilter === tab.key;
              return (
                <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    isActive ? "bg-[var(--hz-cobalt)] text-white shadow-sm shadow-[rgba(29,78,216,0.2)]" : "text-slate-600 hover:bg-slate-100"
                  }`}>
                  {tab.label}
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                    isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-600"
                  }`}>{statusCounts[tab.key] || 0}</span>
                </button>
              );
            })}
          </div>
        </AdminCard>
      </motion.div>

      {/* ── Active filter chips + count ── */}
      <div className="-mt-1 flex flex-wrap items-center gap-2 px-0.5">
        <p className="text-xs text-slate-400">
          <span className="font-semibold text-slate-600 tabular-nums">{filteredJobs.length}</span> of {jobs.length} jobs
        </p>
        {hasActiveFilters && (
          <>
            {statusFilter !== "all" && (
              <button onClick={() => setStatusFilter("all")}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--hz-cobalt-100)] px-2 py-0.5 text-[11px] font-semibold text-[var(--hz-cobalt)] transition hover:opacity-80">
                {STATUS_TABS.find(t => t.key === statusFilter)?.label}
                <X className="h-3 w-3" />
              </button>
            )}
            {debouncedSearch.trim() && (
              <button onClick={() => setSearchQuery("")}
                className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-200">
                &ldquo;{debouncedSearch}&rdquo;
                <X className="h-3 w-3" />
              </button>
            )}
            <button onClick={clearFilters} className="text-[11px] font-semibold text-slate-400 underline-offset-2 transition hover:text-slate-600 hover:underline">
              Clear all
            </button>
          </>
        )}
      </div>

      {/* ── Mobile / tablet cards (phones 1-col, tablets/small laptops 2-col;
             the wide table only takes over at xl where it has room) ── */}
      <div className="grid gap-3 md:grid-cols-2 xl:hidden">
        {filteredJobs.length > 0 ? filteredJobs.map((job, i) => {
          const jv = job as Job & { vendorName?: string };
          return (
            <motion.div key={job.id} {...fadeUp(Math.min(i, 6) + 2)}>
              <AdminCard hover className="flex h-full flex-col p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {job.postingId && (
                      <span className="rounded bg-[var(--hz-cobalt-100)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--hz-cobalt)]">
                        {job.postingId}
                      </span>
                    )}
                    <button
                      onClick={() => router.push(`/admin/jobs/${job.id}`)}
                      className="mt-1.5 block text-left text-sm font-bold leading-snug text-slate-900 transition-colors line-clamp-2 hover:text-[var(--hz-cobalt)]"
                    >
                      {job.title}
                    </button>
                    <p className="mt-0.5 text-xs capitalize text-slate-400">{job.department} · {job.type}</p>
                  </div>
                  <StatusBadge status={job.status} size="md" />
                </div>

                <div className="mb-4 flex-1 space-y-1.5 text-xs text-slate-500">
                  {job.clientName && (
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{job.clientName}</span>
                    </div>
                  )}
                  {jv.vendorName && (
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span className="truncate">{jv.vendorName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                    <span className="truncate">{job.location}{job.state ? `, ${job.state}` : ""}</span>
                  </div>
                  {job.payRate && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span className="tabular-nums">${job.payRate}/hr pay{job.clientBillRate ? ` · $${job.clientBillRate}/hr bill` : ""}</span>
                    </div>
                  )}
                  {job.submissionDueDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                      <span>Due {fmtDate(job.submissionDueDate)}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Users className="h-3 w-3" /><span className="tabular-nums">{job.applicationsCount || 0}</span> applicants
                  </span>
                  <div className="flex items-center gap-1">
                    <button onClick={() => router.push(`/admin/jobs/${job.id}`)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-[var(--hz-cobalt-100)] hover:text-[var(--hz-cobalt)]">
                      <Eye className="h-4 w-4" />
                    </button>
                    {canEdit && (
                      <>
                        <button onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700">
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDuplicate(job)} disabled={duplicating === job.id} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                          {duplicating === job.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <button onClick={() => setShowDeleteConfirm(job.id)} className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          );
        }) : (
          <div className="md:col-span-2">
            <AdminCard>{empty}</AdminCard>
          </div>
        )}
      </div>

      {/* ── Desktop table (xl+ only — needs the horizontal room) ── */}
      <motion.div {...fadeUp(2)} className="hidden xl:block">
        <AdminCard className="overflow-hidden">
          {tableView === "compact" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="whitespace-nowrap px-5 py-3 text-left font-semibold">Job ID</th>
                    <th className="px-5 py-3 text-left font-semibold">Title</th>
                    <th className="px-5 py-3 text-left font-semibold">Client</th>
                    <th className="px-5 py-3 text-left font-semibold">Location</th>
                    <th className="px-5 py-3 text-left font-semibold">Status</th>
                    <th className="whitespace-nowrap px-5 py-3 text-left font-semibold">Applicants</th>
                    <th className="px-5 py-3 text-left font-semibold">Created</th>
                    <th className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="group transition-colors hover:bg-[var(--hz-cobalt-100)]/30">
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="rounded bg-[var(--hz-cobalt-100)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--hz-cobalt)]">
                          {job.postingId || "—"}
                        </span>
                      </td>
                      <td className="max-w-[220px] px-5 py-4">
                        <button
                          onClick={() => router.push(`/admin/jobs/${job.id}`)}
                          className="block w-full truncate text-left font-semibold text-slate-900 transition-colors hover:text-[var(--hz-cobalt)]"
                        >
                          {job.title}
                        </button>
                        <p className="mt-0.5 truncate text-xs capitalize text-slate-400">{job.department} · {job.type}</p>
                      </td>
                      <td className="max-w-[160px] px-5 py-4">
                        {job.clientName ? (
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{job.clientName}</span>
                          </div>
                        ) : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="max-w-[160px] px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                          <span className="truncate">{job.location}{job.state ? `, ${job.state}` : ""}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Users className="h-3.5 w-3.5 text-slate-400" />
                          <span className="tabular-nums">{job.applicationsCount || 0}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4">
                        <span className="text-xs text-slate-500 tabular-nums">{fmtDate(job.createdAt)}</span>
                        {job.submissionDueDate && (
                          <span className="mt-0.5 flex items-center gap-1 text-[11px] tabular-nums text-amber-600">
                            <Calendar className="h-3 w-3" />Due {fmtDate(job.submissionDueDate)}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <RowMenu
                          job={job}
                          canEdit={canEdit}
                          duplicating={duplicating === job.id}
                          onView={() => router.push(`/admin/jobs/${job.id}`)}
                          onEdit={() => router.push(`/admin/jobs/${job.id}/edit`)}
                          onDuplicate={() => handleDuplicate(job)}
                          onDelete={() => setShowDeleteConfirm(job.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1300px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] uppercase tracking-wider text-slate-500">
                    {[
                      "Job ID","Title","Client","Vendor","Location",
                      "Pay Rate","Bill Rate","Status","Manager",
                      "Applicants","Created","Deadline","Actions",
                    ].map((h, i) => (
                      <th key={i} className={`whitespace-nowrap px-5 py-3 font-semibold ${i === 12 ? "text-right" : "text-left"}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredJobs.map(job => {
                    const jv = job as Job & { vendorName?: string };
                    return (
                      <tr key={job.id} className="group transition-colors hover:bg-[var(--hz-cobalt-100)]/30">
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="rounded bg-[var(--hz-cobalt-100)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--hz-cobalt)]">
                            {job.postingId || "—"}
                          </span>
                        </td>
                        <td className="max-w-[180px] px-5 py-4">
                          <button
                            onClick={() => router.push(`/admin/jobs/${job.id}`)}
                            className="block w-full truncate text-left font-semibold text-slate-900 transition-colors hover:text-[var(--hz-cobalt)]"
                          >
                            {job.title}
                          </button>
                          <p className="mt-0.5 truncate text-xs capitalize text-slate-400">{job.type}</p>
                        </td>
                        <td className="max-w-[140px] px-5 py-4">
                          {job.clientName ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{job.clientName}</span>
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="max-w-[130px] px-5 py-4">
                          {jv.vendorName ? (
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <Truck className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span className="truncate">{jv.vendorName}</span>
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="max-w-[150px] px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            <span className="truncate">{job.location}{job.state ? `, ${job.state}` : ""}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {job.payRate
                            ? <span className="font-semibold text-slate-800 tabular-nums">${job.payRate}/hr</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {job.clientBillRate
                            ? <span className="font-semibold text-slate-800 tabular-nums">${job.clientBillRate}/hr</span>
                            : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {canEdit ? (
                            <select
                              value={job.status}
                              onChange={e => handleStatusChange(job.id, e.target.value as Job["status"])}
                              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 transition-colors focus:border-[var(--hz-cobalt)] focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)]"
                            >
                              {JOB_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          ) : <StatusBadge status={job.status} />}
                        </td>
                        <td className="px-5 py-4">
                          {job.recruitmentManagerName ? (
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-[var(--hz-cobalt-600)] text-[10px] font-bold text-white">
                                {job.recruitmentManagerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                              </div>
                              <span className="max-w-[100px] truncate text-xs text-slate-600">{job.recruitmentManagerName}</span>
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            <span className="tabular-nums">{job.applicationsCount || 0}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          <span className="text-xs text-slate-500 tabular-nums">{fmtDate(job.createdAt)}</span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {job.submissionDueDate ? (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span className="tabular-nums">{fmtDate(job.submissionDueDate)}</span>
                            </div>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          <RowMenu
                            job={job}
                            canEdit={canEdit}
                            duplicating={duplicating === job.id}
                            onView={() => router.push(`/admin/jobs/${job.id}`)}
                            onEdit={() => router.push(`/admin/jobs/${job.id}/edit`)}
                            onDuplicate={() => handleDuplicate(job)}
                            onDelete={() => setShowDeleteConfirm(job.id)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {filteredJobs.length === 0 && empty}
        </AdminCard>
      </motion.div>

      {/* ── Delete Confirmation Modal ── */}
      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Delete this job?"
        body="This action is permanent and cannot be undone. All associated data will be removed."
        confirmLabel="Yes, Delete"
        busy={deleting}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
      />
    </div>
  );
}

// ── Row action menu ──────────────────────────────────────────────────────────

function RowMenu({
  job, canEdit, duplicating, onView, onEdit, onDuplicate, onDelete,
}: {
  job: Job;
  canEdit: boolean;
  duplicating: boolean;
  onView: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700" aria-label={`Actions for ${job.title}`}>
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-xl border border-slate-200 bg-white shadow-lg">
        <DropdownMenuItem onClick={onView} className="cursor-pointer rounded-lg text-sm">
          <Eye className="mr-2 h-4 w-4 text-slate-400" />View Details
        </DropdownMenuItem>
        {canEdit && <>
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer rounded-lg text-sm">
            <Edit3 className="mr-2 h-4 w-4 text-slate-400" />Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} disabled={duplicating} className="cursor-pointer rounded-lg text-sm">
            {duplicating ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-slate-400" /> : <Copy className="mr-2 h-4 w-4 text-slate-400" />}Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer rounded-lg text-sm text-rose-600 focus:bg-rose-50 focus:text-rose-600">
            <Trash2 className="mr-2 h-4 w-4" />Delete
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
