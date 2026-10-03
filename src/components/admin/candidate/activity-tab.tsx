"use client";

import type { ActivityEntry, Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { StatusBadge } from "@/components/admin/status-badge";
import {
  IconBookmark, IconEdit, IconHistory, IconMail, IconResume, IconSuccess, IconUserCheck,
  type IconComponent,
} from "@/components/admin/icons";
import { statusColor } from "@/components/admin/theme";
import { fmtDateTime } from "@/lib/format";

type HistoryEntry = NonNullable<Application["statusHistory"]>[number];

type TimelineItem =
  | { type: "stage"; at: string; entry: HistoryEntry }
  | { type: "activity"; at: string; entry: ActivityEntry };

const KIND_ICON: Record<ActivityEntry["kind"], IconComponent> = {
  edit: IconEdit,
  email: IconMail,
  bench: IconBookmark,
  ownership: IconUserCheck,
  resume: IconResume,
  task: IconSuccess,
};

/** "workAuthorization" -> "work authorization". */
const fieldLabel = (f: string) => f.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();

const time = (iso: string) => {
  const t = Date.parse(iso);
  return Number.isNaN(t) ? 0 : t;
};

/** Stage moves and recorded actions on one rail, newest first. */
export function ActivityTab({ history, activity }: { history: HistoryEntry[]; activity: ActivityEntry[] }) {
  const items: TimelineItem[] = [
    ...history.map((entry): TimelineItem => ({ type: "stage", at: entry.changedAt, entry })),
    ...activity.map((entry): TimelineItem => ({ type: "activity", at: entry.at, entry })),
  ].sort((a, b) => time(b.at) - time(a.at));

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader icon={IconHistory} title="Activity" count={items.length} />
      {items.length > 0 ? (
        <ol className="p-4">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            const key = item.type === "activity" ? item.entry.id : `stage-${i}-${item.at}`;
            return (
              <li key={key} className="relative flex gap-3.5 pb-5 last:pb-0">
                {!isLast && (
                  <span aria-hidden className="absolute bottom-0 left-[7px] top-5 w-px bg-[var(--adm-line)]" />
                )}
                {item.type === "stage" ? <StageRow entry={item.entry} /> : <ActivityRow entry={item.entry} />}
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState
          icon={IconHistory}
          title="No activity recorded yet"
          description="Stage changes, edits, emails and tasks will appear here."
        />
      )}
    </AdminCard>
  );
}

function When({ at }: { at: string }) {
  return <span className="flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDateTime(at)}</span>;
}

function StageRow({ entry }: { entry: HistoryEntry }) {
  return (
    <>
      <span aria-hidden className="relative mt-[5px] grid h-[11px] w-[15px] flex-none place-items-center">
        <span
          className="h-[11px] w-[11px] rounded-full ring-4 ring-[var(--adm-surface)]"
          style={{ background: statusColor(entry.status) }}
        />
      </span>
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
          <When at={entry.changedAt} />
        </div>
        {entry.notes && (
          <p className="mt-2 rounded-[6px] bg-[var(--adm-surface-sunken)] px-3 py-2 text-[13px] leading-relaxed text-[var(--adm-ink-mute)]">
            {entry.notes}
          </p>
        )}
      </div>
    </>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const Icon = KIND_ICON[entry.kind] ?? IconHistory;
  return (
    <>
      <span aria-hidden className="relative mt-[2px] grid h-[15px] w-[15px] flex-none place-items-center bg-[var(--adm-surface)]">
        <Icon className="h-[15px] w-[15px] text-[var(--adm-ink-subtle)]" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <p className="min-w-0 text-[14px] text-[var(--adm-ink-mute)]">
            <span className="text-[var(--adm-ink)]">{entry.summary}</span>
            {entry.byName && (
              <span>
                {" "}by <span className="font-medium text-[var(--adm-ink)]">{entry.byName}</span>
              </span>
            )}
          </p>
          <When at={entry.at} />
        </div>
        {entry.kind === "edit" && entry.fields && entry.fields.length > 0 && (
          <p className="mt-1 text-[12.5px] text-[var(--adm-ink-subtle)]">
            Changed: {entry.fields.map(fieldLabel).join(", ")}
          </p>
        )}
      </div>
    </>
  );
}
