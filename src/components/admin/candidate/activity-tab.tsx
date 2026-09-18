"use client";

import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import { IconHistory } from "@/components/admin/icons";
import { statusColor } from "@/components/admin/theme";
import { fmtDateTime } from "@/lib/format";

/* Derived from the record: `statusHistory` is an inline type on `Application`
   with no exported name, so a hand-written interface would drift. */
type HistoryEntry = NonNullable<Application["statusHistory"]>[number];

/** Stage-change history, newest first, on a connected rail. */
export function ActivityTab({ history }: { history: HistoryEntry[] }) {
  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader icon={IconHistory} title="Status history" count={history.length} />
      {history.length > 0 ? (
        <ol className="p-4">
          {[...history].reverse().map((entry, i, arr) => {
            const isLast = i === arr.length - 1;
            return (
              <li key={i} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && (
                  <span aria-hidden className="absolute bottom-0 left-[5px] top-4 w-px bg-[var(--adm-line)]" />
                )}
                <span
                  aria-hidden
                  className="relative mt-[5px] h-[11px] w-[11px] flex-none rounded-full ring-4 ring-[var(--adm-surface)]"
                  style={{ background: statusColor(entry.status) }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 text-[14px] text-[var(--adm-ink-mute)]">
                      Moved to
                      <StatusBadge status={entry.status} />
                      {entry.changedByName && (
                        <span>
                          by <span className="font-medium text-[var(--adm-ink)]">{entry.changedByName}</span>
                        </span>
                      )}
                    </p>
                    <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                      {fmtDateTime(entry.changedAt)}
                    </span>
                  </div>
                  {entry.notes && (
                    <p className="mt-2 rounded-[12px] bg-[var(--adm-surface-sunken)] px-3 py-2 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
                      {entry.notes}
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
          description="Stage changes will appear here as the candidate moves through the pipeline."
        />
      )}
    </AdminCard>
  );
}
