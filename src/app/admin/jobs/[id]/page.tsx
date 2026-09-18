"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Check, MoreHorizontal, Plus, SearchX, X } from "lucide-react";
import { toast } from "sonner";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs, canSeeJobCommercials, RECRUITING_ROLES } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
import { renderRichText, renderListField, richTextToPlain } from "@/lib/rich-text";
import { downloadCsv } from "@/lib/csv";
import JobDetailLoading from "./loading";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { usePageCrumb } from "@/components/admin/admin-provider";
import { GridSelect, MenuSelect, RecordFact, RecordHeader, WorkspaceButton } from "@/components/admin/workspace";
import { BestCandidates } from "@/components/admin/best-candidates";
import { JobSubmissions } from "@/components/admin/job-submissions";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { JobTeamCard } from "@/components/admin/job-team-card";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { SearchInput } from "@/components/admin/toolbar";
import { Avatar } from "@/components/admin/avatar";
import {
  IconRequisition, IconBuilding, IconCopy, IconClock,
  IconDownload, IconEdit, IconEye, IconFile, IconHash, IconLocation, IconTruck,
  IconGroup, IconSource, IconSend,
} from "@/components/admin/icons";
import { statusMeta, statusColor, type AppStatus } from "@/components/admin/theme";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Tab = "info" | "applicants" | "submissions" | "candidates";

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
  { key: "all", label: "All stages" },
  ...APP_STATUSES.map((s) => ({ key: s.value as string, label: s.label })),
];

/** Empty-cell placeholder, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">–</span>;
}

/** Label/value row used by the rail panels. */
function MetaRow({ label, value }: { label: string; value?: React.ReactNode }) {
  const empty = value === undefined || value === null || value === "";
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5">
      <dt className="flex-none text-[13px] text-[var(--adm-ink-mute)]">{label}</dt>
      <dd className="min-w-0 break-words text-right text-[13.5px] text-[var(--adm-ink)]">
        {empty ? <Blank /> : value}
      </dd>
    </div>
  );
}

const PROSE =
  "text-[14px] leading-relaxed text-[var(--adm-ink-mute)] [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-1 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:marker:text-[var(--adm-ink-subtle)]";

