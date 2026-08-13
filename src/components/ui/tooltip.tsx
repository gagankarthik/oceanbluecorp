"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tooltip.
 *
 * Opens on hover AND on keyboard focus, which is the part most hand-rolled
 * tooltips miss: a hint only a mouse can reach is a hint half the users never
 * get. Escape dismisses it, and the content is wired through aria-describedby
 * so a screen reader announces it with the control rather than separately.
 *
 * Inverted against the page on purpose. The surface behind a tooltip is
 * usually light, so the tooltip is ink; that contrast is what stops it reading
 * as part of the page underneath.
 *
 * Not for essential information. If the interface only works when the tooltip
 * is open, the text belongs on the page.
 */

type Side = "top" | "bottom" | "left" | "right";

const SIDE: Record<Side, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const ARROW: Record<Side, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1",
};

export function Tooltip({
  content,
  side = "top",
  children,
  className,
}: {
  content: React.ReactNode;
  side?: Side;
  /** The control the tooltip describes. Must accept a ref-less wrapper. */
  children: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const id = React.useId();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined} className="inline-flex">
        {children}
      </span>

      {open && (
        <span
          role="tooltip"
          id={id}
          className={cn(
            "pointer-events-none absolute z-50 w-max max-w-[16rem] rounded-lg px-2.5 py-1.5",
            "bg-[var(--hz-ink)] text-caption font-medium text-white shadow-[var(--hz-shadow-md)]",
            SIDE[side]
          )}
        >
          {content}
          <span
            aria-hidden
            className={cn("absolute h-2 w-2 rotate-45 bg-[var(--hz-ink)]", ARROW[side])}
          />
        </span>
      )}
    </span>
  );
}
