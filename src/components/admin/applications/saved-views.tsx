"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FormInput } from "@/components/admin/forms/primitives";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconBookmark } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

export interface SavedSearch<S> {
  id: string;
  name: string;
  state: S;
  createdAt: string;
}

const MAX_SAVED = 20;

/** Named snapshots of a list's search, filters and view, kept per browser. */
export function SavedViewsMenu<S>({
  items,
  activeId,
  onApply,
  onSave,
  onDelete,
}: {
  items: SavedSearch<S>[];
  activeId?: string | null;
  onApply: (item: SavedSearch<S>) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const trimmed = name.trim();
  const full = items.length >= MAX_SAVED;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trimmed || full) return;
    onSave(trimmed.slice(0, 60));
    setName("");
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="My views"
          className={cn(
            // Same size and edge as Filters, so the toolbar's controls read as one set.
            "inline-flex h-10 flex-none items-center gap-1.5 rounded-[var(--adm-radius-control)] border px-3 text-adm-base font-medium transition-colors sm:px-3",
            activeId
              ? "border-[var(--adm-accent)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)]"
              : "border-[var(--adm-line-control)] bg-[var(--adm-surface)] text-[var(--adm-ink)] hover:bg-[var(--adm-row-hover)]",
            "data-[state=open]:border-[var(--adm-accent)]",
          )}
        >
          <IconBookmark className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="hidden sm:inline">My views</span>
          {items.length > 0 && (
            <span className="tabular-nums text-adm-xs text-[var(--adm-ink-subtle)]">{items.length}</span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={6}
        className="w-[20rem] rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-0 shadow-[var(--adm-shadow-pop)]"
      >
        <div className="border-b border-[var(--adm-line-soft)] px-4 py-3">
          <span className="text-adm-xs font-semibold text-[var(--adm-ink)]">My views</span>
          <p className="mt-0.5 text-adm-xs text-[var(--adm-ink-subtle)]">Search, filters and layout, saved in this browser.</p>
        </div>

        {items.length > 0 ? (
          <ul className="max-h-[min(18rem,50vh)] overflow-y-auto py-1">
            {items.map((item) => (
              <li key={item.id} className="group flex items-center gap-1 pr-2">
                <button
                  type="button"
                  onClick={() => { onApply(item); setOpen(false); }}
                  className={cn(
                    "min-w-0 flex-1 truncate px-4 py-2 text-left text-adm-xs transition-colors hover:bg-[var(--adm-row-hover)]",
                    item.id === activeId ? "font-medium text-[var(--adm-accent)]" : "text-[var(--adm-ink)]",
                  )}
                >
                  {item.name}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`Delete saved view ${item.name}`}
                  title="Delete"
                  className="adm-hit grid h-7 w-7 flex-none place-items-center rounded-[6px] text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-3 text-adm-xs text-[var(--adm-ink-mute)]">No saved views yet.</p>
        )}

        {/* Plain form, not menu items: Radix typeahead would swallow the keystrokes. */}
        <form
          onSubmit={save}
          onKeyDown={(e) => e.stopPropagation()}
          className="flex items-center gap-2 border-t border-[var(--adm-line-soft)] px-3 py-3"
        >
          <FormInput
            aria-label="Name for the current view"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder={full ? `Limit of ${MAX_SAVED} reached` : "Name the current view"}
            disabled={full}
            className="h-8 text-adm-base"
          />
          <WorkspaceButton type="submit" size="sm" disabled={!trimmed || full}>Save</WorkspaceButton>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
