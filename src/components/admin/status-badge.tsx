import * as React from "react";
import { cn } from "@/lib/utils";
import { tones, statusMeta, type AppStatus, type Tone } from "./theme";

interface StatusBadgeProps {
  status?: AppStatus | string;
  tone?: Tone;
  label?: string;
  withIcon?: boolean;
  size?: "sm" | "md";
  className?: string;
}

export function StatusBadge({ status, tone, label, withIcon = false, size = "sm", className }: StatusBadgeProps) {
  const meta = (status && (statusMeta as Record<string, typeof statusMeta.pending>)[status as string]) || null;
  const resolvedTone: Tone = tone || meta?.tone || "slate";
  const t = tones[resolvedTone];
  const Icon = withIcon && meta?.icon ? meta.icon : null;
  const text = label || meta?.label || status || "—";
  const sizing = size === "md" ? "text-xs px-2.5 py-1" : "text-[11px] px-2 py-0.5";
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full font-semibold", t.bg, t.text, sizing, className)}>
      {Icon ? <Icon className="w-3 h-3" /> : <span className={cn("w-1.5 h-1.5 rounded-full", t.dot)} />}
      <span className="capitalize">{text}</span>
    </span>
  );
}
