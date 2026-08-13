"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Free-text chip input: type, press Enter or comma, get a chip.
 *
 * `AssigneePicker` next door solves the other half of this problem, picking
 * from a known set of people. This one is for values nobody can enumerate in
 * advance (tags, service lines), where a <select> would mean maintaining a list
 * that is always one entry behind whatever is being written today.
 *
 * Paste is handled deliberately: "react, typescript, aws" pasted in one go
 * becomes three chips rather than one long tag, because that is how the value
 * arrives when it is copied out of a brief.
 */
export function TagInput({
  id,
  value,
  onChange,
  placeholder = "Type and press Enter",
  suggestions = [],
  max = 12,
  className,
}: {
  id?: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  /** Offered as one-click chips below the field while they remain unused. */
  suggestions?: string[];
  max?: number;
  className?: string;
}) {
  const [draft, setDraft] = React.useState("");
  const atLimit = value.length >= max;

  const add = (raw: string) => {
    const parts = raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...value];
    for (const part of parts) {
      // Case-insensitive de-dupe: "AWS" and "aws" are one tag, and two of them
      // in a filter list is a bug the reader has to work around.
      if (next.length >= max) break;
      if (next.some((t) => t.toLowerCase() === part.toLowerCase())) continue;
      next.push(part);
    }
    onChange(next);
    setDraft("");
  };

  const remove = (tag: string) => onChange(value.filter((t) => t !== tag));

  const unused = suggestions.filter(
    (s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className={className}>
      <div
        className={cn(
          "flex min-h-10 flex-wrap items-center gap-1.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-2 py-1.5 transition-colors",
          "shadow-[inset_0_1px_2px_rgba(16,24,40,0.03)] focus-within:border-[var(--adm-accent)] focus-within:ring-2 focus-within:ring-[var(--adm-focus-ring)]",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-[6px] bg-[var(--adm-accent-soft)] py-0.5 pl-2 pr-1 text-[12.5px] font-medium text-[var(--adm-accent)]"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              aria-label={`Remove ${tag}`}
              className="rounded-[4px] p-0.5 transition-colors hover:bg-[var(--adm-accent)]/15"
            >
              <X className="h-3 w-3" aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={draft}
          disabled={atLimit}
          placeholder={atLimit ? `${max} is the limit` : value.length === 0 ? placeholder : ""}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              // Backspace on an empty field removes the last chip, the
              // behaviour every chip input has, and the one people reach for
              // before the little × .
              remove(value[value.length - 1]);
            }
          }}
          onBlur={() => add(draft)}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            if (text.includes(",")) {
              e.preventDefault();
              add(text);
            }
          }}
          className="min-w-[8rem] flex-1 bg-transparent px-1 py-0.5 text-[14px] text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)] disabled:cursor-not-allowed"
        />
      </div>

      {unused.length > 0 && !atLimit && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-[6px] border border-dashed border-[var(--adm-line-strong)] px-2 py-0.5 text-[12px] font-medium text-[var(--adm-ink-subtle)] transition-colors hover:border-[var(--adm-accent)] hover:text-[var(--adm-accent)]"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
