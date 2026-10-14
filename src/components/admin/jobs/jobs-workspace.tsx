"use client";

import { jobLocationLabel } from "@/lib/workplace";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus, X,
} from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs, canSeeJobCommercials } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { refreshApplications, refreshJobs, useJobSummaries } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceButton, WorkspaceSearch, FilterPill, FilterIcon, DisplayMenu, GridSelect, PipelineHeader, PipelineCells,
} from "@/components/admin/workspace";
import { FormInput } from "@/components/admin/forms/primitives";
import { RowMenu } from "@/components/admin/table-cells";
import { JobPreviewDrawer } from "@/components/admin/jobs/job-preview-drawer";
import { ListHeader, ListTabs, ListToolbar, MetaStrong, FilterChips, FilterField, FilterSet, type ListFilter } from "@/components/admin/list-shell";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { statusColor, PIPELINE_STAGES } from "@/components/admin/theme";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { EmptyState } from "@/components/admin/empty-state";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  IconEdit, IconTrash, IconGroup, IconLocation, IconJob,
  IconCopy, IconMoney, IconDownload, IconEye, IconBuilding, IconTruck,
  IconCalendar, IconUser,
} from "@/components/admin/icons";
import JobsLoading from "@/app/portal/(console)/jobs/loading";
import { jobCategory, type JobCategory } from "@/lib/job-status";
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

type PostedKey = "all" | "today" | "7d" | "30d" | "custom";

