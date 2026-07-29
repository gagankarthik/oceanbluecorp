"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { LayoutGrid, LayoutList, X, Loader2, Check } from "lucide-react";
import {
  IconDownload, IconEye, IconFile, IconSuccess, IconTrash, IconUpload,
  IconWarning,
} from "@/components/admin/icons";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";
import {
  Workspace, WorkspaceTitle, WorkspaceButton, WorkspaceToolbar, WorkspaceSearch, FilterPill, FilterIcon, ActiveFilters, ToolbarDivider, DensityMenu, KpiRow, type Density,
} from "@/components/admin/workspace";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { AdminCard } from "@/components/admin/admin-card";
import {
  ViewSwitcher,
} from "@/components/admin/toolbar";
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

/** Byte size for a file listing. No shared equivalent — resumes is the only screen weighing files. */
function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Placeholder for an empty cell — an em-dash, aligned with the other columns. */
function Blank() {
  return <span className="text-[var(--adm-ink-subtle)]">—</span>;
}

/**
 * Format marker. Flat square-cornered tile rather than a rounded chip: it is a
 * record-type mark in a grid, not a badge.
 */
function FileTypeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "h-8 w-8 text-[10px]", md: "h-10 w-10 text-[11px]", lg: "h-12 w-12 text-[13px]" }[size];
  if (isPdf(type)) {
    return (
      <span className={cn("flex flex-none items-center justify-center rounded-[4px] bg-[var(--adm-danger-soft)] font-bold tracking-wide text-[var(--adm-danger)]", sz)}>
        PDF
      </span>
    );
  }
  if (isWord(type)) {
    return (
      <span className={cn("flex flex-none items-center justify-center rounded-[4px] bg-[var(--adm-accent-soft)] font-bold tracking-wide text-[var(--adm-accent)]", sz)}>
        DOC
      </span>
    );
  }
  return (
    <span className={cn("flex flex-none items-center justify-center rounded-[4px] bg-[var(--adm-surface-2)] font-bold text-[var(--adm-ink-subtle)]", sz)}>
      <IconFile className="h-4 w-4" />
    </span>
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
      setError(e instanceof Error ? e.message : "Failed to load resumes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── derived ───────────────────────────────────────────────────────────────

  const uploaders = useMemo(() => [...new Set(resumes.map(r => r.uploaderEmail))], [resumes]);

  const filtered = useMemo(() => resumes.filter(r => {
    const q = search.toLowerCase();
    if (q && ![ r.fileName, r.candidateName, r.uploaderEmail ].some(f => f?.toLowerCase().includes(q))) return false;
    if (typeFilter === "pdf"  && !isPdf(r.fileType))  return false;
    if (typeFilter === "word" && !isWord(r.fileType)) return false;
    if (uploaderFilter !== "all" && r.uploaderEmail !== uploaderFilter) return false;
    return true;
  }), [resumes, search, typeFilter, uploaderFilter]);

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

  const [density, setDensity] = useLocalStorage<Density>("adm.resumes.density", "default");

  const hasActiveFilters = typeFilter !== "all" || uploaderFilter !== "all" || search.trim() !== "";
  const clearFilters = () => { setTypeFilter("all"); setUploaderFilter("all"); setSearch(""); };

  const pendingCount = queue.filter(q => q.status === "pending").length;
  const anyUploading = queue.some(q => q.status === "uploading");

  // ── grid columns ──────────────────────────────────────────────────────────

  const rowActions = (r: BankResume) => (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-end gap-0.5">
      <button onClick={() => handlePreview(r)} title="Preview" aria-label={`Preview ${r.fileName}`}
        className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]">
        <IconEye className="h-4 w-4" aria-hidden="true" />
      </button>
      <button onClick={() => handleDownload(r)} title="Download" aria-label={`Download ${r.fileName}`}
        className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]">
        <IconDownload className="h-4 w-4" aria-hidden="true" />
      </button>
      <button onClick={() => setDeleteId(r.id)} title="Delete" aria-label={`Delete ${r.fileName}`}
        className="rounded-[6px] p-2 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]">
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </button>
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

  const indexAll = useCallback(() => {
    indexKeys(resumes.filter((r) => !r.indexed && !r.indexing));
  }, [resumes, indexKeys]);

  const columns: DataTableColumn<BankResume>[] = [
    {
      key: "fileName", header: "File", sortValue: (r) => r.fileName,
      cell: (r) => (
        <span className="font-semibold text-[var(--adm-ink)]" title={r.fileName}>{r.fileName}</span>
      ),
    },
    {
      // The format mark is the cell — a coloured PDF/DOC tile says it without
      // repeating the word next to a filename that already ends in ".pdf".
      key: "type", header: "Type", sortValue: (r) => formatLabel(r.fileType), hideBelow: "md",
      cell: (r) => <FileTypeIcon type={r.fileType} size="sm" />,
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
        <div className="flex items-center gap-2">
          <Avatar email={r.uploaderEmail} size="xs" />
          <span className="truncate text-xs text-[var(--adm-ink-mute)]">{r.uploaderEmail}</span>
        </div>
      ),
    },
    {
      key: "size", header: "Size", align: "right", sortValue: (r) => r.fileSize || 0, hideBelow: "sm",
      cell: (r) => <span className="tabular-nums text-[var(--adm-ink-mute)]">{fmtSize(r.fileSize || 0)}</span>,
    },
    {
      key: "uploadedAt", header: "Uploaded", sortValue: (r) => new Date(r.uploadedAt).getTime(), hideBelow: "sm",
      cell: (r) => <span className="text-xs tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(r.uploadedAt)}</span>,
    },
    {
      key: "indexed", header: "Indexed", sortValue: (r) => (r.indexed ? 2 : r.indexFailed ? 0 : 1), hideBelow: "sm",
      cell: (r) =>
        r.indexing ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--adm-ink-mute)]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Indexing…
          </span>
        ) : r.indexed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2 py-0.5 text-[12px] font-semibold text-emerald-700">
            <Check className="h-3 w-3" strokeWidth={2.5} /> Indexed
          </span>
        ) : r.indexFailed ? (
          <button
            type="button"
            onClick={() => indexKeys([r])}
            disabled={bulkRunning}
            className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2.5 py-0.5 text-[12px] font-semibold text-red-700 transition-colors hover:bg-red-500/15 disabled:opacity-50"
          >
            Failed · Retry
          </button>
        ) : (
          <span className="text-[12px] text-[var(--adm-ink-subtle)]">Not indexed</span>
        ),
    },
    {
      key: "actions", header: "", align: "right",
      cell: (r) => rowActions(r),
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div
      className={cn(
        "space-y-5 pb-10",
        dragActive && "rounded-[6px] outline outline-2 outline-offset-4 outline-[var(--adm-accent)]",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx"
        onChange={handleFileInput} className="hidden" />

      {/* ── drop overlay ── */}
      {dragActive && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[rgba(29,78,216,0.08)] backdrop-blur-sm">
          <div className="rounded-[6px] border border-dashed border-[var(--adm-accent)] bg-[var(--adm-surface)] px-14 py-10 text-center shadow-[var(--adm-shadow-lg)]">
            <IconUpload className="mx-auto mb-3 h-10 w-10 text-[var(--adm-accent)]" strokeWidth={1.5} />
            <p className="text-lg font-bold text-[var(--adm-ink)]">Drop resumes here</p>
            <p className="mt-1 text-[13px] text-[var(--adm-ink-subtle)]">PDF or Word &middot; max 5MB each</p>
          </div>
        </div>
      )}

      {/* The KPI strip is gone. "Total files" is the footer count, "Named" was
          a share bar over a denominator nothing acts on, and "Storage used"
          is not a number anyone can do anything about from this screen. */}

      {/* ── upload queue ── */}
      {panelOpen && queue.length > 0 && (
        <AdminCard className="overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-[var(--adm-line)] px-5 py-3.5">
            <div className="flex min-w-0 items-center gap-2">
              <IconUpload className="h-[18px] w-[18px] flex-none text-[var(--adm-ink-subtle)]" strokeWidth={1.75} />
              <h3 className="text-[15px] font-semibold text-[var(--adm-ink)]">Upload queue</h3>
              <span className="rounded-full bg-[var(--adm-surface-2)] px-2 py-0.5 text-[12px] font-semibold tabular-nums text-[var(--adm-ink-mute)]">
                {queue.length}
              </span>
            </div>
            <div className="flex flex-none items-center gap-2">
              {queue.some(q => q.status === "done") && (
                <button onClick={clearDone} className="text-[11.5px] font-semibold text-[var(--adm-ink-subtle)] transition-colors hover:text-[var(--adm-ink-mute)]">
                  Clear done
                </button>
              )}
              <button onClick={() => setPanelOpen(false)} aria-label="Close upload panel"
                className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink-mute)]">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] divide-y divide-[var(--adm-line-soft)] overflow-y-auto">
            {queue.map(item => (
              <div key={item.id} className="flex items-start gap-3 px-5 py-3.5">
                <FileTypeIcon type={item.file.type} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-[var(--adm-ink)]">{item.file.name}</p>
                    <span className="flex-none text-[11px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtSize(item.file.size)}</span>
                    {item.status === "done"      && <IconSuccess className="h-4 w-4 flex-none text-[var(--adm-success)]" />}
                    {item.status === "uploading" && <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-accent)]" />}
                    {item.status === "error"     && <IconWarning className="h-4 w-4 flex-none text-[var(--adm-danger)]" />}
                  </div>

                  {item.status === "pending" && (
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="Candidate name (optional)"
                      value={item.candidateName}
                      onChange={e => updateQueueItem(item.id, { candidateName: e.target.value })}
                      className="w-full rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2.5 py-1.5 text-xs text-[var(--adm-ink-mute)] transition-colors focus:border-[var(--adm-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-focus-ring)]"
                    />
                  )}

                  {item.status === "uploading" && (
                    <div className="mt-1 h-1.5 overflow-hidden rounded-[2px] bg-[var(--adm-surface-2)]">
                      <div className="h-full rounded-[2px] bg-[var(--adm-accent)] transition-[width] duration-500" style={{ width: `${item.progress}%` }} />
                    </div>
                  )}

                  {item.status === "error" && <p className="mt-1 text-xs text-[var(--adm-danger)]">{item.error}</p>}
                  {item.status === "done"  && <p className="mt-1 text-xs font-medium text-[var(--adm-success)]">Uploaded successfully</p>}
                </div>

                {item.status !== "uploading" && item.status !== "done" && (
                  <button onClick={() => removeFromQueue(item.id)} aria-label="Remove from queue"
                    className="flex-none rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)]">
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {(pendingCount > 0 || anyUploading) && (
            <div className="flex items-center justify-between border-t border-[var(--adm-line)] bg-[var(--adm-zebra)] px-5 py-3">
              <p className="text-[13px] text-[var(--adm-ink-subtle)]">
                {pendingCount > 0 ? `${pendingCount} file${pendingCount > 1 ? "s" : ""} ready to upload` : "Uploading…"}
              </p>
              <WorkspaceButton variant="primary" onClick={uploadAll} disabled={anyUploading || pendingCount === 0}>
                {anyUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {anyUploading ? "Uploading…" : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
              </WorkspaceButton>
            </div>
          )}
        </AdminCard>
      )}

      <WorkspaceTitle
        title="Resume bank"
        meta={`${resumes.length} files`}
        actions={
          <>
            <WorkspaceButton onClick={exportCSV} disabled={filtered.length === 0}>
              <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Export</span>
            </WorkspaceButton>
            <WorkspaceButton variant="primary" onClick={() => fileInputRef.current?.click()}>
              <IconUpload className="h-4 w-4" />Upload
            </WorkspaceButton>
          </>
        }
      />
      <KpiRow
        items={[
          { label: "Uploaded this month", value: monthCount, icon: IconUpload },
          { label: "Not linked to a candidate", value: unnamedCount, icon: IconFile,
            tone: unnamedCount > 0 ? "warning" : "default",
            hint: unnamedCount > 0 ? "No candidate name recorded" : "All linked" },
          { label: "Storage used", value: storageUsed, icon: IconFile },
        ]}
      />

      <Workspace>
        <WorkspaceToolbar
          search={
            <WorkspaceSearch
              value={search}
              onChange={setSearch}
              placeholder="Filter resumes by file name or candidate"
            />
          }
          trailing={
            <>
              <ViewSwitcher
                options={[
                  { value: "list", label: "List", icon: LayoutList },
                  { value: "grid", label: "Grid", icon: LayoutGrid },
                ]}
                value={view}
                onChange={setView}
                className="h-10 rounded-[8px]"
              />
              {view === "list" && (
                <DensityMenu value={density} onChange={setDensity} />
              )}
            </>
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
          chips={[
            ...(typeFilter !== "all"
              ? [{ label: `Type: ${TYPE_TABS.find((t) => t.key === typeFilter)?.label ?? typeFilter}`, onClear: () => setTypeFilter("all") }]
              : []),
            ...(uploaderFilter !== "all"
              ? [{ label: `Uploaded by: ${uploaderFilter}`, onClear: () => setUploaderFilter("all") }]
              : []),
          ]}
          onClearAll={clearFilters}
        />

      {/* ── indexing banner ── */}
      {!loading && !error && bulkRunning && (
        <div className="flex items-center gap-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 py-3">
          <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-accent)]" />
          <span className="text-[14px] text-[var(--adm-ink)]">
            Indexing resumes… {bulkProgress.done}/{bulkProgress.total}. This can take a while — you can keep working.
          </span>
        </div>
      )}
      {!loading && !error && !bulkRunning && resumes.some((r) => !r.indexed) && (
        <div className="flex flex-col gap-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-accent-tint)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[14px] text-[var(--adm-ink)]">
            <span className="font-semibold">{resumes.filter((r) => !r.indexed).length}</span>{" "}
            {resumes.filter((r) => !r.indexed).length === 1 ? "resume isn’t" : "resumes aren’t"} searchable yet — index them so they appear in Lead Sourcing and Best candidates.
          </p>
          <WorkspaceButton variant="primary" onClick={indexAll} className="sm:flex-none">
            Index all
          </WorkspaceButton>
        </div>
      )}

      {/* ── records ── */}
      {loading ? (
        <AdminRowsSkeleton rows={6} />
      ) : error ? (
        <div>
          <EmptyState
            variant="error"
            title="Could not load the resume bank"
            description={error}
            action={<WorkspaceButton variant="primary" onClick={load}>Retry</WorkspaceButton>}
          />
        </div>
      ) : view === "list" ? (
          <DataTable
            noun="resumes"
            storageKey="resumes"
            columns={columns}
            rows={filtered}
            rowKey={(r) => r.id}
            onRowClick={handlePreview}
            density={density}
            initialSort={{ key: "uploadedAt", dir: "desc" }}
            empty={{
              icon: IconFile,
              title: resumes.length === 0 ? "No resumes yet" : "No files match your filters",
              description: resumes.length === 0
                ? "Drag & drop files anywhere on this page, or upload from the header."
                : "Try adjusting your search or filters.",
              action: resumes.length === 0
                ? <WorkspaceButton variant="primary" onClick={() => fileInputRef.current?.click()}><IconUpload className="h-4 w-4" />Upload resumes</WorkspaceButton>
                : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>,
            }}
          />
      ) : filtered.length === 0 ? (
        <div>
          <EmptyState
            variant={resumes.length === 0 ? "fresh" : "filtered"}
            icon={IconFile}
            title={resumes.length === 0 ? "No resumes yet" : "No files match your filters"}
            description={resumes.length === 0
              ? "Drag & drop files anywhere on this page, or upload from the header."
              : "Try adjusting your search or filters."}
            action={resumes.length === 0
              ? <WorkspaceButton variant="primary" onClick={() => fileInputRef.current?.click()}><IconUpload className="h-4 w-4" />Upload resumes</WorkspaceButton>
              : <WorkspaceButton onClick={clearFilters}><X className="h-4 w-4" />Clear filters</WorkspaceButton>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto p-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(r => (
            <AdminCard key={r.id} hover className="group flex flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <FileTypeIcon type={r.fileType} size="lg" />
                <div className="transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                  {rowActions(r)}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <button
                  onClick={() => handlePreview(r)}
                  className="block w-full truncate text-left text-sm font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
                  title={r.fileName}
                >
                  {r.fileName}
                </button>
                <p className="mt-0.5 truncate text-xs text-[var(--adm-ink-subtle)]">{r.candidateName || "—"}</p>
              </div>

              <div className="space-y-1.5 border-t border-[var(--adm-line-soft)] pt-2.5">
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--adm-ink-subtle)]">
                  <Avatar email={r.uploaderEmail} size="xs" className="h-4 w-4 text-[8px] ring-0 shadow-none" />
                  <span className="truncate">{r.uploaderEmail}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] tabular-nums text-[var(--adm-ink-subtle)]">
                  <span>{fmtDate(r.uploadedAt)}</span>
                  <span>{fmtSize(r.fileSize || 0)}</span>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
      </Workspace>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete resume?"
        body="This will permanently remove the file from storage."
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* ── PDF preview ── */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <IconFile className="h-4 w-4 flex-none text-[var(--adm-danger)]" />
              <span className="truncate text-sm font-semibold text-[var(--adm-ink)]">{previewName}</span>
            </div>
            <div className="flex flex-none items-center gap-2">
              <a href={previewUrl} download={previewName || "resume"}
                className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--adm-accent)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)]">
                <IconDownload className="h-3.5 w-3.5" />Download
              </a>
              <button onClick={() => { setPreviewUrl(null); setPreviewName(null); }}
                aria-label="Close preview"
                className="rounded-[6px] p-1.5 text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]">
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe src={previewUrl} className="h-full w-full border-0" title={previewName || "Resume preview"} />
          </div>
        </div>
      )}
    </div>
  );
}
