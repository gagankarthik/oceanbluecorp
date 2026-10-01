"use client";

import { ArrowRight, Check, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconError } from "@/components/admin/icons";
import { PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";

/* The pipeline as one segmented row in the pinned record header: where the
   candidate is, and the one button that moves them on. Any segment is a jump. */

export function StageTrack({
  candidate,
  saving,
  daysInStage,
  onStage,
}: {
  candidate: Application;
  saving: boolean;
  daysInStage: number | null;
  onStage: (s: AppStatus) => void;
}) {
  const isRejected = candidate.status === "rejected";
  const currentIdx = PIPELINE_STAGES.findIndex((s) => s.key === candidate.status);
  const next = !isRejected && currentIdx >= 0 ? PIPELINE_STAGES[currentIdx + 1] : undefined;

  return (
    <div className="mt-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
      <div className="adm-scroll-hidden min-w-0 flex-1 overflow-x-auto">
        <ol aria-label="Hiring pipeline" className="flex min-w-[540px]">
          {PIPELINE_STAGES.map((stage, i) => {
            const isActive = !isRejected && i === currentIdx;
            const isPast = !isRejected && currentIdx > i;
            return (
              <li key={stage.key} className="-ml-px flex-1 first:ml-0">
                <button
                  type="button"
                  onClick={() => onStage(stage.key)}
                  disabled={saving || isActive}
                  aria-current={isActive ? "step" : undefined}
                  title={isActive ? stage.label : `Move to ${stage.label}`}
                  className={cn(
                    "relative flex h-8 w-full items-center justify-center gap-1.5 border px-2 text-[12.5px] font-medium transition-colors duration-150 disabled:cursor-default",
                    i === 0 && "rounded-l-[6px]",
                    i === PIPELINE_STAGES.length - 1 && "rounded-r-[6px]",
                    isActive
                      ? "z-10 border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white"
                      : isPast
                        ? "border-[var(--adm-line)] bg-[var(--adm-accent-soft)] text-[var(--adm-accent)] hover:bg-[var(--adm-accent-tint)]"
                        : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-mute)] hover:bg-[var(--adm-row-hover)] hover:text-[var(--adm-ink)]",
                  )}
                >
                  {isPast && <Check className="h-3.5 w-3.5 flex-none" strokeWidth={2.5} aria-hidden="true" />}
                  <span className="truncate">{stage.label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="flex flex-none flex-wrap items-center gap-2">
        {isRejected ? (
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[var(--adm-danger-soft)] px-2.5 text-[12.5px] font-medium text-[var(--adm-danger-ink)]">
            <IconError className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
            Rejected, pick a stage to reopen
          </span>
        ) : (
          <>
            {daysInStage !== null && (
              <span className="text-[12.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                {daysInStage === 0 ? "Moved today" : `${daysInStage}d in stage`}
              </span>
            )}
            <WorkspaceButton
              size="sm"
              variant="ghost"
              onClick={() => onStage("rejected")}
              disabled={saving}
              className="hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]"
            >
              <IconError aria-hidden="true" />Reject
            </WorkspaceButton>
            {/* The record's one filled action. */}
            {next && (
              <WorkspaceButton size="sm" variant="primary" onClick={() => onStage(next.key)} disabled={saving}>
                {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                Move to {next.label}
                <ArrowRight aria-hidden="true" />
              </WorkspaceButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}
