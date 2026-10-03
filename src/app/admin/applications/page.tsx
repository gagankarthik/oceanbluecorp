"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import {
  IconDownload, IconStar, IconTrash, IconGroup, IconClock,
} from "@/components/admin/icons";
import type { Application, Job } from "@/lib/aws/dynamodb";
import { useAuth } from "@/lib/auth/AuthContext";
import ApplicationsLoading from "./loading";
import { useAdmin } from "@/components/admin/admin-provider";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import {
  Workspace, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch,
  FilterMenu, ActiveFilters,
  DisplayMenu, SelectionBar, BrandBand, BAND_PRIMARY,
} from "@/components/admin/workspace";
import { Field, FormSelect } from "@/components/admin/forms/primitives";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  SOURCE_OPTIONS, WORK_AUTH_GROUPS, HIRE_TYPE_OPTIONS, hireTypeLabel, stateOf, STATE_NAME,
} from "@/components/admin/theme";
import { Empty as Blank } from "@/components/admin/list-panel";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { fmtDate } from "@/lib/format";
import { daysInStage, isStale, TERMINAL, STALE_DAYS } from "@/lib/pipeline";
import { haystackOf, matchesTerms, searchTerms } from "@/lib/candidate-search";
import { downloadCsv } from "@/lib/csv";
import {
  KANBAN_COLS, stageColor, sLabel, locationOf, type ApplicationRow as App,
} from "@/components/admin/applications/stages";
import { KanbanView, ListView, RowActionsMenu } from "@/components/admin/applications/pipeline-views";
import { SavedViewsMenu, type SavedSearch } from "@/components/admin/applications/saved-views";


type ViewMode = "table" | "kanban" | "list";
const VIEW_MODES: ViewMode[] = ["table", "kanban", "list"];

/** What a saved search restores. */
interface ListState {
  savedView: ViewKey;
  view: ViewMode;
  search: string;
  status: string;
  position: string;
  location: string;
  source: string;
  auth: string;
  hire: string;
  minRating: number;
}

const ALL_STATUSES = [...KANBAN_COLS] as string[];



