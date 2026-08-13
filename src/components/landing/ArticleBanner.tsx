import Link from "next/link";
import type { ReactNode } from "react";
import Photo from "./Photo";

/**
 * The masthead for the content sections: a band directly under the top nav
 * carrying the section name, and on an article its headline.
 *
 * Replaces `PageHero` here, which is a full-bleed photograph filling 58–70% of
 * the viewport. That treatment is right for /about or /solutions, where the
 * photograph IS the argument, and wrong for an index: it pushed the first
 * headline below the fold and made the page change shape depending on whether
 * the newest entry happened to carry an image. Every reference this was built
 * against opens on a band, never a hero.
 *
 * An ARTICLE is the exception, and `image` is why: on a single piece the
 * author's own picture is the right backdrop, and there is exactly one of them,
 * so it cannot make the layout inconsistent. The band keeps its height either
 * way; the picture sits behind it rather than setting the size.
 *
 * `pt-16 md:pt-[72px]` is not decoration. The site header is `fixed`, so it is
 * out of flow and content passes underneath it; PageHero absorbed that by being
 * tall and bottom-aligned. A short band has to pay the header's own height
 * (h-16 / md:h-[72px] in Header.tsx) itself, or the nav sits on top of the
 * title. If the header height changes, this changes with it.
 */
export default function ArticleBanner({
  eyebrow,
  eyebrowHref,
  title,
  subtitle,
  image,
  meta,
  byline,
  /** `strip` is the section index: one slim line. `page` is an article. */
  variant = "strip",
}: {
  /** Section name. Rendered above the title on an article page. */
  eyebrow?: string;
  eyebrowHref?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** The article's own image, used as the band's backdrop. */
  image?: string;
  /**
   * The solid tag bar above the headline: category, tags, reading time.
   *
   * A filled block rather than loose text, and it is the hero's real
   * legibility device now that nothing tints the photograph. Loose grey
   * metadata over a picture is the first thing to become unreadable; a solid
   * cobalt bar carries its own contrast whatever is behind it.
   */
  meta?: ReactNode;
  /** Author row, under the headline. */
  byline?: ReactNode;
  variant?: "strip" | "page";
}) {
  const strip = variant === "strip";
  const hasImage = !!image && !strip;

  /**
   * Legibility on a clean photograph, carried by the type rather than by a
   * wash over the image.
   *
   * Two shadows, not one: a tight, nearly-opaque one that gives every letter
   * an edge against whatever is immediately behind it, and a wide, soft one
   * that darkens the area around the words enough to separate them from a
   * busy background. A single blur does one job or the other, never both.
   *
   * Applied only when there is an image, so the plain navy band keeps its
   * flat, clean type.
   */
  const TYPE_SHADOW = hasImage
    ? { textShadow: "0 1px 2px rgba(4,10,24,0.55), 0 4px 24px rgba(4,10,24,0.45)" }
    : undefined;

  return (
    <section
      className={`relative isolate w-full overflow-hidden bg-[var(--hz-navy)] pt-16 md:pt-[72px] ${
        // 70svh, matching PageHero's proportions: on an article the picture is
        // a cover, so it gets the screen. `svh` not `vh` because on mobile
        // `vh` measures the viewport with the browser chrome retracted, which
        // pushes the headline under the address bar on first paint.
        hasImage ? "flex min-h-[70svh] flex-col justify-end" : ""
      }`}
    >
      {/* The picture runs clean, with no scrim over it. The type carries its
          own legibility instead (TYPE_SHADOW below), so the photograph is seen
          as it was uploaded rather than through a tint.

          The trade is real and worth stating: a shadow on the letters is
          weaker than a wash over the image, so a bright or busy photo can
          still make white type hard to read. That now depends on the picture
          the author picks, which is a choice made per article rather than
          guaranteed by the layout. */}
      {hasImage && <Photo src={image} alt="" sizes="100vw" priority />}

      <div
        className={`relative z-[2] w-full px-6 sm:px-10 lg:px-16 2xl:px-24 ${
          strip
            ? "py-5 sm:py-6"
            : hasImage
              // Bottom-left over the picture, the editorial treatment the rest
              // of the site's interior heroes already use.
              ? "pb-12 pt-16 sm:pb-16"
              : "py-9 sm:py-12 lg:py-14"
        }`}
      >
        <div className="mx-auto w-full max-w-6xl">
          {/* The tag bar. A solid block, so it reads on any photograph, and
              it takes the place of the loose eyebrow this used to have. */}
          {!strip && meta && (
            <div className="mb-6 inline-flex max-w-full flex-wrap items-center gap-x-3 gap-y-1 bg-[var(--hz-cobalt)] px-5 py-2.5 text-[13.5px] font-semibold text-white">
              {meta}
            </div>
          )}

          {/* Without a tag bar the section name still needs to appear, and it
              doubles as the way back to the index. */}
          {!strip && !meta && eyebrow && (
            <p className="mb-3">
              {eyebrowHref ? (
                <Link
                  href={eyebrowHref}
                  style={TYPE_SHADOW}
                  className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70 transition-colors hover:text-white"
                >
                  {eyebrow}
                </Link>
              ) : (
                <span style={TYPE_SHADOW} className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/70">
                  {eyebrow}
                </span>
              )}
            </p>
          )}

          <h1
            style={TYPE_SHADOW}
            className={
              strip
                ? "text-[21px] font-bold tracking-[-0.01em] text-[var(--hz-on-dark)] sm:text-[24px]"
                : `max-w-4xl font-semibold leading-[1.08] tracking-[-0.03em] text-[var(--hz-on-dark)] ${
                    hasImage
                      ? "text-[34px] sm:text-[48px] lg:text-[60px]"
                      : "text-[28px] sm:text-[36px] lg:text-[42px]"
                  }`
            }
          >
            {title}
          </h1>

          {subtitle && (
            <p
              style={TYPE_SHADOW}
              className={`max-w-2xl ${hasImage ? "text-white/85" : "text-[var(--hz-on-dark-mute)]"} ${
                strip ? "mt-1.5 text-[15px] leading-snug" : "mt-4 text-[17px] leading-relaxed"
              }`}
            >
              {subtitle}
            </p>
          )}
          {byline && <div className="mt-7">{byline}</div>}
        </div>
      </div>
    </section>
  );
}
