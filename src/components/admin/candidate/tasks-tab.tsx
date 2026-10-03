"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
import type { TaskEntry } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { EmptyState } from "@/components/admin/empty-state";
import { WorkspaceButton } from "@/components/admin/workspace";
import { FormInput, FormSelect } from "@/components/admin/forms/primitives";
import { IconCalendar, IconSuccess, IconTrash, IconUser } from "@/components/admin/icons";
import { useStaffUsers } from "@/hooks/use-staff-users";
import { postTaskOp, type TaskOp } from "@/components/admin/tasks/api";
import { TaskCheck } from "@/components/admin/tasks/task-check";
import { DUE_TEXT, dueState, fmtDue, parseDue } from "@/components/admin/tasks/due";
import { cn } from "@/lib/utils";

const byDue = (a: TaskEntry, b: TaskEntry) =>
  (parseDue(a.dueAt)?.getTime() ?? Infinity) - (parseDue(b.dueAt)?.getTime() ?? Infinity) ||
  a.createdAt.localeCompare(b.createdAt);

/** Follow-ups on one candidate. The server's returned list is the state. */
export function TasksTab({
  applicationId,
  tasks,
  me,
  onChange,
}: {
  applicationId: string;
  tasks: TaskEntry[];
  me: { id: string; name: string };
  onChange: (tasks: TaskEntry[]) => void;
}) {
  const { users } = useStaffUsers();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState(me.id);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const open = useMemo(() => tasks.filter((t) => !t.done).sort(byDue), [tasks]);
  const done = useMemo(
    () => tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || "")),
    [tasks],
  );
  const others = users.filter((u) => u.sub !== me.id);

  const run = async (op: TaskOp, key: string) => {
    setPending(key);
    try {
      onChange(await postTaskOp(applicationId, op));
      return true;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the task. Try again.");
      return false;
    } finally {
      setPending(null);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || adding) return;
    setAdding(true);
    const mine = assignee === me.id;
    const ok = await run({
      op: "add",
      text: text.trim(),
      ...(due && { dueAt: due }),
      assigneeId: assignee,
      assigneeName: mine ? me.name : users.find((u) => u.sub === assignee)?.name,
    }, "add");
    setAdding(false);
    if (ok) {
      setText("");
      setDue("");
      setAssignee(me.id);
      if (!mine) toast.success("Task assigned");
    }
  };

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader icon={IconSuccess} title="Tasks" count={open.length} />

      <form onSubmit={add} className="flex flex-wrap items-end gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
        <label className="min-w-[200px] flex-[3_1_240px]">
          <span className="sr-only">Task</span>
          <FormInput
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
            placeholder="Add a follow-up, e.g. Call about availability"
          />
        </label>
        <label className="flex-[1_1_150px]">
          <span className="sr-only">Due date</span>
          <FormInput type="date" value={due} onChange={(e) => setDue(e.target.value)} className="tabular-nums" />
        </label>
        <label className="flex-[1_1_170px]">
          <span className="sr-only">Assignee</span>
          <FormSelect value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value={me.id}>Me</option>
            {others.map((u) => (
              <option key={u.sub} value={u.sub}>{u.name}</option>
            ))}
          </FormSelect>
        </label>
        <WorkspaceButton type="submit" disabled={!text.trim() || adding}>
          {adding ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
          Add task
        </WorkspaceButton>
      </form>

      {open.length === 0 && done.length === 0 ? (
        <EmptyState
          size="sm"
          icon={IconSuccess}
          title="No tasks yet"
          description="Add a follow-up with a due date so it shows on the assignee's dashboard."
        />
      ) : (
        <>
          {open.length > 0 ? (
            <ul className="divide-y divide-[var(--adm-line-soft)]">
              {open.map((t) => (
                <TaskRow
                  key={t.id}
                  task={t}
                  meId={me.id}
                  busy={pending === t.id}
                  onToggle={() => void run({ op: "update", taskId: t.id, done: true }, t.id)}
                  onDelete={() => void run({ op: "delete", taskId: t.id }, t.id)}
                />
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-[13px] text-[var(--adm-ink-mute)]">All tasks are done.</p>
          )}

          {done.length > 0 && (
            <div className="border-t border-[var(--adm-line-soft)]">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="w-full px-4 py-2.5 text-left text-[13px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
              >
                {showDone ? "Hide" : "Show"} completed ({done.length})
              </button>
              {showDone && (
                <ul className="divide-y divide-[var(--adm-line-soft)] border-t border-[var(--adm-line-soft)]">
                  {done.map((t) => (
                    <TaskRow
                      key={t.id}
                      task={t}
                      meId={me.id}
                      busy={pending === t.id}
                      onToggle={() => void run({ op: "update", taskId: t.id, done: false }, t.id)}
                      onDelete={() => void run({ op: "delete", taskId: t.id }, t.id)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </AdminCard>
  );
}

function TaskRow({
  task, meId, busy, onToggle, onDelete,
}: {
  task: TaskEntry;
  meId: string;
  busy: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const state = task.done ? "none" : dueState(task.dueAt);
  const assignee = task.assigneeId === meId ? "You" : task.assigneeName || "Unassigned";
  return (
    <li className="flex items-start gap-3 px-4 py-2.5">
      <TaskCheck done={task.done} busy={busy} label={task.text} onToggle={onToggle} />
      <div className="min-w-0 flex-1">
        <p className={cn(
          "break-words text-[14px]",
          task.done ? "text-[var(--adm-ink-subtle)] line-through" : "text-[var(--adm-ink)]",
        )}>
          {task.text}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12.5px] text-[var(--adm-ink-subtle)]">
          {task.dueAt && (
            <span className={cn("inline-flex items-center gap-1 tabular-nums", DUE_TEXT[state], state === "overdue" && "font-medium")}>
              <IconCalendar className="h-3.5 w-3.5" aria-hidden="true" />
              {state === "overdue" ? "Overdue · " : ""}{fmtDue(task.dueAt)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <IconUser className="h-3.5 w-3.5" aria-hidden="true" />
            {assignee}
          </span>
          {task.createdByName && task.createdBy !== task.assigneeId && (
            <span>from {task.createdBy === meId ? "you" : task.createdByName}</span>
          )}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label={`Delete task: ${task.text}`}
        title="Delete task"
        className="-my-1 grid h-8 w-8 flex-none place-items-center rounded-[6px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)] disabled:opacity-50"
      >
        <IconTrash className="h-4 w-4" aria-hidden="true" />
      </button>
    </li>
  );
}
