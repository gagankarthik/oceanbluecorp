import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* Shared primitives for the Horizon landing: Eyebrow and Cta. */

/** Section kicker. */
export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <span
      // Light tone takes its colour from .hz-eyebrow. Dark needs an override:
      // that neutral is tuned for a light ground and vanishes on a dark one.
      className={`hz-eyebrow block ${
        tone === "dark" ? "text-white/60" : ""
      } ${className}`}
    >
      {children}
    </span>
  );
}

export function Cta({
  href,
  children,
  variant = "primary",
  icon: Icon = ArrowUpRight,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghostLight" | "ghostDark";
  icon?: LucideIcon;
  className?: string;
}) {
  const base =
    "group inline-flex items-center gap-3 rounded-full py-2 pl-6 pr-2 text-[14px] font-semibold transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]";
  const variants = {
    // Shadow is rgb(29,78,216), i.e. --hz-cobalt.
    primary:
      "bg-[var(--hz-cobalt)] text-white hover:bg-[var(--hz-cobalt-600)] shadow-[0_14px_34px_-14px_rgba(29,78,216,0.7)]",
    ghostLight:
      "border border-black/[0.08] bg-[var(--hz-canvas)] text-[var(--hz-text)] hover:border-[var(--hz-cobalt)]",
    ghostDark: "border border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]",
  } as const;
  // Ring colour follows the ground: cobalt is invisible on a cobalt button.
  const focus = variant === "ghostLight" ? "hz-focus" : "hz-focus-dark";
  const iconWrap =
    variant === "primary" ? "bg-white/20" : variant === "ghostDark" ? "bg-white/10" : "bg-black/[0.05]";

  const inner = (
    <>
      <span>{children}</span>
      <span
        className={`grid h-8 w-8 place-items-center rounded-full ${iconWrap} transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-105`}
      >
        <Icon className="h-4 w-4" strokeWidth={1.5} />
      </span>
    </>
  );

  const cls = `${base} ${focus} ${variants[variant]} ${className}`;
  const isExternal = /^(#|mailto:|tel:|https?:)/.test(href);
  return isExternal ? (
    <a href={href} className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  );
}
