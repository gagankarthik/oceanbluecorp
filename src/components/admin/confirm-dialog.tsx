"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { IconWarning, IconTrash } from "./icons";

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
 * Shared confirmation modal, replaces native window.confirm() across the admin.
 * Render it once per page with controlled `open` state.
 *
 * A11y: focus is trapped inside the dialog while open; Escape closes it;
 * focus returns to the trigger element when closed.
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
  const confirmRef = useRef<HTMLButtonElement>(null);
  const danger = tone === "danger";

  // Focus the cancel button when the dialog opens (safe default for destructive actions).
  useEffect(() => {
    if (open) {
      // Defer so the element is visible before focusing.
      const id = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Escape key closes the dialog.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, busy, onCancel]);

  // Tab key traps focus between cancel and confirm buttons.
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean) as HTMLButtonElement[];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[var(--adm-scrim)] p-4 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={body ? "confirm-dialog-body" : undefined}
    >
      <div className="w-full max-w-md rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-lg)]">
        <div className="flex gap-3.5 p-5 sm:p-6">
          {danger ? (
            <IconTrash className="mt-0.5 h-5 w-5 flex-none text-[var(--adm-danger-ink)]" aria-hidden="true" />
          ) : (
            <IconWarning className="mt-0.5 h-5 w-5 flex-none text-[var(--adm-accent)]" aria-hidden="true" />
          )}
          <div className="min-w-0">
            <h3 id="confirm-dialog-title" className="text-[16px] font-semibold tracking-[-0.01em] text-[var(--adm-ink)]">
              {title}
            </h3>
            {body && (
              <p id="confirm-dialog-body" className="mt-1.5 text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
                {body}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6 rounded-b-[14px]">
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="inline-flex h-10 items-center justify-center rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-4 text-[14px] font-semibold text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)] transition-colors hover:border-[var(--adm-line-strong)] hover:bg-[var(--adm-row-hover)] disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-[10px] px-4 text-[14px] font-semibold text-white transition-colors disabled:opacity-60 ${
              danger
                ? "bg-[var(--adm-danger)] hover:bg-[var(--adm-danger-ink)]"
                : "bg-[var(--adm-accent)] shadow-[var(--adm-shadow-accent)] hover:bg-[var(--adm-accent-strong)]"
            }`}
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
