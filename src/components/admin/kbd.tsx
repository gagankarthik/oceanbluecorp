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
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-1 font-mono text-[11.5px] font-medium text-[var(--adm-ink-subtle)]",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
