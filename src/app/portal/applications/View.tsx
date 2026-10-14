"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import { useToast } from "@/components/portal/toast";
import DataTable, { TableTabs, type Column, type Filter } from "@/components/portal/DataTable";
import Select from "@/components/portal/Select";
import { DonutChart, TrendChart } from "@/components/portal/charts";
import { InlineSelect, KpiButton, StageBadge, StageFunnel, StarInput, Tags, stageDot } from "@/components/portal/recruiting/bits";
import { BOARD, FLOW, STAGE_LABEL, buckets, countIn, locationOf, reachedAt, stageLabel, tally, type Stage } from "@/components/portal/recruiting/model";
import { BoardView, FilterBar, SavedViewsMenu, nextStage, type SavedSearch } from "@/components/portal/recruiting/applications-views";
import {
  Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, ErrorState, InsightsSheet, KeyValue, KpiRow, ListPageSkeleton, Page, PageHeader, Panel,
  Segmented, StatCard, usePortalRouter,
} from "@/components/portal/kit";
import { ActionMenu, type MenuEntry } from "@/components/portal/records/Menu";
import { useAuth } from "@/lib/auth";
import { refreshApplications, useApplicationSummaries, useJobSummaries } from "@/hooks/use-console-data";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import { haystackOf, matchesTerms, searchTerms } from "@/lib/candidate-search";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { STATE_NAME, WORK_AUTH_OPTIONS, hireTypeLabel, stateOf } from "@/components/portal/console/theme";
import { daysInStage, everReached, isStale, STALE_DAYS, TERMINAL } from "@/lib/pipeline";

type Row = Application & { searchText?: string };

type SavedView = "all" | "mine" | "review" | "interviewing" | "offers" | "stale" | "hired";
const SAVED: { key: SavedView; label: string; test: (a: Row, me: { id?: string; name?: string }) => boolean }[] = [
  { key: "all", label: "All", test: () => true },
  { key: "mine", label: "My queue", test: (a, me) => !!a.ownership && (a.ownership === me.id || a.ownershipName === me.name) },
  { key: "review", label: "To review", test: (a) => a.status === "pending" || a.status === "reviewing" },
  { key: "interviewing", label: "Interviewing", test: (a) => a.status === "interview" },
  { key: "offers", label: "Offers", test: (a) => a.status === "offered" },
  // Same rule as the dashboard's "Stalled" count.
  { key: "stale", label: "Stalled", test: (a) => isStale(a) },
  { key: "hired", label: "Hired", test: (a) => a.status === "hired" },
];

const stageOptions = BOARD.map((s) => ({ value: s, label: STAGE_LABEL[s] }));

/** Stage filter value for every candidate not yet hired or rejected. */
const IN_PROGRESS = "In progress";
const UNASSIGNED = "Unassigned";
const NO_LOCATION = "No location recorded";
/** Filters on the market (state), not the city spelling; legacy full names normalise to the same state. */
const stateName = (a: Row) => {
  const code = stateOf(a.state);
  return code ? (STATE_NAME.get(code) ?? code) : NO_LOCATION;
};
const RATING_OPTS = ["1+ stars", "2+ stars", "3+ stars", "4+ stars", "5 stars"];
/** All terms must match ("java aws" means both), over the server-built resume haystack. */
const matchesQuery = (a: Row, q: string) => matchesTerms(haystackOf(a), searchTerms(q));

/** ?status= value to the Stage filter's label. */
const stageFilterFor = (s: string | null) =>
  !s ? null : s === "inprogress" || s === "open" ? IN_PROGRESS : (BOARD as string[]).includes(s) || s === "active" || s === "inactive" ? STAGE_LABEL[s as Stage] : null;

type TableState = { query: string; filters: Record<string, string> };
/** `focus` is read from views saved before the stage moved into the filters. */
type ListState = { saved: SavedView; view: "board" | "table"; focus?: Stage | null } & TableState;

