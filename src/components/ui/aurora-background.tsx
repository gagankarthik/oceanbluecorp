"use client";

import { cn } from "@/lib/utils";
import React, { type ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
}

/**
 * Animated aurora background. The heavy gradient/animation lives in the
 * `.aurora-layer` CSS class (see globals.css); this component just composes
 * the dark container, the aurora layer, and the foreground content.
 *
 * Height is driven by `children` (or a `min-h-*` className) — it is not forced
 * to 100vh, so it can back a section of any size.
 */
export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden bg-slate-950 text-white",
        className
      )}
      {...props}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className={cn("aurora-layer", showRadialGradient && "aurora-mask")} />
      </div>
      {children}
    </div>
  );
}
