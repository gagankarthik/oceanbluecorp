"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DataTable, { TableTabs, type Column, type Filter } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import { BarChart, TrendChart } from "@/components/portal/charts";
import { useSession } from "@/components/portal/session";
import { useToast } from "@/components/portal/toast";
import { fieldCls } from "@/components/portal/recruiting/bits";
import { buckets, countIn, tally } from "@/components/portal/recruiting/model";
import type { MenuEntry } from "@/components/portal/records/Menu";
import {
  Badge, Button, ConfirmDialog, EmptyState, ErrorState, InsightsSheet, KeyValue, Modal, Page, PageHeader, Panel, PanelSkeleton, ProgressBar, Spinner,
  TableSkeleton,
} from "@/components/portal/kit";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, fmtDateTime, fmtRelative } from "@/lib/format";
import { isUrl } from "@/lib/form-validation";
import type { IndexJobPhase } from "@/lib/index-job";
import { findDuplicateGroups, type DuplicateGroup } from "@/lib/resume-duplicates";

interface BankResume {
  id: string;
  fileName: string;
  fileKey: string;
  fileSize: number;
  fileType: string;
  candidateName?: string;
  uploaderEmail: string;
  uploadedAt: string;
  indexed?: boolean;
  /** Client-side: an index request is in flight, or the last one failed. */
  indexing?: boolean;
  indexFailed?: boolean;
}

interface IndexJob {
  phase: IndexJobPhase;
  remaining: number;
  total: number;
  startedAt: string | null;
  updatedAt: string | null;
  failed: { id: string; error: string }[];
}

type QueueItem = { id: string; file: File; candidateName: string; status: "pending" | "uploading" | "done" | "error"; error?: string };
type StatusKey = "indexed" | "pending" | "failed" | "duplicates";
type DupRef = { key: string; fileName: string; size: number; uploadedAt: number; indexed?: boolean; row: BankResume };

const ALLOWED = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const MAX_SIZE = 5 * 1024 * 1024;
const isPdf = (t: string) => t === "application/pdf";
const formatLabel = (t: string) => (isPdf(t) ? "PDF" : ALLOWED.includes(t) ? "Word" : "Other");
const fmtSize = (b: number) => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(0)} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);

