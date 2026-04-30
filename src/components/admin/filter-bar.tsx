"use client";

import * as React from "react";
import { Search, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  searchPlaceholder?: string;
  rightSlot?: React.ReactNode;
  children?: React.ReactNode;
  advancedSlot?: React.ReactNode;
  className?: string;
}

export function FilterBar({
  search, onSearchChange, searchPlaceholder = "Search...", rightSlot, children, advancedSlot, className,
}: FilterBarProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {children}
        {advancedSlot && (
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap",
              showAdvanced
                ? "bg-blue-50 border-blue-300 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50",
            )}
          >
            More filters
            <ChevronDown className={cn("w-3 h-3 transition-transform", showAdvanced && "rotate-180")} />
          </button>
        )}
        {rightSlot && <div className="ml-auto flex items-center gap-2">{rightSlot}</div>}
      </div>
      {advancedSlot && showAdvanced && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">{advancedSlot}</div>
      )}
    </div>
  );
}

interface FilterChipsProps<T extends string> {
  options: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  tone?: "blue" | "emerald";
  className?: string;
}

export function FilterChips<T extends string>({
  options, value, onChange, tone = "blue", className,
}: FilterChipsProps<T>) {
  const activeStyles = tone === "emerald"
    ? "bg-emerald-600 text-white border-emerald-600"
    : "bg-blue-600 text-white border-blue-600";
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors",
              active ? `${activeStyles} shadow-sm` : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50",
            )}
          >
            <span>{opt.label}</span>
            {opt.count !== undefined && (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[10px] font-bold leading-tight",
                  active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-700",
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
