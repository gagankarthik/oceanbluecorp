"use client";

import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Square tick box for a task row. */
export function TaskCheck({
  done, busy, label, onToggle,
}: {
  done: boolean;
  busy: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={done}
      aria-label={done ? `Reopen: ${label}` : `Mark done: ${label}`}
      onClick={onToggle}
      disabled={busy}
      className={cn(
        "mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-[4px] border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)] disabled:opacity-60",
        done
          ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white"
          : "border-[var(--adm-line-strong)] bg-[var(--adm-surface)] hover:border-[var(--adm-accent)]",
      )}
    >
      {busy ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> : done && <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />}
    </button>
  );
}
