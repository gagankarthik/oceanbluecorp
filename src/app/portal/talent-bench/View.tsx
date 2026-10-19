"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Application, BenchType } from "@/lib/aws/dynamodb";
import DataTable, { TableTabs, type Column, type Filter, type Summary } from "@/components/portal/DataTable";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import { InlineSelect, StageBadge, StarInput, Tags, stageDot } from "@/components/portal/recruiting/bits";
import { BENCH_STAGES, STAGE_LABEL, permissionsFor, stageLabel, type Stage } from "@/components/portal/recruiting/model";
import { STATE_NAME, hireTypeLabel, stateOf } from "@/components/portal/console/theme";
import {
  Avatar, Badge, Button, EmptyState, ErrorState, KeyValue, ListPage, ListPageState, PillButton, Segmented, usePortalRouter,
  CrmListSkeleton,
} from "@/components/portal/kit";
import { ActionMenu, type MenuEntry } from "@/components/portal/records/Menu";
import { useAuth } from "@/lib/auth";
import { refreshApplications, useApplicationSummaries, useJobSummaries, useUserDirectory } from "@/hooks/use-console-data";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { POOL_META, POOL_ORDER, canView, poolOf } from "@/lib/bench";
import { fmtDate } from "@/lib/format";
import { isUrl } from "@/lib/form-validation";
import { downloadCsv } from "@/lib/csv";

type Row = Application & { searchText?: string; adder: string; adderRole?: string };

const NO_LOCATION = "No location recorded";
const IDLE = "Idle 30+ days";
/** City plus the canonical state code; legacy full state names normalise. */
const locationOf = (a: Application) => [a.city?.trim(), stateOf(a.state)].filter(Boolean).join(", ");
/** Filter label for a record's state: the full name, or the no-location bucket. */
const stateLabel = (a: Application) => {
  const code = stateOf(a.state);
  return code ? STATE_NAME.get(code) || code : NO_LOCATION;
};
type Pool = "all" | BenchType;
type TableState = { query: string; filters: Record<string, string> };

const benchOptions = BENCH_STAGES.map((s) => ({ value: s, label: STAGE_LABEL[s] }));

/** Days since the record was created (falls back to the application date). */
function daysOnBench(a: Application): number | null {
  const t = new Date(a.createdAt || a.appliedAt).getTime();
  return Number.isNaN(t) ? null : Math.max(0, Math.floor((Date.now() - t) / 86_400_000));
}
const IDLE_DAYS = 30;
const isIdle = (a: Application) => (daysOnBench(a) ?? 0) >= IDLE_DAYS;

const EMPTY: Record<Pool, { title: string; body: string }> = {
  all: { title: "No candidates on the bench yet", body: "Hired candidates join the talent bench automatically. Add the people you are sourcing to your own pool." },
  internal: { title: "No consultants on the talent bench yet", body: "Hired candidates move here automatically, and the whole team sees them." },
  external: { title: "Nothing in your pool yet", body: "Add the external candidates you are sourcing. Only you see them." },
};

