"use client";

import * as React from "react";

/**
 * Tiny inline trend line for KPI cards and table cells — pure SVG,
 * no recharts payload. Shows shape only (no axes, no tooltip); if the
 * number needs reading precisely, use a real chart instead.
 */
export function Sparkline({
  data,
  color = "#1d4ed8",
  height = 28,
  strokeWidth = 1.5,
  fill = true,
  className,
}: {
  data: number[];
  color?: string;
  height?: number;
  strokeWidth?: number;
  /** Soft gradient wash under the line. */
  fill?: boolean;
  className?: string;
}) {
  const id = React.useId();
  if (data.length < 2) return null;

  const W = 100;
  const PAD = strokeWidth + 0.5;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const step = W / (data.length - 1);

  const pts = data.map((v, i) => {
    const x = i * step;
    const y = PAD + (1 - (v - min) / span) * (height - PAD * 2);
    return [x, y] as const;
  });
  const line = pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width: "100%", height }}
      aria-hidden
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={`${line} L${W},${height} L0,${height} Z`} fill={`url(#${id})`} />
        </>
      )}
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
