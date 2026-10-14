"use client";

import { useCallback, useMemo, useState } from "react";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth, canEditJobs, canSeeJobCommercials, RECRUITING_ROLES } from "@/lib/auth";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useResource } from "@/hooks/use-resource";
import { refreshApplications } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { renderRichText, renderListField, richTextToPlain } from "@/lib/rich-text";
import { downloadCsv } from "@/lib/csv";
import { isPubliclyOpen, jobCategory, JOB_LIST_HREF, JOB_LIST_LABEL } from "@/lib/job-status";
import { jobLocationLabel } from "@/lib/workplace";
import { JOB_STATUS_COPY } from "@/lib/job-options";
import { SALARY_PERIODS } from "@/components/admin/theme";
import { usePageCrumb, useNavSection } from "@/components/admin/admin-provider";
import { Avatar, Badge, Button, DetailSkeleton, EmptyState, ErrorState, Page, PageHeader, Panel, usePortalRouter } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { StageSelect } from "@/components/portal/fields";
import { BOARD, STAGE_DOT, STAGE_LABEL, JOB_TYPE_LABEL, type Stage } from "@/components/portal/recruiting/model";
import Icon from "@/components/portal/icons";
import { CandidateEditDrawer } from "./CandidateEditDrawer";
import { ActionMenu } from "./Menu";
import { BestCandidates } from "./BestCandidates";
import { JobSubmissions } from "./JobSubmissions";
import { JobTeamCard } from "./JobTeam";
import { FactLine, FactRows, PROSE, RecordTabs } from "./parts";

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
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [moving, setMoving] = useState<string | null>(null);

  // Applicants first when there are some, the posting when there are none; media gets the posting only.
  const activeTab: Tab = !canPrice ? "info" : storedTab ?? (applications.length > 0 ? "applicants" : "info");

  const category = jobCategory(job ?? hint);
  useNavSection(JOB_LIST_HREF[category]);
  usePageCrumb(job?.postingId);
  const back = { label: JOB_LIST_LABEL[category], href: JOB_LIST_HREF[category] };

  const debounced = useDebouncedValue(search, 200);

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
  const publicUrl = () => `${window.location.origin}/careers/search/${jobId}`;
  const shareLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl());
      notify("Public link copied. Anyone with it can view this posting.");
    } catch {
      notify("Couldn't copy the link. Open the public posting and copy its address instead.", { tone: "error" });
    }
  };

  const filteredApps = applications.filter((a) => {
    const q = debounced.trim().toLowerCase();
    return (!q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)) && (stageFilter === "all" || a.status === stageFilter);
  }).sort((a, b) => +new Date(b.appliedAt) - +new Date(a.appliedAt));

  const exportApplicants = () =>
    downloadCsv(
      `${job?.title?.replace(/\s+/g, "_") || "job"}_applicants`,
      ["Name", "Email", "Phone", "Status", "Applied", "Source", "Work Auth"],
      filteredApps.map((a) => [a.name, a.email, a.phone || "", a.status, fmtDate(a.appliedAt), a.source || "", a.workAuthorization || ""]),
    );

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

  const details: { label: string; value?: React.ReactNode }[] = [
    ...(canPrice
      ? [
          { label: "Client", value: job.clientName },
          { label: "Vendor", value: job.vendorName },
          { label: "Pay rate", value: job.payRate ? <span className="tabular-nums">${job.payRate}/hr</span> : undefined },
          { label: "Bill rate", value: job.clientBillRate ? <span className="tabular-nums">${job.clientBillRate}/hr</span> : undefined },
        ]
      : []),
    {
      label: "Salary range",
      value: job.salary ? (
        <span className="tabular-nums">
          ${job.salary.min.toLocaleString()} – ${job.salary.max.toLocaleString()}
          {SALARY_PERIODS.find((p) => p.value === (job.salary?.period || "year"))?.short}
        </span>
      ) : undefined,
    },
    { label: "Deadline", value: job.submissionDueDate ? <span className="tabular-nums">{fmtDate(job.submissionDueDate)}</span> : undefined },
    { label: "Created", value: <span className="tabular-nums">{fmtDate(job.createdAt)}</span> },
    { label: "Posted by", value: job.postedByName },
  ];
  const shown = details.filter((d) => d.value);
  const notRecorded = details.filter((d) => !d.value).map((d) => d.label.toLowerCase());

  const hasRequirements = !!richTextToPlain(job.requirements);
  const hasResponsibilities = !!richTextToPlain(job.responsibilities);

  const tabs = [
    { key: "applicants" as Tab, label: "Applicants", icon: "inbox" as const, count: applications.length },
    { key: "submissions" as Tab, label: "Submissions", icon: "send" as const },
    { key: "candidates" as Tab, label: "AI matches", icon: "sparkle" as const },
    { key: "info" as Tab, label: "About the job", icon: "resume" as const },
  ].filter((t) => canPrice || t.key === "info");

  const menu = [
    live
      ? { label: "Copy public link", icon: "external" as const, onSelect: () => void shareLink() }
      : { label: "Copy public link", icon: "external" as const, onSelect: () => {}, disabled: true, hint: "Set the role to Active to share it." },
    ...(live ? [{ label: "View public posting", icon: "eye" as const, onSelect: () => window.open(publicUrl(), "_blank", "noopener") }] : []),
    ...(canManageApplicants && filteredApps.length > 0
      ? [{ label: `Export ${filteredApps.length} applicant${filteredApps.length === 1 ? "" : "s"}`, icon: "download" as const, onSelect: exportApplicants }]
      : []),
  ];

  const posting = job.description || hasRequirements || hasResponsibilities || job.clientNotes ? (
    <div className="grid gap-6 p-5">
      {[
        { title: "Description", html: job.description ? renderRichText(job.description) : null },
        { title: "Requirements", html: hasRequirements ? renderListField(job.requirements) : null },
        { title: "Responsibilities", html: hasResponsibilities ? renderListField(job.responsibilities) : null },
      ]
        .filter((s) => s.html)
        .map((s) => (
          <section key={s.title}>
            <h3 className="mb-2 text-[15px] font-semibold text-navy-900">{s.title}</h3>
            <div className={PROSE} dangerouslySetInnerHTML={s.html!} />
          </section>
        ))}
      {job.clientNotes && canPrice && (
        <section className="rounded-lg bg-mist-50 p-4 ring-1 ring-inset ring-mist-200">
          <h3 className="mb-1.5 text-[13px] font-semibold text-navy-900">Client notes · staff only</h3>
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

  const applicantsTab = (
    <div>
      <div className="flex flex-wrap items-center gap-2 border-b border-mist-200 p-4">
        <label className="relative min-w-0 flex-1 sm:max-w-xs">
          <span className="sr-only">Search applicants</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-mist-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="h-10 w-full rounded-lg bg-mist-0 pl-9 pr-3 text-[14px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600"
          />
        </label>
        {stageFilter !== "all" && (
          <Button size="sm" variant="secondary" icon="x" onClick={() => setStageFilter("all")}>
            {STAGE_LABEL[stageFilter]} only
          </Button>
        )}
        <span className="ml-auto text-[13px] tabular-nums text-mist-600">
          {filteredApps.length} of {applications.length}
        </span>
      </div>
      {appsRes.isLoading && !appsRes.data ? (
        <ul role="status" aria-label="Loading applicants" className="divide-y divide-mist-100">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 px-5 py-4">
              <span className="kit-skel block size-9 rounded-full" />
              <span className="grid flex-1 gap-1.5">
                <span className="kit-skel block h-3.5 w-40" />
                <span className="kit-skel block h-3 w-56 max-w-full" />
              </span>
            </li>
          ))}
        </ul>
      ) : appsRes.error && !appsRes.data ? (
        <ErrorState framed={false} title="Couldn't load the applicants" onRetry={() => void appsRes.reload()} retrying={appsRes.isLoading} />
      ) : filteredApps.length === 0 ? (
        applications.length === 0 ? (
          <EmptyState
            compact
            variant="first-use"
            icon="inbox"
            title="No applicants yet"
            body="Add the first applicant for this role, or check the AI matches tab for people already on file."
            primary={canManageApplicants ? { label: "Add applicant", icon: "plus", href: `/portal/applications/new?jobId=${jobId}` } : undefined}
          />
        ) : (
          <EmptyState
            compact
            variant="no-results"
            title="No applicants match"
            body="Try another name, or clear the stage filter."
            onClearFilters={() => {
              setSearch("");
              setStageFilter("all");
            }}
          />
        )
      ) : (
        <ul className="divide-y divide-mist-100">
          {filteredApps.map((a) => (
            <li key={a.id} className="group relative flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 hover:bg-mist-50">
              <span className="flex min-w-0 flex-1 basis-56 items-center gap-3">
                <Avatar name={a.name || a.email} />
                <span className="min-w-0">
                  <a href={`/portal/candidates/${a.id}`} onClick={(e) => { e.preventDefault(); router.push(`/portal/candidates/${a.id}`); }} className="block truncate text-[14px] font-medium text-navy-900 after:absolute after:inset-0 hover:text-ocean-700">
                    {a.name || "Unnamed"}
                  </a>
                  <span className="block truncate text-[12px] text-mist-600">
                    {[a.email, a.city && `${a.city}${a.state ? `, ${a.state}` : ""}`].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </span>
              <span className="hidden w-28 shrink-0 text-[13px] text-mist-600 xl:block">{a.source || "–"}</span>
              <span className="hidden w-24 shrink-0 text-[13px] tabular-nums text-mist-600 md:block">{fmtDate(a.appliedAt)}</span>
              <span className="relative z-10 flex shrink-0 items-center gap-1">
                <StageSelect size="sm" value={a.status} label={`Stage for ${a.name || a.email}`} disabled={moving === a.id} onChange={(s) => void move(a, s)} />
                <ActionMenu
                  label={`Actions for ${a.name || a.email}`}
                  items={[
                    { label: "View profile", icon: "eye", onSelect: () => router.push(`/portal/candidates/${a.id}`) },
                    { label: "Edit applicant", icon: "edit", onSelect: () => setEditingApp(a) },
                  ]}
                  width="w-48"
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <Page>
      <PageHeader
        back={back}
        icon={category === "open" ? "briefcase" : "capitol"}
        title={job.title}
        meta={<Badge tone={live ? "green" : job.status === "open" ? "blue" : job.status === "closed" ? "grey" : "amber"} dot>{statusCopy?.label ?? job.status}</Badge>}
        description={
          <FactLine
            items={[
              ...(job.postingId ? [{ icon: "tag" as const, text: <span className="font-mono text-[12px]">{job.postingId}</span> }] : []),
              ...(job.department ? [{ icon: "layers" as const, text: job.department }] : []),
              { icon: "map" as const, text: jobLocationLabel(job) || "Location not set" },
              ...(canPrice && job.clientName ? [{ icon: "building" as const, text: job.clientName }] : []),
              ...(job.type ? [{ icon: "clock" as const, text: JOB_TYPE_LABEL[job.type] ?? job.type }] : []),
            ]}
          />
        }
        actions={
          <>
            <ActionMenu items={menu} />
            {canEdit && (
              <Button variant="secondary" icon="edit" href={editHref}>
                Edit
              </Button>
            )}
            {canManageApplicants && (
              <Button icon="plus" href={`/portal/applications/new?jobId=${jobId}`}>
                Add applicant
              </Button>
            )}
          </>
        }
      />

      {canPrice && applications.length > 0 && (
        <div role="group" aria-label="Applicants by stage" className="scroll-thin flex gap-2 overflow-x-auto pb-1">
          {[{ key: "all" as const, label: "All", count: applications.length }, ...BOARD.map((s) => ({ key: s, label: STAGE_LABEL[s], count: counts[s] || 0 }))].map((s) => {
            const on = activeTab === "applicants" && stageFilter === s.key;
            return (
              <button
                key={s.key}
                type="button"
                aria-pressed={on}
                onClick={() => {
                  setStageFilter(s.key);
                  setActiveTab("applicants");
                }}
                className={`inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full px-3.5 text-[13px] font-medium ring-1 ring-inset transition-colors ${
                  on ? "bg-navy-900 text-white ring-navy-900" : "bg-mist-0 text-navy-900 ring-mist-300 hover:bg-mist-50"
                }`}
              >
                {s.key !== "all" && <span aria-hidden className="size-2 rounded-full" style={{ background: STAGE_DOT[s.key] }} />}
                {s.label}
                <span className={`tabular-nums ${on ? "text-tide-300" : "text-mist-500"}`}>{s.count}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
          <RecordTabs label="Job sections" tabs={tabs} value={activeTab} onChange={setActiveTab} className="p-4 pb-0 sm:px-3 sm:pt-1" />
          <div className="max-sm:mt-4">
            {activeTab === "applicants" && applicantsTab}
            {activeTab === "submissions" && <JobSubmissions jobId={jobId} />}
            {activeTab === "candidates" && <BestCandidates jobId={jobId} />}
            {activeTab === "info" && posting}
          </div>
        </section>

        <aside className="grid min-w-0 gap-6 lg:sticky lg:top-[5.5rem]">
          <Panel title="Requisition" description={live ? "On the careers site" : statusCopy?.detail}>
            {shown.length > 0 ? <FactRows items={shown} /> : <p className="text-[13px] text-mist-600">Nothing recorded yet.</p>}
            {notRecorded.length > 0 && (
              <p className="mt-4 border-t border-mist-100 pt-3 text-[12px] text-mist-600">
                Not recorded: {notRecorded.join(", ")}.
                {canEdit && (
                  <>
                    {" "}
                    <a href={editHref} className="font-medium text-ocean-700 underline-offset-4 hover:underline">
                      Add them
                    </a>
                  </>
                )}
              </p>
            )}
          </Panel>
          {/* Always rendered, even when empty: its + is how the first recruiter gets assigned. */}
          {canPrice && <JobTeamCard job={job} canEdit={canEdit} onJobChange={setJob} />}
        </aside>
      </div>

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
    </Page>
  );
}
