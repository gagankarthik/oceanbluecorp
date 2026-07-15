"use client";
import { toast } from "sonner";
import { PageHeader, PageHeaderButton } from "@/components/admin/page-header";
import { AdminRowsSkeleton } from "@/components/admin/skeletons";
import { AdminCard } from "@/components/admin/admin-card";
import { SearchInput, FilterToggle, ViewSwitcher } from "@/components/admin/toolbar";
import { FilterChips } from "@/components/admin/filter-chips";
import { FormSelect } from "@/components/admin/forms/primitives";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Search, Upload, Download, Trash2, FileText, File, Eye,
  LayoutGrid, LayoutList, X, User2,
  Calendar, Loader2, AlertTriangle, CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { cn } from "@/lib/utils";

// Types

interface BankResume {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  candidateName?: string;
  uploaderEmail: string;
  uploadedAt: string;
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

// Helpers

const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 5 * 1024 * 1024;

function isPdf(type: string) { return type === "application/pdf"; }
function isWord(type: string) { return type === "application/msword" || type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"; }

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function FileTypeIcon({ type, size = "md" }: { type: string; size?: "sm" | "md" | "lg" }) {
  const sz = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-14 h-14 text-base" }[size];
  if (isPdf(type)) {
    return (
      <div className={cn("rounded-xl flex flex-col items-center justify-center font-bold bg-rose-100 text-rose-600 flex-shrink-0", sz)}>
        PDF
      </div>
    );
  }
  if (isWord(type)) {
    return (
      <div className={cn("rounded-xl flex flex-col items-center justify-center font-bold bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] flex-shrink-0", sz)}>
        DOC
      </div>
    );
  }
  return (
    <div className={cn("rounded-xl flex flex-col items-center justify-center font-bold bg-slate-100 text-slate-500 flex-shrink-0", sz)}>
      <File className="w-4 h-4" />
    </div>
  );
}

// Page

export default function ResumeBankPage() {
  const { user } = useAuth();
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [resumes, setResumes]     = useState<BankResume[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  const [queue, setQueue]         = useState<QueueItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [view, setView]             = useState<ViewMode>("grid");
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [uploaderFilter, setUploaderFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const uploaders = useMemo(() => [...new Set(resumes.map(r => r.uploaderEmail))], [resumes]);

  const filtered = useMemo(() => resumes.filter(r => {
    const q = search.toLowerCase();
    if (q && ![ r.fileName, r.candidateName, r.uploaderEmail ].some(f => f?.toLowerCase().includes(q))) return false;
    if (typeFilter === "pdf"  && !isPdf(r.fileType))  return false;
    if (typeFilter === "word" && !isWord(r.fileType)) return false;
    if (uploaderFilter !== "all" && r.uploaderEmail !== uploaderFilter) return false;
    return true;
  }), [resumes, search, typeFilter, uploaderFilter]);

  const stats = useMemo(() => ({
    total: resumes.length,
    pdfs:  resumes.filter(r => isPdf(r.fileType)).length,
    words: resumes.filter(r => isWord(r.fileType)).length,
    size:  fmtSize(resumes.reduce((s, r) => s + (r.fileSize || 0), 0)),
  }), [resumes]);

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

  const pendingCount = queue.filter(q => q.status === "pending").length;
  const anyUploading = queue.some(q => q.status === "uploading");

  return (
    <div
      className={cn("space-y-4 min-h-[60vh]", dragActive && "outline-4 outline-dashed outline-[var(--hz-cobalt)] outline-offset-4 rounded-2xl")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      ref={dropZoneRef}
    >
      <input ref={fileInputRef} type="file" multiple accept=".pdf,.doc,.docx"
        onChange={handleFileInput} className="hidden" />

      <PageHeader
        title="Resume Bank"
        subtitle={`${stats.total} files · ${stats.pdfs} PDF · ${stats.words} Word · ${stats.size} total`}
        actions={
          <PageHeaderButton variant="primary" onClick={() => fileInputRef.current?.click()}>
            <Upload className="w-4 h-4" />Upload Resumes
          </PageHeaderButton>
        }
      />

      {/* Drop overlay */}
      {dragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(29,78,216,0.1)] backdrop-blur-sm pointer-events-none">
          <div className="bg-white border-2 border-dashed border-[var(--hz-cobalt)] rounded-3xl px-16 py-12 text-center shadow-2xl">
            <Upload className="w-12 h-12 text-[var(--hz-cobalt)] mx-auto mb-3" />
            <p className="text-2xl font-bold text-[var(--hz-cobalt)]">Drop resumes here</p>
            <p className="text-sm text-slate-500 mt-1">PDF or Word &middot; max 5MB each</p>
          </div>
        </div>
      )}

      {/* Upload panel */}
      {panelOpen && queue.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[var(--hz-cobalt)]" />
              <h3 className="text-sm font-bold text-slate-900">Upload Queue</h3>
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)] rounded-full">{queue.length}</span>
            </div>
            <div className="flex items-center gap-2">
              {queue.some(q => q.status === "done") && (
                <button onClick={clearDone} className="text-xs text-slate-400 hover:text-slate-700 font-medium">Clear done</button>
              )}
              <button onClick={() => setPanelOpen(false)} aria-label="Close upload panel" className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-50 max-h-[420px] overflow-y-auto">
            {queue.map(item => (
              <div key={item.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <FileTypeIcon type={item.file.type} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-sm font-semibold text-slate-800 truncate">{item.file.name}</p>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">{fmtSize(item.file.size)}</span>
                      {item.status === "done"      && <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                      {item.status === "uploading" && <Loader2 className="w-4 h-4 text-[var(--hz-cobalt)] animate-spin flex-shrink-0" />}
                      {item.status === "error"     && <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
                    </div>

                    {item.status === "pending" && (
                      <input
                        type="text"
                        autoComplete="off"
                        placeholder="Candidate name (optional)"
                        value={item.candidateName}
                        onChange={e => updateQueueItem(item.id, { candidateName: e.target.value })}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(29,78,216,0.2)] focus:border-[var(--hz-cobalt)] text-slate-700"
                      />
                    )}

                    {item.status === "uploading" && (
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                        <div className="h-full bg-[var(--hz-cobalt)] rounded-full transition-all duration-500" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}

                    {item.status === "error" && (
                      <p className="text-xs text-rose-600 mt-1">{item.error}</p>
                    )}

                    {item.status === "done" && (
                      <p className="text-xs text-emerald-600 font-medium mt-1">Uploaded successfully</p>
                    )}
                  </div>

                  {item.status !== "uploading" && item.status !== "done" && (
                    <button onClick={() => removeFromQueue(item.id)} aria-label="Remove from queue" className="p-1 text-slate-400 hover:text-rose-500 rounded-lg flex-shrink-0">
                      <X className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {(pendingCount > 0 || anyUploading) && (
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {pendingCount > 0 ? `${pendingCount} file${pendingCount > 1 ? "s" : ""} ready to upload` : "Uploading…"}
              </p>
              <button
                onClick={uploadAll}
                disabled={anyUploading || pendingCount === 0}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)] disabled:opacity-60 transition-colors"
              >
                {anyUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {anyUploading ? "Uploading…" : `Upload ${pendingCount} file${pendingCount > 1 ? "s" : ""}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <AdminCard className="space-y-3 p-3">
        <div className="flex flex-wrap gap-2 items-center">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by file, candidate, uploader…" />

          {/* File-type segmented control */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(["all", "pdf", "word"] as FileTypeFilter[]).map(t => (
              <button key={t} onClick={() => setTypeFilter(t)}
                className={cn("px-3 py-1 text-xs font-semibold rounded-md transition-colors", typeFilter === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
                {t === "all" ? "All" : t.toUpperCase()}
              </button>
            ))}
          </div>

          <FilterToggle
            open={filtersOpen}
            activeCount={uploaderFilter !== "all" ? 1 : 0}
            onClick={() => setFiltersOpen(v => !v)}
          />

          <ViewSwitcher
            options={[
              { value: "grid", label: "Grid", icon: LayoutGrid },
              { value: "list", label: "List", icon: LayoutList },
            ]}
            value={view}
            onChange={setView}
          />
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 sm:grid-cols-3">
            <FormSelect value={uploaderFilter} onChange={e => setUploaderFilter(e.target.value)}>
              <option value="all">All recruiters</option>
              {uploaders.map(u => <option key={u} value={u}>{u}</option>)}
            </FormSelect>
          </div>
        )}

        <FilterChips
          chips={uploaderFilter !== "all" ? [{ key: "uploader", label: "Uploaded by", value: uploaderFilter, onRemove: () => setUploaderFilter("all") }] : []}
        />
      </AdminCard>

      {/* Content */}
      {loading ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
          <AdminRowsSkeleton rows={6} />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <p className="text-sm text-rose-600">{error}</p>
            <button onClick={load} className="px-4 py-2 bg-[var(--hz-cobalt)] text-white text-sm rounded-lg">Retry</button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasResumes={resumes.length > 0}
          onUpload={() => fileInputRef.current?.click()}
        />
      ) : view === "grid" ? (
        <GridView
          resumes={filtered}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={setDeleteId}
        />
      ) : (
        <ListView
          resumes={filtered}
          onPreview={handlePreview}
          onDownload={handleDownload}
          onDelete={setDeleteId}
        />
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal>
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-5 h-5 text-rose-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete resume?</h3>
          <p className="text-sm text-slate-500 text-center mb-6">This will permanently remove the file from storage.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)} className="flex-1 px-4 py-2.5 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleDelete} disabled={deleting}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-60">
              {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* PDF Preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-rose-600" />
              <span className="text-sm font-semibold text-slate-800 truncate max-w-[40vw] sm:max-w-[400px]">{previewName}</span>
            </div>
            <div className="flex items-center gap-2">
              <a href={previewUrl} download={previewName || "resume"}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[var(--hz-cobalt)] text-white rounded-lg hover:bg-[var(--hz-cobalt-600)]">
                <Download className="w-3.5 h-3.5" />Download
              </a>
              <button onClick={() => { setPreviewUrl(null); setPreviewName(null); }}
                aria-label="Close preview"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <iframe src={previewUrl} className="w-full h-full border-0" title={previewName || "Resume preview"} />
          </div>
        </div>
      )}
    </div>
  );
}

// Grid View

function GridView({ resumes, onPreview, onDownload, onDelete }: {
  resumes: BankResume[];
  onPreview: (r: BankResume) => void;
  onDownload: (r: BankResume) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {resumes.map(r => (
        <div key={r.id}
          className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-[var(--hz-cobalt-100)] transition-all group flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <FileTypeIcon type={r.fileType} size="lg" />
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => onPreview(r)} title="Preview"
                className="p-1.5 text-slate-400 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => onDownload(r)} title="Download"
                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button onClick={() => onDelete(r.id)} title="Delete"
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate" title={r.fileName}>{r.fileName}</p>
            {r.candidateName && (
              <p className="text-xs text-[var(--hz-cobalt)] font-medium mt-0.5 truncate">{r.candidateName}</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-2 space-y-1">
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <User2 className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{r.uploaderEmail}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar className="w-3 h-3 flex-shrink-0" />
                {fmtDate(r.uploadedAt)}
              </div>
              <span className="text-[10px] text-slate-400">{fmtSize(r.fileSize)}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// List View

function ListView({ resumes, onPreview, onDownload, onDelete }: {
  resumes: BankResume[];
  onPreview: (r: BankResume) => void;
  onDownload: (r: BankResume) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 bg-slate-50 border-b border-slate-200">
            {["File", "Candidate", "Uploaded by", "Date / Size", ""].map((h, i) => (
              <div key={i} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{h}</div>
            ))}
          </div>
          <div className="divide-y divide-slate-100">
            {resumes.map(r => (
              <div key={r.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3.5 items-center hover:bg-[#eef3fe] transition-colors group">
                <div className="flex items-center gap-3 min-w-0">
                  <FileTypeIcon type={r.fileType} size="sm" />
                  <p className="text-sm font-semibold text-slate-800 truncate">{r.fileName}</p>
                </div>

                <div className="min-w-0">
                  {r.candidateName
                    ? <span className="text-sm text-[var(--hz-cobalt)] font-semibold truncate block">{r.candidateName}</span>
                    : <span className="text-xs text-slate-300 italic">—</span>}
                </div>

                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--hz-cobalt)] to-indigo-600 flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0">
                    {r.uploaderEmail.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs text-slate-600 truncate">{r.uploaderEmail}</span>
                </div>

                <div>
                  <p className="text-xs text-slate-700 font-medium">{fmtDate(r.uploadedAt)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{fmtSize(r.fileSize)}</p>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onPreview(r)}
                    className="p-1.5 text-slate-400 hover:text-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-100)] rounded-lg transition-colors" title="Preview">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDownload(r)}
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Download">
                    <Download className="w-4 h-4" />
                  </button>
                  <button onClick={() => onDelete(r.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Empty State

function EmptyState({ hasResumes, onUpload }: { hasResumes: boolean; onUpload: () => void }) {
  if (hasResumes) {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center shadow-sm">
        <Search className="w-10 h-10 text-slate-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">No results</p>
        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
      </div>
    );
  }
  return (
    <button
      onClick={onUpload}
      className="w-full bg-white border-2 border-dashed border-slate-300 hover:border-[var(--hz-cobalt)] hover:bg-[#eef3fe] rounded-2xl py-20 text-center transition-colors group"
    >
      <div className="w-16 h-16 rounded-2xl bg-[var(--hz-cobalt-100)] group-hover:bg-[var(--hz-cobalt-100)] flex items-center justify-center mx-auto mb-4 transition-colors">
        <FolderOpen className="w-8 h-8 text-[var(--hz-cobalt)]" />
      </div>
      <h3 className="text-base font-semibold text-slate-700 mb-1">No resumes yet</h3>
      <p className="text-sm text-slate-400 mb-4">Drag &amp; drop files anywhere, or click to browse</p>
      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--hz-cobalt)] text-white text-sm font-semibold rounded-xl shadow-sm">
        <Upload className="w-4 h-4" />Upload Resumes
      </div>
    </button>
  );
}

// Modal

function Modal({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">{children}</div>
    </div>
  );
}
