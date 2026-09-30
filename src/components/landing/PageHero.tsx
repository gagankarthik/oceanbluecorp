import type { ReactNode } from "react";
import Photo from "./Photo";
import { CONTAINER, OPENER_Y } from "@/components/site/sections";
import { LineGrid } from "@/components/site/line-grid";

/**
 * The interior-page opener, in the site system: white ground, left-aligned
 * type, and an optional photograph in a rounded frame on the right. The home
 * page keeps the only full-bleed colour hero, so interior pages never read
 * as a second front door.
 *
 * Same props as before, so every page that already uses it moves over as-is.
 */
export default function PageHero({
  eyebrow,
  title,
  subtitle,
  note,
  actions,
  image,
  imagePriority = true,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** A second, quieter line under the subhead. Use sparingly. */
  note?: ReactNode;
  actions?: ReactNode;
  image?: string;
  imagePriority?: boolean;
}) {
  return (
    <section data-opener className="relative isolate overflow-hidden border-b border-line bg-white">
      <LineGrid />
      <div
        className={`${CONTAINER} ${OPENER_Y} grid gap-10 ${
          image ? "lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-16" : ""
        }`}
      >
        <div>
          {eyebrow && <p className="rise text-[14px] font-semibold text-cobalt">{eyebrow}</p>}
          <h1
            className={`rise max-w-[20ch] type-headline-lg text-ink ${eyebrow ? "mt-3" : ""}`}
            style={{ animationDelay: "80ms" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="rise mt-6 max-w-[58ch] type-body-lg text-ink-muted" style={{ animationDelay: "180ms" }}>
              {subtitle}
            </p>
          )}
          {note && (
            <p className="rise mt-4 max-w-[60ch] type-body-sm text-ink-subtle" style={{ animationDelay: "220ms" }}>
              {note}
            </p>
          )}
          {actions && (
            <div className="rise mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "280ms" }}>
              {actions}
            </div>
          )}
        </div>

        {image && (
          <div className="rise relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-paper-deep" style={{ animationDelay: "200ms" }}>
            <Photo src={image} priority={imagePriority} sizes="(min-width: 1024px) 560px, 100vw" />
          </div>
        )}
      </div>
    </section>
  );
}
