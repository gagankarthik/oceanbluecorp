"use client";

import { useRef } from "react";
import { Loader2 } from "lucide-react";
import { IconWarning, IconTrash } from "./icons";
import { AdminDialog } from "./admin-dialog";
import { WorkspaceButton } from "./workspace";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "danger" → rose (delete). "default" → cobalt. */
  tone?: "danger" | "default";
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Shared confirmation modal, replaces window.confirm(). Built on AdminDialog:
 * focus trapped, Escape cancels, Cancel focused first, focus returns to the
 * element that opened it.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const danger = tone === "danger";

  return (
    <AdminDialog
      open={open}
      onOpenChange={(next) => { if (!next) onCancel(); }}
      role="alertdialog"
      size="sm"
      busy={busy}
      hideClose
      title={title}
      description={body}
      initialFocusRef={cancelRef}
      icon={danger
        ? <IconTrash className="h-5 w-5 text-[var(--adm-danger-ink)]" />
        : <IconWarning className="h-5 w-5 text-[var(--adm-accent)]" />}
      footer={
        <>
          <WorkspaceButton ref={cancelRef} onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </WorkspaceButton>
          <WorkspaceButton variant={danger ? "danger" : "primary"} onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </WorkspaceButton>
        </>
      }
    />
  );
}
