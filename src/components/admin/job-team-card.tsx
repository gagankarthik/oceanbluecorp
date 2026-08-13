"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus, Search, X } from "lucide-react";
import type { Job } from "@/lib/aws/dynamodb";
import { RECRUITING_ROLES } from "@/lib/auth";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { IconUserCheck } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * Who is working this requisition, and a way to add to them.
 *
 * The card was read-only, so putting a second recruiter on a job meant opening
 * the full edit form, scrolling to the assignee picker, saving the whole
 * record, and coming back. That is four steps and a full-record write for one
 * name, on the screen where you have just realised you need the help.
 *
 * The plus in the header opens a search in place and PATCHes only the three
 * assignee fields. The staff list is fetched on FIRST OPEN, not on page load:
 * most visits to a job never touch the team, and a list of every account is not
 * worth a request on all of them.
 *
 * THE ANIMATION, and why it is built this way
 *
 * The control is one button that changes job, so it should look like one thing
 * changing rather than two things swapping. A plus rotated 45° IS a cross, so
 * the icon is never replaced, only turned: the glyph you clicked is the glyph
 * that closes it, and the eye tracks it the whole way.
 *
 * Three transitions, one duration, one easing curve (`--adm-ease`), so they
 * read as a single movement:
 *   1. the field grows from the button, `w-0 → w-44` inside an overflow-hidden
 *      wrapper, so the magnifier and the text are clipped rather than squashed;
 *   2. the plus turns 45°;
 *   3. the roster opens on `grid-rows-[0fr] → [1fr]`, which animates to the
 *      content's real height without anyone hard-coding one. A max-height
 *      guess is the usual way to do this and it is either visibly too slow
 *      (guess too high) or it clips the last row (guess too low).
 *
 * No motion library and no reduced-motion branch here: `.adm-scope` already
 * flattens every transition under `prefers-reduced-motion` (globals.css), so
 * plain CSS transitions inherit that for free.
 */

