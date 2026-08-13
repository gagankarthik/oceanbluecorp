import PageHero from "./PageHero";
import { Cta } from "./ui";

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
  eyebrow: string;
  title: string;
  subtitle: string;
  /** What a reader can do instead, in one line. */
  note: string;
}) {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero eyebrow={eyebrow} title={title} subtitle={subtitle} />

      <section className="w-full px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24 2xl:px-24">
        <div className="max-w-2xl border-t border-[var(--hz-paper-line)] pt-10">
          <p className="text-[17px] leading-relaxed text-[var(--hz-text-mute)]">{note}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Cta href="/contact" variant="primary">Start a conversation</Cta>
            <Cta href="/solutions" variant="ghostLight">See what we do</Cta>
          </div>
        </div>
      </section>
    </div>
  );
}
