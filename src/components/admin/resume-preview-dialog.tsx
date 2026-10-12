"use client";

import { AdminDialog } from "@/components/admin/admin-dialog";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconDownload, IconFile } from "@/components/admin/icons";

const isPdfName = (name: string | null | undefined) => /\.pdf$/i.test(name || "");

/**
 * A resume file in a dialog: PDFs render inline, anything else (Word files the
 * browser can't show) gets a short note and a Download button instead of a
 * blank frame that silently starts a download.
 */
export function ResumePreviewDialog({
  url,
  name,
  onClose,
}: {
  url: string | null;
  name?: string | null;
  onClose: () => void;
}) {
  const pdf = isPdfName(name) || (!!url && /\.pdf(\?|$)/i.test(url));
  return (
    <AdminDialog
      open={!!url}
      onOpenChange={(next) => { if (!next) onClose(); }}
      title={<span className="block truncate">{name || "Resume preview"}</span>}
      size="xl"
      className={pdf ? "h-[calc(100dvh-2rem)] max-w-[min(1200px,calc(100vw-2rem))] sm:h-[calc(100dvh-3rem)]" : undefined}
      bodyClassName={pdf ? "flex p-0 sm:p-0 overflow-hidden" : undefined}
      actions={url && (
        <WorkspaceButton asChild>
          <a href={url} download={name || "resume"}>
            <IconDownload className="h-4 w-4" /><span className="hidden sm:inline">Download</span>
          </a>
        </WorkspaceButton>
      )}
    >
      {url && (pdf ? (
        <iframe src={url} className="h-full w-full flex-1 border-0" title={name || "Resume preview"} />
      ) : (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <IconFile className="h-8 w-8 text-[var(--adm-ink-subtle)]" aria-hidden="true" />
          <p className="max-w-sm text-adm-base text-[var(--adm-ink-mute)]">
            This resume is a Word document, which the browser can&apos;t show. Download it to read it.
          </p>
          <WorkspaceButton asChild variant="primary">
            <a href={url} download={name || "resume"}>
              <IconDownload className="h-4 w-4" />Download resume
            </a>
          </WorkspaceButton>
        </div>
      ))}
    </AdminDialog>
  );
}
