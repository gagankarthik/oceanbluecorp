"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  X, Plus, MoreHorizontal,
} from "lucide-react";
import {
  IconDownload, IconEye, IconStar, IconTrash, IconEdit, IconGroup,
  IconWarning, IconBookmarkCheck, IconClock,
} from "@/components/admin/icons";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import ApplicationsLoading from "./loading";
import { useAdmin } from "@/components/admin/admin-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch,
  FilterMenu, ActiveFilters,
  DisplayMenu, SelectionBar, StatStrip,
} from "@/components/admin/workspace";
import { Field, FormSelect } from "@/components/admin/forms/primitives";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  statusMeta, tones, SERIES, SOURCE_OPTIONS, WORK_AUTH_GROUPS,
  HIRE_TYPE_OPTIONS, hireTypeLabel, normalizeState, US_STATES,
  type AppStatus, type Tone,
} from "@/components/admin/theme";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { fmtDate } from "@/lib/format";
import { daysInStage, isStale, TERMINAL, STALE_DAYS } from "@/lib/pipeline";
import { haystackOf, matchesTerms, searchTerms } from "@/lib/candidate-search";
import { downloadCsv } from "@/lib/csv";

/* ============================================================================
   Applications workspace.

   Rebuilt from a four-surface stack (page header band → KPI strip → pipeline
   band → toolbar card → grid) into one panel.

   Two things were removed outright rather than restyled:

   1. The KPI strip. "In pipeline / Interviewing / Offers out / Hired" restated
      four numbers the stage control already carried, in tiles you could not
      click through to. The counts now live on the saved views, where they are
      also the control that filters to them.

   2. The pipeline band's conversion figures. They divided each stage's CURRENT
      occupancy by the previous stage's, which is not a conversion rate — with
      1 record in New and 113 in Screening it rendered "11300%". Occupancy-based
      conversion cannot be fixed by clamping; the honest version needs
      ever-reached cohorts, which the dashboard already computes and shows.
      A wrong number that looks precise is worse than no number.
   ========================================================================== */

interface App extends Application {
  jobDepartment?: string;
}

type ViewMode = "table" | "kanban" | "list";

const PIPELINE = ["pending", "reviewing", "submitted", "interview", "offered", "hired"] as const;
const KANBAN_COLS = [...PIPELINE, "rejected"] as const;
const ALL_STATUSES = [...KANBAN_COLS] as string[];

/**
 * Stage inks. The six in-flight stages are an ordered progression, so they take
 * a single-hue cobalt ramp (light → dark) rather than six categorical hues.
 * "Offered" and the terminal states borrow the reserved status inks.
 */
const STAGE_COLOR: Record<string, string> = {
  pending:   "#93b4fb",
  reviewing: "#6d97f7",
  submitted: "#4a7bef",
  interview: "#2f62e0",
  offered:   SERIES.warning,
  hired:     SERIES.success,
  rejected:  SERIES.danger,
};

const sLabel = (s: string) => statusMeta[s as AppStatus]?.label ?? s;
const sTone = (s: string): Tone => statusMeta[s as AppStatus]?.tone ?? "slate";

/** Empty-cell placeholder. A quiet dash, never a grey sentence. */
function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

// ── location ─────────────────────────────────────────────────────────────────

/**
 * A record's state as a canonical 2-letter code. Older rows stored the full
 * name ("Texas"), so every read goes through here to land in the same bucket as
 * a row saved as "TX" — otherwise one filter option per spelling appears and
 * neither finds the whole set. Unrecognised values pass through rather than
 * disappearing.
 */
function stateOf(value?: string | null): string {
  return normalizeState(value) || value?.trim() || "";
}

const STATE_NAME = new Map(US_STATES.map((s) => [s.code, s.name]));

/** "Austin, TX" — what a recruiter actually calls the location. */
function locationOf(a: Pick<App, "city" | "state">): string {
  return [a.city?.trim(), stateOf(a.state)].filter(Boolean).join(", ");
}

/**
 * The location filter keys on STATE, not on the full city string.
 *
 * Recruiters filter to a market, not to a spelling: "Austin", "austin" and
 * "Austin Metro" are the same answer to "who can work in Texas?", and a
 * city-keyed list would have offered all three as separate options while a
 * candidate in Round Rock matched none of them. Cities remain searchable
 * through the search box and are shown in the column.
 */
function stateFilterValue(a: Pick<App, "city" | "state">): string {
  return stateOf(a.state);
}

// ── saved views ──────────────────────────────────────────────────────────────

type ViewKey =
  | "all" | "mine" | "review" | "interviewing" | "offers" | "stale" | "hired";

/**
 * A saved view is a named predicate, not just a status filter. "My queue" and
 * "Stale" are the two a recruiter opens this screen to check, and neither is
 * expressible as a value in a single column, which is exactly why the old
 * status-chip row could not replace them.
 */
const VIEW_PREDICATE: Record<ViewKey, (a: App, ctx: { userId?: string; userName?: string }) => boolean> = {
  all:          () => true,
  mine:         (a, c) => !!a.ownership && (a.ownership === c.userId || a.ownershipName === c.userName),
  review:       (a) => a.status === "pending" || a.status === "reviewing",
  interviewing: (a) => a.status === "interview",
  offers:       (a) => a.status === "offered",
  stale:        (a) => isStale(a),
  hired:        (a) => a.status === "hired",
};

