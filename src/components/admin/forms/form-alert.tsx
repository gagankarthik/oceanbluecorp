"use client";

import * as React from "react";
import { X } from "lucide-react";
import { IconAlert, IconWarning } from "../icons";
import { cn } from "@/lib/utils";

/** Server/save failure at the top of a form. Renders nothing without a message. */
export function FormErrorBanner({
  message,
  onDismiss,
  className,
}: {
  message?: string | null;
  onDismiss?: () => void;
  className?: string;
}) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-[10px] border border-[var(--adm-danger)] bg-[var(--adm-danger-soft)] px-3 py-2.5 text-[13px] leading-snug text-[var(--adm-danger-ink)]",
        className,
      )}
    >
      <IconAlert className="mt-px h-4 w-4 flex-none" aria-hidden="true" />
      <p className="min-w-0 flex-1">{message}</p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="-my-0.5 grid h-6 w-6 flex-none place-items-center rounded-[6px] transition-colors hover:bg-[var(--adm-surface)]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

/** Field's error line for a control that has no Field (label-less inputs). `id` is `${controlId}-error`. */
export function FieldError({ id, children, className }: { id?: string; children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className={cn("mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--adm-danger-ink)]", className)}
    >
      <IconAlert className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
      {children}
    </p>
  );
}

/** Non-blocking note under a control; Field only has error (blocking) and helper. */
export function FieldWarning({ children, className }: { children?: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p className={cn("mt-2 flex items-start gap-1.5 text-[12.5px] font-medium leading-snug text-[var(--adm-warning-ink)]", className)}>
      <IconWarning className="mt-px h-3.5 w-3.5 flex-none" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
