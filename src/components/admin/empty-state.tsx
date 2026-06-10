import type { LucideIcon } from "lucide-react";
import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

/**
 * Canonical empty state — replaces the per-page hand-rolled
 * "icon well + message" blocks. Always say what the section is for
 * and, when the viewer can act, offer the action.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  tone = "slate",
  action,
  size = "md",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  tone?: Tone;
  /** Usually a small ui/Button (or PageHeaderButton) creating the missing thing. */
  action?: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
}) {
  const t = tones[tone];
  const sm = size === "sm";
  return (
    <div className={cn("flex flex-col items-center text-center", sm ? "px-4 py-8" : "px-5 py-12", className)}>
      <span className={cn("grid place-items-center rounded-2xl", t.bg, sm ? "h-10 w-10" : "h-12 w-12")}>
        <Icon className={cn(t.text, sm ? "h-5 w-5" : "h-6 w-6")} strokeWidth={1.5} />
      </span>
      <p className={cn("mt-3 font-medium text-slate-600", sm ? "text-xs" : "text-sm")}>{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-slate-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