// ── in-grid stage control ────────────────────────────────────────────────────

/**
 * Inline stage editor.
 *
 * Fixed width and our own chevron: a bare native select is drawn by the OS at
 * whatever size the current label needs, so the cell visibly changed width as a
 * candidate moved from "New" to "Submitted", and it was the one control on the
 * grid that did not match the design system. The dot carries the stage colour
 * so a row is scannable without reading the label.
 */
function StageSelect({ app, onChange }: {
  app: App;
  onChange: (id: string, s: Application["status"]) => void;
}) {
  return (
    <span className="relative inline-flex w-[142px] items-center" onClick={(e) => e.stopPropagation()}>
      <span
        aria-hidden
        className="pointer-events-none absolute left-3 h-2 w-2 flex-none rounded-full"
        style={{ background: STAGE_COLOR[app.status] ?? SERIES.neutral }}
      />
      <select
        value={app.status}
        autoComplete="off"
        aria-label={`Stage for ${app.name || app.email}`}
        onChange={(e) => onChange(app.id, e.target.value as Application["status"])}
        className="h-9 w-full cursor-pointer appearance-none rounded-[8px] border border-transparent bg-transparent pl-7 pr-7 text-[14px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:border-[var(--adm-line)] hover:bg-[var(--adm-surface)] focus:border-[var(--adm-accent)] focus:bg-[var(--adm-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
      >
        {ALL_STATUSES.map((s) => <option key={s} value={s}>{sLabel(s)}</option>)}
      </select>
      <svg
        aria-hidden viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-[var(--adm-ink-subtle)]"
        fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/** Days-in-stage marker. Goes amber once the record crosses the stale line. */
function AgeCell({ app }: { app: App }) {
  if (TERMINAL.has(app.status)) return <Blank />;
  const d = daysInStage(app);
  const stale = d >= STALE_DAYS;
  return (
    <span
      title={`${d} day${d === 1 ? "" : "s"} in ${sLabel(app.status)}`}
      className={cn(
        "inline-flex items-center gap-1.5 text-[14px] tabular-nums",
        stale ? "font-semibold text-[var(--adm-warning)]" : "text-[var(--adm-ink-subtle)]",
      )}
    >
      {stale && <IconClock className="h-4 w-4" />}
      {d}d
    </span>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openCandidateEditor, candidateRevision, setJobs: setCtxJobs } = useAdmin();

  const [applications, setApplications] = useState<App[]>([]);
  const [, setJobs]           = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [view, setView]       = useState<ViewMode>("table");
  const [savedView, setSavedView] = useState<ViewKey>("all");

  // Workspace preferences persist — a density or column choice that resets on
  // every navigation is not a preference, it is a toy.
  const [rows, setRows] = useLocalStorage<number>("adm.applications.rows", 25);
  // Source starts hidden — it only matters in aggregate, which the dashboard's
  // channel panel already answers. The key is versioned (v2) because the
  // previous default was persisted to localStorage, and a stored value always
  // wins over a changed default; without a new key, anyone who loaded the old
  // build keeps its column set forever.
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>(
    "adm.applications.hiddenCols.v2",
    ["source"],
  );

  // ── filters
  const [search, setSearch]             = useState("");
  const debouncedSearch                 = useDebouncedValue(search, 250);
  const [statusFilter, setStatusFilter] = useState("all");
  const [posFilter, setPosFilter]       = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [authFilter, setAuthFilter]     = useState("all");
  const [hireFilter, setHireFilter]     = useState("all");
  const [minRating, setMinRating]       = useState(0);

  // ── selection + modals
  const [selected, setSelected]             = useState<string[]>([]);
  const [deleteId, setDeleteId]             = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleting, setDeleting]             = useState(false);

  // Deep-link filters (dashboard drill-through: ?status=…&view=…).
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const status = sp.get("status");
    if (status) setStatusFilter(status);
    const v = sp.get("view");
    if (v === "table" || v === "kanban" || v === "list") setView(v as ViewMode);
    const sv = sp.get("saved");
    if (sv && sv in VIEW_PREDICATE) setSavedView(sv as ViewKey);
  }, []);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ar, jr] = await Promise.all([fetch("/api/applications"), fetch("/api/jobs")]);
      const ad = await ar.json(); const jd = await jr.json();
      if (!ar.ok || !jr.ok) throw new Error("Failed to fetch");
      const jArr: Job[] = jd.jobs || [];
      setJobs(jArr); setCtxJobs(jArr);
      const jMap = new Map(jArr.map((j) => [j.id, j]));
      const list: App[] = (ad.applications || []).map((a: Application) => {
        const j = a.jobId ? jMap.get(a.jobId) : null;
        return { ...a, jobTitle: a.jobTitle || j?.title || "", jobDepartment: j?.department || "" };
      });
      list.sort((a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime());
      setApplications(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally { setLoading(false); }
  }, [setCtxJobs]);

  useEffect(() => { void load(); }, [load, candidateRevision]);

  // ── derived ───────────────────────────────────────────────────────────────

  const positions = useMemo(
    () => [...new Set(applications.map((a) => a.jobTitle).filter((t): t is string => !!t))],
    [applications],
  );

  /**
   * Locations present in the data, with how many records sit in each. Built
   * from the records themselves rather than from the 50-state list, so the
   * menu never offers a state nobody has applied from.
   */
  const locations = useMemo(() => {
    const counts = new Map<string, number>();
    let unknown = 0;
    for (const a of applications) {
      const code = stateFilterValue(a);
      if (!code) { unknown += 1; continue; }
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    const named = [...counts.entries()]
      .map(([code, count]) => ({ value: code, label: STATE_NAME.get(code) || code, count }))
      .sort((x, y) => x.label.localeCompare(y.label));
    return unknown > 0
      ? [...named, { value: "__none", label: "No location recorded", count: unknown }]
      : named;
  }, [applications]);

  /** Hire types present in the data, in the canonical picker order. */
  const hireTypes = useMemo(() => {
    const present = new Set(applications.map((a) => a.hireType).filter(Boolean) as string[]);
    const known = HIRE_TYPE_OPTIONS.filter((o) => present.has(o.value)).map((o) => o.value);
    const extra = [...present].filter((v) => !HIRE_TYPE_OPTIONS.some((o) => o.value === v));
    return [...known, ...extra];
  }, [applications]);

  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of applications) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [applications]);

  const viewCtx = useMemo(
    () => ({ userId: user?.id, userName: user?.name ?? undefined }),
    [user?.id, user?.name],
  );

  /** Counts for the saved-view tabs, computed once over the unfiltered set. */
  const viewCounts = useMemo(() => {
    const out = {} as Record<ViewKey, number>;
    for (const k of Object.keys(VIEW_PREDICATE) as ViewKey[]) {
      out[k] = applications.filter((a) => VIEW_PREDICATE[k](a, viewCtx)).length;
    }
    return out;
  }, [applications, viewCtx]);

  const views: { key: ViewKey; label: string; count: number }[] = [
    { key: "all",          label: "All applicants", count: viewCounts.all },
    { key: "mine",         label: "My queue",       count: viewCounts.mine },
    { key: "review",       label: "Needs review",   count: viewCounts.review },
    { key: "interviewing", label: "Interviewing",   count: viewCounts.interviewing },
    { key: "offers",       label: "Offers out",     count: viewCounts.offers },
    { key: "stale",        label: "Stale",          count: viewCounts.stale },
    { key: "hired",        label: "Hired",          count: viewCounts.hired },
  ];

  /* The badge on the single Filters control. Counts every dimension it owns —
     the old split counted only the four that lived behind the drawer, because
     the other four had their own pills to show state. With one control there is
     nowhere else for that state to show. `savedView` is excluded: it selects
     WHICH records are in scope rather than narrowing them, and its own label is
     already in the menu. */
  const totalActiveFilters = [
    statusFilter !== "all", posFilter !== "all", locationFilter !== "all",
    sourceFilter !== "all", authFilter !== "all", hireFilter !== "all",
    minRating > 0,
  ].filter(Boolean).length;

  const hasActiveFilters = totalActiveFilters > 0
    || debouncedSearch.trim() !== "";

  /** Records inside the current saved view, before the toolbar filters apply. */
  const inView = useMemo(
    () => applications.filter((a) => VIEW_PREDICATE[savedView](a, viewCtx)),
    [applications, savedView, viewCtx],
  );

  /**
   * Searchable text per record, built once per loaded list rather than on every
   * keystroke — walking a few hundred parsed resumes on each character typed is
   * what would make a skill search feel slow.
   */
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of applications) map.set(a.id, haystackOf(a));
    return map;
  }, [applications]);

  const filtered = useMemo(() => {
    // All terms must match, so "java aws" means both.
    const terms = searchTerms(debouncedSearch.trim());
    return inView.filter((a) => {
    // Matches identity fields AND the parsed resume — skills, employers, role
    // titles, technologies, certifications. Searching a skill finds people who
    // have it, not just people who applied to a job named after it.
    if (terms.length && !matchesTerms(haystacks.get(a.id) ?? haystackOf(a), terms)) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (posFilter    !== "all" && a.jobTitle !== posFilter) return false;
    if (locationFilter !== "all") {
      const code = stateFilterValue(a);
      if (locationFilter === "__none" ? !!code : code !== locationFilter) return false;
    }
    if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
    if (authFilter   !== "all" && a.workAuthorization !== authFilter) return false;
    if (hireFilter   !== "all" && a.hireType !== hireFilter) return false;
    if (minRating > 0 && (a.rating || 0) < minRating) return false;
    return true;
    });
  }, [inView, haystacks, debouncedSearch, statusFilter, posFilter, locationFilter, sourceFilter, authFilter, hireFilter, minRating]);

  // ── mutations ─────────────────────────────────────────────────────────────

  const patchStatus = async (id: string, status: Application["status"]) => {
    setApplications((p) => p.map((a) => (a.id === id ? { ...a, status } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, changedBy: user?.id, changedByName: user?.name || "Admin" }),
    }).catch(() => { toast.error("Failed to update status"); load(); });
  };

  const patchRating = async (id: string, rating: number) => {
    setApplications((p) => p.map((a) => (a.id === id ? { ...a, rating } : a)));
    await fetch(`/api/applications/${id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }),
    }).catch(() => load());
  };

  const deleteOne = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await fetch(`/api/applications/${deleteId}`, { method: "DELETE" });
      setApplications((p) => p.filter((a) => a.id !== deleteId));
      toast.success("Application deleted");
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const deleteBulk = async () => {
    setDeleting(true);
    try {
      await Promise.all(selected.map((id) => fetch(`/api/applications/${id}`, { method: "DELETE" })));
      setApplications((p) => p.filter((a) => !selected.includes(a.id)));
      toast.success(`${selected.length} application${selected.length > 1 ? "s" : ""} deleted`);
      setSelected([]);
    } catch { toast.error("Failed to delete"); }
    finally { setDeleting(false); setBulkDeleteOpen(false); }
  };

  /** Bulk stage move — the action a multi-select is actually for. */
  const bulkStage = async (status: Application["status"]) => {
    const ids = [...selected];
    setApplications((p) => p.map((a) => (ids.includes(a.id) ? { ...a, status } : a)));
    setSelected([]);
    try {
      await Promise.all(ids.map((id) => fetch(`/api/applications/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, changedBy: user?.id, changedByName: user?.name || "Admin" }),
      })));
      toast.success(`${ids.length} moved to ${sLabel(status)}`);
    } catch { toast.error("Failed to move candidates"); load(); }
  };

  const exportCSV = () => downloadCsv(
    "applications",
    ["ID", "Name", "Email", "Phone", "Job", "Status", "Source", "Hire Type", "Work Auth", "City", "State", "Applied", "Rating"],
    filtered.map((a) => [
      a.applicationId || "", a.name || "", a.email, a.phone || "",
      a.jobTitle || "", a.status, a.source || "", hireTypeLabel(a.hireType),
      a.workAuthorization || "", a.city || "", stateOf(a.state),
      fmtDate(a.appliedAt), a.rating || "",
    ]),
  );

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setPosFilter("all"); setLocationFilter("all");
    setSourceFilter("all"); setAuthFilter("all"); setHireFilter("all"); setMinRating(0);
  };

  const locationLabel = (v: string) =>
    v === "__none" ? "No location" : STATE_NAME.get(v) || v;

  const filterChips: { label: string; onClear: () => void }[] = [
    ...(savedView !== "all" ? [{ label: `View: ${views.find((v) => v.key === savedView)?.label ?? savedView}`, onClear: () => setSavedView("all") }] : []),
    ...(statusFilter !== "all" ? [{ label: `Stage: ${sLabel(statusFilter)}`, onClear: () => setStatusFilter("all") }] : []),
    ...(posFilter !== "all"    ? [{ label: `Position: ${posFilter}`, onClear: () => setPosFilter("all") }] : []),
    ...(locationFilter !== "all" ? [{ label: `Location: ${locationLabel(locationFilter)}`, onClear: () => setLocationFilter("all") }] : []),
    ...(sourceFilter !== "all" ? [{ label: `Source: ${sourceFilter}`, onClear: () => setSourceFilter("all") }] : []),
    ...(authFilter !== "all"   ? [{ label: `Auth: ${authFilter}`, onClear: () => setAuthFilter("all") }] : []),
    ...(hireFilter !== "all"   ? [{ label: `Hire: ${hireTypeLabel(hireFilter)}`, onClear: () => setHireFilter("all") }] : []),
    ...(minRating > 0          ? [{ label: `${minRating}+ stars`, onClear: () => setMinRating(0) }] : []),
  ];

  const rowActions = {
    onView: (id: string) => router.push(`/admin/candidates/${id}`),
    onEdit: (app: App) => openCandidateEditor({ candidate: app, mode: "edit" }),
    onDelete: setDeleteId,
    onStatusChange: patchStatus,
    onRating: patchRating,
  };

  // ── grid columns ──────────────────────────────────────────────────────────

  const columns: DataTableColumn<App>[] = [
    {
      key: "name", header: "Applicant", label: "Applicant", locked: true, width: "230px",
      sortValue: (a) => a.name || a.email,
      // Name only. This briefly stacked the email underneath as a second line
      // while the Email column was also being rendered, so every row printed
      // the same address twice.
      cell: (a) => (
        <span className="inline-flex max-w-full items-center gap-3 align-middle">
          <Avatar name={a.name} email={a.email} size="md" />
          <span className="truncate text-[14.5px] font-semibold text-[var(--adm-ink)]">
            {a.name || a.email}
          </span>
        </span>
      ),
    },
    {
      key: "email", header: "Email", label: "Email", hideBelow: "lg", width: "192px",
      sortValue: (a) => a.email,
      cell: (a) => <span className="text-[14px] text-[var(--adm-ink-subtle)]">{a.email}</span>,
    },
    {
      key: "jobTitle", header: "Position", label: "Position", hideBelow: "md", width: "192px",
      sortValue: (a) => a.jobTitle || "",
      cell: (a) => a.jobTitle ? <span className="text-[14px] text-[var(--adm-ink-mute)]">{a.jobTitle}</span> : <Blank />,
    },
    {
      key: "status", header: "Stage", label: "Stage", locked: true, width: "150px",
      sortValue: (a) => a.status,
      cell: (a) => <StageSelect app={a} onChange={patchStatus} />,
    },
    {
      key: "age", header: "In stage", label: "In stage", hideBelow: "lg", width: "95px",
      sortValue: (a) => (TERMINAL.has(a.status) ? -1 : daysInStage(a)),
      cell: (a) => <AgeCell app={a} />,
    },
    {
      key: "location", header: "Location", label: "Location", hideBelow: "lg", width: "150px",
      sortValue: (a) => locationOf(a),
      cell: (a) => {
        const loc = locationOf(a);
        return loc ? <span className="text-[14px] text-[var(--adm-ink-mute)]">{loc}</span> : <Blank />;
      },
    },
    {
      key: "hireType", header: "Hire type", label: "Hire type", hideBelow: "xl", width: "130px",
      sortValue: (a) => a.hireType || "",
      cell: (a) => a.hireType
        ? (
          <span className="inline-flex items-center rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[12px] font-medium text-[var(--adm-ink-mute)]">
            {a.hireType}
          </span>
        )
        : <Blank />,
    },
    {
      key: "owner", header: "Owner", label: "Owner", hideBelow: "xl", width: "140px",
      sortValue: (a) => a.ownershipName || "",
      cell: (a) => a.ownershipName
        ? (
          <span className="inline-flex max-w-full items-center gap-2 align-middle">
            <Avatar name={a.ownershipName} size="sm" />
            <span className="min-w-0 truncate text-[14px] text-[var(--adm-ink-mute)]">{a.ownershipName}</span>
          </span>
        )
        : <span className="text-[14px] italic text-[var(--adm-ink-subtle)]">Unassigned</span>,
    },
    {
      key: "source", header: "Source", label: "Source", hideBelow: "xl", width: "140px",
      sortValue: (a) => a.source || "",
      cell: (a) => a.source
        ? <span className="text-[14px] text-[var(--adm-ink-mute)]">{a.source}</span>
        : <Blank />,
    },
    {
      key: "appliedAt", header: "Applied", label: "Applied", hideBelow: "lg", width: "110px",
      sortValue: (a) => new Date(a.appliedAt).getTime(),
      cell: (a) => <span className="text-[14px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(a.appliedAt)}</span>,
    },
    {
      key: "rating", header: "Rating", label: "Rating", hideBelow: "sm", width: "108px",
      sortValue: (a) => a.rating || 0,
      cell: (a) => (
        <div onClick={(e) => e.stopPropagation()}>
          <StarRating
            rating={a.rating || 0}
            collapseWhenEmpty
            size="md"
            onRate={(r) => patchRating(a.id, r === a.rating ? 0 : r)}
          />
        </div>
      ),
    },
  ];

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <ApplicationsLoading />;
  if (error) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="space-y-4 text-center">
        <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
        <p className="text-sm text-[var(--adm-danger)]">{error}</p>
        <WorkspaceButton variant="primary" onClick={load}>Retry</WorkspaceButton>
      </div>
    </div>
  );

  const isGrid = view === "table";

  return (
    /* ── Bounded height: the TABLE scrolls, not the page ──────────────────
       The admin shell already gives `main` a fixed height and its own
       overflow, so the only thing standing between this screen and an
       internal scroll was the page itself being taller than that box. As a
       full-height flex column, the chrome above (title, stats, toolbar) takes
       its natural height and `Workspace` — already `flex-1` — absorbs the
       rest, which makes DataTable's `overflow-auto` container the scrolling
       element.

       `min-h-0` is the load-bearing part: a flex child defaults to
       `min-height: auto`, so without it this column refuses to shrink below
       the table's intrinsic height, grows past the viewport, and the page
       scrolls exactly as before.

       This is also what finally makes the sticky `thead` (`.adm-grid thead th`
       in globals.css) do anything — a sticky header only sticks to a scroll
       container, and until now the container it sat in never scrolled. */
    <div className="flex h-full min-h-0 flex-col">
    <WorkspaceTitle
      title="Applications"
      actions={
        <>
          <WorkspaceButton onClick={exportCSV}>
            <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
          </WorkspaceButton>
          <WorkspaceButton variant="primary" onClick={() => openCandidateEditor({ mode: "create" })}>
            <Plus className="h-4 w-4" />Add applicant
          </WorkspaceButton>
        </>
      }
    />
      {/* Inline stat strip — the table gets the vertical space, not stat cards. */}
      <StatStrip
        items={[
          { label: "Needs review", value: viewCounts.review,
            tone: viewCounts.review > 0 ? "warning" : "default",
            onClick: () => setSavedView("review") },
          { label: "Interviewing", value: viewCounts.interviewing,
            onClick: () => setSavedView("interviewing") },
          { label: "Offers out", value: viewCounts.offers,
            onClick: () => setSavedView("offers") },
          { label: "Stale 7d+", value: viewCounts.stale,
            tone: viewCounts.stale > 0 ? "danger" : "success",
            hint: viewCounts.stale > 0 ? "No movement in 7+ days" : "Pipeline moving",
            onClick: () => setSavedView("stale") },
        ]}
      />

      {/* Search on the left; filters live on the right, directly beside the
          Display gear (which also carries the Table/Kanban/List switch). */}
      <WorkspaceToolbar
        variant="canvas"
        search={
          <WorkspaceSearch
            value={search}
            onChange={setSearch}
            placeholder="Search name, email, position, or a skill from their resume"
          />
        }
        trailing={
          <>
            {/* Every filter on this screen, in one control. It was four pills
                plus an "Advanced" toggle opening a fifth row of four more —
                a split that decided for the user which filters mattered, and
                pushed the table down the page whenever the drawer was open. */}
            <FilterMenu activeCount={totalActiveFilters} onClearAll={clearFilters}>
              <Field label="Saved view" htmlFor="filter-view">
                <FormSelect
                  id="filter-view"
                  value={savedView}
                  onChange={(e) => { setSavedView(e.target.value as ViewKey); setSelected([]); }}
                >
                  {views.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}{typeof v.count === "number" ? ` (${v.count})` : ""}
                    </option>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Stage" htmlFor="filter-stage">
                <FormSelect id="filter-stage" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All stages ({inView.length})</option>
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>{sLabel(st)} ({statusCounts[st] || 0})</option>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Position" htmlFor="filter-position">
                <FormSelect id="filter-position" value={posFilter} onChange={(e) => setPosFilter(e.target.value)}>
                  <option value="all">All positions</option>
                  {positions.map((pos) => <option key={pos} value={pos}>{pos}</option>)}
                </FormSelect>
              </Field>

              <Field label="Location" htmlFor="filter-location">
                <FormSelect id="filter-location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                  <option value="all">All locations ({inView.length})</option>
                  {locations.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.count})</option>)}
                </FormSelect>
              </Field>

              <Field label="Source" htmlFor="filter-source">
                <FormSelect id="filter-source" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
                  <option value="all">All sources</option>
                  {SOURCE_OPTIONS.map((src) => <option key={src} value={src}>{src}</option>)}
                </FormSelect>
              </Field>

              <Field label="Type of hire" htmlFor="filter-hire">
                <FormSelect id="filter-hire" value={hireFilter} onChange={(e) => setHireFilter(e.target.value)}>
                  <option value="all">All hire types</option>
                  {hireTypes.map((h) => <option key={h} value={h}>{hireTypeLabel(h)}</option>)}
                </FormSelect>
              </Field>

              <Field label="Work authorization" htmlFor="filter-auth">
                <FormSelect id="filter-auth" value={authFilter} onChange={(e) => setAuthFilter(e.target.value)}>
                  <option value="all">All</option>
                  {WORK_AUTH_GROUPS.map((g) => (
                    <optgroup key={g.label} label={g.label}>
                      {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </optgroup>
                  ))}
                </FormSelect>
              </Field>

              <Field label="Minimum rating">
                <div className="flex h-10 items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Minimum ${n} stars`}
                      onClick={() => setMinRating(n === minRating ? 0 : n)}
                    >
                      <IconStar
                        aria-hidden
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          n <= minRating ? "fill-amber-400 text-amber-400" : "text-[var(--adm-ink-subtle)] hover:text-amber-300",
                        )}
                      />
                    </button>
                  ))}
                </div>
              </Field>
            </FilterMenu>

            <DisplayMenu
              view={view}
              viewOptions={[
                { value: "table",  label: "Table" },
                { value: "kanban", label: "Kanban" },
                { value: "list",   label: "List" },
              ]}
              onViewChange={(v) => setView(v as ViewMode)}
              columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
              hidden={hiddenColumns}
              onHiddenChange={setHiddenColumns}
              rows={rows}
              onRowsChange={setRows}
              onReset={() => { setHiddenColumns(["source"]); setRows(25); setView("table"); }}
            />
          </>
        }
      >
      </WorkspaceToolbar>

      <ActiveFilters variant="canvas" chips={filterChips} onClearAll={clearFilters} />

    <Workspace>
      {/* ── views ── */}
      {isGrid && (
        <DataTable
          noun="applications"
          storageKey="applications"
          columns={columns}
          rows={filtered}
          rowKey={(a) => a.id}
          selected={selected}
          onSelectedChange={setSelected}
          onRowClick={(a) => router.push(`/admin/candidates/${a.id}`)}
          initialSort={{ key: "appliedAt", dir: "desc" }}
          pageSize={rows}
          onPageSizeChange={setRows}
          hiddenColumns={hiddenColumns}
          rowActions={(a) => <RowActionsMenu app={a} {...rowActions} />}
          empty={{
            icon: IconGroup,
            title: applications.length === 0
              ? "No applicants yet"
              : hasActiveFilters ? "No matching records" : `Nothing in ${views.find((v) => v.key === savedView)?.label}`,
            description: applications.length === 0
              ? "Add your first candidate to start tracking the pipeline."
              : hasActiveFilters
              ? "Try adjusting your search or filters."
              : "This view is clear.",
            action: applications.length === 0
              ? <WorkspaceButton variant="primary" onClick={() => openCandidateEditor({ mode: "create" })}><Plus className="h-[15px] w-[15px]" />Add applicant</WorkspaceButton>
              : hasActiveFilters
              ? <WorkspaceButton onClick={clearFilters}><X className="h-[15px] w-[15px]" />Clear filters</WorkspaceButton>
              : undefined,
          }}
        />
      )}

      {view === "kanban" && (
        <div className="min-h-0 flex-1 overflow-auto p-3 lg:p-4">
          <KanbanView apps={filtered} {...rowActions} />
        </div>
      )}

      {view === "list" && (
        <div className="min-h-0 flex-1 overflow-auto">
          <ListView
            apps={filtered}
            empty={applications.length === 0}
            onAdd={() => openCandidateEditor({ mode: "create" })}
            {...rowActions}
          />
        </div>
      )}

      <SelectionBar count={selected.length} onClear={() => setSelected([])}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            >
              Move to stage
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="center" side="top" sideOffset={6}
            className="min-w-[170px] rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
          >
            {ALL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onClick={() => bulkStage(s as Application["status"])}
                className="flex cursor-pointer items-center gap-2 rounded-[5px] px-2 py-1.5 text-[13px]"
              >
                <span className="h-2 w-2 flex-none rounded-full" style={{ background: STAGE_COLOR[s] }} />
                {sLabel(s)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          onClick={() => setBulkDeleteOpen(true)}
          className="inline-flex h-7 items-center gap-1.5 rounded-[6px] px-2.5 text-[13px] font-medium text-rose-300 transition-colors hover:bg-rose-500/15 hover:text-rose-200"
        >
          <IconTrash className="h-3.5 w-3.5" />Delete
        </button>
      </SelectionBar>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete application?"
        body="This action is permanent and cannot be undone."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={deleteOne}
        onCancel={() => setDeleteId(null)}
      />
      <ConfirmDialog
        open={bulkDeleteOpen}
        title={`Delete ${selected.length} application${selected.length > 1 ? "s" : ""}?`}
        body="This is permanent and cannot be undone."
        confirmLabel="Delete All"
        busy={deleting}
        onConfirm={deleteBulk}
        onCancel={() => setBulkDeleteOpen(false)}
      />
    </Workspace>
    </div>
  );
}

