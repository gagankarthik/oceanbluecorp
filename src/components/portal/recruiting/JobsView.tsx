"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job } from "@/lib/aws/dynamodb";
import { BarChart, DonutChart } from "@/components/portal/charts";
import DataTable, { type Column, type Filter } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import {
  Badge, Button, ConfirmDialog, deleteConfirmText, Drawer, EmptyState, ErrorState, InsightsSheet, KeyValue, KpiRow, ListPageSkeleton, Page, PageHeader,
  Panel, Skeleton, StatCard, usePortalRouter,
} from "@/components/portal/kit";
import { refreshApplications, refreshJobs, useJobSummaries } from "@/hooks/use-console-data";
import { downloadCsv } from "@/lib/csv";
import { fmtDate } from "@/lib/format";
import { jobCategory, isPubliclyOpen, type JobCategory } from "@/lib/job-status";
import { DAY } from "@/lib/pipeline";
import { renderRichText } from "@/lib/rich-text";
import { formatSalary } from "@/lib/salary";
import { jobLocationLabel, workplaceOf, WORKPLACE_LABEL } from "@/lib/workplace";
import { AvatarStack, JobStatusSelect, KpiButton, StageBadge, jobMenuItems } from "./bits";
import { ActionMenu } from "@/components/portal/records/Menu";
import {
  JOB_STATUSES, JOB_STATUS_TONE, JOB_TYPE_LABEL, PIPELINE, STAGE_DOT, STAGE_LABEL, assigneesOf, buckets, countIn, daysUntil, duplicateJobHref,
  jobStatusLabel, jobStatusShort, needsCandidates, permissionsFor, tally,
} from "./model";

const COPY: Record<JobCategory, { title: string; noun: string; icon: "capitol" | "briefcase"; description: string; post: string; query: string }> = {
  state: { title: "State Roles", noun: "state role", icon: "capitol", description: "State agency requisitions, deadlines and applicants.", post: "Post a state role", query: "" },
  open: { title: "Open Roles", noun: "open role", icon: "briefcase", description: "Commercial client requisitions.", post: "Post an open role", query: "?category=open" },
};

const LIVE = jobStatusLabel("active");
const DUE_WEEK = "Due this week";
const NO_CANDIDATES = "No candidates";

const isLive = (j: Job) => isPubliclyOpen(j.status);
const dueThisWeek = (j: Job) => {
  const d = daysUntil(j.submissionDueDate);
  return isLive(j) && d !== null && d >= 0 && d <= 7;
};

type TableState = { query: string; filters: Record<string, string> };

// Roles still being worked; a deadline on a draft or closed role is history, not a warning.
const isWorking = (j: Job) => j.status === "active" || j.status === "open";
const RED = "text-[#b42318]";
const AMBER = "text-[#b54708]";

/** Overdue and today red, within three days amber. */
function DueCell({ job }: { job: Job }) {
  const d = daysUntil(job.submissionDueDate);
  if (d === null) return <span className="text-mist-400">&mdash;</span>;
  if (!isWorking(job)) return <span className="text-mist-600">{fmtDate(job.submissionDueDate)}</span>;
  const tone = d <= 0 ? RED : d <= 3 ? AMBER : "";
  const note = d < 0 ? `Overdue by ${-d} day${d === -1 ? "" : "s"}` : d === 0 ? "Due today" : `In ${d} day${d === 1 ? "" : "s"}`;
  return (
    <span className="flex flex-col">
      <span className={tone ? `font-semibold ${tone}` : ""}>{fmtDate(job.submissionDueDate)}</span>
      <span className={`flex items-center gap-1 text-[12px] ${tone || "text-mist-500"}`}>
        {tone && <Icon name={d <= 0 ? "alert" : "timer"} className="size-3.5" />}
        {note}
      </span>
    </span>
  );
}

/** Where a role's candidates sit, one count per pipeline stage */
// Light stage colours take navy text; the rest white
const LIGHT_STAGE = new Set(["pending", "reviewing", "offered"]);
const CHEVRON = "polygon(0 0, calc(100% - 7px) 0, 100% 50%, calc(100% - 7px) 100%, 0 100%, 7px 50%)";

