"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Calendar, MoreHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { tones, PIPELINE_STAGES, type AppStatus } from "./theme";
import { Avatar } from "./avatar";
import { StarRating } from "./star-rating";
import { CandidateActionsMenu } from "./candidate-actions-menu";
import type { Application } from "@/lib/aws/dynamodb";

interface PipelineKanbanProps {
  applications: Application[];
  onStatusChange: (id: string, status: AppStatus) => Promise<void> | void;
  onDelete?: (id: string) => void;
  onUpdate?: (app: Application) => void;
  /** Cap items per column before showing "+N more" */
  cap?: number;
  className?: string;
}

export function PipelineKanban({
  applications, onStatusChange, onDelete, onUpdate, cap = 8, className,
}: PipelineKanbanProps) {
  const router = useRouter();
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overStage, setOverStage] = React.useState<AppStatus | null>(null);

  const grouped = React.useMemo(() => {
    const map = new Map<AppStatus, Application[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage.key, []);
    for (const app of applications) {
      const k = (app.status as AppStatus) || "pending";
      if (map.has(k)) map.get(k)!.push(app);
    }
    return map;
  }, [applications]);

  const handleDrop = (stage: AppStatus) => {
    if (!draggingId) return;
    const app = applications.find((a) => a.id === draggingId);
    if (app && app.status !== stage) {
      void onStatusChange(draggingId, stage);
    }
    setDraggingId(null);
    setOverStage(null);
  };

  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3", className)}>
      {PIPELINE_STAGES.map((stage) => {
        const t = tones[stage.tone];
        const items = grouped.get(stage.key) || [];
        const isOver = overStage === stage.key;
        return (
          <div
            key={stage.key}
            onDragOver={(e) => { e.preventDefault(); setOverStage(stage.key); }}
            onDragLeave={() => setOverStage((s) => (s === stage.key ? null : s))}
            onDrop={() => handleDrop(stage.key)}
            className={cn(
              "rounded-xl border bg-slate-50/50 flex flex-col min-h-[160px] transition-colors",
              isOver ? `${t.bg} border-transparent ring-2 ring-offset-1 ring-offset-white ${t.ring}` : "border-slate-200",
            )}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 flex items-center justify-between border-b border-slate-200/70">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn("w-2 h-2 rounded-full flex-shrink-0", t.dot)} />
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider truncate">{stage.label}</p>
              </div>
              <span className={cn("text-[11px] font-bold tabular-nums px-1.5 rounded-md", t.bg, t.text)}>
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[480px]">
              {items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-[11px] text-slate-400 italic">Drop candidates here</p>
                </div>
              ) : (
                items.slice(0, cap).map((app) => (
                  <article
                    key={app.id}
                    draggable
                    onDragStart={() => setDraggingId(app.id)}
                    onDragEnd={() => setDraggingId(null)}
                    onClick={() => router.push(`/admin/candidates/${app.id}`)}
                    className={cn(
                      "group bg-white border border-slate-200 rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:border-blue-300 hover:shadow-sm transition-all",
                      draggingId === app.id && "opacity-50",
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Avatar name={app.name || app.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-semibold text-slate-900 truncate">{app.name || "—"}</p>
                        <p className="text-[10.5px] text-slate-500 truncate">{app.jobTitle || "Unassigned"}</p>
                      </div>
                      <div onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <CandidateActionsMenu candidate={app} onDeleted={onDelete} onUpdated={onUpdate} />
                      </div>
                    </div>
                    {app.rating ? (
                      <div className="mt-2 flex items-center justify-between">
                        <StarRating rating={app.rating} size="sm" />
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {timeAgo(app.appliedAt)}
                        </span>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="flex items-center gap-1 truncate">
                          <Mail className="w-2.5 h-2.5" />{app.email}
                        </span>
                        <span className="flex items-center gap-1 flex-shrink-0">
                          <Calendar className="w-2.5 h-2.5" />
                          {timeAgo(app.appliedAt)}
                        </span>
                      </div>
                    )}
                  </article>
                ))
              )}
              {items.length > cap && (
                <button
                  type="button"
                  className="w-full py-1.5 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors"
                  onClick={() => router.push(`/admin/applications?status=${stage.key}`)}
                >
                  +{items.length - cap} more
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