export default function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: jobId } = use(params);
  const router = useRouter();
  const { user, hasAnyRole } = useAuth();
  const canEdit = canEditJobs(user?.role);
  // Editing the posting and seeing what it earns are separate permissions: the
  // API strips commercials for media, so the page does not render them as blanks.
  const canPrice = canSeeJobCommercials(user?.role);
  // Applicants are recruiting data; Media edits the posting but never manages its pipeline.
  const canManageApplicants = hasAnyRole(RECRUITING_ROLES);

  const [job, setJob]                     = useState<Job | null>(null);
  const [applications, setApplications]   = useState<Application[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [missing, setMissing]             = useState(false);
  const [storedTab, setActiveTab]         = useState<Tab>("applicants");
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [copied, setCopied]               = useState(false);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [editingApp, setEditingApp]       = useState<Application | null>(null);

  /* Media is offered one tab, so it must land on that one. Derived rather than
     held in state: `user` is null on the first render while the session
     resolves, and an initial value read from it would leave a recruiter stuck
     on the tab media gets. */
  const activeTab: Tab = canPrice ? storedTab : "info";

  const debouncedSearch = useDebouncedValue(search, 250);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Applicants are recruiting data — /api/applications answers a media
      // account 403 — so a caller without commercial sight does not ask for
      // them, and the tabs that show them are not rendered below.
      const jobRes = await fetch(`/api/jobs/${jobId}`);
      if (jobRes.status === 404) { setMissing(true); return; }
      const jobData = await jobRes.json();
      if (!jobRes.ok) throw new Error(jobData.error || `HTTP ${jobRes.status}`);
      setJob(jobData.job);

      if (canPrice) {
        const appsRes = await fetch(`/api/applications?jobId=${jobId}`);
        const appsData = await appsRes.json();
        setApplications(appsData.applications || []);
      }
    } catch (err) {
      console.error("Failed to load job:", err);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [jobId, canPrice]);

  useEffect(() => { void fetchData(); }, [fetchData]);

  // Show the job posting code (e.g. JOB-2026-0042) as the top-nav breadcrumb.
  usePageCrumb(job?.postingId);

  const handleStatusChange = async (appId: string, status: Application["status"]) => {
    setApplications((prev) => prev.map((a) => (a.id === appId ? { ...a, status } : a)));
    try {
      const res = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch {
      toast.error("Couldn't update the status. Reloading the latest data.");
      void fetchData();
    }
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

  if (error || missing || !job) {
    const failed = !!error && !missing;
    return (
      <div className="pb-10">
        <RecordHeader back={{ label: "Jobs", href: "/admin/jobs" }} title="Job posting" />
        <AdminCard>
          <EmptyState
            variant={failed ? "error" : "fresh"}
            icon={failed ? undefined : SearchX}
            title={failed ? "Couldn't load this job posting" : "This job posting doesn't exist"}
            description={failed ? (error ?? undefined) : "It may have been deleted, or the link is out of date."}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {failed && <WorkspaceButton variant="primary" onClick={() => void fetchData()}>Try again</WorkspaceButton>}
                <WorkspaceButton onClick={() => router.push("/admin/jobs")}>Back to jobs</WorkspaceButton>
              </div>
            }
          />
        </AdminCard>
      </div>
    );
  }

  const statusLabel = statusMeta[job.status as AppStatus]?.label || job.status;

  // ── applicant grid ──────────────────────────────────────────────────────────
  const columns: DataTableColumn<Application>[] = [
    {
      key: "name", header: "Applicant", sortValue: (a) => a.name || a.email,
      cell: (a) => (
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name} email={a.email} size="sm" />
          <div className="min-w-0 max-w-[220px]">
            <span className="block truncate font-medium text-[var(--adm-ink)]">{a.name || "–"}</span>
            <span className="block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{a.email}</span>
          </div>
        </div>
      ),
    },
    {
      key: "location", header: "Location", sortValue: (a) => a.city || "", hideBelow: "lg",
      cell: (a) => a.city ? (
        <span className="inline-flex items-center gap-1.5 text-[var(--adm-ink-mute)]">
          <IconLocation className="h-3.5 w-3.5 flex-shrink-0 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
          {a.city}{a.state ? `, ${a.state}` : ""}
        </span>
      ) : <Blank />,
    },
    {
      key: "source", header: "Source", sortValue: (a) => a.source || "", hideBelow: "xl",
      cell: (a) => a.source
        ? <span className="rounded-[6px] bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-medium text-[var(--adm-ink-mute)]">{a.source}</span>
        : <Blank />,
    },
    {
      key: "skills", header: "Skills", hideBelow: "xl",
      cell: (a) => {
        const skills = a.skills || [];
        if (skills.length === 0) return <Blank />;
        return (
          <div className="flex max-w-[200px] flex-wrap items-center gap-1">
            {skills.slice(0, 2).map((s) => (
              <span key={s} className="rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11.5px] font-medium text-[var(--adm-ink-mute)]">
                {s}
              </span>
            ))}
            {skills.length > 2 && (
              <span className="px-1 text-[11.5px] font-medium tabular-nums text-[var(--adm-ink-subtle)]">
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
        <GridSelect
          value={a.status}
          dot={statusColor(a.status)}
          width={136}
          ariaLabel={`Stage for ${a.name || a.email}`}
          onChange={(e) => handleStatusChange(a.id, e.target.value as Application["status"])}
        >
          {APP_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </GridSelect>
      ),
    },
    {
      key: "appliedAt", header: "Applied", sortValue: (a) => new Date(a.appliedAt).getTime(), hideBelow: "md",
      cell: (a) => <span className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(a.appliedAt)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      cell: (a) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`Actions for ${a.name || a.email}`}
                className="grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink)]"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={6}
              className="w-52 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
            >
              <DropdownMenuItem onClick={() => router.push(`/admin/candidates/${a.id}`)} className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink)]">
                <IconEye className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />View profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setEditingApp(a); setDrawerOpen(true); }} className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink)]">
                <IconEdit className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />Edit applicant
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
              <DropdownMenuLabel className="px-2 pb-1 pt-1.5 text-[12px] font-medium text-[var(--adm-ink-subtle)]">
                Move to
              </DropdownMenuLabel>
              {APP_STATUSES.filter((s) => s.value !== a.status).map((s) => (
                <DropdownMenuItem
                  key={s.value}
                  onClick={() => handleStatusChange(a.id, s.value)}
                  className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink-mute)]"
                >
                  <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: statusColor(s.value) }} />
                  {s.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const hasRequirements = !!richTextToPlain(job.requirements);
  const hasResponsibilities = !!richTextToPlain(job.responsibilities);

  const tabs = ([
    { id: "applicants" as Tab,  label: "Applicants",      count: applications.length as number | undefined, icon: IconGroup },
    { id: "submissions" as Tab, label: "Submissions",     count: undefined, icon: IconSend },
    { id: "candidates" as Tab,  label: "Best candidates", count: undefined, icon: IconSource },
    { id: "info" as Tab,        label: "About job",       count: undefined, icon: IconFile },
  ]).filter((tab) => canPrice || tab.id === "info");

  const stageOptions = STATUS_FILTERS.map((s) => ({
    value: s.key,
    label: s.label,
    hint: String(s.key === "all" ? applications.length : pipelineCounts[s.key] || 0),
  }));

  return (
    <div className="pb-10">
      <RecordHeader
        back={{ label: "Jobs", href: "/admin/jobs" }}
        title={job.title}
        status={<StatusBadge status={job.status} label={statusLabel} size="md" />}
        meta={
          <>
            {job.postingId && (
              <RecordFact icon={IconHash}>
                <span className="font-mono text-[12.5px]">{job.postingId}</span>
              </RecordFact>
            )}
            {job.department && <RecordFact icon={IconRequisition}>{job.department}</RecordFact>}
            <RecordFact icon={IconLocation}>
              {job.location}{job.state ? `, ${job.state}` : ""}
            </RecordFact>
            {canPrice && job.clientName && <RecordFact icon={IconBuilding}>{job.clientName}</RecordFact>}
            {job.type && (
              <RecordFact icon={IconClock}>
                <span className="capitalize">{job.type.replace(/-/g, " ")}</span>
              </RecordFact>
            )}
          </>
        }
        actions={
          <>
            <WorkspaceButton onClick={copyLink} aria-label={copied ? "Link copied" : "Copy link"}>
              {copied ? <Check className="text-[var(--adm-success-ink)]" aria-hidden="true" /> : <IconCopy aria-hidden="true" />}
              <span className="hidden sm:inline">{copied ? "Copied" : "Copy link"}</span>
            </WorkspaceButton>
            {canManageApplicants && (
              <WorkspaceButton onClick={handleExport} aria-label="Export applicants">
                <IconDownload aria-hidden="true" />
                <span className="hidden sm:inline">Export</span>
              </WorkspaceButton>
            )}
            {canEdit && (
              <WorkspaceButton onClick={() => router.push(`/admin/jobs/${jobId}/edit`)}>
                <IconEdit aria-hidden="true" />Edit
              </WorkspaceButton>
            )}
            {canManageApplicants && (
              <WorkspaceButton variant="primary" onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}>
                <Plus aria-hidden="true" />Add applicant
              </WorkspaceButton>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">

        {/* Main column */}
        <AdminCard className="overflow-hidden">
          <div role="tablist" aria-label="Job sections" className="flex gap-1 overflow-x-auto border-b border-[var(--adm-line)] px-2 sm:px-3">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "-mb-px inline-flex h-11 flex-none items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium transition-colors duration-150",
                    isActive
                      ? "border-[var(--adm-accent)] text-[var(--adm-ink)]"
                      : "border-transparent text-[var(--adm-ink-mute)] hover:border-[var(--adm-line-strong)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  <tab.icon
                    className={cn("h-4 w-4 flex-none", isActive ? "text-[var(--adm-accent)]" : "text-[var(--adm-ink-subtle)]")}
                    aria-hidden="true"
                  />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="rounded-full bg-[var(--adm-surface-2)] px-1.5 py-px text-[11.5px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {activeTab === "submissions" && <JobSubmissions jobId={jobId} />}

          {activeTab === "candidates" && <BestCandidates jobId={jobId} bare />}

          {activeTab === "info" && (
            job.description || hasRequirements || hasResponsibilities ? (
              <div className="space-y-5 p-4">
                {job.description ? (
                  <section>
                    <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Description</h3>
                    <div className={PROSE} dangerouslySetInnerHTML={renderRichText(job.description)} />
                  </section>
                ) : null}

                {hasRequirements && (
                  <section>
                    <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Requirements</h3>
                    <div className={PROSE} dangerouslySetInnerHTML={renderListField(job.requirements)} />
                  </section>
                )}

                {hasResponsibilities && (
                  <section>
                    <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Responsibilities</h3>
                    <div className={PROSE} dangerouslySetInnerHTML={renderListField(job.responsibilities)} />
                  </section>
                )}
              </div>
            ) : (
              <EmptyState
                icon={IconFile}
                title="No posting copy yet"
                description="Add a description, requirements and responsibilities so candidates know what the role involves."
                action={canEdit ? (
                  <WorkspaceButton onClick={() => router.push(`/admin/jobs/${jobId}/edit`)}>
                    <IconEdit aria-hidden="true" />Write the posting
                  </WorkspaceButton>
                ) : undefined}
              />
            )
          )}

          {activeTab === "applicants" && (
            <div>
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
                {applications.length > 0 && (
                  <MenuSelect
                    label="Stage"
                    value={statusFilter}
                    options={stageOptions}
                    onChange={setStatusFilter}
                    align="start"
                  />
                )}
                <span className="ml-auto flex-none text-[13px] tabular-nums text-[var(--adm-ink-subtle)]">
                  <span className="font-medium text-[var(--adm-ink-mute)]">{filteredApps.length}</span> of {applications.length}
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
                  // Secondary: "Add applicant" in the header is this view's filled action.
                  action: applications.length === 0 ? (
                    <WorkspaceButton onClick={() => router.push(`/admin/applications/new?jobId=${jobId}`)}>
                      <Plus aria-hidden="true" />Add applicant
                    </WorkspaceButton>
                  ) : (
                    <WorkspaceButton onClick={() => { setSearch(""); setStatusFilter("all"); }}>
                      <X aria-hidden="true" />Clear filters
                    </WorkspaceButton>
                  ),
                }}
              />
            </div>
          )}
        </AdminCard>

        {/* Right rail, stacks below xl */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
          <AdminCard className="overflow-hidden">
            <AdminCardHeader icon={IconBuilding} title="Role details" />
            <dl className="divide-y divide-[var(--adm-line-soft)] py-1">
              {canPrice && <MetaRow label="Client" value={job.clientName} />}
              {canPrice && <MetaRow label="Vendor" value={job.vendorName ? (
                <span className="inline-flex items-center gap-1.5">
                  <IconTruck className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />{job.vendorName}
                </span>
              ) : undefined} />}
              {canPrice && <MetaRow label="Pay rate" value={job.payRate ? <span className="tabular-nums">${job.payRate}/hr</span> : undefined} />}
              {canPrice && <MetaRow label="Bill rate" value={job.clientBillRate ? <span className="tabular-nums">${job.clientBillRate}/hr</span> : undefined} />}
              <MetaRow
                label="Salary range"
                value={job.salary ? (
                  <span className="tabular-nums">
                    ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}
                  </span>
                ) : undefined}
              />
              <MetaRow label="Deadline" value={job.submissionDueDate ? <span className="tabular-nums">{fmtDate(job.submissionDueDate)}</span> : undefined} />
              <MetaRow label="Created" value={<span className="tabular-nums">{fmtDate(job.createdAt)}</span>} />
              <MetaRow label="Posted by" value={job.postedByName} />
            </dl>
          </AdminCard>

          {/* Always rendered, even when empty: its + is how the first recruiter gets assigned. */}
          {canPrice && <JobTeamCard job={job} canEdit={canEdit} onJobChange={setJob} />}

          {job.clientNotes && (
            <AdminCard className="overflow-hidden">
              <AdminCardHeader icon={IconFile} title="Client notes" />
              <p className="whitespace-pre-wrap p-4 text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">{job.clientNotes}</p>
            </AdminCard>
          )}
        </div>
      </div>

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
