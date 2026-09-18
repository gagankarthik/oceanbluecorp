"use client";

import Link from "next/link";
import type { BenchType } from "@/lib/aws/dynamodb";
import { POOL_META, POOL_ORDER } from "@/lib/bench";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconSource } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * Candidate-pool tabs, with Lead sourcing as an action at the far end. It is a
 * button, not a tab: the tabs re-scope the list, Lead sourcing is another screen.
 * Segmented styling matches PeriodSwitcher.
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
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div
        role="tablist"
        aria-label="Talent pool"
        className="inline-flex h-9 max-w-full flex-none items-center gap-0.5 overflow-x-auto rounded-[9px] border border-[var(--adm-line)] bg-[var(--adm-seg-track)] p-0.5"
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
                "flex h-full flex-none items-center gap-1.5 whitespace-nowrap rounded-[7px] px-2.5 text-[12.5px] font-medium transition-colors duration-150",
                isActive
                  ? "bg-[var(--adm-seg-active)] text-[var(--adm-ink)] shadow-[var(--adm-shadow-sm)]"
                  : "text-[var(--adm-ink-mute)] hover:text-[var(--adm-ink)]",
              )}
            >
              {t.label}
              {t.hint && (
                <span className="hidden text-[12px] font-normal text-[var(--adm-ink-subtle)] sm:inline">{t.hint}</span>
              )}
              {counts?.[t.key] !== undefined && (
                <span className="rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-px text-[12px] font-medium tabular-nums text-[var(--adm-ink-mute)]">
                  {counts[t.key]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary: the page's filled action is "Add profile". */}
      <WorkspaceButton asChild>
        <Link href={`/admin/lead-sourcing?from=${active}`}>
          <IconSource aria-hidden="true" />
          Lead sourcing
        </Link>
      </WorkspaceButton>
    </div>
  );
}