interface StaffUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function JobTeamCard({
  job,
  canEdit,
  onJobChange,
}: {
  job: Job;
  /** Mirrors JOB_EDIT_ROLES. Recruiters and media read the team, never edit it. */
  canEdit: boolean;
  onJobChange: (job: Job) => void;
}) {
  const [open, setOpen] = useState(false);
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const ids = job.assignedToIds || [];
  const names = job.assignedToNames || [];
  const emails = job.assignedToEmails || [];
  const memberCount = (job.recruitmentManagerName ? 1 : 0) + names.length;

  /**
   * Load the staff roster, once, the first time the panel is opened.
   *
   * Driven from the open handler rather than an effect. As an effect keyed on
   * `[open, staff.length, loadingStaff]` this raced itself: `setLoadingStaff(true)`
   * ran synchronously, the dependency changed, React tore the effect down and
   * the cleanup flipped `cancelled` on the request that was still in flight.
   * Both `setStaff` and the `finally` were then skipped, so the list stayed
   * empty and the panel sat on "Loading the team…" forever, with the guard
   * (`loadingStaff` stuck true) preventing any retry.
   *
   * A ref is the right latch for this: it says "a fetch has been started"
   * without being state, so recording it cannot re-run the thing that reads it.
   * Cleared on failure, so reopening retries instead of showing an empty list
   * for the rest of the session.
   */
  const staffRequested = useRef(false);

  const loadStaff = useCallback(async () => {
    if (staffRequested.current) return;
    staffRequested.current = true;
    setLoadingStaff(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load the team list");
      // Only roles that actually work a requisition. Media holds an account
      // here but never appears as a recruiter.
      const recruiting = RECRUITING_ROLES.map(String);
      setStaff(
        (data.users || [])
          .filter((u: StaffUser) => recruiting.includes(u.role))
          .sort((a: StaffUser, b: StaffUser) =>
            (a.name || a.email).localeCompare(b.name || b.email),
          ),
      );
    } catch (err) {
      staffRequested.current = false;
      toast.error(err instanceof Error ? err.message : "Could not load the team list");
    } finally {
      setLoadingStaff(false);
    }
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    // Cleared on the way out, so reopening starts on the full roster rather
    // than on last week's half-typed name.
    setSearch("");
  }, []);

  // Escape closes, and so does a click anywhere outside the card.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, close]);

  /**
   * Write just the assignee fields.
   *
   * The card is updated from the values we sent rather than from a re-fetch:
   * the route answers with a message, not the record, and re-reading the whole
   * job to learn something we already know is a round trip for nothing.
   */
  const save = useCallback(
    async (
      next: { ids: string[]; names: string[]; emails: string[] },
      pendingId: string,
      message: string,
    ) => {
      setSavingId(pendingId);
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignedToIds: next.ids,
            assignedToNames: next.names,
            assignedToEmails: next.emails,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Could not save the team");
        }
        onJobChange({
          ...job,
          assignedToIds: next.ids,
          assignedToNames: next.names,
          assignedToEmails: next.emails,
        });
        toast.success(message);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Could not save the team");
      } finally {
        setSavingId(null);
      }
    },
    [job, onJobChange],
  );

  /**
   * Add or remove in one action, so a mis-click is undone by clicking the same
   * row again. The panel deliberately stays open: assigning two people is the
   * common case, and closing after each one would make the second a fresh trip.
   */
  const toggle = (u: StaffUser) => {
    const index = ids.indexOf(u.id);
    if (index === -1) {
      void save(
        { ids: [...ids, u.id], names: [...names, u.name || u.email], emails: [...emails, u.email] },
        u.id,
        `${u.name || u.email} added to the team`,
      );
    } else {
      void save(
        {
          ids: ids.filter((_, i) => i !== index),
          names: names.filter((_, i) => i !== index),
          emails: emails.filter((_, i) => i !== index),
        },
        u.id,
        `${u.name || u.email} removed from the team`,
      );
    }
  };

  const removeAt = (index: number) => {
    const removed = names[index];
    void save(
      {
        ids: ids.filter((_, i) => i !== index),
        names: names.filter((_, i) => i !== index),
        emails: emails.filter((_, i) => i !== index),
      },
      ids[index] ?? `row-${index}`,
      `${removed} removed from the team`,
    );
  };

  // Every user, assigned ones included and marked as such: the panel is a
  // roster, and hiding the people already on the job made it look like accounts
  // had gone missing.
  const q = search.trim().toLowerCase();
  const visible = staff.filter(
    (u) => !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
  );

  const MOTION = "duration-[var(--adm-duration-base)] ease-[var(--adm-ease)]";

  return (
    <div ref={rootRef}>
    <AdminCard>
      <AdminCardHeader
        icon={IconUserCheck}
        title="Team"
        count={memberCount}
        action={
          canEdit ? (
            <div className="flex flex-none items-center gap-1">
              {/* Grows out of the button. overflow-hidden clips the magnifier
                  and the caret while it is narrow, so nothing is ever drawn
                  squashed against the edge. aria-hidden + tabIndex -1 while
                  closed keeps a 0px input out of the tab order. */}
              <div
                className={cn(
                  "relative flex items-center overflow-hidden rounded-[6px] border transition-all",
                  MOTION,
                  open
                    ? "w-44 border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] opacity-100"
                    : "w-0 border-transparent opacity-0",
                )}
              >
                <Search
                  className="pointer-events-none absolute left-2 h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]"
                  aria-hidden="true"
                />
                <input
                  ref={searchRef}
                  type="text"
                  autoComplete="off"
                  aria-label="Search staff to add to this job"
                  aria-hidden={!open}
                  tabIndex={open ? 0 : -1}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff…"
                  className="h-8 w-full bg-transparent pl-7 pr-2 text-[13px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
                />
              </div>

              {/* One button, two jobs. The plus turns 45° into a cross rather
                  than being swapped for a different glyph. */}
              <button
                type="button"
                onClick={() => {
                  if (open) { close(); return; }
                  setOpen(true);
                  void loadStaff();
                }}
                aria-label={open ? "Close the staff search" : "Add a recruiter to this job"}
                aria-expanded={open}
                title={open ? "Close" : "Add a recruiter"}
                className={cn(
                  "grid h-8 w-8 flex-none place-items-center rounded-[8px] transition-colors",
                  MOTION,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)]",
                  open
                    ? "bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
                    : "text-[var(--adm-ink-subtle)] hover:bg-[var(--adm-accent-soft)] hover:text-[var(--adm-accent)]",
                )}
              >
                <Plus
                  className={cn("h-4 w-4 transition-transform", MOTION, open && "rotate-45")}
                  aria-hidden="true"
                />
              </button>
            </div>
          ) : undefined
        }
      />

      {/* The roster. grid-rows 0fr → 1fr animates to the real content height,
          so no max-height has to be guessed. */}
      <div
        className={cn(
          "grid transition-all",
          MOTION,
          open
            ? "grid-rows-[1fr] border-b border-[var(--adm-line)] opacity-100"
            : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="max-h-64 overflow-y-auto bg-[var(--adm-surface-sunken)]">
            {loadingStaff ? (
              <p className="px-5 py-4 text-center text-[13px] text-[var(--adm-ink-subtle)]">
                Loading the team…
              </p>
            ) : visible.length === 0 ? (
              <p className="px-5 py-4 text-center text-[13px] text-[var(--adm-ink-subtle)]">
                {staff.length === 0 ? "No staff accounts to assign." : `Nobody matches “${search}”.`}
              </p>
            ) : (
              visible.map((u) => {
                const assigned = ids.includes(u.id);
                const busy = savingId === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u)}
                    disabled={!!savingId}
                    aria-pressed={assigned}
                    className={cn(
                      "flex w-full items-center gap-2.5 border-b border-[var(--adm-line-soft)] px-5 py-2.5 text-left transition-colors last:border-0",
                      "hover:bg-[var(--adm-accent-tint)] disabled:opacity-60",
                      assigned && "bg-[var(--adm-surface)]",
                    )}
                  >
                    <Avatar name={u.name} email={u.email} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--adm-ink)]">
                        {u.name || u.email}
                      </span>
                      <span className="block truncate text-[11.5px] text-[var(--adm-ink-subtle)]">
                        {u.email}
                      </span>
                    </span>
                    {busy ? (
                      <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                    ) : assigned ? (
                      <Check className="h-4 w-4 flex-none text-[var(--adm-success)]" aria-hidden="true" />
                    ) : (
                      <span className="rounded-[4px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[10px] font-semibold capitalize text-[var(--adm-ink-mute)]">
                        {u.role}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="divide-y divide-[var(--adm-line-soft)]">
        {job.recruitmentManagerName && (
          <div className="flex items-center gap-2.5 px-5 py-3">
            <Avatar name={job.recruitmentManagerName} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold text-[var(--adm-ink)]">
                {job.recruitmentManagerName}
              </p>
              <p className="text-[11.5px] text-[var(--adm-ink-subtle)]">Recruitment manager</p>
            </div>
          </div>
        )}

        {names.map((name, i) => (
          <div key={ids[i] ?? i} className="group flex items-center gap-2.5 px-5 py-3">
            <Avatar name={name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-[var(--adm-ink)]">{name}</p>
              <p className="text-[11.5px] text-[var(--adm-ink-subtle)]">Assignee</p>
            </div>
            {canEdit && (
              // Revealed on hover/focus, like the row actions in DataTable: a
              // permanent column of × down the card competes with the names.
              <button
                type="button"
                onClick={() => removeAt(i)}
                disabled={!!savingId}
                aria-label={`Remove ${name} from the team`}
                title="Remove from the team"
                className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] opacity-0 transition-all hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)] focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--adm-focus-ring)] disabled:pointer-events-none group-hover:opacity-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}

        {memberCount === 0 && (
          <p className="px-5 py-4 text-[13px] text-[var(--adm-ink-subtle)]">
            {canEdit
              ? "Nobody is assigned yet. Use + to add a recruiter."
              : "Nobody is assigned to this job yet."}
          </p>
        )}
      </div>
    </AdminCard>
    </div>
  );
}
