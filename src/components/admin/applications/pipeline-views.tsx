"use client";

import React, { useMemo } from "react";
import { X, Plus, MoreHorizontal } from "lucide-react";
import { IconEye, IconTrash, IconEdit, IconGroup } from "@/components/admin/icons";
import type { Application } from "@/lib/aws/dynamodb";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { WorkspaceButton } from "@/components/admin/workspace";
import { StatusBadge } from "@/components/admin/status-badge";
import { Avatar } from "@/components/admin/avatar";
import { StarRating } from "@/components/admin/star-rating";
import { EmptyState } from "@/components/admin/empty-state";
import { fmtDate } from "@/lib/format";
import { KANBAN_COLS, stageColor, sLabel, locationOf, type ApplicationRow } from "./stages";

export interface RowActions {
  onView: (id: string) => void;
  onEdit: (app: ApplicationRow) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
  onRating: (id: string, r: number) => void;
}
export interface SharedProps extends RowActions {
  apps: ApplicationRow[];
}

const menuCls =
  "w-48 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-1 shadow-[var(--adm-shadow-pop)]";
const menuItemCls = "cursor-pointer rounded-[6px] px-2 py-1.5 text-[13px]";

/** View / edit / move / delete, shared by the grid, the board and the list. */
export function RowActionsMenu({ app, onView, onEdit, onDelete, onStatusChange, className }: {
  app: ApplicationRow;
  onView: (id: string) => void;
  onEdit: (app: ApplicationRow) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, s: Application["status"]) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title="Actions"
          aria-label={`Actions for ${app.name || app.email}`}
          className={cn(
            "grid h-9 w-9 flex-none place-items-center rounded-[8px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)] data-[state=open]:bg-[var(--adm-surface-2)] data-[state=open]:text-[var(--adm-ink)]",
            className,
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={4} className={menuCls}>
        <DropdownMenuItem onClick={() => onView(app.id)} className={menuItemCls}>
          <IconEye className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />View profile
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onEdit(app)} className={menuItemCls}>
          <IconEdit className="mr-2 h-4 w-4 text-[var(--adm-ink-subtle)]" />Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
        <div className="px-1 py-1">
          <p className="px-1 pb-1 text-[12px] font-medium text-[var(--adm-ink-subtle)]">Move to</p>
          {KANBAN_COLS.filter((c) => c !== app.status).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onStatusChange(app.id, c as Application["status"])}
              className="flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]"
            >
              <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: stageColor(c) }} />
              {sLabel(c)}
            </button>
          ))}
        </div>
        <DropdownMenuSeparator className="my-1 bg-[var(--adm-line-soft)]" />
        <DropdownMenuItem
          onClick={() => onDelete(app.id)}
          className={cn(menuItemCls, "text-[var(--adm-danger-ink)] focus:bg-[var(--adm-danger-soft)] focus:text-[var(--adm-danger-ink)]")}
        >
          <IconTrash className="mr-2 h-4 w-4" />Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Neutral skill chips; the accent stays reserved for actions and selection. */
function SkillChips({ skills, max }: { skills?: string[]; max: number }) {
  const all = skills || [];
  if (all.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {all.slice(0, max).map((s) => (
        <span key={s} className="rounded-[6px] bg-[var(--adm-surface-2)] px-1.5 py-0.5 text-[11.5px] font-medium text-[var(--adm-ink-mute)]">
          {s}
        </span>
      ))}
      {all.length > max && (
        <span className="px-1 py-0.5 text-[11.5px] font-medium tabular-nums text-[var(--adm-ink-subtle)]">
          +{all.length - max}
        </span>
      )}
    </div>
  );
}

//** Cards rendered per column (and rows in the list) before "Show more". */
const PAGE = 50;

function ShowMore({ hidden, onClick, className }: { hidden: number; onClick: () => void; className?: string }) {
  if (hidden <= 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[8px] px-2 py-1.5 text-[12.5px] font-medium text-[var(--adm-ink-mute)] transition-colors hover:bg-[var(--adm-surface)] hover:text-[var(--adm-ink)]",
        className,
      )}
    >
      Show {Math.min(hidden, PAGE)} more{hidden > PAGE ? ` of ${hidden}` : ""}
    </button>
  );
}

