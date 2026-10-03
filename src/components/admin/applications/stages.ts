import type { Application } from "@/lib/aws/dynamodb";
import { statusMeta, stateOf, type AppStatus } from "@/components/admin/theme";

/** A list row: the application plus the job fields the screen joins on. */
export interface ApplicationRow extends Application {
  jobDepartment?: string;
}

export const PIPELINE = ["pending", "reviewing", "submitted", "interview", "offered", "hired"] as const;
export const KANBAN_COLS = [...PIPELINE, "rejected"] as const;

/**
 * Stage inks. In-flight stages are one ordered progression, so they share a
 * single accent ramp; offered and the terminal states take the status tokens.
 */
export const STAGE_COLOR: Record<string, string> = {
  pending:   "color-mix(in srgb, var(--adm-accent) 35%, var(--adm-surface))",
  reviewing: "color-mix(in srgb, var(--adm-accent) 55%, var(--adm-surface))",
  submitted: "color-mix(in srgb, var(--adm-accent) 78%, var(--adm-surface))",
  interview: "var(--adm-accent)",
  offered:   "var(--adm-warning)",
  hired:     "var(--adm-success)",
  rejected:  "var(--adm-danger)",
};
export const stageColor = (s: string) => STAGE_COLOR[s] ?? "var(--adm-ink-subtle)";

export const sLabel = (s: string) => statusMeta[s as AppStatus]?.label ?? s;

/** "Austin, TX", what a recruiter actually calls the location. */
export function locationOf(a: Pick<ApplicationRow, "city" | "state">): string {
  return [a.city?.trim(), stateOf(a.state)].filter(Boolean).join(", ");
}