// ── location ─────────────────────────────────────────────────────────────────


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
        style={{ background: stageColor(app.status) }}
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
        stale ? "font-semibold text-[var(--adm-warning-ink)]" : "text-[var(--adm-ink-subtle)]",
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

  // Workspace preferences persist, a density or column choice that resets on
  // every navigation is not a preference, it is a toy.
  const [rows, setRows] = useLocalStorage<number>("adm.applications.rows", 25);
  // Source starts hidden, it only matters in aggregate, which the dashboard's
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

  const hasData = useRef(false);
  const load = useCallback(async () => {
    try {
      // Skeleton on first load only; a reload after a save keeps the grid on screen.
      if (!hasData.current) setLoading(true);
      setError(null);
      const [ar, jr] = await Promise.all([fetch("/api/applications?fields=summary"), fetch("/api/jobs?fields=summary")]);
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
      hasData.current = true;
    } catch (e) {
      console.error("Failed to load applications:", e);
      if (hasData.current) toast.error("Couldn't refresh applications. Showing the last loaded list.");
      else setError("Check your connection and try again.");
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
    { key: "review",       label: "Awaiting review", count: viewCounts.review },
    { key: "interviewing", label: "Interviewing",   count: viewCounts.interviewing },
    { key: "offers",       label: "Offers extended", count: viewCounts.offers },
    { key: "stale",        label: "Stalled 7+ days", count: viewCounts.stale },
    { key: "hired",        label: "Hired",          count: viewCounts.hired },
  ];

  /* The badge on the single Filters control. Counts every dimension it owns, the old split counted only the four that lived behind the drawer, because
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

  /** Stage counts inside the current view: the strip and the stage filter agree with the tab. */
  const statusCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const a of inView) c[a.status] = (c[a.status] || 0) + 1;
    return c;
  }, [inView]);

  /**
   * Searchable text per record, built once per loaded list rather than on every
   * keystroke, walking a few hundred parsed resumes on each character typed is
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
    // Matches identity fields AND the parsed resume, skills, employers, role
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
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
    } catch { toast.error("The stage could not be changed. Nothing was saved."); load(); }
  };

  const patchRating = async (id: string, rating: number) => {
    setApplications((p) => p.map((a) => (a.id === id ? { ...a, rating } : a)));
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating }),
      });
      if (!res.ok) throw new Error();
    } catch { toast.error("The rating could not be saved."); load(); }
  };

  const deleteOne = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/applications/${deleteId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setApplications((p) => p.filter((a) => a.id !== deleteId));
      toast.success("Application deleted");
    } catch { toast.error("The application could not be deleted."); }
    finally { setDeleting(false); setDeleteId(null); }
  };

  const deleteBulk = async () => {
    setDeleting(true);
    try {
      const results = await Promise.all(
        selected.map((id) =>
          fetch(`/api/applications/${id}`, { method: "DELETE" }).then((r) => (r.ok ? id : null), () => null),
        ),
      );
      const gone = results.filter((id): id is string => id !== null);
      const failed = selected.length - gone.length;
      setApplications((p) => p.filter((a) => !gone.includes(a.id)));
      setSelected((p) => p.filter((id) => !gone.includes(id)));
      if (gone.length) toast.success(`${gone.length} application${gone.length > 1 ? "s" : ""} deleted`);
      if (failed) toast.error(`${failed} could not be deleted and ${failed > 1 ? "are" : "is"} still selected.`);
    } catch { toast.error("The applications could not be deleted."); }
    finally { setDeleting(false); setBulkDeleteOpen(false); }
  };

  /** Bulk stage move, the action a multi-select is actually for. */
  const bulkStage = async (status: Application["status"]) => {
    const ids = [...selected];
    setApplications((p) => p.map((a) => (ids.includes(a.id) ? { ...a, status } : a)));
    setSelected([]);
    try {
      await Promise.all(ids.map((id) => fetch(`/api/applications/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
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

  const [savedSearches, setSavedSearches] = useLocalStorage<SavedSearch<ListState>[]>("adm.applications.savedSearches", []);
  const savedList = Array.isArray(savedSearches) ? savedSearches : [];

  const listState: ListState = {
    savedView, view, search,
    status: statusFilter, position: posFilter, location: locationFilter,
    source: sourceFilter, auth: authFilter, hire: hireFilter, minRating,
  };
  const listStateKey = JSON.stringify(listState);
  const activeSavedId = savedList.find((s) => JSON.stringify({ ...listState, ...s.state }) === listStateKey)?.id ?? null;

  const applySaved = ({ state: st }: SavedSearch<ListState>) => {
    const str = (v: unknown) => (typeof v === "string" ? v : "all");
    setSavedView(st.savedView in VIEW_PREDICATE ? st.savedView : "all");
    setView(VIEW_MODES.includes(st.view) ? st.view : "table");
    setSearch(typeof st.search === "string" ? st.search : "");
    setStatusFilter(str(st.status)); setPosFilter(str(st.position)); setLocationFilter(str(st.location));
    setSourceFilter(str(st.source)); setAuthFilter(str(st.auth)); setHireFilter(str(st.hire));
    setMinRating(typeof st.minRating === "number" ? st.minRating : 0);
    setSelected([]);
  };

  const saveCurrent = (name: string) => {
    setSavedSearches((prev) => [
      ...(Array.isArray(prev) ? prev.filter((s) => s.name !== name) : []),
      { id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, state: listState, createdAt: new Date().toISOString() },
    ]);
    toast.success(`Saved view "${name}"`);
  };

  const deleteSaved = (id: string) =>
    setSavedSearches((prev) => (Array.isArray(prev) ? prev.filter((s) => s.id !== id) : []));

  const clearFilters = () => {
    setSearch(""); setStatusFilter("all"); setPosFilter("all"); setLocationFilter("all");
    setSourceFilter("all"); setAuthFilter("all"); setHireFilter("all"); setMinRating(0);
  };

  const locationLabel = (v: string) =>
    v === "__none" ? "No location" : STATE_NAME.get(v) || v;

  const filterChips: { label: string; onClear: () => void }[] = [
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
          <span className="truncate text-[14px] font-semibold text-[var(--adm-ink)]">
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
          <span className="inline-flex items-center rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[12.5px] font-medium text-[var(--adm-ink-mute)]">
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
      <EmptyState
        variant="error"
        title="Couldn't load applications"
        description={error}
        action={<WorkspaceButton onClick={load}>Try again</WorkspaceButton>}
      />
    </div>
  );

  const isGrid = view === "table";

  return (
    // Full-height column so the table scrolls inside the panel, not the page.
    // `min-h-0` is load-bearing: without it the column grows to the table's height.
    <div className="flex h-full min-h-0 flex-col">
      {/* The saved views are the band's figures: pick one to scope the grid. */}
      <BrandBand
        size="sm"
        className="mb-3"
        title="Applications"
        meta={`${applications.length.toLocaleString()} applicant${applications.length === 1 ? "" : "s"} across ${positions.length} position${positions.length === 1 ? "" : "s"}`}
        stats={views.map((v) => ({
          label: v.label,
          value: v.count,
          selected: v.key === savedView,
          onClick: () => { setSavedView(v.key); setSelected([]); },
        }))}
        actions={
          <>
            <WorkspaceButton onClick={exportCSV}>
              <IconDownload /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton className={BAND_PRIMARY} onClick={() => openCandidateEditor({ mode: "create" })}>
              <Plus />Add applicant
            </WorkspaceButton>
          </>
        }
      />

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
            <SavedViewsMenu
              items={savedList}
              activeId={activeSavedId}
              onApply={applySaved}
              onSave={saveCurrent}
              onDelete={deleteSaved}
            />

            <FilterMenu activeCount={totalActiveFilters} onClearAll={clearFilters}>
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
                <div className="flex h-10 items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`Minimum ${n} stars`}
                      aria-pressed={n <= minRating}
                      onClick={() => setMinRating(n === minRating ? 0 : n)}
                      className="group/star rounded-[6px] p-1 transition-colors hover:bg-[var(--adm-surface-2)]"
                    >
                      <IconStar
                        aria-hidden
                        className={cn(
                          "h-[18px] w-[18px] transition-colors",
                          n <= minRating
                            ? "fill-[var(--adm-warning)] text-[var(--adm-warning)]"
                            : "text-[var(--adm-ink-subtle)] group-hover/star:text-[var(--adm-warning)]",
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
      />

      <ActiveFilters variant="canvas" chips={filterChips} onClearAll={clearFilters} />

      <Workspace>
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
                : hasActiveFilters ? "No matching applicants" : `Nothing in ${views.find((v) => v.key === savedView)?.label}`,
              description: applications.length === 0
                ? "Add your first candidate to start tracking the pipeline."
                : hasActiveFilters
                ? "Try a different search, or clear the filters."
                : "This view is clear.",
              action: applications.length === 0
                ? <WorkspaceButton variant="primary" onClick={() => openCandidateEditor({ mode: "create" })}><Plus />Add applicant</WorkspaceButton>
                : hasActiveFilters
                ? <WorkspaceButton onClick={clearFilters}><X />Clear filters</WorkspaceButton>
                : undefined,
            }}
          />
        )}

        {view === "kanban" && (
          <div className="min-h-0 flex-1 overflow-auto bg-[var(--adm-surface-sunken)] p-3 lg:p-4">
            <KanbanView apps={filtered} {...rowActions} />
          </div>
        )}

        {view === "list" && (
          <div className="min-h-0 flex-1 overflow-auto">
            <ListView
              apps={filtered}
              empty={applications.length === 0}
              onAdd={() => openCandidateEditor({ mode: "create" })}
              onClear={clearFilters}
              {...rowActions}
            />
          </div>
        )}

        <SelectionBar count={selected.length} onClear={() => setSelected([])}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white data-[state=open]:bg-white/10"
              >
                Move to stage
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center" side="top" sideOffset={8}
              className="min-w-[180px] rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]"
            >
              {ALL_STATUSES.map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => bulkStage(s as Application["status"])}
                  className="flex cursor-pointer items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px]"
                >
                  <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: stageColor(s) }} />
                  {sLabel(s)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            onClick={() => setBulkDeleteOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-white/85 transition-colors hover:bg-[var(--adm-danger)] hover:text-white"
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
          confirmLabel="Delete all"
          busy={deleting}
          onConfirm={deleteBulk}
          onCancel={() => setBulkDeleteOpen(false)}
        />
      </Workspace>
    </div>
  );
}
