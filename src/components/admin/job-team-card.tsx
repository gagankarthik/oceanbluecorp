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
 * Who is working this requisition, with in-place assignment.
 *
 * The + opens a staff search and PATCHes only the assignee fields; the roster
 * is fetched on first open, not on page load. The plus rotates into the close
 * cross, the field grows from the button and the roster opens on
 * grid-rows 0fr → 1fr, all on one duration and easing. `.adm-scope` flattens
 * these under prefers-reduced-motion.
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
  /** Mirrors JOB_COMMERCIAL_ROLES, not JOB_EDIT_ROLES: media edits a posting's
   *  copy but assignment is recruiting's, and the card is not rendered for it. */
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

  // A ref, not state, latches "fetch started": as an effect keyed on loading
  // state this raced its own cleanup and stuck on "Loading…". Cleared on
  // failure so reopening retries.
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

  // Updates the card from the values sent: the route answers with a message,
  // not the record.
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

  // Clicking the same row again undoes a mis-click; the panel stays open because
  // assigning two people is the common case.
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

  // Every user, assigned ones included and marked as such.
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
              <div className="flex flex-none items-center gap-1.5">
                {/* aria-hidden + tabIndex -1 while closed keeps the 0px input out of the tab order. */}
                <div
                  className={cn(
                    "relative flex items-center overflow-hidden rounded-[8px] border transition-all",
                    MOTION,
                    open
                      ? "w-40 border-[var(--adm-line)] bg-[var(--adm-surface)] opacity-100 sm:w-44"
                      : "w-0 border-transparent opacity-0",
                  )}
                >
                  <Search
                    className="pointer-events-none absolute left-2.5 h-3.5 w-3.5 flex-none text-[var(--adm-ink-subtle)]"
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
                    className="h-8 w-full bg-transparent pl-8 pr-2 text-[13px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
                  />
                </div>

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
                    open
                      ? "bg-[var(--adm-surface-2)] text-[var(--adm-ink)]"
                      : "text-[var(--adm-ink-mute)] hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]",
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

        <div
          className={cn(
            "grid transition-all",
            MOTION,
            open
              ? "grid-rows-[1fr] border-b border-[var(--adm-line-soft)] opacity-100"
              : "grid-rows-[0fr] opacity-0",
          )}
        >
          <div className="overflow-hidden">
            <div className="max-h-64 overflow-y-auto bg-[var(--adm-surface-sunken)]">
              {loadingStaff ? (
                <p className="px-4 py-3 text-center text-[13px] text-[var(--adm-ink-subtle)]">
                  Loading the team…
                </p>
              ) : visible.length === 0 ? (
                <p className="px-4 py-3 text-center text-[13px] text-[var(--adm-ink-subtle)]">
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
                        "flex w-full items-center gap-2.5 border-b border-[var(--adm-line-soft)] px-4 py-2.5 text-left transition-colors last:border-0",
                        "hover:bg-[var(--adm-row-hover)] disabled:opacity-60",
                        assigned && "bg-[var(--adm-surface)]",
                      )}
                    >
                      <Avatar name={u.name} email={u.email} size="sm" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[var(--adm-ink)]">
                          {u.name || u.email}
                        </span>
                        <span className="block truncate text-[12px] text-[var(--adm-ink-subtle)]">
                          {u.email}
                        </span>
                      </span>
                      {busy ? (
                        <Loader2 className="h-4 w-4 flex-none animate-spin text-[var(--adm-ink-subtle)]" aria-hidden="true" />
                      ) : assigned ? (
                        <Check className="h-4 w-4 flex-none text-[var(--adm-success-ink)]" aria-hidden="true" />
                      ) : (
                        <span className="flex-none rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11.5px] font-medium capitalize text-[var(--adm-ink-mute)]">
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
            <div className="flex items-center gap-2.5 px-4 py-3">
              <Avatar name={job.recruitmentManagerName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">
                  {job.recruitmentManagerName}
                </p>
                <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">Recruitment manager</p>
              </div>
            </div>
          )}

          {names.map((name, i) => (
            <div key={ids[i] ?? i} className="group flex items-center gap-2.5 px-4 py-3">
              <Avatar name={name} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium text-[var(--adm-ink)]">{name}</p>
                <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">Assignee</p>
              </div>
              {canEdit && (
                // Revealed on hover/focus; always shown on touch, where there is no hover.
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  disabled={!!savingId}
                  aria-label={`Remove ${name} from the team`}
                  title="Remove from the team"
                  className="grid h-8 w-8 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] opacity-0 transition-[opacity,background-color,color] duration-150 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)] focus-visible:opacity-100 disabled:pointer-events-none group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          ))}

          {memberCount === 0 && (
            <p className="px-4 py-3 text-[13px] text-[var(--adm-ink-subtle)]">
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
