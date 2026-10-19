"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Application } from "@/lib/aws/dynamodb";
import { useToast } from "@/components/portal/toast";
import Icon from "@/components/portal/icons";
import Select from "@/components/portal/Select";
import { Drawer } from "@/components/portal/kit/overlay";
import { InlineSelect, RatingValue, StageBadge, StageProgress, StarInput, Tags, stageDot } from "@/components/portal/recruiting/bits";
import { BOARD, STAGE_LABEL, locationOf, stageLabel, type Stage } from "@/components/portal/recruiting/model";
import { nextStage } from "@/components/portal/recruiting/applications-views";
import {
  Avatar, Badge, Button, ConfirmDialog, deleteConfirmText, EmptyState, ErrorState, KeyValue, usePortalRouter,
  CrmListSkeleton,
} from "@/components/portal/kit";
import { ActionMenu, type MenuEntry } from "@/components/portal/records/Menu";
import { refreshApplications, useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { haystackOf, matchesTerms, searchTerms } from "@/lib/candidate-search";
import { hireTypeLabel, stateOf } from "@/components/portal/console/theme";
import { DAY, daysInStage, isStale, STALE_DAYS, TERMINAL } from "@/lib/pipeline";

type Row = Application;
type SortKey = "name" | "jobTitle" | "status" | "progress" | "owner" | "rating" | "activity";
type Sort = { key: SortKey; dir: 1 | -1 } | null;

const stageOptions = BOARD.map((s) => ({ value: s, label: STAGE_LABEL[s] }));
const ALL = "";
const IN_PROGRESS = "inprogress";
const STALLED = "stalled";
const UNASSIGNED = "__unassigned";

/** The latest thing that happened to the record: a stage move, or the application itself. */
const lastActivity = (a: Row) => {
  const h = a.statusHistory?.at(-1);
  return h?.changedAt ? { at: h.changedAt, label: stageLabel(h.status) } : { at: a.appliedAt, label: "Applied" };
};
const progressOf = (a: Row) => (a.status === "hired" ? 6 : a.status === "rejected" ? -1 : BOARD.indexOf(a.status));
/** "Oct 19" this year, "Oct 19, 2025" before it: the year only when it says something. */
const shortDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) });
};
const avg = (xs: number[]) => (xs.length ? xs.reduce((n, x) => n + x, 0) / xs.length : 0);

