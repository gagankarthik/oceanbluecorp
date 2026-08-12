import Link from "next/link";
import type { ReactNode } from "react";

/* ============================================================
   Shared primitives for every marketing page.

   These are the highest-leverage files on the site: `Cta` has 29 call
   sites and `Eyebrow` 26, spread across solutions, products, careers,
   about, team, contact and the service detail pages. Bringing them onto
   the landing page's language converts the buttons and kickers on all of
   those at once, which is why the interior pages are fixed here first
   rather than one at a time.

   What changed and why:

     · `Cta` was a button-in-button pill — a label, then a separate round
       chip holding an arrow that translated, lifted and scaled on hover,
       over a coloured glow shadow. The landing page uses a plain filled
       pill. Three simultaneous hover transforms and a coloured drop
       shadow are what a template does to make a button feel designed.
     · `Eyebrow` defaulted to `--hz-amber`. The landing has no amber in
       it; the palette is the two ends of the logo's blue. On a light
       ground the kicker is cobalt, on a dark one it is aqua, and the
       `tone` prop picks between them.
     · `Bezel` — a double-ringed "machined hardware" card — is deleted.
       It had zero call sites, and nothing in the current design would
       use it.
   ============================================================ */

/** Section kicker: small caps, wide tracking, one accent colour. */
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
      className={`hz-eyebrow block ${
        tone === "dark" ? "text-[var(--hz-aqua)]" : "text-[var(--hz-cobalt)]"
      } ${className}`}
    >
      {children}
    </span>
  );
}

/**
 * The site's button. One shape, one transition, three grounds.
 *
 * `primary` is the filled ink pill the landing hero uses; `ghostLight`
 * is its hairline-outlined twin for a secondary action on paper; and
 * `ghostDark` is the same outline on an ink band. Colour is the only
 * thing that moves on hover — no lift, no scale, no glow.
 */
export function Cta({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "ghostLight" | "ghostDark";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-[15px] font-semibold transition-colors duration-200";
  const variants = {
    primary: "bg-[var(--hz-text)] text-white hover:bg-[var(--hz-cobalt)]",
    ghostLight:
      "border border-[var(--hz-text)]/25 text-[var(--hz-text)] hover:border-[var(--hz-text)]",
    ghostDark:
      "border border-[var(--hz-aqua)] text-[var(--hz-aqua)] hover:bg-[var(--hz-aqua)] hover:text-[var(--hz-ink)]",
  } as const;

  const cls = `${base} ${variants[variant]} ${className}`;
  // mailto/tel/hash and absolute URLs are not app routes; Link would try to
  // prefetch them.
  const isExternal = /^(#|mailto:|tel:|https?:)/.test(href);
  return isExternal ? (
    <a href={href} className={cls}>
      {children}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