// ── shared row actions ───────────────────────────────────────────────────────

interface RowActions {
  onView: (id: string) => void;
  onEdit: (app: App) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
  onRating: (id: string, r: number) => void;
}
interface SharedProps extends RowActions {
  apps: App[];
}

function RowActionsMenu({ app, onView, onEdit, onDelete, onStatusChange }: {
  app: App;
  onView: (id: string) => void;
  onEdit: (app: App) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          title="Actions"
          aria-label={`Actions for ${app.name || app.email}`}
          className="grid h-9 w-9 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink-mute)]"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end" sideOffset={4}
        className="w-44 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
      >
        <DropdownMenuItem onClick={() => onView(app.id)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px]">
          <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(app)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px]">
          <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <p className="px-1 pb-1 text-[11.5px] font-semibold text-[var(--adm-ink-subtle)]">Move to</p>
          {KANBAN_COLS.filter((c) => c !== app.status).map((c) => (
            <button
              key={c}
              onClick={() => onStatusChange(app.id, c as Application["status"])}
              className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
            >
              <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", tones[sTone(c)].dot)} />{sLabel(c)}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onDelete(app.id)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px] text-[var(--adm-danger)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger)]">
          <IconTrash className="mr-2 h-4 w-4" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── kanban ───────────────────────────────────────────────────────────────────

function KanbanView({ apps, ...shared }: SharedProps) {
  const [dragId, setDragId]     = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const grouped = useMemo(
    () => Object.fromEntries(KANBAN_COLS.map((k) => [k, apps.filter((a) => a.status === k)])),
    [apps],
  );

  const handleDrop = (col: string) => {
    if (dragId && dragId !== col) {
      const app = apps.find((a) => a.id === dragId);
      if (app && app.status !== col) shared.onStatusChange(dragId, col as Application["status"]);
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="flex min-w-max gap-3">
      {KANBAN_COLS.map((col) => {
        const list = grouped[col] || [];
        const isOver = dragOver === col;
        const color = STAGE_COLOR[col];
        return (
          <div
            key={col}
            className="flex w-64 flex-col"
            onDragOver={(e) => { e.preventDefault(); setDragOver(col); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
            onDrop={() => handleDrop(col)}
          >
            <div className={cn(
              "rounded-t-[8px] border border-b-0 border-[var(--adm-line)] bg-[var(--adm-surface)] transition-colors",
              isOver && "border-[var(--adm-accent)]",
            )}>
              <span className="block h-[3px] rounded-t-[7px]" style={{ background: color }} />
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-[13px] font-semibold text-[var(--adm-ink-mute)]">{sLabel(col)}</span>
                <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 text-[11.5px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
                  {list.length}
                </span>
              </div>
            </div>

            <div className={cn(
              "min-h-[120px] flex-1 space-y-2 rounded-b-[8px] border border-t-0 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-2 transition-colors",
              isOver && "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]",
            )}>
              {list.length === 0 ? (
                <div className={cn(
                  "rounded-[6px] border border-dashed py-8 text-center transition-colors",
                  isOver ? "border-[var(--adm-accent)]" : "border-transparent",
                )}>
                  <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">{isOver ? "Drop here" : "Empty"}</p>
                </div>
              ) : list.map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  isDragging={dragId === app.id}
                  onDragStart={() => setDragId(app.id)}
                  onDragEnd={() => { setDragId(null); setDragOver(null); }}
                  {...shared}
                />
              ))}
              {list.length > 0 && isOver && (
                <div className="flex h-14 items-center justify-center rounded-[6px] border border-dashed border-[var(--adm-accent)]">
                  <p className="text-[12.5px] font-semibold text-[var(--adm-accent)]">Drop here</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({ app, onView, onEdit, onDelete, onStatusChange, onRating, isDragging, onDragStart, onDragEnd }: RowActions & {
  app: App;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const skills = (app.skills || []).slice(0, 3);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab select-none rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-2.5 shadow-[var(--adm-shadow-sm)] transition-colors hover:border-[var(--adm-accent)] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="mb-2 flex items-start gap-2">
        <Avatar name={app.name} email={app.email} size="sm" />
        <div className="min-w-0 flex-1">
          <button onClick={() => onView(app.id)} className="block w-full truncate text-left text-[13px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]">
            {app.name || app.email}
          </button>
          {app.jobTitle && <p className="mt-0.5 truncate text-[12px] text-[var(--adm-ink-subtle)]">{app.jobTitle}</p>}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button aria-label="Application actions" className="rounded-[5px] p-1 text-[var(--adm-ink-subtle)] opacity-0 transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)] group-hover:opacity-100">
              <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end" sideOffset={4}
            className="w-44 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
          >
            <DropdownMenuItem onClick={() => onView(app.id)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px]">
              <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(app)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px]">
              <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-1 py-1">
              <p className="px-1 pb-1 text-[11.5px] font-semibold text-[var(--adm-ink-subtle)]">Move to</p>
              {KANBAN_COLS.filter((c) => c !== app.status).map((c) => (
                <button
                  key={c}
                  onClick={() => onStatusChange(app.id, c as Application["status"])}
                  className="flex w-full items-center gap-2 rounded-[5px] px-2 py-1.5 text-left text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
                >
                  <span className={cn("h-1.5 w-1.5 flex-shrink-0 rounded-full", tones[sTone(c)].dot)} />{sLabel(c)}
                </button>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(app.id)} className="cursor-pointer rounded-[5px] px-2 py-1.5 text-[13px] text-[var(--adm-danger)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger)]">
              <IconTrash className="mr-2 h-4 w-4" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {skills.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {skills.map((s) => (
            <span key={s} className="rounded-[4px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--adm-accent)]">{s}</span>
          ))}
          {(app.skills || []).length > 3 && (
            <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--adm-ink-subtle)]">
              +{(app.skills || []).length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[var(--adm-line-soft)] pt-2">
        <StarRating rating={app.rating || 0} onRate={(r) => onRating(app.id, r === app.rating ? 0 : r)} />
        <span className="text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
}

// ── list ─────────────────────────────────────────────────────────────────────

function ListView({ apps, empty, onAdd, ...shared }: SharedProps & { empty: boolean; onAdd: () => void }) {
  if (apps.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[8px] bg-[var(--adm-surface-2)]">
          <IconGroup className="h-6 w-6 text-[var(--adm-ink-subtle)]" />
        </div>
        <h3 className="mb-1 text-[15px] font-semibold text-[var(--adm-ink)]">
          {empty ? "No applicants yet" : "No results"}
        </h3>
        <p className="mb-5 text-[13px] text-[var(--adm-ink-subtle)]">
          {empty ? "Add your first candidate to start tracking the pipeline." : "Try adjusting your search or filters."}
        </p>
        {empty && (
          <WorkspaceButton variant="primary" onClick={onAdd} className="mx-auto">
            <Plus className="h-[15px] w-[15px]" />Add applicant
          </WorkspaceButton>
        )}
      </div>
    );
  }

  return (
    <div className="divide-y divide-[var(--adm-line-soft)]">
      {apps.map((app) => {
        const skills = (app.skills || []).slice(0, 4);
        return (
          <div key={app.id} className="group flex items-center gap-4 px-4 py-3 transition-colors hover:bg-[var(--adm-row-hover)] lg:px-5">
            <Avatar name={app.name} email={app.email} size="md" />

            <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-3">
              <div className="min-w-0">
                <button onClick={() => shared.onView(app.id)} className="block truncate text-left text-[14px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]">
                  {app.name || app.email}
                </button>
                <p className="truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{app.email}</p>
                {skills.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {skills.map((s) => (
                      <span key={s} className="rounded-[4px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--adm-accent)]">{s}</span>
                    ))}
                    {(app.skills || []).length > 4 && (
                      <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--adm-ink-subtle)]">
                        +{(app.skills || []).length - 4}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[13.5px] text-[var(--adm-ink-mute)]">
                  {app.jobTitle || <span className="text-[var(--adm-ink-subtle)]">No position</span>}
                </p>
                {locationOf(app) && <p className="mt-0.5 text-[12.5px] text-[var(--adm-ink-subtle)]">{locationOf(app)}</p>}
                {app.source && <p className="mt-0.5 text-[12.5px] text-[var(--adm-ink-subtle)]">{app.source}</p>}
                <p className="mt-0.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
                  {[app.workAuthorization, app.hireType].filter(Boolean).join(" · ")}
                </p>
              </div>

              <div className="flex gap-2 sm:flex-col sm:items-end">
                <StatusBadge status={app.status} />
                <StarRating rating={app.rating || 0} onRate={(r) => shared.onRating(app.id, r === app.rating ? 0 : r)} />
                <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(app.appliedAt)}</span>
                {app.addToTalentBench && (
                  <span className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--adm-success)]">
                    <IconBookmarkCheck className="h-3 w-3" />Bench
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100">
              <RowActionsMenu app={app} onView={shared.onView} onEdit={shared.onEdit} onDelete={shared.onDelete} onStatusChange={shared.onStatusChange} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
