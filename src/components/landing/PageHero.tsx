import type { ReactNode } from "react";
import Photo from "./Photo";

/* ============================================================
   The interior-page hero, built to the landing page's rules.

   Every marketing page used to open the same way the site did
   before the rebuild: a full-bleed photograph, a near-opaque dark
   gradient dropped over it to claw back enough contrast to read,
   and the headline set in white on top. The landing page now does
   the exact opposite, deliberately, near-black type on warm paper,
   with the photograph BELOW the sentence rather than under it. That
   single decision is most of why the landing reads as confident:
   nothing competes with the words, and the image gets to be a
   photograph instead of a texture behind text.

   So this is that hero, as one component. Pages pass their own
   content; the structure, scale, rhythm and colour are fixed here,
   which is what keeps eight pages in the same voice as the ninth
   without eight chances to drift.

   `image` is optional. A page with nothing worth showing, contact,
   a policy, opens on the statement alone rather than reaching for
   a stock photo to fill the slot.
   ============================================================ */

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
    <section className="relative w-full bg-[var(--hz-paper)] pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
        {eyebrow && (
          <span className="hz-eyebrow block text-[var(--hz-cobalt)]">{eyebrow}</span>
        )}
        {/* One step down from the landing's own h1, that page is the front
            door and should stay the loudest thing on the site. Measure is in
            ch so the line count holds its shape as the clamp scales, instead
            of rewrapping differently at every width. */}
        <h1
          className={`hz-display max-w-[19ch] text-[clamp(2.25rem,5.4vw,4.5rem)] leading-[1.0] tracking-[-0.03em] text-[var(--hz-text)] ${
            eyebrow ? "mt-5" : ""
          }`}
        >
          {title}
        </h1>

        {subtitle && (
          <p className="mt-7 max-w-[52ch] text-[17px] leading-relaxed text-[var(--hz-text-mute)] sm:mt-8 sm:text-[19px]">
            {subtitle}
          </p>
        )}
        {note && (
          <p className="mt-4 max-w-[58ch] text-[14.5px] leading-relaxed text-[var(--hz-text-subtle)]">
            {note}
          </p>
        )}

        {actions && <div className="mt-9 flex flex-wrap items-center gap-3 sm:mt-10">{actions}</div>}
      </div>

      {image && (
        <div className="mx-auto mt-14 w-full max-w-[2200px] px-6 sm:mt-16 sm:px-10 lg:px-16 2xl:px-28">
          <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-[var(--hz-band)]">
            <Photo src={image} priority={imagePriority} sizes="(min-width: 1024px) 88vw, 92vw" />
          </div>
        </div>
      )}
    </section>
  );
}
