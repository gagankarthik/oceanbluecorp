// Where the cloud resume-indexing run stands, read from its stored state.
// Pure: shared by the status route and the resume bank page.

/** No heartbeat for this long and the chain is presumed dead. Matches the restart lock. */
export const INDEX_STALL_MS = 5 * 60_000;

export type IndexJobPhase = "idle" | "running" | "stalled" | "stopping" | "stopped" | "finished";

export interface IndexJobSnapshot {
  updatedAt: string;
  remaining: number;
  cancelled?: boolean;
}

export function indexJobPhase(state: IndexJobSnapshot | null | undefined, now = Date.now()): IndexJobPhase {
  if (!state) return "idle";
  const fresh = now - new Date(state.updatedAt).getTime() < INDEX_STALL_MS;
  if (state.cancelled) return state.remaining > 0 && fresh ? "stopping" : "stopped";
  if (state.remaining <= 0) return "finished";
  return fresh ? "running" : "stalled";
}

/** True while a chain may still be working, so a second run must not start. */
export function indexJobBusy(phase: IndexJobPhase): boolean {
  return phase === "running" || phase === "stopping";
}
