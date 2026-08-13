import Link from "next/link";
import PageHero from "./PageHero";

/* ============================================================
   A real page for a section that has no entries yet.

   These four routes (blog, news, customer stories, case studies)
   were linked from the Resources menu before they existed, so every
   one of them was a 404 reached from the site's own navigation.
   That is the worst kind of broken link: not a stale external URL,
   but the product telling a visitor a page exists and then denying
   it.

   The honest fix is a page that says plainly there is nothing here
   yet and offers the nearest useful thing, rather than a fabricated
   post or a placeholder card grid pretending at content.

   Two SEO decisions go with that, and they are deliberate:

     · `robots: index:false` on each of these pages. A page whose
       body is "nothing here yet" is thin content, and publishing
       four of them to an index does the domain harm rather than
       good. The flag comes off with the first real entry.
     · They stay OUT of sitemap.xml for the same reason, a sitemap
       is a list of pages worth crawling.
   ============================================================ */

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

      <section className="w-full py-20 sm:py-24 lg:py-28">
        <div className="mx-auto w-full max-w-[2200px] px-6 sm:px-10 lg:px-16 2xl:px-28">
          <div className="max-w-2xl border-t border-[var(--hz-paper-line)] pt-10">
            <p className="text-[17px] leading-relaxed text-[var(--hz-text-mute)]">{note}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/contact"
                className="inline-flex items-center rounded-full bg-[var(--hz-text)] px-7 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-[var(--hz-cobalt)]"
              >
                Start a conversation
              </Link>
              <Link
                href="/solutions"
                className="inline-flex items-center rounded-full border border-[var(--hz-text)]/25 px-7 py-3.5 text-[15px] font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-text)]"
              >
                See what we do
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
