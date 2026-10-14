"use client";

import { useState } from "react";
import Icon from "../icons";

/**
 * Five stars; clicking the current value clears it. Arrow keys step the value.
 * Read-only when `onChange` is omitted.
 */
export function RatingInput({
  value,
  onChange,
  size = "md",
  label = "Rating",
  showValue = false,
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md";
  label?: string;
  /** "3/5" or "Not rated" after the stars */
  showValue?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const star = size === "sm" ? "size-4" : "size-5";
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-2">
      <div
        role={onChange ? "radiogroup" : "img"}
        aria-label={onChange ? label : `${label}: ${value || 0} of 5`}
        className="inline-flex items-center"
        onMouseLeave={() => setHover(0)}
        onKeyDown={(e) => {
          if (!onChange) return;
          if (e.key === "ArrowRight" || e.key === "ArrowUp") {
            e.preventDefault();
            onChange(Math.min(5, value + 1));
          } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
            e.preventDefault();
            onChange(Math.max(0, value - 1));
          }
        }}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const on = shown >= n;
          const cls = `${star} ${on ? "fill-[#f5a524] text-[#f5a524]" : "text-mist-300"}`;
          return onChange ? (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={value === n ? `${n} star${n === 1 ? "" : "s"}, click to clear` : `${n} star${n === 1 ? "" : "s"}`}
              tabIndex={value === n || (!value && n === 1) ? 0 : -1}
              onMouseEnter={() => setHover(n)}
              onClick={(e) => {
                e.stopPropagation();
                onChange(n === value ? 0 : n);
              }}
              className="grid size-8 place-items-center rounded-md transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-600 motion-reduce:transition-none"
            >
              <Icon name="star" className={cls} />
            </button>
          ) : (
            <Icon key={n} name="star" className={cls} />
          );
        })}
      </div>
      {showValue && <span className="text-[13px] tabular-nums text-mist-600">{value ? `${value}/5` : "Not rated"}</span>}
    </div>
  );
}