export default function TalentBenchView() {
  const notify = useToast();
  const router = usePortalRouter();
  const { role } = useSession();
  const { isAdmin } = permissionsFor(role);
  const { user } = useAuth();

  const benchRes = useApplicationSummaries({ bench: true });
  const jobsRes = useJobSummaries();
  const { users: directory } = useUserDirectory();
  const { setData } = benchRes;

  const [pool, setPool] = useState<Pool>("all");
  // Cards suit browsing a bench by skills and availability; the choice is remembered.
  const [layout, setLayout] = useLocalStorage<"table" | "cards">("portal.bench.layout", "cards");
  const [table, setTable] = useState<TableState>({ query: "", filters: {} });

  // Lead Sourcing links back with the pool it was opened from.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("pool");
    if (p === "all" || p === "internal" || p === "external") setPool(p);
  }, []);

  const people = useMemo(() => {
    const m = new Map<string, { name: string; role?: string }>();
    for (const u of directory ?? []) {
      const p = { name: u.name, role: u.role || undefined };
      if (u.email) m.set(u.email.toLowerCase(), p);
      if (u.id) m.set(u.id, p);
      if (u.sub) m.set(u.sub, p);
    }
    return m;
  }, [directory]);

  const rows: Row[] = useMemo(() => {
    const titles = new Map((jobsRes.jobs ?? []).map((j) => [j.id, j.title]));
    const viewer = { id: user?.id, email: user?.email, isAdmin };
    return (benchRes.applications ?? [])
      // The API already hides other people's pools; this keeps an admin's role preview honest.
      .filter((a) => canView(a, viewer))
      .map((a) => {
        const key = (a.benchAddedBy || a.createdBy || "").toString();
        const p = people.get(key.toLowerCase()) || people.get(key);
        const adder = p?.name || a.createdByName || (key.includes("@") ? key.split("@")[0] : "") || "Unknown";
        return { ...a, jobTitle: a.jobTitle || (a.jobId ? titles.get(a.jobId) : "") || "", adder, adderRole: p?.role };
      });
  }, [benchRes.applications, jobsRes.jobs, people, user?.id, user?.email, isAdmin]);

  const patch = useCallback(
    (fn: (l: Application[]) => Application[]) => setData((d) => ({ ...d, applications: fn(d?.applications ?? []) })),
    [setData],
  );
  const put = (id: string, body: Partial<Application>) =>
    fetch(`/api/applications/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => {
      if (!r.ok) throw new Error();
    });

  const setField = async <K extends "status" | "rating">(a: Row, field: K, value: Application[K], fail: string, undoable = true) => {
    const prev = a[field];
    if (prev === value) return;
    patch((l) => l.map((x) => (x.id === a.id ? { ...x, [field]: value } : x)));
    try {
      await put(a.id, { [field]: value });
      void refreshApplications();
      if (field === "status")
        notify(`${a.name || "Candidate"} moved to ${stageLabel(String(value))}`, undoable ? { undo: () => void setField({ ...a, [field]: value }, field, prev, fail, false) } : undefined);
    } catch {
      patch((l) => l.map((x) => (x.id === a.id && x[field] === value ? { ...x, [field]: prev } : x)));
      notify(fail, { tone: "error" });
    }
  };
  const rate = (a: Row, n: number) => void setField(a, "rating", n, "Couldn't save the rating. Try again.");

  // Reversible, so it acts at once and offers an undo instead of a confirm.
  const removeFromBench = async (a: Row) => {
    patch((l) => l.filter((x) => x.id !== a.id));
    try {
      await put(a.id, { addToTalentBench: false });
      void refreshApplications();
      notify(`${a.name || "Candidate"} removed from the bench`, {
        undo: () =>
          void put(a.id, a.benchType ? { addToTalentBench: true, benchType: a.benchType } : { addToTalentBench: true })
            .then(() => refreshApplications())
            .catch(() => notify("Couldn't put them back on the bench. Try again.", { tone: "error" })),
      });
    } catch {
      void benchRes.reload();
      notify("Couldn't remove them from the bench. Try again.", { tone: "error" });
    }
  };

  const downloadResume = async (a: Row) => {
    try {
      const r = await fetch(`/api/resume/${a.resumeId}?applicationId=${encodeURIComponent(a.id)}`);
      if (!r.ok) throw new Error();
      const d = await r.json();
      if (!isUrl(d.downloadUrl)) throw new Error();
      window.open(d.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      notify("Couldn't download the resume. Try again.", { tone: "error" });
    }
  };

  const inPool = useMemo(() => (pool === "all" ? rows : rows.filter((a) => poolOf(a) === pool)), [rows, pool]);

  const loading = benchRes.isLoading || jobsRes.isLoading;
  const failed = (!benchRes.applications && benchRes.error) || (!jobsRes.jobs && jobsRes.error);

  const canFilterByAdder = isAdmin || pool === "internal";
  const summary = (list: Row[]): Summary[] => {
    const idle = list.filter(isIdle).length;
    return [
      { label: "active", value: list.filter((a) => a.status === "active").length },
      { label: "submitted", value: list.filter((a) => a.status === "submitted").length },
      { label: "idle 30+ days", value: idle, warn: idle > 0 },
      { label: "with a resume", value: list.filter((a) => a.resumeId).length },
    ];
  };
  const allSkills = [...new Set(inPool.flatMap((a) => a.skills ?? []))].sort();
  const opts = (vals: (string | undefined)[]) => [...new Set(vals.filter((v): v is string => !!v))].sort();

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Candidate",
      sortable: true,
      grow: 35,
      value: (a) => a.name || a.email,
      cell: (a) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={a.name || a.email} size="sm" />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold" title={a.name || undefined}>{a.name || "Unknown"}</span>
            <span className="truncate text-adm-xs text-mist-600">{a.jobTitle || a.applicationId || ""}</span>
          </span>
        </span>
      ),
    },
    ...(canFilterByAdder ? [{ key: "adder", header: "Added by", sortable: true, card: false, hideBelow: "2xl" as const, value: (a: Row) => a.adder }] : []),
    { key: "email", header: "Email", card: false, hideBelow: "2xl", value: (a) => a.email },
    { key: "phone", header: "Phone", card: false, defaultHidden: true, value: (a) => a.phone ?? "" },
    { key: "position", header: "Last position", card: false, defaultHidden: true, value: (a) => a.jobTitle ?? "" },
    { key: "appId", header: "App ID", card: false, defaultHidden: true, value: (a) => a.applicationId || a.id.slice(0, 8) },
    { key: "skills", header: "Skills", grow: 20, hideBelow: "md", value: (a) => [a.skills?.join(", "), a.searchText].filter(Boolean).join(" "), cell: (a) => (a.skills?.length ? <Tags items={a.skills.slice(0, 3).concat(a.skills.length > 3 ? [`+${a.skills.length - 3}`] : [])} /> : <span className="text-mist-600">&mdash;</span>) },
    { key: "location", header: "Location", sortable: true, grow: 15, hideBelow: "lg", value: (a) => locationOf(a) },
    { key: "age", header: "On bench", sortable: true, numeric: true, hideBelow: "xl", value: (a) => daysOnBench(a) ?? -1, cell: (a) => { const d = daysOnBench(a); return d === null ? <span className="text-mist-600">&mdash;</span> : <span className={`tabular-nums ${d >= IDLE_DAYS ? "font-semibold text-status-warning" : "text-mist-600"}`}>{d}d</span>; } },
    { key: "rating", header: "Rating", sortable: true, card: false, hideBelow: "xl", value: (a) => a.rating || 0, cell: (a) => <StarInput value={a.rating || 0} onChange={(n) => rate(a, n)} label={`Rating for ${a.name}`} /> },
    { key: "hireType", header: "Hire type", sortable: true, card: false, hideBelow: "2xl", value: (a) => hireTypeLabel(a.hireType) },
    { key: "workAuth", header: "Work authorization", card: false, defaultHidden: true, value: (a) => a.workAuthorization ?? "" },
    { key: "pool", header: "Pool", sortable: true, card: false, hideBelow: "2xl", value: (a) => POOL_META[poolOf(a)].label, cell: (a) => <Badge tone={poolOf(a) === "internal" ? "blue" : "grey"}>{POOL_META[poolOf(a)].label}</Badge> },
    {
      key: "status",
      header: "Stage",
      sortable: true,
      align: "center",
      value: (a) => stageLabel(a.status),
      cell: (a) => (
        <InlineSelect
          value={a.status}
          label={`Stage for ${a.name || a.email}`}
          dot={stageDot(a.status)}
          options={benchOptions.some((o) => o.value === a.status) ? benchOptions : [...benchOptions, { value: a.status, label: stageLabel(a.status) }]}
          onChange={(v) => void setField(a, "status", v as Stage, "Couldn't change the stage. Try again.")}
        />
      ),
    },
  ];

  const filters: Filter<Row>[] = [
    { key: "skill", label: "Skill", options: allSkills, value: () => "", match: (a, o) => !!a.skills?.includes(o) },
    { key: "stage", label: "Stage", options: BENCH_STAGES.map((s) => STAGE_LABEL[s]), value: (a) => stageLabel(a.status) },
    { key: "idle", label: "Time on bench", options: [IDLE], value: (a) => (isIdle(a) ? IDLE : "") },
    { key: "auth", label: "Work authorization", options: opts(inPool.map((a) => a.workAuthorization)), value: (a) => a.workAuthorization ?? "" },
    { key: "hire", label: "Hire type", options: opts(inPool.map((a) => hireTypeLabel(a.hireType))), value: (a) => hireTypeLabel(a.hireType) },
    {
      key: "state",
      label: "Location",
      // Named states A to Z, the no-location bucket last.
      options: opts(inPool.map(stateLabel)).sort((x, y) => (x === NO_LOCATION ? 1 : y === NO_LOCATION ? -1 : x.localeCompare(y))),
      value: stateLabel,
    },
    ...(canFilterByAdder ? [{ key: "adder", label: "Added by", options: opts(inPool.map((a) => a.adder)), value: (a: Row) => a.adder }] : []),
  ];

  // Same columns as the console export, whatever the grid is showing.
  const exportCsv = (list: Row[]) =>
    downloadCsv(
      "bench",
      ["App ID", "Name", "Email", "Phone", "Last Position", "Status", "Pool", "Hire Type", "Work Authorization", "Skills", "Rating", "City", "State", "Has Resume", "Notes"],
      list.map((a) => [
        a.applicationId || a.id.slice(0, 8),
        a.name || "Unknown",
        a.email,
        a.phone || "",
        a.jobTitle || "",
        a.status,
        POOL_META[poolOf(a)].label,
        hireTypeLabel(a.hireType),
        a.workAuthorization || "",
        a.skills?.join(", ") || "",
        a.rating?.toString() || "",
        a.city || "",
        stateOf(a.state),
        a.resumeId ? "Yes" : "No",
        a.notes || "",
      ]),
    );

  const detail = (a: Row) => {
    const d = daysOnBench(a);
    return (
      <div className="grid gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={a.name || a.email} size="lg" />
          <div className="min-w-0">
            <h3 className="truncate text-adm-lg font-semibold">{a.name || "Unknown"}</h3>
            <p className="truncate text-adm-base text-mist-600">{a.jobTitle || "No position on file"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StageBadge stage={a.status} />
          <Badge tone={poolOf(a) === "internal" ? "blue" : "grey"}>{POOL_META[poolOf(a)].label}</Badge>
          {d !== null && <span className={`text-adm-base ${d >= IDLE_DAYS ? "font-medium text-status-warning" : "text-mist-600"}`}>{d} days on the bench</span>}
        </div>
        <KeyValue
          items={[
            { k: "Email", v: <a className="break-all text-ocean-700 underline underline-offset-2" href={`mailto:${a.email}`}>{a.email}</a> },
            { k: "Phone", v: a.phone || "—" },
            { k: "Location", v: locationOf(a) || "—" },
            { k: "Work authorization", v: a.workAuthorization || "—" },
            { k: "Hire type", v: hireTypeLabel(a.hireType) || "—" },
            { k: "Rating", v: <StarInput value={a.rating || 0} onChange={(n) => rate(a, n)} label={`Rating for ${a.name}`} /> },
            { k: "Added by", v: a.adderRole ? `${a.adder} (${a.adderRole})` : a.adder },
            { k: "Added", v: fmtDate(a.createdAt || a.appliedAt) },
            { k: "ID", v: a.applicationId || a.id.slice(0, 8) },
          ]}
        />
        {!!a.skills?.length && (
          <section>
            <h4 className="text-adm-base font-semibold">Skills</h4>
            <div className="mt-2">
              <Tags items={a.skills} />
            </div>
          </section>
        )}
        {a.notes && (
          <section>
            <h4 className="text-adm-base font-semibold">Notes</h4>
            <p className="mt-2 whitespace-pre-line rounded-lg bg-mist-50 p-3 text-adm-base">{a.notes}</p>
          </section>
        )}
        {/* One primary, one secondary, the rest in the overflow */}
        <div className="flex items-center gap-2 border-t border-mist-200 pt-5">
          {a.email && (
            <Button icon="mail" className="flex-1" href={`mailto:${a.email}`}>
              Email
            </Button>
          )}
          {a.resumeId && (
            <Button variant="secondary" icon="download" className={a.email ? "" : "flex-1"} onClick={() => void downloadResume(a)}>
              Resume
            </Button>
          )}
          <ActionMenu
            label="More actions"
            items={[
              { label: "Edit profile", icon: "edit", onSelect: () => router.push(`/portal/applications/${a.id}/edit?return=/portal/talent-bench`) },
              { kind: "separator" },
              // Undo toast, nothing deleted
              { label: "Remove from bench", icon: "x", danger: true, onSelect: () => void removeFromBench(a) },
            ]}
          />
        </div>
      </div>
    );
  };

  const rowMenu = (a: Row, openDetail: () => void): MenuEntry[] => [
    { label: "Open", icon: "eye", onSelect: openDetail },
    { label: "Open full record", icon: "external", onSelect: () => router.push(`/portal/candidates/${a.id}`) },
    { label: "Edit profile", icon: "edit", onSelect: () => router.push(`/portal/applications/${a.id}/edit?return=/portal/talent-bench`) },
    ...(a.resumeId ? [{ label: "Download resume", icon: "download" as const, onSelect: () => void downloadResume(a) }] : []),
    { label: "Email", icon: "mail", disabled: !a.email, onSelect: () => (window.location.href = `mailto:${a.email}`) },
    { kind: "separator" },
    // Undo toast, nothing deleted.
    { label: "Remove from bench", icon: "x", danger: true, onSelect: () => void removeFromBench(a) },
  ];

  const counts: Record<Pool, number> = { all: rows.length, internal: 0, external: 0 };
  for (const a of rows) counts[poolOf(a)] += 1;

  const poolTabs = (
    <TableTabs
      label="Pool"
      value={pool}
      onChange={(p) => {
        setPool(p);
        setTable({ query: "", filters: {} });
      }}
      options={[
        { value: "all", label: "Both pools", count: counts.all },
        ...POOL_ORDER.map((p) => ({ value: p as Pool, label: `${POOL_META[p].label} (${p === "internal" ? "team" : "only you"})`, count: counts[p] })),
      ]}
    />
  );

  let body: React.ReactNode;
  if (loading) body = <CrmListSkeleton label="Loading the talent bench" />;
  else if (failed)
    body = (
      <ErrorState
        title="Couldn't load the talent bench"
        message={(benchRes.error ?? jobsRes.error)?.message}
        onRetry={() => void Promise.all([benchRes.reload(), jobsRes.reload()])}
        retrying={benchRes.isValidating || jobsRes.isValidating}
      />
    );
  else if (inPool.length === 0) {
    const empty = (
      <EmptyState
        framed={rows.length === 0}
        variant="first-use"
        icon="bench"
        title={EMPTY[pool].title}
        body={EMPTY[pool].body}
        primary={{ label: "Add profile", icon: "plus", href: "/portal/applications/new?bench=1" }}
        secondary={pool !== "all" && rows.length > 0 ? { label: "Show both pools", onClick: () => setPool("all") } : undefined}
      />
    );
    // An empty pool keeps the tabs, so the other pool is one click away
    body =
      rows.length === 0 ? (
        empty
      ) : (
        <div className="min-w-0 rounded-xl bg-mist-0 ring-1 ring-mist-200">
          <div className="border-b border-mist-200 px-2 sm:px-4">{poolTabs}</div>
          {empty}
        </div>
      );
  }
  else
    body = (
      <DataTable
        key={pool}
        fill
        noun="profiles"
        summary={summary}
        rows={inPool}
        tabs={poolTabs}
        columns={columns}
        filters={filters}
        initialQuery={table.query}
        initialFilters={table.filters}
        onStateChange={setTable}
        storageKey="bench"
        toolbar={
          <>
            <Segmented
              label="Layout"
              value={layout}
              onChange={setLayout}
              options={[
                { value: "cards", label: "Cards", icon: "dashboard" },
                { value: "table", label: "Table", icon: "menu" },
              ]}
            />
            <PillButton icon="sparkle" href={`/portal/lead-sourcing?from=${pool}`}>Lead sourcing</PillButton>
            <PillButton variant="primary" icon="plus" href="/portal/applications/new?bench=1">Add profile</PillButton>
          </>
        }
        exportName="bench"
        onExport={exportCsv}
        searchPlaceholder="Search name, email or skill"
        emptyTitle="No candidates match your filters"
        detailTitle={(a) => a.name || a.email}
        renderDetail={(a) => detail(rows.find((r) => r.id === a.id) ?? a)}
        detailActions={(a) => <Button size="sm" variant="secondary" icon="expand" label="Open full record" href={`/portal/candidates/${a.id}`} />}
        rowMenu={rowMenu}
        renderGrid={
          layout === "cards"
            ? (page, open) => (
                <BenchCards
                  rows={page}
                  showAdder={canFilterByAdder}
                  onOpen={open}
                  onRate={rate}
                  onResume={(a) => void downloadResume(a)}
                  onRemove={(a) => void removeFromBench(a)}
                />
              )
            : undefined
        }
      />
    );

  return (
    <ListPage title="Talent bench">
      {!loading && !failed && inPool.length > 0 ? body : <ListPageState>{body}</ListPageState>}
    </ListPage>
  );
}

function BenchCards({
  rows,
  showAdder,
  onOpen,
  onRate,
  onResume,
  onRemove,
}: {
  rows: Row[];
  showAdder: boolean;
  onOpen: (a: Row) => void;
  onRate: (a: Row, n: number) => void;
  onResume: (a: Row) => void;
  onRemove: (a: Row) => void;
}) {
  return (
    <ul className="grid min-h-full content-start gap-4 bg-mist-50 p-4 md:grid-cols-2 2xl:grid-cols-3">
      {rows.map((a) => {
        const age = daysOnBench(a);
        return (
          <li key={a.id} className="flex min-w-0 flex-col rounded-xl bg-mist-0 p-5 ring-1 ring-mist-200 transition-shadow duration-150 hover:shadow-md">
            <div className="flex items-start gap-3">
              <Avatar name={a.name || a.email} />
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onOpen(a)} className="block max-w-full truncate text-left font-semibold text-navy-900 hover:text-ocean-700">
                  {a.name || "Unknown"}
                </button>
                <p className="truncate text-adm-xs text-mist-600">{a.jobTitle || <span className="font-mono text-mist-600">{a.applicationId || a.id.slice(0, 8)}</span>}</p>
              </div>
              <span className="flex shrink-0 flex-col items-end gap-1.5">
                <StageBadge stage={a.status} />
                <Badge tone={poolOf(a) === "internal" ? "blue" : "grey"}>{POOL_META[poolOf(a)].label}</Badge>
              </span>
            </div>
            {!!a.skills?.length && (
              <div className="mt-4">
                <Tags items={a.skills.slice(0, 5).concat(a.skills.length > 5 ? [`+${a.skills.length - 5}`] : [])} />
              </div>
            )}
            <dl className="mt-4 grid gap-1.5 text-adm-base text-mist-700">
              <div className="flex min-w-0 gap-2"><dt className="w-24 shrink-0 text-mist-600">Work auth</dt><dd className="truncate">{a.workAuthorization || "—"}</dd></div>
              <div className="flex min-w-0 gap-2"><dt className="w-24 shrink-0 text-mist-600">Location</dt><dd className="truncate">{locationOf(a) || "—"}</dd></div>
              <div className="flex min-w-0 gap-2"><dt className="w-24 shrink-0 text-mist-600">Email</dt><dd className="truncate">{a.email}</dd></div>
              {a.resumeId && (
                <div className="flex min-w-0 gap-2">
                  <dt className="w-24 shrink-0 text-mist-600">Resume</dt>
                  <dd>
                    <button type="button" onClick={() => onResume(a)} className="font-medium text-ocean-700 hover:underline">Resume on file</button>
                  </dd>
                </div>
              )}
            </dl>
            {showAdder && (
              <p className="mt-4 flex min-w-0 items-center gap-2 border-t border-mist-100 pt-4 text-adm-xs">
                <span className="shrink-0 text-mist-600">Added by</span>
                <span className="truncate font-medium text-mist-700">{a.adder}</span>
                {a.adderRole && <span className="ml-auto shrink-0 rounded-md bg-mist-100 px-1.5 py-0.5 capitalize text-mist-600">{a.adderRole}</span>}
              </p>
            )}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-mist-100 pt-3">
              <span className="flex items-center gap-2">
                <StarInput value={a.rating || 0} onChange={(n) => onRate(a, n)} label={`Rating for ${a.name}`} />
                {age !== null && <span className={`text-adm-xs tabular-nums ${age >= IDLE_DAYS ? "font-medium text-status-warning" : "text-mist-600"}`} title="Days on bench">{age}d</span>}
              </span>
              <span className="flex items-center">
                <Button variant="ghost" icon="eye" label="View details" onClick={() => onOpen(a)} />
                <Button variant="ghost" icon="edit" label="Edit profile" href={`/portal/applications/${a.id}/edit?return=/portal/talent-bench`} />
                <Button variant="ghost" icon="mail" label="Send email" href={`mailto:${a.email}`} />
                <Button variant="ghost" icon="x" label="Remove from bench" onClick={() => onRemove(a)} />
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
