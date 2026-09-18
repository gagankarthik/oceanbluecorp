"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Photo URL. Initials show until it loads, and stay if it fails. */
  src?: string | null;
  onLoad?: () => void;
  onError?: () => void;
}

// Flat fills, all >= 4.5:1 against white initials.
const PALETTE = [
  "bg-[#1d4ed8]",
  "bg-[#6d28d9]",
  "bg-[#047857]",
  "bg-[#b45309]",
  "bg-[#be123c]",
  "bg-[#0e7490]",
  "bg-[#475569]",
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, email, size = "md", className, src, onLoad, onError }: AvatarProps) {
  const [loaded, setLoaded] = React.useState(false);
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => { setLoaded(false); setFailed(false); }, [src]);
  const display = name || email || "?";
  const initials = display
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const fill = PALETTE[hash(display) % PALETTE.length];
  const sz = {
    xs: "w-6 h-6 text-[10.5px]",
    sm: "w-7 h-7 text-[11.5px]",
    md: "w-8 h-8 text-[11.5px]",
    lg: "w-11 h-11 text-sm",
    xl: "w-16 h-16 text-lg",
  }[size];
  return (
    <div
      className={cn(
        "relative flex flex-shrink-0 select-none items-center justify-center overflow-hidden rounded-full font-semibold tracking-[0.02em] text-white",
        fill,
        sz,
        className,
      )}
    >
      <span aria-hidden={!!src && loaded}>{initials}</span>
      {src && !failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={display}
          decoding="async"
          onLoad={() => { setLoaded(true); onLoad?.(); }}
          onError={() => { setFailed(true); onError?.(); }}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
          )}
        />
      )}
    </div>
  );
}
