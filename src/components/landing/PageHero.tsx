import type { ReactNode } from "react";
import Photo from "./Photo";

/**
 * The interior-page hero: a full-bleed photograph with the statement set over
 * it, bottom-left, on the model of EY's own section openers.
 *
 * Type over photography only works if the contrast floor does not depend on
 * which photograph a page happens to pass, so the scrim below is fixed here
 * and carries it: a flat wash for the floor, a bottom ramp under the words,
 * and a top ramp holding the sticky nav. Values follow the landing hero's,
 * which were measured against sampled frames rather than guessed.
 *
 * Bottom-left rather than centred, which is what the landing hero does. The
 * front door gets the centred title card; interior pages get the editorial
 * treatment, so the two never read as the same page.
 *
 * `image` is optional. Without one the hero keeps the same shape and white
 * type on the brand's own ink gradient, so a policy page with no photograph
 * still belongs to the set instead of reverting to a different design.
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
    <section className="relative isolate flex min-h-[58svh] w-full flex-col justify-end overflow-hidden bg-[var(--hz-ink)] sm:min-h-[64svh] lg:min-h-[70svh]">
      {image ? (
        <>
          <Photo src={image} priority={imagePriority} sizes="100vw" />
          {/* Two ramps. The vertical one holds the nav at the top and beds the
              type at the bottom; the horizontal one darkens the left, where
              the words actually are, so contrast does not depend on how bright
              a given photograph happens to be on that side. The right stays
              open, so the image is still a photograph rather than a texture. */}
          <div
            aria-hidden
            className="absolute inset-0 z-[1]"
            style={{
              background:
                "linear-gradient(180deg, rgba(4,10,24,0.72) 0%, rgba(4,10,24,0.40) 32%, rgba(4,10,24,0.64) 72%, rgba(4,10,24,0.90) 100%), linear-gradient(90deg, rgba(4,10,24,0.72) 0%, rgba(4,10,24,0.45) 38%, rgba(4,10,24,0.12) 62%, transparent 78%)",
            }}
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 z-[1]"
          style={{
            background:
              "radial-gradient(75% 90% at 15% 10%, rgba(29,78,216,0.34), transparent 62%), radial-gradient(60% 75% at 90% 95%, rgba(143,180,253,0.16), transparent 60%)",
          }}
        />
      )}

      <div className="relative z-10 mx-auto w-full max-w-[2200px] px-6 pb-14 pt-28 sm:px-10 sm:pb-16 sm:pt-32 lg:px-16 lg:pb-20 2xl:px-28">
        {eyebrow && (
          <span className="hz-eyebrow block text-white/80">{eyebrow}</span>
        )}
        {/* One step down from the landing's h1, which stays the loudest thing
            on the site. Measure in ch so the line count holds its shape as the
            clamp scales. */}
        <h1
          className={`hz-display max-w-[19ch] text-[clamp(2.1rem,5vw,4.1rem)] leading-[1.02] tracking-[-0.03em] text-white ${
            eyebrow ? "mt-5" : ""
          }`}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-6 max-w-[52ch] text-[16px] leading-relaxed text-white/85 sm:mt-7 sm:text-[18px]">
            {subtitle}
          </p>
        )}
        {note && (
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-relaxed text-white/65">
            {note}
          </p>
        )}

        {actions && <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-9">{actions}</div>}
      </div>
    </section>
  );
}
