"use client";

import { Loader2, Plus } from "lucide-react";
import type { NoteEntry } from "@/lib/aws/dynamodb";
import { AdminCard } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { IconMessageText } from "@/components/admin/icons";
import { fmtDateTime } from "@/lib/format";

/** Team notes on a candidate: composer first, newest first below it. */
export function NotesTab({
  notes,
  authorName,
  value,
  onChange,
  onSubmit,
  saving,
}: {
  notes: NoteEntry[];
  authorName: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      <AdminCard className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[var(--adm-line)] px-5 py-3">
          <Avatar name={authorName} size="xs" />
          <span className="text-[13.5px] font-semibold text-[var(--adm-ink-mute)]">{authorName}</span>
          <span className="text-[12px] text-[var(--adm-ink-subtle)]">add a note</span>
        </div>
        <div className="px-5 py-4">
          <textarea
            rows={3}
            value={value}
            autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
            placeholder="Interview feedback, next steps, anything the team should know…"
            className="w-full resize-none border-0 bg-transparent p-0 text-[13.5px] leading-relaxed text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
          />
          <div className="mt-3 flex items-center justify-between border-t border-[var(--adm-line-soft)] pt-3">
            <p className="text-[11.5px] text-[var(--adm-ink-subtle)]">
              {value.length > 0 ? `${value.length} characters` : "⌘↵ to save · visible to your team"}
            </p>
            <button
              onClick={onSubmit}
              disabled={!value.trim() || saving}
              className="inline-flex items-center gap-1.5 rounded-[6px] bg-[var(--adm-accent)] px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:bg-[var(--adm-accent-strong)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Post note
            </button>
          </div>
        </div>
      </AdminCard>

      {notes.length > 0 ? (
        <AdminCard className="overflow-hidden">
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {[...notes].reverse().map((note) => (
              <div key={note.id} className="px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <Avatar name={note.addedByName} size="xs" />
                  <span className="text-[12.5px] font-semibold text-[var(--adm-ink-mute)]">
                    {note.addedByName}
                  </span>
                  <span className="ml-auto text-[11.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                    {fmtDateTime(note.addedAt)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-[var(--adm-ink-mute)]">
                  {note.text}
                </p>
              </div>
            ))}
          </div>
        </AdminCard>
      ) : (
        <AdminCard>
          <EmptyState icon={IconMessageText} title="No notes yet" description="Add the first note above." />
        </AdminCard>
      )}
    </div>
  );
}
