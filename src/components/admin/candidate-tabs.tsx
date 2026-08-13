"use client";

import Link from "next/link";
import type { BenchType } from "@/lib/aws/dynamodb";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconSource } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * The candidate-pool tabs, with Lead Sourcing as an action at the far end.
 *
 * Lead Sourcing used to be its own sidebar entry, which put it a section away
 * from the people it searches. It now sits on this row instead, and it is a
 * BUTTON rather than a tab on purpose: the tabs re-scope the list underneath
 * them without leaving the page, while Lead Sourcing is a different screen.
 * Rendering it as a fourth tab would have borrowed the visual language of
 * filtering for something that navigates, which is the same mistake the
 * workspace toolbar comments already warn about.
 *
 * A real <Link> inside the button, so middle-click and open-in-new-tab work.
 */

export type PoolTabKey = "all" | BenchType;

const POOL_TABS: { key: PoolTabKey; label: string; hint: string }[] = [
  { key: "all", label: "All candidates", hint: "" },
  ...POOL_ORDER.map((p) => ({ key: p, label: POOL_META[p].label, hint: POOL_META[p].badge })),
];

export function CandidateTabs({
  active,
  counts,
  onSelect,
  className,
}: {
  active: PoolTabKey;
  /** Per-pool tallies, shown as a trailing count on each tab. */
  counts?: Partial<Record<PoolTabKey, number>>;
  onSelect: (key: PoolTabKey) => void;
  className?: string;
}) {
  return (
    // justify-between: tabs anchor left, the action anchors to the far end of
    // the screen. Wraps rather than squashing on a narrow window.
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div
        role="tablist"
        aria-label="Talent pool"
        className="flex max-w-full items-center gap-0.5 self-start overflow-x-auto rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5 sm:inline-flex sm:w-auto"
      >
        {POOL_TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(t.key)}
              className={cn(
                "inline-flex flex-none items-center gap-1.5 rounded-[6px] px-3 py-1.5 text-[13px] font-semibold transition-colors",
                isActive
                  ? "bg-[var(--adm-surface)] text-[var(--adm-ink)] shadow-sm"
                  : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
              )}
            >
              {t.label}
              {t.hint && (
                <span className="text-[11px] font-medium text-[var(--adm-ink-subtle)]">{t.hint}</span>
              )}
              {counts?.[t.key] !== undefined && (
                <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-px text-[11px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                  {counts[t.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary, not primary: the page already has one filled action ("Add
          profile") and two would compete (DESIGN_SYSTEM §8, Von Restorff). */}
      <WorkspaceButton asChild>
        <Link href={`/admin/lead-sourcing?from=${active}`}>
          <IconSource className="h-4 w-4" aria-hidden="true" />
          Lead Sourcing
        </Link>
      </WorkspaceButton>
    </div>
  );
}
