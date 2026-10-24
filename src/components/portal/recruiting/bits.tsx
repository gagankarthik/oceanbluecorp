"use client";

import { StateIcon, type StateMark } from "../kit/state-icon";
import { useEffect } from "react";
import { useToast } from "../toast";
import Icon from "../icons";
import { Avatar, Badge } from "../ui";
import type { MenuEntry } from "../records/Menu";

import { Modal as KitModal } from "../kit/overlay";
import { ErrorState as KitErrorState } from "../kit/states";
import { ListPageSkeleton } from "../kit/skeletons";
import {
  JOB_STATE, JOB_STATUS_DOT, PIPELINE, STAGE_DOT, stageState, STAGE_LABEL, STAGE_TONE, duplicateJobHref, jobStatusLabel, jobStatusShort, publicJobPath, type JobStatus, type Stage,
} from "./model";

/** Kit Modal; kept for existing imports. */
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <KitModal title={title} onClose={onClose}>
      {children}
    </KitModal>
  );
}

/** Hands the message to the portal-wide toast stack, then clears the local state */
export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  const notify = useToast();
  useEffect(() => {
    notify(message);
    onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message]);
  return null;
}

export const fieldCls =
  "mt-1.5 block h-10 w-full rounded-lg bg-mist-0 px-3 text-adm-base text-navy-900 ring-1 ring-inset ring-mist-300 focus:outline-none focus:ring-2 focus:ring-ocean-600";

export function Timeline({ items }: { items: { date: string; text: string }[] }) {
  return (
    <ol className="relative grid gap-4 pl-5">
      <span aria-hidden className="absolute bottom-1 left-[5px] top-1 w-px bg-mist-200" />
      {items.map((t, i) => (
        <li key={i} className="relative">
          <span aria-hidden className="absolute -left-5 top-1.5 size-2.5 rounded-full bg-ocean-600 ring-4 ring-ocean-50" />
          <p className="text-adm-base text-navy-900">{t.text}</p>
          <p className="text-adm-xs text-mist-600">{t.date}</p>
        </li>
      ))}
    </ol>
  );
}

export function Tags({ items }: { items: string[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((s) => (
        <span key={s} className="rounded-md bg-mist-100 px-2 py-0.5 text-adm-xs font-medium text-navy-900">
          {s}
        </span>
      ))}
    </span>
  );
}

