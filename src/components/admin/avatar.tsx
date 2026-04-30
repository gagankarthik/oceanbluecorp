import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  name?: string;
  email?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  src?: string;
}

const PALETTE = [
  ["from-blue-500", "to-indigo-600"],
  ["from-violet-500", "to-purple-600"],
  ["from-emerald-500", "to-teal-600"],
  ["from-amber-500", "to-orange-600"],
  ["from-rose-500", "to-pink-600"],
  ["from-cyan-500", "to-blue-600"],
  ["from-sky-500", "to-indigo-600"],
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function Avatar({ name, email, size = "md", className, src }: AvatarProps) {
  const display = name || email || "?";
  const initials = display
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
  const palette = PALETTE[hash(display) % PALETTE.length];
  const sz = {
    xs: "w-6 h-6 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
    xl: "w-16 h-16 text-lg",
  }[size];
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={display} className={cn("rounded-full object-cover ring-2 ring-white shadow-sm", sz, className)} />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white shadow-sm",
        palette[0],
        palette[1],
        sz,
        className,
      )}
    >
      {initials}
    </div>
  );
}
