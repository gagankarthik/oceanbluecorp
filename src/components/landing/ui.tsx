import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/site/button";
import { IconArrowRight } from "@/components/site/icons";

/* Eyebrow and Cta, restyled onto the site system with their old props, so
   pages that still import them render in the new language. New code should
   use LinkButton from components/site/button directly. */

/** Section kicker: a short cobalt label, sentence case. */
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
    <span className={`block text-[14px] font-semibold ${tone === "dark" ? "text-cobalt-light" : "text-cobalt"} ${className}`}>
      {children}
    </span>
  );
}

export function Cta({
  href,
  children,
  variant = "primary",
  icon: Icon,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghostLight" | "ghostDark";
  /** Accepted for compatibility; the site arrow is used when omitted. */
  icon?: LucideIcon;
  className?: string;
}) {
  const map = { primary: "primary", ghostLight: "outline", ghostDark: "outline-dark" } as const;
  const cls = buttonClass(map[variant], "lg", `group ${className}`);
  const inner = (
    <>
      {children}
      {Icon ? (
        <Icon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" strokeWidth={1.75} />
      ) : (
        <IconArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
      )}
    </>
  );
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
