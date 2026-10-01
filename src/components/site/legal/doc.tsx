import Link from "next/link";
import { cn } from "@/lib/utils";
import type { LegalRevision } from "@/lib/legal";
import { CONTAINER, OPENER_Y, SECTION_Y } from "../sections";
import { IconArrowRight, IconChevronDown, IconMail, IconPhone, IconPin, type IconProps } from "../icons";
export { IconPin, IconArrowLeft, IconPhone } from "../icons";

/* The document kit for policies and statements. Same anatomy as DocHero +
   PolicyBody (paper opener aligned to the prose column, sticky contents on
   the left), with two things those primitives do not carry: a meta row for
   "Effective" and "Jurisdiction" lines, and children-based sections, so
   long legal JSX stays exactly as written. */

/* ---------- Local glyphs, same 24px grid and 1.5 stroke as site/icons ---------- */

function Svg({ size = 16, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}




/* ---------- Page shell ---------- */

export type DocMeta = { label: string; value: React.ReactNode };
export type DocToc = { id: string; label: string }[];

const PROSE =
  "space-y-4 type-body text-ink-muted [&_strong]:font-semibold [&_strong]:text-ink [&_a:not(.plain)]:font-medium [&_a:not(.plain)]:text-cobalt [&_a:not(.plain)]:underline [&_a:not(.plain)]:underline-offset-4";

function Contents({ toc }: { toc: DocToc }) {
  return (
    <ul className="space-y-0.5 border-l border-line">
      {toc.map((s) => (
        <li key={s.id}>
          <a href={`#${s.id}`} className="-ml-px block border-l border-transparent py-1.5 pl-4 type-body-sm text-ink-muted transition-colors hover:border-ink hover:text-ink">
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function DocPage({
  title,
  lede,
  meta,
  toc,
  aside,
  history,
  children,
}: {
  title: string;
  lede?: React.ReactNode;
  meta?: DocMeta[];
  toc: DocToc;
  /** Extra block under the contents list, e.g. a contact line. */
  aside?: React.ReactNode;
  /** Revisions, newest first. Rendered as the document's last section. */
  history?: LegalRevision[];
  children: React.ReactNode;
}) {
  const contents = history?.length ? [...toc, { id: "version-history", label: "Version history" }] : toc;
  return (
    <>
      <section data-opener className="border-b border-line bg-paper">
        <div className={cn(CONTAINER, OPENER_Y, "lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12")}>
          <div className="hidden lg:block" />
          <div className="max-w-[760px]">
            <h1 className="rise type-headline-lg font-semibold text-ink">{title}</h1>
            {lede && (
              <p className="rise mt-4 type-body-lg text-ink-muted" style={{ animationDelay: "100ms" }}>
                {lede}
              </p>
            )}
            {meta && meta.length > 0 && (
              <dl className="rise mt-6 flex flex-wrap gap-x-8 gap-y-2 type-body-sm text-ink-subtle" style={{ animationDelay: "180ms" }}>
                {meta.map((m) => (
                  <div key={m.label} className="flex gap-1.5">
                    <dt className="font-semibold text-ink-muted">{m.label}:</dt>
                    <dd>{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}
          </div>
        </div>
      </section>

      <div data-tone="white" className={cn(CONTAINER, SECTION_Y, "grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12")}>
        {/* Phones get the contents folded; from lg they stick beside the prose. */}
        <details className="group rounded-xl border border-line bg-white lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 type-label font-semibold text-ink">
            On this page
            <IconChevronDown size={16} className="text-ink-subtle transition-transform group-open:rotate-180" />
          </summary>
          <div className="px-4 pb-4">
            <Contents toc={contents} />
          </div>
        </details>
        <nav aria-label="On this page" className="hidden lg:sticky lg:top-28 lg:block lg:max-h-[calc(100vh-8rem)] lg:self-start lg:overflow-y-auto">
          <p className="type-label font-semibold text-ink">On this page</p>
          <div className="mt-3">
            <Contents toc={contents} />
          </div>
          {aside && <div className="mt-8">{aside}</div>}
        </nav>
        <div className="min-w-0 max-w-[760px]">
          {children}
          {history && history.length > 0 && (
            <DocSection id="version-history" title="Version history">
              <ol className="space-y-4">
                {history.map((r) => (
                  <li key={r.date} className="grid gap-1 sm:grid-cols-[170px_minmax(0,1fr)] sm:gap-6">
                    <span className="font-semibold text-ink">{r.date}</span>
                    <span>{r.summary}</span>
                  </li>
                ))}
              </ol>
            </DocSection>
          )}
        </div>
      </div>
    </>
  );
}

/* ---------- Content blocks ---------- */

export function DocSection({ id, number, title, children }: { id: string; number?: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-10 first:border-t-0 first:pt-0">
      {number && <p className="font-mono text-[13px] font-medium text-ink-subtle">{number}</p>}
      <h2 className={cn("type-title-lg font-semibold text-ink", number && "mt-1.5")}>{title}</h2>
      <div className={cn("mt-4", PROSE)}>{children}</div>
    </section>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function SubHead({ children }: { children: React.ReactNode }) {
  return <p className="pt-2 font-semibold text-ink">{children}</p>;
}

export function UL({ items }: { items: (string | React.ReactNode)[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-[1px] bg-cobalt" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** A highlighted summary inside a section. Cobalt rule, not a tinted box of cobalt text. */
export function Callout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-r-xl border-l-2 border-cobalt bg-paper px-5 py-4">
      <p className="type-label font-semibold text-ink">{title}</p>
      <div className="mt-1.5 type-body">{children}</div>
    </div>
  );
}

/** The company's contact block. Details are passed in, never assumed. */
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
    <div className="rounded-2xl border border-line bg-white p-6">
      <p className="text-[15px] font-semibold text-ink">{title}</p>
      <ul className="mt-4 space-y-3 type-body text-ink-muted">
        {email && (
          <li>
            <a href={email.href} className="plain inline-flex items-center gap-3 transition-colors hover:text-cobalt">
              <IconMail size={16} className="text-cobalt" /> {email.label}
            </a>
          </li>
        )}
        {phone && (
          <li>
            <a href={phone.href} className="plain inline-flex items-center gap-3 transition-colors hover:text-cobalt">
              <IconPhone size={16} className="text-cobalt" /> {phone.label}
            </a>
          </li>
        )}
        {address && (
          <li className="flex items-start gap-3">
            <IconPin size={16} className="mt-1 shrink-0 text-cobalt" />
            <span>{address}</span>
          </li>
        )}
      </ul>
    </div>
  );
}

/** Where to go next from a document. */
export function RelatedLinks({ links }: { links: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Related" className="mt-4 grid gap-3 border-t border-line pt-10 sm:grid-cols-2">
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="plain group flex items-center justify-between rounded-xl border border-line bg-white px-5 py-4 text-[15px] font-semibold text-ink transition-colors hover:border-ink"
        >
          {l.label}
          <IconArrowRight size={16} className="text-ink-subtle transition-transform group-hover:translate-x-1 group-hover:text-ink" />
        </Link>
      ))}
    </nav>
  );
}

/** A simple table for documents: hairline rows, header on paper, scrolls on phones. */
export function DocTable({ head, rows }: { head: { label: string; className?: string }[]; rows: { key: string; cells: { node: React.ReactNode; className?: string }[] }[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <div className="overflow-x-auto">
        <table className="w-full text-left type-body-sm">
          <thead>
            <tr className="border-b border-line bg-paper">
              {head.map((h) => (
                <th key={h.label} scope="col" className={cn("px-4 py-3 font-semibold text-ink", h.className)}>
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line bg-white">
            {rows.map((r) => (
              <tr key={r.key}>
                {r.cells.map((c, i) => (
                  <td key={i} className={cn("px-4 py-3 align-top text-ink-muted", c.className)}>
                    {c.node}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Office address as the legal pages print it. */
export const HQ_ADDRESS = (
  <>
    9775 Fairway Drive, Suite C
    <br />
    Powell, OH 43065
  </>
);

export const IconTrash = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 11v5.5M13.5 11v5.5" />
  </Svg>
);

/** Accessibility: the universal access figure. */
export const IconAccess = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="4.5" r="1.8" />
    <path d="M4.5 8.5c2.4.7 4.9 1 7.5 1s5.1-.3 7.5-1M12 9.5v5M12 14.5 9 20.5M12 14.5l3 6" />
  </Svg>
);

/** Cookies: a biscuit with two chips. */
export const IconCookie = (p: IconProps) => (
  <Svg {...p}>
    <path d="M20.5 12.5A8.5 8.5 0 1 1 11.5 3.5a3 3 0 0 0 3.5 3.5 3 3 0 0 0 3 3 2.5 2.5 0 0 0 2.5 2.5Z" />
    <path d="M8.5 10.5h.01M10.5 15.5h.01M15 14h.01" strokeWidth={2.2} />
  </Svg>
);
