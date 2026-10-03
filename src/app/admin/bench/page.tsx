"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LayoutGrid, LayoutList, Plus, X } from "lucide-react";
import type { Application, BenchType, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import BenchLoading from "./loading";

import { Field, FormSelect } from "@/components/admin/forms/primitives";
import {
  Workspace, BrandBand, BAND_PRIMARY, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterMenu, ActiveFilters, DisplayMenu,
  GridSelect,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminCard } from "@/components/admin/admin-card";
import { ViewMenu } from "@/components/admin/toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { StarRating } from "@/components/admin/star-rating";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Empty as BlankCell } from "@/components/admin/list-panel";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  statusMeta, statusColor, stateOf, STATE_NAME, HIRE_TYPE_OPTIONS, hireTypeLabel,
} from "@/components/admin/theme";
import { POOL_META, POOL_ORDER, poolOf, canView } from "@/lib/bench";
import {
  IconBoxes, IconDownload, IconEdit, IconEye,
  IconFile, IconMail, IconPhone, IconShield, IconSource, IconTrash,
} from "@/components/admin/icons";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

// ── types ────────────────────────────────────────────────────────────────────

interface ApplicationWithJob extends Application {
  jobDepartment?: string;
  postedByName?: string;
  resumeFileName?: string;
  resumeFileKey?: string;
}

interface CognitoUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

type ViewMode = "table" | "cards";

// ── config ───────────────────────────────────────────────────────────────────

/** One stage list feeds the filter, the row select and the form. */
const BENCH_STATUSES = [
  "active", "pending", "reviewing", "submitted", "interview", "hired", "inactive",
] as const;

const STATUS_TABS = [
  { key: "all", label: "All" },
  ...BENCH_STATUSES.map((s) => ({ key: s as string, label: statusMeta[s].label })),
];

/**
 * The bench splits into two pools, defined once in lib/bench:
 *
 *   Talent Bench (internal)  our own consultants, the whole team sees them
 *   My Pool      (external)  candidates you sourced, private to you
 *
 * The tabs sit above the KPI strip because every number below them is scoped
 * to the selected pool. The strip itself lives in components/admin/
 * candidate-tabs.tsx, because Lead Sourcing renders the same row.
 */
type PoolKey = "all" | BenchType;

/**
 * The location filter keys on STATE, not on the city string.
 *
 * A bench is searched by market, not by spelling: "Austin", "austin" and
 * "Austin Metro" are one answer to "who can work in Texas?", and a city-keyed
 * menu would list all three as separate options while a consultant in Round
 * Rock matched none of them. Cities stay searchable through the search box.
 */
function locationLabelOf(value: string): string {
  return value === "__none" ? "No location" : STATE_NAME.get(value) || value;
}

const skillChip =
  "inline-flex h-[22px] items-center gap-1 rounded-[6px] bg-[var(--adm-accent-soft)] px-1.5 text-[12px] font-medium text-[var(--adm-accent)]";

const countChip =
  "inline-flex h-[22px] flex-none items-center rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 text-[12px] font-medium tabular-nums text-[var(--adm-ink-mute)]";

