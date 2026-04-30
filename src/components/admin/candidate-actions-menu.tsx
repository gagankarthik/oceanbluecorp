"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, Edit3, Trash2, MoreHorizontal, Boxes, Star, Mail } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import type { Application } from "@/lib/aws/dynamodb";
import { useAdmin } from "./admin-provider";
import { cn } from "@/lib/utils";

interface CandidateActionsMenuProps {
  candidate: Application;
  /** Called after delete so the parent can refresh local state */
  onDeleted?: (id: string) => void;
  /** Called after a status / bench / rating mutation so parent can refresh */
  onUpdated?: (app: Application) => void;
  /** Override view-profile destination — defaults to /admin/candidates/[id] */
  viewHref?: string;
  className?: string;
  align?: "start" | "center" | "end";
}

export function CandidateActionsMenu({
  candidate, onDeleted, onUpdated, viewHref, className, align = "end",
}: CandidateActionsMenuProps) {
  const router = useRouter();
  const { openCandidateEditor } = useAdmin();
  const [confirmDelete, setConfirmDelete] = React.useState(false);

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/applications/${candidate.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted?.(candidate.id);
    } catch {
      alert("Failed to delete candidate");
    } finally {
      setConfirmDelete(false);
    }
  };

  const toggleBench = async () => {
    try {
      const res = await fetch(`/api/applications/${candidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ addToTalentBench: !candidate.addToTalentBench }),
      });
      const data = await res.json();
      if (res.ok) onUpdated?.(data.application);
    } catch {
      alert("Failed to update bench status");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors",
              className,
            )}
            aria-label="Candidate actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="bg-white border border-slate-200 shadow-lg rounded-xl w-48 p-1">
          <DropdownMenuLabel className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
            Candidate
          </DropdownMenuLabel>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); router.push(viewHref || `/admin/candidates/${candidate.id}`); }}
            className="text-sm rounded-lg cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" />View profile
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); openCandidateEditor({ candidate }); }}
            className="text-sm rounded-lg cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5 mr-2 text-slate-400" />Edit details
          </DropdownMenuItem>
          {candidate.email && (
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${candidate.email}`; }}
              className="text-sm rounded-lg cursor-pointer"
            >
              <Mail className="h-3.5 w-3.5 mr-2 text-slate-400" />Email candidate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); toggleBench(); }}
            className="text-sm rounded-lg cursor-pointer"
          >
            <Boxes className="h-3.5 w-3.5 mr-2 text-slate-400" />
            {candidate.addToTalentBench ? "Remove from bench" : "Add to bench"}
          </DropdownMenuItem>
          {candidate.applicationId && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(candidate.applicationId!);
              }}
              className="text-sm rounded-lg cursor-pointer"
            >
              <Star className="h-3.5 w-3.5 mr-2 text-slate-400" />
              Copy ID
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            className="text-sm rounded-lg text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 mr-2" />Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {confirmDelete && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-100 mx-auto mb-4">
              <Trash2 className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="text-base font-bold text-slate-900 text-center mb-1">Delete candidate?</h3>
            <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
              <span className="font-semibold">{candidate.name || candidate.email}</span> will be permanently removed.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 px-4 py-2.5 text-sm font-semibold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