/** Row of toggle chips that narrows the data on the page; click again to clear */
export function ChipFilter({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label?: string; count?: number; color?: string }[];
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-adm-xs font-medium text-mist-600">{label}</span>
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? null : o.value)}
            className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-adm-base font-medium ring-1 ring-inset transition-colors ${
              on ? "bg-contrast text-on-contrast ring-contrast" : "bg-mist-0 text-navy-900 ring-mist-300 hover:bg-mist-50"
            }`}
          >
            {o.color && <span aria-hidden className="size-2 rounded-full" style={{ background: o.color }} />}
            {o.label ?? o.value}
            {o.count !== undefined && <span className={`tabular-nums ${on ? "text-tide-300" : "text-mist-600"}`}>{o.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** Makes a KPI card act as a filter toggle */
export function KpiButton({ active, onClick, label, children }: { active: boolean; onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      className={`block w-full rounded-lg text-left transition-[transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-md ${active ? "ring-2 ring-ocean-600 ring-offset-2 ring-offset-mist-50" : ""}`}
    >
      {children}
    </button>
  );
}

/** Kit KpiRow; kept for existing imports. */
export { KpiRow } from "../kit/layout";

/** Ordered stages as bars, with conversion from the previous stage shown inline */
export function StageFunnel({
  stages,
  active,
  onSelect,
}: {
  stages: { label: string; value: number }[];
  active?: string | null;
  onSelect?: (label: string | null) => void;
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <ol className="grid gap-2.5">
      {stages.map((s, i) => {
        const prev = i > 0 ? stages[i - 1].value : null;
        const conv = prev ? Math.round((s.value / prev) * 100) : null;
        const on = active === s.label;
        const inner = (
          <>
            <span className="truncate text-left text-adm-base text-navy-900">{s.label}</span>
            <span className="relative h-7 overflow-hidden rounded-md bg-mist-100">
              <span
                className={`absolute inset-y-0 left-0 rounded-md transition-[width] duration-200 ${on ? "bg-contrast" : "bg-ocean-600"}`}
                style={{ width: `${Math.max(4, (s.value / max) * 100)}%`, opacity: on || !active ? 1 : 0.45 }}
              />
            </span>
            <span className="text-right text-adm-base font-semibold tabular-nums text-navy-900">{s.value}</span>
            <span className="text-right text-adm-xs tabular-nums text-mist-600">{conv === null ? "" : `${conv}%`}</span>
          </>
        );
        const cls = "grid w-full grid-cols-[6.5rem_1fr_2.25rem_2.75rem] items-center gap-3 rounded-lg";
        return (
          <li key={s.label}>
            {onSelect ? (
              <button
                type="button"
                aria-pressed={on}
                onClick={() => onSelect(on ? null : s.label)}
                title={conv === null ? `${s.value} candidates` : `${s.value} candidates, ${conv}% of ${stages[i - 1].label}`}
                className={`${cls} p-1 transition-colors duration-150 hover:bg-mist-50`}
              >
                {inner}
              </button>
            ) : (
              <div className={cls} title={conv === null ? undefined : `${conv}% of ${stages[i - 1].label}`}>
                {inner}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Clickable breakdown rows that grow to fill the rest of a stretched side panel */
export function BreakdownList({
  label,
  rows,
  active,
  onSelect,
}: {
  label: string;
  rows: { key: string; label: string; value: number; pct: number; sub?: string; color?: string }[];
  active: string | null;
  onSelect: (key: string | null) => void;
}) {
  return (
    <ul aria-label={label} className="grid min-h-0 flex-1 auto-rows-fr divide-y divide-mist-100 border-t border-mist-100">
      {rows.map((r) => {
        const on = active === r.key;
        return (
          <li key={r.key} className="flex">
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(on ? null : r.key)}
              className={`flex min-h-11 w-full items-center gap-3 px-2 text-left transition-colors duration-150 ${on ? "bg-ocean-50" : "hover:bg-mist-50"}`}
            >
              <span aria-hidden className="size-2.5 shrink-0 rounded-full" style={{ background: r.color ?? "var(--color-ocean-600)" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-adm-base font-medium text-navy-900">{r.label}</span>
                {r.sub && <span className="block truncate text-adm-xs text-mist-600">{r.sub}</span>}
              </span>
              <span className="text-right text-adm-base font-semibold tabular-nums text-navy-900">{r.value}</span>
              <span className="w-10 text-right text-adm-xs tabular-nums text-mist-600">{r.pct}%</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Pipeline stage chip, coloured by the real stage key */
export function StageBadge({ stage }: { stage: string }) {
  return (
    <Badge tone={STAGE_TONE[stage as Stage] ?? "grey"} mark={stageState(stage)}>
      {STAGE_LABEL[stage as Stage] ?? stage}
    </Badge>
  );
}

/** Compact native select for an inline status change; the state icon (or dot) carries the colour */
export function InlineSelect({
  value,
  options,
  onChange,
  label,
  dot,
  mark,
  disabled,
  width = "w-36",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  label: string;
  dot?: string;
  mark?: StateMark;
  disabled?: boolean;
  width?: string;
}) {
  return (
    <span className={`relative inline-flex max-w-full items-center ${width}`} onClick={(e) => e.stopPropagation()}>
      {mark ? (
        <span aria-hidden className="pointer-events-none absolute left-2 flex">
          <StateIcon {...mark} />
        </span>
      ) : (
        dot && <span aria-hidden className="pointer-events-none absolute left-2.5 size-2 rounded-full" style={{ background: dot }} />
      )}
      <select
        value={value}
        aria-label={label}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`h-8 w-full cursor-pointer appearance-none rounded-md bg-transparent pr-7 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-transparent transition-colors hover:bg-mist-0 hover:ring-mist-300 focus:bg-mist-0 focus:outline-none focus:ring-2 focus:ring-ocean-600 disabled:opacity-50 ${mark || dot ? "pl-6" : "pl-2.5"}`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2 size-3.5 text-mist-500" />
    </span>
  );
}

export const stageDot = (s: string) => STAGE_DOT[s as Stage] ?? "var(--color-mist-400)";

/**
 * How far through the pipeline a candidate got, as one segment per stage from
 * New to Hired, filled in the current stage's colour. A rejected candidate
 * keeps the steps they reached, in the rejected colour.
 */
export function StageProgress({ status, history }: { status: string; history?: { status: string }[] }) {
  const at = (s: string) => PIPELINE.indexOf(s as Stage);
  const reached =
    status === "rejected"
      ? Math.max(0, ...(history ?? []).map((h) => at(h.status)))
      : Math.max(0, at(status));
  const steps = PIPELINE.length;
  // The dot colour, so New reads as grey rather than its hollow white fill.
  const fill = stageDot(status);
  const label = status === "rejected" ? `Rejected after ${STAGE_LABEL[PIPELINE[reached]]}` : `Step ${reached + 1} of ${steps}`;
  return (
    <span role="img" aria-label={label} title={label} className="flex h-3.5 w-20 items-center gap-0.5 rounded-sm bg-mist-100 px-0.5">
      {PIPELINE.map((s, i) => (
        <span key={s} className="h-2.5 flex-1 rounded-[1px]" style={{ background: i <= reached ? fill : "var(--color-mist-300)" }} />
      ))}
    </span>
  );
}

/** First-load placeholder: the kit list skeleton, without a header unless asked. */
export function LoadingState({ label = "Loading", header = false, kpis = 4 }: { label?: string; header?: boolean; kpis?: number }) {
  return <ListPageSkeleton label={label} header={header} kpis={kpis} />;
}

/** A failed load with a retry (kit ErrorState). */
export function ErrorState({ title, message, onRetry }: { title: string; message?: string; onRetry: () => void }) {
  return <KitErrorState title={title} message={message} onRetry={onRetry} />;
}

/** Kit ConfirmDialog; kept for existing imports. */
export { ConfirmDialog } from "../kit/overlay";

/** Interactive 1–5 stars; clicking the current value clears it */
export function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <span role="group" aria-label={label} className="inline-flex items-center" onClick={(e) => e.stopPropagation()}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          aria-pressed={n <= value}
          onClick={() => onChange(n === value ? 0 : n)}
          className="grid size-8 place-items-center rounded text-mist-300 transition-colors hover:text-status-warning-mark"
        >
          <svg viewBox="0 0 24 24" className={`size-4 ${n <= value ? "text-status-warning-mark" : ""}`} aria-hidden>
            <path fill="currentColor" d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z" />
          </svg>
        </button>
      ))}
    </span>
  );
}

/** Read-only rating for dense rows: one star and the number, or a muted dash when unrated. */
export function RatingValue({ value }: { value?: number }) {
  if (!value) return <span className="text-mist-600" aria-label="Not rated">&mdash;</span>;
  return (
    <span className="inline-flex items-center gap-1 tabular-nums text-navy-900" aria-label={`${value} of 5 stars`}>
      <svg viewBox="0 0 24 24" className="size-3.5 text-status-warning-mark" aria-hidden>
        <path fill="currentColor" d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z" />
      </svg>
      {value}
    </span>
  );
}

/** Overlapping initials, three at most then "+N"; red "Unassigned" when empty. */
export function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  if (!names.length) return <span className="text-adm-base font-medium text-status-danger">Unassigned</span>;
  const shown = names.slice(0, max);
  const extra = names.length - shown.length;
  return (
    <span className="inline-flex items-center" title={names.join(", ")}>
      <span className="sr-only">{names.join(", ")}</span>
      {shown.map((n, i) => (
        <span key={`${n}-${i}`} className={`rounded-full ring-2 ring-white ${i ? "-ml-2" : ""}`}>
          <Avatar name={n} size="sm" />
        </span>
      ))}
      {extra > 0 && (
        <span aria-hidden className="-ml-2 grid size-7 place-items-center rounded-full bg-mist-200 text-adm-xs font-semibold tabular-nums text-navy-900 ring-2 ring-white">
          +{extra}
        </span>
      )}
    </span>
  );
}

/** Job status select that reads short ("Active") but lists the full labels when opened. */
export function JobStatusSelect({
  value,
  options,
  onChange,
  label,
  disabled,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: JobStatus) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <span
      onClick={(e) => e.stopPropagation()}
      className={`relative inline-flex h-8 max-w-full items-center gap-1.5 rounded-md pl-2.5 pr-7 text-adm-base font-medium text-navy-900 ring-1 ring-inset ring-transparent transition-colors hover:bg-mist-0 hover:ring-mist-300 has-[:focus-visible]:bg-mist-0 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ocean-600 ${disabled ? "opacity-50" : ""}`}
    >
      {JOB_STATE[value] ? <StateIcon {...JOB_STATE[value]} /> : <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: JOB_STATUS_DOT[value] ?? "var(--color-mist-400)" }} />}
      <span aria-hidden className="whitespace-nowrap">{jobStatusShort(value)}</span>
      <Icon name="chevronDown" className="pointer-events-none absolute right-2 size-3.5 text-mist-500" />
      <select
        value={value}
        aria-label={label}
        title={jobStatusLabel(value)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as JobStatus)}
        className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0 focus:outline-none disabled:cursor-default"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </span>
  );
}

/**
 * One action set for a role, used by the list rows and the job page: Open, Edit,
 * Add applicant, Duplicate, Preview, then Delete. Items the viewer can't use are left out.
 */
export function jobMenuItems({
  job,
  go,
  onOpen,
  onDelete,
  canEdit,
  canDelete,
  canAddApplicant,
  extra = [],
}: {
  job: { id: string; status: string; category?: string };
  go: (href: string) => void;
  onOpen?: () => void;
  onDelete: () => void;
  canEdit: boolean;
  /** requireStaff: deleting removes the role's applications too. */
  canDelete: boolean;
  canAddApplicant?: boolean;
  /** Page-specific items placed before Delete. */
  extra?: MenuEntry[];
}): MenuEntry[] {
  const q = job.category === "open" ? "?category=open" : "";
  const live = job.status === "active";
  const items: MenuEntry[] = [
    ...(onOpen ? [{ label: "Open", icon: "eye" as const, onSelect: onOpen }] : []),
    ...(canEdit ? [{ label: "Edit", icon: "edit" as const, onSelect: () => go(`/portal/jobs/${job.id}/edit${q}`) }] : []),
    ...(canAddApplicant ? [{ label: "Add applicant", icon: "plus" as const, onSelect: () => go(`/portal/applications/new?jobId=${job.id}`) }] : []),
    ...(canEdit ? [{ label: "Duplicate", icon: "copy" as const, onSelect: () => go(duplicateJobHref(job)) }] : []),
    live
      ? { label: "Preview", icon: "globe" as const, onSelect: () => window.open(publicJobPath(job.id), "_blank", "noopener") }
      : { label: "Preview", icon: "globe" as const, onSelect: () => {}, disabled: true, hint: "Only Active roles are on the website" },
    ...extra,
  ];
  if (canDelete) items.push({ kind: "separator" }, { label: "Delete", icon: "trash", danger: true, onSelect: onDelete });
  return items;
}
