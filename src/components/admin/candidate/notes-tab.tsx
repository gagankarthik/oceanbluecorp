"use client";

import { Loader2, Plus } from "lucide-react";
import type { NoteEntry } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { Avatar } from "@/components/admin/avatar";
import { EmptyState } from "@/components/admin/empty-state";
import { WorkspaceButton } from "@/components/admin/workspace";
import { Kbd } from "@/components/admin/kbd";
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
        <div className="flex items-center gap-2 border-b border-[var(--adm-line-soft)] px-4 py-2.5">
          <Avatar name={authorName} size="xs" />
          <span className="text-[13.5px] font-medium text-[var(--adm-ink)]">{authorName}</span>
          <span className="text-[12.5px] text-[var(--adm-ink-subtle)]">adding a note</span>
        </div>
        <div className="p-4">
          <textarea
            rows={3}
            value={value}
            autoComplete="off"
            aria-label="New note"
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
            }}
            placeholder="Interview feedback, next steps, anything the team should know…"
            className="w-full resize-none border-0 bg-transparent p-0 text-[14px] leading-relaxed text-[var(--adm-ink)] outline-none placeholder:text-[var(--adm-ink-subtle)]"
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--adm-line-soft)] pt-3">
            <p className="text-[12.5px] text-[var(--adm-ink-subtle)]">
              {value.length > 0 ? (
                <span className="tabular-nums">{value.length} characters</span>
              ) : (
                <>
                  <Kbd>⌘</Kbd> <Kbd>↵</Kbd> to save · visible to your team
                </>
              )}
            </p>
            {/* Secondary: the record's filled action is "Edit profile" in the pinned header. */}
            <WorkspaceButton onClick={onSubmit} disabled={!value.trim() || saving}>
              {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Plus aria-hidden="true" />}
              Post note
            </WorkspaceButton>
          </div>
        </div>
      </AdminCard>

      {notes.length > 0 ? (
        <AdminCard className="overflow-hidden">
          <AdminCardHeader icon={IconMessageText} title="Team notes" count={notes.length} />
          <ol className="divide-y divide-[var(--adm-line-soft)]">
            {[...notes].reverse().map((note) => (
              <li key={note.id} className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <Avatar name={note.addedByName} size="xs" />
                  <span className="min-w-0 truncate text-[13.5px] font-medium text-[var(--adm-ink)]">
                    {note.addedByName}
                  </span>
                  <span className="ml-auto flex-none text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                    {fmtDateTime(note.addedAt)}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line pl-[34px] text-[14px] leading-relaxed text-[var(--adm-ink-mute)]">
                  {note.text}
                </p>
              </li>
            ))}
          </ol>
        </AdminCard>
      ) : (
        <AdminCard>
          <EmptyState
            size="sm"
            icon={IconMessageText}
            title="No notes yet"
            description="Notes you post above are shared with everyone working this candidate."
          />
        </AdminCard>
      )}
    </div>
  );
}
