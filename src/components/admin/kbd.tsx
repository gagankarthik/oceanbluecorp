import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Keyboard key cap.
 *
 * Was a private helper inside command-palette.tsx while the design system
 * documented it as a shared atom. Extracted here so the workspace toolbars and
 * the palette render the same cap rather than two that drift apart.
 */
export function Kbd({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        "inline-flex items-center rounded-[4px] border border-[var(--adm-line)] bg-[var(--adm-surface)] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[var(--adm-ink-subtle)] shadow-[0_1px_0_rgba(0,0,0,0.04)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
