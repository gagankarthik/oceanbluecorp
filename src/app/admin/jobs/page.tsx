"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, Loader2, MoreHorizontal, X,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, GridSelect, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { statusColor } from "@/components/admin/theme";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  IconEdit, IconTrash, IconGroup, IconLocation, IconJob,
  IconCopy, IconMoney, IconDownload, IconEye, IconBuilding, IconTruck,
  IconCalendar,
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
  { value: "on-hold", label: "On hold" },
  { value: "closed",  label: "Closed" },
];

const STATUS_TABS = [
  { key: "all",     label: "All" },
  { key: "active",  label: "Active" },
  { key: "open",    label: "Open" },
  { key: "draft",   label: "Draft" },
  { key: "on-hold", label: "On hold" },
  { key: "closed",  label: "Closed" },
];

/** Empty-cell placeholder. A quiet dash, never a grey sentence. */
function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

/** Posting ID, set in mono so a column of them scans by character. */
function PostingId({ id }: { id: string }) {
  return (
    <span className="inline-flex rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-[12px] font-medium text-[var(--adm-ink-mute)]">
      {id}
    </span>
  );
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
  // Recruiters and media both read postings without editing them. Named in
  // JOB_EDIT_ROLES rather than spelled as "not a recruiter", which quietly
  // granted edit rights to every role added afterwards.
  const canEdit = canEditJobs(user?.role);
  // Media edits postings but is served the public projection, so client and
  // the two rate columns would be three columns of em-dashes for it — an
  // absence rendered as data (DESIGN_SYSTEM §8, Selective Attention). They are
  // not in its column list at all.
  const canPrice = canSeeJobCommercials(user?.role);

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/jobs?fields=summary");
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
      console.error("Failed to load job postings:", err);
      setError("Check your connection and try again.");
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

  // Same split as the grid: the export cannot be the way round the projection.
  const exportCSV = () => downloadCsv(
    "jobs",
    canPrice
      ? ["Job ID","Title","Client","Location","Status","Pay Rate","Bill Rate","Manager","Created","Deadline"]
      : ["Job ID","Title","Department","Location","Status","Created","Deadline"],
    filteredJobs.map((job) => canPrice
      ? [
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
        ]
      : [
          job.postingId || "",
          job.title,
          job.department || "",
          `${job.location}${job.state ? `, ${job.state}` : ""}`,
          job.status,
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
    cell: (j) => j.postingId ? <PostingId id={j.postingId} /> : <Blank />,
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
    cell: (j) => <span className="text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(j.createdAt)}</span>,
  };

  const actionsCol: DataTableColumn<Job> = {
    key: "actions",
    header: "",
    align: "right",
    cell: (j) => <div onClick={(e) => e.stopPropagation()}>{rowMenu(j)}</div>,
  };

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

  // One column list; the "detailed" columns start hidden in the Display menu.
  const columns: DataTableColumn<Job>[] = canPrice
    ? [
        idCol, titleCol, departmentCol, clientCol, locationCol,
        payCol, billCol, statusCol, applicantsCol, createdCol, actionsCol,
      ]
    : [idCol, titleCol, departmentCol, locationCol, statusCol, createdCol, actionsCol];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <JobsLoading />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        variant="error"
        title="Couldn't load job postings"
        description={error}
        action={<WorkspaceButton onClick={fetchJobs}>Try again</WorkspaceButton>}
      />
    </div>
  );

  const emptyAction = jobs.length === 0
    ? (canEdit ? <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs/new")}><Plus />Post a job</WorkspaceButton> : undefined)
    : (hasActiveFilters ? <WorkspaceButton onClick={clearFilters}><X />Clear filters</WorkspaceButton> : undefined);

  return (
    // Full-height column: the grid (or the row list below xl) scrolls inside the panel.
    <div className="flex h-full min-h-0 flex-col">
      <WorkspaceTitle
        title="Job postings"
        meta={`${stats.total.toLocaleString()} posting${stats.total === 1 ? "" : "s"} · ${stats.applicants.toLocaleString()} applicant${stats.applicants === 1 ? "" : "s"}`}
        actions={
          <>
            <WorkspaceButton onClick={exportCSV}>
              <IconDownload /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {canEdit && (
              <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs/new")}>
                <Plus />Post a job
              </WorkspaceButton>
            )}
          </>
        }
      />

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
        {/* Below xl: a row list, the grid takes over where it has room. */}
        <div className="min-h-0 flex-1 overflow-auto xl:hidden">
          {filteredJobs.length > 0 ? (
            <ul className="divide-y divide-[var(--adm-line-soft)]">
              {filteredJobs.map((job) => {
                const jv = job as JobWithVendor;
                const kind = [job.department, job.type].filter(Boolean).join(" · ");
                return (
                  <li key={job.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--adm-row-hover)] sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <button
                          type="button"
                          onClick={() => router.push(`/admin/jobs/${job.id}`)}
                          className="min-w-0 max-w-full truncate text-left text-[14px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                        >
                          {job.title}
                        </button>
                        {job.postingId && <PostingId id={job.postingId} />}
                      </div>
                      {kind && <p className="mt-0.5 truncate text-[13px] capitalize text-[var(--adm-ink-mute)]">{kind}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-[var(--adm-ink-subtle)]">
                        {canPrice && job.clientName && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <IconBuilding className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            <span className="truncate">{job.clientName}</span>
                          </span>
                        )}
                        {jv.vendorName && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <IconTruck className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            <span className="truncate">{jv.vendorName}</span>
                          </span>
                        )}
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <IconLocation className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                          <span className="truncate">{job.location}{job.state ? `, ${job.state}` : ""}</span>
                        </span>
                        {job.payRate && (
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <IconMoney className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            ${job.payRate}/hr pay{job.clientBillRate ? ` · $${job.clientBillRate}/hr bill` : ""}
                          </span>
                        )}
                        {job.submissionDueDate && (
                          <span className="inline-flex items-center gap-1.5 tabular-nums">
                            <IconCalendar className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            Due {fmtDate(job.submissionDueDate)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <IconGroup className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                          <span className="font-medium tabular-nums text-[var(--adm-ink-mute)]">{job.applicationsCount || 0}</span>
                          applicant{(job.applicationsCount || 0) === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-none items-center gap-1">
                      <StatusBadge status={job.status} />
                      {rowMenu(job)}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              icon={IconJob}
              variant={jobs.length === 0 ? "fresh" : "filtered"}
              title={jobs.length === 0 ? "No jobs posted yet" : "No jobs match your filters"}
              description={jobs.length === 0
                ? "Post your first job to start tracking candidates."
                : "Try a different search, or clear the status filter."}
              action={emptyAction}
            />
          )}
        </div>

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
                : "Try a different search, or clear the status filter.",
              action: emptyAction,
            }}
          />
        </div>
      </Workspace>

      <ConfirmDialog
        open={!!showDeleteConfirm}
        title="Delete this job?"
        body="This action is permanent and cannot be undone. All associated data will be removed."
        confirmLabel="Delete job"
        busy={deleting}
        onCancel={() => setShowDeleteConfirm(null)}
        onConfirm={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
      />
    </div>
  );
}

// ── row action menu ──────────────────────────────────────────────────────────

const menuItemCls = "cursor-pointer rounded-[6px] px-2 py-1.5 text-[13px]";

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
          type="button"
          aria-label={`Actions for ${job.title}`}
          className="grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink)]"
        >
          {duplicating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={4}
        className="w-48 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        <DropdownMenuItem onClick={onView} className={menuItemCls}>
          <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View details
        </DropdownMenuItem>
        {canEdit && <>
          <DropdownMenuItem onClick={onEdit} className={menuItemCls}>
            <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onDuplicate} disabled={duplicating} className={menuItemCls}>
            {duplicating
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-[var(--adm-ink-subtle)]" />
              : <IconCopy className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />}Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
          <DropdownMenuItem
            onClick={onDelete}
            className={cn(menuItemCls, "text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]")}
          >
            <IconTrash className="mr-2 h-4 w-4" />Delete
          </DropdownMenuItem>
        </>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
