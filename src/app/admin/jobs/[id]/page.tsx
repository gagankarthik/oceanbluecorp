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
import { isPubliclyOpen, jobCategory, JOB_LIST_HREF, JOB_LIST_LABEL } from "@/lib/job-status";
import { CandidateEditDrawer } from "@/components/admin/candidate-edit-drawer";
import { usePageCrumb, useNavSection } from "@/components/admin/admin-provider";
import { GridSelect, RecordFact, RecordHeader, StageStrip, WorkspaceButton } from "@/components/admin/workspace";
import { BestCandidates } from "@/components/admin/best-candidates";
import { JobSubmissions } from "@/components/admin/job-submissions";
import { AdminCard } from "@/components/admin/admin-card";
import { JobTeamCard } from "@/components/admin/job-team-card";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { SearchInput } from "@/components/admin/toolbar";
import { Avatar } from "@/components/admin/avatar";
import {
  IconRequisition, IconBuilding, IconLink, IconClock,
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

/** Empty-cell placeholder, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">–</span>;
}

// Reading measure and paragraph rhythm: a posting is prose, not a data cell.
const PROSE =
  "max-w-[72ch] text-[14px] leading-relaxed text-[var(--adm-ink-mute)] [&_p+p]:mt-3 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5 [&_li]:marker:text-[var(--adm-ink-subtle)] [&_strong]:font-semibold [&_strong]:text-[var(--adm-ink)]";

export default function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { id: jobId } = use(params);
  const hint = use(searchParams);
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
  const [storedTab, setActiveTab]         = useState<Tab | null>(null);
  const [search, setSearch]               = useState("");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [copied, setCopied]               = useState(false);
  const [drawerOpen, setDrawerOpen]       = useState(false);
  const [editingApp, setEditingApp]       = useState<Application | null>(null);

  /* Media is offered one tab, so it must land on that one. Derived rather than
     held in state: `user` is null on the first render while the session
     resolves, and an initial value read from it would leave a recruiter stuck
     on the tab media gets. */
  // Until a tab is picked: the applicants when there are some, the posting when there are none.
  const activeTab: Tab = !canPrice ? "info" : storedTab ?? (applications.length > 0 ? "applicants" : "info");

  // Both lists open this one route. The link's hint covers the moment before
  // the record loads; the record decides after.
  const category = jobCategory(job ?? hint);
  useNavSection(JOB_LIST_HREF[category]);
  const list = { label: JOB_LIST_LABEL[category], href: JOB_LIST_HREF[category] };

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

  // The public careers page, not this console URL: the link a candidate can open.
  const publicUrl = () => `${window.location.origin}/careers/search/${jobId}`;
  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Public link copied. Anyone with it can view this posting.");
    } catch {
      toast.error("The link couldn't be copied. Open the public posting and copy its address instead.");
    }
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

  const showStage = (stage: string) => { setStatusFilter(stage); setActiveTab("applicants"); };

  const pipelineCounts = applications.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <JobDetailLoading />;

  if (error || missing || !job) {
    const failed = !!error && !missing;
    return (
      <div className="pb-10">
        <RecordHeader back={list} title="Job posting" />
        <AdminCard>
          <EmptyState
            variant={failed ? "error" : "fresh"}
            icon={failed ? undefined : SearchX}
            title={failed ? "Couldn't load this job posting" : "This job posting doesn't exist"}
            description={failed ? (error ?? undefined) : "It may have been deleted, or the link is out of date."}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                {failed && <WorkspaceButton variant="primary" onClick={() => void fetchData()}>Try again</WorkspaceButton>}
                <WorkspaceButton onClick={() => router.push(list.href)}>Back to {list.label.toLowerCase()}</WorkspaceButton>
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

  const editHref = `/admin/jobs/${jobId}/edit${category === "open" ? "?category=open" : ""}`;

  const details: { label: string; value?: React.ReactNode }[] = [
    ...(canPrice ? [
      { label: "Client", value: job.clientName },
      { label: "Vendor", value: job.vendorName ? (
        <span className="inline-flex items-center gap-1.5">
          <IconTruck className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" aria-hidden="true" />{job.vendorName}
        </span>
      ) : undefined },
      { label: "Pay rate", value: job.payRate ? <span className="tabular-nums">${job.payRate}/hr</span> : undefined },
      { label: "Bill rate", value: job.clientBillRate ? <span className="tabular-nums">${job.clientBillRate}/hr</span> : undefined },
    ] : []),
    { label: "Salary range", value: job.salary ? (
      <span className="tabular-nums">${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}</span>
    ) : undefined },
    { label: "Deadline", value: job.submissionDueDate ? <span className="tabular-nums">{fmtDate(job.submissionDueDate)}</span> : undefined },
    { label: "Created", value: <span className="tabular-nums">{fmtDate(job.createdAt)}</span> },
    { label: "Posted by", value: job.postedByName },
  ];
  const missingDetails = details.filter((d) => !d.value).map((d) => d.label);

  const hasRequirements = !!richTextToPlain(job.requirements);
  const hasResponsibilities = !!richTextToPlain(job.responsibilities);

  const tabs = ([
    { id: "applicants" as Tab,  label: "Applicants",      count: applications.length as number | undefined, icon: IconGroup },
    { id: "submissions" as Tab, label: "Submissions",     count: undefined, icon: IconSend },
    { id: "candidates" as Tab,  label: "Best candidates", count: undefined, icon: IconSource },
    { id: "info" as Tab,        label: "About job",       count: undefined, icon: IconFile },
  ]).filter((tab) => canPrice || tab.id === "info");

  return (
    <div className="pb-10">
      <RecordHeader
        back={list}
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
            {canPrice && job.vendorName && <RecordFact icon={IconTruck}>{job.vendorName}</RecordFact>}
            {job.type && (
              <RecordFact icon={IconClock}>
                <span className="capitalize">{job.type.replace(/-/g, " ")}</span>
              </RecordFact>
            )}
          </>
        }
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <WorkspaceButton aria-label="More actions" className="px-2.5">
                  <MoreHorizontal aria-hidden="true" />
                </WorkspaceButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={6}
                className="w-64 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
              >
                {isPubliclyOpen(job.status) ? (
                  <>
                    <DropdownMenuItem onClick={shareLink} className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink)]">
                      {copied
                        ? <Check className="h-4 w-4 text-[var(--adm-success-ink)]" aria-hidden="true" />
                        : <IconLink className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />}
                      {copied ? "Link copied" : "Share link"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => window.open(publicUrl(), "_blank", "noopener")}
                      className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink)]"
                    >
                      <IconEye className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      View public posting
                    </DropdownMenuItem>
                  </>
                ) : (
                  // A draft, on-hold or closed posting has no public page to share.
                  <DropdownMenuItem disabled className="gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink-subtle)]">
                    <IconLink className="h-4 w-4" aria-hidden="true" />
                    Share link (set the role to Active first)
                  </DropdownMenuItem>
                )}
                {canManageApplicants && filteredApps.length > 0 && (
                  <DropdownMenuItem onClick={handleExport} className="cursor-pointer gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[var(--adm-ink)]">
                    <IconDownload className="h-4 w-4 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                    Export {filteredApps.length} applicant{filteredApps.length === 1 ? "" : "s"}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {canEdit && (
              <WorkspaceButton onClick={() => router.push(editHref)}>
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

      {canPrice && applications.length > 0 && (
        <StageStrip
          className="mb-4"
          value={activeTab === "applicants" ? statusFilter : ""}
          onChange={showStage}
          items={[
            { key: "all", label: "All applicants", count: applications.length },
            ...APP_STATUSES.map((s) => ({
              key: s.value,
              label: s.label,
              count: pipelineCounts[s.value] || 0,
              color: statusColor(s.value),
            })),
          ]}
        />
      )}

      <div className={cn("mb-4 grid grid-cols-1 items-stretch gap-4", canPrice && "lg:grid-cols-2")}>
        <AdminCard className="overflow-hidden">
          <dl aria-label="Role details" className="flex flex-wrap gap-x-10 gap-y-4 px-5 py-4">
            {details.filter((d) => d.value).map((d) => (
              <div key={d.label} className="min-w-0">
                <dt className="text-[12.5px] text-[var(--adm-ink-subtle)]">{d.label}</dt>
                <dd className="mt-1 break-words text-[14.5px] font-semibold text-[var(--adm-ink)]">{d.value}</dd>
              </div>
            ))}
          </dl>
          {missingDetails.length > 0 && (
            <p className="border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-5 py-2.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
              Not recorded: {missingDetails.join(", ").toLowerCase()}.
              {canEdit && (
                <>
                  {" "}
                  <button type="button" onClick={() => router.push(editHref)} className="font-medium text-[var(--adm-accent)] underline-offset-4 hover:underline">
                    Add them
                  </button>
                </>
              )}
            </p>
          )}
        </AdminCard>

        {/* Always rendered, even when empty: its + is how the first recruiter gets assigned. */}
        {canPrice && <JobTeamCard job={job} canEdit={canEdit} onJobChange={setJob} />}
      </div>

      <AdminCard className="overflow-hidden">
          <div role="tablist" aria-label="Job sections" className="adm-scroll-hidden flex gap-1 overflow-x-auto overflow-y-hidden border-b border-[var(--adm-line)] px-2 sm:px-3">
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
                    "inline-flex h-11 flex-none items-center gap-2 border-b-2 px-3 text-[13.5px] font-medium transition-colors duration-150",
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
            job.description || hasRequirements || hasResponsibilities || job.clientNotes ? (
              <div className="space-y-6 p-5">
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

                {job.clientNotes && (
                  <section>
                    <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">Client notes</h3>
                    <p className={cn(PROSE, "whitespace-pre-wrap")}>{job.clientNotes}</p>
                  </section>
                )}
              </div>
            ) : (
              <EmptyState
                icon={IconFile}
                title="No posting copy yet"
                description="Add a description, requirements and responsibilities so candidates know what the role involves."
                action={canEdit ? (
                  <WorkspaceButton onClick={() => router.push(editHref)}>
                    <IconEdit aria-hidden="true" />Write the posting
                  </WorkspaceButton>
                ) : undefined}
              />
            )
          )}

          {activeTab === "applicants" && (
            <div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
                <SearchInput value={search} onChange={setSearch} placeholder="Search by name or email…" />
                {statusFilter !== "all" && (
                  <WorkspaceButton size="sm" variant="ghost" onClick={() => setStatusFilter("all")}>
                    <X aria-hidden="true" />
                    {APP_STATUSES.find((s) => s.value === statusFilter)?.label ?? "Stage"} only
                  </WorkspaceButton>
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
