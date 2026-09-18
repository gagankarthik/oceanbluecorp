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
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, DisplayMenu, StatStrip,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { StatusBadge } from "@/components/admin/status-badge";
import { FormInput } from "@/components/admin/forms/primitives";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { AdminRowsSkeleton } from "@/components/admin/skeletons";
import { DataTable, type DataTableColumn } from "@/components/admin/data-table";

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

/** Placeholder for an empty cell, aligned with the other columns. */
function Blank() {
  return <span className="select-none text-[var(--adm-ink-subtle)]">&mdash;</span>;
}

/** Format mark: a small text chip, not a tinted tile. */
function FileTypeTag({ type }: { type: string }) {
  return (
    <span className="inline-flex h-[22px] flex-none items-center rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] px-1.5 text-[12px] font-medium text-[var(--adm-ink-mute)]">
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
        "grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors",
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
      setLoading(true);
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

  // ── duplicates ────────────────────────────────────────────────────────────
  // Same file name AND same byte size = the same resume uploaded twice. Only
  // one copy per group is indexed (server-side), so the extras just clutter
  // the bank and would show the candidate twice, flag them for deletion.

  const groupKeyOf = (r: BankResume) => `${r.fileName.toLowerCase()}|${r.fileSize}`;

  const dupGroups = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of resumes) counts.set(groupKeyOf(r), (counts.get(groupKeyOf(r)) || 0) + 1);
    return new Set([...counts].filter(([, n]) => n > 1).map(([k]) => k));
  }, [resumes]);

  const isDuplicate = useCallback((r: BankResume) => dupGroups.has(groupKeyOf(r)), [dupGroups]);
  const duplicateCount = useMemo(() => resumes.filter(isDuplicate).length, [resumes, isDuplicate]);
  const [showDupsOnly, setShowDupsOnly] = useState(false);

  /** Groups that already have a searchable copy, their unindexed extras don't count as work. */
  const indexedGroups = useMemo(
    () => new Set(resumes.filter((r) => r.indexed).map(groupKeyOf)),
    [resumes],
  );

  /** What actually still needs indexing: unindexed files that aren't a spare copy of an indexed one. */
  const pendingIndex = useMemo(
    () => resumes.filter((r) => !r.indexed && !(isDuplicate(r) && indexedGroups.has(groupKeyOf(r)))),
    [resumes, isDuplicate, indexedGroups],
  );

  const filtered = useMemo(() => resumes.filter(r => {
    const q = search.toLowerCase();
    if (q && ![ r.fileName, r.candidateName, r.uploaderEmail ].some(f => f?.toLowerCase().includes(q))) return false;
    if (typeFilter === "pdf"  && !isPdf(r.fileType))  return false;
    if (typeFilter === "word" && !isWord(r.fileType)) return false;
    if (uploaderFilter !== "all" && r.uploaderEmail !== uploaderFilter) return false;
    if (showDupsOnly && !isDuplicate(r)) return false;
    return true;
  }), [resumes, search, typeFilter, uploaderFilter, showDupsOnly, isDuplicate]);

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
    await fetch(`/api/resume-bank/${deleteId}`, { method: "DELETE" });
    setResumes(p => p.filter(r => r.id !== deleteId));
    setDeleteId(null);
    setDeleting(false);
  };

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

  const hasActiveFilters = typeFilter !== "all" || uploaderFilter !== "all" || search.trim() !== "" || showDupsOnly;
  const clearFilters = () => { setTypeFilter("all"); setUploaderFilter("all"); setSearch(""); setShowDupsOnly(false); };

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

  // ── cloud indexing ────────────────────────────────────────────────────────
  // "Index all" runs server-side as a self-chaining background job (see
  // /api/resume-bank/index-all), the old browser-driven loop died the moment
  // the tab closed, which for hundreds of resumes it always eventually did.
  // The flag persists so the progress banner survives a reload.

  const [cloudIndexing, setCloudIndexing] = useLocalStorage<boolean>("adm.resumes.cloudIndexing", false);
  const [cloudTotals, setCloudTotals] = useState<{ bank: number; applications: number } | null>(null);

  const startCloudIndexing = useCallback(async () => {
    try {
      const res = await fetch("/api/resume-bank/index-all", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(typeof data?.error === "string" ? data.error : "Failed to start indexing");
      if (data.alreadyRunning) {
        setCloudIndexing(true);
        toast.info(data.message || "Indexing is already running in the cloud");
        return;
      }
      if (!data.started) {
        toast.success(data.message || "Everything is already indexed");
        void refreshSilently();
        return;
      }
      setCloudTotals({ bank: data.bank || 0, applications: data.applications || 0 });
      setCloudIndexing(true);
      toast.success(`Indexing started in the cloud: ${(data.bank || 0) + (data.applications || 0)} resumes queued`);
      if (data.duplicateCopies > 0) {
        toast.warning(`${data.duplicateCopies} duplicate ${data.duplicateCopies === 1 ? "copy was" : "copies were"} skipped, review and delete them below`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to start indexing");
    }
  }, [refreshSilently, setCloudIndexing]);

  // Poll while the cloud job runs; each poll re-reads indexed flags.
  useEffect(() => {
    if (!cloudIndexing) return;
    const timer = setInterval(() => { void refreshSilently(); }, 12_000);
    return () => clearInterval(timer);
  }, [cloudIndexing, refreshSilently]);

  // The job is done (for this page's purposes) when nothing actionable is left
  // to index, skipped duplicate copies don't count as pending work.
  useEffect(() => {
    if (!cloudIndexing || loading) return;
    if (resumes.length > 0 && pendingIndex.length === 0) {
      setCloudIndexing(false);
      toast.success("All resumes are indexed and searchable");
    }
  }, [cloudIndexing, loading, resumes, pendingIndex, setCloudIndexing]);

  const columns: DataTableColumn<BankResume>[] = [
    {
      key: "fileName", header: "File", sortValue: (r) => r.fileName,
      cell: (r) => (
        <span className="inline-flex max-w-full items-center gap-2 align-middle">
          <span className="min-w-0 truncate font-semibold text-[var(--adm-ink)]" title={r.fileName}>{r.fileName}</span>
          {isDuplicate(r) && (
            <span className="inline-flex h-[22px] flex-none items-center rounded-[6px] bg-[var(--adm-warning-soft)] px-1.5 text-[12px] font-medium text-[var(--adm-warning-ink)]">
              Duplicate
            </span>
          )}
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
      key: "indexed", header: "Indexed", sortValue: (r) => (r.indexed ? 2 : r.indexFailed ? 0 : 1), hideBelow: "sm",
      cell: (r) =>
        r.indexing ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-[var(--adm-ink-mute)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Indexing…
          </span>
        ) : r.indexed ? (
          <StatusBadge tone="emerald" label="Indexed" />
        ) : r.indexFailed ? (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void indexKeys([r]); }}
            disabled={bulkRunning}
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
        dragActive && "rounded-[14px] outline outline-2 outline-offset-4 outline-[var(--adm-accent)]",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx"
        onChange={handleFileInput} className="hidden" />

      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[var(--adm-scrim)] p-4">
          <div className="w-full max-w-sm rounded-[14px] border border-dashed border-[var(--adm-accent)] bg-[var(--adm-surface)] px-6 py-10 text-center shadow-[var(--adm-shadow-lg)]">
            <IconUpload className="mx-auto mb-3 h-6 w-6 text-[var(--adm-accent)]" strokeWidth={1.75} />
            <p className="text-[16px] font-semibold text-[var(--adm-ink)]">Drop resumes to upload</p>
            <p className="mt-1 text-[13px] text-[var(--adm-ink-mute)]">PDF or Word &middot; up to 5MB each</p>
          </div>
        </div>
      )}

      <WorkspaceTitle
        title="Resume bank"
        actions={
          <>
            <WorkspaceButton onClick={exportCSV} disabled={filtered.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            {/* Yields the filled style to the queue's commit button while files wait. */}
            <WorkspaceButton variant={pendingCount > 0 ? "secondary" : "primary"} onClick={() => fileInputRef.current?.click()}>
              <IconUpload className="h-4 w-4" />Upload
            </WorkspaceButton>
          </>
        }
      />
      <StatStrip
        items={[
          { label: "Files", value: resumes.length },
          { label: "Indexed", value: `${resumes.filter((r) => r.indexed).length}/${resumes.length}`,
            tone: resumes.some((r) => !r.indexed) ? "warning" : "success",
            hint: "Searchable in Lead Sourcing / Best candidates" },
          { label: "This month", value: monthCount },
          { label: "Unlinked", value: unnamedCount,
            tone: unnamedCount > 0 ? "warning" : "default",
            hint: "No candidate name recorded" },
          { label: "Storage", value: storageUsed },
        ]}
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
                  className="grid h-8 w-8 place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
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
          ...(showDupsOnly
            ? [{ label: "Duplicates only", onClear: () => setShowDupsOnly(false) }]
            : []),
        ]}
        onClearAll={clearFilters}
      />

      {/* ── indexing notices ── */}
      {!loading && !error && cloudIndexing && (
        <Notice tone="accent" icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />}
          action={<WorkspaceButton variant="ghost" onClick={() => setCloudIndexing(false)}>Hide</WorkspaceButton>}
        >
          <p className="font-medium text-[var(--adm-ink)]">
            Indexing in the cloud: <span className="tabular-nums">{pendingIndex.length}</span> of{" "}
            <span className="tabular-nums">{resumes.length}</span> bank resumes remaining
            {cloudTotals && cloudTotals.applications > 0 ? `, plus ${cloudTotals.applications} bench and applicant resumes` : ""}.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Runs on the server, so you can close this page. If the count stops moving, retry the failed files from the Indexed column.
          </p>
        </Notice>
      )}
      {!loading && !error && !cloudIndexing && bulkRunning && (
        <Notice icon={<Loader2 className="h-4 w-4 animate-spin text-[var(--adm-accent)]" aria-hidden="true" />}>
          <p className="text-[var(--adm-ink)]">
            Indexing resumes… <span className="tabular-nums">{bulkProgress.done}/{bulkProgress.total}</span>. You can keep working.
          </p>
        </Notice>
      )}
      {!loading && !error && !cloudIndexing && !bulkRunning && pendingIndex.length > 0 && (
        <Notice tone="accent" action={<WorkspaceButton onClick={startCloudIndexing}>Index all</WorkspaceButton>}>
          <p className="text-[var(--adm-ink)]">
            <span className="font-semibold tabular-nums">{pendingIndex.length}</span>{" "}
            {pendingIndex.length === 1 ? "resume isn’t" : "resumes aren’t"} searchable yet.
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Index them to include them in Lead Sourcing and Best candidates. Indexed files are skipped, and it runs in the cloud.
          </p>
        </Notice>
      )}
      {/* Same name + size uploaded twice. Only one copy is indexed; the extras should go. */}
      {!loading && !error && duplicateCount > 0 && (
        <Notice
          tone="warning"
          icon={<IconWarning className="h-4 w-4 text-[var(--adm-warning-ink)]" aria-hidden="true" />}
          action={
            <WorkspaceButton onClick={() => setShowDupsOnly((v) => !v)}>
              {showDupsOnly ? "Show all files" : "Review duplicates"}
            </WorkspaceButton>
          }
        >
          <p className="text-[var(--adm-ink)]">
            <span className="font-semibold tabular-nums">{duplicateCount}</span> files look like duplicates (same name and size).
          </p>
          <p className="mt-0.5 text-[13px] text-[var(--adm-ink-mute)]">
            Only one copy is indexed. Delete the extras so a candidate never appears twice in matches.
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
                  {isDuplicate(r) && (
                    <span className="inline-flex h-[22px] items-center rounded-[6px] bg-[var(--adm-warning-soft)] px-1.5 text-[12px] font-medium text-[var(--adm-warning-ink)]">
                      Duplicate
                    </span>
                  )}
                </span>
                <div className="-my-1.5 -mr-1.5 transition-opacity sm:opacity-0 sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
                  {rowActions(r)}
                </div>
              </div>

              <div className="mt-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => handlePreview(r)}
                  className="block w-full truncate rounded-[6px] text-left text-[14px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
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

      {previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={previewName || "Resume preview"}
          className="fixed inset-0 z-50 flex flex-col bg-[var(--adm-scrim)] sm:p-6"
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)] sm:rounded-[14px]">
            <div className="flex flex-none items-center justify-between gap-3 border-b border-[var(--adm-line)] px-4 py-3">
              <p className="min-w-0 truncate text-[15px] font-semibold text-[var(--adm-ink)]">{previewName}</p>
              <div className="flex flex-none items-center gap-2">
                <WorkspaceButton asChild>
                  <a href={previewUrl} download={previewName || "resume"}>
                    <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Download</span>
                  </a>
                </WorkspaceButton>
                <IconAction label="Close preview" onClick={() => { setPreviewUrl(null); setPreviewName(null); }}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconAction>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <iframe src={previewUrl} className="h-full w-full border-0" title={previewName || "Resume preview"} />
            </div>
          </div>
        </div>
      )}
    </div>
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
        "mb-3 flex flex-col gap-3 rounded-[12px] border px-4 py-3 text-[14px] sm:flex-row sm:items-center sm:justify-between",
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
