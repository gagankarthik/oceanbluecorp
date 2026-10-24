"use client";

import { useCallback, useMemo, useState } from "react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs, canSeeJobCommercials, RECRUITING_ROLES } from "@/lib/auth";
import { useResource } from "@/hooks/use-resource";
import { refreshApplications, refreshJobs } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { renderRichText, renderListField, richTextToPlain } from "@/lib/rich-text";
import { downloadCsv } from "@/lib/csv";
import { isPubliclyOpen, jobCategory, JOB_LIST_HREF, JOB_LIST_LABEL } from "@/lib/job-status";
import { jobLocationLabel } from "@/lib/workplace";
import { JOB_STATUS_COPY } from "@/lib/job-options";
import { SALARY_PERIODS } from "@/components/portal/console/theme";
import { usePageCrumb, useNavSection } from "@/components/portal/console/provider";
import Link from "next/link";
import {
  Avatar, Badge, Button, ConfirmDialog, deleteConfirmText, DetailSkeleton, EmptyState, ErrorState, KeyValue, Page, PageHeader, usePortalRouter,
  ListHeader, BTN_ICON, BTN_PRIMARY, BTN_SECONDARY, TableSkeleton,
} from "@/components/portal/kit";
import DataTable, { type Column, type Filter } from "@/components/portal/DataTable";
import { StateIcon } from "@/components/portal/kit/state-icon";
import { useToast } from "@/components/portal/toast";
import {
  BOARD, JOB_STATE, STAGE_LABEL, JOB_TYPE_LABEL, daysUntil, publicJobPath, stageState, type Stage,
} from "@/components/portal/recruiting/model";
import { InlineSelect, jobMenuItems } from "@/components/portal/recruiting/bits";
import Icon, { type IconName } from "@/components/portal/icons";
import { CandidateEditDrawer } from "./CandidateEditDrawer";
import { ActionMenu } from "./Menu";
import { BestCandidates } from "./BestCandidates";
import { JobSubmissions } from "./JobSubmissions";
import { JobTeamCard } from "./JobTeam";
import { PROSE, RecordTabs } from "./parts";

type Tab = "info" | "applicants" | "submissions" | "candidates";

/**
 * One requisition: header and stage strip, then tabs (applicants, submissions,
 * AI matches, posting) beside a facts rail. Stage moves report with Undo, as on
 * the applications list.
 */
