"use client";

import Link from "next/link";

/**
 * The way back, one look everywhere: top-left, arrow first, an underline that
 * draws in from the left on hover or focus.
 */
export default function BackLink({
  label = "Back",
  href,
  onClick,
  tone = "ocean",
  className = "",
}: {
  label?: string;
  href?: string;
  onClick?: () => void;
  /** "light" on dark fields. */
  tone?: "ocean" | "ink" | "light";
  className?: string;
}) {
  const color = { ocean: "text-ocean-700 hover:text-ocean-800", ink: "text-mist-700 hover:text-navy-900", light: "text-tide-200 hover:text-white" }[tone];
  const cls = `group inline-flex min-h-10 items-center gap-2 self-start text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${color} ${className}`;
  const body = (
    <>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="size-4 shrink-0 transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:-translate-x-1 motion-reduce:transition-none"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 8H3M7 4 3 8l4 4" />
      </svg>
      <span className="relative">
        {label}
        <span
          aria-hidden
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-current transition-transform duration-300 ease-[var(--ease-out-strong)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
        />
      </span>
    </>
  );
  return href ? (
    <Link href={href} className={cls}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}