export default function ResumesView() {
  const notify = useToast();
  const { user } = useSession();
  const fileInput = useRef<HTMLInputElement>(null);

  const [resumes, setResumes] = useState<BankResume[] | null>(null);
  const [error, setError] = useState(false);
  const [statusKey, setStatusKey] = useState<StatusKey | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [drag, setDrag] = useState(false);
  const [deleteRow, setDeleteRow] = useState<BankResume | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [dupOpen, setDupOpen] = useState(false);

  const load = useCallback(async (silent = false) => {
    try {
      if (!silent) setError(false);
      const r = await fetch("/api/resume-bank");
      const d = await r.json();
      if (!r.ok) throw new Error();
      setResumes(d.resumes || []);
    } catch {
      if (!silent) setError(true);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  // Cloud indexing: the stored job state is the source of truth, polled while it runs.
  const [job, setJob] = useState<IndexJob | null>(null);
  const [jobAction, setJobAction] = useState<null | "start" | "retry" | "stop">(null);
  const loadJob = useCallback(async () => {
    try {
      const r = await fetch("/api/resume-bank/index-all");
      if (r.ok) setJob(await r.json());
    } catch {
      /* keep the last state */
    }
  }, []);
  useEffect(() => {
    void loadJob();
  }, [loadJob]);
  const jobBusy = job?.phase === "running" || job?.phase === "stopping";
  useEffect(() => {
    if (!jobBusy) return;
    const t = setInterval(() => {
      void loadJob();
      void load(true);
    }, 10_000);
    return () => clearInterval(t);
  }, [jobBusy, loadJob, load]);
  const wasBusy = useRef(false);
  useEffect(() => {
    if (wasBusy.current && !jobBusy) {
      void load(true);
      if (job?.phase === "finished") notify(job.failed.length ? `Indexing finished. ${job.failed.length} couldn't be made searchable.` : "Indexing finished. Everything is searchable.");
    }
    wasBusy.current = jobBusy;
  }, [jobBusy, job, load, notify]);

  // Newest first until the viewer sorts a column.
  const list = useMemo(() => [...(resumes ?? [])].sort((a, b) => (Date.parse(b.uploadedAt) || 0) - (Date.parse(a.uploadedAt) || 0)), [resumes]);
  const serverFailures = useMemo(() => new Map((job?.failed ?? []).filter((f) => f.id.startsWith("resume-bank/")).map((f) => [f.id, f.error])), [job]);
  const appFailures = (job?.failed ?? []).filter((f) => !f.id.startsWith("resume-bank/")).length;

  // Same name and size = the same file uploaded twice; one copy is kept.
  const dupGroups = useMemo(
    () => findDuplicateGroups<DupRef>(list.map((r) => ({ key: r.fileKey, fileName: r.fileName, size: r.fileSize, uploadedAt: Date.parse(r.uploadedAt) || 0, indexed: r.indexed, row: r }))),
    [list],
  );
  const dupRole = useMemo(() => {
    const m = new Map<string, "keeper" | "extra">();
    for (const g of dupGroups) {
      m.set(g.keeper.key, "keeper");
      for (const e of g.extras) m.set(e.key, "extra");
    }
    return m;
  }, [dupGroups]);
  const isExtra = useCallback((r: BankResume) => dupRole.get(r.fileKey) === "extra", [dupRole]);
  const isFailed = useCallback((r: BankResume) => !r.indexed && !r.indexing && (!!r.indexFailed || serverFailures.has(r.fileKey)), [serverFailures]);
  const matches = useCallback(
    (r: BankResume, k: StatusKey | null) =>
      k === "indexed" ? !!r.indexed : k === "pending" ? !r.indexed && !isExtra(r) && !isFailed(r) : k === "failed" ? isFailed(r) : k === "duplicates" ? dupRole.has(r.fileKey) : true,
    [isExtra, isFailed, dupRole],
  );

  const pendingIndex = list.filter((r) => !r.indexed && !isExtra(r));
  const failedRows = list.filter(isFailed);
  const pendingNotFailed = pendingIndex.filter((r) => !isFailed(r)).length;
  const extraCount = dupRole.size - dupGroups.length;
  const shown = useMemo(() => list.filter((r) => matches(r, statusKey)), [list, statusKey, matches]);

  /* ---------------- upload ---------------- */

  const addFiles = (files: FileList | File[]) => {
    const all = Array.from(files);
    const ok = all.filter((f) => ALLOWED.includes(f.type) && f.size <= MAX_SIZE);
    if (ok.length < all.length) notify(`${all.length - ok.length} file${all.length - ok.length > 1 ? "s" : ""} skipped: PDF or Word only, up to 5 MB.`, { tone: "error" });
    if (ok.length) setQueue((q) => [...q, ...ok.map((file) => ({ id: `${Date.now()}-${Math.random()}`, file, candidateName: "", status: "pending" as const }))]);
  };
  const setItem = (id: string, p: Partial<QueueItem>) => setQueue((q) => q.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const uploadOne = async (item: QueueItem) => {
    setItem(item.id, { status: "uploading" });
    try {
      // Raw body plus headers: Amplify drops the multipart boundary.
      const r = await fetch("/api/resume-bank", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "x-file-name": encodeURIComponent(item.file.name),
          "x-file-type": item.file.type || "application/octet-stream",
          "x-uploaded-by": encodeURIComponent(user.email || "recruiter"),
          ...(item.candidateName.trim() ? { "x-candidate-name": encodeURIComponent(item.candidateName.trim()) } : {}),
        },
        body: item.file,
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Upload failed");
      setItem(item.id, { status: "done" });
    } catch (e) {
      setItem(item.id, { status: "error", error: e instanceof Error ? e.message : "Upload failed" });
    }
  };
  const uploadAll = async () => {
    const pending = queue.filter((q) => q.status === "pending");
    await Promise.all(pending.map(uploadOne));
    await load(true);
    notify(`Uploaded ${pending.length} file${pending.length > 1 ? "s" : ""}`);
  };
  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const uploading = queue.some((q) => q.status === "uploading");

  /* ---------------- record actions ---------------- */

  const downloadUrl = async (r: BankResume) => {
    try {
      const res = await fetch(`/api/resume-bank/${r.id}`);
      const d = await res.json();
      if (!res.ok || !isUrl(d.downloadUrl)) throw new Error();
      return d.downloadUrl as string;
    } catch {
      notify("Couldn't get the download link. Try again.", { tone: "error" });
      return null;
    }
  };
  const download = async (r: BankResume) => {
    const url = await downloadUrl(r);
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = r.fileName;
    a.rel = "noopener noreferrer";
    a.click();
  };
  const openPreview = async (r: BankResume) => {
    if (!isPdf(r.fileType)) return void download(r);
    const url = await downloadUrl(r);
    if (url) setPreview({ url, name: r.fileName });
  };
  const remove = async () => {
    if (!deleteRow) return;
    setDeleting(true);
    const r = await fetch(`/api/resume-bank/${deleteRow.id}`, { method: "DELETE" }).catch(() => null);
    if (r?.ok) {
      setResumes((p) => (p ?? []).filter((x) => x.id !== deleteRow.id));
      notify(`${deleteRow.fileName} deleted`);
    } else notify("Couldn't delete the resume. Try again.", { tone: "error" });
    setDeleting(false);
    setDeleteRow(null);
  };
  const deleteKeys = async (keys: string[]): Promise<boolean> => {
    const deleted: string[] = [];
    let failed = 0;
    for (let i = 0; i < keys.length; i += 500) {
      const chunk = keys.slice(i, i + 500);
      try {
        const r = await fetch("/api/resume-bank/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKeys: chunk }) });
        const d = await r.json().catch(() => ({}));
        if (!r.ok) failed += chunk.length;
        else {
          deleted.push(...(d.deleted || []));
          failed += (d.failed || []).length;
        }
      } catch {
        failed += chunk.length;
      }
    }
    const gone = new Set(deleted);
    setResumes((p) => (p ?? []).filter((r) => !gone.has(r.fileKey)));
    if (deleted.length) notify(`Deleted ${deleted.length} extra ${deleted.length === 1 ? "copy" : "copies"}`);
    if (failed) notify(`${failed} file${failed === 1 ? "" : "s"} couldn't be deleted. Try again.`, { tone: "error" });
    return failed === 0;
  };

  const [rowIndexing, setRowIndexing] = useState(false);
  const indexOne = async (r: BankResume) => {
    if (rowIndexing) return;
    setRowIndexing(true);
    setResumes((p) => (p ?? []).map((x) => (x.id === r.id ? { ...x, indexing: true, indexFailed: false } : x)));
    try {
      const res = await fetch("/api/resume-bank/index", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileKeys: [r.fileKey] }) });
      const d = await res.json().catch(() => ({}));
      const ok = res.ok && !!d?.results?.[r.fileKey]?.indexed;
      setResumes((p) => (p ?? []).map((x) => (x.id === r.id ? { ...x, indexing: false, indexed: ok, indexFailed: !ok } : x)));
      notify(ok ? `${r.fileName} is searchable` : `Couldn't make ${r.fileName} searchable`, ok ? undefined : { tone: "error" });
    } catch {
      setResumes((p) => (p ?? []).map((x) => (x.id === r.id ? { ...x, indexing: false, indexFailed: true } : x)));
      notify(`Couldn't make ${r.fileName} searchable`, { tone: "error" });
    } finally {
      setRowIndexing(false);
    }
  };

  const startIndexing = async (retryFailed = false) => {
    setJobAction(retryFailed ? "retry" : "start");
    try {
      const r = await fetch("/api/resume-bank/index-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retryFailed }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof d?.error === "string" ? d.error : "Couldn't start indexing");
      if (d.alreadyRunning) notify(d.message || "Indexing is already running", { tone: "info" });
      else if (!d.started) notify(d.message || "Everything is already searchable");
      else notify(`Indexing started: ${(d.bank || 0) + (d.applications || 0)} resumes queued`);
      if (!d.started) void load(true);
      await loadJob();
    } catch (e) {
      notify(e instanceof Error ? e.message : "Couldn't start indexing", { tone: "error" });
    } finally {
      setJobAction(null);
    }
  };
  const stopIndexing = async () => {
    setJobAction("stop");
    try {
      const r = await fetch("/api/resume-bank/index-all", { method: "DELETE" });
      if (!r.ok) throw new Error();
      notify("Stopping after the current batch. Files already done stay searchable.", { tone: "info" });
      await loadJob();
    } catch {
      notify("Couldn't stop indexing. Try again.", { tone: "error" });
    } finally {
      setJobAction(null);
    }
  };

  const loading = resumes === null && !error;
  const searchable = list.filter((r) => r.indexed).length;
  const searchablePct = list.length ? Math.round((searchable / list.length) * 100) : 0;
  const weeks = buckets(84);
  const uploadsWeekly = countIn(weeks, list.map((r) => Date.parse(r.uploadedAt) || null));
  const byUploader = tally(list.map((r) => r.uploaderEmail.split("@")[0] || "Unknown"), 7);

  const IndexCell = ({ r }: { r: BankResume }) =>
    r.indexing ? (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-mist-600"><Spinner className="size-4 text-ocean-600" /> Indexing</span>
    ) : r.indexed ? (
      <Badge tone="green" dot>Searchable</Badge>
    ) : isExtra(r) ? (
      <span className="text-[13px] text-mist-500" title="Another copy of this file is kept and searchable">Extra copy, skipped</span>
    ) : isFailed(r) ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void indexOne(r);
        }}
        disabled={rowIndexing || jobBusy}
        title={serverFailures.get(r.fileKey) || "The last attempt failed"}
        className="inline-flex min-h-7 items-center rounded-md bg-[#fef3f2] px-2 text-[12px] font-medium text-[#b42318] ring-1 ring-inset ring-[#fecdca] hover:bg-[#fee4e2] disabled:opacity-50"
      >
        Failed, retry
      </button>
    ) : (
      <span className="text-[13px] text-mist-500">Not searchable yet</span>
    );

  const columns: Column<BankResume>[] = [
    {
      key: "fileName",
      header: "File",
      sortable: true,
      value: (r) => r.fileName,
      cell: (r) => (
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="min-w-0 truncate font-semibold" title={r.fileName}>{r.fileName}</span>
          {dupRole.get(r.fileKey) === "extra" && <Badge tone="amber">Extra copy</Badge>}
          {dupRole.get(r.fileKey) === "keeper" && <Badge tone="grey">Kept copy</Badge>}
        </span>
      ),
    },
    { key: "type", header: "Type", sortable: true, card: false, hideBelow: "xl", value: (r) => formatLabel(r.fileType) },
    { key: "candidate", header: "Candidate", sortable: true, hideBelow: "md", value: (r) => r.candidateName ?? "", cell: (r) => r.candidateName || <span className="text-mist-400">&mdash;</span> },
    { key: "uploader", header: "Uploaded by", sortable: true, card: false, hideBelow: "xl", value: (r) => r.uploaderEmail, cell: (r) => <span className="text-[13px] text-mist-700">{r.uploaderEmail}</span> },
    { key: "size", header: "Size", sortable: true, card: false, hideBelow: "lg", value: (r) => r.fileSize || 0, cell: (r) => <span className="tabular-nums text-mist-600">{fmtSize(r.fileSize || 0)}</span> },
    { key: "uploadedAt", header: "Uploaded", sortable: true, hideBelow: "md", value: (r) => r.uploadedAt, cell: (r) => <span className="text-[13px] tabular-nums text-mist-600">{fmtDate(r.uploadedAt)}</span> },
    { key: "indexed", header: "Search", sortable: true, value: (r) => (r.indexed ? "Searchable" : isExtra(r) ? "Extra copy" : isFailed(r) ? "Failed" : "Not searchable yet"), cell: (r) => <IndexCell r={r} /> },
  ];
  const filters: Filter<BankResume>[] = [
    { key: "type", label: "Type", options: ["PDF", "Word"], value: (r) => formatLabel(r.fileType) },
    { key: "uploader", label: "Uploaded by", options: [...new Set(list.map((r) => r.uploaderEmail))].sort(), value: (r) => r.uploaderEmail },
  ];

  const statusOptions: { value: StatusKey | "all"; label: string; count: number }[] = [
    { value: "all", label: "All files", count: list.length },
    { value: "indexed", label: "Searchable", count: searchable },
    { value: "pending", label: "Not searchable yet", count: pendingNotFailed },
    { value: "failed", label: "Failed", count: failedRows.length },
    { value: "duplicates", label: "Duplicates", count: dupRole.size },
  ];

  // One health bar instead of stacked notices: the state, its numbers and the one next action.
  const healthAction = job && jobBusy ? (
    job.phase === "running" && <Button size="sm" variant="secondary" loading={jobAction === "stop"} disabled={jobAction !== null} onClick={() => void stopIndexing()}>Stop</Button>
  ) : job?.phase === "stalled" ? (
    <Button size="sm" icon="refresh" loading={jobAction === "start"} disabled={jobAction !== null} onClick={() => void startIndexing()}>Resume</Button>
  ) : (
    <>
      {(job?.failed.length ?? 0) > 0 && (
        <Button size="sm" variant="secondary" icon="refresh" loading={jobAction === "retry"} disabled={jobAction !== null} onClick={() => void startIndexing(true)}>Retry failed</Button>
      )}
      {dupGroups.length > 0 && <Button size="sm" variant="secondary" icon="layers" onClick={() => setDupOpen(true)}>Review duplicates</Button>}
      {pendingNotFailed > 0 && (
        <Button size="sm" icon="search" loading={jobAction === "start"} disabled={jobAction !== null} onClick={() => void startIndexing()}>Make all searchable</Button>
      )}
    </>
  );
  const healthLine = job && jobBusy ? (
    <span className="inline-flex items-center gap-2 text-ocean-800">
      <Spinner className="size-4" />
      {job.phase === "stopping" ? "Stopping after the current batch." : `Indexing in the cloud: ${Math.max(0, job.total - job.remaining)} of ${job.total} done, ${job.remaining} left${job.updatedAt ? `, last activity ${fmtRelative(job.updatedAt)}` : ""}. You can close this page.`}
    </span>
  ) : job?.phase === "stalled" ? (
    <span className="text-[#b54708]">Indexing stopped responding with {job.remaining} of {job.total} left{job.updatedAt ? ` (last activity ${fmtRelative(job.updatedAt)})` : ""}. Resume picks up where it stopped.</span>
  ) : failedRows.length || appFailures ? (
    <span className="text-mist-700">
      {failedRows.length} file{failedRows.length === 1 ? "" : "s"} couldn&apos;t be read{appFailures > 0 ? `, plus ${appFailures} bench and applicant resume${appFailures === 1 ? "" : "s"}` : ""}. Usually a scanned PDF with no text, or a damaged file.
    </span>
  ) : pendingNotFailed ? (
    <span className="text-mist-700">Make the rest searchable to include them in Lead sourcing and Best candidates. Extra copies are skipped.</span>
  ) : (
    <span className="text-mist-700">Every resume on file is searchable in Lead sourcing and Best candidates.</span>
  );
  const runPct = job && jobBusy && job.total ? ((job.total - job.remaining) / job.total) * 100 : null;
  const stat = (key: StatusKey, label: string, value: number, tone: string) => (
    <button
      type="button"
      aria-pressed={statusKey === key}
      onClick={() => setStatusKey((k) => (k === key ? null : key))}
      className={`flex min-h-10 min-w-0 flex-col items-start rounded-lg px-3 py-2 text-left ring-1 ring-inset transition-colors duration-150 ${statusKey === key ? "bg-ocean-50 ring-ocean-300" : "ring-mist-200 hover:bg-mist-50"}`}
    >
      <span className={`text-[20px] font-semibold leading-tight tabular-nums ${value ? tone : "text-mist-500"}`}>{value}</span>
      <span className="truncate text-[12px] text-mist-600">{label}</span>
    </button>
  );

  let body: React.ReactNode;
  if (loading)
    body = (
      <div role="status" aria-busy="true" aria-label="Loading the resume bank" className="grid gap-6">
        <PanelSkeleton height="h-24" />
        <TableSkeleton rows={8} />
      </div>
    );
  else if (resumes === null) body = <ErrorState title="Couldn't load the resume bank" onRetry={() => void load()} />;
  else if (list.length === 0)
    body =
      queue.length > 0 ? null : (
        <EmptyState
          framed
          variant="first-use"
          icon="resume"
          title="No resumes yet"
          body="Upload PDF or Word resumes, up to 5 MB each, or drop them anywhere on this page. Searchable files feed Lead sourcing and Best candidates."
          primary={{ label: "Choose files", icon: "upload", onClick: () => fileInput.current?.click() }}
        />
      );
  else
    body = (
      <>
        <Panel title="Bank health" action={healthAction}>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="text-[30px] font-semibold leading-none tracking-tight tabular-nums text-navy-900">{searchablePct}%</span>
              <span className="text-[14px] text-mist-600">searchable, {searchable} of {list.length} files</span>
            </div>
            <ProgressBar value={runPct ?? searchablePct} tone={runPct === null && searchablePct === 100 ? "green" : "blue"} />
            <p className="text-[13px]">{healthLine}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stat("indexed", "Searchable", searchable, "text-[#067647]")}
              {stat("pending", "Not searchable yet", pendingNotFailed, "text-navy-900")}
              {stat("failed", "Failed", failedRows.length, "text-[#b42318]")}
              {stat("duplicates", "Extra copies", extraCount, "text-[#b54708]")}
            </div>
          </div>
        </Panel>

        <section aria-label="Resume files" className="grid min-w-0 gap-3">
          <DataTable
            rows={shown}
            tabs={<TableTabs label="Search status" value={statusKey ?? "all"} onChange={(v) => setStatusKey(v === "all" ? null : v)} options={statusOptions} />}
            columns={columns}
            filters={filters}
            storageKey="resumes"
            exportName="resumes"
            onExport={(rows) =>
              downloadCsv(
                "resumes",
                ["File", "Format", "Candidate", "Uploaded By", "Size", "Uploaded", "Searchable"],
                rows.map((r) => [r.fileName, formatLabel(r.fileType), r.candidateName || "", r.uploaderEmail, fmtSize(r.fileSize || 0), fmtDate(r.uploadedAt), r.indexed ? "Yes" : "No"]),
              )
            }
            searchPlaceholder="Search file, candidate or uploader"
            emptyTitle={statusKey ? `No ${statusOptions.find((o) => o.value === statusKey)?.label.toLowerCase()} files` : "No files match"}
            detailTitle={(r) => r.fileName}
            detailActions={(r) => <Button size="sm" variant="secondary" icon="eye" onClick={() => void openPreview(r)}>{isPdf(r.fileType) ? "Preview" : "Open file"}</Button>}
            rowMenu={(r, openDetail): MenuEntry[] => {
              const row = list.find((x) => x.id === r.id) ?? r;
              const canIndex = !row.indexed && !isExtra(row) && !row.indexing;
              return [
                { label: "Open", icon: "eye", onSelect: openDetail },
                { label: isPdf(row.fileType) ? "Preview" : "Open file", icon: "external", onSelect: () => void openPreview(row) },
                { label: "Download", icon: "download", onSelect: () => void download(row) },
                ...(canIndex
                  ? [{ label: isFailed(row) ? "Retry making searchable" : "Make searchable", icon: "search" as const, disabled: rowIndexing || jobBusy, onSelect: () => void indexOne(row) }]
                  : []),
                { kind: "separator" },
                { label: "Delete", icon: "trash", danger: true, onSelect: () => setDeleteRow(row) },
              ];
            }}
            renderDetail={(r) => {
              const row = list.find((x) => x.id === r.id) ?? r;
              return (
                <div className="grid gap-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="grey">{formatLabel(row.fileType)}</Badge>
                    <IndexCell r={row} />
                  </div>
                  <KeyValue
                    items={[
                      { k: "Candidate", v: row.candidateName || "—" },
                      { k: "Uploaded by", v: row.uploaderEmail },
                      { k: "Uploaded", v: fmtDateTime(row.uploadedAt) },
                      { k: "Size", v: fmtSize(row.fileSize || 0) },
                    ]}
                  />
                  {isFailed(row) && serverFailures.get(row.fileKey) && <p className="rounded-lg bg-[#fef3f2] p-3 text-[13px] text-[#b42318]">{serverFailures.get(row.fileKey)}</p>}
                  <div className="flex flex-wrap gap-2 border-t border-mist-200 pt-5">
                    <Button icon="download" onClick={() => void download(row)}>Download</Button>
                    {!row.indexed && !isExtra(row) && (
                      <Button variant="secondary" icon="search" loading={row.indexing} disabled={rowIndexing || jobBusy} onClick={() => void indexOne(row)}>Make searchable</Button>
                    )}
                    <Button variant="danger" icon="trash" className="sm:ml-auto" onClick={() => setDeleteRow(row)}>Delete</Button>
                  </div>
                </div>
              );
            }}
          />
        </section>
      </>
    );

  return (
    <div
      className="min-w-0"
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDrag(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        addFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      {drag && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-navy-950/40 p-4">
          <div className="w-full max-w-sm rounded-xl border-2 border-dashed border-ocean-600 bg-mist-0 px-6 py-10 text-center shadow-2xl">
            <Icon name="upload" className="mx-auto size-7 text-ocean-600" />
            <p className="mt-3 text-[16px] font-semibold">Drop resumes to upload</p>
            <p className="mt-1 text-[13px] text-mist-600">PDF or Word, up to 5 MB each</p>
          </div>
        </div>
      )}

      <Page>
        <PageHeader
          section="recruiting"
          icon="resume"
          title="Resumes"
          description={
            resumes
              ? `${list.length} resume${list.length === 1 ? "" : "s"} on file${pendingIndex.length ? `, ${pendingIndex.length} not searchable yet` : ""}. Drop files anywhere to upload.`
              : "Resume files kept searchable for Lead sourcing and Best candidates."
          }
          actions={
            <>
              {list.length > 0 && (
                <InsightsSheet title="Resume insights" description="How fast the bank grows and who adds to it.">
                  <Panel title="Uploads per week" description="Last 12 weeks">
                    <TrendChart title="Resumes uploaded per week, last 12 weeks" labels={weeks.map((w) => w.label)} series={[{ name: "Uploads", values: uploadsWeekly }]} area height={220} />
                  </Panel>
                  <Panel title="By uploader">
                    <BarChart title="Resumes by uploader" labels={byUploader.map((u) => u.label)} series={[{ name: "Resumes", values: byUploader.map((u) => u.value) }]} height={220} />
                  </Panel>
                </InsightsSheet>
              )}
              <Button icon="upload" onClick={() => fileInput.current?.click()}>Upload</Button>
            </>
          }
        />

        {queue.length > 0 && (
          <Panel
            title={`Upload queue (${queue.length})`}
            action={
              <>
                {queue.some((q) => q.status === "done") && (
                  <Button size="sm" variant="ghost" onClick={() => setQueue((q) => q.filter((i) => i.status !== "done"))}>Clear done</Button>
                )}
                {!uploading && <Button size="sm" variant="ghost" icon="x" label="Close upload queue" onClick={() => setQueue([])} />}
              </>
            }
            padded={false}
          >
            <ul className="scroll-thin max-h-[360px] divide-y divide-mist-100 overflow-y-auto">
              {queue.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-5 py-3">
                  <Badge tone="grey">{formatLabel(item.file.type)}</Badge>
                  <div className="min-w-0 flex-1">
                    <p className="flex min-w-0 items-center gap-2 text-[14px]">
                      <span className="truncate font-medium">{item.file.name}</span>
                      <span className="shrink-0 text-[12px] tabular-nums text-mist-500">{fmtSize(item.file.size)}</span>
                      {item.status === "uploading" && <Spinner className="size-4 text-ocean-600" label="Uploading" />}
                      {item.status === "done" && <Icon name="check" className="size-4 shrink-0 text-[#067647]" title="Uploaded" />}
                    </p>
                    {item.status === "pending" && (
                      <input
                        aria-label={`Candidate name for ${item.file.name}`}
                        placeholder="Candidate name (optional)"
                        value={item.candidateName}
                        onChange={(e) => setItem(item.id, { candidateName: e.target.value })}
                        className={`${fieldCls} h-10`}
                      />
                    )}
                    {item.status === "error" && <p className="mt-1 text-[13px] text-[#b42318]">{item.error}</p>}
                  </div>
                  {(item.status === "pending" || item.status === "error") && (
                    <Button size="sm" variant="ghost" icon="x" label={`Remove ${item.file.name}`} onClick={() => setQueue((q) => q.filter((i) => i.id !== item.id))} />
                  )}
                </li>
              ))}
            </ul>
            {(pendingCount > 0 || uploading) && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-mist-200 px-5 py-3">
                <span className="text-[13px] text-mist-600">{pendingCount ? `${pendingCount} ready to upload` : "Uploading"}</span>
                <Button icon="upload" loading={uploading} disabled={!pendingCount} onClick={() => void uploadAll()}>
                  Upload {pendingCount || ""} file{pendingCount === 1 ? "" : "s"}
                </Button>
              </div>
            )}
          </Panel>
        )}

        {body}
      </Page>

      {deleteRow && (
        <ConfirmDialog title="Delete resume?" body={`${deleteRow.fileName} will be permanently removed from storage.`} confirmLabel="Delete" busy={deleting} onCancel={() => setDeleteRow(null)} onConfirm={() => void remove()} />
      )}
      {dupOpen && <DuplicatesDialog groups={dupGroups} onClose={() => setDupOpen(false)} onPreview={(r) => void openPreview(r)} onDelete={deleteKeys} />}
      {preview && (
        <Modal
          size="xl"
          title={preview.name}
          onClose={() => setPreview(null)}
          footer={
            <>
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-[14px] font-medium text-navy-900 transition-colors hover:bg-mist-100">
                <Icon name="external" className="size-[18px]" />
                Open in a new tab
              </a>
              <Button variant="secondary" icon="download" onClick={() => {
                const a = document.createElement("a");
                a.href = preview.url;
                a.download = preview.name;
                a.rel = "noopener noreferrer";
                a.click();
              }}>Download</Button>
            </>
          }
        >
          <iframe src={preview.url} title={preview.name} className="block h-[70svh] w-full rounded-lg ring-1 ring-mist-200" />
        </Modal>
      )}
    </div>
  );
}

