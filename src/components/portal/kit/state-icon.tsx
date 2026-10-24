/*
 * Plane's state icons: every status in the portal belongs to one of five groups, drawn as a
 * 14px circle so the group reads before the word does.
 *   backlog    dashed ring, grey     (new, draft, archived, paused)
 *   unstarted  plain ring, blue      (open, invited, ready to start)
 *   started    ring filling up, amber (in the pipeline; the fill is how far along)
 *   completed  green disc with a tick (hired, placed, responded)
 *   cancelled  red disc with a cross  (rejected, lost, revoked)
 * Colours are the --color-state-* tokens (colors.css), so the dark palette follows.
 */

export type StateGroup = "backlog" | "unstarted" | "started" | "completed" | "cancelled";
export type StateMark = { group: StateGroup; /** started only: 0 to 1 */ progress?: number };

export const STATE_COLOR: Record<StateGroup, string> = {
  backlog: "var(--color-state-backlog)",
  unstarted: "var(--color-state-unstarted)",
  started: "var(--color-state-started)",
  completed: "var(--color-state-completed)",
  cancelled: "var(--color-state-cancelled)",
};

export function StateIcon({ group, progress = 0.5, className = "size-3.5" }: StateMark & { className?: string }) {
  const c = STATE_COLOR[group];
  // A pie wedge from 12 o'clock, clockwise, inside a 7px ring.
  const p = Math.min(0.999, Math.max(0.05, progress));
  const a = p * 2 * Math.PI;
  const r = 4;
  const x = 8 + r * Math.sin(a);
  const y = 8 - r * Math.cos(a);
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`shrink-0 ${className}`}>
      {group === "completed" || group === "cancelled" ? (
        <>
          <circle cx="8" cy="8" r="7" fill={c} />
          <path
            d={group === "completed" ? "M5 8.2l2 2 4-4.2" : "M5.6 5.6l4.8 4.8M10.4 5.6l-4.8 4.8"}
            fill="none"
            stroke="var(--color-mist-0)"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <circle cx="8" cy="8" r="6.5" fill="none" stroke={c} strokeWidth="1.5" strokeDasharray={group === "backlog" ? "2.2 1.9" : undefined} />
          {group === "started" && <path d={`M8 8V${8 - r}A${r} ${r} 0 ${p > 0.5 ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`} fill={c} />}
        </>
      )}
    </svg>
  );
}

/** Generic status words to a group, so every list codes them the same way. */
export function statusState(status: string): StateMark {
  const s = status.toLowerCase();
  if (/(rejected|lost|suspended|failed|declined|revoked|cancel)/.test(s)) return { group: "cancelled" };
  if (/(filled|hired|placed|completed|responded|won|signed|approved|success|done)/.test(s)) return { group: "completed" };
  if (/(draft|inactive|disabled|archived|on hold|paused|closed|expired|withdrawn)/.test(s)) return { group: "backlog" };
  if (/(interview|offer)/.test(s)) return { group: "started", progress: 0.75 };
  if (/(active|live|published|in progress|submitted|review|pending|proposal|negotiat|screening|sourcing|scheduled)/.test(s)) return { group: "started", progress: 0.5 };
  if (/(new|open|invited|lead|prospect|available|read|unread)/.test(s)) return { group: "unstarted" };
  return { group: "backlog" };
}

/** Plane's property pill: neutral and bordered, the colour carried by its mark. */
export const STATE_PILL = "inline-flex h-6 max-w-full items-center gap-1.5 whitespace-nowrap rounded-md border border-mist-200 bg-mist-0 px-2 text-adm-xs font-medium text-navy-900";
