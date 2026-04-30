import * as React from "react";
import Link from "next/link";
import { ArrowUpRight, TrendingUp, TrendingDown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { tones, type Tone } from "./theme";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: Tone;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  trend?: { direction: "up" | "down" | "flat"; value: string };
  onClick?: () => void;
  className?: string;
}

export function StatCard({
  label, value, hint, tone = "blue", icon: Icon, href, trend, onClick, className,
}: StatCardProps) {
  const t = tones[tone];
  const inner = (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl bg-white border border-slate-200/80 p-4 transition-all",
        (href || onClick) && "hover:border-slate-300 hover:shadow-md cursor-pointer",
        className,
      )}
    >
      {/* Subtle accent stripe */}
      <div className={cn("absolute inset-y-0 left-0 w-1", t.dot)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide uppercase text-slate-500">{label}</p>
          <p className="mt-1.5 text-[26px] font-bold leading-none tracking-tight text-slate-900 tabular-nums">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {hint && <p className="mt-1.5 text-xs text-slate-500 truncate">{hint}</p>}
        </div>
        {Icon && (
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", t.bg)}>
            <Icon className={cn("w-5 h-5", t.text)} />
          </div>
        )}
      </div>
      {(trend || href) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
          {trend ? (
            <div className={cn("inline-flex items-center gap-1 text-xs font-medium",
              trend.direction === "up" ? "text-emerald-600" : trend.direction === "down" ? "text-rose-600" : "text-slate-500"
            )}>
              {trend.direction === "up" && <TrendingUp className="w-3.5 h-3.5" />}
              {trend.direction === "down" && <TrendingDown className="w-3.5 h-3.5" />}
              <span>{trend.value}</span>
            </div>
          ) : <span className="text-[11px] text-slate-400">View details</span>}
          {href && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className="text-left w-full">{inner}</button>;
  return inner;
}
