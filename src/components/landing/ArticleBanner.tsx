import Link from "next/link";
import type { ReactNode } from "react";
import Photo from "./Photo";
import { CONTAINER, OPENER_Y } from "@/components/site/sections";

/**
 * The masthead for the Resources sections, in the site system.
 *
 * `strip` is a section index: white band, the section's name and one line.
 * `page` is an article: section link, tag row, headline, standfirst and
 * byline, with the article's own picture set BELOW the type in a rounded
 * frame, so the headline never depends on the photo for contrast.
 *
 * OPENER_Y clears the fixed site header (64–68px) with room to breathe.
 */
export default function ArticleBanner({
  eyebrow,
  eyebrowHref,
  title,
  subtitle,
  image,
  meta,
  byline,
  variant = "strip",
}: {
  /** Section name. Rendered above the title on an article page. */
  eyebrow?: string;
  eyebrowHref?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The article's own image, set under the headline. */
  image?: string;
  /** Tag row above the headline: category, tags, reading time. */
  meta?: ReactNode;
  /** Author row, under the headline. */
  byline?: ReactNode;
  variant?: "strip" | "page";
}) {
  if (variant === "strip") {
    return (
      <section data-opener className="border-b border-line bg-white">
        <div className={`${CONTAINER} ${OPENER_Y}`}>
          <p className="rise type-label font-semibold text-cobalt">Resources</p>
          <h1 className="rise mt-3 type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
            {title}
          </h1>
          {subtitle && (
            <p className="rise mt-5 max-w-[640px] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
              {subtitle}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white">
      <div className="mx-auto w-full max-w-[880px] px-4 pt-28 sm:px-6 sm:pt-32 lg:pt-36">
        {eyebrow &&
          (eyebrowHref ? (
            <Link href={eyebrowHref} className="rise type-label font-semibold text-cobalt hover:text-cobalt-deep">
              {eyebrow}
            </Link>
          ) : (
            <p className="rise type-label font-semibold text-cobalt">{eyebrow}</p>
          ))}
        {meta && (
          <div className="rise mt-4 flex flex-wrap items-center gap-2" style={{ animationDelay: "60ms" }}>
            {meta}
          </div>
        )}
        <h1 className="rise mt-5 type-headline font-semibold text-ink" style={{ animationDelay: "100ms" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="rise mt-5 type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
            {subtitle}
          </p>
        )}
        {byline && (
          <div className="rise mt-8" style={{ animationDelay: "220ms" }}>
            {byline}
          </div>
        )}
      </div>
      {image && (
        <div className="mx-auto mt-12 w-full max-w-[1100px] px-4 sm:px-6">
          <div className="rise relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-paper-deep" style={{ animationDelay: "260ms" }}>
            <Photo src={image} alt="" sizes="(min-width: 1100px) 1100px, 100vw" priority />
          </div>
        </div>
      )}
    </section>
  );
}
