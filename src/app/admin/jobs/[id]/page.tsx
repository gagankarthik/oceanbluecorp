"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Check, ChevronLeft, MoreHorizontal, Plus, X,
} from "lucide-react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { renderRichText, renderListField, richTextToPlain } from "@/lib/rich-text";
import { downloadCsv } from "@/lib/csv";
import JobDetailLoading from "./loading";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { usePageCrumb } from "@/components/admin/admin-provider";
import { WorkspaceButton } from "@/components/admin/workspace";
import { BestCandidates } from "@/components/admin/best-candidates";
import { JobSubmissions } from "@/components/admin/job-submissions";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { JobTeamCard } from "@/components/admin/job-team-card";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { StatusBadge } from "@/components/admin/status-badge";
import { SearchInput } from "@/components/admin/toolbar";
import { Avatar } from "@/components/admin/avatar";
import {
  IconRequisition, IconWarning, IconBuilding, IconCopy, IconMoney,
  IconDownload, IconEdit, IconEye, IconFile, IconHash, IconLocation, IconTruck,
  IconGroup, IconSource, IconSend,
} from "@/components/admin/icons";
import { statusMeta, PIPELINE_STAGES, SERIES, type AppStatus } from "@/components/admin/theme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Tab = "info" | "applicants" | "submissions" | "candidates";

const DAY = 86400000;

const APP_STATUSES: { value: Application["status"]; label: string }[] = [
  { value: "pending",   label: "New"       },
  { value: "reviewing", label: "Screening" },
  { value: "submitted", label: "Submitted" },
  { value: "interview", label: "Interview" },
  { value: "offered",   label: "Offered"   },
  { value: "hired",     label: "Hired"     },
  { value: "rejected",  label: "Rejected"  },
];

const STATUS_FILTERS = [
  { key: "all", label: "All" },
  ...APP_STATUSES.map((s) => ({ key: s.value as string, label: s.label })),
];