/** Stages as a chain of chevrons: notched back, arrowhead front, count inside */
function PipelineCells({ job }: { job: Job }) {
  const p = job.pipeline ?? {};
  return (
    <span className="flex items-center" role="img" aria-label={PIPELINE.map((s) => `${STAGE_LABEL[s]} ${p[s] ?? 0}`).join(", ")}>
      {PIPELINE.map((s, i) => {
        const n = p[s] ?? 0;
        return (
          <span
            key={s}
            title={`${STAGE_LABEL[s]}: ${n}`}
            style={{ clipPath: CHEVRON, background: n ? STAGE_DOT[s] : undefined }}
            className={`inline-flex h-6 w-9 items-center justify-center pl-1.5 text-[12px] font-semibold tabular-nums ${i ? "-ml-[3px]" : ""} ${
              n ? (LIGHT_STAGE.has(s) ? "text-navy-900" : "text-white") : "bg-mist-100 font-medium text-mist-400"
            }`}
          >
            {n}
          </span>
        );
      })}
    </span>
  );
}

/** Fixed export columns; the commercial set only for roles that may price a job. */
function exportJobs(name: string, list: Job[], canPrice: boolean) {
  const created = (j: Job) => fmtDate(j.createdAt);
  const due = (j: Job) => (j.submissionDueDate ? fmtDate(j.submissionDueDate) : "");
  if (canPrice) {
    downloadCsv(
      name,
      ["Job ID", "Title", "Client", "Vendor", "Location", "Status", "Pay Rate", "Bill Rate", "Manager", "Assignees", "Applicants", "Created", "Deadline"],
      list.map((j) => [
        j.postingId || "",
        j.title,
        j.clientName || "",
        j.vendorName || "",
        jobLocationLabel(j),
        jobStatusLabel(j.status),
        j.payRate ? `$${j.payRate}/hr` : "",
        j.clientBillRate ? `$${j.clientBillRate}/hr` : "",
        j.recruitmentManagerName || "",
        assigneesOf(j).join(", "),
        j.applicationsCount || 0,
        created(j),
        due(j),
      ]),
    );
    return;
  }
  downloadCsv(
    name,
    ["Job ID", "Title", "Department", "Location", "Status", "Created", "Deadline"],
    list.map((j) => [j.postingId || "", j.title, j.department || "", jobLocationLabel(j), jobStatusLabel(j.status), created(j), due(j)]),
  );
}

