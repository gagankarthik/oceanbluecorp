"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import {
  IconDownload, IconEye, IconFile, IconSuccess, IconTrash, IconUpload,
  IconWarning,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { findDuplicateGroups, type DuplicateGroup } from "@/lib/resume-duplicates";
import type { IndexJobPhase } from "@/lib/index-job";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, BrandBand, BAND_PRIMARY, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { FormInput } from "@/components/admin/forms/primitives";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminDialog } from "@/components/admin/admin-dialog";
import { AdminRowsSkeleton } from "@/components/admin/skeletons";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";
import { Empty as Blank } from "@/components/admin/list-panel";

// ── types ────────────────────────────────────────────────────────────────────

interface BankResume {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  candidateName?: string;
  uploaderEmail: string;
  uploadedAt: string;
  indexed?: boolean;        // in the matching bank (searchable) yet?
  indexing?: boolean;       // client-side: an index request is in flight
  indexFailed?: boolean;    // client-side: last index attempt failed (retryable)
}

type UploadStatus = "pending" | "uploading" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  candidateName: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

type ViewMode = "grid" | "list";
type FileTypeFilter = "all" | "pdf" | "word";
type StatusFilter = "all" | "indexed" | "pending" | "failed" | "duplicates";

/** A bank row as the duplicate rules see it (lib/resume-duplicates). */
type DupRef = { key: string; fileName: string; size: number; uploadedAt: number; indexed?: boolean; row: BankResume };

/** GET /api/resume-bank/index-all */
interface IndexJobStatus {
  phase: IndexJobPhase;
  remaining: number;
  total: number;
  startedAt: string | null;
  updatedAt: string | null;
  failed: { id: string; error: string }[];
}

// ── config ───────────────────────────────────────────────────────────────────

const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 5 * 1024 * 1024;

const TYPE_TABS: { key: FileTypeFilter; label: string }[] = [
  { key: "all",  label: "All" },
  { key: "pdf",  label: "PDF" },
  { key: "word", label: "Word" },
];

function isPdf(type: string) { return type === "application/pdf"; }
function isWord(type: string) { return type === "application/msword" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; }
function formatLabel(type: string) { return isPdf(type) ? "PDF" : isWord(type) ? "Word" : "Other"; }

/** Byte size for a file listing. No shared equivalent, resumes is the only screen weighing files. */
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format mark: a small text chip, not a tinted tile. */
function FileTypeTag({ type }: { type: string }) {
  return (
    <span className="inline-flex h-[22px] flex-none items-center rounded-[var(--adm-radius-chip)] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] px-1.5 text-[12px] font-medium text-[var(--adm-ink-mute)]">
      {formatLabel(type)}
    </span>
  );
}