/** Empty-cell placeholder, an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]"></span>;
}

/** Right-aligned metadata row used by the sidebar panels. */
function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 px-5 py-2.5">
      <dt className="flex-none text-[13px] font-medium text-[var(--adm-ink-subtle)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[13px] text-[var(--adm-ink)]">
        {empty ? <Blank /> : value}
      </dd>
    </div>
  );
}

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = canEditJobs(user?.role);

  const [job, setJob]                     = useState<Job | null>(null);
  const [applications, setApplications]   = useState<Application[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [activeTab, setActiveTab]         = useState<Tab>("applicants");
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [copied, setCopied]               = useState(false);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [editingApp, setEditingApp]       = useState<Application | null>(null);

  const debouncedSearch = useDebouncedValue(search, 250);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [jobRes, appsRes] = await Promise.all([
        fetch(`/api/jobs/${jobId}`),
        fetch(`/api/applications?jobId=${jobId}`),
      ]);
      const [jobData, appsData] = await Promise.all([jobRes.json(), appsRes.json()]);
      if (!jobRes.ok) throw new Error(jobData.error || "Failed to fetch job");
      setJob(jobData.job);
      setApplications(appsData.applications || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Show the job posting code (e.g. JOB-2026-0042) as the top-nav breadcrumb.
  usePageCrumb(job?.postingId);

  const handleStatusChange = async (appId: string, status: Application["status"]) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    try {
      await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
    } catch { void fetchData(); }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredApps = applications.filter((a) => {
    const q = debouncedSearch.toLowerCase();
    const matchQ = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    const matchS  = statusFilter === "all" || a.status === statusFilter;
    return matchQ && matchS;
  });

  const handleExport = () => downloadCsv(
    `${job?.title?.replace(/\s+/g, "_") || "job"}_applicants`,
    ["Name", "Email", "Phone", "Status", "Applied", "Source", "Work Auth"],
    filteredApps.map((a) => [
      a.name, a.email, a.phone || "", a.status,
      fmtDate(a.appliedAt), a.source || "", a.workAuthorization || "",
    ]),
  );

  const pipelineCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <JobDetailLoading />;

  if (error || !job) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
          <p className="text-sm text-[var(--adm-danger)]">{error || "Job not found"}</p>
          <WorkspaceButton variant="primary" onClick={() => router.push("/admin/jobs")}>Back to Jobs</WorkspaceButton>
        </div>
      </div>
    );
  }

  const statusLabel = statusMeta[job.status as AppStatus]?.label || job.status;

  // ── summary figures ─────────────────────────────────────────────────────────
  const hired      = pipelineCounts["hired"] || 0;
  const rejected   = pipelineCounts["rejected"] || 0;

  // ── applicant grid ──────────────────────────────────────────────────────────
  const columns: DataTableColumn<Application>[] = [
    {
      key: "name", header: "Applicant", sortValue: (a) => a.name || a.email,
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} email={a.email} size="sm" />
          <div className="min-w-0 max-w-[200px]">
            <span className="block truncate font-semibold text-[var(--adm-ink)]">{a.name || "–"}</span>
            <span className="block truncate text-xs text-[var(--adm-ink-subtle)]">{a.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "location", header: "Location", sortValue: (a) => a.city || "", hideBelow: "lg",
      cell: (a) => a.city ? (
        <span className="inline-flex items-center gap-1.5 text-[var(--adm-ink-mute)]">
          <IconLocation className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" />
          {a.city}{a.state ? `, ${a.state}` : ""}
        </span>
      ) : <Blank />,
    },
    {
      key: "source", header: "Source", sortValue: (a) => a.source || "", hideBelow: "xl",
      cell: (a) => a.source
        ? <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-xs font-medium text-[var(--adm-ink-mute)]">{a.source}</span>
        : <Blank />,
    },
    {
      key: "skills", header: "Skills", hideBelow: "xl",
      cell: (a) => {
        const skills = a.skills || [];
        if (skills.length === 0) return <Blank />;
        return (
          <div className="flex max-w-[180px] flex-wrap items-center gap-1">
            {skills.slice(0, 2).map((s) => (
              <span key={s} className="rounded-[4px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--adm-accent)]">
                {s}
              </span>
            ))}
            {skills.length > 2 && (
              <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--adm-ink-subtle)]">
                +{skills.length - 2}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: "status", header: "Stage", sortValue: (a) => a.status,
      cell: (a) => (
        <select
          value={a.status}
          autoComplete="off"
          aria-label={`Stage for ${a.name || a.email}`}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => handleStatusChange(a.id, e.target.value as Application["status"])}
          className="cursor-pointer rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2 py-1.5 text-xs text-[var(--adm-ink-mute)] transition-colors focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
        >
          {APP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      ),
    },
    {
      key: "appliedAt", header: "Applied", sortValue: (a) => new Date(a.appliedAt).getTime(), hideBelow: "md",
      cell: (a) => <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(a.appliedAt)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      cell: (a) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={`Actions for ${a.name || a.email}`}
                className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink-mute)]"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-lg">
              <DropdownMenuItem onClick={() => router.push(`/admin/candidates/${a.id}`)} className="cursor-pointer rounded-[4px] text-sm">
                <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditingApp(a); setDrawerOpen(true); }} className="cursor-pointer rounded-[4px] text-sm">
                <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit applicant
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Move to</p>
                {APP_STATUSES.filter((s) => s.value !== a.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(a.id, s.value)}
                    className="flex w-full items-center gap-2 rounded-[4px] px-2 py-1 text-left text-xs text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const hasRequirements = !!richTextToPlain(job.requirements);
  const hasResponsibilities = !!richTextToPlain(job.responsibilities);
  const assignees = job.assignedToNames || [];

  return (
    <div className="space-y-5 pb-10">

      {/* ── Record header ──
          Plain on the canvas: no white band, no bottom rule, and no tinted
          icon tile beside the title. The tile repeated the icon the sidebar's
          active row already shows. */}
      <div>
        <button
          onClick={() => router.push("/admin/jobs")}
          className="mb-3 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-accent)]"
        >
          <ChevronLeft className="h-4 w-4" /> Back to jobs
        </button>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="hidden">
              <IconRequisition className="h-5 w-5 text-[var(--adm-accent)]" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[20px] font-bold leading-tight tracking-tight text-[var(--adm-ink)]">{job.title}</h1>
                {job.postingId && (
                  <span className="inline-flex items-center gap-1 rounded-[4px] bg-[var(--adm-accent-soft)] px-2 py-0.5 font-mono text-[11px] font-semibold text-[var(--adm-accent)]">
                    <IconHash className="h-3 w-3" />{job.postingId}
                  </span>
                )}
                <StatusBadge status={job.status} label={statusLabel} size="md" />
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--adm-ink-subtle)]">
                {job.department && (
                  <span className="inline-flex items-center gap-1.5">
                    <IconRequisition className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{job.department}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <IconLocation className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                  {job.location}{job.state ? `, ${job.state}` : ""}
                </span>
                {job.clientName && (
                  <span className="inline-flex items-center gap-1.5">
                    <IconBuilding className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{job.clientName}
                  </span>
                )}
                {job.type && (
                  <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-medium capitalize text-[var(--adm-ink-mute)]">
                    {job.type.replace(/-/g, " ")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
            <WorkspaceButton onClick={copyLink}>
              {copied ? <Check className="h-4 w-4 text-[var(--adm-success)]" /> : <IconCopy className="h-4 w-4" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
            </WorkspaceButton>
            <WorkspaceButton onClick={handleExport}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {canEdit && (
              <WorkspaceButton onClick={() => router.push(`/admin/jobs/${jobId}/edit`)}>
                <IconEdit className="h-4 w-4" />Edit
              </WorkspaceButton>
            )}
            <WorkspaceButton variant="primary" onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}>
              <Plus className="h-4 w-4" />Add Applicant
            </WorkspaceButton>
          </div>
        </div>
      </div>

      {/* ── Body: main + sidebar ── */}
      <div className="grid items-start gap-4 lg:grid-cols-3">

        {/* Main column */}
        <AdminCard className="overflow-hidden lg:col-span-2">
          {/* Tab bar */}
          <div className="flex border-b border-[var(--adm-line)] px-2">
            {([
              { id: "applicants" as Tab,  label: "Applicants",      count: applications.length, icon: IconGroup },
              { id: "submissions" as Tab, label: "Submissions",     count: undefined,          icon: IconSend },
              { id: "candidates" as Tab,  label: "Best candidates", count: undefined,          icon: IconSource },
              { id: "info" as Tab,        label: "About job",       count: undefined,          icon: IconFile },
            ] as const).map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-[13.5px] font-semibold transition-colors",
                    isActive
                      ? "border-[var(--adm-accent)] text-[var(--adm-accent)]"
                      : "border-transparent text-[var(--adm-ink-subtle)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <tab.icon className="h-4 w-4 flex-none" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                      isActive ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]" : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Submissions raised for this requisition ── */}
          {activeTab === "submissions" && <JobSubmissions jobId={jobId} />}

          {/* ── Best candidates ── */}
          {activeTab === "candidates" && <BestCandidates jobId={jobId} bare />}

          {/* ── About job ── */}
          {activeTab === "info" && (
            <div className="space-y-6 p-5">
              {job.description ? (
                <section>
                  <h3 className="mb-2 text-[13px] font-medium text-[var(--adm-ink-subtle)]">Description</h3>
                  <div
                    className="text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={renderRichText(job.description)}
                  />
                </section>
              ) : null}

              {hasRequirements && (
                <section>
                  <h3 className="mb-2 text-[13px] font-medium text-[var(--adm-ink-subtle)]">Requirements</h3>
                  <div
                    className="text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-[var(--adm-accent)]"
                    dangerouslySetInnerHTML={renderListField(job.requirements)}
                  />
                </section>
              )}

              {hasResponsibilities && (
                <section>
                  <h3 className="mb-2 text-[13px] font-medium text-[var(--adm-ink-subtle)]">Responsibilities</h3>
                  <div
                    className="text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)] [&_ul]:space-y-1.5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:marker:text-[var(--adm-ink-subtle)]"
                    dangerouslySetInnerHTML={renderListField(job.responsibilities)}
                  />
                </section>
              )}

              {!job.description && !hasRequirements && !hasResponsibilities && (
                <p className="py-6 text-center text-[13px] text-[var(--adm-ink-subtle)]">No posting copy recorded for this role.</p>
              )}
            </div>
          )}

          {/* ── Applicants ── */}
          {activeTab === "applicants" && (
            <div>
              {/* Stage filter */}
              {applications.length > 0 && (
                <div className="flex flex-wrap gap-1.5 border-b border-[var(--adm-line-soft)] px-5 py-3">
                  {STATUS_FILTERS.map((s) => {
                    const count = s.key === "all" ? applications.length : pipelineCounts[s.key] || 0;
                    const isActive = statusFilter === s.key;
                    return (
                      <button
                        key={s.key}
                        onClick={() => setStatusFilter(s.key)}
                        aria-pressed={isActive}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-xs font-semibold transition-colors",
                          isActive ? "bg-[var(--adm-accent)] text-white" : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)]",
                        )}
                      >
                        {s.label}
                        <span className={cn(
                          "rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums",
                          isActive ? "bg-white/25 text-white" : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
                        )}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Search */}
              <div className="flex flex-wrap items-center gap-3 border-b border-[var(--adm-line-soft)] px-5 py-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
                <span className="flex-none text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">
                  <span className="font-semibold text-[var(--adm-ink-mute)]">{filteredApps.length}</span> of {applications.length}
                </span>
              </div>

              <DataTable
                columns={columns}
                rows={filteredApps}
                rowKey={(a) => a.id}
                onRowClick={(a) => router.push(`/admin/candidates/${a.id}`)}
                pageSize={25}
                initialSort={{ key: "appliedAt", dir: "desc" }}
                empty={{
                  icon: IconGroup,
                  title: applications.length === 0 ? "No applicants yet" : "No applicants match your filters",
                  description: applications.length === 0
                    ? "Add the first applicant for this role."
                    : "Try adjusting your search or stage filter.",
                  action: applications.length === 0 ? (
                    <WorkspaceButton variant="primary" onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}>
                      <Plus className="h-4 w-4" />Add applicant
                    </WorkspaceButton>
                  ) : (
                    <WorkspaceButton onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                      <X className="h-4 w-4" />Clear filters
                    </WorkspaceButton>
                  ),
                }}
              />
            </div>
          )}
        </AdminCard>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Commercials + provenance */}
          <AdminCard className="overflow-hidden">
            <AdminCardHeader icon={IconBuilding} title="Role details" />
            <dl className="divide-y divide-[var(--adm-line-soft)]">
              <MetaRow label="Client" value={job.clientName} />
              <MetaRow label="Vendor" value={job.vendorName ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconTruck className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />{job.vendorName}
                </span>
              ) : undefined} />
              <MetaRow label="Pay rate" value={job.payRate ? <span className="tabular-nums">${job.payRate}/hr</span> : undefined} />
              <MetaRow label="Bill rate" value={job.clientBillRate ? <span className="tabular-nums">${job.clientBillRate}/hr</span> : undefined} />
              <MetaRow
                label="Salary range"
                value={job.salary ? (
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <IconMoney className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                    {job.salary.min.toLocaleString()} – {job.salary.max.toLocaleString()}
                  </span>
                ) : undefined}
              />
              <MetaRow label="Deadline" value={job.submissionDueDate ? fmtDate(job.submissionDueDate) : undefined} />
              <MetaRow label="Created" value={fmtDate(job.createdAt)} />
              <MetaRow label="Posted by" value={job.postedByName} />
            </dl>
          </AdminCard>

          {/* Team. Always rendered now, even when empty: the + in its header
              is how a recruiter gets added, so hiding the card when nobody is
              assigned hid the only way to assign the first one. */}
          <JobTeamCard job={job} canEdit={canEdit} onJobChange={setJob} />

          {/* Client notes */}
          {job.clientNotes && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={IconFile} title="Client notes" />
              <p className="whitespace-pre-wrap px-5 py-4 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">{job.clientNotes}</p>
            </AdminCard>
          )}
        </div>
      </div>

      {/* ── Edit existing applicant (drawer only) ── */}
      <CandidateEditDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode="edit"
        candidate={editingApp}
        jobs={job ? [job] : []}
        defaultJobId={jobId}
        onSaved={(saved) => {
          setApplications((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
        }}
      />
    </div>
  );
}
