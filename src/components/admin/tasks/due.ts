export type DueState = "overdue" | "today" | "upcoming" | "none";

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

/** A date-only due ("2026-10-03") is a local calendar day, not UTC midnight. */
export function parseDue(due?: string): Date | null {
  if (!due) return null;
  if (DATE_ONLY.test(due)) {
    const [y, m, d] = due.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const t = new Date(due);
  return Number.isNaN(t.getTime()) ? null : t;
}

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

export function dueState(due?: string, now = new Date()): DueState {
  const d = parseDue(due);
  if (!d) return "none";
  const day = dayStart(d), today = dayStart(now);
  if (day < today) return "overdue";
  if (day > today) return "upcoming";
  // Due today: a timed task past its hour is already late.
  return due && !DATE_ONLY.test(due) && d.getTime() < now.getTime() ? "overdue" : "today";
}

/** "Today", "Tomorrow", "Yesterday", else "Oct 3" (year only when not this year). */
export function fmtDue(due?: string, now = new Date()): string {
  const d = parseDue(due);
  if (!d) return "";
  const diff = Math.round((dayStart(d) - dayStart(now)) / 86400000);
  const timed = !!due && !DATE_ONLY.test(due);
  const clock = timed ? ` ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "";
  if (diff === 0) return `Today${clock}`;
  if (diff === 1) return `Tomorrow${clock}`;
  if (diff === -1) return `Yesterday${clock}`;
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", ...(sameYear ? {} : { year: "numeric" }) }) + clock;
}

export const DUE_TEXT: Record<DueState, string> = {
  overdue: "text-[var(--adm-danger-ink)]",
  today: "text-[var(--adm-warning-ink)]",
  upcoming: "text-[var(--adm-ink-subtle)]",
  none: "text-[var(--adm-ink-subtle)]",
};
