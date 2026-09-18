"use client";

import * as React from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { IconInfo } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Explanatory text behind a small ⓘ beside a heading. For "what is this for"
 * copy that helps once and then only adds noise. Opens on hover, keyboard
 * focus, and tap (the button takes focus). Facts and live status stay on the
 * page instead.
 */
export function InfoTip({
  label,
  children,
  className,
}: {
  /** What the tip explains, for the button's accessible name. */
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip content={children} side="bottom" align="start" className={cn("flex-none", className)}>
      <button
        type="button"
        aria-label={`About ${label}`}
        className="grid h-5 w-5 place-items-center rounded-full text-[var(--adm-ink-subtle)] transition-colors hover:bg-[var(--adm-surface-2)] hover:text-[var(--adm-ink)]"
      >
        <IconInfo className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </Tooltip>
  );
}