/** One group per duplicated file: pick the copy to keep, delete the rest. */
function DuplicatesDialog({
  groups,
  onClose,
  onPreview,
  onDelete,
}: {
  groups: DuplicateGroup<DupRef>[];
  onClose: () => void;
  onPreview: (r: BankResume) => void;
  onDelete: (keys: string[]) => Promise<boolean>;
}) {
  const [keep, setKeep] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const keeperOf = (g: DuplicateGroup<DupRef>) => keep[g.groupKey] ?? g.keeper.key;
  const toDelete = groups.flatMap((g) => g.files.filter((f) => f.key !== keeperOf(g)).map((f) => f.key));

  const run = async () => {
    setBusy(true);
    const ok = await onDelete(toDelete);
    setBusy(false);
    setConfirming(false);
    if (ok) onClose();
  };

  return (
    <Modal
      title="Duplicate resumes"
      size="lg"
      onClose={busy ? () => {} : onClose}
      footer={
        confirming ? (
          <>
            <span className="mr-auto text-[13px] text-[#b42318]">Permanently deletes {toDelete.length} file{toDelete.length === 1 ? "" : "s"}.</span>
            <Button variant="secondary" disabled={busy} onClick={() => setConfirming(false)}>Back</Button>
            <Button variant="danger" icon="trash" loading={busy} onClick={() => void run()}>Delete {toDelete.length}</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button variant="danger" icon="trash" disabled={!toDelete.length} onClick={() => setConfirming(true)}>
              Delete {toDelete.length} extra {toDelete.length === 1 ? "copy" : "copies"}
            </Button>
          </>
        )
      }
    >
      <p className="text-[14px] text-mist-700">Same file name and size. Choose the copy to keep in each group; every other copy is deleted.</p>
      <ul className="mt-4 grid gap-3">
        {groups.map((g) => {
          const kept = keeperOf(g);
          const losesIndexed = !g.files.find((f) => f.key === kept)?.indexed && g.files.some((f) => f.indexed);
          return (
            <li key={g.groupKey} className="overflow-hidden rounded-lg ring-1 ring-mist-200">
              <p className="flex items-center justify-between gap-3 bg-mist-50 px-3 py-2 text-[13px]">
                <span className="truncate font-semibold">{g.keeper.fileName}</span>
                <span className="shrink-0 tabular-nums text-mist-600">{g.files.length} copies</span>
              </p>
              <ul className="divide-y divide-mist-100">
                {g.files.map((f) => (
                  <li key={f.key} className="flex items-center gap-3 px-3 py-2 text-[13px]">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5">
                      <input type="radio" name={g.groupKey} checked={f.key === kept} onChange={() => setKeep((k) => ({ ...k, [g.groupKey]: f.key }))} className="size-4 accent-ocean-600" />
                      <span className="min-w-0">
                        <span className="block truncate">{f.row.candidateName || f.row.uploaderEmail}</span>
                        <span className="block truncate text-[12px] text-mist-500">{fmtDateTime(f.row.uploadedAt)}{f.indexed ? ", searchable" : ""}</span>
                      </span>
                    </label>
                    <span className={`font-semibold ${f.key === kept ? "text-[#067647]" : "text-[#b42318]"}`}>{f.key === kept ? "Keep" : "Delete"}</span>
                    <Button size="sm" variant="ghost" icon="eye" label={`Preview ${f.fileName}`} onClick={() => onPreview(f.row)} />
                  </li>
                ))}
              </ul>
              {losesIndexed && <p className="bg-[#fffaeb] px-3 py-2 text-[12px] text-[#b54708]">The searchable copy will be deleted. Run Make all searchable afterwards.</p>}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
