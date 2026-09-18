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
  const text = label || meta?.label || status || "–";
  const sizing = size === "md" ? "h-6 px-2.5 text-[12.5px]" : "h-[22px] px-2 text-[12px]";
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full font-medium leading-none",
        t.bg,
        t.text,
        sizing,
        className,
      )}
    >
      {Icon ? <Icon className="h-3 w-3" /> : <span className={cn("h-1.5 w-1.5 rounded-full", t.dot)} />}
      <span>{text}</span>
    </span>
  );
}
