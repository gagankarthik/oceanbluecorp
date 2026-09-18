"use client";

import { Check, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { WorkspaceButton } from "@/components/admin/workspace";
import { IconError, IconPipeline } from "@/components/admin/icons";
import { PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

/* The full six-stage stepper, in the Pipeline tab. The pinned record bar holds
   the compact control that does the same job from anywhere on the record. */

export function StageRail({
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
  const history = candidate.statusHistory || [];
  const rejectedEntry = isRejected
    ? [...history].reverse().find((h) => h.status === "rejected")
    : undefined;

  return (
    <AdminCard className="overflow-hidden">
      <AdminCardHeader
        icon={IconPipeline}
        title="Hiring pipeline"
        subtitle={saving ? undefined : "Click a stage to move this candidate"}
        action={
          <div className="flex flex-none items-center gap-3">
            {saving && (
              <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[var(--adm-ink-mute)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> Saving…
              </span>
            )}
            <WorkspaceButton
              variant="ghost"
              onClick={() => onStage("rejected")}
              disabled={saving || isRejected}
              className={cn(
                "h-8 px-2.5 text-[13px]",
                isRejected
                  ? "text-[var(--adm-danger-ink)] disabled:opacity-100"
                  : "hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger-ink)]",
              )}
            >
              <IconError aria-hidden="true" />
              {isRejected ? "Rejected" : "Reject"}
            </WorkspaceButton>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <div className="min-w-[560px] px-4 pb-4 pt-5">
          <div className="relative">
            {/* Track runs between the first and last node centres; the fill advances to the current stage. */}
            <div
              className="absolute top-[13px] h-[2px] rounded-full bg-[var(--adm-line)]"
              style={{
                left: `${50 / PIPELINE_STAGES.length}%`,
                right: `${50 / PIPELINE_STAGES.length}%`,
              }}
            >
              <div
                className="h-full rounded-full bg-[var(--adm-accent)] transition-[width] duration-300"
                style={{
                  width:
                    isRejected || currentIdx <= 0
                      ? "0%"
                      : `${(currentIdx / (PIPELINE_STAGES.length - 1)) * 100}%`,
                }}
              />
            </div>

            <div className="relative flex">
              {PIPELINE_STAGES.map((stage, i) => {
                const isActive = !isRejected && stage.key === candidate.status;
                const isPast = !isRejected && currentIdx > i;
                return (
                  <button
                    key={stage.key}
                    type="button"
                    onClick={() => onStage(stage.key)}
                    disabled={saving || isActive}
                    aria-pressed={isActive}
                    title={isActive ? stage.label : `Move to ${stage.label}`}
                    className="group flex flex-1 flex-col items-center gap-2 rounded-[8px] disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "grid h-7 w-7 place-items-center rounded-full border-2 text-[12px] font-semibold tabular-nums transition-[background-color,border-color,color,box-shadow] duration-150",
                        isActive
                          ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                          : isPast
                            ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white group-hover:shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                            : cn(
                                "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)]",
                                !saving && "group-hover:border-[var(--adm-accent)] group-hover:text-[var(--adm-accent)]",
                              ),
                        isRejected && "opacity-60 group-hover:opacity-100",
                      )}
                    >
                      {isPast ? <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" /> : i + 1}
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-[12.5px] font-medium leading-none transition-colors",
                          isActive
                            ? "text-[var(--adm-ink)]"
                            : isPast
                              ? "text-[var(--adm-ink-mute)]"
                              : "text-[var(--adm-ink-subtle)] group-hover:text-[var(--adm-accent)]",
                        )}
                      >
                        {stage.label}
                      </span>
                      {isActive && daysInStage !== null && (
                        <span className="text-[12px] tabular-nums text-[var(--adm-ink-subtle)]">
                          {daysInStage === 0 ? "moved today" : `${daysInStage}d in stage`}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {isRejected && (
        <div className="px-4 pb-4">
          <p className="rounded-[10px] bg-[var(--adm-danger-soft)] px-3 py-2.5 text-[13px] text-[var(--adm-danger-ink)]">
            This candidate was rejected
            {rejectedEntry ? ` on ${fmtDate(rejectedEntry.changedAt)}` : ""}
            {rejectedEntry?.changedByName ? ` by ${rejectedEntry.changedByName}` : ""}. Click any
            stage to reopen them.
          </p>
        </div>
      )}
    </AdminCard>
  );
}
