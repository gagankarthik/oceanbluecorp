"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { ArrowLeft, LayoutGrid, LayoutList, Loader2, Plus, X } from "lucide-react";
import type { Application, BenchType, Job } from "@/lib/aws/dynamodb";
import { useAuth, UserRole } from "@/lib/auth";
import BenchLoading from "./loading";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminCard } from "@/components/admin/admin-card";
import {
  ViewMenu,
} from "@/components/admin/toolbar";
import { StatusBadge } from "@/components/admin/status-badge";
import { StarRating } from "@/components/admin/star-rating";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { InlineSelect, Empty as BlankCell } from "@/components/admin/list-panel";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import {
  statusMeta, tones, US_STATES, normalizeState,
  WORK_AUTH_OPTIONS, SOURCE_OPTIONS, type AppStatus,
} from "@/components/admin/theme";
import {
  IconAlert, IconBoxes, IconDownload, IconEdit, IconEye,
  IconFile, IconHistory, IconJob, IconLocation, IconMail, IconPhone,
  IconShield, IconTrash, IconUpload, IconUser,
  IconWarning,
} from "@/components/admin/icons";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { fmtDate } from "@/lib/format";
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
type PageMode = "list" | "create" | "edit" | "view";

// ── config ───────────────────────────────────────────────────────────────────

/**
 * The stages a bench record can sit in.
 *
 * There used to be three disagreeing copies of this list on the page — the row
 * select carried seven stages, the filter dropdown dropped "inactive", and the
 * create form dropped "hired" — so a candidate could be set to a state the
 * filter could never find again. One list now feeds the tabs, the row select,
 * the detail select and the form.
 */
const BENCH_STATUSES = [
  "active", "pending", "reviewing", "submitted", "interview", "hired", "inactive",
] as const;

const STATUS_TABS = [
  { key: "all", label: "All" },
  ...BENCH_STATUSES.map((s) => ({ key: s as string, label: statusMeta[s].label })),
];

/**
 * The bench splits into two pools: "My Pool" holds our own hired consultants
 * sitting between placements (internal), "Talent Bench" holds market
 * candidates kept warm for future roles (external). The tabs sit above the
 * KPI strip because every number below them is scoped to the selected pool.
 */
const POOL_TABS = [
  { key: "all", label: "All candidates" },
  { key: "internal", label: "My Pool", hint: "Internal" },
  { key: "external", label: "Talent Bench", hint: "External" },
] as const;

type PoolKey = (typeof POOL_TABS)[number]["key"];

/**
 * A record's pool, with the legacy fallback: rows written before benchType
 * existed count as internal when hired (they became one of our consultants)
 * and external otherwise — the same rule scripts/backfill-bench-type.mjs
 * applies, so the page reads correctly before and after the backfill runs.
 */
function poolOf(app: Application): BenchType {
  return app.benchType || (app.status === "hired" ? "internal" : "external");
}

// These used to be narrower private lists, because the Application unions were
// narrower than the theme lists and the write path cast around the mismatch.
// Both unions have since been widened to match the pickers, so the shared lists
// are now the correct source and a third copy is just drift waiting to happen.
const WORK_AUTH_CHOICES = WORK_AUTH_OPTIONS as NonNullable<Application["workAuthorization"]>[];
const SOURCE_CHOICES = SOURCE_OPTIONS as NonNullable<Application["source"]>[];

/**
 * A bench record's state as a canonical 2-letter code, for grouping, export and
 * display. Legacy rows stored the full name ("Texas"), so everything that reads
 * `state` goes through here to land in the same bucket as a row saved as "TX".
 * Anything `normalizeState` doesn't recognise passes through untouched rather
 * than disappearing.
 */
function stateOf(value?: string | null): string {
  return normalizeState(value) || value || "";
}

const selectCls =
  "w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-sm text-[var(--adm-ink-mute)] transition-colors focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]";

const textareaCls =
  "w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 py-2 text-sm text-[var(--adm-ink-mute)] transition-colors placeholder:text-[var(--adm-ink-subtle)] focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)] resize-none";

const skillChip =
  "inline-flex items-center gap-1 rounded-[4px] bg-[var(--adm-accent-soft)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--adm-accent)]";

/** How long a record has been sitting on the bench, in whole days. */
function daysOnBench(app: Application): number | null {
  const d = new Date(app.createdAt || app.appliedAt);
  if (isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/** Internal / External pool tag shown in the grid, on cards and in detail. */
function PoolBadge({ pool }: { pool: BenchType }) {
  const internal = pool === "internal";
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium",
        internal
          ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
          : "bg-[var(--adm-surface-2)] text-[var(--adm-ink-mute)]",
      )}
    >
      {internal ? "Internal" : "External"}
    </span>
  );
}

