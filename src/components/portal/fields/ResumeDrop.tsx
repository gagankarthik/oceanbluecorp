"use client";

import { useId, useState } from "react";
import Icon from "../icons";
import { FieldError } from "./base";

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const RESUME_HINT = "PDF or Word, up to 5 MB";

const EXTS = [".pdf", ".doc", ".docx"];
const TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Extension and type. Browsers report .doc/.docx inconsistently (blank or
 * octet-stream), so only a type that is clearly something else rejects.
 */
export function resumeFileError(file: File): string | null {
  const name = file.name.toLowerCase();
  const typeOk = !file.type || file.type === "application/octet-stream" || TYPES.has(file.type);
  if (!EXTS.some((ext) => name.endsWith(ext)) || !typeOk) return "Choose a PDF or Word document (.pdf, .doc or .docx).";
  if (file.size > RESUME_MAX_BYTES) return "This file is larger than 5 MB. Choose a smaller copy of the resume.";
  return null;
}

const kb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

function FileRow({ name, meta, children }: { name: string; meta: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-mist-50 px-3.5 py-3 ring-1 ring-inset ring-mist-200">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-mist-0 text-mist-600 ring-1 ring-mist-200">
        <Icon name="resume" className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-medium text-navy-900">{name}</p>
        <p className="text-[12px] text-mist-600">{meta}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap items-center gap-1">{children}</div>}
    </div>
  );
}

const iconBtn = "grid size-9 place-items-center rounded-lg text-mist-600 hover:bg-mist-100 hover:text-navy-900";
const dangerBtn = "grid size-9 place-items-center rounded-lg text-mist-600 hover:bg-[#fef3f2] hover:text-[#b42318]";

/**
 * Resume picker with drop support. Shows a newly chosen file, else the file on
 * record, else the drop zone. `onPick` returns a rejection message or null.
 */
export function ResumeDrop({
  file,
  existing,
  onPick,
  onClearFile,
  onRemoveExisting,
  onDownload,
  error,
  fileActions,
  helper = "Read after saving.",
}: {
  file: File | null;
  existing?: { fileName: string; origin: "record" | "bench" } | null;
  onPick: (file: File) => string | null | void;
  onClearFile: () => void;
  onRemoveExisting?: () => void;
  onDownload?: () => void;
  error?: string | null;
  /** Extra controls beside a newly chosen file, e.g. "Fill form from resume" */
  fileActions?: React.ReactNode;
  helper?: string;
}) {
  const inputId = useId();
  const [over, setOver] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const take = (f: File | undefined | null) => {
    if (!f) return;
    const invalid = resumeFileError(f);
    if (invalid) {
      setLocalError(invalid);
      return;
    }
    setLocalError(null);
    onPick(f);
  };

  const shownError = error || localError;

  return (
    <div className="grid gap-3">
      {file ? (
        <FileRow name={file.name} meta={`${kb(file.size)} · ${existing ? "replaces the current resume on save" : "attached on save"}`}>
          {fileActions}
          <button type="button" aria-label="Remove the chosen file" onClick={onClearFile} className={dangerBtn}>
            <Icon name="x" className="size-4" />
          </button>
        </FileRow>
      ) : existing ? (
        <FileRow name={existing.fileName} meta={existing.origin === "bench" ? "From the bench profile" : "Current resume on file"}>
          {onDownload && existing.origin === "record" && (
            <button type="button" aria-label="Download resume" onClick={onDownload} className={iconBtn}>
              <Icon name="download" className="size-4" />
            </button>
          )}
          {onRemoveExisting && (
            <button type="button" aria-label="Remove resume" onClick={onRemoveExisting} className={dangerBtn}>
              <Icon name="trash" className="size-4" />
            </button>
          )}
        </FileRow>
      ) : null}

      {!file && (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            take(e.dataTransfer.files?.[0]);
          }}
          className={`flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed px-4 py-5 text-center transition-colors focus-within:ring-2 focus-within:ring-ocean-600 ${
            over ? "border-ocean-500 bg-ocean-50" : "border-mist-300 bg-mist-50 hover:border-ocean-400 hover:bg-ocean-50/50"
          }`}
        >
          <input
            id={inputId}
            type="file"
            accept={RESUME_ACCEPT}
            className="sr-only"
            onChange={(e) => {
              take(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Icon name="upload" className="size-5 text-mist-600" />
          <span className="text-[14px] font-medium text-navy-900">
            {existing ? "Upload a replacement" : "Upload a resume"} <span className="font-normal text-mist-600">or drop it here</span>
          </span>
          <span className="text-[12px] text-mist-600">
            {RESUME_HINT}. {helper}
          </span>
        </label>
      )}
      <FieldError>{shownError}</FieldError>
    </div>
  );
}
