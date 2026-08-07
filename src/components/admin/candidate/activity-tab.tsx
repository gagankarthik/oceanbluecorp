"use client";

import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { IconClock, IconHistory } from "@/components/admin/icons";
import { statusMeta, tones } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { fmtDateTime } from "@/lib/format";

/* Derived from the record rather than re-declared: `statusHistory` is an inline
   type on `Application` with no exported name, so a hand-written interface here
   would silently drift the first time a field is added to it. */
type HistoryEntry = NonNullable<Application["statusHistory"]>[number];

/** Stage-change history, newest first, on a connected rail. */
export function ActivityTab({ history }: { history: HistoryEntry[] }) {
  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader icon={IconHistory} title="Status history" count={history.length} />
      {history.length > 0 ? (
        <ol className="px-5 py-4">
          {[...history].reverse().map((entry, i, arr) => {
            const meta = (statusMeta as Record<string, typeof statusMeta.pending>)[entry.status];
            const t = tones[meta?.tone || "slate"];
            const Icon = meta?.icon || IconClock;
            const isLast = i === arr.length - 1;
            return (
              <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                {!isLast && <div className="absolute bottom-0 left-[13px] top-7 w-px bg-[var(--adm-line-soft)]" />}
                <span className={cn("grid h-7 w-7 flex-none place-items-center rounded-full", t.bg)}>
                  <Icon className={cn("h-3.5 w-3.5", t.text)} />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-[13.5px]">
                      <span className="font-semibold text-[var(--adm-ink)]">
                        Moved to {meta?.label || entry.status}
                      </span>
                      {entry.changedByName && (
                        <span className="font-normal text-[var(--adm-ink-subtle)]">
                          {" "}
                          by <span className="font-medium text-[var(--adm-ink-mute)]">{entry.changedByName}</span>
                        </span>
                      )}
                    </p>
                    <span className="flex-none text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                      {fmtDateTime(entry.changedAt)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-1.5 rounded-[4px] border border-[var(--adm-line-soft)] bg-[var(--adm-zebra)] px-3 py-2 text-[12.5px] italic text-[var(--adm-ink-mute)]">
                      &ldquo;{entry.notes}&rdquo;
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          icon={IconHistory}
          title="No activity recorded yet"
          description="Stage changes will appear here."
        />
      )}
    </AdminCard>
  );
}