/** Section heading inside the create/edit form. */
function SectionTitle({ icon: Icon, children }: { icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
      <Icon className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)]" />
      {children}
    </h3>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function TalentBenchPage() {
  const { user, hasRole } = useAuth();
  const isAdmin = hasRole(UserRole.ADMIN);

  const [applications, setApplications] = useState<ApplicationWithJob[]>([]);
  // Jobs are fetched only to resolve each bench record's job title/department.
  const [, setJobs] = useState<Job[]>([]);
  const [hrUsers, setHrUsers] = useState<CognitoUser[]>([]);
  const [allUsers, setAllUsers] = useState<CognitoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [skillFilter, setSkillFilter] = useState("all");
  const [authFilter, setAuthFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [poolFilter, setPoolFilter] = useState<PoolKey>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  // Form states
  const [pageMode, setPageMode] = useState<PageMode>("list");
  const [selectedApplication, setSelectedApplication] = useState<ApplicationWithJob | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  // Resume upload states
  const [resumeFile, setResumeFile] = useState<globalThis.File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [existingResume, setExistingResume] = useState<{ id: string; fileName: string } | null>(null);

  const [pendingRemove, setPendingRemove] = useState<{ id: string; name: string } | null>(null);
  const [removing, setRemoving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    source: "" as Application["source"] | "",
    status: "active" as Application["status"],
    benchType: "external" as BenchType,
    jobId: "",
    jobTitle: "",
    ownership: "",
    ownershipName: "",
    workAuthorization: "" as Application["workAuthorization"] | "",
    rating: 0,
    notes: "",
    skills: [] as string[],
    experience: "",
    resumeId: "",
    resumeFileName: "",
    resumeFileKey: "",
  });

  // ── data ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [appsResponse, jobsResponse] = await Promise.all([
        fetch("/api/applications"),
        fetch("/api/jobs"),
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
        .filter((app: Application) => app.addToTalentBench === true)
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
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
        setHrUsers(users.filter((u: CognitoUser) => u.role === "hr" || u.role === "admin"));
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

  // Admins can browse the whole team's bench; this powers the "Added by" filter.
  const adderNames = useMemo(
    () => (isAdmin
      ? [...new Set(applications.map((a) => resolveAdder(a).name).filter(Boolean))].sort()
      : []),
    [isAdmin, applications, resolveAdder],
  );

  /**
   * The bench this viewer is allowed to see: admins get every team member's
   * records, everyone else only what they themselves added. The KPI strip and
   * the grid are built from this list, never from the raw fetch.
   */
  const scopedApplications = useMemo(() => applications.filter((app) => {
    const addedBy = app.benchAddedBy || app.createdBy;
    const matchesOwnership = isAdmin || (!!addedBy && (addedBy === user?.email || addedBy === user?.id));
    const matchesOwner = !isAdmin || ownerFilter === "all" || resolveAdder(app).name === ownerFilter;
    return matchesOwnership && matchesOwner;
  }), [applications, isAdmin, user?.email, user?.id, ownerFilter, resolveAdder]);

  /** Tab counts come from the scoped set, so they don't move as filters change. */
  const poolCounts = useMemo(() => ({
    all: scopedApplications.length,
    internal: scopedApplications.filter((a) => poolOf(a) === "internal").length,
    external: scopedApplications.filter((a) => poolOf(a) === "external").length,
  }), [scopedApplications]);

  /**
   * The selected pool. The KPI strip, status counts and the grid are all built
   * from this list — switching tabs re-scopes the whole page, not just the rows.
   */
  const pooledApplications = useMemo(
    () => (poolFilter === "all"
      ? scopedApplications
      : scopedApplications.filter((a) => poolOf(a) === poolFilter)),
    [scopedApplications, poolFilter],
  );

  const filteredApplications = useMemo(() => pooledApplications.filter((app) => {
    const q = debouncedSearch.toLowerCase();
    const matchesSearch = !q
      || [app.name, app.email, app.applicationId, app.jobTitle].some((f) => f?.toLowerCase().includes(q))
      || (app.skills?.some((s) => s.toLowerCase().includes(q)) ?? false);
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    const matchesSkill = skillFilter === "all" || (app.skills?.includes(skillFilter) || false);
    const matchesAuth = authFilter === "all" || app.workAuthorization === authFilter;
    return matchesSearch && matchesStatus && matchesSkill && matchesAuth;
  }), [pooledApplications, debouncedSearch, statusFilter, skillFilter, authFilter]);

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

  /** On the bench a month or more without moving — the re-engagement list. */
  const staleBench = useMemo(
    () => pooledApplications.filter(
      (a) => (Date.now() - new Date(a.appliedAt).getTime()) / 86_400_000 >= 30,
    ).length,
    [pooledApplications],
  );

  const hasActiveFilters = [statusFilter, skillFilter, authFilter, ownerFilter].some((f) => f !== "all")
    || debouncedSearch.trim() !== "";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSkillFilter("all");
    setAuthFilter("all");
    setOwnerFilter("all");
  };

  // ── mutations ─────────────────────────────────────────────────────────────

  const handleStatusChange = async (appId: string, newStatus: Application["status"]) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          changedBy: user?.id,
          changedByName: user?.name,
        }),
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
      "Work Authorization", "Skills", "Rating", "City", "State", "Has Resume", "Notes",
    ],
    filteredApplications.map((app) => [
      app.applicationId || app.id.slice(0, 8),
      app.name || "Unknown",
      app.email,
      app.phone || "",
      app.jobTitle || "",
      app.status,
      poolOf(app),
      app.workAuthorization || "",
      app.skills?.join(", ") || "",
      app.rating?.toString() || "",
      app.city || "",
      stateOf(app.state),
      app.resumeId ? "Yes" : "No",
      app.notes || "",
    ]),
  );

  // ── form handlers ─────────────────────────────────────────────────────────

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      source: "",
      status: "active",
      benchType: "external",
      jobId: "",
      jobTitle: "",
      ownership: "",
      ownershipName: "",
      workAuthorization: "",
      rating: 0,
      notes: "",
      skills: [],
      experience: "",
      resumeId: "",
      resumeFileName: "",
      resumeFileKey: "",
    });
    setSkillInput("");
    setResumeFile(null);
    setResumeError(null);
    setExistingResume(null);
  };

  const handleCreateNew = () => {
    resetForm();
    setSelectedApplication(null);
    setResumeFile(null);
    setResumeError(null);
    setExistingResume(null);
    setPageMode("create");
  };

  const handleEditApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setFormData({
      firstName: app.firstName || app.name?.split(" ")[0] || "",
      lastName: app.lastName || app.name?.split(" ").slice(1).join(" ") || "",
      phone: app.phone || "",
      email: app.email,
      address: app.address || "",
      city: app.city || "",
      // Legacy rows hold a full state name; the picker submits codes, so
      // normalise on load or the select would render blank.
      state: normalizeState(app.state),
      zipCode: app.zipCode || "",
      source: app.source || "",
      status: app.status,
      benchType: poolOf(app),
      jobId: app.jobId || "",
      jobTitle: app.jobTitle || "",
      ownership: app.ownership || "",
      ownershipName: app.ownershipName || "",
      workAuthorization: app.workAuthorization || "",
      rating: app.rating || 0,
      notes: app.notes || "",
      skills: app.skills || [],
      experience: app.experience || "",
      resumeId: app.resumeId || "",
      resumeFileName: app.resumeFileName || "",
      resumeFileKey: app.resumeFileKey || "",
    });
    // Set existing resume info if available
    if (app.resumeId && app.resumeFileName) {
      setExistingResume({ id: app.resumeId, fileName: app.resumeFileName });
    } else {
      setExistingResume(null);
    }
    setResumeFile(null);
    setResumeError(null);
    setPageMode("edit");
  };

  const handleViewApplication = (app: ApplicationWithJob) => {
    setSelectedApplication(app);
    setPageMode("view");
  };

  const handleOwnershipSelect = (userId: string) => {
    const selectedUser = hrUsers.find((u) => u.id === userId);
    setFormData({
      ...formData,
      ownership: userId,
      ownershipName: selectedUser?.name || selectedUser?.email || "",
    });
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skillInput.trim()] });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({ ...formData, skills: formData.skills.filter((s) => s !== skill) });
  };

  // Resume handlers
  const handleResumeSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setResumeError(null);

    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setResumeError("Please upload a PDF or Word document (.pdf, .doc, .docx)");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setResumeError("File size must be less than 5MB");
      return;
    }

    setResumeFile(file);
  };

  const handleRemoveResume = () => {
    setResumeFile(null);
    setResumeError(null);
  };

  const handleRemoveExistingResume = () => {
    setExistingResume(null);
    setFormData({ ...formData, resumeId: "", resumeFileName: "", resumeFileKey: "" });
  };

  const uploadResume = async (userId: string): Promise<{ resumeId: string; fileName: string; fileKey: string } | null> => {
    if (!resumeFile) return null;

    setResumeUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("userId", userId);

      const response = await fetch("/api/resume/upload", {
        method: "POST",
        body: fd,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to upload resume");
      }

      const { resumeId, fileKey } = await response.json();
      return { resumeId, fileName: resumeFile.name, fileKey };
    } catch (err) {
      console.error("Resume upload error:", err);
      setResumeError(err instanceof Error ? err.message : "Failed to upload resume");
      return null;
    } finally {
      setResumeUploading(false);
    }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.email) {
        throw new Error("Please fill in all required fields (First Name, Last Name, Email)");
      }

      // Use existing application ID for edit mode, or generate a temp user ID for new entries
      const userId = selectedApplication?.id || user?.id || `bench-${Date.now()}`;

      // Upload resume if a new file is selected
      let resumeData: { resumeId?: string; resumeFileName?: string; resumeFileKey?: string } = {};
      if (resumeFile) {
        const uploadResult = await uploadResume(userId);
        if (uploadResult) {
          resumeData = {
            resumeId: uploadResult.resumeId,
            resumeFileName: uploadResult.fileName,
            resumeFileKey: uploadResult.fileKey,
          };
        } else if (resumeError) {
          throw new Error(resumeError);
        }
      } else if (existingResume) {
        // Keep existing resume data
        resumeData = {
          resumeId: formData.resumeId,
          resumeFileName: formData.resumeFileName,
          resumeFileKey: formData.resumeFileKey,
        };
      }

      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone || undefined,
        email: formData.email,
        address: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zipCode: formData.zipCode || undefined,
        source: formData.source || "Other",
        status: formData.status,
        benchType: formData.benchType,
        jobId: formData.jobId || undefined,
        jobTitle: formData.jobTitle || undefined,
        ownership: formData.ownership || undefined,
        ownershipName: formData.ownershipName || undefined,
        workAuthorization: formData.workAuthorization || undefined,
        rating: formData.rating || undefined,
        notes: formData.notes || undefined,
        addToTalentBench: true,
        benchAddedBy: user?.email || user?.id || "system",
        skills: formData.skills.length > 0 ? formData.skills : undefined,
        experience: formData.experience || undefined,
        createdBy: user?.email || user?.id || "system",
        createdByName: user?.name || user?.email?.split("@")[0] || "System",
        ...resumeData,
      };

      let response;
      if (pageMode === "edit" && selectedApplication) {
        response = await fetch(`/api/applications/${selectedApplication.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicationData),
        });
      } else {
        response = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicationData),
        });
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save profile");
      }

      await fetchData();
      setPageMode("list");
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSubmitting(false);
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
          {skills.length > 2 && (
            <span className="flex-none rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
              +{skills.length - 2}
            </span>
          )}
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
        <span className={cn("tabular-nums", d > 90 ? "font-semibold text-[var(--adm-warning)]" : "text-[var(--adm-ink-mute)]")}>
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

  const statusCol: DataTableColumn<ApplicationWithJob> = {
    key: "status",
    header: "Stage",
    sortValue: (a) => a.status,
    cell: (a) => {
      const t = tones[statusMeta[a.status as AppStatus]?.tone ?? "slate"];
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <InlineSelect
            value={a.status}
            aria-label={`Stage for ${a.name || a.email}`}
            onChange={(e) => handleStatusChange(a.id, e.target.value as Application["status"])}
            className={cn(t.bg, t.text, "border-transparent")}
          >
            {BENCH_STATUSES.map((s) => (
              <option key={s} value={s}>{statusMeta[s].label}</option>
            ))}
          </InlineSelect>
        </div>
      );
    },
  };

  const actionsCol: DataTableColumn<ApplicationWithJob> = {
    key: "actions",
    header: "",
    align: "right",
    cell: (a) => (
      <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-0.5">
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
   * Nine columns for an admin, eight for everyone else. It was eleven, several
   * of them stacking two facts on top of each other; phone, work authorisation,
   * the application ID and the resume link all still live on the record itself,
   * which is one click away, and work auth is already a filter on the toolbar.
   */
  const columns: DataTableColumn<ApplicationWithJob>[] = [
    candidateCol,
    ...(isAdmin ? [addedByCol] : []),
    emailCol,
    skillsCol,
    ageCol,
    ratingCol,
    poolCol,
    statusCol,
    actionsCol,
  ];

  // Empty-state copy depends on which pool tab is empty: the internal pool
  // fills itself when candidates are hired, the external bench is hand-built.
  const emptyFresh = pooledApplications.length === 0;
  const emptyTitle = emptyFresh
    ? (poolFilter === "internal" ? "No internal candidates in My Pool yet"
      : poolFilter === "external" ? "No external candidates on the bench yet"
      : "No candidates on the bench yet")
    : "No candidates match your filters";
  const emptyDescription = emptyFresh
    ? (poolFilter === "internal"
      ? "Candidates move here automatically when they are marked as hired. You can also add a profile directly."
      : "Add a profile to keep strong candidates warm for future roles.")
    : "Try adjusting your search or filters.";

  // ── states ────────────────────────────────────────────────────────────────

  if (loading) return <BenchLoading />;

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <IconWarning className="mx-auto h-10 w-10 text-[var(--adm-danger)]" />
          <p className="text-sm text-[var(--adm-danger)]">{error}</p>
          <button
            onClick={() => void fetchData()}
            className="rounded-[8px] bg-[var(--adm-accent)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── create / edit form ────────────────────────────────────────────────────

  if (pageMode === "create" || pageMode === "edit") {
    const closeForm = () => { setPageMode("list"); resetForm(); };
    return (
      <div className="space-y-5 pb-10">
        <PageHeader
          title={pageMode === "create" ? "Add to Talent Bench" : "Edit Bench Profile"}
          subtitle={pageMode === "edit" ? selectedApplication?.name || undefined : undefined}
          icon={IconBoxes}
          actions={
            <PageHeaderButton variant="secondary" onClick={closeForm}>
              <ArrowLeft className="h-4 w-4" />Back
            </PageHeaderButton>
          }
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal information */}
          <AdminCard className="space-y-4 p-5">
            <SectionTitle icon={IconUser}>Personal information</SectionTitle>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  required
                  autoComplete="off"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  required
                  autoComplete="off"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <IconPhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="off"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <IconMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--adm-ink-subtle)]" />
                  <Input
                    id="email"
                    required
                    type="email"
                    autoComplete="off"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.doe@example.com"
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </AdminCard>

          {/* Location */}
          <AdminCard className="space-y-4 p-5">
            <SectionTitle icon={IconLocation}>Location</SectionTitle>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                autoComplete="off"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main Street"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  autoComplete="off"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="New York"
                />
              </div>
              <div className="space-y-2">
                <Label>State</Label>
                <Select value={formData.state} onValueChange={(v) => setFormData({ ...formData, state: v })}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {US_STATES.map((s) => (
                      <SelectItem key={s.code} value={s.code}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  autoComplete="off"
                  value={formData.zipCode}
                  onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                  placeholder="10001"
                />
              </div>
            </div>
          </AdminCard>

          {/* Skills & experience */}
          <AdminCard className="space-y-4 p-5">
            <SectionTitle icon={IconJob}>Skills &amp; experience</SectionTitle>

            <div className="space-y-2">
              <Label>Skills</Label>
              <div className="flex gap-2">
                <Input
                  value={skillInput}
                  autoComplete="off"
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); }
                  }}
                  placeholder="Add a skill (e.g., React, Python, AWS)"
                />
                <button
                  type="button"
                  aria-label="Add skill"
                  onClick={handleAddSkill}
                  className="inline-flex h-9 flex-none items-center justify-center rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-3 text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              {formData.skills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {formData.skills.map((skill) => (
                    <span key={skill} className={cn(skillChip, "text-[12px]")}>
                      {skill}
                      <button type="button" aria-label={`Remove ${skill}`} onClick={() => handleRemoveSkill(skill)}>
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Experience Summary</Label>
              <textarea
                id="experience"
                autoComplete="off"
                value={formData.experience}
                onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                className={cn(textareaCls, "min-h-[80px]")}
                placeholder="Brief summary of experience and background..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Work Authorization</Label>
                <Select
                  value={formData.workAuthorization}
                  onValueChange={(v) => setFormData({ ...formData, workAuthorization: v as Application["workAuthorization"] })}
                >
                  <SelectTrigger><SelectValue placeholder="Select authorization" /></SelectTrigger>
                  <SelectContent>
                    {WORK_AUTH_CHOICES.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select
                  value={formData.source}
                  onValueChange={(v) => setFormData({ ...formData, source: v as Application["source"] })}
                >
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_CHOICES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as Application["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BENCH_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{statusMeta[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select value={formData.ownership} onValueChange={handleOwnershipSelect}>
                  <SelectTrigger><SelectValue placeholder="Assign to team member" /></SelectTrigger>
                  <SelectContent>
                    {hrUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Talent pool</Label>
                <Select
                  value={formData.benchType}
                  onValueChange={(v) => setFormData({ ...formData, benchType: v as BenchType })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">Talent Bench — external candidate</SelectItem>
                    <SelectItem value="internal">My Pool — internal hire</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AdminCard>

          {/* Resume */}
          <AdminCard className="space-y-4 p-5">
            <SectionTitle icon={IconUpload}>Resume</SectionTitle>

            <div className="space-y-3">
              {existingResume && !resumeFile && (
                <div className="flex items-center justify-between rounded-[6px] border border-[var(--adm-success-soft)] bg-[var(--adm-success-soft)] p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-success-soft)]">
                      <IconFile className="h-4 w-4 text-[var(--adm-success)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--adm-success)]">{existingResume.fileName}</p>
                      <p className="text-xs text-[var(--adm-success)]">Current resume on file</p>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleDownloadResume(existingResume.id)}
                      className="rounded-[6px] p-2 text-[var(--adm-success)] transition-colors hover:bg-[var(--adm-success-soft)]"
                      title="Download resume"
                    >
                      <IconDownload className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveExistingResume}
                      className="rounded-[6px] p-2 text-[var(--adm-danger)] transition-colors hover:bg-[var(--adm-danger-soft)]"
                      title="Remove resume"
                    >
                      <IconTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {resumeFile && (
                <div className="flex items-center justify-between rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-accent-tint)] p-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                      <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--adm-ink)]">{resumeFile.name}</p>
                      <p className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">
                        {(resumeFile.size / 1024).toFixed(1)} KB &middot; ready to upload
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveResume}
                    className="rounded-[6px] p-2 text-[var(--adm-danger)] transition-colors hover:bg-[var(--adm-danger-soft)]"
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {!resumeFile && (
                <div className="relative">
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleResumeSelect}
                    className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="rounded-[6px] border border-dashed border-[var(--adm-line)] p-6 text-center transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]">
                    <IconUpload className="mx-auto mb-2 h-7 w-7 text-[var(--adm-ink-subtle)]" />
                    <p className="text-sm font-medium text-[var(--adm-ink-mute)]">
                      {existingResume ? "Upload a new resume to replace" : "Click to upload resume"}
                    </p>
                    <p className="mt-1 text-xs text-[var(--adm-ink-subtle)]">PDF, DOC, or DOCX (max 5MB)</p>
                  </div>
                </div>
              )}

              {resumeError && (
                <div className="flex items-center gap-2 rounded-[6px] border border-[var(--adm-danger-soft)] bg-[var(--adm-danger-soft)] p-3">
                  <IconAlert className="h-4 w-4 flex-none text-[var(--adm-danger)]" />
                  <p className="text-sm text-[var(--adm-danger)]">{resumeError}</p>
                </div>
              )}
            </div>
          </AdminCard>

          {/* Rating & notes */}
          <AdminCard className="space-y-4 p-5">
            <SectionTitle icon={IconFile}>Rating &amp; notes</SectionTitle>

            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center gap-3">
                <StarRating
                  size="lg"
                  rating={formData.rating}
                  onRate={(n) => setFormData({ ...formData, rating: n })}
                />
                {formData.rating > 0 && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: 0 })}
                    className="text-xs font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-ink-mute)]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                autoComplete="off"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className={cn(textareaCls, "min-h-[100px]")}
                placeholder="Additional notes about this candidate..."
              />
            </div>
          </AdminCard>

          <div className="flex items-center justify-end gap-2">
            <PageHeaderButton type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </PageHeaderButton>
            <PageHeaderButton type="submit" variant="primary" disabled={submitting || resumeUploading}>
              {(submitting || resumeUploading) && <Loader2 className="h-4 w-4 animate-spin" />}
              {resumeUploading ? "Uploading Resume…" : pageMode === "create" ? "Add to Bench" : "Save Changes"}
            </PageHeaderButton>
          </div>
        </form>
      </div>
    );
  }

  // ── record detail ─────────────────────────────────────────────────────────

  if (pageMode === "view" && selectedApplication) {
    const app = selectedApplication;
    const location = [app.city, stateOf(app.state)].filter(Boolean).join(", ");
    const adder = isAdmin ? resolveAdder(app) : null;
    const age = daysOnBench(app);

    return (
      <div className="space-y-5 pb-10">
        <PageHeader
          title={app.name || "Unknown"}
          subtitle={app.applicationId || `ID: ${app.id.slice(0, 8)}`}
          icon={IconUser}
          meta={
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={app.status} size="md" />
              <PoolBadge pool={poolOf(app)} />
              {age !== null && (
                <span className="text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">{age}d on bench</span>
              )}
            </div>
          }
          actions={
            <>
              <PageHeaderButton
                variant="secondary"
                onClick={() => { setPageMode("list"); setSelectedApplication(null); }}
              >
                <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
              </PageHeaderButton>
              <a
                href={`mailto:${app.email}`}
                className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 text-[14px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
              >
                <IconMail className="h-4 w-4" /><span className="hidden sm:inline">Email</span>
              </a>
              {app.phone && (
                <a
                  href={`tel:${app.phone}`}
                  className="inline-flex h-10 items-center gap-1.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 text-[14px] font-semibold text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)]"
                >
                  <IconPhone className="h-4 w-4" /><span className="hidden sm:inline">Call</span>
                </a>
              )}
              <PageHeaderButton variant="primary" onClick={() => handleEditApplication(app)}>
                <IconEdit className="h-4 w-4" />Edit
              </PageHeaderButton>
            </>
          }
        />

        {/* Identity band — the facts a recruiter reads first, on one rule. */}
        <AdminCard className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4 text-[13px] text-[var(--adm-ink-mute)]">
          <Avatar name={app.name} email={app.email} size="md" />
          <span className="inline-flex items-center gap-1.5"><IconMail className="h-4 w-4 text-[var(--adm-ink-subtle)]" />{app.email}</span>
          {app.phone && <span className="inline-flex items-center gap-1.5"><IconPhone className="h-4 w-4 text-[var(--adm-ink-subtle)]" />{app.phone}</span>}
          {location && <span className="inline-flex items-center gap-1.5"><IconLocation className="h-4 w-4 text-[var(--adm-ink-subtle)]" />{location}</span>}
          {app.workAuthorization && <span className="inline-flex items-center gap-1.5"><IconShield className="h-4 w-4 text-[var(--adm-ink-subtle)]" />{app.workAuthorization}</span>}
          <span className="ml-auto"><StarRating rating={app.rating || 0} size="md" /></span>
        </AdminCard>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-4 lg:col-span-2">
            <AdminCard className="p-5">
              <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
                <IconJob className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)]" />Skills &amp; experience
              </h3>
              {app.skills && app.skills.length > 0 && (
                <div className="mb-5">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {app.skills.map((skill) => (
                      <span key={skill} className={cn(skillChip, "text-[12px]")}>{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              {app.experience && (
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Experience</p>
                  <p className="text-sm leading-relaxed text-[var(--adm-ink-mute)]">{app.experience}</p>
                </div>
              )}
              {!app.skills?.length && !app.experience && (
                <p className="text-sm text-[var(--adm-ink-subtle)]">No skills or experience recorded yet.</p>
              )}
            </AdminCard>

            <AdminCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
                <IconFile className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)]" />Notes
              </h3>
              {app.notes
                ? <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--adm-ink-mute)]">{app.notes}</p>
                : <p className="text-sm text-[var(--adm-ink-subtle)]">No notes added yet.</p>}
            </AdminCard>

            {app.statusHistory && app.statusHistory.length > 0 && (
              <AdminCard className="p-5">
                <h3 className="mb-5 flex items-center gap-2 text-[15px] font-semibold text-[var(--adm-ink)]">
                  <IconHistory className="h-[18px] w-[18px] text-[var(--adm-ink-subtle)]" />Stage timeline
                </h3>
                <div className="relative pl-1">
                  <div className="absolute bottom-1 left-[5px] top-1 w-px bg-[var(--adm-line)]" />
                  <div className="space-y-4">
                    {[...app.statusHistory].reverse().map((entry, idx) => {
                      const meta = statusMeta[entry.status as AppStatus] ?? statusMeta.pending;
                      return (
                        <div key={idx} className="relative pl-6">
                          <span className={cn("absolute left-0 top-1 h-[11px] w-[11px] rounded-full ring-2 ring-[var(--adm-surface)]", tones[meta.tone].dot)} />
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <StatusBadge status={entry.status} />
                            <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(entry.changedAt)}</span>
                            {entry.changedByName && <span className="text-xs text-[var(--adm-ink-subtle)]">&middot; by {entry.changedByName}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </AdminCard>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <AdminCard className="p-5">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Stage</h3>
              <select
                value={app.status}
                autoComplete="off"
                aria-label="Stage"
                onChange={(e) => void handleStatusChange(app.id, e.target.value as Application["status"])}
                className={selectCls}
              >
                {BENCH_STATUSES.map((s) => (
                  <option key={s} value={s}>{statusMeta[s].label}</option>
                ))}
              </select>
            </AdminCard>

            <AdminCard className="p-5">
              <h3 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Rating</h3>
              <StarRating
                size="lg"
                rating={app.rating || 0}
                onRate={(n) => void handleRatingChange(app.id, n)}
              />
            </AdminCard>

            <AdminCard className="p-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Resume</h3>
              {app.resumeId && app.resumeFileName ? (
                <button
                  onClick={() => void handleDownloadResume(app.resumeId!)}
                  className="flex w-full items-center gap-3 rounded-[6px] border border-[var(--adm-line)] p-3 text-left transition-colors hover:border-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]"
                >
                  <span className="grid h-9 w-9 flex-none place-items-center rounded-[6px] bg-[var(--adm-accent-soft)]">
                    <IconFile className="h-4 w-4 text-[var(--adm-accent)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--adm-ink)]">{app.resumeFileName}</span>
                    <span className="text-xs text-[var(--adm-ink-subtle)]">Click to download</span>
                  </span>
                  <IconDownload className="h-4 w-4 flex-none text-[var(--adm-ink-subtle)]" />
                </button>
              ) : (
                <div className="flex items-center gap-2 rounded-[6px] border border-dashed border-[var(--adm-line)] p-3 text-sm text-[var(--adm-ink-subtle)]">
                  <IconFile className="h-4 w-4" />No resume on file
                </div>
              )}
            </AdminCard>

            <AdminCard className="p-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--adm-ink-subtle)]">Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--adm-ink-subtle)]">Pool</dt>
                  <dd className="font-medium text-[var(--adm-ink-mute)]">
                    {poolOf(app) === "internal" ? "My Pool (Internal)" : "Talent Bench (External)"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--adm-ink-subtle)]">Source</dt>
                  <dd className="font-medium text-[var(--adm-ink-mute)]">{app.source || <BlankCell />}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--adm-ink-subtle)]">Last position</dt>
                  <dd className="max-w-[60%] truncate font-medium text-[var(--adm-ink-mute)]">{app.jobTitle || <BlankCell />}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--adm-ink-subtle)]">Assigned to</dt>
                  <dd className="font-medium text-[var(--adm-ink-mute)]">{app.ownershipName || <BlankCell />}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--adm-ink-subtle)]">Added</dt>
                  <dd className="font-medium tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(app.createdAt || app.appliedAt)}</dd>
                </div>
                {adder && (
                  <div className="flex items-center justify-between gap-3 border-t border-[var(--adm-line-soft)] pt-3">
                    <dt className="text-[var(--adm-ink-subtle)]">Added by</dt>
                    <dd className="flex items-center gap-1.5 font-medium text-[var(--adm-ink-mute)]">
                      {adder.name}
                      {adder.role && (
                        <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--adm-ink-mute)]">
                          {adder.role}
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </AdminCard>
          </div>
        </div>
      </div>
    );
  }

  // ── list ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-10">
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

      {/* Every tile is either a state you can filter to or an ageing figure
          the grid cannot show at a glance. The old strip drew proportion bars
          of "On bench", which the footer already counts. */}
      <WorkspaceTitle
        title="Talent bench"
        actions={
          <>
            <WorkspaceButton onClick={handleExportCSV} disabled={filteredApplications.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={handleCreateNew}>
              <Plus className="h-4 w-4" />Add profile
            </WorkspaceButton>
          </>
        }
      />

      {/* Pool tabs — everything below (KPIs, counts, grid) is scoped to the
          selected pool, so they sit above the KPI strip, not among the filter
          pills. */}
      <div
        role="tablist"
        aria-label="Talent pool"
        className="flex max-w-full items-center gap-0.5 self-start overflow-x-auto rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5 sm:inline-flex sm:w-auto"
      >
        {POOL_TABS.map((t) => {
          const active = poolFilter === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setPoolFilter(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
                active
                  ? "bg-[var(--adm-surface)] text-[var(--adm-ink)] shadow-sm"
                  : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
              )}
            >
              {t.label}
              {"hint" in t && (
                <span className="text-[11px] font-medium text-[var(--adm-ink-subtle)]">{t.hint}</span>
              )}
              <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-px text-[11px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                {poolCounts[t.key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Inline stat strip — the table gets the vertical space, not stat cards. */}
      <StatStrip
        items={[
          { label: "Available now", value: kpis.available, hint: "Not currently in a process" },
          { label: "In process", value: kpis.inProcess },
          { label: "Placed", value: kpis.placed, tone: "success" },
          { label: "On bench 30d+", value: staleBench,
            tone: staleBench > 0 ? "warning" : "default",
            hint: staleBench > 0 ? "Worth re-engaging" : "All recently added" },
        ]}
      />

      {/* Toolbar floats on the canvas between the stat strip and the table. */}
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
              <ViewMenu
                options={[
                  { value: "table", label: "Table", icon: LayoutList },
                  { value: "cards", label: "Cards", icon: LayoutGrid },
                ]}
                value={viewMode}
                onChange={setViewMode}
                className="h-8 rounded-[6px] px-2.5 py-0 text-[13px]"
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
        >
          <FilterPill
            label="Stage"
            icon={FilterIcon.stage}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_TABS.map((t) => ({
              value: t.key,
              label: t.label,
              count: statusCounts[t.key] || 0,
            }))}
          />
          <FilterPill
            label="Skill"
            icon={FilterIcon.skill}
            value={skillFilter}
            onChange={setSkillFilter}
            options={[
              { value: "all", label: "All skills" },
              ...allSkills.map((skill) => ({ value: skill, label: skill })),
            ]}
          />
          <FilterPill
            label="Work auth"
            icon={FilterIcon.workAuth}
            value={authFilter}
            onChange={setAuthFilter}
            options={[
              { value: "all", label: "All" },
              ...workAuthorizations.map((auth) => ({ value: auth, label: auth })),
            ]}
          />
          {/* Only admins see the whole team's bench, so only they get to slice
              it by who added a record. */}
          {isAdmin && (
            <FilterPill
              label="Added by"
              icon={FilterIcon.person}
              value={ownerFilter}
              onChange={setOwnerFilter}
              options={[
                { value: "all", label: "Everyone" },
                ...adderNames.map((n) => ({ value: n, label: n })),
              ]}
            />
          )}
      </WorkspaceToolbar>

      <ActiveFilters
        variant="canvas"
        chips={[
          ...(statusFilter !== "all" ? [{ label: `Stage: ${STATUS_TABS.find((t) => t.key === statusFilter)?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }] : []),
          ...(skillFilter !== "all" ? [{ label: `Skill: ${skillFilter}`, onClear: () => setSkillFilter("all") }] : []),
          ...(authFilter !== "all" ? [{ label: `Work auth: ${authFilter}`, onClear: () => setAuthFilter("all") }] : []),
          ...(ownerFilter !== "all" ? [{ label: `Added by: ${ownerFilter}`, onClear: () => setOwnerFilter("all") }] : []),
        ]}
        onClearAll={clearFilters}
      />

      <Workspace>
      {/* ── record grid ── */}
      {viewMode === "table" && (
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
            empty={{
              icon: IconBoxes,
              title: emptyTitle,
              description: emptyDescription,
              action: emptyFresh
                ? <WorkspaceButton variant="primary" onClick={handleCreateNew}><Plus className="h-4 w-4" />Add profile</WorkspaceButton>
                : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>,
            }}
          />
      )}

      {viewMode === "cards" && (
        filteredApplications.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredApplications.map((app) => {
              const adder = isAdmin ? resolveAdder(app) : null;
              const age = daysOnBench(app);
              return (
                <AdminCard key={app.id} hover className="flex h-full flex-col p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar name={app.name} email={app.email} size="md" />
                      <div className="min-w-0">
                        <button
                          onClick={() => handleViewApplication(app)}
                          className="block max-w-full truncate text-left text-sm font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                        >
                          {app.name || "Unknown"}
                        </button>
                        <p className="truncate font-mono text-[11px] text-[var(--adm-ink-subtle)]">
                          {app.applicationId || app.id.slice(0, 8)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-none flex-col items-end gap-1">
                      <StatusBadge status={app.status} size="md" />
                      <PoolBadge pool={poolOf(app)} />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[13px] text-[var(--adm-ink-mute)]">
                    <div className="flex items-center gap-2">
                      <IconMail className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                      <span className="truncate">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconPhone className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                      <span className="tabular-nums">{app.phone || <BlankCell />}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconShield className="h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]" />
                      <span className="truncate">{app.workAuthorization || <BlankCell />}</span>
                    </div>
                    {app.resumeId && (
                      <button
                        onClick={() => void handleDownloadResume(app.resumeId!)}
                        className="inline-flex items-center gap-2 text-[var(--adm-success)] transition-colors hover:text-[var(--adm-success)]"
                      >
                        <IconFile className="h-3.5 w-3.5 flex-none text-[var(--adm-success)]" />
                        <span className="text-[12px] font-medium">Resume on file</span>
                      </button>
                    )}
                  </div>

                  {app.skills && app.skills.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1 border-t border-[var(--adm-line-soft)] pt-3">
                      {app.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className={skillChip}>{skill}</span>
                      ))}
                      {app.skills.length > 4 && (
                        <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                          +{app.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {adder && (
                    <div className="mt-3 flex items-center gap-1.5 border-t border-[var(--adm-line-soft)] pt-3">
                      <Avatar name={adder.name} size="xs" />
                      <span className="truncate text-[12px] text-[var(--adm-ink-subtle)]">Added by</span>
                      <span className="truncate text-[12px] font-medium text-[var(--adm-ink-mute)]">{adder.name}</span>
                      {adder.role && (
                        <span className="ml-auto rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--adm-ink-mute)]">
                          {adder.role}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between gap-2 border-t border-[var(--adm-line-soft)] pt-3">
                    <div className="flex items-center gap-2">
                      <StarRating rating={app.rating || 0} onRate={(n) => void handleRatingChange(app.id, n)} />
                      {age !== null && (
                        <span className="text-[11px] tabular-nums text-[var(--adm-ink-subtle)]">{age}d</span>
                      )}
                    </div>
                    <div className="flex items-center gap-0.5">
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
        ) : (
          <div>
            <EmptyState
              icon={IconBoxes}
              variant={emptyFresh ? "fresh" : "filtered"}
              title={emptyTitle}
              description={emptyDescription}
              action={emptyFresh
                ? <WorkspaceButton variant="primary" onClick={handleCreateNew}><Plus className="h-4 w-4" />Add profile</WorkspaceButton>
                : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>}
            />
          </div>
        )
      )}
      </Workspace>
    </div>
  );
}

// ── row action button ────────────────────────────────────────────────────────

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
    "rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors",
    danger
      ? "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]"
      : "hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]",
  );
  return href ? (
    <a href={href} title={label} aria-label={label} className={cls}>{children}</a>
  ) : (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>{children}</button>
  );
}
