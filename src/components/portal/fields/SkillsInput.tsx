"use client";

import { useState } from "react";
import { COMMON_SKILLS } from "@/components/admin/theme";
import { APPLICATION_SKILLS_MAX, APPLICATION_SKILL_CHARS } from "@/lib/application-input";
import Icon from "../icons";

/** Server limits on a candidate's skills. */
export const SKILLS_MAX = APPLICATION_SKILLS_MAX;
export const SKILL_MAX_CHARS = APPLICATION_SKILL_CHARS;

/**
 * Skills as chips: Enter or comma adds, a pasted "react, aws" becomes two,
 * Backspace on an empty field removes the last. Case-insensitive de-dupe.
 */
export function SkillsInput({
  id,
  value,
  onChange,
  suggestions = COMMON_SKILLS,
  max = SKILLS_MAX,
  placeholder = "Type a skill and press Enter",
}: {
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  suggestions?: readonly string[];
  max?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const full = value.length >= max;

  const add = (raw: string) => {
    const parts = raw.split(",").map((s) => s.trim().slice(0, SKILL_MAX_CHARS)).filter(Boolean);
    if (!parts.length) return;
    const next = [...value];
    for (const p of parts) {
      if (next.length >= max) break;
      if (!next.some((t) => t.toLowerCase() === p.toLowerCase())) next.push(p);
    }
    onChange(next);
    setDraft("");
  };

  const unused = suggestions.filter((s) => !value.some((t) => t.toLowerCase() === s.toLowerCase()));

  return (
    <div className="grid gap-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg bg-mist-0 px-2 py-1.5 ring-1 ring-inset ring-mist-300 focus-within:ring-2 focus-within:ring-ocean-600">
        {value.map((t) => (
          <span key={t} className="inline-flex max-w-full items-center gap-1 rounded-md bg-ocean-50 py-0.5 pl-2 pr-0.5 text-[13px] font-medium text-ocean-800">
            <span className="truncate">{t}</span>
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x !== t))}
              aria-label={`Remove ${t}`}
              className="grid size-6 shrink-0 place-items-center rounded hover:bg-ocean-100"
            >
              <Icon name="x" className="size-3.5" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={draft}
          disabled={full}
          maxLength={SKILL_MAX_CHARS}
          placeholder={full ? `${max} is the limit` : value.length ? "Add another" : placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) {
              onChange(value.slice(0, -1));
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
          className="h-7 min-w-[8rem] flex-1 bg-transparent px-1 text-[14px] text-navy-900 outline-none placeholder:text-mist-400 disabled:cursor-not-allowed"
        />
      </div>
      {unused.length > 0 && !full && (
        <div className="flex flex-wrap gap-1.5" aria-label="Suggested skills">
          {unused.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="min-h-7 rounded-md border border-dashed border-mist-300 px-2 text-[12px] font-medium text-mist-600 hover:border-ocean-400 hover:text-ocean-700"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
