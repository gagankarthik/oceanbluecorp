import type { TaskEntry } from "@/lib/aws/dynamodb";

export type TaskOp =
  | { op: "add"; text: string; dueAt?: string; assigneeId?: string; assigneeName?: string }
  | { op: "update"; taskId: string; text?: string; dueAt?: string | null; done?: boolean; assigneeId?: string | null; assigneeName?: string }
  | { op: "delete"; taskId: string };

/** Applies one op; resolves to the server's full list, rejects with its message. */
export async function postTaskOp(applicationId: string, op: TaskOp): Promise<TaskEntry[]> {
  const res = await fetch(`/api/applications/${applicationId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(op),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Couldn't save the task. Please try again.");
  return (data.tasks || []) as TaskEntry[];
}
