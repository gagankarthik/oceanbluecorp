"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import type { TaskEntry } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "./admin-card";
import { IconSuccess } from "./icons";
import { Skel } from "./skeletons";
import { TaskCheck } from "./tasks/task-check";
import { postTaskOp } from "./tasks/api";
import { DUE_TEXT, dueState, fmtDue, type DueState } from "./tasks/due";
import { cn } from "@/lib/utils";

type MyTask = TaskEntry & { applicationId: string; candidateName?: string; jobTitle?: string };

const GROUPS: { key: Exclude<DueState, "none">; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Due today" },
  { key: "upcoming", label: "Upcoming" },
];

const PER_GROUP = 5;

/** Open tasks assigned to the viewer, by due date. Renders nothing for roles without access. */
export function MyTasksPanel() {
  const [tasks, setTasks] = useState<MyTask[] | null>(null);
  const [hidden, setHidden] = useState(false);
  const [pending, setPending] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks?scope=mine&open=1");
      if (res.status === 401 || res.status === 403) { setHidden(true); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks || []);
    } catch {
      setTasks((t) => t ?? []);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const complete = async (t: MyTask) => {
    setPending(t.id);
    try {
      await postTaskOp(t.applicationId, { op: "update", taskId: t.id, done: true });
      setTasks((list) => (list ? list.filter((x) => x.id !== t.id) : list));
      toast.success("Task done");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the task");
    } finally {
      setPending(null);
    }
  };

  if (hidden) return null;

  const grouped = Object.fromEntries(GROUPS.map((g) => [g.key, [] as MyTask[]])) as Record<(typeof GROUPS)[number]["key"], MyTask[]>;
  for (const t of tasks ?? []) {
    const s = dueState(t.dueAt);
    grouped[s === "none" ? "upcoming" : s].push(t);
  }

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader
        icon={IconSuccess}
        title="My tasks"
        count={tasks?.length}
        meta={tasks && tasks.length > 0
          ? [grouped.overdue.length && `${grouped.overdue.length} overdue`, grouped.today.length && `${grouped.today.length} due today`].filter(Boolean).join(" · ") || "Nothing due today"
          : undefined}
      />
      {tasks === null ? (
        <div className="space-y-2 p-4">
          <Skel className="h-4 w-1/2" />
          <Skel className="h-4 w-1/3" />
        </div>
      ) : tasks.length === 0 ? (
        <p className="px-4 py-3 text-[13px] text-[var(--adm-ink-mute)]">
          No open tasks assigned to you. Add follow-ups from a candidate&apos;s Tasks tab.
        </p>
      ) : (
        <div className="grid divide-y divide-[var(--adm-line-soft)] md:grid-cols-3 md:divide-x md:divide-y-0">
          {GROUPS.map((g) => {
            const list = grouped[g.key];
            return (
              <div key={g.key} className="min-w-0">
                <p className={cn(
                  "flex items-baseline justify-between px-4 pb-1 pt-3 text-[12.5px] font-medium",
                  list.length && g.key !== "upcoming" ? DUE_TEXT[g.key] : "text-[var(--adm-ink-mute)]",
                )}>
                  {g.label}
                  <span className="tabular-nums">{list.length}</span>
                </p>
                {list.length === 0 ? (
                  <p className="px-4 pb-3 text-[12.5px] text-[var(--adm-ink-subtle)]">None</p>
                ) : (
                  <ul className="pb-1.5">
                    {list.slice(0, PER_GROUP).map((t) => (
                      <li key={t.id} className="flex items-start gap-2.5 px-4 py-1.5">
                        <TaskCheck done={false} busy={pending === t.id} label={t.text} onToggle={() => void complete(t)} />
                        <Link
                          href={`/admin/candidates/${t.applicationId}`}
                          className="group min-w-0 flex-1 rounded-[4px]"
                        >
                          <span className="block truncate text-[13px] text-[var(--adm-ink)] group-hover:underline">{t.text}</span>
                          <span className="block truncate text-[12px] text-[var(--adm-ink-subtle)]">
                            {t.candidateName || "Unnamed"}
                            {t.dueAt && (
                              <span className={cn("tabular-nums", DUE_TEXT[dueState(t.dueAt)])}> · {fmtDue(t.dueAt)}</span>
                            )}
                          </span>
                        </Link>
                      </li>
                    ))}
                    {list.length > PER_GROUP && (
                      <li className="px-4 py-1 text-[12px] text-[var(--adm-ink-subtle)]">+{list.length - PER_GROUP} more</li>
                    )}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </AdminCard>
  );
}