const POSTED_OPTIONS: { value: PostedKey; label: string }[] = [
  { value: "all",    label: "Any date" },
  { value: "today",  label: "Today" },
  { value: "7d",     label: "Last 7 days" },
  { value: "30d",    label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

/** Assignee names on a posting; records from before multi-assign carry a single name. */
function assigneesOf(j: Job): string[] {
  return (j.assignedToNames?.length ? j.assignedToNames : [j.assignedToName]).filter((n): n is string => !!n);
}

/** Local calendar day as YYYY-MM-DD, the shape a date input holds. */
function dayOf(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Empty-cell placeholder. A quiet dash, never a grey sentence. */
function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

/** Posting ID, set in mono so a column of them scans by character. */
function PostingId({ id }: { id: string }) {
  return (
    <span className="inline-flex rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 font-mono text-adm-xs font-medium text-[var(--adm-ink-mute)]">
      {id}
    </span>
  );
}


const CATEGORY_COPY: Record<JobCategory, { title: string; noun: string; post: string; newHref: string; query: string }> = {
  state: { title: "State roles", noun: "state role", post: "Post a state role", newHref: "/portal/jobs/new", query: "" },
  open:  { title: "Open roles",  noun: "open role",  post: "Post an open role", newHref: "/portal/jobs/new?category=open", query: "?category=open" },
};

/** One list per category; the careers board shows both together. */
export function JobsWorkspace({ category }: { category: JobCategory }) {
  const copy = CATEGORY_COPY[category];
  const router = useRouter();
  const { user } = useAuth();

  const [searchQuery, setSearchQuery]   = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [clientFilter, setClientFilter]     = useState("all");
  const [typeFilter, setTypeFilter]         = useState("all");
  const [postedFilter, setPostedFilter]     = useState<PostedKey>("all");
  const [postedFrom, setPostedFrom]         = useState("");
  const [postedTo, setPostedTo]             = useState("");
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

  // Shared summary list. The staff list endpoint closes past-deadline roles
  // itself, so the client no longer does.
  const jobsRes = useJobSummaries();
  // Row click previews the requisition in a drawer; "Open job" goes to the full page.
  const [preview, setPreview] = useState<Job | null>(null);
  const { setData: setAllJobs } = jobsRes;
  const jobs = useMemo(
    () => (jobsRes.jobs || []).filter((j) => jobCategory(j) === category),
    [jobsRes.jobs, category],
  );
  // Skeleton on first load only; a refetch keeps the list on screen.
  const loading = jobsRes.isLoading;
  const error = !jobsRes.jobs && jobsRes.error ? "Check your connection and try again." : null;
  const fetchJobs = () => void jobsRes.reload();

  const setJobs = useCallback(
    (fn: (list: Job[]) => Job[]) => setAllJobs((d) => ({ ...d, jobs: fn(d?.jobs || []) })),
    [setAllJobs],
  );

  // ── mutations ─────────────────────────────────────────────────────────────

  /** Job ids with a status save in flight; their select is locked until it lands. */
  const [statusPending, setStatusPending] = useState<ReadonlySet<string>>(new Set());

  const handleStatusChange = async (jobId: string, newStatus: Job["status"]) => {
    if (statusPending.has(jobId)) return;
    const prev = jobs.find((j) => j.id === jobId)?.status;
    setStatusPending((s) => new Set(s).add(jobId));
    setJobs((list) => list.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      void refreshJobs();
      toast.success("Status updated");
    } catch {
      if (prev) setJobs((list) => list.map((j) => (j.id === jobId && j.status === newStatus ? { ...j, status: prev } : j)));
      toast.error("Couldn't change the job status. Try again.");
    } finally {
      setStatusPending((s) => { const n = new Set(s); n.delete(jobId); return n; });
    }
  };

  const handleDelete = async (jobId: string) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setJobs((list) => list.filter((j) => j.id !== jobId));
      void refreshJobs();
      // Deleting a posting removes its applications too.
      void refreshApplications();
      setShowDeleteConfirm(null);
      toast.success("Job deleted");
    } catch { toast.error("Couldn't delete the job. Try again."); }
    finally { setDeleting(false); }
  };

  const handleDuplicate = async (job: Job) => {
    setDuplicating(job.id);
    try {
      const res = await fetch(`/api/jobs/${job.id}/duplicate`, { method: "POST" });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || "Couldn't duplicate the job. Try again."); }
      await refreshJobs();
      toast.success("Job duplicated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't duplicate the job. Try again.");
    } finally { setDuplicating(null); }
  };

  // ── derived ───────────────────────────────────────────────────────────────

  const filteredJobs = useMemo(() => jobs.filter((job) => {
    const jv = job as JobWithVendor;
    const q = debouncedSearch.toLowerCase();
    const matchSearch = !q || [job.title, job.department, job.location, job.clientName, jv.vendorName, job.postingId]
      .some((f) => f?.toLowerCase().includes(q));
    const matchStatus = statusFilter === "all" || job.status === statusFilter;
    if (!matchSearch || !matchStatus) return false;

    if (assigneeFilter !== "all") {
      const names = assigneesOf(job);
      if (assigneeFilter === "__none" ? names.length > 0 : !names.includes(assigneeFilter)) return false;
    }
    if (clientFilter !== "all" && (job.clientName || "__none") !== clientFilter) return false;
    if (typeFilter !== "all" && job.type !== typeFilter) return false;

    if (postedFilter !== "all") {
      const day = dayOf(job.createdAt);
      if (postedFilter === "custom") {
        if (postedFrom && day < postedFrom) return false;
        if (postedTo && day > postedTo) return false;
      } else {
        const back = postedFilter === "today" ? 0 : postedFilter === "7d" ? 6 : 29;
        const from = new Date();
        from.setDate(from.getDate() - back);
        if (day < dayOf(from.toISOString())) return false;
      }
    }
    return true;
  // Newest first by default. The detailed view has no Created column to sort
  // on, so without a base order it would fall back to raw fetch order.
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [jobs, debouncedSearch, statusFilter, assigneeFilter, clientFilter, typeFilter, postedFilter, postedFrom, postedTo]);

  /** Filter options come from the loaded roles, with how many roles each one holds. */
  const filterOptions = useMemo(() => {
    const tally = (values: string[]) => {
      const m = new Map<string, number>();
      for (const v of values) m.set(v, (m.get(v) || 0) + 1);
      return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([value, count]) => ({ value, label: value, count }));
    };
    const unassigned = jobs.filter((j) => assigneesOf(j).length === 0).length;
    const noClient = jobs.filter((j) => !j.clientName).length;
    return {
      assignees: [
        { value: "all", label: "Anyone", count: jobs.length },
        ...tally(jobs.flatMap(assigneesOf)),
        ...(unassigned ? [{ value: "__none", label: "Unassigned", count: unassigned }] : []),
      ],
      clients: [
        { value: "all", label: "All clients", count: jobs.length },
        ...tally(jobs.map((j) => j.clientName).filter((c): c is string => !!c)),
        ...(noClient ? [{ value: "__none", label: "No client", count: noClient }] : []),
      ],
      types: [
        { value: "all", label: "All types", count: jobs.length },
        ...tally(jobs.map((j) => j.type).filter(Boolean)).map((o) => ({ ...o, label: o.label.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase()) })),
      ],
    };
  }, [jobs]);

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

  const applicantTotal = useMemo(() => jobs.reduce((s, j) => s + (j.applicationsCount || 0), 0), [jobs]);

  const hasActiveFilters = [statusFilter, assigneeFilter, postedFilter, clientFilter, typeFilter].some((f) => f !== "all")
    || debouncedSearch.trim() !== "";
  const clearFilters = () => {
    setStatusFilter("all"); setAssigneeFilter("all"); setClientFilter("all"); setTypeFilter("all");
    setPostedFilter("all"); setPostedFrom(""); setPostedTo(""); setSearchQuery("");
  };

  // Same split as the grid: the export cannot be the way round the projection.
  const exportCSV = () => downloadCsv(
    category === "open" ? "open-roles" : "state-roles",
    canPrice
      ? ["Job ID","Title","Client","Location","Status","Pay Rate","Bill Rate","Manager","Created","Deadline"]
      : ["Job ID","Title","Department","Location","Status","Created","Deadline"],
    filteredJobs.map((job) => canPrice
      ? [
          job.postingId || "",
          job.title,
          job.clientName || "",
          jobLocationLabel(job),
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
          jobLocationLabel(job),
          job.status,
          fmtDate(job.createdAt),
          job.submissionDueDate ? fmtDate(job.submissionDueDate) : "",
        ]),
  );

  // ── grid columns ──────────────────────────────────────────────────────────

  // Delete destroys the applications on a job, so it follows the API's
  // requireStaff (recruiting roles), not edit rights: media edits, never deletes.
  const rowMenu = useCallback((job: Job) => (
    <RowMenu
      label={job.title}
      busy={duplicating === job.id}
      items={[
        { label: "Preview", icon: IconEye, onSelect: () => setPreview(job) },
        { label: "Open job page", icon: IconJob, href: `/portal/jobs/${job.id}${copy.query}` },
        ...(canEdit ? [
          { label: "Edit", icon: IconEdit, href: `/portal/jobs/${job.id}/edit${copy.query}` },
          { label: "Duplicate", icon: IconCopy, onSelect: () => handleDuplicate(job), disabled: duplicating === job.id },
        ] : []),
        ...(canPrice ? [{ label: "Delete", icon: IconTrash, onSelect: () => setShowDeleteConfirm(job.id), danger: true, separated: true }] : []),
      ]}
    />
  // handleDuplicate is stable enough for this call site; it only reads state setters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [canEdit, canPrice, duplicating, copy.query]);

  const idCol: DataTableColumn<Job> = {
    key: "postingId",
    header: "Job ID",
    width: "96px",
    sortValue: (j) => j.postingId || "",
    cell: (j) => j.postingId ? <PostingId id={j.postingId} /> : <Blank />,
  };

  const titleCol: DataTableColumn<Job> = {
    key: "title",
    header: "Title",
    width: "220px",
    sortValue: (j) => j.title,
    cell: (j) => <span title={j.title} className="block max-w-[200px] truncate font-semibold text-[var(--adm-ink)]">{j.title}</span>,
  };

  const departmentCol: DataTableColumn<Job> = {
    key: "department",
    header: "Department",
    width: "140px",
    sortValue: (j) => j.department || "",
    hideBelow: "xl",
    cell: (j) => j.department
      ? <span title={j.department} className="block max-w-[120px] truncate capitalize text-[var(--adm-ink-mute)]">{j.department}</span>
      : <Blank />,
  };

  const clientCol: DataTableColumn<Job> = {
    key: "client",
    header: "Client",
    width: "140px",
    sortValue: (j) => j.clientName || "",
    hideBelow: "lg",
    cell: (j) => j.clientName ? (
      <span title={j.clientName} className="inline-flex max-w-[120px] items-center gap-1.5 align-middle text-[var(--adm-ink-mute)]">
        <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="min-w-0 truncate">{j.clientName}</span>
      </span>
    ) : <Blank />,
  };

  const locationCol: DataTableColumn<Job> = {
    key: "location",
    header: "Location",
    width: "150px",
    sortValue: (j) => jobLocationLabel(j),
    // Hidden only when the table holds no pricing columns to make room for.
    hideBelow: canPrice ? "xl" : "lg",
    cell: (j) => (
      <span title={jobLocationLabel(j) || undefined} className="inline-flex max-w-32 items-center gap-1.5 align-middle text-[var(--adm-ink-mute)]">
        <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
        <span className="min-w-0 truncate">{jobLocationLabel(j) || "–"}</span>
      </span>
    ),
  };

  const statusCol: DataTableColumn<Job> = {
    key: "status",
    header: "Status",
    label: "Status",
    width: "150px",
    sortValue: (j) => j.status,
    // Was a bare <select>, so Windows drew its own grey bevel inside an
    // otherwise designed grid and the cell resized as the label changed.
    cell: (j) => canEdit ? (
      <span
        aria-busy={statusPending.has(j.id) || undefined}
        className={cn("inline-flex", statusPending.has(j.id) && "pointer-events-none opacity-60")}
      >
        <GridSelect
          value={j.status}
          dot={statusColor(j.status)}
          ariaLabel={`Status for ${j.title}`}
          onChange={(e) => void handleStatusChange(j.id, e.target.value as Job["status"])}
        >
          {JOB_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </GridSelect>
      </span>
    ) : <StatusBadge status={j.status} />,
  };

  const assigneesCol: DataTableColumn<Job> = {
    key: "assignees",
    header: "Assignees",
    label: "Assignees",
    width: "160px",
    sortValue: (j) => assigneesOf(j).join(", "),
    cell: (j) => {
      const names = assigneesOf(j);
      if (names.length === 0) return <span className="italic text-[var(--adm-ink-subtle)]">Unassigned</span>;
      return (
        <span className="inline-flex max-w-full items-center gap-2 align-middle" title={names.join(", ")}>
          <span className="flex flex-none -space-x-1.5">
            {names.slice(0, 3).map((n) => <Avatar key={n} name={n} size="sm" className="ring-2 ring-[var(--adm-surface)]" />)}
          </span>
          <span className="block min-w-0 max-w-[80px] truncate text-[var(--adm-ink-mute)]">
            {names.length === 1 ? names[0] : `${names[0].split(" ")[0]} +${names.length - 1}`}
          </span>
        </span>
      );
    },
  };

  const applicantsCol: DataTableColumn<Job> = {
    key: "applicants",
    header: "Applicants",
    align: "right",
    width: "104px",
    sortValue: (j) => j.applicationsCount || 0,
    cell: (j) => (
      <span className="inline-flex items-center gap-1.5 tabular-nums text-[var(--adm-ink-mute)]">
        <IconGroup className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" />
        {j.applicationsCount || 0}
      </span>
    ),
  };

  // Where each role's candidates sit, stage by stage; opens the role on click like the rest of the row.
  const pipelineCol: DataTableColumn<Job> = {
    key: "pipeline",
    header: <PipelineHeader stages={PIPELINE_STAGES} />,
    label: "Pipeline by stage",
    align: "right",
    hideBelow: "xl",
    width: `${PIPELINE_STAGES.length * 58 + 24}px`,
    cell: (j) => <PipelineCells stages={PIPELINE_STAGES} counts={j.pipeline} />,
  };

  const createdCol: DataTableColumn<Job> = {
    key: "created",
    header: "Created",
    width: "110px",
    sortValue: (j) => new Date(j.createdAt).getTime(),
    hideBelow: "xl",
    cell: (j) => <span className="text-adm-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(j.createdAt)}</span>,
  };

  const actionsCol: DataTableColumn<Job> = {
    key: "actions",
    header: "",
    align: "right",
    width: "56px",
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
        // Assignees sit beside the title: who owns a role is asked before where it is.
        idCol, titleCol, assigneesCol, departmentCol, clientCol, locationCol,
        payCol, billCol, statusCol, applicantsCol, pipelineCol, createdCol, actionsCol,
      ]
    : [idCol, titleCol, departmentCol, locationCol, statusCol, createdCol, actionsCol];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <JobsLoading />;

  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        variant="error"
        title={`Couldn't load ${copy.title.toLowerCase()}`}
        description={error}
        action={<WorkspaceButton onClick={fetchJobs}>Try again</WorkspaceButton>}
      />
    </div>
  );

  const emptyAction = jobs.length === 0
    ? (canEdit ? <WorkspaceButton onClick={() => router.push(copy.newHref)}><Plus />{copy.post}</WorkspaceButton> : undefined)
    : (hasActiveFilters ? <WorkspaceButton onClick={clearFilters}><X />Clear filters</WorkspaceButton> : undefined);

  const listFilters: ListFilter[] = [
    ...(canPrice ? [{ key: "assigned-to", label: "Assigned to", value: assigneeFilter, onChange: setAssigneeFilter, options: filterOptions.assignees }] : []),
    { key: "posted", label: "Posted", value: postedFilter, onChange: (v) => { setPostedFilter(v as PostedKey); if (v !== "custom") { setPostedFrom(""); setPostedTo(""); } }, options: POSTED_OPTIONS },
    ...(canPrice ? [{ key: "client", label: "Client", value: clientFilter, onChange: setClientFilter, options: filterOptions.clients }] : []),
    { key: "type", label: "Type", value: typeFilter, onChange: setTypeFilter, options: filterOptions.types },
  ];

  return (
    // Full-height column: the grid (or the row list below xl) scrolls inside the panel.
    <div className="flex h-full min-h-0 flex-col">
      <ListHeader
        title={copy.title}
        meta={<>
          {jobs.length.toLocaleString()} {copy.noun}{jobs.length === 1 ? "" : "s"}, {applicantTotal.toLocaleString()} applicant{applicantTotal === 1 ? "" : "s"}
          {starvedRoles ? <>, <MetaStrong>{starvedRoles} live with no applicants yet</MetaStrong></> : null}
        </>}
        actions={
          <>
            <WorkspaceButton onClick={exportCSV} aria-label="Export CSV">
              <IconDownload /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {canEdit && (
              <WorkspaceButton variant="primary" onClick={() => router.push(copy.newHref)}>
                <Plus />{copy.post}
              </WorkspaceButton>
            )}
          </>
        }
      />

      <Workspace>
        <ListToolbar
          tabs={
            <ListTabs
              label="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              tabs={STATUS_TABS.map((t) => ({ key: t.key, label: t.label, count: statusCounts[t.key] || 0 }))}
            />
          }
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search title, client, location or ID…"
            />
          }
        >
          <FilterSet filters={listFilters}>
            {postedFilter === "custom" && (
              <div className="grid grid-cols-2 gap-2">
                <FilterField label="Posted from" htmlFor="filter-posted-from">
                  <FormInput
                    id="filter-posted-from"
                    type="date"
                    value={postedFrom}
                    max={postedTo || undefined}
                    onChange={(e) => setPostedFrom(e.target.value)}
                    className="h-8 px-2 text-adm-base"
                  />
                </FilterField>
                <FilterField label="To" htmlFor="filter-posted-to">
                  <FormInput
                    id="filter-posted-to"
                    type="date"
                    value={postedTo}
                    min={postedFrom || undefined}
                    onChange={(e) => setPostedTo(e.target.value)}
                    className="h-8 px-2 text-adm-base"
                  />
                </FilterField>
              </div>
            )}
          </FilterSet>
          {/* The grid, and so its Display settings, only shows from xl. */}
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
        </ListToolbar>
        <FilterChips filters={listFilters} />

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
                          onClick={() => router.push(`/portal/jobs/${job.id}${copy.query}`)}
                          className="min-w-0 max-w-full truncate text-left text-adm-base font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                        >
                          {job.title}
                        </button>
                        {job.postingId && <PostingId id={job.postingId} />}
                      </div>
                      {kind && <p className="mt-0.5 truncate text-adm-xs capitalize text-[var(--adm-ink-mute)]">{kind}</p>}

                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-adm-xs text-[var(--adm-ink-subtle)]">
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
                          <span className="truncate">{jobLocationLabel(job) || "–"}</span>
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
                        {canPrice && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <IconUser className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
                            <span className="truncate">{assigneesOf(job).join(", ") || "Unassigned"}</span>
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
              title={jobs.length === 0 ? `No ${copy.noun}s posted yet` : `No ${copy.noun}s match your filters`}
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
            onRowClick={(j) => setPreview(j)}
            initialSort={{ key: "created", dir: "desc" }}
            pageSize={rows}
            onPageSizeChange={setRows}
            hiddenColumns={hiddenColumns}
            empty={{
              icon: IconJob,
              title: jobs.length === 0 ? `No ${copy.noun}s posted yet` : `No ${copy.noun}s match your filters`,
              description: jobs.length === 0
                ? "Post your first job to start tracking candidates."
                : "Try a different search, or clear the status filter.",
              action: emptyAction,
            }}
          />
        </div>
      </Workspace>

      <JobPreviewDrawer job={preview} query={copy.query} canEdit={canEdit} onClose={() => setPreview(null)} />

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

