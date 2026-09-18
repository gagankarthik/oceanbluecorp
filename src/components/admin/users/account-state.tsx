"use client";

import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

/** Whether a staff account can sign in: a switch for active/inactive, a plain badge for pending invites (nothing to toggle yet). */

export type AccountStatus = "active" | "inactive" | "pending";

export function AccountState({
  status,
  label,
  tone,
  busy = false,
  disabled = false,
  disabledReason,
  onToggle,
}: {
  status: AccountStatus;
  /** Label for the non-toggle states, from the page's STATUS_META. */
  label: string;
  tone: Tone;
  busy?: boolean;
  /** e.g. you cannot deactivate yourself. */
  disabled?: boolean;
  disabledReason?: string;
  onToggle: () => void;
}) {
  if (status === "pending") {
    return <StatusBadge tone={tone} label={label} size="md" />;
  }

  const on = status === "active";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${on ? "Deactivate" : "Activate"} this account`}
      title={disabled ? disabledReason : on ? "Deactivate this account" : "Activate this account"}
      disabled={busy || disabled}
      onClick={onToggle}
      className={cn(
        "group -ml-1 inline-flex items-center gap-2 rounded-[8px] px-1.5 py-1 transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)]",
        (busy || disabled) ? "cursor-not-allowed opacity-60" : "hover:bg-[var(--adm-surface-2)]",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-[18px] w-8 flex-none items-center rounded-full border transition-colors duration-200",
          // Off track needs the border: no light fill reaches 3:1 non-text contrast on white.
          on
            ? "border-[var(--adm-success)] bg-[var(--adm-success)]"
            : "border-[var(--adm-ink-subtle)] bg-[var(--adm-line-strong)]",
          !busy && !disabled && "group-hover:brightness-95",
        )}
      >
        <span
          className={cn(
            "grid h-[14px] w-[14px] place-items-center rounded-full bg-white shadow-[var(--adm-shadow-sm)] transition-transform duration-200",
            on ? "translate-x-[16px]" : "translate-x-[2px]",
          )}
        >
          {busy && <Loader2 className="h-2.5 w-2.5 animate-spin text-[var(--adm-ink-subtle)]" />}
        </span>
      </span>

      <span
        className={cn(
          "text-[13px] font-medium",
          on ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-danger-ink)]",
        )}
      >
        {on ? "Active" : "Inactive"}
      </span>
    </button>
  );
}