/** Icon-only row action. Same hit area whether it previews, downloads or deletes. */
function IconAction({
  label,
  danger = false,
  onClick,
  children,
}: {
  label: string;
  danger?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink-subtle)] transition-colors",
        danger
          ? "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
          : "hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
      )}
    >
      {children}
    </button>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function ResumeBankPage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes]     = useState<BankResume[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  // Skeleton on first load only; later reloads keep the list on screen.
  const loadedOnce = useRef(false);
  useEffect(() => { if (!loading && !error) loadedOnce.current = true; }, [loading, error]);

  const [queue, setQueue]         = useState<QueueItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [view, setView]             = useState<ViewMode>("list");
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [uploaderFilter, setUploaderFilter] = useState("all");

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      if (!loadedOnce.current) setLoading(true);
      setError(null);
      const res = await fetch("/api/resume-bank");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load");
      setResumes(data.resumes || []);
    } catch (e) {
      console.error("Failed to load the resume bank:", e);
      setError("Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  /** Re-fetch without flashing the skeleton, used by the cloud-indexing poll. */
  const refreshSilently = useCallback(async () => {
    try {
      const res = await fetch("/api/resume-bank");
      const data = await res.json();
      if (res.ok) setResumes(data.resumes || []);
    } catch { /* transient, keep showing the last data */ }
  }, []);

  // ── derived ───────────────────────────────────────────────────────────────

  const uploaders = useMemo(() => [...new Set(resumes.map(r => r.uploaderEmail))], [resumes]);

  // ── cloud indexing ────────────────────────────────────────────────────────
  // "Index all" runs server-side as a self-chaining background job (see
  // /api/resume-bank/index-all). Its stored state is the source of truth for
  // progress, failures and whether the chain is alive; polled while it runs.

  const [job, setJob] = useState<IndexJobStatus | null>(null);
  const [jobAction, setJobAction] = useState<null | "start" | "retry" | "stop">(null);
  const loadJob = useCallback(async () => {
    try {
      const res = await fetch("/api/resume-bank/index-all");
      if (res.ok) setJob(await res.json());
    } catch { /* transient, keep the last state */ }
  }, []);
  useEffect(() => { void loadJob(); }, [loadJob]);

  const jobBusy = job?.phase === "running" || job?.phase === "stopping";
  useEffect(() => {
    if (!jobBusy) return;
    const timer = setInterval(() => { void loadJob(); void refreshSilently(); }, 10_000);
    return () => clearInterval(timer);
  }, [jobBusy, loadJob, refreshSilently]);

  // A run just ended: one last refresh so the Indexed column is final.
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !jobBusy) {
      void refreshSilently();
      if (job?.phase === "finished") {
        toast.success(job.failed.length ? `Indexing finished. ${job.failed.length} couldn’t be indexed.` : "Indexing finished. Everything is searchable.");
      }
    }
    wasBusy.current = jobBusy;
  }, [jobBusy, job, refreshSilently]);

  /** Why the last cloud run failed each bank file, by S3 key. */
  const serverFailures = useMemo(
    () => new Map((job?.failed ?? []).filter((f) => f.id.startsWith("resume-bank/")).map((f) => [f.id, f.error])),
    [job],
  );
  const appFailureCount = (job?.failed ?? []).filter((f) => !f.id.startsWith("resume-bank/")).length;

  // ── duplicates ────────────────────────────────────────────────────────────
  // Same file name and byte size = the same resume uploaded twice. One copy per
  // group is kept and indexed (the indexed copy, else the oldest; the rule is
  // shared with the server), and the extras are offered for deletion.

  const dupGroups = useMemo(
    () => findDuplicateGroups<DupRef>(resumes.map((r) => ({
      key: r.fileKey, fileName: r.fileName, size: r.fileSize, uploadedAt: Date.parse(r.uploadedAt) || 0, indexed: r.indexed, row: r,
    }))),
    [resumes],
  );
  const dupRole = useMemo(() => {
    const m = new Map<string, "keeper" | "extra">();
    for (const g of dupGroups) {
      m.set(g.keeper.key, "keeper");
      for (const e of g.extras) m.set(e.key, "extra");
    }
    return m;
  }, [dupGroups]);
  const extraCount = dupRole.size - dupGroups.length;
  const isExtra = useCallback((r: BankResume) => dupRole.get(r.fileKey) === "extra", [dupRole]);
  const isFailed = useCallback(
    (r: BankResume) => !r.indexed && !r.indexing && (!!r.indexFailed || serverFailures.has(r.fileKey)),
    [serverFailures],
  );

  /** What still needs indexing: unindexed files that aren't an extra copy. */
  const pendingIndex = useMemo(() => resumes.filter((r) => !r.indexed && !isExtra(r)), [resumes, isExtra]);
  const failedRows = useMemo(() => resumes.filter(isFailed), [resumes, isFailed]);
  const pendingNotFailed = pendingIndex.length - failedRows.filter((r) => !isExtra(r)).length;

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const matchesStatus = useCallback((r: BankResume, f: StatusFilter) => {
    if (f === "indexed") return !!r.indexed;
    if (f === "pending") return !r.indexed && !isExtra(r) && !isFailed(r);
    if (f === "failed") return isFailed(r);
    if (f === "duplicates") return dupRole.has(r.fileKey);
    return true;
  }, [isExtra, isFailed, dupRole]);

  const filtered = useMemo(() => resumes.filter(r => {
    const q = search.toLowerCase();
    if (q && ![ r.fileName, r.candidateName, r.uploaderEmail ].some(f => f?.toLowerCase().includes(q))) return false;
    if (typeFilter === "pdf"  && !isPdf(r.fileType))  return false;
    if (typeFilter === "word" && !isWord(r.fileType)) return false;
    if (uploaderFilter !== "all" && r.uploaderEmail !== uploaderFilter) return false;
    if (!matchesStatus(r, statusFilter)) return false;
    return true;
  }), [resumes, search, typeFilter, uploaderFilter, statusFilter, matchesStatus]);

  const typeCounts = useMemo(() => ({
    all:  resumes.length,
    pdf:  resumes.filter(r => isPdf(r.fileType)).length,
    word: resumes.filter(r => isWord(r.fileType)).length,
  }), [resumes]);

  // ── upload queue ──────────────────────────────────────────────────────────

  const addFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const valid: QueueItem[] = [];
    for (const file of arr) {
      if (!ALLOWED.includes(file.type)) continue;
      if (file.size > MAX_SIZE) continue;
      valid.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        candidateName: "",
        status: "pending",
        progress: 0,
      });
    }
    if (valid.length) {
      setQueue(q => [...q, ...valid]);
      setPanelOpen(true);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragActive(true); };
  const handleDragLeave = () => setDragActive(false);

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) =>
    setQueue(q => q.map(item => item.id === id ? { ...item, ...patch } : item));

  const uploadOne = async (item: QueueItem): Promise<void> => {
    updateQueueItem(item.id, { status: "uploading", progress: 10 });
    try {
      // Send the file as a raw binary body with metadata in headers (not multipart/form-data):
      // Amplify's SSR compute layer drops the multipart boundary, breaking request.formData().
      const res = await fetch("/api/resume-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(item.file.name),
          "x-file-type": item.file.type || "application/octet-stream",
          "x-uploaded-by": encodeURIComponent(user?.email || "recruiter"),
          ...(item.candidateName ? { "x-candidate-name": encodeURIComponent(item.candidateName) } : {}),
        },
        body: item.file,
      });
      updateQueueItem(item.id, { progress: 80 });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      updateQueueItem(item.id, { status: "done", progress: 100 });
    } catch (e) {
      updateQueueItem(item.id, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
    }
  };

  const uploadAll = async () => {
    const pending = queue.filter(q => q.status === "pending");
    await Promise.all(pending.map(uploadOne));
    await load();
  };

  const clearDone = () => setQueue(q => q.filter(item => item.status !== "done"));
  const removeFromQueue = (id: string) => setQueue(q => q.filter(item => item.id !== id));

  // ── record actions ────────────────────────────────────────────────────────

  const getDownloadUrl = async (id: string): Promise<string | null> => {
    const res = await fetch(`/api/resume-bank/${id}`);
    const data = await res.json();
    if (!res.ok) { toast.error("Failed to get download link"); return null; }
    return data.downloadUrl;
  };

  const handleDownload = async (r: BankResume) => {
    const url = await getDownloadUrl(r.id);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url; a.download = r.fileName; a.click();
  };

  const handlePreview = async (r: BankResume) => {
    if (!isPdf(r.fileType)) { handleDownload(r); return; }
    const url = await getDownloadUrl(r.id);
    if (!url) return;
    setPreviewUrl(url);
    setPreviewName(r.fileName);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/resume-bank/${deleteId}`, { method: "DELETE" });
    if (res.ok) setResumes(p => p.filter(r => r.id !== deleteId));
    else toast.error("Couldn’t delete the resume. Try again.");
    setDeleteId(null);
    setDeleting(false);
  };

  /** Bulk delete (the duplicate cleanup), 500 keys per request. True when all went. */
  const deleteKeys = async (keys: string[]): Promise<boolean> => {
    const deleted: string[] = [];
    let failed = 0;
    for (let i = 0; i < keys.length; i += 500) {
      const chunk = keys.slice(i, i + 500);
      try {
        const res = await fetch("/api/resume-bank/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileKeys: chunk }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { failed += chunk.length; continue; }
        deleted.push(...(data.deleted || []));
        failed += (data.failed || []).length;
      } catch {
        failed += chunk.length;
      }
    }
    const gone = new Set(deleted);
    setResumes((p) => p.filter((r) => !gone.has(r.fileKey)));
    if (deleted.length) toast.success(`Deleted ${deleted.length} extra ${deleted.length === 1 ? "copy" : "copies"}`);
    if (failed) toast.error(`${failed} ${failed === 1 ? "file" : "files"} couldn’t be deleted. Try again.`);
    return failed === 0;
  };

  const [dupOpen, setDupOpen] = useState(false);

  const exportCSV = () => downloadCsv(
    "resumes",
    ["File", "Format", "Candidate", "Uploaded By", "Size", "Uploaded"],
    filtered.map((r) => [
      r.fileName,
      formatLabel(r.fileType),
      r.candidateName || "",
      r.uploaderEmail,
      fmtSize(r.fileSize || 0),
      fmtDate(r.uploadedAt),
    ]),
  );

  const { monthCount, unnamedCount, storageUsed } = useMemo(() => {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    return {
      monthCount:  resumes.filter((r) => new Date(r.uploadedAt).getTime() >= start.getTime()).length,
      unnamedCount: resumes.filter((r) => !r.candidateName?.trim()).length,
      storageUsed: fmtSize(resumes.reduce((s, r) => s + (r.fileSize || 0), 0)),
    };
  }, [resumes]);

  const [rows, setRows] = useLocalStorage<number>("adm.resumes.rows", 25);

  const hasActiveFilters = typeFilter !== "all" || uploaderFilter !== "all" || search.trim() !== "" || statusFilter !== "all";
  const clearFilters = () => { setTypeFilter("all"); setUploaderFilter("all"); setSearch(""); setStatusFilter("all"); };

  const pendingCount = queue.filter(q => q.status === "pending").length;
  const anyUploading = queue.some(q => q.status === "uploading");

  // ── grid columns ──────────────────────────────────────────────────────────

  const rowActions = (r: BankResume) => (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-0.5">
      <IconAction label={`Preview ${r.fileName}`} onClick={() => handlePreview(r)}>
        <IconEye className="h-4 w-4" aria-hidden="true" />
      </IconAction>
      <IconAction label={`Download ${r.fileName}`} onClick={() => handleDownload(r)}>
        <IconDownload className="h-4 w-4" aria-hidden="true" />
      </IconAction>
      <IconAction label={`Delete ${r.fileName}`} danger onClick={() => setDeleteId(r.id)}>
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </IconAction>
    </div>
  );

  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });

  // Parse + index a set of resumes so they become searchable (Lead Sourcing /
  // Best candidates). Limited concurrency, one short request per resume, live
  // per-row status; failures are isolated and retryable.
  const indexKeys = useCallback(
    async (targets: BankResume[]) => {
      if (targets.length === 0 || bulkRunning) return;
      const ids = new Set(targets.map((t) => t.id));
      setResumes((prev) => prev.map((x) => (ids.has(x.id) ? { ...x, indexing: true, indexFailed: false } : x)));
      setBulkRunning(true);
      setBulkProgress({ done: 0, total: targets.length });

      let cursor = 0;
      let done = 0;
      const worker = async () => {
        while (cursor < targets.length) {
          const r = targets[cursor++];
          try {
            const res = await fetch("/api/resume-bank/index", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fileKeys: [r.fileKey] }),
            });
            const data = await res.json().catch(() => ({}));
            const ok = res.ok && data?.results?.[r.fileKey]?.indexed;
            setResumes((prev) =>
              prev.map((x) => (x.id === r.id ? { ...x, indexing: false, indexed: !!ok, indexFailed: !ok } : x)),
            );
          } catch {
            setResumes((prev) => prev.map((x) => (x.id === r.id ? { ...x, indexing: false, indexFailed: true } : x)));
          } finally {
            done += 1;
            setBulkProgress({ done, total: targets.length });
          }
        }
      };
      await Promise.all(Array.from({ length: Math.min(3, targets.length) }, worker));
      setBulkRunning(false);
    },
    [bulkRunning],
  );

  const startIndexing = useCallback(async (retryFailed = false) => {
    setJobAction(retryFailed ? "retry" : "start");
    try {
      const res = await fetch("/api/resume-bank/index-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retryFailed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Couldn’t start indexing");
      if (data.alreadyRunning) toast.info(data.message || "Indexing is already running in the cloud");
      else if (!data.started) toast.success(data.message || "Everything is already indexed");
      else toast.success(`Indexing started: ${(data.bank || 0) + (data.applications || 0)} resumes queued`);
      if (!data.started) void refreshSilently();
      await loadJob();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn’t start indexing");
    } finally {
      setJobAction(null);
    }
  }, [loadJob, refreshSilently]);

  const stopIndexing = useCallback(async () => {
    setJobAction("stop");
    try {
      const res = await fetch("/api/resume-bank/index-all", { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.info("Stopping after the current batch. Files already indexed stay searchable.");
      await loadJob();
    } catch {
      toast.error("Couldn’t stop indexing. Try again.");
    } finally {
      setJobAction(null);
    }
  }, [loadJob]);

  const columns: DataTableColumn<BankResume>[] = [
    {
      key: "fileName", header: "File", sortValue: (r) => r.fileName,
      cell: (r) => (
        <span className="inline-flex max-w-full items-center gap-2 align-middle">
          <span className="min-w-0 truncate font-semibold text-[var(--adm-ink)]" title={r.fileName}>{r.fileName}</span>
          <DupChip role={dupRole.get(r.fileKey)} />
        </span>
      ),
    },
    {
      key: "type", header: "Type", sortValue: (r) => formatLabel(r.fileType), hideBelow: "md",
      cell: (r) => <FileTypeTag type={r.fileType} />,
    },
    {
      key: "candidate", header: "Candidate", sortValue: (r) => r.candidateName || "", hideBelow: "md",
      cell: (r) => r.candidateName
        ? <span className="font-medium text-[var(--adm-ink)]">{r.candidateName}</span>
        : <Blank />,
    },
    {
      key: "uploader", header: "Uploaded by", sortValue: (r) => r.uploaderEmail, hideBelow: "lg",
      cell: (r) => (
        <span className="inline-flex max-w-full items-center gap-2 align-middle">
          <Avatar email={r.uploaderEmail} size="xs" />
          <span className="min-w-0 truncate text-[13px] text-[var(--adm-ink-mute)]">{r.uploaderEmail}</span>
        </span>
      ),
    },
    {
      key: "size", header: "Size", align: "right", sortValue: (r) => r.fileSize || 0, hideBelow: "sm",
      cell: (r) => <span className="tabular-nums text-[var(--adm-ink-mute)]">{fmtSize(r.fileSize || 0)}</span>,
    },
    {
      key: "uploadedAt", header: "Uploaded", sortValue: (r) => new Date(r.uploadedAt).getTime(), hideBelow: "sm",
      cell: (r) => <span className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">{fmtDate(r.uploadedAt)}</span>,
    },
    {
      key: "indexed", header: "Indexed", hideBelow: "sm",
      sortValue: (r) => (r.indexed ? 3 : isExtra(r) ? 2 : isFailed(r) ? 0 : 1),
      cell: (r) =>
        r.indexing ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--adm-ink-mute)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Indexing…
          </span>
        ) : r.indexed ? (
          <StatusBadge tone="emerald" label="Indexed" />
        ) : isExtra(r) ? (
          <span className="text-[13px] text-[var(--adm-ink-subtle)]" title="Another copy of this file is kept and indexed">Skipped, extra copy</span>
        ) : isFailed(r) ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void indexKeys([r]); }}
            disabled={bulkRunning || jobBusy}
            title={serverFailures.get(r.fileKey) || "The last attempt failed"}
            className="inline-flex h-[22px] items-center gap-1.5 rounded-full bg-[var(--adm-danger-soft)] px-2 text-[12px] font-medium text-[var(--adm-danger-ink)] transition-[filter] hover:brightness-95 disabled:opacity-50"
          >
            Failed · Retry
          </button>
        ) : (
          <span className="text-[13px] text-[var(--adm-ink-subtle)]">Not indexed</span>
        ),
    },
    {
      key: "actions", header: "", align: "right",
      cell: (r) => rowActions(r),
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────

  const emptyFresh = resumes.length === 0;
  const emptyProps = {
    icon: IconFile,
    title: emptyFresh ? "No resumes yet" : "No files match your filters",
    description: emptyFresh
      ? "Drop files anywhere on this page, or choose Upload above."
      : "Try adjusting your search or filters.",
    // The header already carries the one filled Upload action.
    action: emptyFresh
      ? <WorkspaceButton onClick={() => fileInputRef.current?.click()}><IconUpload className="h-4 w-4" />Choose files</WorkspaceButton>
      : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>,
  };

  return (
    <div
      className={cn(
        "flex flex-col pb-6",
        dragActive && "rounded-[var(--adm-radius-card)] outline outline-2 outline-offset-4 outline-[var(--adm-accent)]",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx"
        onChange={handleFileInput} className="hidden" />

      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--adm-scrim)] p-4">
          <div className="w-full max-w-sm rounded-[var(--adm-radius-card)] border border-dashed border-[var(--adm-accent)] bg-[var(--adm-surface)] px-6 py-10 text-center shadow-[var(--adm-shadow-lg)]">
            <IconUpload className="mx-auto mb-3 h-6 w-6 text-[var(--adm-accent)]" strokeWidth={1.75} />
            <p className="text-[16px] font-semibold text-[var(--adm-ink)]">Drop resumes to upload</p>
            <p className="mt-1 text-[13px] text-[var(--adm-ink-mute)]">PDF or Word &middot; up to 5MB each</p>
          </div>
        </div>
      )}

      <BrandBand
        size="sm"
        className="mb-3"
        title="Resume bank"
        meta={`${resumes.length.toLocaleString()} resume${resumes.length === 1 ? "" : "s"} on file`}
        stats={[
          { label: "Resumes", value: resumes.length },
          { label: "Indexed", value: `${resumes.filter((r) => r.indexed).length}/${resumes.length - extraCount}`,
            hint: "Searchable in Lead Sourcing / Best candidates. Extra copies of duplicates are not indexed." },
          { label: "This month", value: monthCount },
          { label: "No candidate name", value: unnamedCount,
            hint: "No candidate name recorded" },
          { label: "Storage", value: storageUsed },
        ]}
        actions={
          <>
            <WorkspaceButton onClick={exportCSV} disabled={filtered.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {/* Yields the filled style to the queue's commit button while files wait. */}
            <WorkspaceButton className={BAND_PRIMARY} onClick={() => fileInputRef.current?.click()}>
              <IconUpload className="h-4 w-4" />Upload
            </WorkspaceButton>
          </>
        }
      />

      {panelOpen && queue.length > 0 && (
        <AdminCard className="mb-4">
          <AdminCardHeader
            title="Upload queue"
            count={queue.length}
            action={
              <>
                {queue.some(q => q.status === "done") && (
                  <WorkspaceButton variant="ghost" onClick={clearDone}>
                    Clear done
                  </WorkspaceButton>
                )}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  aria-label="Close upload queue"
                  className="grid h-8 w-8 place-items-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </>
            }
          />

          <div className="max-h-[420px] divide-y divide-[var(--adm-line-soft)] overflow-y-auto">
            {queue.map(item => (
              <div key={item.id} className="flex items-start gap-3 px-4 py-3">
                <FileTypeTag type={item.file.type} />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="min-w-0 truncate text-[14px] font-medium text-[var(--adm-ink)]">{item.file.name}</p>
                    <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtSize(item.file.size)}</span>
                    {item.status === "done"      && <IconSuccess className="h-4 w-4 flex-none text-[var(--adm-success-ink)]" aria-label="Uploaded" />}
                    {item.status === "uploading" && <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-accent)]" aria-label="Uploading" />}
                    {item.status === "error"     && <IconWarning className="h-4 w-4 flex-none text-[var(--adm-danger-ink)]" aria-label="Failed" />}
                  </div>

                  {item.status === "pending" && (
                    <FormInput
                      aria-label={`Candidate name for ${item.file.name}`}
                      placeholder="Candidate name (optional)"
                      value={item.candidateName}
                      onChange={e => updateQueueItem(item.id, { candidateName: e.target.value })}
                      className="mt-2 h-9 text-[13.5px]"
                    />
                  )}

                  {item.status === "uploading" && (
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--adm-surface-2)]">
                      <div className="h-full rounded-full bg-[var(--adm-accent)] transition-[width] duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}

                  {item.status === "error" && <p className="mt-1 text-[12.5px] text-[var(--adm-danger-ink)]">{item.error}</p>}
                  {item.status === "done"  && <p className="mt-1 text-[12.5px] font-medium text-[var(--adm-success-ink)]">Uploaded</p>}
                </div>

                {item.status !== "uploading" && item.status !== "done" && (
                  <IconAction label={`Remove ${item.file.name} from queue`} danger onClick={() => removeFromQueue(item.id)}>
                    <X className="h-4 w-4" aria-hidden="true" />
                  </IconAction>
                )}
              </div>
            ))}
          </div>

          {(pendingCount > 0 || anyUploading) && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-b-[16px] border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 py-3">
              <p className="text-[13px] tabular-nums text-[var(--adm-ink-mute)]">
                {pendingCount > 0 ? `${pendingCount} file${pendingCount > 1 ? "s" : ""} ready to upload` : "Uploading…"}
              </p>
              <WorkspaceButton variant="primary" onClick={uploadAll} disabled={anyUploading || pendingCount === 0}>
                {anyUploading && <Loader2 className="animate-spin" aria-hidden="true" />}
                {anyUploading ? "Uploading…" : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
              </WorkspaceButton>
            </div>
          )}
        </AdminCard>
      )}

      <WorkspaceToolbar
          variant="canvas"
          search={
            <WorkspaceSearch
              value={search}
              onChange={setSearch}
              placeholder="Filter resumes by file name or candidate"
            />
          }
          trailing={
            <DisplayMenu
              view={view}
              viewOptions={[
                { value: "list", label: "List" },
                { value: "grid", label: "Grid" },
              ]}
              onViewChange={(v) => setView(v as ViewMode)}
              rows={rows}
              onRowsChange={setRows}
              onReset={() => { setRows(25); setView("list"); }}
            />
          }
        >
          <FilterPill
            label="Type"
            icon={FilterIcon.type}
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_TABS.map((t) => ({ value: t.key, label: t.label, count: typeCounts[t.key] }))}
          />
          <FilterPill
            label="Uploaded by"
            icon={FilterIcon.person}
            value={uploaderFilter}
            onChange={setUploaderFilter}
            options={[
              { value: "all", label: "All recruiters", count: resumes.length },
              ...uploaders.map((u) => ({
                value: u,
                label: u,
                count: resumes.filter((r) => r.uploaderEmail === u).length,
              })),
            ]}
          />
          <FilterPill
            label="Status"
            icon={FilterIcon.status}
            value={statusFilter}
            onChange={setStatusFilter}
            options={STATUS_OPTIONS.map((o) => ({ value: o.key, label: o.label, count: resumes.filter((r) => matchesStatus(r, o.key)).length }))}
          />
      </WorkspaceToolbar>

      <ActiveFilters
        variant="canvas"
        chips={[
          ...(typeFilter !== "all"
            ? [{ label: `Type: ${TYPE_TABS.find((t) => t.key === typeFilter)?.label ?? typeFilter}`, onClear: () => setTypeFilter("all") }]
            : []),
          ...(uploaderFilter !== "all"
            ? [{ label: `Uploaded by: ${uploaderFilter}`, onClear: () => setUploaderFilter("all") }]
            : []),
          ...(statusFilter !== "all"
            ? [{ label: `Status: ${STATUS_OPTIONS.find((o) => o.key === statusFilter)?.label ?? statusFilter}`, onClear: () => setStatusFilter("all") }]
            : []),
        ]}
        onClearAll={clearFilters}
      />

      {/* ── indexing notices ── */}
      {!loading && !error && job && jobBusy && (
        <Notice
          tone="accent"
          icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />}
          action={job.phase === "running" && (
            <WorkspaceButton variant="ghost" onClick={stopIndexing} disabled={jobAction !== null}>Stop</WorkspaceButton>
          )}
        >
          <p className="font-medium text-[var(--adm-ink)]">
            {job.phase === "stopping"
              ? "Stopping after the current batch…"
              : <>Indexing in the cloud: <span className="tabular-nums">{Math.max(0, job.total - job.remaining).toLocaleString()}</span> of <span className="tabular-nums">{job.total.toLocaleString()}</span> done</>}
          </p>
          <Progress value={job.total ? (job.total - job.remaining) / job.total : 0} />
          <p className="mt-1.5 text-[13px] text-[var(--adm-ink-mute)]">
            <span className="tabular-nums">{job.remaining.toLocaleString()}</span> left
            {job.updatedAt && <> · last activity {fmtRelative(job.updatedAt)}</>}
            {job.failed.length > 0 && <> · <span className="text-[var(--adm-danger-ink)]">{job.failed.length} failed so far</span></>}
            . Runs on the server, so you can close this page.
          </p>
        </Notice>
      )}
      {!loading && !error && job?.phase === "stalled" && (
        <Notice
          tone="warning"
          icon={<IconWarning className="h-4 w-4 text-[var(--adm-warning-ink)]" aria-hidden="true" />}
          action={
            <WorkspaceButton onClick={() => startIndexing()} disabled={jobAction !== null}>
              {jobAction === "start" && <Loader2 className="animate-spin" aria-hidden="true" />}Resume indexing
            </WorkspaceButton>
          }
        >
          <p className="font-medium text-[var(--adm-ink)]">
            Indexing stopped responding with <span className="tabular-nums">{job.remaining.toLocaleString()}</span> of{" "}
            <span className="tabular-nums">{job.total.toLocaleString()}</span> left.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            No activity {job.updatedAt ? `since ${fmtRelative(job.updatedAt)}` : "for a while"}. Resume picks up where it stopped; files already indexed are skipped.
          </p>
        </Notice>
      )}
      {!loading && !error && !jobBusy && bulkRunning && (
        <Notice icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />}>
          <p className="text-[var(--adm-ink)]">
            Indexing resumes… <span className="tabular-nums">{bulkProgress.done}/{bulkProgress.total}</span>. You can keep working.
          </p>
        </Notice>
      )}
      {!loading && !error && !jobBusy && job?.phase !== "stalled" && !bulkRunning && (failedRows.length > 0 || appFailureCount > 0) && (
        <Notice
          tone="warning"
          icon={<IconWarning className="h-4 w-4 text-[var(--adm-warning-ink)]" aria-hidden="true" />}
          action={
            <>
              {failedRows.length > 0 && statusFilter !== "failed" && (
                <WorkspaceButton variant="ghost" onClick={() => setStatusFilter("failed")}>Show failed</WorkspaceButton>
              )}
              {(job?.failed.length ?? 0) > 0 && (
                <WorkspaceButton onClick={() => startIndexing(true)} disabled={jobAction !== null}>
                  {jobAction === "retry" && <Loader2 className="animate-spin" aria-hidden="true" />}Retry failed
                </WorkspaceButton>
              )}
            </>
          }
        >
          <p className="text-[var(--adm-ink)]">
            <span className="font-semibold tabular-nums">{failedRows.length}</span>{" "}
            {failedRows.length === 1 ? "resume" : "resumes"} couldn’t be indexed
            {appFailureCount > 0 && <>, plus <span className="tabular-nums">{appFailureCount}</span> bench and applicant {appFailureCount === 1 ? "resume" : "resumes"}</>}.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Usually a scanned PDF with no readable text, or a damaged file. Hover <span className="font-medium">Failed</span> in the Indexed column to see why.
          </p>
        </Notice>
      )}
      {!loading && !error && !jobBusy && job?.phase !== "stalled" && !bulkRunning && pendingNotFailed > 0 && (
        <Notice
          tone="accent"
          action={
            <WorkspaceButton onClick={() => startIndexing()} disabled={jobAction !== null}>
              {jobAction === "start" && <Loader2 className="animate-spin" aria-hidden="true" />}Index all
            </WorkspaceButton>
          }
        >
          <p className="text-[var(--adm-ink)]">
            <span className="font-semibold tabular-nums">{pendingNotFailed}</span>{" "}
            {pendingNotFailed === 1 ? "resume isn’t" : "resumes aren’t"} searchable yet.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Index them to include them in Lead Sourcing and Best candidates. It runs in the cloud; indexed files and extra copies are skipped.
          </p>
        </Notice>
      )}
      {/* Same name + size uploaded more than once: one copy is kept, the extras should go. */}
      {!loading && !error && dupGroups.length > 0 && (
        <Notice
          tone="warning"
          icon={<IconWarning className="h-4 w-4 text-[var(--adm-warning-ink)]" aria-hidden="true" />}
          action={
            <>
              {statusFilter !== "duplicates" && (
                <WorkspaceButton variant="ghost" onClick={() => setStatusFilter("duplicates")}>Show in list</WorkspaceButton>
              )}
              <WorkspaceButton onClick={() => setDupOpen(true)}>Review duplicates</WorkspaceButton>
            </>
          }
        >
          <p className="text-[var(--adm-ink)]">
            <span className="font-semibold tabular-nums">{dupGroups.length}</span>{" "}
            {dupGroups.length === 1 ? "resume was" : "resumes were"} uploaded more than once:{" "}
            <span className="font-semibold tabular-nums">{extraCount}</span> extra {extraCount === 1 ? "copy" : "copies"}.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Matched on file name and size. One copy of each is kept and indexed; delete the extras so a candidate never appears twice in matches.
          </p>
        </Notice>
      )}

      {loading ? (
        <Workspace>
          <AdminRowsSkeleton rows={6} />
        </Workspace>
      ) : error ? (
        <Workspace>
          <EmptyState
            variant="error"
            title="Couldn't load the resume bank"
            description={error}
            action={<WorkspaceButton onClick={load}>Try again</WorkspaceButton>}
          />
        </Workspace>
      ) : view === "list" ? (
        <Workspace>
          <DataTable
            noun="resumes"
            storageKey="resumes"
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={handlePreview}
            pageSize={rows}
            onPageSizeChange={setRows}
            initialSort={{ key: "uploadedAt", dir: "desc" }}
            empty={emptyProps}
          />
        </Workspace>
      ) : filtered.length === 0 ? (
        <AdminCard>
          <EmptyState variant={emptyFresh ? "fresh" : "filtered"} {...emptyProps} />
        </AdminCard>
      ) : (
        // Grid view sits on the canvas: cards inside the table panel read as cards-in-a-card.
        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map(r => (
            <AdminCard key={r.id} hover className="group flex min-w-0 flex-col p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <FileTypeTag type={r.fileType} />
                  <DupChip role={dupRole.get(r.fileKey)} />
                </span>
                <div className="-my-1.5 -mr-1.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {rowActions(r)}
                </div>
              </div>

              <div className="mt-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handlePreview(r)}
                  className="block w-full truncate rounded-[var(--adm-radius-control)] text-left text-[14px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                  title={r.fileName}
                >
                  {r.fileName}
                </button>
                <p className="mt-0.5 truncate text-[13px] text-[var(--adm-ink-mute)]">
                  {r.candidateName || <span className="text-[var(--adm-ink-subtle)]">No candidate name</span>}
                </p>
              </div>

              <div className="mt-4 space-y-2 border-t border-[var(--adm-line-soft)] pt-3">
                <div className="flex min-w-0 items-center gap-2 text-[12.5px] text-[var(--adm-ink-mute)]">
                  <Avatar email={r.uploaderEmail} size="xs" />
                  <span className="truncate">{r.uploaderEmail}</span>
                </div>
                <div className="flex items-center justify-between text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                  <span>{fmtDate(r.uploadedAt)}</span>
                  <span>{fmtSize(r.fileSize || 0)}</span>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete resume?"
        body="This will permanently remove the file from storage."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <DuplicatesDialog
        open={dupOpen}
        onOpenChange={setDupOpen}
        groups={dupGroups}
        onPreview={(r) => handlePreview(r)}
        onDelete={deleteKeys}
      />

      <AdminDialog
        open={!!previewUrl}
        onOpenChange={(next) => { if (!next) { setPreviewUrl(null); setPreviewName(null); } }}
        title={<span className="block truncate">{previewName || "Resume preview"}</span>}
        size="xl"
        className="h-[calc(100dvh-2rem)] max-w-[min(1200px,calc(100vw-2rem))] sm:h-[calc(100dvh-3rem)]"
        bodyClassName="flex p-0 sm:p-0 overflow-hidden"
        actions={previewUrl && (
          <WorkspaceButton asChild>
            <a href={previewUrl} download={previewName || "resume"}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Download</span>
            </a>
          </WorkspaceButton>
        )}
      >
        {previewUrl && <iframe src={previewUrl} className="h-full w-full flex-1 border-0" title={previewName || "Resume preview"} />}
      </AdminDialog>
    </div>
  );
}

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "indexed", label: "Indexed" },
  { key: "pending", label: "Not indexed" },
  { key: "failed", label: "Failed" },
  { key: "duplicates", label: "Duplicates" },
];

/** Marks a file that has other copies: the one kept, or an extra to delete. */
function DupChip({ role }: { role?: "keeper" | "extra" }) {
  if (!role) return null;
  return role === "extra" ? (
    <span
      title="Same file name and size as a kept copy. Safe to delete."
      className="inline-flex h-[22px] flex-none items-center rounded-[var(--adm-radius-chip)] bg-[var(--adm-warning-soft)] px-1.5 text-[12px] font-medium text-[var(--adm-warning-ink)]"
    >
      Extra copy
    </span>
  ) : (
    <span
      title="Other copies of this file exist. This is the one kept and indexed."
      className="inline-flex h-[22px] flex-none items-center rounded-[var(--adm-radius-chip)] border border-[var(--adm-line)] px-1.5 text-[12px] font-medium text-[var(--adm-ink-mute)]"
    >
      Kept copy
    </span>
  );
}

function Progress({ value }: { value: number }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div className="mt-2 h-1.5 w-full max-w-[420px] overflow-hidden rounded-full bg-[var(--adm-surface-2)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-[var(--adm-accent)] transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Duplicate review: each group of same-name, same-size files with a choice of
 * which copy to keep (defaults to the indexed copy, else the oldest), and one
 * action that deletes every other copy.
 */
function DuplicatesDialog({
  open,
  onOpenChange,
  groups,
  onPreview,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: DuplicateGroup<DupRef>[];
  onPreview: (r: BankResume) => void;
  onDelete: (keys: string[]) => Promise<boolean>;
}) {
  const [keep, setKeep] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  // Fresh choices each time it opens.
  useEffect(() => {
    if (open) { setKeep({}); setConfirming(false); }
  }, [open]);

  const keeperOf = (g: DuplicateGroup<DupRef>) => keep[g.groupKey] ?? g.keeper.key;
  const toDelete = groups.flatMap((g) => g.files.filter((f) => f.key !== keeperOf(g)).map((f) => f.key));

  const run = async () => {
    setBusy(true);
    const ok = await onDelete(toDelete);
    setBusy(false);
    setConfirming(false);
    if (ok) onOpenChange(false);
  };

  return (
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      busy={busy}
      size="xl"
      title="Duplicate resumes"
      description={`${groups.length} ${groups.length === 1 ? "file was" : "files were"} uploaded more than once (same file name and size). Choose the copy to keep in each group; every other copy is deleted.`}
      bodyClassName="max-h-[60dvh] overflow-y-auto"
      footer={
        confirming ? (
          <>
            <p className="mr-auto text-[13px] text-[var(--adm-ink-mute)]">
              This permanently deletes <span className="font-semibold tabular-nums">{toDelete.length}</span> {toDelete.length === 1 ? "file" : "files"}. It can’t be undone.
            </p>
            <WorkspaceButton variant="ghost" onClick={() => setConfirming(false)} disabled={busy}>Back</WorkspaceButton>
            <WorkspaceButton variant="danger" onClick={run} disabled={busy}>
              {busy && <Loader2 className="animate-spin" aria-hidden="true" />}Delete {toDelete.length} {toDelete.length === 1 ? "file" : "files"}
            </WorkspaceButton>
          </>
        ) : (
          <>
            <WorkspaceButton variant="ghost" onClick={() => onOpenChange(false)}>Close</WorkspaceButton>
            <WorkspaceButton variant="danger" onClick={() => setConfirming(true)} disabled={toDelete.length === 0}>
              <IconTrash className="h-4 w-4" aria-hidden="true" />Delete {toDelete.length} extra {toDelete.length === 1 ? "copy" : "copies"}
            </WorkspaceButton>
          </>
        )
      }
    >
      <ul className="space-y-3">
        {groups.map((g) => {
          const kept = keeperOf(g);
          const keptFile = g.files.find((f) => f.key === kept);
          const losesIndexed = !keptFile?.indexed && g.files.some((f) => f.indexed);
          return (
            <li key={g.groupKey} className="overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)]">
              <div className="flex items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface-2)] px-4 py-2.5">
                <p className="min-w-0 truncate text-[14px] font-semibold text-[var(--adm-ink)]" title={g.keeper.fileName}>{g.keeper.fileName}</p>
                <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-mute)]">
                  {fmtSize(g.keeper.size)} · {g.files.length} copies
                </span>
              </div>
              <ul className="divide-y divide-[var(--adm-line-soft)]">
                {g.files.map((f) => {
                  const isKept = f.key === kept;
                  return (
                    <li key={f.key} className="flex items-center gap-3 px-4 py-2">
                      <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                        <input
                          type="radio"
                          name={g.groupKey}
                          checked={isKept}
                          onChange={() => setKeep((k) => ({ ...k, [g.groupKey]: f.key }))}
                          className="h-4 w-4 flex-none accent-[var(--adm-accent)]"
                          aria-label={`Keep the copy uploaded by ${f.row.uploaderEmail} on ${fmtDateTime(f.row.uploadedAt)}`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13.5px] text-[var(--adm-ink)]">
                            {f.row.candidateName || f.row.uploaderEmail}
                          </span>
                          <span className="block truncate text-[12.5px] text-[var(--adm-ink-subtle)]">
                            {f.row.candidateName ? `${f.row.uploaderEmail} · ` : ""}Uploaded {fmtDateTime(f.row.uploadedAt)}
                          </span>
                        </span>
                      </label>
                      <span className="hidden flex-none sm:block">
                        {f.indexed ? <StatusBadge tone="emerald" label="Indexed" /> : <span className="text-[12.5px] text-[var(--adm-ink-subtle)]">Not indexed</span>}
                      </span>
                      <span className={cn("w-14 flex-none text-right text-[12.5px] font-semibold", isKept ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-danger-ink)]")}>
                        {isKept ? "Keep" : "Delete"}
                      </span>
                      <IconAction label={`Preview ${f.fileName}`} onClick={() => onPreview(f.row)}>
                        <IconEye className="h-4 w-4" aria-hidden="true" />
                      </IconAction>
                    </li>
                  );
                })}
              </ul>
              {losesIndexed && (
                <p className="border-t border-[var(--adm-line-soft)] bg-[var(--adm-warning-soft)] px-4 py-2 text-[12.5px] text-[var(--adm-warning-ink)]">
                  The indexed copy will be deleted. Run Index all afterwards so this resume stays searchable.
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </AdminDialog>
  );
}

/** Canvas notice above the table: one line of state, an optional action. */
function Notice({
  tone = "neutral",
  icon,
  action,
  children,
}: {
  tone?: "neutral" | "accent" | "warning";
  icon?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "mb-3 flex flex-col gap-3 rounded-[var(--adm-radius-card)] border px-4 py-3 text-[14px] sm:flex-row sm:items-center sm:justify-between",
        tone === "accent" && "border-[var(--adm-line)] bg-[var(--adm-accent-tint)]",
        tone === "warning" && "border-[var(--adm-warning-soft)] bg-[var(--adm-warning-soft)]",
        tone === "neutral" && "border-[var(--adm-line)] bg-[var(--adm-surface)]",
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && <span className="mt-0.5 flex-none">{icon}</span>}
        <div className="min-w-0">{children}</div>
      </div>
      {action && <div className="flex flex-none items-center gap-2 self-start sm:self-center">{action}</div>}
    </div>
  );
}