const SORTS: { value: string; label: string }[] = [
  { value: ALL, label: "Newest" },
  { value: "name:1", label: "Applicant, A to Z" },
  { value: "status:1", label: "Stage" },
  { value: "progress:-1", label: "Furthest along" },
  { value: "activity:-1", label: "Recent activity" },
  { value: "activity:1", label: "Longest quiet" },
  { value: "rating:-1", label: "Highest rated" },
  { value: "owner:1", label: "Owner, A to Z" },
];
const WINDOWS = [
  { value: ALL, label: "Any time" },
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const sortValue = (a: Row, key: SortKey): string | number => {
  switch (key) {
    case "name": return (a.name || a.email).toLowerCase();
    case "jobTitle": return (a.jobTitle || "").toLowerCase();
    case "status": return BOARD.indexOf(a.status);
    case "progress": return progressOf(a);
    case "owner": return (a.ownershipName || "~").toLowerCase();
    case "rating": return a.rating || 0;
    case "activity": return new Date(lastActivity(a).at).getTime();
  }
};

// The CRM table: a grid of max-content columns spread edge to edge, each row a subgrid so the
// cells line up; 38px header, 42px rows, one line per cell.
const GRID = "grid min-w-max grid-cols-[repeat(8,max-content)] justify-between";
const ROW = "col-span-full grid grid-cols-subgrid";
const TH = "flex h-[38px] items-center whitespace-nowrap px-3 text-adm-xs font-medium text-mist-600";
const TD = "flex h-[42px] min-w-0 items-center whitespace-nowrap px-3";

export default function ApplicationsView() {
  const notify = useToast();
  const router = usePortalRouter();
  const appsRes = useApplicationSummaries();
  const jobsRes = useJobSummaries();
  const { setData } = appsRes;

  const [query, setQuery] = useState("");
  const [sortParam, setSortParam] = useState(ALL);
  const [stage, setStage] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [windowDays, setWindowDays] = useState(ALL);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkStage, setBulkStage] = useState("");
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Dashboard drill-through: ?status=interview|inprogress, ?owner=unassigned, ?saved=stale
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const s = sp.get("status") ?? sp.get("stage");
    if (s === "inprogress" || s === "open") setStage(IN_PROGRESS);
    else if (s && (BOARD as string[]).includes(s)) setStage(s);
    if (sp.get("saved") === "stale") setStage(STALLED);
    const o = sp.get("owner");
    if (o) setOwner(o === "unassigned" || o === "none" ? UNASSIGNED : o);
  }, []);

  const refreshFailed = !!(appsRes.applications && appsRes.error);
  useEffect(() => {
    if (refreshFailed) notify("Couldn't refresh applications. Showing the last loaded list.", { tone: "error" });
  }, [refreshFailed, notify]);

  const rows: Row[] = useMemo(() => {
    const titles = new Map((jobsRes.jobs ?? []).map((j) => [j.id, j.title]));
    return (appsRes.applications ?? [])
      .map((a) => ({ ...a, jobTitle: a.jobTitle || (a.jobId ? titles.get(a.jobId) : "") || "" }))
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [appsRes.applications, jobsRes.jobs]);

  const sort: Sort = sortParam ? { key: sortParam.split(":")[0] as SortKey, dir: sortParam.endsWith(":-1") ? -1 : 1 } : null;

  const visible = useMemo(() => {
    const terms = searchTerms(query);
    const since = windowDays ? Date.now() - Number(windowDays) * DAY : 0;
    const out = rows.filter((a) => {
      if (stage === IN_PROGRESS && TERMINAL.has(a.status)) return false;
      if (stage === STALLED && !isStale(a)) return false;
      if (stage && stage !== IN_PROGRESS && stage !== STALLED && a.status !== stage) return false;
      if (owner === UNASSIGNED && (a.ownership || a.ownershipName)) return false;
      if (owner && owner !== UNASSIGNED && a.ownershipName !== owner) return false;
      if (since && new Date(lastActivity(a).at).getTime() < since) return false;
      return !terms.length || matchesTerms(haystackOf(a), terms);
    });
    if (!sort) return out;
    return [...out].sort((a, b) => {
      const av = sortValue(a, sort.key), bv = sortValue(b, sort.key);
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv))) * sort.dir;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, stage, owner, windowDays, sortParam]);

  const allSelected = visible.length > 0 && visible.every((a) => selected.has(a.id));
  const someSelected = !allSelected && visible.some((a) => selected.has(a.id));
  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected;
  }, [someSelected]);
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(visible.map((a) => a.id)));
  const headSort = (key: SortKey) =>
    setSortParam((p) => (p === `${key}:1` ? `${key}:-1` : p === `${key}:-1` ? ALL : `${key}:1`));

  const patch = useCallback(
    (fn: (l: Application[]) => Application[]) => setData((d) => ({ ...d, applications: fn(d?.applications ?? []) })),
    [setData],
  );
  const put = (id: string, body: Partial<Application>) =>
    fetch(`/api/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => {
      if (!r.ok) throw new Error();
    });

  const move = async (a: Row, to: Stage, undoable = true) => {
    const prev = a.status;
    if (prev === to) return;
    patch((l) => l.map((x) => (x.id === a.id ? { ...x, status: to } : x)));
    try {
      await put(a.id, { status: to });
      void refreshApplications();
      notify(`${a.name || "Candidate"} moved to ${STAGE_LABEL[to]}`, undoable ? { undo: () => void move({ ...a, status: to }, prev, false) } : undefined);
    } catch {
      patch((l) => l.map((x) => (x.id === a.id && x.status === to ? { ...x, status: prev } : x)));
      notify("Couldn't change the stage. Try again.", { tone: "error" });
    }
  };

  const rate = async (a: Row, rating: number) => {
    const prev = a.rating;
    patch((l) => l.map((x) => (x.id === a.id ? { ...x, rating } : x)));
    try {
      await put(a.id, { rating });
      void refreshApplications();
    } catch {
      patch((l) => l.map((x) => (x.id === a.id && x.rating === rating ? { ...x, rating: prev } : x)));
      notify("Couldn't save the rating. Try again.", { tone: "error" });
    }
  };

  const moveMany = async (ids: string[], to: Stage, undoable = true, from?: Map<string, Stage>) => {
    const before = new Map(rows.filter((r) => ids.includes(r.id)).map((r) => [r.id, r.status]));
    const target = (id: string) => from?.get(id) ?? to;
    patch((l) => l.map((x) => (ids.includes(x.id) ? { ...x, status: target(x.id) } : x)));
    const ok = await Promise.all(ids.map((id) => put(id, { status: target(id) }).then(() => true, () => false)));
    const failed = ids.filter((_, i) => !ok[i]);
    if (failed.length) patch((l) => l.map((x) => (failed.includes(x.id) ? { ...x, status: before.get(x.id) ?? x.status } : x)));
    const moved = ids.filter((id) => !failed.includes(id));
    if (moved.length) void refreshApplications();
    if (failed.length) notify(`${moved.length} moved, ${failed.length} failed. Try again.`, { tone: "error" });
    else if (from) notify(`${ids.length} restored`);
    else notify(`${ids.length} moved to ${STAGE_LABEL[to]}`, undoable ? { undo: () => void moveMany(moved, to, false, before) } : undefined);
  };

  const removeMany = async () => {
    if (!deleteIds) return;
    setDeleting(true);
    const ok = await Promise.all(deleteIds.map((id) => fetch(`/api/applications/${id}`, { method: "DELETE" }).then((r) => r.ok, () => false)));
    const gone = deleteIds.filter((_, i) => ok[i]);
    patch((l) => l.filter((x) => !gone.includes(x.id)));
    if (gone.length) {
      void refreshApplications();
      notify(`${gone.length} application${gone.length > 1 ? "s" : ""} deleted`);
      setSelected((s) => new Set([...s].filter((id) => !gone.includes(id))));
      if (openId && gone.includes(openId)) setOpenId(null);
    }
    if (gone.length < deleteIds.length) notify(`Couldn't delete ${deleteIds.length - gone.length}. Try again.`, { tone: "error" });
    setDeleting(false);
    setDeleteIds(null);
  };

  const exportRows = () =>
    downloadCsv(
      "applications",
      ["ID", "Name", "Email", "Phone", "Job", "Status", "Source", "Hire Type", "Work Auth", "City", "State", "Applied", "Last activity", "Rating"],
      visible.map((a) => [
        a.applicationId || "", a.name || "", a.email, a.phone || "", a.jobTitle || "", stageLabel(a.status), a.source || "",
        hireTypeLabel(a.hireType), a.workAuthorization || "", a.city || "", stateOf(a.state), fmtDate(a.appliedAt), fmtDate(lastActivity(a).at), a.rating || "",
      ]),
    );

  const rowMenu = (a: Row, inDrawer = false): MenuEntry[] => {
    const nxt = nextStage(a.status);
    const items: MenuEntry[] = [
      ...(inDrawer ? [] : [{ label: "Open", icon: "eye" as const, onSelect: () => setOpenId(a.id) }]),
      { label: "Open full record", icon: "expand", onSelect: () => router.push(`/portal/candidates/${a.id}`) },
      { label: "Edit", icon: "edit", onSelect: () => router.push(`/portal/applications/${a.id}/edit?return=/portal/applications`) },
      { label: "Email", icon: "mail", disabled: !a.email, onSelect: () => (window.location.href = `mailto:${a.email}`) },
    ];
    if (nxt || !TERMINAL.has(a.status)) items.push({ kind: "separator" });
    if (nxt && !inDrawer) items.push({ label: `Move to ${STAGE_LABEL[nxt]}`, icon: "chevronRight", onSelect: () => void move(a, nxt) });
    if (!TERMINAL.has(a.status)) items.push({ label: "Reject", icon: "x", danger: true, onSelect: () => void move(a, "rejected") });
    items.push({ kind: "separator" }, { label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleteIds([a.id]) });
    return items;
  };

  const owners = useMemo(() => [...new Set(rows.map((a) => a.ownershipName).filter((n): n is string => !!n))].sort(), [rows]);
  const count = (fn: (a: Row) => boolean) => rows.filter(fn).length;
  const stageFilterOptions = [
    { value: ALL, label: "All", count: rows.length },
    { value: IN_PROGRESS, label: "In progress", count: count((a) => !TERMINAL.has(a.status)) },
    { value: STALLED, label: "Stalled", count: count((a) => isStale(a)) },
    ...BOARD.map((s) => ({ value: s, label: STAGE_LABEL[s], count: count((a) => a.status === s) })),
  ];
  const ownerOptions = [
    { value: ALL, label: "All", count: rows.length },
    { value: UNASSIGNED, label: "Unassigned", count: count((a) => !a.ownership && !a.ownershipName) },
    ...owners.map((o) => ({ value: o, label: o, count: count((a) => a.ownershipName === o) })),
  ];
  const filtering = !!(query || stage || owner || windowDays);
  const clearAll = () => {
    setQuery("");
    setStage(ALL);
    setOwner(ALL);
    setWindowDays(ALL);
  };

  // Footer figures, from what the filters leave
  const inFlight = visible.filter((a) => !TERMINAL.has(a.status));
  const rated = visible.filter((a) => a.rating);
  const stalled = inFlight.filter((a) => isStale(a)).length;
  const figures = [
    { label: "avg days in stage", value: inFlight.length ? Math.round(avg(inFlight.map(daysInStage))) : "—", warn: false },
    { label: "stalled", value: stalled, warn: stalled > 0 },
    { label: "unassigned", value: visible.filter((a) => !a.ownership && !a.ownershipName).length, warn: false },
    { label: "avg rating", value: rated.length ? avg(rated.map((a) => a.rating!)).toFixed(1) : "—", warn: false },
  ];
  const picked = [...selected];

  const loading = appsRes.isLoading || jobsRes.isLoading;
  const failed = (!appsRes.applications && appsRes.error) || (!jobsRes.jobs && jobsRes.error);
  const current = openId ? rows.find((r) => r.id === openId) ?? null : null;

  const sortButton = (key: SortKey, label: string) => {
    const on = sort?.key === key;
    return (
      <button
        type="button"
        onClick={() => headSort(key)}
        className={`group/s inline-flex items-center gap-1 hover:text-navy-900 ${on ? "text-navy-900" : ""}`}
      >
        {label}
        <Icon name="chevronDown" className={`size-3.5 transition ${on ? "opacity-100" : "opacity-0 group-hover/s:opacity-50"} ${on && sort!.dir === 1 ? "rotate-180" : ""}`} />
      </button>
    );
  };

  let body: React.ReactNode;
  if (loading) body = <CrmListSkeleton label="Loading applications" />;
  else if (failed)
    body = (
      <ErrorState
        title="Couldn't load applications"
        message={(appsRes.error ?? jobsRes.error)?.message}
        onRetry={() => void Promise.all([appsRes.reload(), jobsRes.reload()])}
        retrying={appsRes.isValidating || jobsRes.isValidating}
      />
    );
  else if (rows.length === 0)
    body = (
      <EmptyState
        framed
        variant="first-use"
        icon="inbox"
        title="No applicants yet"
        body="Applicants from the careers site land here. Add one yourself from a resume to start a pipeline."
        primary={{ label: "Add applicant", icon: "plus", href: "/portal/applications/new" }}
      />
    );
  else
    body = (
      // One panel that fills the screen: toolbar, the table scrolling inside it, and the summary footer.
      <section aria-label="Applicants" className="flex min-h-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-mist-200 p-4">
          <label className="relative block min-w-0 flex-1 basis-full sm:max-w-60 sm:basis-auto">
            <span className="sr-only">Search applicants, emails or skills</span>
            <Icon name="search" className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-mist-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search applicants, emails or skills"
              className="h-[30px] w-full rounded-full bg-mist-0 pl-8 pr-3 text-adm-xs text-navy-900 ring-1 ring-inset ring-mist-200 placeholder:text-placeholder focus:outline-none focus:ring-2 focus:ring-ocean-600"
            />
          </label>
          <Select label="Sort by" defaultLabel="Newest" value={sortParam} onChange={setSortParam} options={SORTS} size="sm" className="w-auto shrink-0" />
          <Select label="Stage" value={stage} onChange={setStage} options={stageFilterOptions} size="sm" className="w-auto shrink-0" />
          <Select label="Owner" value={owner} onChange={setOwner} options={ownerOptions} size="sm" className="w-auto shrink-0" />
          <Select label="Last activity" defaultLabel="Any time" value={windowDays} onChange={setWindowDays} options={WINDOWS} size="sm" className="w-auto shrink-0" />
          {filtering && (
            <button type="button" onClick={clearAll} className="h-[30px] px-2 text-adm-xs font-medium text-ocean-700 hover:underline">
              Clear
            </button>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={exportRows}
              className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-mist-0 px-[9px] text-adm-xs font-medium text-navy-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)] ring-1 ring-mist-200 transition-colors hover:bg-mist-50"
            >
              <Icon name="download" className="size-3" />
              Export
            </button>
            <Link
              href="/portal/applications/new"
              className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-ocean-600 px-[9px] text-adm-xs font-medium text-white shadow-[0_1px_2px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.15)] transition-colors hover:bg-ocean-700"
            >
              <Icon name="plus" className="size-3" />
              Add applicant
            </Link>
          </div>
        </div>

        <div className="scroll-thin min-h-0 flex-1 overflow-auto">
          {visible.length === 0 ? (
            <EmptyState variant="no-results" title="No applicants match" body="Try a different search or clear the filters." onClearFilters={clearAll} />
          ) : (
            // The CRM grid: one column per field sized to its widest cell, spread across the panel
            // (justify-between), rows on subgrid so every cell lines up; scrolls sideways only when narrower.
            <table className={`${GRID} w-full text-adm-base`}>
              <thead className="contents">
                <tr className={`${ROW} sticky top-0 z-10 border-b border-mist-200 bg-mist-50`}>
                  <th scope="col" className={`${TH} justify-start`}>
                    <span className="flex items-center gap-4">
                      <input ref={selectAllRef} type="checkbox" aria-label="Select all applicants in view" checked={allSelected} onChange={toggleAll} className="size-4 cursor-pointer accent-ocean-600" />
                      {sortButton("name", "Applicant")}
                    </span>
                  </th>
                  <th scope="col" className={`${TH} justify-start`}>{sortButton("jobTitle", "Position")}</th>
                  <th scope="col" className={`${TH} justify-start`}>{sortButton("status", "Stage")}</th>
                  <th scope="col" className={`${TH} justify-start`}>{sortButton("progress", "Progress")}</th>
                  <th scope="col" className={`${TH} justify-start`}>{sortButton("owner", "Owner")}</th>
                  <th scope="col" className={`${TH} justify-end`}>{sortButton("rating", "Rating")}</th>
                  <th scope="col" className={`${TH} justify-start`}>{sortButton("activity", "Last activity")}</th>
                  <th scope="col" className={`${TH} justify-center`}>Action</th>
                </tr>
              </thead>
              <tbody className="contents">
                {visible.map((a) => {
                  const on = selected.has(a.id);
                  const days = TERMINAL.has(a.status) ? null : daysInStage(a);
                  const last = lastActivity(a);
                  return (
                    <tr
                      key={a.id}
                      tabIndex={0}
                      data-active={on || openId === a.id}
                      onClick={() => setOpenId(a.id)}
                      onKeyDown={(e) => {
                        if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
                          e.preventDefault();
                          setOpenId(a.id);
                        }
                      }}
                      className={`${ROW} cursor-pointer border-b border-mist-100 transition-colors duration-150 hover:bg-mist-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ocean-600 data-[active=true]:bg-ocean-50`}
                    >
                      <td className={`${TD} justify-start`}>
                        <span className="flex min-w-0 items-center gap-4">
                          <input
                            type="checkbox"
                            aria-label={`Select ${a.name || a.email}`}
                            checked={on}
                            onChange={() => toggle(a.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="size-4 shrink-0 cursor-pointer accent-ocean-600"
                          />
                          <span className="flex min-w-0 items-center gap-2" title={a.applicationId || undefined}>
                            <Avatar name={a.name || a.email} size="sm" />
                            <span className="max-w-40 truncate font-medium text-navy-900">{a.name || a.email}</span>
                          </span>
                        </span>
                      </td>
                      <td className={`${TD} justify-start`}>
                        <span className="block max-w-40 truncate text-mist-700" title={a.jobTitle || undefined}>{a.jobTitle || "—"}</span>
                      </td>
                      <td className={`${TD} justify-start`}>
                        <InlineSelect
                          value={a.status}
                          label={`Stage for ${a.name || a.email}`}
                          dot={stageDot(a.status)}
                          width="w-32"
                          options={stageOptions.some((o) => o.value === a.status) ? stageOptions : [...stageOptions, { value: a.status, label: stageLabel(a.status) }]}
                          onChange={(v) => void move(a, v as Stage)}
                        />
                      </td>
                      <td className={`${TD} justify-start`}>
                        <span className="flex items-center gap-2">
                          <StageProgress status={a.status} history={a.statusHistory} />
                          <span className={`w-[4ch] text-right tabular-nums ${days !== null && days >= STALE_DAYS ? "font-semibold text-status-warning" : "text-mist-600"}`}>
                            {days === null ? "—" : `${days}d`}
                          </span>
                        </span>
                      </td>
                      <td className={`${TD} justify-start`}>
                        {a.ownershipName ? (
                          <span className="flex items-center gap-1.5" title={a.ownershipName}>
                            <Avatar name={a.ownershipName} size="sm" />
                            <span className="max-w-28 truncate">{a.ownershipName}</span>
                          </span>
                        ) : (
                          <span className="font-medium text-status-danger">Unassigned</span>
                        )}
                      </td>
                      <td className={`${TD} justify-end tabular-nums`}>
                        <RatingValue value={a.rating} />
                      </td>
                      <td className={`${TD} justify-start`}>
                        <span className="flex items-center gap-1">
                          <Icon name="calendar" className="size-3.5 shrink-0 text-navy-900" />
                          <span className="tabular-nums" title={fmtDate(last.at)}>{shortDate(last.at)}</span>
                          <span aria-hidden className="mx-[3px] h-2 w-px bg-mist-300" />
                          <span className="text-mist-600">{last.label}</span>
                        </span>
                      </td>
                      <td className={`${TD} justify-center`} onClick={(e) => e.stopPropagation()}>
                        <ActionMenu
                          label="Row actions"
                          width="w-52"
                          items={rowMenu(a)}
                          trigger={
                            <button
                              type="button"
                              aria-label={`Actions for ${a.name || a.email}`}
                              className="grid size-7 place-items-center rounded-md text-mist-600 hover:bg-mist-100 hover:text-navy-900 data-[state=open]:bg-mist-100 data-[state=open]:text-navy-900"
                            >
                              <Icon name="dotsVertical" className="size-4" />
                            </button>
                          }
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: what is in view and its figures, or the batch actions while rows are selected */}
        <div className="flex min-h-12 shrink-0 flex-wrap items-center border-t border-mist-200 bg-mist-0 sm:px-2">
          {picked.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 px-4 py-2" role="region" aria-label="Selected applicants">
              <span className="mr-2 font-semibold tabular-nums text-navy-900" aria-live="polite">{picked.length} selected</span>
              <Select
                label="Move to stage"
                showLabel={false}
                value={bulkStage}
                onChange={(v) => {
                  setBulkStage("");
                  if (v) void moveMany(picked, v as Stage);
                }}
                options={[{ value: "", label: "Move to stage" }, ...stageOptions]}
                className="min-w-[10rem]"
              />
              <Button size="sm" variant="danger" icon="trash" onClick={() => setDeleteIds(picked)}>Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Deselect all</Button>
            </div>
          ) : (
            <dl className="flex flex-wrap items-center text-adm-base">
              <div className="flex items-baseline gap-1.5 border-r border-mist-200 px-4 py-3">
                <dd className="font-semibold tabular-nums text-navy-900">{visible.length}</dd>
                <dt className="text-mist-600">{visible.length === rows.length ? "applicants" : `of ${rows.length} applicants`} in view</dt>
              </div>
              {figures.map((f) => (
                <div key={f.label} className="flex items-baseline gap-1.5 border-r border-mist-200 px-4 py-3 last:border-r-0">
                  <dd className={`font-semibold tabular-nums ${f.warn ? "text-status-warning" : "text-navy-900"}`}>{f.value}</dd>
                  <dt className="text-mist-600">{f.label}</dt>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    );

  const nxt = current ? nextStage(current.status) : null;

  return (
    // Full-bleed like the CRM: cancels the shell's padding and fills the height under the 64px top bar.
    <div className="-m-5 flex h-[calc(100svh-4rem)] min-h-[32rem] flex-col bg-mist-0 sm:-m-6 lg:-m-8">
      {/* The shell header shows "Applications"; this keeps the page's heading for screen readers */}
      <h1 className="sr-only">Applications</h1>
      {loading || (rows.length > 0 && !failed) ? body : <div className="p-4 sm:p-6">{body}</div>}

      {current && (
        <Drawer
          title={current.name || current.email}
          onClose={() => setOpenId(null)}
          actions={<Button size="sm" variant="secondary" icon="expand" label="Open full record" href={`/portal/candidates/${current.id}`} />}
        >
          <div className="grid gap-6">
            <div className="flex items-center gap-4">
              <Avatar name={current.name || current.email} size="lg" />
              <div className="min-w-0">
                <h3 className="truncate text-adm-lg font-semibold">{current.name || current.email}</h3>
                <p className="truncate text-adm-base text-mist-600">{current.jobTitle || "No position"}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <StageBadge stage={current.status} />
              <StageProgress status={current.status} history={current.statusHistory} />
              {!TERMINAL.has(current.status) && <span className="text-adm-base text-mist-600">{daysInStage(current)} days in stage</span>}
              {current.addToTalentBench && <Badge tone="green">Bench</Badge>}
            </div>
            <StarInput value={current.rating || 0} onChange={(n) => void rate(current, n)} label={`Rating for ${current.name}`} />
            <Select
              label="Move to stage"
              variant="field"
              value={current.status}
              onChange={(v) => void move(current, v as Stage)}
              options={stageOptions.some((o) => o.value === current.status) ? stageOptions : [...stageOptions, { value: current.status, label: stageLabel(current.status) }]}
            />
            <KeyValue
              items={[
                { k: "Email", v: <a className="break-all text-ocean-700 underline underline-offset-2" href={`mailto:${current.email}`}>{current.email}</a> },
                { k: "Phone", v: current.phone || "—" },
                { k: "Location", v: locationOf(current) || "—" },
                { k: "Applied", v: fmtDate(current.appliedAt) },
                { k: "Last activity", v: `${fmtDate(lastActivity(current).at)}, ${lastActivity(current).label === "Applied" ? "applied" : `moved to ${lastActivity(current).label}`}` },
                { k: "Source", v: current.source || "—" },
                { k: "Owner", v: current.ownershipName || <span className="font-medium text-status-danger">Unassigned</span> },
                { k: "Work authorization", v: current.workAuthorization || "—" },
                { k: "Hire type", v: hireTypeLabel(current.hireType) || "—" },
              ]}
            />
            {!!current.skills?.length && (
              <section>
                <h4 className="text-adm-base font-semibold">Skills</h4>
                <div className="mt-2">
                  <Tags items={current.skills} />
                </div>
              </section>
            )}
            {!!current.statusHistory?.length && (
              <section>
                <h4 className="text-adm-base font-semibold">Stage history</h4>
                <ol className="mt-2 grid gap-1.5">
                  {[...current.statusHistory].reverse().slice(0, 6).map((h, i) => (
                    <li key={i} className="flex items-center justify-between gap-3 text-adm-base">
                      <StageBadge stage={h.status} />
                      <span className="truncate text-mist-600">
                        {h.changedByName ? `${h.changedByName}, ` : ""}
                        {fmtDate(h.changedAt)}
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            )}
            <div className="flex items-center gap-2 border-t border-mist-200 pt-5">
              {nxt && (
                <Button icon="chevronRight" className="flex-1" onClick={() => void move(current, nxt)}>
                  Move to {STAGE_LABEL[nxt]}
                </Button>
              )}
              {current.email && (
                <Button variant="secondary" icon="mail" className={nxt ? "" : "flex-1"} href={`mailto:${current.email}`}>
                  Email
                </Button>
              )}
              <ActionMenu label="More actions" items={rowMenu(current, true)} />
            </div>
          </div>
        </Drawer>
      )}

      {deleteIds && (
        <ConfirmDialog
          title={deleteIds.length > 1 ? `Delete ${deleteIds.length} applications?` : "Delete this application?"}
          body="This is permanent and cannot be undone."
          confirmLabel="Delete"
          requireText={deleteConfirmText(rows.find((r) => r.id === deleteIds[0])?.name, deleteIds.length)}
          busy={deleting}
          onCancel={() => setDeleteIds(null)}
          onConfirm={() => void removeMany()}
        />
      )}
    </div>
  );
}
