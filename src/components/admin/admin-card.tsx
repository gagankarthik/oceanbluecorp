import type { LucideIcon } from "lucide-react";
import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

/**
 * Canonical admin surface — replaces the per-page repeated
 * `rounded-2xl border border-slate-200/80 bg-white shadow-sm` blocks.
 */
export function AdminCard({
  className,
  hover = false,
  children,
}: {
  className?: string;
  hover?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-sm",
        hover &&
          "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Section header for an AdminCard — tinted icon chip + title + optional action slot. */
export function AdminCardHeader({
  icon: Icon,
  title,
  tone = "slate",
  count,
  action,
}: {
  icon?: LucideIcon;
  title: string;
  tone?: Tone;
  count?: number;
  action?: React.ReactNode;
}) {
  const t = tones[tone];
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {Icon && (
          <span className={cn("grid h-7 w-7 place-items-center rounded-lg", t.bg)}>
            <Icon className={cn("h-4 w-4", t.text)} strokeWidth={2} />
          </span>
        )}
        <h3 className="truncate text-sm font-bold text-slate-900">{title}</h3>
        {count !== undefined && count > 0 && (
          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}
