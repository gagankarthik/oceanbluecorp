"use client";

import { useEffect, useRef } from "react";
import type { Contact } from "@/lib/aws/dynamodb";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { IconMessage } from "@/components/admin/icons";
import { toneColor, type Tone } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { fmtRelative } from "@/lib/format";

/* ============================================================
   ContactList — the index pane of the split contacts screen.

   Built in the mail idiom (Jakob's Law: this reads like every
   inbox anyone already uses) rather than as a narrow table:
   one row per enquiry, sender and subject stacked, timestamp
   right-aligned, and an unanswered enquiry set in full-strength
   ink the way an unread message is. That weight difference is
   the only signal the screen needs to answer "what still needs
   me" — the old grid said it with a status chip in the fifth
   column, which you had to go looking for.

   Keyboard: ↑/↓ move the selection, because moving through a
   list is the repeated action here and reaching for the mouse
   every time is the cost that makes people stop triaging.
   ============================================================ */

export function ContactList({
  contacts,
  selectedId,
  onSelect,
  statusMeta,
  emptyTitle,
  emptyDescription,
  emptyAction,
}: {
  contacts: Contact[];
  selectedId?: string;
  onSelect: (c: Contact) => void;
  statusMeta: Record<string, { label: string; tone: Tone } | undefined>;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: React.ReactNode;
}) {
  const listRef = useRef<HTMLUListElement>(null);

  /* ↑/↓ step through the list. Bound to the list rather than the window so it
     cannot fight typing in the search box above it. */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      const i = contacts.findIndex((c) => c.id === selectedId);
      const next = e.key === "ArrowDown"
        ? Math.min(i + 1, contacts.length - 1)
        : Math.max(i - 1, 0);
      if (next >= 0 && contacts[next] && next !== i) {
        e.preventDefault();
        onSelect(contacts[next]);
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [contacts, selectedId, onSelect]);

  /* Keep the selection in view when it moves by keyboard. */
  useEffect(() => {
    if (!selectedId) return;
    listRef.current
      ?.querySelector(`[data-id="${selectedId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  if (contacts.length === 0) {
    return (
      <div className="grid h-full place-items-center p-6">
        <EmptyState icon={IconMessage} title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </div>
    );
  }

  return (
    <ul ref={listRef} tabIndex={-1} className="h-full overflow-y-auto outline-none">
      {contacts.map((c) => {
        const name = `${c.firstName} ${c.lastName}`.trim();
        const selected = c.id === selectedId;
        // "new" is this screen's unread: nobody has replied yet.
        const unanswered = c.status === "new";
        const tone = statusMeta[c.status]?.tone;

        return (
          <li key={c.id} data-id={c.id}>
            <button
              type="button"
              onClick={() => onSelect(c)}
              aria-current={selected}
              className={cn(
                "flex w-full items-start gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 text-left transition-colors",
                selected
                  ? "bg-[var(--adm-accent-soft)]"
                  : "hover:bg-[var(--adm-row-hover)]",
              )}
            >
              {/* A left edge marks the selected row without needing a border on
                  the row itself, which would shift the text by a pixel. */}
              <span
                aria-hidden
                className={cn(
                  "-my-3 -ml-4 mr-1 w-[3px] flex-none self-stretch",
                  selected ? "bg-[var(--adm-accent)]" : "bg-transparent",
                )}
              />
              <Avatar name={name} email={c.email} size="sm" />

              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span
                    className={cn(
                      "truncate text-[13.5px]",
                      unanswered
                        ? "font-bold text-[var(--adm-ink)]"
                        : "font-medium text-[var(--adm-ink-mute)]",
                    )}
                  >
                    {name || c.email}
                  </span>
                  <span className="flex-none whitespace-nowrap text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                    {fmtRelative(c.createdAt)}
                  </span>
                </span>

                <span className="mt-0.5 flex items-center gap-1.5">
                  {tone && (
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 flex-none rounded-full"
                      style={{ background: toneColor[tone] }}
                    />
                  )}
                  <span className={cn(
                    "truncate text-[12.5px]",
                    unanswered ? "font-semibold text-[var(--adm-ink-mute)]" : "text-[var(--adm-ink-subtle)]",
                  )}>
                    {c.inquiryType}
                    {c.company ? ` · ${c.company}` : ""}
                  </span>
                </span>

                {/* One line of the message, the way a mail list previews it. */}
                <span className="mt-1 block truncate text-[12px] text-[var(--adm-ink-subtle)]">
                  {c.message}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