/** Live roles due in the next three weeks, soonest first */
function DeadlineList({ jobs, onPick }: { jobs: Job[]; onPick: (j: Job) => void }) {
  const due = jobs
    .map((j) => ({ j, d: daysUntil(j.submissionDueDate) }))
    .filter((x): x is { j: Job; d: number } => isLive(x.j) && x.d !== null && x.d >= 0 && x.d <= 21)
    .sort((a, b) => a.d - b.d);
  if (due.length === 0) return <EmptyState compact icon="calendar" title="Nothing due soon" body="No live role has a deadline in the next three weeks." />;
  return (
    <ul className="grid gap-1">
      {due.slice(0, 7).map(({ j, d }) => (
        <li key={j.id}>
          <button type="button" onClick={() => onPick(j)} className="grid min-h-10 w-full grid-cols-[3rem_1fr] items-center gap-3 rounded-lg p-2 text-left transition-colors duration-150 hover:bg-mist-50">
            <span className={`rounded-md py-1 text-center text-[12px] font-semibold tabular-nums ${d === 0 ? "bg-[#fef3f2] text-[#b42318]" : d <= 3 ? "bg-[#fffaeb] text-[#b54708]" : "bg-ocean-50 text-ocean-700"}`}>{d === 0 ? "Today" : `${d}d`}</span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-medium text-navy-900">{j.title}</span>
              <span className="block truncate text-[12px] text-mist-600">{[j.postingId, fmtDate(j.submissionDueDate)].filter(Boolean).join(", ")}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function JobsView({ category }: { category: JobCategory }) {
  const copy = COPY[category];
  const notify = useToast();
  const router = usePortalRouter();
  const { role } = useSession();
  const { canEditJobs, canPrice } = permissionsFor(role);

  const res = useJobSummaries();
  const { setData } = res;
  const jobs = useMemo(
    () => (res.jobs ?? []).filter((j) => jobCategory(j) === category).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [res.jobs, category],
  );

  // KPIs, charts and deep links all drive the table's own filters, so every constraint shows as a chip.
  const [table, setTable] = useState<TableState>({ query: "", filters: {} });
  const [tableKey, setTableKey] = useState(0);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [confirmStatus, setConfirmStatus] = useState<{ job: Job; to: Job["status"] } | null>(null);

  // Dashboard drill-through: ?focus=starved | due | live
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("focus");
    const preset: Record<string, Record<string, string>> = { starved: { attention: NO_CANDIDATES }, due: { attention: DUE_WEEK }, live: { status: LIVE } };
    if (f && preset[f]) {
      setTable((t) => ({ ...t, filters: preset[f] }));
      setTableKey((k) => k + 1);
    }
  }, []);

  const setFilter = (key: string, value: string | null) => {
    setTable((t) => {
      const next = { ...t.filters };
      if (!value || next[key] === value) delete next[key];
      else next[key] = value;
      return { ...t, filters: next };
    });
    setTableKey((k) => k + 1);
  };
  const isOn = (key: string, value: string) => table.filters[key] === value;

  const patchJobs = (fn: (list: Job[]) => Job[]) => setData((d) => ({ ...d, jobs: fn(d?.jobs ?? []) }));

  const applyStatus = async (job: Job, status: Job["status"], undoable = true) => {
    if (pending.has(job.id) || status === job.status) return;
    const prev = job.status;
    setPending((s) => new Set(s).add(job.id));
    patchJobs((l) => l.map((j) => (j.id === job.id ? { ...j, status } : j)));
    try {
      const r = await fetch(`/api/jobs/${job.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      if (!r.ok) throw new Error();
      void refreshJobs();
      notify(`${job.title} set to ${jobStatusLabel(status)}`, undoable ? { undo: () => void applyStatus({ ...job, status }, prev, false) } : undefined);
    } catch {
      patchJobs((l) => l.map((j) => (j.id === job.id && j.status === status ? { ...j, status: prev } : j)));
      notify("Couldn't change the job status. Try again.", { tone: "error" });
    } finally {
      setPending((s) => {
        const n = new Set(s);
        n.delete(job.id);
        return n;
      });
    }
  };

  // Going to or from Active changes the careers site, so it asks first.
  const changeStatus = (job: Job, status: Job["status"]) => {
    if (status === job.status) return;
    if (isPubliclyOpen(status) || isPubliclyOpen(job.status)) setConfirmStatus({ job, to: status });
    else void applyStatus(job, status);
  };

  const remove = async () => {
    if (!deleteId) return;
    setBusy(deleteId);
    try {
      const r = await fetch(`/api/jobs/${deleteId}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      patchJobs((l) => l.filter((j) => j.id !== deleteId));
      void refreshJobs();
      // A posting's applications go with it.
      void refreshApplications();
      notify("Job deleted");
      if (picked === deleteId) setPicked(null);
      setDeleteId(null);
    } catch {
      notify("Couldn't delete the job. Try again.", { tone: "error" });
    } finally {
      setBusy(null);
    }
  };

  const live = jobs.filter(isLive);
  const starved = live.filter(needsCandidates);
  const dueWeek = live.filter(dueThisWeek);
  const applicants = jobs.reduce((n, j) => n + (j.applicationsCount || 0), 0);
  const postedTrend = countIn(buckets(56), jobs.map((j) => new Date(j.createdAt).getTime()));
  const statusMix = JOB_STATUSES.map((s) => ({ label: s.label, value: jobs.filter((j) => j.status === s.value).length })).filter((s) => s.value > 0);
  const stageTotals = PIPELINE.map((s) => live.reduce((n, j) => n + (j.pipeline?.[s] ?? 0), 0));
  const clients = canPrice ? tally(jobs.map((j) => j.clientName || "No client"), 8) : [];

  const dated = useMemo(() => jobs.filter((j) => (!from || j.createdAt.slice(0, 10) >= from) && (!to || j.createdAt.slice(0, 10) <= to)), [jobs, from, to]);

  const description = res.jobs
    ? `${jobs.length} ${copy.noun}${jobs.length === 1 ? "" : "s"}${canPrice ? `, ${applicants} applicant${applicants === 1 ? "" : "s"}` : ""}. ${copy.description}`
    : copy.description;

  const columns: Column<Job>[] = [
    {
      key: "title",
      header: "Role",
      sortable: true,
      grow: 40,
      value: (j) => `${j.title} ${j.postingId ?? ""}`,
      cell: (j) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-navy-900" title={j.title}>{j.title}</span>
          <span className="font-mono text-[12px] text-mist-500">{j.postingId || "No ID"}</span>
        </span>
      ),
    },
    ...(canPrice
      ? [
          {
            key: "assignees",
            header: "Assignees",
            sortable: true,
            hideBelow: "lg" as const,
            value: (j: Job) => assigneesOf(j).join(", "),
            cell: (j: Job) => <AvatarStack names={assigneesOf(j)} />,
          },
          { key: "client", header: "Client", sortable: true, grow: 15, card: false, hideBelow: "lg" as const, value: (j: Job) => j.clientName ?? "", cell: (j: Job) => <span className="block truncate text-mist-700" title={j.clientName || undefined}>{j.clientName || "—"}</span> },
        ]
      : []),
    { key: "postingId", header: "Job ID", sortable: true, card: false, defaultHidden: true, value: (j) => j.postingId ?? "", cell: (j) => <span className="font-mono text-[13px] text-mist-600">{j.postingId || "—"}</span> },
    ...(canPrice
      ? [
          { key: "vendor", header: "Vendor", sortable: true, card: false, defaultHidden: true, value: (j: Job) => j.vendorName ?? "", cell: (j: Job) => <span className="text-mist-700">{j.vendorName || "—"}</span> },
          { key: "manager", header: "Manager", sortable: true, card: false, defaultHidden: true, value: (j: Job) => j.recruitmentManagerName ?? "", cell: (j: Job) => <span className="text-mist-700">{j.recruitmentManagerName || "—"}</span> },
        ]
      : []),
    { key: "department", header: "Department", sortable: true, card: false, defaultHidden: true, value: (j) => j.department ?? "" },
    { key: "location", header: "Location", sortable: true, card: false, hideBelow: "2xl", value: (j) => jobLocationLabel(j), cell: (j) => <span className="text-mist-700">{jobLocationLabel(j) || "—"}</span> },
    { key: "type", header: "Type", sortable: true, card: false, defaultHidden: true, value: (j) => JOB_TYPE_LABEL[j.type] ?? j.type },
    ...(canPrice
      ? [
          { key: "payRate", header: "Pay", sortable: true, numeric: true, card: false, defaultHidden: true, value: (j: Job) => j.payRate ?? 0, cell: (j: Job) => <span className="tabular-nums">{j.payRate ? `$${j.payRate}/hr` : "—"}</span> },
          { key: "billRate", header: "Bill", sortable: true, numeric: true, card: false, defaultHidden: true, value: (j: Job) => j.clientBillRate ?? 0, cell: (j: Job) => <span className="tabular-nums">{j.clientBillRate ? `$${j.clientBillRate}/hr` : "—"}</span> },
        ]
      : []),
    { key: "due", header: "Deadline", sortable: true, hideBelow: "md", className: "whitespace-nowrap", value: (j) => j.submissionDueDate ?? "", cell: (j) => <DueCell job={j} /> },
    ...(canPrice
      ? [
          { key: "applicants", header: "Applicants", sortable: true, hideBelow: "md" as const, numeric: true, value: (j: Job) => j.applicationsCount || 0, cell: (j: Job) =>
            needsCandidates(j) ? (
              <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${RED}`} title="Live with no candidates in play">
                <Icon name="alert" className="size-3.5" />
                {j.applicationsCount || 0}
              </span>
            ) : (
              <span className="tabular-nums">{j.applicationsCount || 0}</span>
            ) },
          { key: "pipeline", header: "Pipeline by stage", card: false, hideBelow: "2xl" as const, value: () => "", cell: (j: Job) => <PipelineCells job={j} /> },
        ]
      : []),
    {
      key: "status",
      header: "Status",
      sortable: true,
      align: "center",
      value: (j) => jobStatusLabel(j.status),
      cell: (j) =>
        canEditJobs ? (
          <JobStatusSelect
            value={j.status}
            label={`Status for ${j.title}`}
            disabled={pending.has(j.id)}
            options={JOB_STATUSES.some((s) => s.value === j.status) ? JOB_STATUSES : [...JOB_STATUSES, { value: j.status, label: jobStatusLabel(j.status) }]}
            onChange={(v) => changeStatus(j, v)}
          />
        ) : (
          <Badge tone={JOB_STATUS_TONE[j.status] ?? "grey"} dot>
            {jobStatusShort(j.status)}
          </Badge>
        ),
    },
    { key: "created", header: "Posted", sortable: true, card: false, hideBelow: "2xl", value: (j) => j.createdAt, cell: (j) => <span className="text-[13px] tabular-nums text-mist-600">{fmtDate(j.createdAt)}</span> },
  ];

  const opts = (vals: string[]) => [...new Set(vals.filter(Boolean))].sort();
  const posted = (j: Job) => {
    const age = (Date.now() - new Date(j.createdAt).getTime()) / DAY;
    return age < 1 ? "Today" : age <= 7 ? "Last 7 days" : age <= 30 ? "Last 30 days" : "Older";
  };
  const legacyStatuses = opts(jobs.filter((j) => !JOB_STATUSES.some((s) => s.value === j.status)).map((j) => jobStatusLabel(j.status)));
  const filters: Filter<Job>[] = [
    { key: "status", label: "Status", options: [...JOB_STATUSES.map((s) => s.label), ...legacyStatuses], value: (j) => jobStatusLabel(j.status) },
    {
      key: "attention",
      label: "Attention",
      options: canPrice ? [DUE_WEEK, NO_CANDIDATES] : [DUE_WEEK],
      value: () => "",
      match: (j, o) => (o === DUE_WEEK ? dueThisWeek(j) : needsCandidates(j)),
    },
    { key: "type", label: "Type", options: opts(jobs.map((j) => JOB_TYPE_LABEL[j.type] ?? j.type)), value: (j) => JOB_TYPE_LABEL[j.type] ?? j.type },
    { key: "posted", label: "Posted", options: ["Today", "Last 7 days", "Last 30 days", "Older"], value: posted },
    ...(canPrice
      ? [
          {
            key: "assignee",
            label: "Assignee",
            options: [...opts(jobs.flatMap(assigneesOf)), "Unassigned"],
            value: (j: Job) => assigneesOf(j)[0] ?? "Unassigned",
            // A role can carry several assignees; any of them matches.
            match: (j: Job, o: string) => (o === "Unassigned" ? assigneesOf(j).length === 0 : assigneesOf(j).includes(o)),
          },
          { key: "client", label: "Client", options: [...opts(jobs.map((j) => j.clientName ?? "")), "No client"], value: (j: Job) => j.clientName || "No client" },
        ]
      : []),
  ];

  const dateCls = "h-10 min-w-0 rounded-lg bg-mist-0 px-2.5 text-[13px] text-navy-900 ring-1 ring-inset ring-mist-300 focus:outline-none focus:ring-2 focus:ring-ocean-600";
  const detailFor = (job: Job) => (
    <JobDetail
      job={jobs.find((x) => x.id === job.id) ?? job}
      query={copy.query}
      canEdit={canEditJobs}
      canPrice={canPrice}
      onDuplicate={(j) => router.push(duplicateJobHref(j))}
      onDelete={(j) => setDeleteId(j.id)}
    />
  );
  // Sheet header: the full record one click away, beside the close button.
  const openJobAction = (job: Job) => (
    <Button size="sm" variant="secondary" icon="expand" label="Open job" href={`/portal/jobs/${job.id}${copy.query}`} />
  );
  const rowMenu = (j: Job, open: () => void) =>
    jobMenuItems({
      job: j,
      go: (href) => router.push(href),
      onOpen: open,
      onDelete: () => setDeleteId(j.id),
      canEdit: canEditJobs,
      canDelete: canPrice,
    });
  const pickedJob = picked ? jobs.find((j) => j.id === picked) : undefined;

  const canPost = canEditJobs && !(res.jobs && jobs.length === 0);
  // Charts live in the Insights sheet; a click that filters the table closes it.
  const insights = (
    <InsightsSheet title={`${copy.title} insights`} description="Where applicants sit, what is due soon and how the roles break down. Click a chip to filter the table.">
      {(close) => {
        const filterBy = (key: string, value: string) => {
          setFilter(key, value);
          close();
        };
        return (
          <>
            {canPrice ? (
              <Panel title="Applicants by stage, live roles">
                {stageTotals.some((n) => n > 0) ? (
                  <BarChart title="Applicants on live roles by pipeline stage" labels={PIPELINE.map((s) => STAGE_LABEL[s])} series={[{ name: "Applicants", values: stageTotals }]} height={220} />
                ) : (
                  <EmptyState compact icon="inbox" title="No applicants on live roles" body="Applicants show here by stage once a live role has some." />
                )}
              </Panel>
            ) : (
              <Panel title="Roles by status">
                <DonutChart title="Roles by status" data={statusMix} centerLabel="Roles" />
              </Panel>
            )}
            <Panel title="Deadlines, next 3 weeks">
              <DeadlineList
                jobs={jobs}
                onPick={(j) => {
                  close();
                  setPicked(j.id);
                }}
              />
            </Panel>
            {canPrice && (
              <Panel title="Status mix">
                <DonutChart title="Roles by status" data={statusMix} centerLabel="Roles" />
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {statusMix.map((s) => (
                    <Button key={s.label} size="sm" variant={isOn("status", s.label) ? "primary" : "secondary"} onClick={() => filterBy("status", s.label)}>
                      {s.label} <span className="tabular-nums opacity-70">{s.value}</span>
                    </Button>
                  ))}
                </div>
              </Panel>
            )}
            {canPrice && clients.length > 0 && (
              <Panel title="Roles by client">
                <BarChart title="Roles by client" labels={clients.map((c) => c.label.split(" ")[0])} series={[{ name: "Roles", values: clients.map((c) => c.value) }]} height={200} />
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {clients.filter((c) => !c.label.startsWith("Other (")).map((c) => (
                    <Button key={c.label} size="sm" variant={isOn("client", c.label) ? "primary" : "secondary"} onClick={() => filterBy("client", c.label)}>
                      {c.label} <span className="tabular-nums opacity-70">{c.value}</span>
                    </Button>
                  ))}
                </div>
              </Panel>
            )}
          </>
        );
      }}
    </InsightsSheet>
  );

  let body: React.ReactNode;
  if (res.isLoading) body = <ListPageSkeleton header={false} label={`Loading ${copy.title.toLowerCase()}`} kpis={4} insights={false} />;
  else if (!res.jobs && res.error)
    body = <ErrorState title={`Couldn't load ${copy.title.toLowerCase()}`} message={res.error.message} onRetry={() => void res.reload()} retrying={res.isValidating} />;
  else if (jobs.length === 0)
    body = (
      <EmptyState
        framed
        variant="first-use"
        icon={copy.icon}
        title={`No ${copy.noun}s posted yet`}
        body={canEditJobs ? "Post a role to track its deadline, team and applicants here. It stays a draft until you set it to Active." : "Roles appear here once a job editor posts one."}
        primary={canEditJobs ? { label: copy.post, icon: "plus", href: `/portal/jobs/new${copy.query}` } : undefined}
      />
    );
  else
    body = (
      <>
        <KpiRow>
          <KpiButton label="Show live roles" active={isOn("status", LIVE)} onClick={() => setFilter("status", LIVE)}>
            <StatCard section="recruiting" label="Live on website" value={live.length} icon={copy.icon} change={`${jobs.length} total`} trend="flat" spark={postedTrend} hint="posted, last 8 weeks" />
          </KpiButton>
          <KpiButton label="Show roles due this week" active={isOn("attention", DUE_WEEK)} onClick={() => setFilter("attention", DUE_WEEK)}>
            <StatCard section="recruiting" label="Due this week" value={dueWeek.length} icon="timer" change={dueWeek.length ? "Submit on time" : "Nothing due"} trend={dueWeek.length ? "down" : "flat"} />
          </KpiButton>
          {canPrice ? (
            <KpiButton label="Show live roles with no candidates in play" active={isOn("attention", NO_CANDIDATES)} onClick={() => setFilter("attention", NO_CANDIDATES)}>
              <StatCard section="recruiting" label="No candidates" value={starved.length} icon="alert" change={starved.length ? "Needs sourcing" : "All covered"} trend={starved.length ? "down" : "up"} hint="live roles" />
            </KpiButton>
          ) : (
            <KpiButton label="Show drafts" active={isOn("status", "Draft")} onClick={() => setFilter("status", "Draft")}>
              <StatCard section="recruiting" label="Drafts" value={jobs.filter((j) => j.status === "draft").length} icon="edit" change="Not yet live" trend="flat" />
            </KpiButton>
          )}
          {canPrice ? (
            <StatCard section="recruiting" label="Applicants" value={applicants} icon="inbox" change={`${(applicants / Math.max(1, jobs.length)).toFixed(1)} per role`} trend="flat" />
          ) : (
            <KpiButton label="Show closed roles" active={isOn("status", "Closed")} onClick={() => setFilter("status", "Closed")}>
              <StatCard section="recruiting" label="Closed" value={jobs.filter((j) => j.status === "closed").length} icon="check" change="Past deadline or filled" trend="flat" />
            </KpiButton>
          )}
        </KpiRow>

        <DataTable
          key={tableKey}
          rows={dated}
          columns={columns}
          filters={filters}
          initialQuery={table.query}
          initialFilters={table.filters}
          onStateChange={setTable}
          storageKey={`roles-${category}`}
          exportName={category === "open" ? "open-roles" : "state-roles"}
          onExport={(list) => exportJobs(category === "open" ? "open-roles" : "state-roles", list, canPrice)}
          searchPlaceholder="Search title, client, location or ID"
          emptyTitle={`No ${copy.noun}s match your filters`}
          filterExtras={
            <span className="flex shrink-0 items-center gap-1.5 text-[13px] text-mist-600">
              <span className="whitespace-nowrap">Posted between</span>
              <label className="sr-only" htmlFor={`${category}-from`}>Posted from</label>
              <input id={`${category}-from`} type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={dateCls} title="Posted from" />
              <span aria-hidden>to</span>
              <label className="sr-only" htmlFor={`${category}-to`}>Posted to</label>
              <input id={`${category}-to`} type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={dateCls} title="Posted to" />
            </span>
          }
          extraChips={
            from || to
              ? [{ key: "posted-range", label: `Posted between: ${from ? fmtDate(`${from}T00:00`) : "any"} to ${to ? fmtDate(`${to}T00:00`) : "today"}`, clear: () => { setFrom(""); setTo(""); } }]
              : []
          }
          detailTitle={(j) => j.title}
          renderDetail={(j) => detailFor(j)}
          detailActions={(j) => openJobAction(j)}
          rowMenu={rowMenu}
        />
      </>
    );

  return (
    <Page>
      <PageHeader
        section="recruiting"
        icon={copy.icon}
        title={copy.title}
        description={description}
        actions={
          (jobs.length > 0 || canPost) && (
            <>
              {jobs.length > 0 && insights}
              {canPost && <Button icon="plus" href={`/portal/jobs/new${copy.query}`}>{copy.post}</Button>}
            </>
          )
        }
      />
      {body}

      {pickedJob && (
        <Drawer title={pickedJob.title} onClose={() => setPicked(null)} actions={openJobAction(pickedJob)}>
          {detailFor(pickedJob)}
        </Drawer>
      )}

      {confirmStatus && (
        <ConfirmDialog
          tone="primary"
          title={isPubliclyOpen(confirmStatus.to) ? "Publish this role?" : "Take this role off the website?"}
          body={
            isPubliclyOpen(confirmStatus.to)
              ? `${confirmStatus.job.title} goes live on the careers site and starts accepting applications.`
              : `${confirmStatus.job.title} leaves the careers site and stops accepting applications. It moves to ${jobStatusLabel(confirmStatus.to)}.`
          }
          confirmLabel={isPubliclyOpen(confirmStatus.to) ? "Publish" : `Set to ${jobStatusLabel(confirmStatus.to)}`}
          onCancel={() => setConfirmStatus(null)}
          onConfirm={() => {
            void applyStatus(confirmStatus.job, confirmStatus.to);
            setConfirmStatus(null);
          }}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          title="Delete this job?"
          body="This is permanent. The posting and every application attached to it are removed."
          confirmLabel="Delete job"
          requireText={deleteConfirmText(res.jobs?.find((j) => j.id === deleteId)?.title)}
          busy={busy === deleteId}
          onCancel={() => setDeleteId(null)}
          onConfirm={() => void remove()}
        />
      )}
    </Page>
  );
}

function JobDetail({
  job,
  query,
  canEdit,
  canPrice,
  onDuplicate,
  onDelete,
}: {
  job: Job;
  query: string;
  canEdit: boolean;
  canPrice: boolean;
  onDuplicate: (j: Job) => void;
  onDelete: (j: Job) => void;
}) {
  const [description, setDescription] = useState<string | null>(job.description ?? null);
  const [descError, setDescError] = useState(false);
  // List rows are summaries; the description is read on open.
  useEffect(() => {
    if (job.description) return;
    let on = true;
    fetch(`/api/jobs/${job.id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => on && setDescription(d?.job?.description ?? ""))
      .catch(() => on && setDescError(true));
    return () => {
      on = false;
    };
  }, [job.id, job.description]);

  const wp = workplaceOf(job);
  const pay = job.salary ? formatSalary(job.salary) : null;
  const total = job.applicationsCount ?? 0;
  const facts: { k: string; v: React.ReactNode }[] = [
    { k: "Job ID", v: job.postingId },
    { k: "Client", v: canPrice ? job.clientName : undefined },
    { k: "Vendor", v: canPrice ? job.vendorName : undefined },
    { k: "Manager", v: canPrice ? job.recruitmentManagerName : undefined },
    { k: "Location", v: jobLocationLabel(job) || (wp ? WORKPLACE_LABEL[wp] : undefined) },
    { k: "Type", v: [JOB_TYPE_LABEL[job.type] ?? job.type, wp && WORKPLACE_LABEL[wp]].filter(Boolean).join(", ") },
    { k: "Salary", v: pay },
    { k: "Pay / bill", v: canPrice && (job.payRate || job.clientBillRate) ? `$${job.payRate ?? "—"} / $${job.clientBillRate ?? "—"} per hour` : undefined },
    { k: "Department", v: job.department },
    { k: "Assignees", v: canPrice ? <AvatarStack names={assigneesOf(job)} max={5} /> : undefined },
    { k: "Deadline", v: job.submissionDueDate ? <DueCell job={job} /> : undefined },
    { k: "Posted", v: fmtDate(job.publishedAt ?? job.createdAt) },
  ].filter((f) => !!f.v);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={JOB_STATUS_TONE[job.status] ?? "grey"} dot>
          {jobStatusShort(job.status)}
        </Badge>
        {!isPubliclyOpen(job.status) && <span className="text-[13px] text-mist-600">Not on the careers site</span>}
      </div>
      <KeyValue items={facts} />
      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="text-[14px] font-semibold text-navy-900">Applicants</h3>
          <span className="text-[13px] tabular-nums text-mist-600">{total} total</span>
        </div>
        {/* Media's projection carries the count without the stage breakdown. */}
        {total > 0 ? (
          job.pipeline && (
            <ul className="mt-2 grid gap-1.5">
              {PIPELINE.filter((s) => (job.pipeline?.[s] ?? 0) > 0).map((s) => (
                <li key={s} className="flex items-center justify-between rounded-lg bg-mist-50 px-3 py-2">
                  <StageBadge stage={s} />
                  <span className="text-[14px] font-semibold tabular-nums">{job.pipeline?.[s]}</span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <p className="mt-2 rounded-lg bg-mist-50 p-3 text-[14px] text-mist-600">No applicants yet.</p>
        )}
      </section>
      <section>
        <h3 className="text-[14px] font-semibold text-navy-900">Description</h3>
        {descError ? (
          <p className="mt-2 text-[14px] text-mist-600">Couldn&apos;t load the description. Open the job page to read it.</p>
        ) : description === null ? (
          <div className="mt-2 grid gap-2" role="status" aria-label="Loading description">
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-11/12 rounded" />
            <Skeleton className="h-3 w-4/5 rounded" />
          </div>
        ) : description ? (
          <div className="prose prose-sm mt-2 max-w-none text-[14px] text-navy-900" dangerouslySetInnerHTML={renderRichText(description)} />
        ) : (
          <p className="mt-2 text-[14px] text-mist-600">No description yet.</p>
        )}
      </section>
      {/* One primary, one secondary, the rest in the overflow */}
      {(canEdit || canPrice) && (
        <div className="flex items-center gap-2 border-t border-mist-200 pt-5">
          {canPrice ? (
            <Button icon="plus" className="flex-1" href={`/portal/applications/new?jobId=${job.id}`}>Add applicant</Button>
          ) : (
            <Button icon="edit" className="flex-1" href={`/portal/jobs/${job.id}/edit${query}`}>Edit</Button>
          )}
          {canPrice && canEdit && <Button variant="secondary" icon="edit" href={`/portal/jobs/${job.id}/edit${query}`}>Edit</Button>}
          <ActionMenu
            label="More actions"
            items={[
              ...(canEdit ? [{ label: "Duplicate", icon: "copy" as const, onSelect: () => onDuplicate(job) }] : []),
              ...(canEdit && canPrice ? [{ kind: "separator" as const }] : []),
              ...(canPrice ? [{ label: "Delete", icon: "trash" as const, danger: true, onSelect: () => onDelete(job) }] : []),
            ]}
          />
        </div>
      )}
    </div>
  );
}
