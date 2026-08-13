"use client";

import { Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/admin/status-badge";
import type { Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

/* ============================================================
   AccountState, whether a staff account can sign in.

   Was a StatusBadge wrapped in a bare button whose only hover
   affordance was `opacity-75`. Two problems with that:

   - A badge is a READ-ONLY indicator everywhere else in this
     app, so the one place it silently toggles a colleague's
     access looked identical to the dozens of places it reports
     something. Nothing said it could be clicked.
   - Inactive used the neutral `slate` tone, so a revoked
     account read as "no status set" rather than "cannot sign
     in", the two states looked like a value and its absence,
     not like on and off.

   A switch says both things at once: it is obviously operable,
   and its position IS the state. Active is filled green,
   inactive is a visibly-off track with the label in danger ink,
   so the difference survives a glance down a column.

   `pending` gets no switch. An invited person has not accepted
   yet, so there is nothing to turn off, offering a control
   that cannot do anything is worse than not offering one.
   ============================================================ */

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
        "group inline-flex items-center gap-2 rounded-[6px] px-1 py-1 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)]",
        (busy || disabled) && "cursor-not-allowed opacity-60",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "relative inline-flex h-[18px] w-8 flex-none items-center rounded-full border transition-colors duration-200",
          // The OFF track carries a border because no light-grey fill can reach
          // 3:1 against white (1.4.11 Non-text Contrast), the boundary is what
          // makes the control discernible, not the fill.
          on
            ? "border-[var(--adm-success)] bg-[var(--adm-success)]"
            : "border-[var(--adm-ink-subtle)] bg-[var(--adm-line-strong)]",
          !busy && !disabled && "group-hover:brightness-95",
        )}
      >
        <span
          className={cn(
            "grid h-[14px] w-[14px] place-items-center rounded-full bg-white shadow-sm transition-transform duration-200",
            on ? "translate-x-[16px]" : "translate-x-[2px]",
          )}
        >
          {busy && <Loader2 className="h-2.5 w-2.5 animate-spin text-[var(--adm-ink-subtle)]" />}
        </span>
      </span>

      <span
        className={cn(
          "text-[12.5px] font-semibold",
          // `-ink`, not the fill token: the label is text and the fill token
          // is 3.77:1 on white.
          on ? "text-[var(--adm-success-ink)]" : "text-[var(--adm-danger-ink)]",
        )}
      >
        {on ? "Active" : "Inactive"}
      </span>
    </button>
  );
}
