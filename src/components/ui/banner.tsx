"use client";

import * as React from "react";
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Banner.
 *
 * A persistent, in-page message. Not a toast: a toast is for something that
 * just happened and can be missed, a banner is for a condition that is still
 * true and needs to stay on screen.
 *
 * Tone is carried by an icon and a heading as well as by colour, so the
 * message survives being read by someone who cannot separate the greens from
 * the ambers. Colour alone is never the signal.
 *
 * Only info and success can be dismissed. A warning or an error describes a
 * state the reader has not resolved yet, and letting them close it hides the
 * problem rather than fixing it, so `onDismiss` is ignored for those tones.
 */

type Tone = "info" | "success" | "warning" | "error" | "neutral";

const TONES: Record<
  Tone,
  { wrap: string; icon: string; Icon: React.ComponentType<{ className?: string; strokeWidth?: number }> }
> = {
  info: {
    wrap: "border-[var(--hz-cobalt)]/25 bg-[var(--hz-cobalt-100)]/50",
    icon: "text-[var(--hz-cobalt)]",
    Icon: Info,
  },
  success: {
    wrap: "border-emerald-600/25 bg-emerald-50",
    icon: "text-emerald-700",
    Icon: CheckCircle2,
  },
  warning: {
    wrap: "border-amber-600/30 bg-amber-50",
    icon: "text-amber-700",
    Icon: AlertTriangle,
  },
  error: {
    wrap: "border-red-600/25 bg-red-50",
    icon: "text-red-700",
    Icon: AlertCircle,
  },
  neutral: {
    wrap: "border-[var(--hz-line)] bg-[var(--hz-surface-2)]",
    icon: "text-[var(--hz-text-subtle)]",
    Icon: Info,
  },
};

export function Banner({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: {
  tone?: Tone;
  title: string;
  /** Optional detail. A title alone is fine when it says enough. */
  children?: React.ReactNode;
  /** One action, when there is something to do about it. */
  action?: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}) {
  const cfg = TONES[tone];
  const dismissible = onDismiss && (tone === "info" || tone === "success" || tone === "neutral");

  return (
    <div
      // Errors and warnings interrupt; info and success are announced politely
      // when the reader next pauses.
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex gap-3.5 rounded-xl border p-4 sm:p-[18px]", cfg.wrap, className)}
    >
      <cfg.Icon className={cn("mt-0.5 h-5 w-5 flex-none", cfg.icon)} strokeWidth={1.75} />

      <div className="min-w-0 flex-1">
        <p className="text-small font-semibold text-[var(--hz-text)]">{title}</p>
        {children && (
          <div className="mt-1.5 text-fine leading-relaxed text-[var(--hz-text-mute)]">{children}</div>
        )}
        {action && <div className="mt-3.5">{action}</div>}
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label={`Dismiss: ${title}`}
          className="hz-focus -mr-1 -mt-1 grid h-8 w-8 flex-none place-items-center rounded-lg text-[var(--hz-text-subtle)] transition-colors hover:bg-black/[0.04] hover:text-[var(--hz-text)]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
