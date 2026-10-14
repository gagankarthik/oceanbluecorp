"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ActivityEntry, Application, NoteEntry, TaskEntry } from "@/lib/aws/dynamodb";
import { hireTypeLabel, PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { POOL_LABEL, POOL_META, poolOf } from "@/lib/bench";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { dueState, fmtDue, parseDue, postTaskOp, type TaskOp } from "./tasks";
import { Avatar, Badge, Button, ConfirmDialog, EmptyState, Panel, Spinner } from "@/components/portal/kit";
import { useToast } from "@/components/portal/toast";
import { RatingInput, StaffPicker, TextInput, useStaff } from "@/components/portal/fields";
import { STAGE_DOT, STAGE_LABEL, STAGE_TONE, type Stage } from "@/components/portal/recruiting/model";
import Icon, { type IconName } from "@/components/portal/icons";
import { FactRows } from "./parts";

export type CandidateDetail = Application & { jobDepartment?: string; jobLocation?: string; jobType?: string };

export function StageBadge({ status }: { status: string }) {
  return (
    <Badge tone={STAGE_TONE[status as Stage] ?? "grey"} dot>
      {STAGE_LABEL[status as Stage] ?? status}
    </Badge>
  );
}

/* ── Stage track ───────────────────────────────────────────────────────────── */

/** The pipeline as one segmented row, plus the record's one filled action: Move to next. */
export function StageTrack({
  status,
  saving,
  daysInStage,
  onStage,
}: {
  status: string;
  saving: boolean;
  daysInStage: number | null;
  onStage: (s: AppStatus) => void;
}) {
  const rejected = status === "rejected";
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === status);
  const next = !rejected && idx >= 0 ? PIPELINE_STAGES[idx + 1] : undefined;
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <div className="scroll-thin min-w-0 flex-1 overflow-x-auto">
        <ol aria-label="Hiring pipeline" className="flex min-w-[520px]">
          {PIPELINE_STAGES.map((s, i) => {
            const on = !rejected && i === idx;
            const past = !rejected && idx > i;
            return (
              <li key={s.key} className="flex-1 [&+&]:-ml-px">
                <button
                  type="button"
                  onClick={() => onStage(s.key)}
                  disabled={saving || on}
                  aria-current={on ? "step" : undefined}
                  title={on ? s.label : `Move to ${s.label}`}
                  className={`relative flex h-9 w-full items-center justify-center gap-1.5 px-2 text-[13px] font-medium ring-1 ring-inset transition-colors disabled:cursor-default ${
                    i === 0 ? "rounded-l-lg" : ""
                  } ${i === PIPELINE_STAGES.length - 1 ? "rounded-r-lg" : ""} ${
                    on
                      ? "z-10 bg-ocean-600 text-white ring-ocean-600"
                      : past
                        ? "bg-ocean-50 text-ocean-800 ring-mist-200 hover:bg-ocean-100"
                        : "bg-mist-0 text-mist-700 ring-mist-300 hover:bg-mist-50 hover:text-navy-900"
                  }`}
                >
                  {past && <Icon name="check" className="size-3.5 shrink-0" />}
                  <span className="truncate">{s.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {rejected ? (
          <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-[#fef3f2] px-3 text-[13px] font-medium text-[#b42318]">
            <Icon name="alert" className="size-4" />
            Rejected. Pick a stage to reopen.
          </span>
        ) : (
          <>
            {daysInStage !== null && (
              <span className="text-[13px] tabular-nums text-mist-600">{daysInStage === 0 ? "Moved today" : `${daysInStage}d in stage`}</span>
            )}
            <Button size="sm" variant="ghost" icon="x" onClick={() => onStage("rejected")} disabled={saving}>
              Reject
            </Button>
            {next && (
              <Button size="sm" icon="chevronRight" loading={saving} onClick={() => onStage(next.key)}>
                Move to {next.label}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Overview: applicant details ───────────────────────────────────────────── */

export function ApplicantDetails({ candidate, onEdit }: { candidate: Application; onEdit: () => void }) {
  const [showEmpty, setShowEmpty] = useState(false);
  const fields: { label: string; value?: React.ReactNode }[] = [
    { label: "Work authorization", value: candidate.workAuthorization },
    { label: "Type of hire", value: hireTypeLabel(candidate.hireType) },
    { label: "Source", value: candidate.source },
    { label: "Visa expiry", value: candidate.visaExpiry ? fmtDate(candidate.visaExpiry) : undefined },
    { label: "Sponsorship", value: candidate.visaSponsorshipRequired ? "Required" : undefined },
    {
      label: "LinkedIn",
      // Only an http(s) address becomes a link; anything else would be an unsafe href.
      value:
        candidate.linkedinUrl && /^https?:\/\//i.test(candidate.linkedinUrl) ? (
          <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-ocean-700 underline-offset-4 hover:underline">
            {candidate.linkedinUrl.replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "")}
          </a>
        ) : undefined,
    },
    { label: "Street address", value: candidate.address },
    { label: "ZIP code", value: candidate.zipCode },
    { label: "Applied", value: fmtDate(candidate.appliedAt) },
    { label: "Added by", value: candidate.createdByName },
  ];
  const empty = (f: { value?: React.ReactNode }) => f.value === undefined || f.value === null || f.value === "";
  const blanks = fields.filter(empty);
  const shown = showEmpty ? fields : fields.filter((f) => !empty(f));
  return (
    <Panel
      title="Applicant details"
      action={
        <Button size="sm" variant="ghost" icon="edit" onClick={onEdit}>
          Edit
        </Button>
      }
    >
      {shown.length > 0 && (
        <dl className="grid grid-cols-1 gap-x-6 gap-y-4 min-[420px]:grid-cols-2 xl:grid-cols-3">
          {shown.map((f) => (
            <div key={f.label} className="min-w-0">
              <dt className="text-[12px] font-medium text-mist-500">{f.label}</dt>
              <dd className="mt-0.5 break-words text-[14px] text-navy-900">{empty(f) ? <span className="text-mist-400">Not recorded</span> : f.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {blanks.length > 0 && (
        <button
          type="button"
          onClick={() => setShowEmpty((v) => !v)}
          aria-expanded={showEmpty}
          className={`min-h-8 text-[13px] text-mist-600 hover:text-ocean-700 ${shown.length ? "mt-4" : ""}`}
        >
          {showEmpty ? "Hide empty fields" : `${blanks.length} ${blanks.length === 1 ? "field is" : "fields are"} not recorded. Show`}
        </button>
      )}
    </Panel>
  );
}

/* ── Rail ──────────────────────────────────────────────────────────────────── */

export function RecordRail({
  candidate,
  isOwner,
  ownerSaving,
  hasAnalysis,
  onClaim,
  onRelease,
  onRate,
  onViewResume,
}: {
  candidate: CandidateDetail;
  isOwner: boolean;
  ownerSaving: boolean;
  hasAnalysis: boolean;
  onClaim: () => void;
  onRelease: () => void;
  onRate: (n: number) => void;
  onViewResume: () => void;
}) {
  const head = "text-[12px] font-semibold text-mist-500";
  return (
    <section className="min-w-0 divide-y divide-mist-200 rounded-xl bg-mist-0 ring-1 ring-mist-200">
      {candidate.jobTitle && (
        <div className="p-5">
          <h2 className={head}>Position</h2>
          {candidate.jobId ? (
            <Link href={`/portal/jobs/${candidate.jobId}`} className="group mt-1.5 block">
              <span className="text-[14px] font-semibold text-navy-900 group-hover:text-ocean-700">{candidate.jobTitle}</span>
              <span className="mt-0.5 block text-[12px] text-mist-600">
                {[candidate.jobDepartment, candidate.jobLocation, candidate.jobType?.replace(/-/g, " ")].filter(Boolean).join(" · ")}
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-ocean-700">
                View job posting <Icon name="chevronRight" className="size-4" />
              </span>
            </Link>
          ) : (
            <p className="mt-1.5 text-[14px] font-semibold text-navy-900">{candidate.jobTitle}</p>
          )}
        </div>
      )}
      <div className="p-5">
        <h2 className={head}>Owner</h2>
        {candidate.ownership && candidate.ownershipName ? (
          <div className="mt-2 flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={candidate.ownershipName} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium text-navy-900">{candidate.ownershipName}</p>
                {candidate.ownershipClaimedAt && <p className="text-[12px] tabular-nums text-mist-600">Since {fmtDate(candidate.ownershipClaimedAt)}</p>}
              </div>
            </div>
            {isOwner && (
              <Button size="sm" variant="ghost" loading={ownerSaving} onClick={onRelease}>
                Release
              </Button>
            )}
          </div>
        ) : (
          <Button variant="secondary" icon="userCheck" loading={ownerSaving} onClick={onClaim} className="mt-2 w-full">
            Unclaimed. Claim it
          </Button>
        )}
      </div>
      <div className="p-5">
        <h2 className={head}>Rating</h2>
        <div className="mt-1">
          <RatingInput value={candidate.rating || 0} onChange={onRate} label="Candidate rating" showValue />
        </div>
      </div>
      <div className="p-5">
        <h2 className={head}>Resume</h2>
        {candidate.resumeId ? (
          <button type="button" onClick={onViewResume} className="group mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left ring-1 ring-inset ring-mist-300 hover:bg-mist-50">
            <Icon name="resume" className="size-5 shrink-0 text-mist-600" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-medium text-navy-900">{candidate.resumeFileName || "resume.pdf"}</span>
              <span className="block text-[12px] text-mist-600">View or download</span>
            </span>
            <Icon name="download" className="size-4 shrink-0 text-mist-500 group-hover:text-navy-900" />
          </button>
        ) : (
          <p className="mt-1.5 text-[13px] text-mist-600">No resume on file.</p>
        )}
      </div>
      <div className="p-5">
        <h2 className={`${head} mb-2`}>Application</h2>
        <FactRows
          items={[
            { label: "ID", value: <span className="font-mono text-[12px]">{candidate.applicationId || candidate.id?.slice(0, 8)}</span> },
            ...(candidate.addToTalentBench ? [{ label: "Pool", value: `${POOL_LABEL[poolOf(candidate)]} (${POOL_META[poolOf(candidate)].badge})` }] : []),
            { label: "Applied", value: <span className="tabular-nums">{fmtDate(candidate.appliedAt)}</span> },
            ...(candidate.updatedAt ? [{ label: "Updated", value: <span className="tabular-nums">{fmtDate(candidate.updatedAt)}</span> }] : []),
            ...(hasAnalysis && candidate.resumeAnalyzedAt ? [{ label: "Analyzed", value: <span className="tabular-nums">{fmtDate(candidate.resumeAnalyzedAt)}</span> }] : []),
            ...(candidate.createdByName ? [{ label: "Added by", value: candidate.createdByName }] : []),
          ]}
        />
      </div>
    </section>
  );
}

/* ── Notes ─────────────────────────────────────────────────────────────────── */

/**
 * The one notes surface. A legacy free-text `notes` field shows in the
 * timeline as the oldest entry until the server migrates it on the next post.
 */
export function NotesTab({
  notes,
  legacy,
  legacyAt,
  authorName,
  value,
  onChange,
  onSubmit,
  saving,
}: {
  notes: NoteEntry[];
  legacy?: string;
  legacyAt?: string;
  authorName: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  const showLegacy = !!legacy?.trim() && !notes.some((n) => n.id === "legacy" || n.text === legacy);
  const items = [...notes].reverse();
  const total = items.length + (showLegacy ? 1 : 0);
  return (
    <div className="grid gap-6">
      <Panel>
        <div className="flex items-center gap-2">
          <Avatar name={authorName} size="sm" />
          <span className="text-[14px] font-medium text-navy-900">{authorName}</span>
        </div>
        <label className="mt-3 block">
          <span className="sr-only">New note</span>
          <textarea
            rows={3}
            value={value}
            maxLength={5000}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
            placeholder="Interview feedback, next steps, anything the team should know…"
            className="block min-h-24 w-full resize-y rounded-lg bg-mist-0 px-3 py-2.5 text-[14px] leading-relaxed text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600"
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-mist-600">{value.length > 0 ? <span className="tabular-nums">{value.length.toLocaleString()} / 5,000 · Ctrl+Enter posts</span> : "Visible to your team"}</p>
          <Button size="sm" icon="plus" loading={saving} disabled={!value.trim()} onClick={onSubmit}>
            Post note
          </Button>
        </div>
      </Panel>
      {total > 0 ? (
        <Panel title="Team notes" description={`${total} note${total === 1 ? "" : "s"}, newest first`} padded={false}>
          <ol className="divide-y divide-mist-100">
            {items.map((n) => (
              <NoteRow key={n.id} name={n.addedByName} at={n.addedAt} text={n.text} />
            ))}
            {showLegacy && <NoteRow name="Earlier notes" at={legacyAt} text={legacy!} legacy />}
          </ol>
        </Panel>
      ) : (
        <EmptyState framed compact icon="quote" title="No notes yet" body="Notes you post are shared with everyone working this candidate." />
      )}
    </div>
  );
}

function NoteRow({ name, at, text, legacy }: { name: string; at?: string; text: string; legacy?: boolean }) {
  return (
    <li className="px-5 py-4">
      <div className="flex items-center gap-3">
        {legacy ? (
          <span className="grid size-7 place-items-center rounded-full bg-mist-100 text-mist-600">
            <Icon name="quote" className="size-4" />
          </span>
        ) : (
          <Avatar name={name} size="sm" />
        )}
        <span className="min-w-0 truncate text-[14px] font-medium text-navy-900">{name}</span>
        {legacy && <Badge>From the profile</Badge>}
        {at && <span className="ml-auto shrink-0 text-[12px] tabular-nums text-mist-500">{legacy ? fmtDate(at) : fmtDateTime(at)}</span>}
      </div>
      <p className="mt-2 whitespace-pre-line pl-10 text-[14px] leading-relaxed text-mist-700">{text}</p>
    </li>
  );
}

/* ── Tasks ─────────────────────────────────────────────────────────────────── */

const byDue = (a: TaskEntry, b: TaskEntry) =>
  (parseDue(a.dueAt)?.getTime() ?? Infinity) - (parseDue(b.dueAt)?.getTime() ?? Infinity) || a.createdAt.localeCompare(b.createdAt);

/** Follow-ups on one candidate. The server's returned list is the state; delete asks first. */
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
  const notify = useToast();
  const { people } = useStaff({ activeOnly: true });
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState(me.id);
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const [deleting, setDeleting] = useState<TaskEntry | null>(null);

  const open = useMemo(() => tasks.filter((t) => !t.done).sort(byDue), [tasks]);
  const done = useMemo(() => tasks.filter((t) => t.done).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || "")), [tasks]);

  const run = async (op: TaskOp, key: string) => {
    setPending(key);
    try {
      onChange(await postTaskOp(applicationId, op));
      return true;
    } catch (err) {
      notify(err instanceof Error ? err.message : "Couldn't save the task. Try again.", { tone: "error" });
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
    const ok = await run(
      {
        op: "add",
        text: text.trim(),
        ...(due && { dueAt: due }),
        assigneeId: assignee,
        assigneeName: mine ? me.name : people.find((u) => u.sub === assignee)?.name,
      },
      "add",
    );
    setAdding(false);
    if (ok) {
      setText("");
      setDue("");
      setAssignee(me.id);
      if (!mine) notify("Task assigned");
    }
  };

  const row = (t: TaskEntry) => (
    <TaskRow
      key={t.id}
      task={t}
      meId={me.id}
      busy={pending === t.id}
      onToggle={() => void run({ op: "update", taskId: t.id, done: !t.done }, t.id)}
      onDelete={() => setDeleting(t)}
    />
  );

  return (
    <Panel title="Tasks" description={open.length ? `${open.length} open` : undefined} padded={false}>
      <form onSubmit={add} className="grid gap-3 border-b border-mist-200 p-5 sm:grid-cols-[minmax(0,1fr)_10rem] lg:grid-cols-[minmax(0,1fr)_10rem_12rem_auto] lg:items-end">
        <label className="sm:col-span-2 lg:col-span-1">
          <span className="mb-1.5 block text-[13px] font-medium text-navy-900">Task</span>
          <TextInput value={text} onChange={(e) => setText(e.target.value)} maxLength={500} placeholder="e.g. Call about availability" />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-medium text-navy-900">Due</span>
          <TextInput type="date" value={due} onChange={(e) => setDue(e.target.value)} className="tabular-nums" />
        </label>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-navy-900">Assignee</span>
          <StaffPicker label="Assignee" people={people} keyBy="sub" meKey={me.id} allowNone={false} value={assignee} onChange={(k) => setAssignee(k || me.id)} />
        </div>
        <Button type="submit" icon="plus" loading={adding} disabled={!text.trim()} className="sm:col-span-2 lg:col-span-1">
          Add task
        </Button>
      </form>
      {open.length === 0 && done.length === 0 ? (
        <EmptyState compact icon="check" title="No tasks yet" body="Add a follow-up with a due date so it shows on the assignee's dashboard." />
      ) : (
        <>
          {open.length > 0 ? <ul className="divide-y divide-mist-100">{open.map(row)}</ul> : <p className="px-5 py-4 text-[13px] text-mist-600">All tasks are done.</p>}
          {done.length > 0 && (
            <div className="border-t border-mist-200">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                aria-expanded={showDone}
                className="flex min-h-11 w-full items-center gap-2 px-5 text-left text-[13px] font-medium text-mist-700 hover:bg-mist-50"
              >
                <Icon name="chevronDown" className={`size-4 transition-transform ${showDone ? "rotate-180" : ""}`} />
                {showDone ? "Hide" : "Show"} completed ({done.length})
              </button>
              {showDone && <ul className="divide-y divide-mist-100 border-t border-mist-100">{done.map(row)}</ul>}
            </div>
          )}
        </>
      )}
      {deleting && (
        <ConfirmDialog
          title="Delete this task?"
          body={
            <>
              <span className="font-medium text-navy-900">{deleting.text}</span> is removed for everyone, including the assignee&apos;s dashboard. This can&apos;t be undone.
            </>
          }
          confirmLabel="Delete task"
          busy={pending === deleting.id}
          onCancel={() => setDeleting(null)}
          onConfirm={async () => {
            const ok = await run({ op: "delete", taskId: deleting.id }, deleting.id);
            if (ok) {
              setDeleting(null);
              notify("Task deleted");
            }
          }}
        />
      )}
    </Panel>
  );
}

const DUE_CLS = { overdue: "text-[#b42318] font-medium", today: "text-[#b54708] font-medium", upcoming: "text-mist-600", none: "text-mist-600" } as const;

function TaskRow({ task, meId, busy, onToggle, onDelete }: { task: TaskEntry; meId: string; busy: boolean; onToggle: () => void; onDelete: () => void }) {
  const state = task.done ? "none" : dueState(task.dueAt);
  const assignee = task.assigneeId === meId ? "You" : task.assigneeName || "Unassigned";
  return (
    <li className="flex items-start gap-3 px-5 py-3.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        aria-label={task.done ? `Reopen: ${task.text}` : `Mark done: ${task.text}`}
        onClick={onToggle}
        disabled={busy}
        className={`-m-2 grid size-9 shrink-0 place-items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 disabled:opacity-60`}
      >
        <span className={`grid size-5 place-items-center rounded ring-1 ring-inset ${task.done ? "bg-ocean-600 text-white ring-ocean-600" : "bg-mist-0 ring-mist-400 hover:ring-ocean-600"}`}>
          {busy ? <Spinner className="size-3" /> : task.done && <Icon name="check" className="size-3.5" />}
        </span>
      </button>
      <div className="min-w-0 flex-1">
        <p className={`break-words text-[14px] ${task.done ? "text-mist-500 line-through" : "text-navy-900"}`}>{task.text}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] text-mist-600">
          {task.dueAt && (
            <span className={`inline-flex items-center gap-1 tabular-nums ${DUE_CLS[state]}`}>
              <Icon name="calendar" className="size-3.5" />
              {state === "overdue" ? "Overdue · " : ""}
              {fmtDue(task.dueAt)}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Icon name="userCheck" className="size-3.5" />
            {assignee}
          </span>
          {task.createdByName && task.createdBy !== task.assigneeId && <span>from {task.createdBy === meId ? "you" : task.createdByName}</span>}
        </p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label={`Delete task: ${task.text}`}
        className="-my-1 grid size-9 shrink-0 place-items-center rounded-lg text-mist-500 hover:bg-[#fef3f2] hover:text-[#b42318] disabled:opacity-50"
      >
        <Icon name="trash" className="size-4" />
      </button>
    </li>
  );
}

/* ── Activity ──────────────────────────────────────────────────────────────── */

type HistoryEntry = NonNullable<Application["statusHistory"]>[number];
const KIND_ICON: Record<ActivityEntry["kind"], IconName> = {
  edit: "edit",
  email: "mail",
  bench: "bench",
  ownership: "userCheck",
  resume: "resume",
  task: "check",
};
const fieldLabel = (f: string) => f.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").toLowerCase();
const time = (iso: string) => (Number.isNaN(Date.parse(iso)) ? 0 : Date.parse(iso));

/** Stage moves and recorded actions on one rail, newest first. */
export function ActivityTab({ history, activity }: { history: HistoryEntry[]; activity: ActivityEntry[] }) {
  const items = [
    ...history.map((e) => ({ type: "stage" as const, at: e.changedAt, e })),
    ...activity.map((e) => ({ type: "activity" as const, at: e.at, e })),
  ].sort((a, b) => time(b.at) - time(a.at));
  if (!items.length) return <EmptyState framed compact icon="activity" title="No activity recorded yet" body="Stage changes, edits, emails and tasks appear here." />;
  return (
    <Panel title="Activity" description={`${items.length} event${items.length === 1 ? "" : "s"}, newest first`}>
      <ol className="relative grid gap-5 pl-7">
        <span aria-hidden className="absolute bottom-2 left-[9px] top-2 w-px bg-mist-200" />
        {items.map((it, i) =>
          it.type === "stage" ? (
            <li key={`s-${i}-${it.at}`} className="relative">
              <span aria-hidden className="absolute -left-7 top-1 size-[18px] rounded-full ring-4 ring-mist-0" style={{ background: STAGE_DOT[it.e.status as Stage] ?? "#99a2af" }} />
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="flex flex-wrap items-center gap-1.5 text-[14px] text-mist-700">
                  Moved to <StageBadge status={it.e.status} />
                  {it.e.changedByName && (
                    <span>
                      by <span className="font-medium text-navy-900">{it.e.changedByName}</span>
                    </span>
                  )}
                </p>
                <span className="text-[12px] tabular-nums text-mist-500">{fmtDateTime(it.at)}</span>
              </div>
              {it.e.notes && <p className="mt-2 rounded-lg bg-mist-50 px-3 py-2 text-[13px] text-mist-700">{it.e.notes}</p>}
            </li>
          ) : (
            <li key={it.e.id} className="relative">
              <span aria-hidden className="absolute -left-7 top-0 grid size-[18px] place-items-center rounded-full bg-mist-0 text-mist-500 ring-4 ring-mist-0">
                <Icon name={KIND_ICON[it.e.kind] ?? "activity"} className="size-4" />
              </span>
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <p className="min-w-0 text-[14px] text-navy-900">
                  {it.e.summary}
                  {it.e.byName && <span className="text-mist-700"> by <span className="font-medium text-navy-900">{it.e.byName}</span></span>}
                </p>
                <span className="text-[12px] tabular-nums text-mist-500">{fmtDateTime(it.at)}</span>
              </div>
              {it.e.kind === "edit" && it.e.fields && it.e.fields.length > 0 && (
                <p className="mt-1 text-[12px] text-mist-600">Changed: {it.e.fields.map(fieldLabel).join(", ")}</p>
              )}
            </li>
          ),
        )}
      </ol>
    </Panel>
  );
}
