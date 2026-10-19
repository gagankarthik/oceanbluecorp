/* eslint-disable @next/next/no-img-element */
import { testimonials } from "@/lib/site-content";
import MoreLink from "./MoreLink";

/** Three short client quotes, side by side, each led by the client's logo */
export default function Quotes({ title = "What our clients say", more }: { title?: string; more?: { href: string; label: string } }) {
  return (
    <section aria-labelledby="quotes-title" className="bg-field-paper">
      <div className="gutter py-24 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-4" data-reveal>
          <h2 id="quotes-title" className="display text-head-md">
            {title}
          </h2>
          {more && <MoreLink href={more.href} label={more.label} />}
        </div>
        <div className="mt-12 grid gap-2 md:grid-cols-3">
          {testimonials.map((t, i) => {
            // The middle quote is featured: the page's accent, used once here
            const featured = i === 1;
            return (
            <figure
              key={t.name}
              className={`flex flex-col p-7 transition-colors duration-300 ${featured ? "on-dark bg-ocean-600 text-white" : "bg-mist-100 hover:bg-tide-100"}`}
              data-reveal
              style={{ "--d": i } as React.CSSProperties}
            >
              <div className={`flex h-16 w-fit items-center px-4 ${t.logoOnDark ? "bg-navy-900" : "bg-mist-0"}`}>
                {t.logo ? (
                  <img src={t.logo} alt={t.company} className="h-8 w-auto max-w-[12rem] object-contain" loading="lazy" />
                ) : (
                  // No logo file supplied yet: the company name holds the same place
                  <span className="text-title font-medium tracking-tight text-navy-900">{t.company}</span>
                )}
              </div>
              <blockquote className="mt-6 flex-1">
                <p className="text-title leading-normal">{t.quote}</p>
              </blockquote>
              <figcaption className="mt-10 text-small">
                <span className="block font-medium">{t.name}</span>
                <span className={`block ${featured ? "text-mist-50" : "text-mist-600"}`}>{t.role}</span>
              </figcaption>
            </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