/** How long a record has been sitting on the bench, in whole days. */
function daysOnBench(app: Application): number | null {
  const d = new Date(app.createdAt || app.appliedAt);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/**
 * Pool tag shown in the grid, on cards and in detail.
 *
 * It names the POOL, not the raw internal/external value: "Talent Bench" and
 * "My Pool" are what the tabs above the grid call the same two sets, and a
 * badge that used different words for them made a row look like it belonged
 * somewhere other than the tab it was sitting under.
 */
function PoolBadge({ pool }: { pool: BenchType }) {
  const shared = pool === "internal";
  return (
    <span
      title={POOL_META[pool].hint}
      className={cn(
        "inline-flex h-[22px] items-center whitespace-nowrap rounded-[6px] px-1.5 text-[12px] font-medium",
        shared
          ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
          : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
      )}
    >
      {POOL_META[pool].label}
    </span>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TalentBenchPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(UserRole.ADMIN);

  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  // Jobs are fetched only to resolve each bench record's job title/department.
  const [, setJobs] = useState<Job[]>([]);
  const [allUsers, setAllUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [hireFilter, setHireFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [poolFilter, setPoolFilter] = useState<PoolKey>("all");

  // Lead Sourcing links back here with the pool it was opened from, so the
  // tab you left is the tab you return to. Same deep-link pattern the other
  // list pages use for ?search=.
  useEffect(() => {
    const pool = new URLSearchParams(window.location.search).get("pool");
    if (pool === "all" || pool === "internal" || pool === "external") setPoolFilter(pool);
  }, []);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const router = useRouter();

  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  // ── data ──────────────────────────────────────────────────────────────────

  const hasData = useRef(false);
  const fetchData = useCallback(async () => {
    try {
      // Skeleton on first load only; a reload after a save keeps the grid on screen.
      if (!hasData.current) setLoading(true);
      setError(null);
      const [appsResponse, jobsResponse] = await Promise.all([
        fetch("/api/applications?bench=1&fields=summary"),
        fetch("/api/jobs?fields=summary"),
      ]);

      const appsData = await appsResponse.json();
      const jobsData = await jobsResponse.json();

      if (!appsResponse.ok || !jobsResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      setJobs(jobsData.jobs || []);

      const jobsMap = new Map<string, Job>(
        (jobsData.jobs || []).map((job: Job) => [job.id, job])
      );

      const benchApps = (appsData.applications || [])
        .map((app: Application) => {
          const job = app.jobId ? jobsMap.get(app.jobId) : null;
          return {
            ...app,
            jobTitle: app.jobTitle || job?.title || "",
            jobDepartment: job?.department || "",
            postedByName: job?.postedByName || app.ownershipName,
          };
        });

      benchApps.sort((a: ApplicationWithJob, b: ApplicationWithJob) =>
        new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime()
      );

      setApplications(benchApps);
      hasData.current = true;
    } catch (err) {
      console.error("Failed to load the talent bench:", err);
      if (!hasData.current) setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      if (response.ok) {
        const users = data.users || [];
        setAllUsers(users);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  }, []);

  useEffect(() => {
    void fetchData();
    void fetchUsers();
  }, [fetchData, fetchUsers]);

  // ── derived ───────────────────────────────────────────────────────────────

  const allSkills = useMemo(
    () => [...new Set(applications.flatMap((a) => a.skills || []))].sort(),
    [applications],
  );
  const workAuthorizations = useMemo(
    () => [...new Set(applications.map((a) => a.workAuthorization).filter(Boolean))] as string[],
    [applications],
  );
  /** Hire types actually present, listed in the canonical picker order. */
  const hireTypes = useMemo(() => {
    const present = new Set(applications.map((a) => a.hireType).filter(Boolean) as string[]);
    return [
      ...HIRE_TYPE_OPTIONS.filter((o) => present.has(o.value)).map((o) => o.value),
      ...[...present].filter((v) => !HIRE_TYPE_OPTIONS.some((o) => o.value === v)),
    ];
  }, [applications]);

  // Resolve who added a bench entry (benchAddedBy/createdBy holds an email or id).
  const addedByIndex = useMemo(() => {
    const index = new Map<string, CognitoUser>();
    for (const u of allUsers) {
      if (u.email) index.set(u.email.toLowerCase(), u);
      if (u.id) index.set(u.id, u);
    }
    return index;
  }, [allUsers]);

  const resolveAdder = useCallback((app: ApplicationWithJob): { name: string; role?: string } => {
    const key = (app.benchAddedBy || app.createdBy || "").toString();
    const u = addedByIndex.get(key.toLowerCase()) || addedByIndex.get(key);
    const name = u?.name || app.createdByName || (key.includes("@") ? key.split("@")[0] : "") || "Unknown";
    return { name, role: u?.role };
  }, [addedByIndex]);

  // Admins see the whole team's bench; everyone sees the whole internal bench.
  // Either way there is more than one adder to slice by.
  const canFilterByAdder = isAdmin || poolFilter === "internal";
  const activeOwner = canFilterByAdder ? ownerFilter : "all";

  const adderNames = useMemo(
    () => (canFilterByAdder
      ? [...new Set(applications
          .filter((a) => isAdmin || poolOf(a) === "internal")
          .map((a) => resolveAdder(a).name)
          .filter(Boolean))].sort()
      : []),
    [canFilterByAdder, isAdmin, applications, resolveAdder],
  );

  /**
   * The bench this viewer is allowed to see.
   *
   * Visibility follows the pool, not the person: Talent Bench (internal) holds
   * our own consultants and is company property, so every staff member sees
   * the whole list. My Pool (external) is the pipeline a recruiter built
   * themselves and stays private to them, admins excepted, since auditing the
   * team's pipeline is their job.
   *
   * This replaces a blanket "non-admins only ever see their own records" rule,
   * which hid the shared bench from the people expected to staff from it.
   */
  const scopedApplications = useMemo(() => applications.filter((app) => {
    const viewer = { id: user?.id, email: user?.email, isAdmin };
    const matchesOwner = !isAdmin || activeOwner === "all" || resolveAdder(app).name === activeOwner;
    return canView(app, viewer) && matchesOwner;
  }), [applications, isAdmin, user?.email, user?.id, activeOwner, resolveAdder]);

  /** Tab counts come from the scoped set, so they don't move as filters change. */
  const poolCounts = useMemo(() => ({
    all: scopedApplications.length,
    internal: scopedApplications.filter((a) => poolOf(a) === "internal").length,
    external: scopedApplications.filter((a) => poolOf(a) === "external").length,
  }), [scopedApplications]);

  /**
   * The selected pool. The KPI strip, status counts and the grid are all built
   * from this list, switching tabs re-scopes the whole page, not just the rows.
   */
  const pooledApplications = useMemo(() => {
    const pooled = poolFilter === "all"
      ? scopedApplications
      : scopedApplications.filter((a) => poolOf(a) === poolFilter);
    // Admins already filtered by adder in the scoped set.
    return isAdmin || activeOwner === "all"
      ? pooled
      : pooled.filter((a) => resolveAdder(a).name === activeOwner);
  }, [scopedApplications, poolFilter, isAdmin, activeOwner, resolveAdder]);

  /**
   * Locations present in the visible bench, with a count each. Built from the
   * selected pool so the menu never offers a state the current tab has nobody
   * in, and never lists all 50 when the bench holds three.
   */
  const locations = useMemo(() => {
    const counts = new Map<string, number>();
    let unknown = 0;
    for (const a of pooledApplications) {
      const code = stateOf(a.state);
      if (!code) { unknown += 1; continue; }
      counts.set(code, (counts.get(code) || 0) + 1);
    }
    const named = [...counts.entries()]
      .map(([code, count]) => ({ value: code, label: STATE_NAME.get(code) || code, count }))
      .sort((x, y) => x.label.localeCompare(y.label));
    return unknown > 0
      ? [...named, { value: "__none", label: "No location recorded", count: unknown }]
      : named;
  }, [pooledApplications]);

  const filteredApplications = useMemo(() => pooledApplications.filter((app) => {
    const q = debouncedSearch.toLowerCase();
    // City is searchable even though the location filter works at state level,
    // so "austin" still finds someone.
    const matchesSearch = !q
      || [app.name, app.email, app.applicationId, app.jobTitle, app.city].some((f) => f?.toLowerCase().includes(q))
      || (app.skills?.some((s) => s.toLowerCase().includes(q)) ?? false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSkill = skillFilter === "all" || (app.skills?.includes(skillFilter) || false);
    const matchesAuth = authFilter === "all" || app.workAuthorization === authFilter;
    const matchesHire = hireFilter === "all" || app.hireType === hireFilter;
    const code = stateOf(app.state);
    const matchesLocation = locationFilter === "all"
      || (locationFilter === "__none" ? !code : code === locationFilter);
    return matchesSearch && matchesStatus && matchesSkill && matchesAuth && matchesHire && matchesLocation;
  }), [pooledApplications, debouncedSearch, statusFilter, skillFilter, authFilter, hireFilter, locationFilter]);

  const statusCounts = useMemo(
    () => Object.fromEntries(
      STATUS_TABS.map((t) => [
        t.key,
        t.key === "all" ? pooledApplications.length : pooledApplications.filter((a) => a.status === t.key).length,
      ]),
    ) as Record<string, number>,
    [pooledApplications],
  );

  const kpis = useMemo(() => {
    return {
      total: pooledApplications.length,
      available: pooledApplications.filter((a) => a.status === "active" || a.status === "pending").length,
      inProcess: pooledApplications.filter((a) => ["reviewing", "submitted", "interview"].includes(a.status)).length,
      placed: pooledApplications.filter((a) => a.status === "hired").length,
    };
  }, [pooledApplications]);

  const [rows, setRows] = useLocalStorage<number>("adm.bench.rows", 25);
  const [hiddenColumns, setHiddenColumns] = useLocalStorage<string[]>("adm.bench.hiddenCols", []);

  /** On the bench a month or more without moving, the re-engagement list. */
  const staleBench = useMemo(
    () => pooledApplications.filter(
      (a) => (Date.now() - new Date(a.appliedAt).getTime()) / 86_400_000 >= 30,
    ).length,
    [pooledApplications],
  );

  const activeFilterCount = [statusFilter, skillFilter, authFilter, hireFilter, locationFilter, activeOwner]
    .filter((f) => f !== "all").length;
  const hasActiveFilters = [statusFilter, skillFilter, authFilter, hireFilter, locationFilter, activeOwner].some((f) => f !== "all")
    || debouncedSearch.trim() !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSkillFilter("all");
    setAuthFilter("all");
    setHireFilter("all");
    setLocationFilter("all");
    setOwnerFilter("all");
  };

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update status");
      await fetchData();
    } catch {
      toast.error("Failed to update application status");
    }
  };

  const handleRatingChange = async (appId: string, rating: number) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      if (!response.ok) throw new Error("Failed to update rating");

      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, rating } : app))
      );
    } catch {
      toast.error("Failed to update rating");
    }
  };

  const performRemoveFromBench = async () => {
    if (!pendingRemove) return;
    setRemoving(true);
    try {
      const response = await fetch(`/api/applications/${pendingRemove.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addToTalentBench: false }),
      });
      if (!response.ok) throw new Error("Failed to update");
      setApplications((prev) => prev.filter((app) => app.id !== pendingRemove.id));
      toast.success("Removed from talent bench");
      setPendingRemove(null);
    } catch {
      toast.error("Failed to remove from talent bench");
    } finally {
      setRemoving(false);
    }
  };

  const handleExportCSV = () => downloadCsv(
    "bench",
    [
      "App ID", "Name", "Email", "Phone", "Last Position", "Status", "Pool",
      "Hire Type", "Work Authorization", "Skills", "Rating", "City", "State",
      "Has Resume", "Notes",
    ],
    filteredApplications.map((app) => [
      app.applicationId || app.id.slice(0, 8),
      app.name || "Unknown",
      app.email,
      app.phone || "",
      app.jobTitle || "",
      app.status,
      POOL_META[poolOf(app)].label,
      hireTypeLabel(app.hireType),
      app.workAuthorization || "",
      app.skills?.join(", ") || "",
      app.rating?.toString() || "",
      app.city || "",
      stateOf(app.state),
      app.resumeId ? "Yes" : "No",
      app.notes || "",
    ]),
  );

  // ── navigation ────────────────────────────────────────────────────────────

  const handleCreateNew = () => router.push("/admin/applications/new?bench=1");

  const handleEditApplication = (app: ApplicationWithJob) =>
    router.push(`/admin/applications/${app.id}/edit?return=/admin/bench`);

  /** Opens the shared candidate record, the same one Applications uses. */
  const handleViewApplication = (app: ApplicationWithJob) => {
    router.push(`/admin/candidates/${app.id}`);
  };

  const handleDownloadResume = async (resumeId: string) => {
    try {
      const response = await fetch(`/api/resume/${resumeId}`);
      if (!response.ok) throw new Error("Failed to get resume");

      const data = await response.json();
      window.open(data.downloadUrl, "_blank");
    } catch {
      toast.error("Failed to download resume");
    }
  };

  // ── grid columns ──────────────────────────────────────────────────────────

  const candidateCol: DataTableColumn<ApplicationWithJob> = {
    key: "candidate",
    header: "Candidate",
    sortValue: (a) => a.name || a.email,
    cell: (a) => (
      <span className="inline-flex max-w-full items-center gap-2.5 align-middle">
        <Avatar name={a.name} email={a.email} size="sm" />
        <span className="min-w-0 truncate font-semibold text-[var(--adm-ink)]">{a.name || "Unknown"}</span>
      </span>
    ),
  };

  const addedByCol: DataTableColumn<ApplicationWithJob> = {
    key: "addedBy",
    header: "Added by",
    hideBelow: "xl",
    sortValue: (a) => resolveAdder(a).name,
    cell: (a) => {
      const adder = resolveAdder(a);
      return (
        <span className="inline-flex max-w-full items-center gap-2 align-middle">
          <Avatar name={adder.name} size="xs" />
          <span className="min-w-0 truncate text-[13px] text-[var(--adm-ink-mute)]">{adder.name}</span>
        </span>
      );
    },
  };

  const emailCol: DataTableColumn<ApplicationWithJob> = {
    key: "email",
    header: "Email",
    hideBelow: "lg",
    sortValue: (a) => a.email,
    cell: (a) => <span className="text-[13px] text-[var(--adm-ink-mute)]">{a.email}</span>,
  };

  const skillsCol: DataTableColumn<ApplicationWithJob> = {
    key: "skills",
    header: "Skills",
    hideBelow: "md",
    sortValue: (a) => a.skills?.length || 0,
    cell: (a) => {
      const skills = a.skills || [];
      if (skills.length === 0) return <BlankCell />;
      return (
        <span className="inline-flex max-w-full items-center gap-1 align-middle">
          {skills.slice(0, 2).map((skill) => (
            <span key={skill} className={cn(skillChip, "min-w-0 truncate")}>{skill}</span>
          ))}
          {skills.length > 2 && <span className={countChip}>+{skills.length - 2}</span>}
        </span>
      );
    },
  };

  const ageCol: DataTableColumn<ApplicationWithJob> = {
    key: "age",
    header: "On bench",
    align: "right",
    hideBelow: "xl",
    sortValue: (a) => daysOnBench(a) ?? -1,
    cell: (a) => {
      const d = daysOnBench(a);
      if (d === null) return <BlankCell />;
      return (
        <span className={cn("tabular-nums", d > 90 ? "font-semibold text-[var(--adm-warning-ink)]" : "text-[var(--adm-ink-mute)]")}>
          {d}d
        </span>
      );
    },
  };

  const ratingCol: DataTableColumn<ApplicationWithJob> = {
    key: "rating",
    header: "Rating",
    hideBelow: "sm",
    sortValue: (a) => a.rating || 0,
    cell: (a) => (
      <div onClick={(e) => e.stopPropagation()}>
        <StarRating rating={a.rating || 0} onRate={(r) => handleRatingChange(a.id, r)} />
      </div>
    ),
  };

  const poolCol: DataTableColumn<ApplicationWithJob> = {
    key: "pool",
    header: "Pool",
    hideBelow: "lg",
    sortValue: (a) => poolOf(a),
    cell: (a) => <PoolBadge pool={poolOf(a)} />,
  };

  const locationCol: DataTableColumn<ApplicationWithJob> = {
    key: "location",
    header: "Location",
    hideBelow: "lg",
    sortValue: (a) => [a.city, stateOf(a.state)].filter(Boolean).join(", "),
    cell: (a) => {
      const loc = [a.city?.trim(), stateOf(a.state)].filter(Boolean).join(", ");
      return loc ? <span className="text-[13px] text-[var(--adm-ink-mute)]">{loc}</span> : <BlankCell />;
    },
  };

  const hireTypeCol: DataTableColumn<ApplicationWithJob> = {
    key: "hireType",
    header: "Hire type",
    hideBelow: "xl",
    sortValue: (a) => a.hireType || "",
    cell: (a) => a.hireType
      ? (
        <span className={countChip}>{a.hireType}</span>
      )
      : <BlankCell />,
  };

  const statusCol: DataTableColumn<ApplicationWithJob> = {
    key: "status",
    header: "Stage",
    sortValue: (a) => a.status,
    cell: (a) => (
      <GridSelect
        value={a.status}
        ariaLabel={`Stage for ${a.name || a.email}`}
        dot={statusColor(a.status)}
        onChange={(e) => handleStatusChange(a.id, e.target.value as Application["status"])}
      >
        {BENCH_STATUSES.map((s) => (
          <option key={s} value={s}>{statusMeta[s].label}</option>
        ))}
      </GridSelect>
    ),
  };

  const actionsCol: DataTableColumn<ApplicationWithJob> = {
    key: "actions",
    header: "",
    align: "right",
    cell: (a) => (
      <div onClick={(e) => e.stopPropagation()} className="-my-1 flex items-center justify-end gap-0.5">
        <RowAction label="Edit profile" onClick={() => handleEditApplication(a)}>
          <IconEdit className="h-4 w-4" />
        </RowAction>
        <RowAction label="Send email" href={`mailto:${a.email}`}>
          <IconMail className="h-4 w-4" />
        </RowAction>
        <RowAction
          label="Remove from bench"
          danger
          onClick={() => setPendingRemove({ id: a.id, name: a.name || "this candidate" })}
        >
          <IconTrash className="h-4 w-4" />
        </RowAction>
      </div>
    ),
  };

  /**
   * Eleven columns for an admin, ten for everyone else. Phone, work
   * authorisation, the application ID and the resume link all live on the
   * record itself, which is one click away, and work auth is already a filter
   * on the toolbar. Location and hire type are columns rather than record-only
   * facts because both are now filters, a filter you cannot see the result of
   * in the grid leaves you guessing why rows disappeared.
   */
  const columns: DataTableColumn<ApplicationWithJob>[] = [
    candidateCol,
    ...(canFilterByAdder ? [addedByCol] : []),
    emailCol,
    skillsCol,
    locationCol,
    ageCol,
    ratingCol,
    hireTypeCol,
    poolCol,
    statusCol,
    actionsCol,
  ];

  // Empty-state copy depends on which pool tab is empty: the shared Talent
  // Bench fills itself when candidates are hired, My Pool is hand-built.
  const emptyFresh = pooledApplications.length === 0;
  const emptyTitle = emptyFresh
    ? (poolFilter === "internal" ? "No consultants on the Talent Bench yet"
      : poolFilter === "external" ? "Nothing in your pool yet"
      : "No candidates on the bench yet")
    : "No candidates match your filters";
  const emptyDescription = emptyFresh
    ? (poolFilter === "internal"
      ? "Candidates move here automatically when they are marked as hired. You can also add a consultant directly."
      : "Add the external candidates you are sourcing. Only you see them.")
    : "Try adjusting your search or filters.";
  // Secondary: the header already carries the one filled "Add profile".
  const emptyAction = emptyFresh
    ? <WorkspaceButton onClick={handleCreateNew}><Plus className="h-4 w-4" />Add profile</WorkspaceButton>
    : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>;

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <BenchLoading />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <EmptyState
          variant="error"
          title="Couldn't load the talent bench"
          description={error}
          action={<WorkspaceButton onClick={() => void fetchData()}>Try again</WorkspaceButton>}
        />
      </div>
    );
  }

  // ── list ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col pb-6">
      <ConfirmDialog
        open={!!pendingRemove}
        title="Remove from talent bench?"
        body={pendingRemove ? `${pendingRemove.name} will no longer appear in the talent bench.` : undefined}
        confirmLabel="Remove"
        tone="default"
        busy={removing}
        onConfirm={performRemoveFromBench}
        onCancel={() => setPendingRemove(null)}
      />

      {/* Pools re-scope everything below them, so they lead the band; the figures follow the pool. */}
      <BrandBand
        size="sm"
        className="mb-3"
        title="Talent bench"
        meta={`${poolCounts.all.toLocaleString()} profile${poolCounts.all === 1 ? "" : "s"} ready for future roles`}
        stats={[
          { label: "All candidates", value: poolCounts.all, selected: poolFilter === "all", onClick: () => setPoolFilter("all") },
          ...POOL_ORDER.map((pool) => ({
            label: POOL_META[pool].label,
            value: poolCounts[pool],
            selected: poolFilter === pool,
            onClick: () => setPoolFilter(pool),
          })),
          { label: "Available now", value: kpis.available },
          { label: "In process", value: kpis.inProcess },
          { label: "Placed", value: kpis.placed },
          { label: "Idle 30+ days", value: staleBench },
        ]}
        actions={
          <>
            <WorkspaceButton asChild>
              <Link href={`/admin/lead-sourcing?from=${poolFilter}`}>
                <IconSource aria-hidden="true" /><span className="hidden md:inline">Lead sourcing</span>
              </Link>
            </WorkspaceButton>
            <WorkspaceButton onClick={handleExportCSV} disabled={filteredApplications.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton className={BAND_PRIMARY} onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />Add profile
            </WorkspaceButton>
          </>
        }
      />

      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter bench by name, email or skill"
            />
          }
          trailing={
            <>
              <FilterMenu activeCount={activeFilterCount} onClearAll={clearFilters}>
                <Field label="Stage" htmlFor="bench-filter-stage">
                  <FormSelect id="bench-filter-stage" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    {STATUS_TABS.map((t) => (
                      <option key={t.key} value={t.key}>{t.label} ({statusCounts[t.key] || 0})</option>
                    ))}
                  </FormSelect>
                </Field>
                <Field label="Skill" htmlFor="bench-filter-skill">
                  <FormSelect id="bench-filter-skill" value={skillFilter} onChange={(e) => setSkillFilter(e.target.value)}>
                    <option value="all">All skills</option>
                    {allSkills.map((skill) => <option key={skill} value={skill}>{skill}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Work authorization" htmlFor="bench-filter-auth">
                  <FormSelect id="bench-filter-auth" value={authFilter} onChange={(e) => setAuthFilter(e.target.value)}>
                    <option value="all">All</option>
                    {workAuthorizations.map((auth) => <option key={auth} value={auth}>{auth}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Hire type" htmlFor="bench-filter-hire">
                  <FormSelect id="bench-filter-hire" value={hireFilter} onChange={(e) => setHireFilter(e.target.value)}>
                    <option value="all">All hire types</option>
                    {hireTypes.map((h) => <option key={h} value={h}>{hireTypeLabel(h)}</option>)}
                  </FormSelect>
                </Field>
                <Field label="Location" htmlFor="bench-filter-location">
                  <FormSelect id="bench-filter-location" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
                    <option value="all">All locations ({pooledApplications.length})</option>
                    {locations.map((l) => <option key={l.value} value={l.value}>{l.label} ({l.count})</option>)}
                  </FormSelect>
                </Field>
                {canFilterByAdder && (
                  <Field label="Added by" htmlFor="bench-filter-owner">
                    <FormSelect id="bench-filter-owner" value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                      <option value="all">Everyone</option>
                      {adderNames.map((n) => <option key={n} value={n}>{n}</option>)}
                    </FormSelect>
                  </Field>
                )}
              </FilterMenu>
              <ViewMenu
                options={[
                  { value: "table", label: "Table", icon: LayoutList },
                  { value: "cards", label: "Cards", icon: LayoutGrid },
                ]}
                value={viewMode}
                onChange={setViewMode}
              />
              {viewMode === "table" && (
                <DisplayMenu
                  columns={columns.map((c) => ({ key: c.key, label: c.label ?? c.key, locked: c.locked }))}
                  hidden={hiddenColumns}
                  onHiddenChange={setHiddenColumns}
                  rows={rows}
                  onRowsChange={setRows}
                  onReset={() => { setHiddenColumns([]); setRows(25); }}
                />
              )}
            </>
          }
        />

      <ActiveFilters
        variant="canvas"
        chips={[
          ...(statusFilter !== "all" ? [{ label: `Stage: ${STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }] : []),
          ...(skillFilter !== "all" ? [{ label: `Skill: ${skillFilter}`, onClear: () => setSkillFilter("all") }] : []),
          ...(authFilter !== "all" ? [{ label: `Work auth: ${authFilter}`, onClear: () => setAuthFilter("all") }] : []),
          ...(hireFilter !== "all" ? [{ label: `Hire type: ${hireTypeLabel(hireFilter)}`, onClear: () => setHireFilter("all") }] : []),
          ...(locationFilter !== "all" ? [{ label: `Location: ${locationLabelOf(locationFilter)}`, onClear: () => setLocationFilter("all") }] : []),
          ...(activeOwner !== "all" ? [{ label: `Added by: ${activeOwner}`, onClear: () => setOwnerFilter("all") }] : []),
        ]}
        onClearAll={clearFilters}
      />

      {viewMode === "table" ? (
        <Workspace>
          <DataTable
            noun="candidates"
            storageKey="bench"
            columns={columns}
            rows={filteredApplications}
            rowKey={(a) => a.id}
            onRowClick={handleViewApplication}
            pageSize={rows}
            onPageSizeChange={setRows}
            hiddenColumns={hiddenColumns}
            empty={{ icon: IconBoxes, title: emptyTitle, description: emptyDescription, action: emptyAction }}
          />
        </Workspace>
      ) : filteredApplications.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={IconBoxes}
            variant={emptyFresh ? "fresh" : "filtered"}
            title={emptyTitle}
            description={emptyDescription}
            action={emptyAction}
          />
        </AdminCard>
      ) : (
        // Cards sit on the canvas; inside the table panel they read as cards-in-a-card.
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {filteredApplications.map((app) => {
            const adder = canFilterByAdder ? resolveAdder(app) : null;
            const age = daysOnBench(app);
            return (
              <AdminCard key={app.id} hover className="flex h-full min-w-0 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={app.name} email={app.email} size="md" />
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => handleViewApplication(app)}
                        className="block max-w-full truncate rounded-[6px] text-left text-[15px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                      >
                        {app.name || "Unknown"}
                      </button>
                      <p className="truncate font-mono text-[12px] text-[var(--adm-ink-subtle)]">
                        {app.applicationId || app.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-none flex-col items-end gap-1.5">
                    <StatusBadge status={app.status} />
                    <PoolBadge pool={poolOf(app)} />
                  </div>
                </div>

                <div className="flex-1">
                <dl className="mt-4 space-y-2 text-[13px] text-[var(--adm-ink-mute)]">
                  <CardFact icon={IconMail} label="Email"><span className="truncate">{app.email}</span></CardFact>
                  <CardFact icon={IconPhone} label="Phone"><span className="tabular-nums">{app.phone || <BlankCell />}</span></CardFact>
                  <CardFact icon={IconShield} label="Work authorization"><span className="truncate">{app.workAuthorization || <BlankCell />}</span></CardFact>
                  {app.resumeId && (
                    <CardFact icon={IconFile} label="Resume">
                      <button
                        type="button"
                        onClick={() => void handleDownloadResume(app.resumeId!)}
                        className="rounded-[6px] font-medium text-[var(--adm-accent)] transition-colors hover:text-[var(--adm-accent-strong)] hover:underline"
                      >
                        Resume on file
                      </button>
                    </CardFact>
                  )}
                </dl>

                {app.skills && app.skills.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5 border-t border-[var(--adm-line-soft)] pt-4">
                    {app.skills.slice(0, 4).map((skill) => (
                      <span key={skill} className={skillChip}>{skill}</span>
                    ))}
                    {app.skills.length > 4 && <span className={countChip}>+{app.skills.length - 4}</span>}
                  </div>
                )}

                {adder && (
                  <div className="mt-4 flex min-w-0 items-center gap-2 border-t border-[var(--adm-line-soft)] pt-4 text-[13px]">
                    <Avatar name={adder.name} size="xs" />
                    <span className="flex-none text-[var(--adm-ink-subtle)]">Added by</span>
                    <span className="truncate font-medium text-[var(--adm-ink-mute)]">{adder.name}</span>
                    {adder.role && <span className={cn(countChip, "ml-auto capitalize")}>{adder.role}</span>}
                  </div>
                )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-[var(--adm-line-soft)] pt-3">
                  <div className="flex items-center gap-2.5">
                    <StarRating rating={app.rating || 0} onRate={(n) => void handleRatingChange(app.id, n)} />
                    {age !== null && (
                      <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]" title="Days on bench">{age}d</span>
                    )}
                  </div>
                  <div className="-mr-1.5 flex items-center gap-0.5">
                    <RowAction label="View details" onClick={() => handleViewApplication(app)}>
                      <IconEye className="h-4 w-4" />
                    </RowAction>
                    <RowAction label="Edit profile" onClick={() => handleEditApplication(app)}>
                      <IconEdit className="h-4 w-4" />
                    </RowAction>
                    <RowAction label="Send email" href={`mailto:${app.email}`}>
                      <IconMail className="h-4 w-4" />
                    </RowAction>
                    <RowAction
                      label="Remove from bench"
                      danger
                      onClick={() => setPendingRemove({ id: app.id, name: app.name || "this candidate" })}
                    >
                      <IconTrash className="h-4 w-4" />
                    </RowAction>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── presentational helpers ───────────────────────────────────────────────────

/**
 * Icon action in a grid row or card footer. Same hit area and hover wash
 * whether it navigates (anchor) or mutates (button), so a row of them reads
 * as one control group.
 */
function RowAction({
  label,
  href,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  href?: string;
  danger?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const cls = cn(
    "grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors",
    danger
      ? "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
      : "hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
  );
  return href ? (
    <a href={href} title={label} aria-label={label} className={cls}>{children}</a>
  ) : (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>{children}</button>
  );
}

/** One labelled line on a bench card. The label is for screen readers; the glyph carries it visually. */
function CardFact({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <dt className="flex-none">
        <Icon className="h-3.5 w-3.5 text-[var(--adm-ink-subtle)]" />
        <span className="sr-only">{label}</span>
      </dt>
      <dd className="flex min-w-0">{children}</dd>
    </div>
  );
}
