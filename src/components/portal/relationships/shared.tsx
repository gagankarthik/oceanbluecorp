"use client";

import Link from "next/link";
import { useState } from "react";
import Icon from "../icons";
import { useToast as useGlobalToast } from "../toast";
import { Button, EmptyState } from "../ui";
import { ConfirmDialog, Modal as KitModal } from "../kit/overlay";
import { ErrorState } from "../kit/states";
import { ListPageSkeleton, Skeleton } from "../kit/skeletons";

/**
 * Thin wrapper over the portal-wide toast so pages can call show("...")
 * or notify("...", { undo }) directly.
 */
export function useToast() {
  const notify = useGlobalToast();
  return {
    show: (message: string) => notify(message),
    error: (message: string) => notify(message, { tone: "error" }),
    notify,
  };
}

/** JSON request that throws the route's own error message on a non-2xx. */
export async function send<T = Record<string, unknown>>(url: string, method: "POST" | "PATCH" | "PUT" | "DELETE", body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

export const errorText = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Kit Modal; `lg` is the wider form size. */
export function Modal({ title, onClose, children, size = "md" }: { title: string; onClose: () => void; children: React.ReactNode; size?: "md" | "lg" }) {
  return (
    <KitModal title={title} onClose={onClose} size={size === "lg" ? "lg" : "sm"}>
      {children}
    </KitModal>
  );
}

/** Kit ConfirmDialog under this area's prop names. */
export function ConfirmModal({
  title,
  body,
  confirmLabel,
  busy,
  onConfirm,
  onClose,
}: {
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return <ConfirmDialog title={title} body={body} confirmLabel={confirmLabel} busy={busy} onConfirm={onConfirm} onCancel={onClose} />;
}

export const inputCls =
  "mt-1.5 block h-10 w-full rounded-lg bg-mist-0 px-3 text-[14px] text-navy-900 ring-1 ring-inset ring-mist-300 placeholder:text-mist-400 focus:outline-none focus:ring-2 focus:ring-ocean-600 aria-[invalid=true]:ring-[#f04438]";

/** Labelled input with its inline error */
export function Field({
  label,
  error,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-[13px] font-medium text-navy-900 ${className}`}>
      {label}
      {required && <span className="text-[#b42318]"> *</span>}
      {children}
      {error ? (
        <span role="alert" className="mt-1 block text-[12px] font-normal text-[#b42318]">
          {error}
        </span>
      ) : (
        hint && <span className="mt-1 block text-[12px] font-normal text-mist-500">{hint}</span>
      )}
    </label>
  );
}

/** Unsaved-changes guard for a form modal: close() asks first when dirty */
export function useDiscardGuard(dirty: boolean, busy: boolean, onClose: () => void) {
  const [asking, setAsking] = useState(false);
  const close = () => {
    if (busy) return;
    if (dirty) setAsking(true);
    else onClose();
  };
  const prompt = asking ? (
    <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[#fffaeb] px-4 py-3 text-[14px] text-[#b54708] ring-1 ring-inset ring-[#fedf89]">
      <span>Discard your unsaved changes?</span>
      <span className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setAsking(false)}>
          Keep editing
        </Button>
        <Button size="sm" variant="danger" onClick={onClose}>
          Discard
        </Button>
      </span>
    </div>
  ) : null;
  return { close, prompt };
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-lg bg-[#fef3f2] px-3 py-2 text-[13px] text-[#b42318]">
      {message}
    </p>
  );
}

/** First-load placeholder under an already drawn PageHeader (kit list skeleton). */
export function PageSkeleton({ label, kpis = 3 }: { label: string; kpis?: number }) {
  return <ListPageSkeleton label={label} header={false} kpis={kpis} />;
}

/** A failed load: what happened, a retry, and where to get help (kit ErrorState). */
export function LoadError({ title, message, onRetry }: { title: string; message?: string; onRetry: () => void }) {
  return <ErrorState title={title} message={message} onRetry={onRetry} />;
}

/** Shown in a detail drawer whose record was just deleted */
export function GoneNotice({ noun }: { noun: string }) {
  return <EmptyState icon="trash" title={`This ${noun} was deleted`} body="Close this panel to go back to the list." />;
}

/** Delete button that asks once more in place, so the drawer never stacks a dialog */
export function InlineDelete({ label, warning, busy, onConfirm }: { label: string; warning: string; busy?: boolean; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <Button variant="danger" icon="trash" onClick={() => setAsking(true)}>
        {label}
      </Button>
    );
  }
  return (
    <div className="grid gap-3 rounded-xl bg-[#fef3f2] p-4 ring-1 ring-inset ring-[#fecdca]">
      <p className="text-[14px] text-[#b42318]">{warning}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={() => setAsking(false)} disabled={busy}>
          Cancel
        </Button>
        <Button variant="danger" icon="trash" loading={busy} onClick={onConfirm}>
          {label}
        </Button>
      </div>
    </div>
  );
}

/** Facts list for a detail drawer; empty values show a dash */
export function Facts({ items, cols = 2 }: { items: [string, React.ReactNode][]; cols?: 1 | 2 }) {
  return (
    <dl className={`grid gap-3 rounded-xl bg-mist-50 p-4 text-[14px] ${cols === 2 ? "sm:grid-cols-2" : ""}`}>
      {items.map(([k, v]) => (
        <div key={k} className="min-w-0">
          <dt className="text-[12px] font-medium text-mist-500">{k}</dt>
          <dd className="truncate text-navy-900" title={typeof v === "string" ? v : undefined}>
            {v || <span className="text-mist-400">–</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Weekly buckets ending this week: labels like "Oct 6" and a counter */
export function weekBuckets(weeks: number, now = new Date()) {
  const end = new Date(now);
  end.setHours(0, 0, 0, 0);
  end.setDate(end.getDate() - end.getDay() + 7); // next Sunday, exclusive
  const starts = Array.from({ length: weeks }, (_, i) => new Date(end.getTime() - (weeks - i) * 7 * 86_400_000));
  return {
    labels: starts.map((d) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })),
    count: (dates: (string | undefined)[]) => {
      const out = new Array(weeks).fill(0);
      for (const iso of dates) {
        const t = iso ? new Date(iso).getTime() : NaN;
        if (Number.isNaN(t) || t >= end.getTime()) continue;
        const i = weeks - 1 - Math.floor((end.getTime() - 1 - t) / (7 * 86_400_000));
        if (i >= 0) out[i]++;
      }
      return out as number[];
    },
  };
}

/**
 * Clickable segment chips that sit beside a chart: each chip carries the same
 * series colour as its chart segment and filters the page's table.
 */
export function SegmentChips({
  items,
  value,
  onChange,
  colors,
  label,
}: {
  items: { label: string; count: number }[];
  value: string;
  onChange: (v: string) => void;
  colors?: readonly string[];
  label: string;
}) {
  const total = items.reduce((a, i) => a + i.count, 0);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {[{ label: "All", count: total }, ...items].map((it, i) => {
        const active = value === it.label;
        const color = i === 0 ? undefined : colors?.[(i - 1) % colors.length];
        return (
          <button
            key={it.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active && it.label !== "All" ? "All" : it.label)}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors ${
              active ? "bg-navy-900 text-white" : "bg-mist-0 text-navy-900 ring-1 ring-inset ring-mist-300 hover:bg-mist-100"
            }`}
          >
            {color && <span aria-hidden className="size-2.5 rounded-full ring-1 ring-white/60" style={{ background: color }} />}
            {it.label}
            <span className={`tabular-nums ${active ? "text-tide-200" : "text-mist-500"}`}>{it.count}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Kit KpiRow; kept for existing imports. */
export { KpiRow } from "../kit/layout";

/** Segmented tabs for the working area */
export function ViewTabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    // Sized to its tabs, same track and pills as the kit's Segmented
    <div role="tablist" aria-label={label} className="inline-flex w-fit max-w-full shrink-0 justify-self-start scroll-strip rounded-lg bg-mist-100 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ${
            value === t.id ? "bg-mist-0 text-navy-900 shadow-sm" : "text-mist-600 hover:text-navy-900"
          }`}
        >
          {t.label}
          {t.count !== undefined && (
            <span className={`rounded-md px-1.5 text-[12px] tabular-nums ${value === t.id ? "bg-ocean-50 text-ocean-700" : "bg-mist-200 text-mist-600"}`}>{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/** Roles a client or vendor is attached to, linking to each posting */
export function LinkedRoles({ jobs, loading, error }: { jobs: { id: string; title: string; status: string; location?: string }[]; loading: boolean; error?: boolean }) {
  if (loading)
    return (
      <div role="status" aria-label="Loading roles" className="grid gap-2">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  if (error) return <p className="text-[14px] text-mist-600">Couldn&apos;t load the roles for this record.</p>;
  if (!jobs.length) return <p className="text-[14px] text-mist-600">No roles are linked to this record yet.</p>;
  return (
    <ul className="divide-y divide-mist-200 rounded-xl ring-1 ring-mist-200">
      {jobs.map((j) => (
        <li key={j.id}>
          <Link href={`/portal/jobs/${j.id}`} className="flex items-center justify-between gap-3 px-4 py-3 text-[14px] hover:bg-mist-50">
            <span className="min-w-0">
              <span className="block truncate font-medium text-navy-900">{j.title}</span>
              {j.location && <span className="block truncate text-[12px] text-mist-600">{j.location}</span>}
            </span>
            <span className="flex shrink-0 items-center gap-2 text-[12px] text-mist-600">
              {j.status}
              <Icon name="chevronRight" className="size-4" />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
