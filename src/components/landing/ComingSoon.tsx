import ArticleBanner from "./ArticleBanner";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight } from "@/components/site/icons";
import { GeoBooks } from "@/components/site/geo-art";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";

/**
 * A real page for a section that has no entries yet.
 *
 * These four routes (blog, news, customer stories, case studies) are linked
 * from the Resources menu, so without this they are 404s reached from the
 * site's own navigation. This says plainly there is nothing here yet and
 * offers the nearest useful thing, rather than a fabricated post or a
 * placeholder grid pretending at content.
 *
 * Each of these pages sets `robots: index:false` and stays out of
 * sitemap.xml. Both come off with the first real entry.
 */
export default function ComingSoon({
  eyebrow,
  title,
  subtitle,
  note,
}: {
  /** The section's name, shown as the banner title. */
  eyebrow: string;
  title: string;
  subtitle: string;
  /** What a reader can do instead, in one line. */
  note: string;
}) {
  return (
    <>
      <ArticleBanner title={eyebrow} subtitle={subtitle} />

      <section data-tone="paper" className={`bg-paper ${SECTION_Y}`}>
        <div className={CONTAINER}>
          <div className="reveal grid overflow-hidden rounded-2xl border border-line bg-white lg:grid-cols-[1.4fr_1fr]">
            <div className="p-8 sm:p-12">
              <h2 className="type-headline-sm font-semibold text-ink">{title}</h2>
              <p className="mt-4 max-w-[560px] type-body-lg text-ink-muted">{note}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/contact" variant="primary" size="lg">
                  Talk to us
                  <IconArrowRight size={16} />
                </LinkButton>
                <LinkButton href="/solutions" variant="outline" size="lg">
                  See what we do
                </LinkButton>
              </div>
            </div>
            <div aria-hidden className="hidden items-center justify-center border-l border-line bg-paper p-10 lg:flex">
              <GeoBooks className="h-auto w-full max-w-[240px]" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
