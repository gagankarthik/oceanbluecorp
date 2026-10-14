"use client";

import { useEffect, useRef, useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import type { Filter } from "@/components/portal/DataTable";
import Icon from "@/components/portal/icons";
import Select from "@/components/portal/Select";
import { Avatar } from "@/components/portal/ui";
import { fmtDate } from "@/lib/format";
import { daysInStage, STALE_DAYS, TERMINAL } from "@/lib/pipeline";
import { StarInput, stageDot } from "./bits";
import { BOARD, PIPELINE, STAGE_LABEL, type Stage } from "./model";

type Row = Application & { searchText?: string };

const PAGE = 50;

export const nextStage = (s: Stage): Stage | null => {
  const i = PIPELINE.indexOf(s);
  return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null;
};

export function SkillChips({ skills, max }: { skills?: string[]; max: number }) {
  const all = skills ?? [];
  if (!all.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {all.slice(0, max).map((s) => (
        <span key={s} className="rounded-md bg-mist-100 px-1.5 py-0.5 text-[11px] font-medium text-mist-700">{s}</span>
      ))}
      {all.length > max && <span className="px-1 py-0.5 text-[11px] font-medium tabular-nums text-mist-500">+{all.length - max}</span>}
    </span>
  );
}

function ShowMore({ hidden, onClick }: { hidden: number; onClick: () => void }) {
  if (hidden <= 0) return null;
  return (
    <button type="button" onClick={onClick} className="w-full rounded-md px-2 py-1.5 text-[12px] font-medium text-ocean-700 hover:bg-mist-0">
      Show {Math.min(hidden, PAGE)} more{hidden > PAGE ? ` of ${hidden}` : ""}
    </button>
  );
}

/** Search plus the table's filters, for the board and list layouts. */
export function FilterBar<T>({
  query,
  onQuery,
  filters,
  active,
  onActive,
  rows,
}: {
  query: string;
  onQuery: (q: string) => void;
  filters: Filter<T>[];
  active: Record<string, string>;
  onActive: (f: Record<string, string>) => void;
  rows: T[];
}) {
  const any = !!query || Object.values(active).some((v) => v && v !== "All");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="relative block w-full sm:w-auto sm:min-w-[15rem] sm:flex-1 xl:max-w-xs">
        <span className="sr-only">Search applicants, emails or skills</span>
        <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-[18px] -translate-y-1/2 text-mist-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search applicants, emails or skills"
          className="h-10 w-full rounded-lg bg-mist-0 pl-10 pr-3 text-[14px] ring-1 ring-inset ring-mist-300 placeholder:text-mist-500 focus:outline-none focus:ring-2 focus:ring-ocean-600"
        />
      </label>
      {filters.map((f) => (
        <Select
          key={f.key}
          label={f.label}
          value={active[f.key] ?? "All"}
          onChange={(v) => onActive({ ...active, [f.key]: v })}
          options={[
            { value: "All", label: `All ${f.label.toLowerCase()}`, count: rows.length },
            ...f.options.map((o) => ({ value: o, label: o, count: rows.filter((r) => (f.match ? f.match(r, o) : f.value(r) === o)).length })),
          ]}
          className="min-w-[10rem]"
        />
      ))}
      {any && (
        <button
          type="button"
          onClick={() => {
            onQuery("");
            onActive({});
          }}
          className="px-1 text-[13px] font-medium text-ocean-700 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

/** Kanban: drag a card to another column, or step it forward. */
export function BoardView({
  rows,
  focus,
  onOpen,
  onMove,
  onRate,
}: {
  rows: Row[];
  focus: Stage | null;
  onOpen: (id: string) => void;
  onMove: (a: Row, to: Stage) => void;
  onRate: (a: Row, n: number) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [shown, setShown] = useState<Partial<Record<Stage, number>>>({});

  const drop = (stage: Stage) => {
    const a = rows.find((r) => r.id === dragId);
    if (a && a.status !== stage) onMove(a, stage);
    setDragId(null);
    setOver(null);
  };

  return (
    // Scrolls inside its own box; on phones one column fills the screen and snaps.
    <div className="scroll-thin min-w-0 snap-x snap-mandatory overflow-x-auto pb-2 md:snap-none">
      <div className="flex w-max gap-4">
        {BOARD.filter((st) => !focus || st === focus).map((stage) => {
          const items = rows.filter((a) => a.status === stage);
          const limit = shown[stage] ?? PAGE;
          const isOver = over === stage;
          return (
            <section
              key={stage}
              aria-label={`${STAGE_LABEL[stage]}, ${items.length}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (over !== stage) setOver(stage);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null);
              }}
              onDrop={() => drop(stage)}
              className={`flex w-[min(18rem,calc(100vw-3rem))] shrink-0 snap-start flex-col rounded-xl p-3 transition-colors ${isOver ? "bg-ocean-50 ring-2 ring-ocean-600" : "bg-mist-100"}`}
            >
              <header className="flex items-center justify-between px-1 pb-3">
                <span className="flex items-center gap-2 text-[14px] font-semibold text-navy-900">
                  <span className="size-2.5 rounded-full" style={{ background: stageDot(stage) }} />
                  {STAGE_LABEL[stage]}
                </span>
                <span className="rounded-md bg-mist-0 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-mist-700">{items.length}</span>
              </header>
              <ul className="grid gap-2">
                {items.length === 0 && (
                  <li className={`rounded-lg border border-dashed p-4 text-center text-[13px] ${isOver ? "border-ocean-600 font-medium text-ocean-700" : "border-mist-300 text-mist-500"}`}>
                    {isOver ? "Drop here" : "No candidates"}
                  </li>
                )}
                {items.slice(0, limit).map((a) => {
                  const nxt = nextStage(a.status);
                  const stale = !TERMINAL.has(a.status) && daysInStage(a) >= STALE_DAYS;
                  return (
                    <li
                      key={a.id}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      className={`cursor-grab rounded-lg bg-mist-0 p-3 ring-1 ring-mist-200 active:cursor-grabbing ${dragId === a.id ? "opacity-40" : ""}`}
                    >
                      <button type="button" onClick={() => onOpen(a.id)} className="flex w-full items-start gap-3 text-left">
                        <Avatar name={a.name || a.email} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-semibold hover:text-ocean-700">{a.name || a.email}</span>
                          <span className="block truncate text-[12px] text-mist-600">{a.jobTitle || "No position"}</span>
                          <span className={`block text-[12px] ${stale ? "font-medium text-[#b54708]" : "text-mist-500"}`}>
                            {TERMINAL.has(a.status) ? fmtDate(a.appliedAt) : `${daysInStage(a)}d in stage`}
                          </span>
                        </span>
                      </button>
                      {!!a.skills?.length && (
                        <div className="mt-2">
                          <SkillChips skills={a.skills} max={3} />
                        </div>
                      )}
                      <div className="mt-2 flex items-center justify-between gap-2 border-t border-mist-100 pt-2">
                        <StarInput value={a.rating || 0} onChange={(n) => onRate(a, n)} label={`Rating for ${a.name || a.email}`} />
                        {nxt && (
                          <button
                            type="button"
                            onClick={() => onMove(a, nxt)}
                            className="inline-flex min-h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-ocean-700 hover:bg-ocean-50"
                            aria-label={`Move ${a.name || a.email} to ${STAGE_LABEL[nxt]}`}
                          >
                            {STAGE_LABEL[nxt]}
                            <Icon name="chevronRight" className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
                <li>
                  <ShowMore hidden={items.length - limit} onClick={() => setShown((s) => ({ ...s, [stage]: limit + PAGE }))} />
                </li>
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export type SavedSearch<S> = { id: string; name: string; state: S; createdAt: string };
const MAX_SAVED = 20;

/** Named snapshots of the list's view, search and filters, kept per browser. */
export function SavedViewsMenu<S>({
  items,
  activeId,
  onApply,
  onSave,
  onDelete,
}: {
  items: SavedSearch<S>[];
  activeId: string | null;
  onApply: (s: SavedSearch<S>) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const full = items.length >= MAX_SAVED;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    if (!n || full) return;
    onSave(n.slice(0, 60));
    setName("");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`inline-flex h-10 items-center gap-2 rounded-lg px-3 text-[14px] font-medium ring-1 ring-inset ${
          activeId ? "bg-ocean-50 text-ocean-800 ring-ocean-300" : "bg-mist-0 text-navy-900 ring-mist-300 hover:bg-mist-50"
        }`}
      >
        <Icon name="star" className="size-[18px]" />
        My views
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-30 w-72 rounded-xl bg-mist-0 p-3 shadow-xl ring-1 ring-mist-200">
          {items.length === 0 ? (
            <p className="px-1 py-2 text-[13px] text-mist-600">Save the current view, search and filters to come back to them.</p>
          ) : (
            <ul className="scroll-thin max-h-60 overflow-y-auto">
              {items.map((s) => (
                <li key={s.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onApply(s);
                      setOpen(false);
                    }}
                    className={`min-w-0 flex-1 truncate rounded-md px-2 py-1.5 text-left text-[14px] hover:bg-mist-50 ${s.id === activeId ? "font-semibold text-ocean-700" : "text-navy-900"}`}
                  >
                    {s.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(s.id)}
                    aria-label={`Delete saved view ${s.name}`}
                    className="grid size-7 shrink-0 place-items-center rounded-md text-mist-500 hover:bg-mist-100 hover:text-navy-900"
                  >
                    <Icon name="x" className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={save} className="mt-2 flex gap-2 border-t border-mist-200 pt-3">
            <label className="sr-only" htmlFor="saved-view-name">Name this view</label>
            <input
              id="saved-view-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={full ? `Limit of ${MAX_SAVED} reached` : "Name this view"}
              disabled={full}
              maxLength={60}
              className="h-9 min-w-0 flex-1 rounded-md bg-mist-50 px-2.5 text-[14px] ring-1 ring-inset ring-mist-300 focus:outline-none focus:ring-2 focus:ring-ocean-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!name.trim() || full}
              className="h-9 rounded-md bg-ocean-600 px-3 text-[13px] font-semibold text-white hover:bg-ocean-700 disabled:opacity-40"
            >
              Save
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
