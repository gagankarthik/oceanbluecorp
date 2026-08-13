"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Loader2, MoreHorizontal, X,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { AdminCard } from "@/components/admin/admin-card";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, GridSelect, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { statusColor } from "@/components/admin/theme";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  IconEdit, IconTrash, IconGroup, IconLocation, IconJob,
  IconCopy, IconMoney, IconDownload, IconEye, IconBuilding, IconTruck,
  IconCalendar, IconWarning,
} from "@/components/admin/icons";
import JobsLoading from "./loading";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type JobWithVendor = Job & { vendorName?: string };

const JOB_STATUSES: Array<{ value: Job["status"]; label: string }> = [
  { value: "draft",   label: "Draft" },
  { value: "open",    label: "Open" },
  { value: "active",  label: "Active" },
  { value: "on-hold", label: "On Hold" },
  { value: "closed",  label: "Closed" },
];

const STATUS_TABS = [
  { key: "all",     label: "All" },
  { key: "active",  label: "Active" },
  { key: "open",    label: "Open" },
  { key: "draft",   label: "Draft" },
  { key: "on-hold", label: "On Hold" },
  { key: "closed",  label: "Closed" },
];


/** Placeholder for an empty cell, an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]"></span>;
}

export default function JobsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [jobs, setJobs]                 = useState<Job[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [duplicating, setDuplicating]   = useState<string | null>(null);

  const debouncedSearch = useDebouncedValue(searchQuery, 250);
  const canEdit = user?.role !== UserRole.RECRUITER;

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/jobs");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");

      const fetchedJobs: Job[] = data.jobs || [];
      const now = new Date();
      const toClose = fetchedJobs.filter(
        (j) => j.submissionDueDate && new Date(j.submissionDueDate) < now && j.status !== "closed",
      );

      if (toClose.length > 0) {
        await Promise.all(toClose.map((j) =>
          fetch(`/api/jobs/${j.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "closed" }),
          }),
        ));
        const closedIds = new Set(toClose.map((j) => j.id));
        setJobs(fetchedJobs.map((j) => (closedIds.has(j.id) ? { ...j, status: "closed" } : j)));
      } else {
        setJobs(fetchedJobs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchJobs(); }, [fetchJobs]);

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (jobId: string, newStatus: Job["status"]) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
      toast.success("Status updated");
    } catch { toast.error("Failed to update job status"); }
  };

  const handleDelete = async (jobId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete job");
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      setShowDeleteConfirm(null);
      toast.success("Job deleted");
    } catch { toast.error("Failed to delete job"); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (job: Job) => {
    setDuplicating(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to duplicate"); }
      await fetchJobs();
      toast.success("Job duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate job");
    } finally { setDuplicating(null); }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const jv = job as JobWithVendor;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || [job.title, job.department, job.location, job.clientName, jv.vendorName, job.postingId]
      .some((f) => f?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || job.status === statusFilter;
    return matchSearch && matchStatus;
  // Newest first by default. The detailed view has no Created column to sort
  // on, so without a base order it would fall back to raw fetch order.
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [jobs, debouncedSearch, statusFilter]);

  /** Open roles nobody has sourced for, the number worth acting on. */
  const starvedRoles = useMemo(
    () => jobs.filter(
      (j) => (j.status === "active" || j.status === "open") && !(j.applicationsCount || 0),
    ).length,
    [jobs],
  );

  const [rows, setRows] = useLocalStorage<number>("adm.jobs.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>(
    "adm.jobs.hiddenCols.v2",
    ["department", "payRate", "billRate"],
  );

  const statusCounts = useMemo(() => STATUS_TABS.reduce((acc, tab) => {
    acc[tab.key] = tab.key === "all" ? jobs.length : jobs.filter((j) => j.status === tab.key).length;
    return acc;
  }, {} as Record<string, number>), [jobs]);

  const stats = useMemo(() => {
    const now = Date.now();
    return {
      total:  jobs.length,
      active: jobs.filter((j) => j.status === "active" || j.status === "open").length,
      draft:  jobs.filter((j) => j.status === "draft").length,
      closingSoon: jobs.filter((j) => {
        if (!j.submissionDueDate || j.status === "closed") return false;
        const diff = new Date(j.submissionDueDate).getTime() - now;
        return diff >= 0 && diff <= 7 * 86400000;
      }).length,
      applicants: jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0),
    };
  }, [jobs]);



  const hasActiveFilters = statusFilter !== "all" || debouncedSearch.trim() !== "";
  const clearFilters = () => { setStatusFilter("all"); setSearchQuery(""); };

  const exportCSV = () => downloadCsv(
    "jobs",
    ["Job ID","Title","Client","Location","Status","Pay Rate","Bill Rate","Manager","Created","Deadline"],
    filteredJobs.map((job) => [
      job.postingId || "",
      job.title,
      job.clientName || "",
      `${job.location}${job.state ? `, ${job.state}` : ""}`,
      job.status,
      job.payRate        ? `$${job.payRate}/hr`        : "",
      job.clientBillRate ? `$${job.clientBillRate}/hr` : "",
      job.recruitmentManagerName || "",
      fmtDate(job.createdAt),
      job.submissionDueDate ? fmtDate(job.submissionDueDate) : "",
    ]),
  );

  // ── grid columns ──────────────────────────────────────────────────────────

  const rowMenu = useCallback((job: Job) => (
    <RowMenu
      job={job}
      canEdit={canEdit}
      duplicating={duplicating === job.id}
      onView={() => router.push(`/admin/jobs/${job.id}`)}
      onEdit={() => router.push(`/admin/jobs/${job.id}/edit`)}
      onDuplicate={() => handleDuplicate(job)}
      onDelete={() => setShowDeleteConfirm(job.id)}
    />
  // handleDuplicate is stable enough for this call site; it only reads state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [canEdit, duplicating, router]);

  const idCol: DataTableColumn<Job> = {
    key: "postingId",
    header: "Job ID",
    sortValue: (j) => j.postingId || "",
    cell: (j) => j.postingId
      ? <span className="rounded-[4px] bg-[var(--adm-accent-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--adm-accent)]">{j.postingId}</span>
      : <Blank />,
  };

  const titleCol: DataTableColumn<Job> = {
    key: "title",
    header: "Title",
    sortValue: (j) => j.title,
    cell: (j) => <span className="font-semibold text-[var(--adm-ink)]">{j.title}</span>,
  };

  const departmentCol: DataTableColumn<Job> = {
    key: "department",
    header: "Department",
    sortValue: (j) => j.department || "",
    hideBelow: "xl",
    cell: (j) => j.department
      ? <span className="capitalize text-[var(--adm-ink-mute)]">{j.department}</span>
      : <Blank />,
  };

  const clientCol: DataTableColumn<Job> = {
    key: "client",
    header: "Client",
    sortValue: (j) => j.clientName || "",
    hideBelow: "lg",
    cell: (j) => j.clientName ? (
      <span className="inline-flex max-w-full items-center gap-1.5 align-middle text-[var(--adm-ink-mute)]">
        <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="min-w-0 truncate">{j.clientName}</span>
      </span>
    ) : <Blank />,
  };

  const locationCol: DataTableColumn<Job> = {
    key: "location",
    header: "Location",
    sortValue: (j) => j.location || "",
    hideBelow: "lg",
    cell: (j) => (
      <span className="inline-flex max-w-full items-center gap-1.5 align-middle text-[var(--adm-ink-mute)]">
        <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="min-w-0 truncate">{j.location}{j.state ? `, ${j.state}` : ""}</span>
      </span>
    ),
  };

  const statusCol: DataTableColumn<Job> = {
    key: "status",
    header: "Status",
    label: "Status",
    width: "160px",
    sortValue: (j) => j.status,
    // Was a bare <select>, so Windows drew its own grey bevel inside an
    // otherwise designed grid and the cell resized as the label changed.
    cell: (j) => canEdit ? (
      <GridSelect
        value={j.status}
        dot={statusColor(j.status)}
        ariaLabel={`Status for ${j.title}`}
        onChange={(e) => handleStatusChange(j.id, e.target.value as Job["status"])}
      >
        {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </GridSelect>
    ) : <StatusBadge status={j.status} />,
  };

  const applicantsCol: DataTableColumn<Job> = {
    key: "applicants",
    header: "Applicants",
    align: "right",
    sortValue: (j) => j.applicationsCount || 0,
    cell: (j) => (
      <span className="inline-flex items-center gap-1.5 tabular-nums text-[var(--adm-ink-mute)]">
        <IconGroup className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" />
        {j.applicationsCount || 0}
      </span>
    ),
  };

  const createdCol: DataTableColumn<Job> = {
    key: "created",
    header: "Created",
    sortValue: (j) => new Date(j.createdAt).getTime(),
    hideBelow: "xl",
    cell: (j) => <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(j.createdAt)}</span>,
  };

  const actionsCol: DataTableColumn<Job> = {
    key: "actions",
    header: "",
    align: "right",
    cell: (j) => <div onClick={(e) => e.stopPropagation()}>{rowMenu(j)}</div>,
  };

  // Two lenses over the same rows, both eight columns wide: "compact" answers
  // where a role is and how it's doing, "detailed" answers what it pays.
  // Neither stacks a second fact under a first, a value worth showing gets a
  // column of its own, and everything else stays on the record page.
  const payCol: DataTableColumn<Job> = {
    key: "payRate", header: "Pay", label: "Pay rate", align: "right", width: "110px",
    sortValue: (j) => j.payRate ?? 0,
    cell: (j) => j.payRate
      ? <span className="font-semibold tabular-nums text-[var(--adm-ink)]">${j.payRate}/hr</span>
      : <Blank />,
  };

  const billCol: DataTableColumn<Job> = {
    key: "billRate", header: "Bill", label: "Bill rate", align: "right", width: "110px",
    sortValue: (j) => j.clientBillRate ?? 0,
    cell: (j) => j.clientBillRate
      ? <span className="font-semibold tabular-nums text-[var(--adm-ink)]">${j.clientBillRate}/hr</span>
      : <Blank />,
  };

  /**
   * ONE column list.
   *
   * There used to be two hard-coded sets, "Compact" and "Detailed", swapped by
   * a ViewMenu that sat next to the density control, whose first option is
   * also called "Compact". Two adjacent menus, both offering "Compact", doing
   * completely different things: one changed which columns existed, the other
   * changed row height.
   *
   * The columns menu already answers "which columns do I want", and more
   * precisely than two fixed presets, so the ViewMenu is gone and the extra
   * "detailed" columns simply start hidden.
   */
  const columns: DataTableColumn<Job>[] = [
    idCol, titleCol, departmentCol, clientCol, locationCol,
    payCol, billCol, statusCol, applicantsCol, createdCol, actionsCol,
  ];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <JobsLoading />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-3 text-center">
        <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
        <p className="text-sm text-[var(--adm-danger)]">{error}</p>
        <button onClick={fetchJobs} className="rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--adm-accent-strong)]">
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* One panel. The KPI strip is gone: "Open roles" and "Drafts" are values
          of the Status filter, and their share bars measured against every job
          record ever created, which is not a whole those counts are part of. */}
      {/* No share bars. "Open roles 13, 6%" measured against every job record
          ever created, which is not a whole those 13 are part of. */}
      <WorkspaceTitle
        title="Job postings"
        actions={
          <>
            <WorkspaceButton onClick={exportCSV}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {canEdit && (
              <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs/new")}>
                <Plus className="h-4 w-4" />Post a job
              </WorkspaceButton>
            )}
          </>
        }
      />
      {/* Inline stat strip, the table gets the vertical space, not stat cards. */}
      <StatStrip
        items={[
          { label: "Open roles", value: stats.active, onClick: () => setStatusFilter("active") },
          { label: "Closing in 7 days", value: stats.closingSoon,
            tone: stats.closingSoon > 0 ? "warning" : "default",
            hint: "Submission deadline approaching" },
          { label: "No applicants", value: starvedRoles,
            tone: starvedRoles > 0 ? "danger" : "success",
            hint: starvedRoles > 0 ? "Nothing sourced yet" : "Every open role has candidates" },
          { label: "Drafts", value: stats.draft, onClick: () => setStatusFilter("draft") },
        ]}
      />

      {/* Toolbar sits on the canvas between the stat strip and the table, one slim line of search + filters + table controls. */}
      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter jobs by title, client, location or ID"
            />
          }
          trailing={
            <div className="hidden xl:contents">
              <DisplayMenu
                columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
                hidden={hiddenColumns}
                onHiddenChange={setHiddenColumns}
                rows={rows}
                onRowsChange={setRows}
                onReset={() => { setHiddenColumns(["department", "payRate", "billRate"]); setRows(25); }}
              />
            </div>
          }
        >
          <FilterPill
            label="Status"
            icon={FilterIcon.status}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_TABS.map((t) => ({
              value: t.key,
              label: t.label,
              count: statusCounts[t.key] || 0,
            }))}
          />
      </WorkspaceToolbar>

      <ActiveFilters
        variant="canvas"
        chips={statusFilter !== "all"
          ? [{
              label: `Status: ${STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}`,
              onClear: () => setStatusFilter("all"),
            }]
          : []}
        onClearAll={clearFilters}
      />

      <Workspace>
      {/* ── mobile / tablet cards; the grid takes over at xl where it has room ── */}
      <div className="grid gap-3 p-3 md:grid-cols-2 xl:hidden">
        {filteredJobs.length > 0 ? filteredJobs.map((job) => {
          const jv = job as JobWithVendor;
          return (
            <AdminCard key={job.id} hover className="flex h-full flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {job.postingId && (
                    <span className="rounded-[4px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[var(--adm-accent)]">
                      {job.postingId}
                    </span>
                  )}
                  <button
                    onClick={() => router.push(`/admin/jobs/${job.id}`)}
                    className="mt-1.5 block text-left text-sm font-bold leading-snug text-[var(--adm-ink)] transition-colors line-clamp-2 hover:text-[var(--adm-accent)]"
                  >
                    {job.title}
                  </button>
                  <p className="mt-0.5 text-xs capitalize text-[var(--adm-ink-subtle)]">
                    {[job.department, job.type].filter(Boolean).join(" · ") || "–"}
                  </p>
                </div>
                <StatusBadge status={job.status} size="md" />
              </div>

              <div className="mb-4 flex-1 space-y-1.5 text-xs text-[var(--adm-ink-subtle)]">
                {job.clientName && (
                  <div className="flex items-center gap-1.5">
                    <IconBuilding className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
                    <span className="truncate">{job.clientName}</span>
                  </div>
                )}
                {jv.vendorName && (
                  <div className="flex items-center gap-1.5">
                    <IconTruck className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
                    <span className="truncate">{jv.vendorName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <IconLocation className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
                  <span className="truncate">{job.location}{job.state ? `, ${job.state}` : ""}</span>
                </div>
                {job.payRate && (
                  <div className="flex items-center gap-1.5">
                    <IconMoney className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
                    <span className="tabular-nums">
                      ${job.payRate}/hr pay{job.clientBillRate ? ` · $${job.clientBillRate}/hr bill` : ""}
                    </span>
                  </div>
                )}
                {job.submissionDueDate && (
                  <div className="flex items-center gap-1.5">
                    <IconCalendar className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
                    <span>Due {fmtDate(job.submissionDueDate)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--adm-line-soft)] pt-3">
                <span className="flex items-center gap-1 text-xs text-[var(--adm-ink-subtle)]">
                  <IconGroup className="h-3 w-3" />
                  <span className="tabular-nums">{job.applicationsCount || 0}</span> applicants
                </span>
                <div className="flex items-center gap-1">
                  <button onClick={() => router.push(`/admin/jobs/${job.id}`)} aria-label="View job"
                    className="rounded-[6px] p-2.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]">
                    <IconEye className="h-4 w-4" aria-hidden="true" />
                  </button>
                  {canEdit && (
                    <>
                      <button onClick={() => router.push(`/admin/jobs/${job.id}/edit`)} aria-label="Edit job"
                        className="rounded-[6px] p-2.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]">
                        <IconEdit className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button onClick={() => handleDuplicate(job)} disabled={duplicating === job.id} aria-label="Duplicate job"
                        className="rounded-[6px] p-2.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)] disabled:opacity-50">
                        {duplicating === job.id
                          ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                          : <IconCopy className="h-4 w-4" aria-hidden="true" />}
                      </button>
                      <button onClick={() => setShowDeleteConfirm(job.id)} aria-label="Delete job"
                        className="rounded-[6px] p-2.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]">
                        <IconTrash className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </AdminCard>
          );
        }) : (
          <div className="md:col-span-2">
            <AdminCard className="py-6">
              <EmptyJobs jobsEmpty={jobs.length === 0} canEdit={canEdit} hasFilters={hasActiveFilters}
                onCreate={() => router.push("/admin/jobs/new")} onClear={clearFilters} />
            </AdminCard>
          </div>
        )}
      </div>

      {/* ── desktop record grid ── */}
      <div className="hidden xl:contents">
        <DataTable
          noun="jobs"
          storageKey="jobs"
          columns={columns}
          rows={filteredJobs}
          rowKey={(j) => j.id}
          onRowClick={(j) => router.push(`/admin/jobs/${j.id}`)}
          initialSort={{ key: "created", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          empty={{
            icon: IconJob,
            title: jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters",
            description: jobs.length === 0
              ? "Post your first job to start tracking candidates."
              : "Try adjusting your search or status filter.",
            action: jobs.length === 0
              ? (canEdit ? <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs/new")}><Plus className="h-4 w-4" />Post a job</WorkspaceButton> : undefined)
              : (hasActiveFilters ? <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton> : undefined),
          }}
        />
      </div>
      </Workspace>

      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Delete this job?"
        body="This action is permanent and cannot be undone. All associated data will be removed."
        confirmLabel="Yes, Delete"
        busy={deleting}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
      />
    </>
  );
}

// ── empty state for the card view ────────────────────────────────────────────

function EmptyJobs({ jobsEmpty, canEdit, hasFilters, onCreate, onClear }: {
  jobsEmpty: boolean; canEdit: boolean; hasFilters: boolean;
  onCreate: () => void; onClear: () => void;
}) {
  return (
    <div className="py-10 text-center">
      <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-[6px] bg-[var(--adm-surface-2)]">
        <IconJob className="h-7 w-7 text-[var(--adm-ink-subtle)]" />
      </div>
      <h3 className="mb-1 text-base font-bold text-[var(--adm-ink)]">
        {jobsEmpty ? "No jobs posted yet" : "No jobs match your filters"}
      </h3>
      <p className="mb-5 text-sm text-[var(--adm-ink-subtle)]">
        {jobsEmpty ? "Post your first job to start tracking candidates" : "Try adjusting your search or filters"}
      </p>
      {jobsEmpty
        ? canEdit && (
            <WorkspaceButton variant="primary" onClick={onCreate} className="mx-auto"><Plus className="h-4 w-4" />Post a job</WorkspaceButton>
          )
        : hasFilters && (
            <WorkspaceButton onClick={onClear} className="mx-auto"><X className="h-4 w-4" />Clear filters</WorkspaceButton>
          )}
    </div>
  );
}

// ── row action menu ──────────────────────────────────────────────────────────

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
        <button
          className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]"
          aria-label={`Actions for ${job.title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-lg">
        <DropdownMenuItem onClick={onView} className="cursor-pointer rounded-[4px] text-sm">
          <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View Details
        </DropdownMenuItem>
        {canEdit && <>
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer rounded-[4px] text-sm">
            <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} disabled={duplicating} className="cursor-pointer rounded-[4px] text-sm">
            {duplicating
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--adm-ink-subtle)]" />
              : <IconCopy className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />}Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onDelete} className="cursor-pointer rounded-[4px] text-sm text-[var(--adm-danger)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger)]">
            <IconTrash className="mr-2 h-4 w-4" />Delete
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
