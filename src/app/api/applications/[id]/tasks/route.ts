import { NextRequest, NextResponse, after } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { createNotification, replaceApplicationTasks, type TaskEntry } from "@/lib/aws/dynamodb";
import { requireStaff, type Claims } from "@/lib/auth/verify";
import {
  loadVisibleApplication, applicationNotFound, actorOf, activityEntry,
} from "@/lib/aws/application-access";
import { serverError } from "@/lib/api-errors";

const MAX_TASKS = 100;

type TaskOp =
  | { op: "add"; text: string; dueAt?: string; assigneeId?: string; assigneeName?: string }
  | { op: "update"; taskId: string; text?: string; dueAt?: string | null; done?: boolean; assigneeId?: string | null; assigneeName?: string | null }
  | { op: "delete"; taskId: string };

function cleanDue(v: unknown): string | undefined | null {
  if (v === undefined) return undefined;
  if (v === null || v === "") return null;
  if (typeof v !== "string" || Number.isNaN(new Date(v).getTime())) throw new Error("Give the task a valid due date.");
  return v.slice(0, 40);
}

function cleanText(v: unknown): string {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) throw new Error("Describe the task.");
  if (t.length > 500) throw new Error("Keep the task under 500 characters.");
  return t;
}

/** Applies one operation to a copy of the list. Throws a user-facing message on bad input. */
function apply(tasks: TaskEntry[], op: TaskOp, claims: Claims): { tasks: TaskEntry[]; summary: string; assigned?: TaskEntry } {
  const actor = actorOf(claims);
  const now = new Date().toISOString();
  if (op.op === "add") {
    if (tasks.length >= MAX_TASKS) throw new Error("This candidate already has the maximum number of tasks.");
    const due = cleanDue(op.dueAt);
    const task: TaskEntry = {
      id: uuidv4(),
      text: cleanText(op.text),
      ...(due && { dueAt: due }),
      // Unassigned means "mine".
      assigneeId: typeof op.assigneeId === "string" && op.assigneeId ? op.assigneeId.slice(0, 128) : actor.id,
      assigneeName: typeof op.assigneeName === "string" && op.assigneeId ? op.assigneeName.slice(0, 200) : actor.name,
      done: false,
      createdAt: now,
      createdBy: actor.id,
      createdByName: actor.name,
    };
    return { tasks: [...tasks, task], summary: `Added task: ${task.text}`, assigned: task.assigneeId !== actor.id ? task : undefined };
  }
  const i = tasks.findIndex((t) => t.id === op.taskId);
  if (i < 0) throw new Error("That task no longer exists.");
  if (op.op === "delete") {
    return { tasks: tasks.filter((_, j) => j !== i), summary: `Removed task: ${tasks[i].text}` };
  }
  const next: TaskEntry = { ...tasks[i] };
  if (op.text !== undefined) next.text = cleanText(op.text);
  const due = cleanDue(op.dueAt);
  if (due === null) delete next.dueAt;
  else if (due) next.dueAt = due;
  if (op.assigneeId !== undefined) {
    next.assigneeId = op.assigneeId ? String(op.assigneeId).slice(0, 128) : actor.id;
    next.assigneeName = op.assigneeId && op.assigneeName ? String(op.assigneeName).slice(0, 200) : actor.name;
  }
  if (op.done !== undefined) {
    next.done = !!op.done;
    if (next.done) next.doneAt = now;
    else delete next.doneAt;
  }
  const summary = op.done === true ? `Completed task: ${next.text}` : op.done === false ? `Reopened task: ${next.text}` : `Updated task: ${next.text}`;
  const reassigned = op.assigneeId !== undefined && next.assigneeId !== tasks[i].assigneeId && next.assigneeId !== actor.id;
  return { tasks: tasks.map((t, j) => (j === i ? next : t)), summary, assigned: reassigned ? next : undefined };
}

/**
 * POST /api/applications/[id]/tasks
 * Body: { op: "add" | "update" | "delete", ... }. Returns the new task list.
 * Saved with an optimistic check, retried on a concurrent save.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireStaff(request);
  if (!auth.ok) return auth.response;
  try {
    const { id } = await params;
    const op = (await request.json().catch(() => null)) as TaskOp | null;
    if (!op || !["add", "update", "delete"].includes(op.op)) {
      return NextResponse.json({ error: "op must be add, update or delete" }, { status: 400 });
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const app = await loadVisibleApplication(id, auth.claims);
      if (!app?.success || !app.data) return applicationNotFound();

      let result: ReturnType<typeof apply>;
      try {
        result = apply(app.data.tasks ?? [], op, auth.claims);
      } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid task" }, { status: 400 });
      }

      const saved = await replaceApplicationTasks(
        id, result.tasks, app.data.updatedAt, activityEntry(auth.claims, "task", result.summary),
      );
      if (saved.conflict) continue;
      if (!saved.success) return serverError("Saving tasks", saved.error, "Couldn't save the task. Please try again.");

      const assigned = result.assigned;
      if (assigned?.assigneeId) {
        const who = actorOf(auth.claims).name;
        const candidate = app.data.name || app.data.email;
        after(async () => {
          try {
            await createNotification({
              id: uuidv4(),
              type: "task_assigned",
              title: "Task assigned to you",
              message: `${who}: ${assigned.text} (${candidate})`,
              link: `/admin/candidates/${id}`,
              relatedId: id,
              recipientId: assigned.assigneeId,
              isRead: false,
              createdAt: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Failed to notify task assignee:", err);
          }
        });
      }
      return NextResponse.json({ tasks: result.tasks });
    }
    return NextResponse.json({ error: "Someone else just changed this candidate. Try again." }, { status: 409 });
  } catch (error) {
    return serverError("Error saving task", error, "Couldn't save the task. Please try again.");
  }
}
