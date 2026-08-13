"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tabs.
 *
 * Implements the WAI-ARIA tabs pattern rather than a row of styled buttons:
 * arrow keys move between tabs, Home and End jump to the ends, and only the
 * active tab is in the tab order, so a keyboard user tabs past the whole set
 * in one press instead of stepping through every one.
 *
 * The active tab is marked by an underline the width of its label, not a
 * filled pill. On a page that already uses pills for buttons, a pill here
 * would read as another button rather than as position.
 */

export type TabItem = {
  id: string;
  label: string;
  /** Optional trailing count, e.g. a result total. */
  badge?: string | number;
  content: React.ReactNode;
};

export function Tabs({
  items,
  defaultId,
  className,
  onChange,
}: {
  items: TabItem[];
  defaultId?: string;
  className?: string;
  onChange?: (id: string) => void;
}) {
  const [active, setActive] = React.useState(defaultId ?? items[0]?.id);
  const refs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const baseId = React.useId();

  const select = (id: string) => {
    setActive(id);
    onChange?.(id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = items.findIndex((t) => t.id === active);
    if (i === -1) return;
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else return;
    e.preventDefault();
    const id = items[next].id;
    select(id);
    // Move focus with selection, which is what the pattern expects when the
    // panel updates on arrow rather than on Enter.
    refs.current[id]?.focus();
  };

  const activeItem = items.find((t) => t.id === active);

  return (
    <div className={className}>
      <div
        role="tablist"
        onKeyDown={onKeyDown}
        className="flex flex-wrap gap-x-7 border-b border-[var(--hz-line)]"
      >
        {items.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => { refs.current[t.id] = el; }}
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(t.id)}
              className={cn(
                "-mb-px inline-flex items-center gap-2 border-b-2 pb-3 pt-1 text-small font-semibold",
                "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hz-cobalt)] focus-visible:ring-offset-2",
                selected
                  ? "border-[var(--hz-cobalt)] text-[var(--hz-text)]"
                  : "border-transparent text-[var(--hz-text-mute)] hover:text-[var(--hz-text)]"
              )}
            >
              {t.label}
              {t.badge !== undefined && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-micro font-semibold tabular-nums",
                    selected
                      ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"
                      : "bg-[var(--hz-surface-2)] text-[var(--hz-text-subtle)]"
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeItem && (
        <div
          role="tabpanel"
          id={`${baseId}-panel-${activeItem.id}`}
          aria-labelledby={`${baseId}-tab-${activeItem.id}`}
          tabIndex={0}
          className="pt-7 focus-visible:outline-none"
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
