"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react";
import { tones, type Tone } from "./theme";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: Tone;
  /** Optional period-over-period delta chip. */
  delta?: { value: string; direction: "up" | "down" | "flat" };
  hint?: string;
  /** If set, the whole card becomes a link and gains a hover lift. */
  href?: string;
  /** "sm" is a more compact variant for dense list-page headers. */
  size?: "default" | "sm";
  className?: string;
}

/**
 * Premium KPI card for the admin dashboard and list headers.
 * Soft tinted icon chip + large tabular number + label + optional delta.
 */
export function StatCard({ label, value, icon: Icon, tone = "blue", delta, hint, href, size = "default", className }: StatCardProps) {
  const t = tones[tone];
  const sm = size === "sm";
  const body = (
    <div
      className={cn(
        "group relative flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        sm ? "gap-2.5 p-4" : "gap-4 p-5",
        href && "hover:-translate-y-0.5 hover:border-slate-300/80 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <span className={cn("grid place-items-center rounded-xl", t.bg, sm ? "h-8 w-8" : "h-10 w-10")}>
          <Icon className={cn(t.text, sm ? "h-4 w-4" : "h-[18px] w-[18px]")} strokeWidth={2} />
        </span>
        {delta && (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
              delta.direction === "up"
                ? "bg-emerald-50 text-emerald-700"
                : delta.direction === "down"
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-500",
            )}
          >
            {delta.direction === "up" && <TrendingUp className="h-3 w-3" />}
            {delta.direction === "down" && <TrendingDown className="h-3 w-3" />}
            {delta.value}
          </span>
        )}
      </div>
      <div>
        <div className={cn("font-bold leading-none tracking-tight tabular-nums text-slate-900", sm ? "text-[22px]" : "text-[28px]")}>{value}</div>
        <div className={cn("font-medium text-slate-500", sm ? "mt-1.5 text-[12px]" : "mt-2 text-[13px]")}>{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-slate-400">{hint}</div>}
      </div>
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}
