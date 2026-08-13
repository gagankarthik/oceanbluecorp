"use client";

import * as React from "react";
// IconStar over lucide's: the base sets fill="none" as a presentation
// attribute, which a Tailwind `fill-*` class still overrides, so the filled
// state below works exactly as before.
import { IconStar } from "./icons";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate?: (n: number) => void;
  size?: "sm" | "md" | "lg";
  /**
   * Collapse an unrated control to a single quiet placeholder until the user
   * points at it.
   *
   * In a grid this matters more than it sounds: most records are unrated, so a
   * permanently-drawn five-star control printed hundreds of empty grey stars
   * down the page. They read as data, as if every candidate had been scored
   * zero, and they were the loudest thing in a column that is usually empty.
   */
  collapseWhenEmpty?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  onRate,
  size = "sm",
  collapseWhenEmpty = false,
  className,
}: StarRatingProps) {
  const [hover, setHover] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const sz = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }[size];

  const collapsed = collapseWhenEmpty && rating === 0 && !open;

  return (
    <div
      className={cn("inline-flex items-center gap-0.5", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => { setOpen(false); setHover(0); }}
      onFocusCapture={() => setOpen(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false);
      }}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRate?.(1); }}
          aria-label="Rate this candidate"
          className={cn(
            "inline-flex items-center text-[var(--adm-ink-subtle)] transition-colors relative before:absolute before:left-1/2 before:top-1/2 before:h-10 before:w-10 before:-translate-x-1/2 before:-translate-y-1/2 before:content-['']",
            onRate ? "cursor-pointer hover:text-amber-400" : "cursor-default",
          )}
        >
          <IconStar className={sz} />
        </button>
      ) : (
        [1, 2, 3, 4, 5].map((n) => {
          const filled = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              onClick={(e) => { e.stopPropagation(); onRate?.(n); }}
              onMouseEnter={() => onRate && setHover(n)}
              // Padding, NOT the .adm-hit overlay. Five stars sit ~16px apart,
              // so a 40px overlay on each would overlap its neighbours and a
              // click meant for star 3 could land on star 4. Padding grows each
              // target to ~28px without any of them overlapping.
              className={cn(
                "-my-1.5 p-1.5 transition-transform",
                onRate ? "cursor-pointer hover:scale-110" : "cursor-default",
              )}
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            >
              <IconStar className={cn(sz, filled ? "fill-amber-400 text-amber-400" : "text-[var(--adm-ink-subtle)]")} />
            </button>
          );
        })
      )}
    </div>
  );
}
