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
  const sizing = size === "md" ? "h-7 px-3 text-adm-xs" : "h-6 px-2 text-adm-xs";
  return (
    <span
      className={cn(
        "inline-flex flex-none items-center gap-1.5 whitespace-nowrap rounded-full border font-medium leading-none",
        t.bg,
        t.line,
        t.text,
        sizing,
        className,
      )}
    >
      {Icon ? <Icon aria-hidden className="size-3" /> : <span aria-hidden className={cn("size-1.5 rounded-full", t.dot)} />}
      <span>{text}</span>
    </span>
  );
}
