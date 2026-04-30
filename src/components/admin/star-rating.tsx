"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  onRate?: (n: number) => void;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StarRating({ rating, onRate, size = "sm", className }: StarRatingProps) {
  const [hover, setHover] = React.useState(0);
  const sz = { sm: "w-3.5 h-3.5", md: "w-4 h-4", lg: "w-5 h-5" }[size];
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = (hover || rating) >= n;
        return (
          <button
            key={n}
            type="button"
            onClick={(e) => { e.stopPropagation(); onRate?.(n); }}
            onMouseEnter={() => onRate && setHover(n)}
            onMouseLeave={() => setHover(0)}
            className={cn("transition-transform", onRate ? "hover:scale-110 cursor-pointer" : "cursor-default")}
            aria-label={`Rate ${n} stars`}
          >
            <Star className={cn(sz, filled ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
          </button>
        );
      })}
    </div>
  );
}