/** Saved searches from the old console, mapped onto this screen's filters. */
type LegacyState = { savedView?: string; view?: string; search?: string; status?: string; position?: string; location?: string; source?: string; auth?: string; hire?: string; minRating?: number };
function fromLegacy(st: LegacyState): ListState {
  const f: Record<string, string> = {};
  const set = (k: string, v?: string) => {
    if (v && v !== "all") f[k] = v;
  };
  set("stage", st.status ? STAGE_LABEL[st.status as Stage] : undefined);
  set("position", st.position);
  set("location", st.location === "__none" ? NO_LOCATION : st.location && st.location !== "all" ? (STATE_NAME.get(st.location) ?? st.location) : undefined);
  set("source", st.source);
  set("auth", st.auth);
  set("hire", st.hire && st.hire !== "all" ? hireTypeLabel(st.hire) : undefined);
  if (st.minRating && st.minRating > 0) f.rating = RATING_OPTS[Math.min(5, st.minRating) - 1];
  return {
    saved: SAVED.some((x) => x.key === st.savedView) ? (st.savedView as SavedView) : "all",
    view: st.view === "kanban" ? "board" : "table",
    query: typeof st.search === "string" ? st.search : "",
    filters: f,
  };
}

export default function ApplicationsView() {
  const notify = useToast();
  const router = usePortalRouter();
  const { user } = useAuth();
  const me = useMemo(() => ({ id: user?.id, name: user?.name }), [user?.id, user?.name]);

  const appsRes = useApplicationSummaries();
  const jobsRes = useJobSummaries();
  const { setData } = appsRes;

  const [view, setView] = useState<"board" | "table">("table");
  const [saved, setSaved] = useState<SavedView>("all");
  // KPIs, the funnel, deep links and saved views all write the table's filters: one bar, every constraint a chip.
  const [table, setTable] = useState<TableState>({ query: "", filters: {} });
  const [tableKey, setTableKey] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteIds, setDeleteIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkStage, setBulkStage] = useState("");
  const closeDetail = useRef<(() => void) | null>(null);

  // Dashboard drill-through: ?status=interview|inprogress, ?owner=unassigned, ?saved=stale, ?view=board
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const f: Record<string, string> = {};
    const stage = stageFilterFor(sp.get("status") ?? sp.get("stage"));
    if (stage) f.stage = stage;
    const owner = sp.get("owner");
    if (owner) f.owner = owner === "unassigned" || owner === "none" ? UNASSIGNED : owner;
    if (Object.keys(f).length) {
      setTable((t) => ({ ...t, filters: f }));
      setTableKey((k) => k + 1);
    }
    const sv = sp.get("saved");
    if (sv && SAVED.some((x) => x.key === sv)) setSaved(sv as SavedView);
    const v = sp.get("view");
    if (v === "board" || v === "kanban") setView("board");
    else if (v === "table") setView("table");
  }, []);

  const refreshFailed = !!(appsRes.applications && appsRes.error);
  useEffect(() => {
    if (refreshFailed) notify("Couldn't refresh applications. Showing the last loaded list.", { tone: "error" });
  }, [refreshFailed, notify]);

  const [savedList, setSavedList] = useLocalStorage<SavedSearch<ListState>[]>("portal.applications.savedSearches", []);
  const [legacyList, setLegacyList] = useLocalStorage<SavedSearch<LegacyState>[] | null>("adm.applications.savedSearches", null);
  useEffect(() => {
    if (!Array.isArray(legacyList) || !legacyList.length) return;
    setSavedList((prev) => {
      const cur = Array.isArray(prev) ? prev : [];
      return [...cur, ...legacyList.filter((l) => !cur.some((p) => p.name === l.name)).map((l) => ({ ...l, state: fromLegacy(l.state ?? {}) }))];
    });
    setLegacyList([]);
  }, [legacyList, setLegacyList, setSavedList]);
  const savedSearches = Array.isArray(savedList) ? savedList : [];

  const rows: Row[] = useMemo(() => {
    const titles = new Map((jobsRes.jobs ?? []).map((j) => [j.id, j.title]));
    return (appsRes.applications ?? [])
      .map((a) => ({ ...a, jobTitle: a.jobTitle || (a.jobId ? titles.get(a.jobId) : "") || "" }))
      .sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
  }, [appsRes.applications, jobsRes.jobs]);

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
    }
    if (gone.length < deleteIds.length) notify(`Couldn't delete ${deleteIds.length - gone.length}. Try again.`, { tone: "error" });
    if (openId && gone.includes(openId)) setOpenId(null);
    if (gone.length) closeDetail.current?.();
    closeDetail.current = null;
    setDeleting(false);
    setDeleteIds(null);
  };

  const inSaved = useMemo(() => rows.filter((a) => SAVED.find((s) => s.key === saved)!.test(a, me)), [rows, saved, me]);

  const setFilters = (filters: Record<string, string>) => {
    setTable((t) => ({ ...t, filters }));
    setTableKey((k) => k + 1);
  };
  const toggleStage = (label: string | null) => {
    const next = { ...table.filters };
    if (!label || next.stage === label) delete next.stage;
    else next.stage = label;
    setFilters(next);
  };

  const loading = appsRes.isLoading || jobsRes.isLoading;
  const failed = (!appsRes.applications && appsRes.error) || (!jobsRes.jobs && jobsRes.error);

  const weeks = buckets(84);
  const appliedWeekly = countIn(weeks, rows.map((a) => new Date(a.appliedAt).getTime()));
  const interviewWeekly = countIn(weeks, rows.map((a) => reachedAt(a, "interview")));
  const hiredWeekly = countIn(weeks, rows.map((a) => reachedAt(a, "hired")));
  const byStage = (s: Stage) => rows.filter((a) => a.status === s).length;
  const funnel = [...FLOW, "hired" as Stage].map((s, i) => ({
    label: STAGE_LABEL[s],
    value: s === "hired" ? byStage("hired") : rows.filter((a) => a.status === "hired" || FLOW.slice(i).some((f) => everReached(a, f))).length,
  }));
  const sources = tally(rows.map((a) => a.source || "Unattributed"));
  const positions = [...new Set(rows.map((a) => a.jobTitle).filter((t): t is string => !!t))].sort();
  const opts = (vals: (string | undefined)[]) => [...new Set(vals.filter((v): v is string => !!v))].sort();
  const benchStages = (["active", "inactive"] as Stage[]).filter((s) => rows.some((a) => a.status === s));

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Applicant",
      sortable: true,
      value: (a) => a.name || a.email,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name || a.email} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold">{a.name || a.email}</span>
            <span className="truncate text-[12px] text-mist-500">{a.applicationId || locationOf(a)}</span>
          </span>
        </span>
      ),
    },
    { key: "email", header: "Email", card: false, defaultHidden: true, value: (a) => a.email },
    { key: "phone", header: "Phone", card: false, defaultHidden: true, value: (a) => a.phone ?? "" },
    { key: "jobTitle", header: "Position", sortable: true, hideBelow: "md", value: (a) => a.jobTitle ?? "", cell: (a) => <span className="text-mist-700">{a.jobTitle || "—"}</span> },
    {
      key: "status",
      header: "Stage",
      sortable: true,
      value: (a) => stageLabel(a.status),
      cell: (a) => (
        <InlineSelect
          value={a.status}
          label={`Stage for ${a.name || a.email}`}
          dot={stageDot(a.status)}
          options={stageOptions.some((o) => o.value === a.status) ? stageOptions : [...stageOptions, { value: a.status, label: stageLabel(a.status) }]}
          onChange={(v) => void move(a, v as Stage)}
        />
      ),
    },
    {
      key: "age",
      header: "In stage",
      sortable: true,
      hideBelow: "xl",
      value: (a) => (TERMINAL.has(a.status) ? -1 : daysInStage(a)),
      cell: (a) => {
        if (TERMINAL.has(a.status)) return <span className="text-mist-400">&mdash;</span>;
        const d = daysInStage(a);
        return <span className={`tabular-nums ${d >= STALE_DAYS ? "font-semibold text-[#b54708]" : "text-mist-600"}`}>{d}d</span>;
      },
    },
    { key: "location", header: "Location", sortable: true, card: false, hideBelow: "xl", value: (a) => locationOf(a) },
    { key: "owner", header: "Owner", sortable: true, hideBelow: "lg", value: (a) => a.ownershipName ?? "", cell: (a) => (a.ownershipName ? <span className="text-[13px]">{a.ownershipName}</span> : <span className="text-[13px] font-medium text-[#b42318]">Unassigned</span>) },
    { key: "source", header: "Source", sortable: true, card: false, defaultHidden: true, value: (a) => a.source ?? "" },
    { key: "hireType", header: "Hire type", sortable: true, card: false, defaultHidden: true, value: (a) => hireTypeLabel(a.hireType) },
    { key: "workAuth", header: "Work authorization", card: false, defaultHidden: true, value: (a) => a.workAuthorization ?? "" },
    { key: "skills", header: "Skills", card: false, defaultHidden: true, value: (a) => a.skills?.join(", ") ?? "" },
    { key: "appliedAt", header: "Applied", sortable: true, card: false, hideBelow: "lg", value: (a) => a.appliedAt, cell: (a) => <span className="text-[13px] tabular-nums text-mist-600">{fmtDate(a.appliedAt)}</span> },
    { key: "rating", header: "Rating", sortable: true, hideBelow: "md", value: (a) => a.rating || 0, cell: (a) => <StarInput value={a.rating || 0} onChange={(n) => void rate(a, n)} label={`Rating for ${a.name}`} /> },
  ];

  const filters: Filter<Row>[] = [
    {
      key: "stage",
      label: "Stage",
      options: [IN_PROGRESS, ...BOARD.map((s) => STAGE_LABEL[s]), ...benchStages.map((s) => STAGE_LABEL[s])],
      value: (a) => stageLabel(a.status),
      match: (a, o) => (o === IN_PROGRESS ? !TERMINAL.has(a.status) : stageLabel(a.status) === o),
    },
    {
      key: "owner",
      label: "Owner",
      options: [UNASSIGNED, ...opts(rows.map((a) => a.ownershipName))],
      value: (a) => a.ownershipName || UNASSIGNED,
      match: (a, o) => (o === UNASSIGNED ? !a.ownership && !a.ownershipName : a.ownershipName === o),
    },
    { key: "position", label: "Position", options: positions, value: (a) => a.jobTitle ?? "" },
    {
      key: "location",
      label: "State",
      options: (() => {
        const names = rows.map(stateName);
        const named = opts(names.filter((n) => n !== NO_LOCATION));
        return names.includes(NO_LOCATION) ? [...named, NO_LOCATION] : named;
      })(),
      value: stateName,
    },
    { key: "source", label: "Source", options: opts(rows.map((a) => a.source)), value: (a) => a.source ?? "" },
    { key: "hire", label: "Hire type", options: opts(rows.map((a) => (a.hireType ? hireTypeLabel(a.hireType) : undefined))), value: (a) => hireTypeLabel(a.hireType) },
    {
      key: "auth",
      label: "Work authorization",
      options: (() => {
        const present = new Set<string>(rows.map((a) => a.workAuthorization ?? "").filter(Boolean));
        return [...WORK_AUTH_OPTIONS.filter((v) => present.has(v)), ...[...present].filter((v) => !WORK_AUTH_OPTIONS.includes(v)).sort()];
      })(),
      value: (a) => a.workAuthorization ?? "",
    },
    {
      key: "rating",
      label: "Minimum rating",
      options: RATING_OPTS,
      value: (a) => (a.rating ? String(a.rating) : ""),
      match: (a, o) => (a.rating || 0) >= Number(o[0]),
    },
  ];

  const open = rows.find((r) => r.id === openId) ?? null;

  const detail = (a: Row, close?: () => void) => {
    const nxt = nextStage(a.status);
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={a.name || a.email} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-[20px] font-semibold">{a.name || a.email}</h3>
            <p className="truncate text-[14px] text-mist-600">{a.jobTitle || "No position"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <StageBadge stage={a.status} />
          {!TERMINAL.has(a.status) && <span className="text-[13px] text-mist-600">{daysInStage(a)} days in stage</span>}
          <StarInput value={a.rating || 0} onChange={(n) => void rate(a, n)} label={`Rating for ${a.name}`} />
          {a.addToTalentBench && <Badge tone="green">Bench</Badge>}
        </div>
        <Select
          label="Move to stage"
          variant="field"
          value={a.status}
          onChange={(v) => void move(a, v as Stage)}
          options={stageOptions.some((o) => o.value === a.status) ? stageOptions : [...stageOptions, { value: a.status, label: stageLabel(a.status) }]}
        />
        <KeyValue
          items={[
            { k: "Email", v: <a className="break-all text-ocean-700 underline underline-offset-2" href={`mailto:${a.email}`}>{a.email}</a> },
            { k: "Phone", v: a.phone || "—" },
            { k: "Location", v: locationOf(a) || "—" },
            { k: "Applied", v: fmtDate(a.appliedAt) },
            { k: "Source", v: a.source || "—" },
            { k: "Owner", v: a.ownershipName || <span className="font-medium text-[#b42318]">Unassigned</span> },
            { k: "Work authorization", v: a.workAuthorization || "—" },
            { k: "Hire type", v: hireTypeLabel(a.hireType) || "—" },
          ]}
        />
        {!!a.skills?.length && (
          <section>
            <h4 className="text-[14px] font-semibold">Skills</h4>
            <div className="mt-2">
              <Tags items={a.skills} />
            </div>
          </section>
        )}
        {!!a.statusHistory?.length && (
          <section>
            <h4 className="text-[14px] font-semibold">Stage history</h4>
            <ol className="mt-2 grid gap-1.5">
              {[...a.statusHistory].reverse().slice(0, 6).map((h, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-[13px]">
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
        {/* One primary (the next stage), one secondary, the rest in the overflow */}
        <div className="flex items-center gap-2 border-t border-mist-200 pt-5">
          {nxt && (
            <Button icon="chevronRight" className="flex-1" onClick={() => void move(a, nxt)}>
              Move to {STAGE_LABEL[nxt]}
            </Button>
          )}
          {a.email && (
            <Button variant="secondary" icon="mail" className={nxt ? "" : "flex-1"} href={`mailto:${a.email}`}>
              Email
            </Button>
          )}
          <ActionMenu
            label="More actions"
            items={[
              { label: "Edit", icon: "edit", onSelect: () => router.push(`/portal/applications/${a.id}/edit?return=/portal/applications`) },
              // Reversible from the undo toast, so not styled as danger
              ...(!TERMINAL.has(a.status) ? [{ label: "Reject", icon: "x" as const, onSelect: () => void move(a, "rejected") }] : []),
              { kind: "separator" },
              {
                label: "Delete",
                icon: "trash",
                danger: true,
                onSelect: () => {
                  closeDetail.current = close ?? null;
                  setDeleteIds([a.id]);
                },
              },
            ]}
          />
        </div>
      </div>
    );
  };

  const headerActions = (a: Row) => (
    <Button size="sm" variant="secondary" icon="expand" label="Open full record" href={`/portal/candidates/${a.id}`} />
  );

  const rowMenu = (a: Row, openDetail: () => void): MenuEntry[] => {
    const nxt = nextStage(a.status);
    const items: MenuEntry[] = [
      { label: "Open", icon: "eye", onSelect: openDetail },
      { label: "Open full record", icon: "external", onSelect: () => router.push(`/portal/candidates/${a.id}`) },
      { label: "Edit", icon: "edit", onSelect: () => router.push(`/portal/applications/${a.id}/edit?return=/portal/applications`) },
      { label: "Email", icon: "mail", disabled: !a.email, onSelect: () => (window.location.href = `mailto:${a.email}`) },
    ];
    if (nxt || !TERMINAL.has(a.status)) items.push({ kind: "separator" });
    if (nxt) items.push({ label: `Move to ${STAGE_LABEL[nxt]}`, icon: "chevronRight", onSelect: () => void move(a, nxt) });
    // Reversible from the undo toast, so not styled as danger.
    if (!TERMINAL.has(a.status)) items.push({ label: "Reject", icon: "x", onSelect: () => void move(a, "rejected") });
    items.push({ kind: "separator" }, { label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleteIds([a.id]) });
    return items;
  };

  const q = table.query.trim().toLowerCase();
  const boardRows = inSaved.filter((a) => {
    for (const f of filters) {
      const v = table.filters[f.key];
      if (v && v !== "All" && !(f.match ? f.match(a, v) : f.value(a) === v)) return false;
    }
    return !q || matchesQuery(a, q);
  });
  // A single real stage narrows the board to its column.
  const boardFocus = (BOARD.find((s) => STAGE_LABEL[s] === table.filters.stage) ?? null) as Stage | null;
  const awaiting = rows.filter((a) => a.status === "pending" || a.status === "reviewing").length;
  const scope = saved !== "all" ? SAVED.find((s) => s.key === saved)!.label : null;

  const listState: ListState = {
    saved,
    view,
    query: table.query,
    filters: Object.fromEntries(Object.entries(table.filters).filter(([, v]) => v && v !== "All")),
  };
  const stateKey = JSON.stringify(listState);
  const activeSavedId = savedSearches.find((s) => JSON.stringify({ ...s.state, focus: undefined }) === stateKey)?.id ?? null;
  const applySaved = ({ state: st }: SavedSearch<ListState>) => {
    setSaved(SAVED.some((x) => x.key === st.saved) ? st.saved : "all");
    setView(st.view === "board" ? "board" : "table");
    const f = st.filters && typeof st.filters === "object" ? { ...st.filters } : {};
    if (st.focus && (BOARD as string[]).includes(st.focus)) f.stage = STAGE_LABEL[st.focus];
    setTable({ query: typeof st.query === "string" ? st.query : "", filters: f });
    setTableKey((k) => k + 1);
  };
  const saveCurrent = (name: string) => {
    setSavedList((prev) => [
      ...(Array.isArray(prev) ? prev.filter((s) => s.name !== name) : []),
      { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, state: listState, createdAt: new Date().toISOString() },
    ]);
    notify(`Saved view "${name}"`);
  };
  const deleteSaved = (id: string) => setSavedList((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []));

  const exportRows = (list: Row[]) =>
    downloadCsv(
      "applications",
      ["ID", "Name", "Email", "Phone", "Job", "Status", "Source", "Hire Type", "Work Auth", "City", "State", "Applied", "Rating"],
      list.map((a) => [
        a.applicationId || "", a.name || "", a.email, a.phone || "", a.jobTitle || "", stageLabel(a.status), a.source || "",
        hireTypeLabel(a.hireType), a.workAuthorization || "", a.city || "", stateOf(a.state), fmtDate(a.appliedAt), a.rating || "",
      ]),
    );

  const ready = !loading && !failed && rows.length > 0;
  const stageKpi = (stage: Stage) => table.filters.stage === STAGE_LABEL[stage];

  const savedTabs = (
    <TableTabs
      label="Saved views"
      value={saved}
      onChange={setSaved}
      options={SAVED.map((s) => ({ value: s.key, label: s.label, count: s.key === "all" ? rows.length : rows.filter((a) => s.test(a, me)).length }))}
    />
  );

  let body: React.ReactNode;
  if (loading) body = <ListPageSkeleton header={false} label="Loading applications" kpis={4} insights={false} />;
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
      <>
        <KpiRow>
          <KpiButton label="Show new applications" active={stageKpi("pending")} onClick={() => toggleStage(STAGE_LABEL.pending)}>
            <StatCard section="recruiting" label="New" value={byStage("pending")} icon="inbox" change={`${appliedWeekly.at(-1) ?? 0} this week`} trend="flat" spark={appliedWeekly} />
          </KpiButton>
          <KpiButton label="Show candidates in interviews" active={stageKpi("interview")} onClick={() => toggleStage(STAGE_LABEL.interview)}>
            <StatCard section="recruiting" label="In interviews" value={byStage("interview")} icon="calendar" change={`${interviewWeekly.at(-1) ?? 0} this week`} trend="flat" spark={interviewWeekly} />
          </KpiButton>
          <KpiButton label="Show offers out" active={stageKpi("offered")} onClick={() => toggleStage(STAGE_LABEL.offered)}>
            <StatCard section="recruiting" label="Offers out" value={byStage("offered")} icon="mail" change="Awaiting reply" trend="flat" />
          </KpiButton>
          <KpiButton label="Show hires" active={stageKpi("hired")} onClick={() => toggleStage(STAGE_LABEL.hired)}>
            <StatCard section="recruiting" label="Hired" value={byStage("hired")} icon="userCheck" change={`${hiredWeekly.slice(-4).reduce((n, v) => n + v, 0)} in 4 weeks`} trend="up" spark={hiredWeekly} />
          </KpiButton>
        </KpiRow>

        {view === "board" ? (
          <section aria-label="Pipeline board" className="grid min-w-0 gap-4">
            <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
              <div className="border-b border-mist-200 px-2 sm:px-4">{savedTabs}</div>
              <div className="flex flex-col gap-3 p-4 xl:flex-row xl:items-start xl:justify-between">
                <FilterBar
                  query={table.query}
                  onQuery={(query) => setTable((t) => ({ ...t, query }))}
                  filters={filters}
                  active={table.filters}
                  onActive={(f) => setTable((t) => ({ ...t, filters: f }))}
                  rows={inSaved}
                />
                <Button variant="secondary" icon="download" className="self-start" onClick={() => exportRows(boardRows)}>Export</Button>
              </div>
            </div>
            {boardRows.length === 0 ? (
              <EmptyState
                framed
                variant="no-results"
                title={scope ? `Nothing in ${scope}` : "No matching applicants"}
                body="Try a different search or clear the filters."
                onClearFilters={q || Object.values(table.filters).some((v) => v && v !== "All") ? () => setTable({ query: "", filters: {} }) : undefined}
              />
            ) : (
              <BoardView rows={boardRows} focus={boardFocus} onOpen={setOpenId} onMove={(a, to) => void move(a, to)} onRate={(a, n) => void rate(a, n)} />
            )}
          </section>
        ) : (
          <DataTable
            key={tableKey}
            rows={inSaved}
            tabs={savedTabs}
            initialQuery={table.query}
            initialFilters={table.filters}
            onStateChange={setTable}
            searchMatch={matchesQuery}
            onExport={exportRows}
            storageKey="applications"
            columns={columns}
            filters={filters}
            exportName="applications"
            searchPlaceholder="Search applicants, emails or skills"
            emptyTitle={scope ? `Nothing in ${scope}` : "No matching applicants"}
            selectable
            bulkActions={(ids) => (
              <>
                <Select
                  label="Move to stage"
                  showLabel={false}
                  value={bulkStage}
                  onChange={(v) => {
                    setBulkStage("");
                    if (v) void moveMany(ids, v as Stage);
                  }}
                  options={[{ value: "", label: "Move to stage" }, ...stageOptions]}
                  className="min-w-[10rem]"
                />
                <Button size="sm" variant="danger" icon="trash" onClick={() => setDeleteIds(ids)}>Delete</Button>
              </>
            )}
            detailTitle={(a) => a.name || a.email}
            renderDetail={(a, close) => detail(rows.find((r) => r.id === a.id) ?? a, close)}
            detailActions={headerActions}
            rowMenu={rowMenu}
          />
        )}
      </>
    );

  return (
    <Page>
      <PageHeader
        section="recruiting"
        icon="inbox"
        title="Applications"
        description={
          ready
            ? `${rows.length} applicant${rows.length === 1 ? "" : "s"} across ${positions.length} position${positions.length === 1 ? "" : "s"}${awaiting ? `, ${awaiting} awaiting review` : ""}.`
            : "Every applicant across every role, by stage."
        }
        actions={
          <>
            {ready && (
              <Segmented
                label="Layout"
                value={view}
                onChange={setView}
                options={[
                  { value: "table", label: "Table", icon: "menu" },
                  { value: "board", label: "Board", icon: "dashboard" },
                ]}
              />
            )}
            {ready && <SavedViewsMenu items={savedSearches} activeId={activeSavedId} onApply={applySaved} onSave={saveCurrent} onDelete={deleteSaved} />}
            {ready && (
              <InsightsSheet title="Applications insights" description="Volume over time, how far candidates get and where they come from. Click a stage to filter.">
                {(close) => (
                  <>
                    <Panel title="Applications per week" description="Last 12 weeks">
                      <TrendChart title="Applications received and hires per week, last 12 weeks" labels={weeks.map((w) => w.label)} series={[{ name: "Applications", values: appliedWeekly }, { name: "Hired", values: hiredWeekly }]} area />
                    </Panel>
                    <Panel title="Pipeline conversion" description="Click a stage to filter">
                      <StageFunnel
                        stages={funnel}
                        active={table.filters.stage ?? null}
                        onSelect={(label) => {
                          toggleStage(label);
                          close();
                        }}
                      />
                    </Panel>
                    <Panel title="Where candidates come from">
                      <DonutChart title="Applications by source" data={sources} centerLabel="Applications" />
                    </Panel>
                  </>
                )}
              </InsightsSheet>
            )}
            <Button icon="plus" href="/portal/applications/new">Add applicant</Button>
          </>
        }
      />
      {body}

      {view === "board" && open && (
        <Drawer title={open.name || open.email} onClose={() => setOpenId(null)} actions={headerActions(open)}>
          {detail(open)}
        </Drawer>
      )}
      {deleteIds && (
        <ConfirmDialog
          title={deleteIds.length > 1 ? `Delete ${deleteIds.length} applications?` : "Delete this application?"}
          body="This is permanent and cannot be undone."
          confirmLabel="Delete"
          busy={deleting}
          onCancel={() => setDeleteIds(null)}
          onConfirm={() => void removeMany()}
        />
      )}
    </Page>
  );
}
