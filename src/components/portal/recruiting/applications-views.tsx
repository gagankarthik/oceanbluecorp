"use client";

import { useEffect, useRef, useState } from "react";
import type { Application } from "@/lib/aws/dynamodb";
import Icon, { type IconName } from "@/components/portal/icons";
import { ActionMenu, type MenuEntry } from "@/components/portal/records/Menu";
import { fmtDate } from "@/lib/format";
import { daysInStage, STALE_DAYS, TERMINAL } from "@/lib/pipeline";
import { stageDot } from "./bits";
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
    <span className="flex min-w-0 flex-wrap gap-1 py-1">
      {all.slice(0, max).map((s) => (
        <span key={s} className="max-w-full truncate rounded-md bg-mist-100 px-1.5 py-0.5 text-[11px] font-medium text-mist-700">{s}</span>
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

/** Icon-only segmented switch for DataTable's `viewSwitch` slot; arrow keys move between options. */
export function ViewSwitch<V extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: V;
  onChange: (v: V) => void;
  options: { value: V; label: string; icon: IconName }[];
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const n = (i + step + options.length) % options.length;
    onChange(options[n].value);
    refs.current[n]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex h-10 rounded-lg ring-1 ring-inset ring-mist-300">
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={o.label}
            title={o.label}
            tabIndex={on ? 0 : -1}
            onClick={() => onChange(o.value)}
            onKeyDown={(e) => onKey(e, i)}
            className={`grid size-10 place-items-center transition-colors first:rounded-l-lg last:rounded-r-lg focus-visible:relative focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ocean-600 ${
              on ? "bg-mist-100 text-navy-900" : "text-mist-600 hover:bg-mist-50 hover:text-navy-900"
            }`}
          >
            <Icon name={o.icon} className="size-[18px]" />
          </button>
        );
      })}
    </div>
  );
}

/** Edge fades on a sideways scroller, only on the side that has more. */
function useScrollEdges() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const left = el.scrollLeft > 0;
      const right = el.scrollLeft < el.scrollWidth - el.clientWidth - 1;
      setEdges((e) => (e.left === left && e.right === right ? e : { left, right }));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", measure);
      ro.disconnect();
    };
  }, []);
  const mask = `linear-gradient(to right, ${edges.left ? "transparent" : "#000"}, #000 2rem, #000 calc(100% - 2rem), ${edges.right ? "transparent" : "#000"})`;
  return { ref, style: edges.left || edges.right ? { maskImage: mask, WebkitMaskImage: mask } : undefined };
}

