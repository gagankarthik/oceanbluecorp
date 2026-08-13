"use client";

import { Check, Loader2 } from "lucide-react";
import type { Application } from "@/lib/aws/dynamodb";
import { AdminCard, AdminCardHeader } from "@/components/admin/admin-card";
import { IconError, IconPipeline } from "@/components/admin/icons";
import { PIPELINE_STAGES, type AppStatus } from "@/components/admin/theme";
import { cn } from "@/lib/utils";
import { fmtDate } from "@/lib/format";

/* ============================================================
   StageRail, the full six-stage stepper.

   Moved OUT of the top of the record and into the Pipeline tab.
   It previously occupied ~180px of the most valuable space on
   the page, permanently, and duplicated a tab that already
   existed. For a terminal candidate, hired or rejected, every
   node is checked and the control is a receipt, not a control:
   prime real estate spent on a finished process.

   The stage can still be changed from anywhere via the compact
   control in the pinned record bar, so nothing became harder to
   reach; this is now the detailed VIEW of a thing the bar lets
   you DO.
   ============================================================ */

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
        action={
          <div className="flex flex-none items-center gap-3">
            {saving ? (
              <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--adm-accent)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
              </span>
            ) : (
              <span className="hidden text-[12.5px] text-[var(--adm-ink-subtle)] md:inline">
                Click a stage to move this candidate
              </span>
            )}
            <button
              onClick={() => onStage("rejected")}
              disabled={saving || isRejected}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[6px] border px-2.5 py-1.5 text-[12px] font-semibold transition-colors",
                isRejected
                  ? "border-rose-200 bg-[var(--adm-danger-soft)] text-[var(--adm-danger)]"
                  : "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)] hover:border-rose-200 hover:bg-[var(--adm-danger-soft)] hover:text-[var(--adm-danger)] disabled:opacity-60",
              )}
            >
              <IconError className="h-3.5 w-3.5" />
              {isRejected ? "Rejected" : "Reject"}
            </button>
          </div>
        }
      />

      <div className="overflow-x-auto">
        <div className="min-w-[600px] px-6 pb-5 pt-6">
          <div className="relative">
            {/* Track runs between the first and last node centres; the fill
                advances to the current stage. */}
            <div
              className="absolute top-[15px] h-[2px] rounded-full bg-[var(--adm-line)]"
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
                    onClick={() => onStage(stage.key)}
                    disabled={saving || isActive}
                    aria-pressed={isActive}
                    title={isActive ? stage.label : `Move to ${stage.label}`}
                    className="group flex flex-1 flex-col items-center gap-2 disabled:cursor-default"
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-full border-2 text-[12.5px] font-bold tabular-nums transition-all duration-150",
                        isActive
                          ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                          : isPast
                            ? "border-[var(--adm-accent)] bg-[var(--adm-accent)] text-white group-hover:shadow-[0_0_0_4px_var(--adm-accent-soft)]"
                            : cn(
                                "border-[var(--adm-line)] bg-[var(--adm-surface)] text-[var(--adm-ink-subtle)]",
                                !saving &&
                                  "group-hover:border-[var(--adm-accent)] group-hover:text-[var(--adm-accent)]",
                              ),
                        isRejected && "opacity-55 group-hover:opacity-100",
                      )}
                    >
                      {isPast ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="flex flex-col items-center gap-0.5">
                      <span
                        className={cn(
                          "text-[12px] font-semibold leading-none transition-colors",
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
                        <span className="text-[10.5px] tabular-nums text-[var(--adm-ink-subtle)]">
                          {daysInStage === 0 ? "moved today" : `${daysInStage}d in stage`}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {isRejected && (
            <p className="mt-5 rounded-[6px] border border-rose-200 bg-[var(--adm-danger-soft)] px-3 py-2 text-[12.5px] font-medium text-[var(--adm-danger)]">
              This candidate was rejected
              {rejectedEntry ? ` on ${fmtDate(rejectedEntry.changedAt)}` : ""}
              {rejectedEntry?.changedByName ? ` by ${rejectedEntry.changedByName}` : ""}. Click any
              stage to reopen them.
            </p>
          )}
        </div>
      </div>
    </AdminCard>
  );
}
