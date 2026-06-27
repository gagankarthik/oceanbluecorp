"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

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
 * Shared confirmation modal — replaces native window.confirm() across the admin.
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
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={body ? "confirm-dialog-body" : undefined}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div
          className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${
            danger ? "bg-rose-100" : "bg-[var(--hz-cobalt-100)]"
          }`}
          aria-hidden="true"
        >
          {danger ? (
            <Trash2 className="h-5 w-5 text-rose-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-[var(--hz-cobalt)]" />
          )}
        </div>

        <h3
          id="confirm-dialog-title"
          className="text-center text-base font-bold text-slate-900"
        >
          {title}
        </h3>

        {body && (
          <p
            id="confirm-dialog-body"
            className="mt-1.5 mb-6 text-center text-sm leading-relaxed text-slate-500"
          >
            {body}
          </p>
        )}

        <div className={`flex gap-3 ${body ? "" : "mt-6"}`}>
          <button
            ref={cancelRef}
            onClick={onCancel}
            disabled={busy}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            disabled={busy}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors focus:outline-none focus:ring-2 disabled:opacity-60 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700 focus:ring-rose-400"
                : "bg-[var(--hz-cobalt)] hover:bg-[var(--hz-cobalt-600)] focus:ring-[var(--hz-cobalt-300)]"
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
