"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * The shared button.
 *
 * Before this there was no button component at all: the marketing site used
 * the `Cta` pill, the admin console used raw `<button>` with the classes
 * retyped at every call site, and the two drifted. This is the one for
 * application UI. `Cta` stays what it is, the marketing pill, and is not
 * replaced by this.
 *
 * Sizes and colours come from the --adm-* token set, so a brand retune moves
 * every button without touching this file.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--adm-accent)] text-white hover:bg-[var(--adm-accent-strong)] active:bg-[var(--adm-accent-strong)]",
  secondary:
    "bg-white text-[var(--adm-ink)] ring-1 ring-inset ring-[var(--adm-line)] hover:bg-[var(--adm-surface-2)] active:bg-[var(--adm-surface-2)]",
  ghost:
    "bg-transparent text-[var(--adm-ink-2)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
  // Destructive actions are the one place the accent is not used: a delete
  // that looks like a save is a UI that gets people into trouble.
  danger:
    "bg-[var(--adm-danger)] text-white hover:opacity-90 active:opacity-90",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 gap-1.5 px-3 text-fine",
  md: "h-9 gap-2 px-4 text-fine",
  lg: "h-11 gap-2 px-5 text-small",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Renders a spinner and blocks input. Keeps its width so the row is stable. */
  loading?: boolean;
  /** Square, for a single icon. */
  iconOnly?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading = false, iconOnly = false, disabled, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      // A loading button must not be clickable, but `disabled` alone removes it
      // from the tab order mid-interaction, which moves focus unexpectedly.
      // aria-busy tells assistive tech what is happening either way.
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-lg font-semibold",
        "transition-[background-color,box-shadow,transform] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-accent)] focus-visible:ring-offset-2",
        "active:scale-[0.985]",
        "disabled:pointer-events-none disabled:opacity-55",
        VARIANTS[variant],
        SIZES[size],
        iconOnly && (size === "sm" ? "w-8 px-0" : size === "lg" ? "w-11 px-0" : "w-9 px-0"),
        className
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current motion-reduce:animate-none"
        />
      )}
      {children}
    </button>
  );
});