/** Kanban for DataTable's `renderGrid`: drag a card to another lane, or step it forward. */
export function BoardView({
  rows,
  focus,
  onOpen,
  onMove,
  menu,
}: {
  rows: Row[];
  focus: Stage | null;
  onOpen: (a: Row) => void;
  onMove: (a: Row, to: Stage) => void;
  /** The table's row menu, so a card offers the same actions */
  menu?: (a: Row) => MenuEntry[];
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<Stage | null>(null);
  const [shown, setShown] = useState<Partial<Record<Stage, number>>>({});
  const scroller = useScrollEdges();

  const drop = (stage: Stage) => {
    const a = rows.find((r) => r.id === dragId);
    if (a && a.status !== stage) onMove(a, stage);
    setDragId(null);
    setOver(null);
  };

  return (
    // Scrolls sideways inside the panel only; on phones one lane fills the width and snaps.
    <div ref={scroller.ref} style={scroller.style} className="scroll-thin min-w-0 snap-x snap-mandatory overflow-x-auto overflow-y-hidden md:snap-none">
      <div className="flex w-max min-w-full gap-3 p-4">
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
              className={`flex w-[min(15rem,calc(100vw-4rem))] min-w-0 shrink-0 grow snap-start flex-col rounded-lg transition-colors ${isOver ? "bg-ocean-50 ring-2 ring-ocean-600" : "bg-mist-50 ring-1 ring-inset ring-mist-200"}`}
            >
              <header className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-navy-900">
                  <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: stageDot(stage) }} />
                  <span className="truncate">{STAGE_LABEL[stage]}</span>
                </span>
                <span className="text-[12px] font-medium tabular-nums text-mist-600">{items.length}</span>
              </header>
              <ul className="scroll-thin grid max-h-[70dvh] content-start gap-2 overflow-y-auto px-2 pb-2">
                {items.length === 0 && (
                  <li className={`px-1 py-3 text-center text-[12px] ${isOver ? "font-medium text-ocean-700" : "text-mist-500"}`}>{isOver ? "Drop here" : "No candidates"}</li>
                )}
                {items.slice(0, limit).map((a) => {
                  const nxt = nextStage(a.status);
                  const done = TERMINAL.has(a.status);
                  const days = daysInStage(a);
                  const owner = a.ownershipName || (a.ownership ? "" : "Unassigned");
                  const name = a.name || a.email;
                  return (
                    <li
                      key={a.id}
                      draggable
                      onDragStart={() => setDragId(a.id)}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      className={`group relative cursor-grab rounded-md bg-mist-0 p-2.5 ring-1 ring-mist-200 transition-colors hover:ring-mist-300 active:cursor-grabbing ${dragId === a.id ? "opacity-40" : ""}`}
                    >
                      <div className="flex items-start gap-1">
                        {/* Stretched over the card, so a click anywhere opens the drawer */}
                        <button
                          type="button"
                          onClick={() => onOpen(a)}
                          className="min-w-0 flex-1 text-left after:absolute after:inset-0 after:rounded-md focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-ocean-600"
                        >
                          <span className="block truncate text-[13px] font-semibold text-navy-900 group-hover:text-ocean-700" title={name}>{name}</span>
                          <span className="block truncate text-[12px] text-mist-600" title={a.jobTitle || undefined}>{a.jobTitle || "No position"}</span>
                        </button>
                        {menu && (
                          <span className="relative z-10 -mr-1 -mt-1">
                            <ActionMenu
                              label={`Actions for ${name}`}
                              width="w-48"
                              items={menu(a)}
                              trigger={
                                <button
                                  type="button"
                                  aria-label={`Actions for ${name}`}
                                  title="Actions"
                                  onClick={(e) => e.stopPropagation()}
                                  className="grid size-8 place-items-center rounded-md text-mist-500 hover:bg-mist-100 hover:text-navy-900 data-[state=open]:bg-mist-100 data-[state=open]:text-navy-900"
                                >
                                  <Icon name="dotsVertical" className="size-4" />
                                </button>
                              }
                            />
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[12px] text-mist-500">
                        {done ? (
                          <span className="tabular-nums">{fmtDate(a.appliedAt)}</span>
                        ) : (
                          <span className={`shrink-0 tabular-nums ${days >= STALE_DAYS ? "font-medium text-[#b54708]" : ""}`}>{days}d in stage</span>
                        )}
                        {!done && owner && (
                          <>
                            <span aria-hidden>·</span>
                            <span className={`truncate ${a.ownershipName ? "" : "font-medium text-[#b42318]"}`} title={owner}>{owner}</span>
                          </>
                        )}
                      </div>
                      {(!!a.skills?.length || nxt) && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2">
                          <SkillChips skills={a.skills} max={3} />
                          {nxt && (
                            <button
                              type="button"
                              onClick={() => onMove(a, nxt)}
                              title={`Move to ${STAGE_LABEL[nxt]}`}
                              aria-label={`Move ${name} to ${STAGE_LABEL[nxt]}`}
                              className="relative z-10 -mr-1 ml-auto inline-flex min-h-8 shrink-0 items-center gap-0.5 rounded-md px-1.5 text-[12px] font-medium text-mist-600 hover:bg-mist-100 hover:text-ocean-700"
                            >
                              {STAGE_LABEL[nxt]}
                              <Icon name="chevronRight" className="size-3.5" />
                            </button>
                          )}
                        </div>
                      )}
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