// ── kanban ───────────────────────────────────────────────────────────────────

// Handlers must be stable (useCallback in the parent): cards are memoised, so a
// drag re-renders only the card whose isDragging flips.
export function KanbanView({ apps, onView, onEdit, onDelete, onStatusChange, onRating }: SharedProps) {
  const [dragId, setDragId]     = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<string | null>(null);
  const [shown, setShown]       = React.useState<Record<string, number>>({});

  const grouped = useMemo(
    () => Object.fromEntries(KANBAN_COLS.map((k) => [k, apps.filter((a) => a.status === k)])),
    [apps],
  );

  const onDragStart = React.useCallback((id: string) => setDragId(id), []);
  const onDragEnd = React.useCallback(() => { setDragId(null); setDragOver(null); }, []);

  const handleDrop = (col: string) => {
    if (dragId && dragId !== col) {
      const app = apps.find((a) => a.id === dragId);
      if (app && app.status !== col) onStatusChange(dragId, col as Application["status"]);
    }
    setDragId(null);
    setDragOver(null);
  };

  return (
    <div className="flex min-h-full min-w-max gap-3">
      {KANBAN_COLS.map((col) => {
        const list = grouped[col] || [];
        const limit = shown[col] ?? PAGE;
        const isOver = dragOver === col;
        return (
          <section
            key={col}
            aria-label={`${sLabel(col)}, ${list.length}`}
            className={cn(
              "flex w-64 flex-col rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] transition-colors",
              isOver && "border-[var(--adm-accent)] bg-[var(--adm-accent-tint)]",
            )}
            onDragOver={(e) => { e.preventDefault(); if (dragOver !== col) setDragOver(col); }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null); }}
            onDrop={() => handleDrop(col)}
          >
            <header className="flex items-center gap-2 px-3 pb-2 pt-3">
              <span aria-hidden className="h-2 w-2 flex-none rounded-full" style={{ background: stageColor(col) }} />
              <h3 className="text-[13px] font-semibold text-[var(--adm-ink)]">{sLabel(col)}</h3>
              <span className="ml-auto text-[12.5px] font-medium tabular-nums text-[var(--adm-ink-subtle)]">
                {list.length}
              </span>
            </header>

            <div className="flex-1 space-y-2 px-2 pb-2">
              {list.length === 0 ? (
                <div className={cn(
                  "grid h-20 place-items-center rounded-[10px] border border-dashed text-[12.5px] transition-colors",
                  isOver
                    ? "border-[var(--adm-accent)] font-medium text-[var(--adm-accent)]"
                    : "border-[var(--adm-line-strong)] text-[var(--adm-ink-subtle)]",
                )}>
                  {isOver ? "Drop here" : "No candidates"}
                </div>
              ) : list.slice(0, limit).map((app) => (
                <KanbanCard
                  key={app.id}
                  app={app}
                  isDragging={dragId === app.id}
                  onDragStart={onDragStart}
                  onDragEnd={onDragEnd}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onStatusChange={onStatusChange}
                  onRating={onRating}
                />
              ))}
              <ShowMore
                hidden={list.length - limit}
                onClick={() => setShown((s) => ({ ...s, [col]: limit + PAGE }))}
              />
              {list.length > 0 && isOver && (
                <div className="grid h-14 place-items-center rounded-[10px] border border-dashed border-[var(--adm-accent)] text-[12.5px] font-medium text-[var(--adm-accent)]">
                  Drop here
                </div>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const KanbanCard = React.memo(function KanbanCard({ app, onView, onEdit, onDelete, onStatusChange, onRating, isDragging, onDragStart, onDragEnd }: RowActions & {
  app: ApplicationRow;
  isDragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(app.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab select-none rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3 shadow-[var(--adm-shadow-sm)] transition-[border-color,box-shadow,opacity] duration-150 hover:border-[var(--adm-line-strong)] hover:shadow-[var(--adm-shadow-md)] active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar name={app.name} email={app.email} size="sm" />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => onView(app.id)}
            className="block w-full truncate text-left text-[13.5px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
          >
            {app.name || app.email}
          </button>
          {app.jobTitle && <p className="mt-0.5 truncate text-[12.5px] text-[var(--adm-ink-subtle)]">{app.jobTitle}</p>}
        </div>
        <RowActionsMenu
          app={app}
          onView={onView}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          className="-mr-1.5 -mt-1.5 lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100 lg:data-[state=open]:opacity-100"
        />
      </div>

      {(app.skills || []).length > 0 && (
        <div className="mt-2.5">
          <SkillChips skills={app.skills} max={3} />
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-[var(--adm-line-soft)] pt-2.5">
        <StarRating rating={app.rating || 0} onRate={(r) => onRating(app.id, r === app.rating ? 0 : r)} />
        <span className="text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">
          {new Date(app.appliedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </div>
  );
});

// ── list ─────────────────────────────────────────────────────────────────────

export function ListView({ apps, empty, onAdd, onClear, ...shared }: SharedProps & {
  empty: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  const [limit, setLimit] = React.useState(PAGE);

  if (apps.length === 0) {
    return empty ? (
      <EmptyState
        icon={IconGroup}
        title="No applicants yet"
        description="Add your first candidate to start tracking the pipeline."
        action={<WorkspaceButton variant="primary" onClick={onAdd}><Plus />Add applicant</WorkspaceButton>}
      />
    ) : (
      <EmptyState
        variant="filtered"
        title="No matching applicants"
        description="Try a different search, or clear the filters."
        action={<WorkspaceButton onClick={onClear}><X />Clear filters</WorkspaceButton>}
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-[var(--adm-line-soft)]">
        {apps.slice(0, limit).map((app) => (
          <ListRow
            key={app.id}
            app={app}
            onView={shared.onView}
            onEdit={shared.onEdit}
            onDelete={shared.onDelete}
            onStatusChange={shared.onStatusChange}
            onRating={shared.onRating}
          />
        ))}
      </ul>
      <ShowMore
        hidden={apps.length - limit}
        onClick={() => setLimit((n) => n + PAGE)}
        className="my-2 hover:bg-[var(--adm-surface-2)]"
      />
    </>
  );
}

const ListRow = React.memo(function ListRow({ app, ...shared }: RowActions & { app: ApplicationRow }) {
  const meta = [app.workAuthorization, app.hireType].filter(Boolean).join(" · ");
  const loc = locationOf(app);
  return (
    <li className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--adm-row-hover)] sm:gap-4 lg:px-5">
      <Avatar name={app.name} email={app.email} size="md" />

      <div className="grid min-w-0 flex-1 gap-x-4 gap-y-2 sm:grid-cols-3">
        <div className="min-w-0">
          <button
            type="button"
            onClick={() => shared.onView(app.id)}
            className="block max-w-full truncate text-left text-[14px] font-semibold text-[var(--adm-ink)] transition-colors hover:text-[var(--adm-accent)]"
          >
            {app.name || app.email}
          </button>
          <p className="truncate text-[13px] text-[var(--adm-ink-subtle)]">{app.email}</p>
          {(app.skills || []).length > 0 && (
            <div className="mt-2">
              <SkillChips skills={app.skills} max={4} />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-0.5 text-[13px] text-[var(--adm-ink-subtle)]">
          <p className="truncate text-[13.5px] text-[var(--adm-ink-mute)]">
            {app.jobTitle || <span className="text-[var(--adm-ink-subtle)]">No position</span>}
          </p>
          {loc && <p className="truncate">{loc}</p>}
          {app.source && <p className="truncate">{app.source}</p>}
          {meta && <p className="truncate">{meta}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end sm:gap-1.5">
          <StatusBadge status={app.status} />
          <StarRating rating={app.rating || 0} onRate={(r) => shared.onRating(app.id, r === app.rating ? 0 : r)} />
          <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">{fmtDate(app.appliedAt)}</span>
          {app.addToTalentBench && <StatusBadge tone="emerald" label="Bench" />}
        </div>
      </div>

      <RowActionsMenu
        app={app}
        onView={shared.onView}
        onEdit={shared.onEdit}
        onDelete={shared.onDelete}
        onStatusChange={shared.onStatusChange}
        className="lg:opacity-0 lg:focus-visible:opacity-100 lg:group-hover:opacity-100 lg:data-[state=open]:opacity-100"
      />
    </li>
  );
});
