"use client";

import { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  action,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  align?: "left" | "center";
  action?: ReactNode;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <div className="inline-flex items-center gap-2 text-[11.5px] font-semibold uppercase tracking-[0.13em] text-[var(--reg-brand-700)]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--reg-brand-600)]" />
        {eyebrow}
      </div>
      <h2 className="mt-3 text-[32px] font-semibold leading-[1.05] tracking-tight text-[var(--reg-text-primary)] sm:text-[44px] lg:text-[52px]">
        {title}
      </h2>
      <p className="mt-4 text-[15px] leading-relaxed text-[var(--reg-text-secondary)] sm:text-[16px]">
        {subtitle}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
