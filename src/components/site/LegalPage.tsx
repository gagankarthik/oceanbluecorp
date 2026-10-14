import Link from "next/link";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

export const legalLinks = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/cookies", label: "Cookie Policy" },
  { href: "/accessibility", label: "Accessibility" },
  { href: "/equal-opportunity", label: "Equal Opportunity" },
  { href: "/data-deletion", label: "Data deletion" },
];

/** Chips across the legal documents; `current` marks the open one. */
export function LegalNav({ current }: { current?: string }) {
  return (
    <nav aria-label="Legal pages" className="flex flex-wrap gap-2">
      {legalLinks.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={l.href === current ? "page" : undefined}
          className={`inline-flex min-h-10 items-center px-4 text-[15px] font-medium transition-colors ${
            l.href === current ? "bg-navy-900 text-white" : "bg-mist-100 text-navy-900 hover:bg-tide-200"
          }`}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

/** Shared layout for legal pages: title, date, contents and numbered sections */
export default function LegalPage({
  title,
  updated,
  intro,
  sections,
  current,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
  current: string;
}) {
  return (
    <article className="bg-field-paper">
      <header id="top" className="gutter pb-12 pt-14 md:pb-16 md:pt-20">
        <LegalNav current={current} />
        <h1 className="display mt-10 text-[clamp(2.5rem,5vw,4.5rem)]">{title}</h1>
        <p className="mt-4 text-mist-600">Last updated {updated}</p>
        <div className="mt-8 max-w-[68ch] text-[clamp(1.0625rem,1.2vw,1.1875rem)] leading-relaxed">{intro}</div>
      </header>

      <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="bg-mist-100 p-5 lg:sticky lg:top-24">
            <p className="text-[14px] font-semibold text-mist-600">On this page</p>
            <ol className="mt-3 grid gap-1.5 text-[15px]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-navy-900 hover:text-ocean-700 hover:underline">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <div className="grid max-w-[68ch] gap-12 lg:col-span-8 lg:col-start-5">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="text-[clamp(1.375rem,1.8vw,1.75rem)] font-semibold">
                {i + 1}. {s.title}
              </h2>
              <div className="legal-body mt-4 grid gap-4 leading-relaxed">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
