"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tones, PIPELINE_STAGES, type AppStatus } from "./theme";

interface PipelineStripProps {
  counts: Partial<Record<AppStatus, number>>;
  active?: AppStatus | "all";
  onSelect?: (status: AppStatus | "all") => void;
  showRejected?: boolean;
  rejectedCount?: number;
  className?: string;
}

export function PipelineStrip({
  counts, active = "all", onSelect, showRejected = true, rejectedCount = 0, className,
}: PipelineStripProps) {
  return (
    <div className={cn("bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.04)] p-3 sm:p-4", className)}>
      <div className="flex items-stretch gap-1 sm:gap-2">
        {PIPELINE_STAGES.map((stage, i) => {
          const t = tones[stage.tone];
          const count = counts[stage.key] || 0;
          const isActive = active === stage.key;
          return (
            <React.Fragment key={stage.key}>
              <button
                type="button"
                onClick={() => onSelect?.(isActive ? "all" : stage.key)}
                className={cn(
                  "group flex-1 min-w-0 text-left py-2 px-2 sm:px-3 rounded-lg border transition-all",
                  isActive
                    ? `${t.bg} border-transparent ring-2 ring-offset-1 ring-offset-white ${t.ring}`
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
                    {stage.label}
                  </p>
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", t.dot)} />
                </div>
                <p className={cn("text-xl sm:text-2xl font-bold leading-none mt-1 tabular-nums", t.text)}>{count}</p>
              </button>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="hidden sm:flex items-center px-0.5">
                  <ArrowRight className="w-3 h-3 text-slate-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
        {showRejected && (
          <>
            <div className="hidden sm:block w-px bg-slate-200 mx-1" />
            <button
              type="button"
              onClick={() => onSelect?.(active === "rejected" ? "all" : "rejected")}
              className={cn(
                "min-w-[60px] sm:min-w-[80px] text-left py-2 px-2 sm:px-3 rounded-lg border transition-all",
                active === "rejected"
                  ? "bg-rose-50 border-transparent ring-2 ring-offset-1 ring-offset-white ring-rose-200"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50",
              )}
            >
              <p className="text-[10px] sm:text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Rejected</p>
              <p className="text-xl sm:text-2xl font-bold text-rose-600 leading-none mt-1 tabular-nums">{rejectedCount}</p>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
