"use client";

import * as React from "react";
import { Dialog as D } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

const FOCUSABLE = ":is(input:not([type=hidden]), select, textarea, button, [href], [tabindex]:not([tabindex='-1'])):not(:disabled)";

export interface AdminDialogProps {
  open: boolean;
  /** Called with false on Escape, scrim click or the close button. Gate it to guard unsaved work. */
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Shown before the title; decorative. */
  icon?: React.ReactNode;
  size?: keyof typeof SIZES;
  /** Buttons beside the close button in the header. */
  actions?: React.ReactNode;
  /** Sticky action row under the body. */
  footer?: React.ReactNode;
  /** Focused on open; defaults to the first field in the body, then the footer. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  /** Blocks every dismiss path while a request is in flight. */
  busy?: boolean;
  hideClose?: boolean;
  /** Use "alertdialog" for confirmations. */
  role?: "dialog" | "alertdialog";
  className?: string;
  bodyClassName?: string;
  children?: React.ReactNode;
}

/**
 * The console's modal. Radix supplies the focus trap, Escape, scrim dismissal,
 * focus return to whatever was focused before opening, and aria wiring.
 * Portalled into an `.adm-scope` wrapper so console focus rules still apply.
 */
export function AdminDialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  size = "md",
  actions,
  footer,
  initialFocusRef,
  busy = false,
  hideClose = false,
  role = "dialog",
  className,
  bodyClassName,
  children,
}: AdminDialogProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const handleOpenChange = (next: boolean) => {
    if (!next && busy) return;
    onOpenChange(next);
  };

  return (
    <D.Root open={open} onOpenChange={handleOpenChange}>
      <D.Portal>
        <div className="adm-scope contents">
          <D.Overlay className="adm-dialog-scrim fixed inset-0 z-[120] bg-[var(--adm-scrim)]" />
          <D.Content
            role={role}
            {...(description ? {} : { "aria-describedby": undefined })}
            ref={contentRef}
            onOpenAutoFocus={(e) => {
              // Skip the header close button: land on the first field, or the first action.
              const target = initialFocusRef?.current
                ?? contentRef.current?.querySelector<HTMLElement>(`[data-slot="body"] ${FOCUSABLE}, [data-slot="footer"] ${FOCUSABLE}`);
              if (target) {
                e.preventDefault();
                target.focus();
              }
            }}
            className={cn(
              "adm-dialog fixed left-1/2 top-1/2 z-[120] flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden",
              "rounded-[var(--adm-radius-dialog)] border border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink)] shadow-[var(--adm-shadow-lg)] focus:outline-none",
              SIZES[size],
              className,
            )}
          >
            <div
              className={cn(
                "flex flex-none items-start gap-3 px-4 sm:px-5",
                children != null ? "border-b border-[var(--adm-line-soft)] py-3.5" : "py-5",
              )}
            >
              {icon && <span className="mt-0.5 flex-none" aria-hidden="true">{icon}</span>}
              <div className="min-w-0 flex-1">
                <D.Title className="text-[15px] font-semibold leading-6 tracking-[-0.015em] text-[var(--adm-ink)]">
                  {title}
                </D.Title>
                {description && (
                  <D.Description className="mt-0.5 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                    {description}
                  </D.Description>
                )}
              </div>
              {actions && <div className="flex flex-none items-center gap-2">{actions}</div>}
              {!hideClose && (
                <D.Close
                  disabled={busy}
                  aria-label="Close"
                  className="-mr-1.5 -mt-1 grid h-8 w-8 flex-none place-items-center rounded-[var(--adm-radius-control)] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] disabled:opacity-50"
                >
                  <X className="h-[18px] w-[18px]" aria-hidden="true" />
                </D.Close>
              )}
            </div>

            {children != null && (
              <div data-slot="body" className={cn("min-h-0 flex-1 overflow-y-auto p-4 sm:p-5", bodyClassName)}>{children}</div>
            )}

            {footer && (
              <div data-slot="footer" className="flex flex-none flex-col-reverse gap-2 border-t border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-3 sm:flex-row sm:items-center sm:justify-end sm:px-5">
                {footer}
              </div>
            )}
          </D.Content>
        </div>
      </D.Portal>
    </D.Root>
  );
}
