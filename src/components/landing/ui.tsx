import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/* ============================================================
   Shared premium primitives for the Horizon landing.
   - Eyebrow : pill-badge kicker
   - Bezel   : double-bezel "machined hardware" nested card
   - Cta     : button-in-button pill with magnetic hover physics
   ============================================================ */

/* Kicker labels removed site-wide per design direction — Eyebrow renders nothing.
   (Kept as a no-op so existing call sites don't break.) */
export function Eyebrow(_props: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
}) {
  return null;
}

export function Bezel({
  children,
  tone = "light",
  className = "",
  innerClassName = "",
  radius = 28,
}: {
  children: ReactNode;
  tone?: "light" | "dark";
  className?: string;
  innerClassName?: string;
  radius?: number;
}) {
  const shell =
    tone === "dark"
      ? "bg-white/[0.04] ring-1 ring-white/10"
      : "bg-black/[0.045] ring-1 ring-black/[0.05]";
  const innerHi =
    tone === "dark"
      ? "inset 0 1px 1px rgba(255,255,255,0.08)"
      : "inset 0 1px 1px rgba(255,255,255,0.75)";
  return (
    <div className={`p-1.5 ${shell} ${className}`} style={{ borderRadius: radius }}>
      <div
        className={`relative h-full overflow-hidden ${innerClassName}`}
        style={{ borderRadius: radius - 6, boxShadow: innerHi }}
      >
        {children}
      </div>
    </div>
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
    primary:
      "bg-[var(--hz-cobalt)] text-white hover:bg-[var(--hz-cobalt-600)] shadow-[0_14px_34px_-14px_rgba(37,99,235,0.7)]",
    ghostLight:
      "border border-black/[0.08] bg-[var(--hz-canvas)] text-[var(--hz-text)] hover:border-[var(--hz-cobalt)]",
    ghostDark: "border border-white/[0.12] bg-white/[0.04] text-white hover:bg-white/[0.08]",
  } as const;
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

  const cls = `${base} ${variants[variant]} ${className}`;
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
