import Link from "next/link";
import type { Faq } from "@/lib/faqs";
import { jsonLdString } from "@/lib/seo";

/** Common questions on the page they belong to, with their FAQPage JSON-LD. */
export default function FaqList({
  title = "Common questions",
  intro,
  items,
  tone = "paper",
  here,
}: {
  title?: string;
  intro?: string;
  items: Faq[];
  tone?: "paper" | "mist";
  /** This page's path; answers don't link back to it. */
  here?: string;
}) {
  if (items.length === 0) return null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return (
    <section id="questions" aria-labelledby="questions-title" className={`scroll-mt-24 ${tone === "mist" ? "bg-field-mist" : "bg-field-paper"}`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(ld) }} />
      <div className="gutter grid gap-10 py-24 md:py-32 lg:grid-cols-12">
        <div className="side" data-reveal>
          <h2 id="questions-title" className="display text-head">
            {title}
          </h2>
          {intro && <p className="mt-3 max-w-measure-narrow text-mist-600">{intro}</p>}
        </div>
        <ul className="axis grid border-t border-mist-200">
          {items.map((f) => (
            <li key={f.q} className="border-b border-mist-200">
              <details className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-title font-medium marker:hidden hover:text-ocean-700 [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <svg aria-hidden viewBox="0 0 20 20" className="mt-1 size-5 shrink-0 text-ocean-600 transition-transform duration-300 group-open:rotate-45" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M10 4v12M4 10h12" />
                  </svg>
                </summary>
                <div className="max-w-measure pb-6 text-mist-700">
                  <p>{f.a}</p>
                  {f.href && f.href !== here && (
                    <Link href={f.href} className="mt-3 inline-block font-medium text-ocean-700 underline underline-offset-4">
                      Read more
                    </Link>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
