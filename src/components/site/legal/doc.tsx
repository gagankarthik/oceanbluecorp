import Link from "next/link";
import type { LegalRevision } from "@/lib/legal";
import { LegalNav } from "../LegalPage";

/* Document kit for policies that need more than LegalPage carries: a meta
   row, a version history, tables and callouts. Same anatomy as LegalPage. */

export type DocMeta = { label: string; value: React.ReactNode };
export type DocToc = { id: string; label: string }[];

const PROSE =
  "grid gap-4 leading-normal [&_strong]:font-semibold [&_a:not(.plain)]:text-ocean-700 [&_a:not(.plain)]:underline [&_a:not(.plain)]:underline-offset-4";

export function Arrow({ className = "size-4" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

export function DocPage({
  title,
  lede,
  meta,
  toc,
  aside,
  history,
  current,
  children,
}: {
  title: string;
  lede?: React.ReactNode;
  meta?: DocMeta[];
  toc: DocToc;
  /** Extra block under the contents list, e.g. a contact line */
  aside?: React.ReactNode;
  /** Revisions, newest first; rendered as the last section */
  history?: LegalRevision[];
  /** Path of this document in the legal nav */
  current?: string;
  children: React.ReactNode;
}) {
  const contents = history?.length ? [...toc, { id: "version-history", label: "Version history" }] : toc;
  return (
    <article className="bg-field-paper">
      <header id="top" className="gutter pb-12 pt-14 md:pb-16 md:pt-20">
        {current && <LegalNav current={current} />}
        <h1 className={`display text-head-xl ${current ? "mt-10" : ""}`}>{title}</h1>
        {meta && meta.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-mist-600">
            {meta.map((m) => (
              <div key={m.label} className="flex gap-1.5">
                <dt>{m.label}</dt>
                <dd className="text-navy-900">{m.value}</dd>
              </div>
            ))}
          </dl>
        )}
        {lede && <div className="mt-8 max-w-measure text-body leading-normal">{lede}</div>}
      </header>

      <div className="gutter grid gap-12 pb-24 md:pb-32 lg:grid-cols-12">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-24">
            <nav aria-label="On this page" className="bg-mist-100 p-5">
              <p className="text-small font-semibold text-mist-600">On this page</p>
              <ol className="mt-3 grid gap-1.5 text-small">
                {contents.map((s) => (
                  <li key={s.id}>
                    <a href={`#${s.id}`} className="text-navy-900 hover:text-ocean-700 hover:underline">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
            {aside && <div className="mt-2">{aside}</div>}
          </div>
        </aside>

        <div className="min-w-0 max-w-measure lg:col-span-8 lg:col-start-5">
          {children}
          {history && history.length > 0 && (
            <DocSection id="version-history" title="Version history">
              <ol className="grid gap-4">
                {history.map((r) => (
                  <li key={r.date} className="grid gap-1 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
                    <span className="font-semibold">{r.date}</span>
                    <span>{r.summary}</span>
                  </li>
                ))}
              </ol>
            </DocSection>
          )}
        </div>
      </div>
    </article>
  );
}

export function DocSection({ id, number, title, children }: { id: string; number?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-mist-200 py-10 first:border-t-0 first:pt-0">
      <h2 className="text-head-sm font-semibold">
        {number && <span className="mr-2 font-mono text-mist-500">{number}</span>}
        {title}
      </h2>
      <div className={`mt-4 ${PROSE}`}>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="grid list-disc gap-2 pl-5 marker:text-ocean-600">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

/** A short summary inside a section */
export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-l-2 border-ocean-600 bg-mist-100 px-5 py-4">
      <p className="font-semibold">{title}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

/** Where to go next from a document */
export function RelatedLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Related" className="mt-4 grid gap-2 border-t border-mist-200 pt-10 sm:grid-cols-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="plain group flex min-h-14 items-center justify-between bg-mist-0 px-5 font-medium text-navy-900 transition-colors hover:bg-tide-100 hover:text-ocean-700"
        >
          {l.label}
          <Arrow className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      ))}
    </nav>
  );
}

/** A plain table: hairline rows, scrolls sideways on phones */
export function DocTable({ head, rows }: { head: { label: string; className?: string }[]; rows: { key: string; cells: { node: React.ReactNode; className?: string }[] }[] }) {
  return (
    <div className="overflow-x-auto overflow-y-hidden bg-mist-0">
      <table className="w-full text-left text-small">
        <thead>
          <tr className="bg-mist-100">
            {head.map((h) => (
              <th key={h.label} scope="col" className={`px-4 py-3 font-semibold ${h.className ?? ""}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-mist-200">
          {rows.map((r) => (
            <tr key={r.key}>
              {r.cells.map((c, i) => (
                <td key={i} className={`px-4 py-3 align-top text-mist-700 ${c.className ?? ""}`}>
                  {c.node}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SubHead({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 font-semibold text-navy-900">{children}</p>;
}

/** Who to write to about a document */
export function ContactCard({
  title,
  email,
  phone,
  address,
}: {
  title: string;
  email?: { href: string; label: string };
  phone?: { href: string; label: string };
  address?: React.ReactNode;
}) {
  return (
    <div className="bg-mist-100 p-6">
      <p className="font-semibold text-navy-900">{title}</p>
      <ul className="mt-3 grid gap-2">
        {email && (
          <li>
            <a href={email.href}>{email.label}</a>
          </li>
        )}
        {phone && (
          <li>
            <a href={phone.href}>{phone.label}</a>
          </li>
        )}
        {address && <li className="text-mist-700">{address}</li>}
      </ul>
    </div>
  );
}

export const HQ_ADDRESS = (
  <>
    9775 Fairway Drive, Suite C
    <br />
    Powell, OH 43065
  </>
);
