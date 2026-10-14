"use client";

import { useCallback, useMemo, useState } from "react";
import type { Job } from "@/lib/aws/dynamodb";
import { refreshJobs } from "@/hooks/use-console-data";
import { Avatar, Button, Panel, Spinner } from "@/components/portal/kit";
import { FieldError, useStaff, type StaffPerson } from "@/components/portal/fields";
import Select from "@/components/portal/Select";
import Icon from "@/components/portal/icons";
import { useToast } from "@/components/portal/toast";

/**
 * Who is working this requisition: the recruitment manager, then assignees
 * with inline add and remove. Each change PUTs only the assignee arrays.
 */
export function JobTeamCard({
  job,
  canEdit,
  onJobChange,
}: {
  job: Job;
  /** Mirrors JOB_COMMERCIAL_ROLES: media edits a posting's copy, never its team. */
  canEdit: boolean;
  onJobChange: (job: Job) => void;
}) {
  const notify = useToast();
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const ids = useMemo(() => job.assignedToIds || [], [job.assignedToIds]);
  const names = job.assignedToNames || [];
  const emails = job.assignedToEmails || [];
  const memberCount = (job.recruitmentManagerName ? 1 : 0) + names.length;

  // The roster loads when someone starts adding, not with the page.
  const staff = useStaff({ enabled: adding });
  const left = staff.people.filter((p) => !ids.includes(p.id) && p.id !== job.recruitmentManagerId);

  // The route answers with a message, not the record, so the card applies what it sent.
  const save = useCallback(
    async (next: { ids: string[]; names: string[]; emails: string[] }, pendingId: string, message: string) => {
      setSavingId(pendingId);
      try {
        const res = await fetch(`/api/jobs/${job.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToIds: next.ids, assignedToNames: next.names, assignedToEmails: next.emails }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Couldn't save the team. Try again.");
        }
        onJobChange({ ...job, assignedToIds: next.ids, assignedToNames: next.names, assignedToEmails: next.emails });
        void refreshJobs();
        notify(message);
      } catch (err) {
        notify(err instanceof Error ? err.message : "Couldn't save the team. Try again.", { tone: "error" });
      } finally {
        setSavingId(null);
      }
    },
    [job, onJobChange, notify],
  );

  const add = (p: StaffPerson) =>
    void save({ ids: [...ids, p.id], names: [...names, p.name || p.email], emails: [...emails, p.email] }, p.id, `${p.name || p.email} added to the team`);

  const removeAt = (index: number) =>
    void save(
      {
        ids: ids.filter((_, i) => i !== index),
        names: names.filter((_, i) => i !== index),
        emails: emails.filter((_, i) => i !== index),
      },
      ids[index] ?? `row-${index}`,
      `${names[index]} removed from the team`,
    );

  return (
    <Panel
      title={
        <>
          Team <span className="ml-1 text-adm-base font-medium tabular-nums text-mist-600">{memberCount}</span>
        </>
      }
      action={
        canEdit && (
          <Button size="sm" variant={adding ? "ghost" : "secondary"} icon={adding ? "x" : "plus"} onClick={() => setAdding((v) => !v)}>
            {adding ? "Done" : "Add"}
          </Button>
        )
      }
    >
      <div className="grid gap-4">
        {canEdit && adding && (
          <div className="grid gap-1.5">
            {staff.loading ? (
              <p role="status" className="flex h-10 items-center gap-2 text-adm-base text-mist-600">
                <Spinner /> Loading the team list…
              </p>
            ) : staff.error ? (
              <div className="flex flex-wrap items-center gap-2">
                <FieldError>Couldn&apos;t load the team list.</FieldError>
                <Button size="sm" variant="ghost" icon="refresh" onClick={() => void staff.reload()}>
                  Retry
                </Button>
              </div>
            ) : left.length === 0 ? (
              <p className="text-adm-base text-mist-600">{staff.people.length === 0 ? "No staff accounts to assign." : "Everyone on staff is already on this job."}</p>
            ) : (
              <Select
                label="Add a recruiter to this job"
                variant="field"
                width="w-full min-w-64"
                value=""
                searchable={left.length > 6}
                disabled={!!savingId}
                options={[
                  { value: "", label: "Choose a teammate…" },
                  ...left.map((p) => ({ value: p.id, label: p.name, description: `${p.email} · ${p.role}` })),
                ]}
                onChange={(id) => {
                  const p = left.find((x) => x.id === id);
                  if (p) add(p);
                }}
              />
            )}
            {savingId && !ids.includes(savingId) && (
              <p role="status" className="flex items-center gap-2 text-adm-xs text-mist-600">
                <Spinner className="size-3.5" /> Adding to the team…
              </p>
            )}
          </div>
        )}

        {memberCount === 0 ? (
          <p className="text-adm-base text-mist-600">{canEdit ? "Nobody is assigned yet. Use Add to put a recruiter on this job." : "Nobody is assigned to this job yet."}</p>
        ) : (
          <ul className="grid gap-1" aria-label="Team members">
            {job.recruitmentManagerName && (
              <li className="flex min-h-10 items-center gap-3">
                <Avatar name={job.recruitmentManagerName} size="sm" />
                <span className="min-w-0 flex-1 truncate text-adm-base font-medium text-navy-900">{job.recruitmentManagerName}</span>
                <span className="shrink-0 text-adm-xs text-mist-600">Manager</span>
              </li>
            )}
            {names.map((name, i) => {
              const busy = savingId === (ids[i] ?? `row-${i}`);
              return (
                <li key={ids[i] ?? i} className="flex min-h-10 items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-adm-base font-medium text-navy-900">{name}</span>
                    {emails[i] && <span className="block truncate text-adm-xs text-mist-600">{emails[i]}</span>}
                  </span>
                  {busy ? (
                    <Spinner className="size-4 text-mist-500" label="Saving" />
                  ) : (
                    canEdit && (
                      <button
                        type="button"
                        onClick={() => removeAt(i)}
                        disabled={!!savingId}
                        aria-label={`Remove ${name} from the team`}
                        title="Remove from the team"
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-mist-500 transition-colors hover:bg-status-danger-soft hover:text-status-danger disabled:opacity-50"
                      >
                        <Icon name="x" className="size-4" />
                      </button>
                    )
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Panel>
  );
}