export function JobDetail({ jobId, hint }: { jobId: string; hint: { category?: string } }) {
  const router = usePortalRouter();
  const notify = useToast();
  const { user, hasAnyRole } = useAuth();
  const canEdit = canEditJobs(user?.role);
  // The API strips commercials for media, so the page does not render them as blanks.
  const canPrice = canSeeJobCommercials(user?.role);
  const canManageApplicants = hasAnyRole(RECRUITING_ROLES);

  const jobRes = useResource<{ job: Job }>(`/api/jobs/${jobId}`);
  // /api/applications answers media 403, so it does not ask.
  const appsRes = useResource<{ applications?: Application[] }>(canPrice ? `/api/applications?jobId=${jobId}` : null);
  const job = jobRes.data?.job ?? null;
  const applications = useMemo(() => appsRes.data?.applications ?? [], [appsRes.data]);
  const missing = (jobRes.error as { status?: number } | undefined)?.status === 404;
  const failed = !job && !!jobRes.error && !missing;
  const { setData: setJobData } = jobRes;
  const { setData: setAppsData } = appsRes;
  const setJob = useCallback((next: Job) => setJobData({ job: next }), [setJobData]);
  const setApplications = useCallback(
    (fn: (list: Application[]) => Application[]) => setAppsData((d) => ({ ...d, applications: fn(d?.applications || []) })),
    [setAppsData],
  );

  const [storedTab, setActiveTab] = useState<Tab | null>(null);
  // A pick in the Pipeline rail opens the applicants table filtered to that stage; `n` remounts it once per pick
  const [pick, setPick] = useState<{ stage: Stage | "all"; n: number }>({ stage: "all", n: 0 });
  const [tableStage, setTableStage] = useState<string>("All");
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Applicants first when there are some, the posting when there are none; media gets the posting only.
  const activeTab: Tab = !canPrice ? "info" : storedTab ?? (applications.length > 0 ? "applicants" : "info");

  const category = jobCategory(job ?? hint);
  useNavSection(JOB_LIST_HREF[category]);
  usePageCrumb(job?.postingId);
  const back = { label: JOB_LIST_LABEL[category], href: JOB_LIST_HREF[category] };


  /** Optimistic stage move; reports with Undo (the undo itself reports nothing). */
  const move = async (app: Application, to: Stage, offerUndo = true) => {
    const prev = app.status;
    if (prev === to) return;
    setMoving(app.id);
    setApplications((list) => list.map((a) => (a.id === app.id ? { ...a, status: to } : a)));
    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: to }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      void refreshApplications();
      if (offerUndo) notify(`${app.name || "Candidate"} moved to ${STAGE_LABEL[to] ?? to}`, { undo: () => void move({ ...app, status: to }, prev, false) });
    } catch {
      setApplications((list) => list.map((a) => (a.id === app.id && a.status === to ? { ...a, status: prev } : a)));
      notify("Couldn't change the stage. Try again.", { tone: "error" });
    } finally {
      setMoving(null);
    }
  };

  // The public careers page, not this console URL: the link a candidate can open.
  const publicUrl = () => `${window.location.origin}${publicJobPath(jobId)}`;
  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl());
      notify("Public link copied. Anyone with it can view this posting.");
    } catch {
      notify("Couldn't copy the link. Open the public posting and copy its address instead.", { tone: "error" });
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      const r = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      void refreshJobs();
      // A posting's applications go with it.
      void refreshApplications();
      notify("Job deleted");
      setConfirmDelete(false);
      router.push(back.href);
    } catch {
      notify("Couldn't delete the job. Try again.", { tone: "error" });
    } finally {
      setDeleting(false);
    }
  };

  const counts = applications.reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  if (jobRes.isLoading && !job) return <DetailSkeleton label="Loading job" />;

  if (!job) {
    return (
      <Page>
        <PageHeader back={back} title="Job posting" />
        {failed ? (
          <ErrorState title="Couldn't load this job posting" message="Check your connection and try again." onRetry={() => void jobRes.reload()} retrying={jobRes.isLoading} />
        ) : (
          <EmptyState
            framed
            icon="search"
            title="This job posting doesn't exist"
            body="It may have been deleted, or the link is out of date."
            primary={{ label: `Go to ${back.label.toLowerCase()}`, href: back.href }}
          />
        )}
      </Page>
    );
  }

  const editHref = `/portal/jobs/${jobId}/edit${category === "open" ? "?category=open" : ""}`;
  const statusCopy = JOB_STATUS_COPY[job.status];
  const live = isPubliclyOpen(job.status);
  // Deadlines only warn while the role is being worked: overdue and today red, three days amber.
  const due = job.status === "active" || job.status === "open" ? daysUntil(job.submissionDueDate) : null;
  const dueTone = due === null ? "" : due <= 0 ? "font-semibold text-status-danger" : due <= 3 ? "font-semibold text-status-warning" : "";
  const dueNote = due === null || due > 3 ? "" : due < 0 ? "overdue" : due === 0 ? "due today" : `in ${due} day${due === 1 ? "" : "s"}`;

  const unset = canEdit ? (
    <span className="text-mist-600">
      Not set ·{" "}
      <Link href={editHref} className="font-medium text-ocean-700 hover:underline">
        Add
      </Link>
    </span>
  ) : (
    <span className="text-mist-600">Not set</span>
  );
  const prop = (v: React.ReactNode) => v || unset;
  const properties: { k: string; v: React.ReactNode; icon: IconName }[] = [
    { k: "Status", icon: "activity", v: <Badge mark={JOB_STATE[job.status]}>{statusCopy?.label ?? job.status}</Badge> },
    { k: "Deadline", icon: "calendar", v: prop(job.submissionDueDate && <span className={`tabular-nums ${dueTone}`}>{fmtDate(job.submissionDueDate)}{dueNote && ` · ${dueNote}`}</span>) },
    ...(canPrice
      ? [
          { k: "Client", icon: "building" as IconName, v: prop(job.clientName) },
          { k: "Vendor", icon: "handshake" as IconName, v: prop(job.vendorName) },
          { k: "Pay rate", icon: "dollar" as IconName, v: prop(job.payRate && <span className="tabular-nums">${job.payRate}/hr</span>) },
          { k: "Bill rate", icon: "dollar" as IconName, v: prop(job.clientBillRate && <span className="tabular-nums">${job.clientBillRate}/hr</span>) },
        ]
      : []),
    {
      k: "Salary range",
      icon: "dollar",
      v: prop(
        job.salary && (
          <span className="tabular-nums">
            ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}
            {SALARY_PERIODS.find((p) => p.value === (job.salary?.period || "year"))?.short}
          </span>
        ),
      ),
    },
    { k: "Location", icon: "map", v: prop(jobLocationLabel(job)) },
    { k: "Type", icon: "clock", v: prop(job.type && (JOB_TYPE_LABEL[job.type] ?? job.type)) },
    { k: "Department", icon: "layers", v: prop(job.department) },
    { k: "Posted by", icon: "userCheck", v: prop(job.postedByName) },
    { k: "Created", icon: "calendar", v: <span className="tabular-nums">{fmtDate(job.createdAt)}</span> },
  ];

  const hasRequirements = !!richTextToPlain(job.requirements);
  const hasResponsibilities = !!richTextToPlain(job.responsibilities);

  const tabs = [
    { key: "applicants" as Tab, label: "Applicants", icon: "inbox" as const, count: applications.length },
    { key: "submissions" as Tab, label: "Submissions", icon: "send" as const },
    { key: "candidates" as Tab, label: "AI matches", icon: "sparkle" as const },
    { key: "info" as Tab, label: "About the job", icon: "resume" as const },
  ].filter((t) => canPrice || t.key === "info");

  // Every page action in one menu; the API still enforces each one.
  const menu = jobMenuItems({
    job,
    go: (href) => router.push(href),
    onDelete: () => setConfirmDelete(true),
    canEdit,
    // requireStaff: deleting removes the role's applications too.
    canDelete: canPrice,
    canAddApplicant: canManageApplicants,
    extra: [
      live
        ? { label: "Copy public link", icon: "external", onSelect: () => void shareLink() }
        : { label: "Copy public link", icon: "external", onSelect: () => {}, disabled: true, hint: "Set the role to Active to share it." },
    ],
  });

  const posting = job.description || hasRequirements || hasResponsibilities || job.clientNotes ? (
    <div className="grid gap-8 py-6">
      {[
        { title: "Description", html: job.description ? renderRichText(job.description) : null },
        { title: "Requirements", html: hasRequirements ? renderListField(job.requirements) : null },
        { title: "Responsibilities", html: hasResponsibilities ? renderListField(job.responsibilities) : null },
      ]
        .filter((s) => s.html)
        .map((s) => (
          <section key={s.title}>
            <h3 className="mb-2 text-adm-md font-semibold text-navy-900">{s.title}</h3>
            <div className={PROSE} dangerouslySetInnerHTML={s.html!} />
          </section>
        ))}
      {job.clientNotes && canPrice && (
        <section className="rounded-lg bg-mist-50 p-4 ring-1 ring-inset ring-mist-200">
          <h3 className="mb-1.5 text-adm-base font-semibold text-navy-900">Client notes · staff only</h3>
          <p className={`${PROSE} whitespace-pre-wrap`}>{job.clientNotes}</p>
        </section>
      )}
    </div>
  ) : (
    <EmptyState
      compact
      icon="resume"
      title="No posting copy yet"
      body="Add a description, requirements and responsibilities so candidates know what the role involves."
      primary={canEdit ? { label: "Write the posting", icon: "edit", href: editHref } : undefined}
    />
  );

  const applicantColumns: Column<Application>[] = [
    {
      key: "name",
      header: "Applicant",
      sortable: true,
      grow: 32,
      value: (a) => a.name || a.email,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name || a.email} size="sm" />
          <span className="min-w-0">
            <Link href={`/portal/candidates/${a.id}`} onClick={(e) => e.stopPropagation()} className="block truncate font-medium text-navy-900 hover:text-ocean-700 hover:underline">
              {a.name || "Unnamed"}
            </Link>
            <span className="block truncate text-adm-xs text-mist-600">{a.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: "status",
      header: "Stage",
      sortable: true,
      value: (a) => BOARD.indexOf(a.status),
      cell: (a) => (
        <InlineSelect
          value={a.status}
          label={`Stage for ${a.name || a.email}`}
          mark={stageState(a.status)}
          width="w-36"
          disabled={moving === a.id}
          options={BOARD.map((st) => ({ value: st, label: STAGE_LABEL[st] }))}
          onChange={(st) => void move(a, st as Stage)}
        />
      ),
    },
    { key: "source", header: "Source", sortable: true, value: (a) => a.source || "" },
    {
      key: "appliedAt",
      header: "Applied",
      sortable: true,
      value: (a) => new Date(a.appliedAt).getTime(),
      cell: (a) => <span className="whitespace-nowrap tabular-nums text-mist-700">{fmtDate(a.appliedAt)}</span>,
    },
    { key: "location", header: "Location", sortable: true, hideBelow: "xl", value: (a) => [a.city, a.state].filter(Boolean).join(", ") },
    { key: "workAuthorization", header: "Work authorization", sortable: true, hideBelow: "2xl", value: (a) => a.workAuthorization || "" },
    { key: "phone", header: "Phone", defaultHidden: true, value: (a) => a.phone || "" },
  ];
  const optionsOf = (get: (a: Application) => string | undefined) => [...new Set(applications.map(get).filter((x): x is string => !!x))].sort();
  const allFilters: Filter<Application>[] = [
    { key: "source", label: "Source", options: optionsOf((a) => a.source), value: (a) => a.source || "" },
    { key: "workAuthorization", label: "Work authorization", options: optionsOf((a) => a.workAuthorization), value: (a) => a.workAuthorization || "" },
  ];
  const applicantFilters: Filter<Application>[] = [
    { key: "stage", label: "Stage", options: BOARD.map((st) => STAGE_LABEL[st]), value: (a) => STAGE_LABEL[a.status] ?? a.status },
    ...allFilters.filter((f) => f.options.length > 0),
  ];
  const openStage = (stage: Stage | "all") => {
    setPick((p) => ({ stage, n: p.n + 1 }));
    setActiveTab("applicants");
  };

  const applicantsTab =
    appsRes.isLoading && !appsRes.data ? (
      <TableSkeleton rows={6} />
    ) : appsRes.error && !appsRes.data ? (
      <ErrorState title="Couldn't load the applicants" onRetry={() => void appsRes.reload()} retrying={appsRes.isLoading} />
    ) : applications.length === 0 ? (
      <EmptyState
        framed
        variant="first-use"
        icon="inbox"
        title="No applicants yet"
        body="Add the first applicant for this role, or check the AI matches tab for people already on file."
        primary={canManageApplicants ? { label: "Add applicant", icon: "plus", href: `/portal/applications/new?jobId=${jobId}` } : undefined}
      />
    ) : (
      <DataTable
        key={pick.n}
        rows={applications}
        initialFilters={pick.stage === "all" ? {} : { stage: STAGE_LABEL[pick.stage] }}
        onStateChange={(st) => setTableStage(st.filters.stage ?? "All")}
        columns={applicantColumns}
        filters={applicantFilters}
        searchPlaceholder="Search by name or email"
        searchMatch={(a, q) => a.email.toLowerCase().includes(q)}
        initialSort={{ key: "appliedAt", dir: -1 }}
        storageKey="job-applicants"
        exportName={`${job.title.replace(/\s+/g, "_")}_applicants`}
        onExport={(list) =>
          downloadCsv(
            `${job.title.replace(/\s+/g, "_")}_applicants`,
            ["Name", "Email", "Phone", "Status", "Applied", "Source", "Work Auth"],
            list.map((a) => [a.name, a.email, a.phone || "", STAGE_LABEL[a.status] ?? a.status, fmtDate(a.appliedAt), a.source || "", a.workAuthorization || ""]),
          )
        }
        emptyTitle="No applicants match"
        pageSize={25}
        rowMenu={(a) => [
          { label: "View profile", icon: "eye", onSelect: () => router.push(`/portal/candidates/${a.id}`) },
          { label: "Edit applicant", icon: "edit", onSelect: () => setEditingApp(a) },
        ]}
        toolbar={
          canManageApplicants && (
            <Link href={`/portal/applications/new?jobId=${jobId}`} className={BTN_PRIMARY}>
              <Icon name="plus" className="size-4" />
              Add applicant
            </Link>
          )
        }
      />
    );


  return (
    // Plane's work-item page: the 44px header, the record in the main pane, its properties in a rail
    <div className="-m-5 flex min-h-[calc(100svh-3.75rem-2px)] flex-col bg-mist-0 sm:-m-6 lg:-m-8">
      <ListHeader
        crumbs={[
          { label: back.label, href: back.href, icon: category === "open" ? "briefcase" : "capitol" },
          { label: job.postingId || job.title },
        ]}
      >
        {live && (
          <a href={publicJobPath(jobId)} target="_blank" rel="noopener" className={`${BTN_SECONDARY} hidden sm:inline-flex`}>
            <Icon name="external" className="size-4" />
            View posting
          </a>
        )}
        {canEdit && (
          <Link href={editHref} className={BTN_SECONDARY}>
            <Icon name="edit" className="size-4" />
            Edit
          </Link>
        )}
        <ActionMenu
          label="Job actions"
          items={menu}
          trigger={
            <button type="button" aria-label="Job actions" title="More actions" className={`${BTN_ICON} data-[state=open]:bg-mist-100`}>
              <Icon name="dots" className="size-4" />
            </button>
          }
        />
      </ListHeader>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-5 py-6 sm:px-6 lg:px-8">
          <div className="grid min-w-0 gap-6">
            <header className="kit-fade grid gap-2">
              {/* Status, place and terms live in Properties; the title block names the record only */}
              {job.postingId && <span className="font-mono text-adm-xs text-mist-600">{job.postingId}</span>}
              <h1 className="text-adm-xl font-semibold leading-tight tracking-tight text-navy-900">{job.title}</h1>
            </header>

            <section aria-label="Job sections" className="min-w-0">
              <RecordTabs label="Job sections" tabs={tabs} value={activeTab} onChange={setActiveTab} />
              <div key={activeTab} className="kit-fade max-sm:mt-4">
                {activeTab === "info" && posting}
                {activeTab === "applicants" && <div className="mt-4">{applicantsTab}</div>}
                {activeTab !== "info" && activeTab !== "applicants" && (
                  <div className="mt-4 overflow-hidden rounded-lg border border-mist-200">
                    {activeTab === "submissions" && <JobSubmissions jobId={jobId} />}
                    {activeTab === "candidates" && <BestCandidates jobId={jobId} />}
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Properties rail: pinned to the top of the page from lg, its own scroll */}
        <aside
          aria-label="Properties"
          className="scroll-thin grid shrink-0 content-start gap-6 border-t border-mist-200 px-5 py-6 sm:px-8 lg:sticky lg:-top-8 lg:h-[calc(100svh-3.75rem-2px)] lg:w-[22.5rem] lg:overflow-y-auto lg:border-l lg:border-t-0 lg:px-5"
        >
          <section className="grid gap-2">
            <h2 className="flex h-7 items-center text-adm-base font-semibold text-navy-900">Properties</h2>
            <KeyValue items={properties} narrow />
          </section>
          {canPrice && applications.length > 0 && (
            <section aria-label="Pipeline" className="grid gap-2 border-t border-mist-200 pt-5">
              <div className="flex h-7 items-center justify-between">
                <h2 className="text-adm-base font-semibold text-navy-900">Pipeline</h2>
                <button type="button" onClick={() => openStage("all")} className="text-adm-xs font-medium text-ocean-700 hover:underline">
                  All {applications.length}
                </button>
              </div>
              <ul className="-mx-2 grid">
                {BOARD.map((st) => {
                  const n = counts[st] || 0;
                  const on = activeTab === "applicants" && tableStage === STAGE_LABEL[st];
                  return (
                    <li key={st}>
                      <button
                        type="button"
                        onClick={() => openStage(st)}
                        aria-pressed={on}
                        className={`flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-adm-base transition-colors duration-150 ${on ? "bg-mist-100 text-navy-900" : n ? "text-navy-900 hover:bg-mist-50" : "text-mist-600 hover:bg-mist-50"}`}
                      >
                        <StateIcon {...stageState(st)} />
                        <span className="flex-1 truncate">{STAGE_LABEL[st]}</span>
                        <span className={`tabular-nums ${n ? "font-medium" : ""}`}>{n}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {/* Always rendered, even when empty: its + is how the first recruiter gets assigned. */}
          {canPrice && (
            <div className="border-t border-mist-200 pt-5">
              <JobTeamCard job={job} canEdit={canEdit} onJobChange={setJob} />
            </div>
          )}
        </aside>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this job?"
          body="This is permanent. The posting and every application attached to it are removed."
          confirmLabel="Delete job"
          requireText={deleteConfirmText(job.title)}
          busy={deleting}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() => void remove()}
        />
      )}

      <CandidateEditDrawer
        open={!!editingApp}
        onOpenChange={(o) => !o && setEditingApp(null)}
        mode="edit"
        candidate={editingApp}
        jobs={[job]}
        defaultJobId={jobId}
        onSaved={(saved) => {
          setApplications((prev) => prev.map((a) => (a.id === saved.id ? saved : a)));
          void refreshApplications();
        }}
      />
    </div>
  );
}
