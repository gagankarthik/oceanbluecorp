"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { CONTAINER, SECTION_Y } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { IconArrowRight, IconX, IconMail, type IconProps } from "@/components/site/icons";
import { IconPhone } from "@/components/site/legal/doc";
import { cn } from "@/lib/utils";
import { FAQS, TOPICS, type Faq, type Topic } from "./questions";

/* The page is a filtered list, not an accordion.
 *
 * An accordion hides every answer behind a click and makes the page
 * unsearchable by eye, which is the opposite of what someone scanning for one
 * fact needs. Everything is open; search and the topic filter narrow it, and
 * with no filter the answers sit under their topic headings.
 *
 * The search is real, over both question and answer text. It exists because
 * there are enough entries here to justify one, and it is the only search box
 * on the marketing site for exactly that reason. */

const IconSearch = ({ size = 16, ...rest }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.4-4.4" />
  </svg>
);

const slug = (t: string) => t.toLowerCase().replace(/[^a-z]+/g, "-");

function Answer({ f }: { f: Faq }) {
  return (
    <div className="grid gap-3 py-7 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-8">
      <dt className="type-title-lg font-semibold text-ink">{f.q}</dt>
      <dd className="type-body text-ink-muted">
        {f.a}
        {f.href && (
          <Link href={f.href} className="group ml-2 inline-flex items-center gap-1 font-semibold whitespace-nowrap text-cobalt">
            More
            <IconArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </dd>
    </div>
  );
}

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<Topic | "All">("All");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FAQS.filter((f) => {
      if (topic !== "All" && f.topic !== topic) return false;
      if (!q) return true;
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    });
  }, [query, topic]);

  const countFor = (t: Topic | "All") => (t === "All" ? FAQS.length : FAQS.filter((f) => f.topic === t).length);
  const grouped = topic === "All" && !query.trim();

  return (
    <>
      <PageHero
        eyebrow="FAQ"
        title="Answers, before you have to ask."
        subtitle="How we engage, how fast we move, what we hold on security and what we do not. If your question is not here, a person will answer it."
        image={IMG.contactHero}
      />

      <section data-tone="white" className={`bg-white ${SECTION_Y}`}>
        <div className={`${CONTAINER} grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-14`}>
          {/* Filters. Sticky on desktop so the topic list stays reachable while
              the answers scroll past it; chips above the list on phones. */}
          <div>
            <div className="lg:sticky lg:top-28">
              <label htmlFor="faq-search" className="block type-label font-semibold text-ink">
                Search
              </label>
              <div className="relative mt-3">
                <IconSearch size={16} className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-subtle" />
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="shortlist, security, benefits…"
                  className="h-12 w-full rounded-xl border border-line-strong bg-white pr-11 pl-10 type-body text-ink placeholder:text-ink-subtle focus:border-cobalt focus:ring-4 focus:ring-cobalt-tint focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-ink-subtle hover:bg-paper hover:text-ink"
                  >
                    <IconX size={15} />
                  </button>
                )}
              </div>

              <p className="mt-8 type-label font-semibold text-ink">Topics</p>
              <ul className="mt-3 flex flex-wrap gap-2 lg:block lg:space-y-1">
                {(["All", ...TOPICS] as const).map((t) => {
                  const active = topic === t;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => setTopic(t)}
                        aria-pressed={active}
                        className={cn(
                          "flex min-h-11 items-center justify-between gap-3 rounded-full border px-4 type-body-sm font-medium transition-colors lg:w-full lg:rounded-xl lg:border-transparent lg:px-3",
                          active ? "border-cobalt bg-cobalt text-white lg:border-transparent lg:bg-paper lg:text-ink" : "border-line-strong text-ink-muted hover:text-ink lg:hover:bg-paper",
                        )}
                      >
                        {t}
                        <span className={cn("type-caption tabular-nums", active ? "text-white/80 lg:text-ink-subtle" : "text-ink-subtle")}>{countFor(t)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Answers */}
          <div className="min-w-0">
            <p className="type-body-sm text-ink-subtle" aria-live="polite">
              {results.length} {results.length === 1 ? "question" : "questions"}
              {topic !== "All" && ` in ${topic}`}
              {query && ` matching “${query}”`}
            </p>

            {results.length === 0 ? (
              /* No-results, with a way out rather than a dead end. */
              <div className="mt-6 rounded-2xl border border-line bg-paper p-8 text-center sm:p-10">
                <p className="type-title-lg font-semibold text-ink">Nothing matches that.</p>
                <p className="mx-auto mt-3 max-w-[42ch] type-body text-ink-muted">
                  Try a broader term, or clear the filters and browse the full list.
                  If it is not here, ask us directly.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      setTopic("All");
                    }}
                    className="inline-flex h-11 items-center rounded-full bg-cobalt px-5 type-label font-semibold text-white hover:bg-cobalt-deep"
                  >
                    Clear filters
                  </button>
                  <LinkButton href="/contact" variant="outline">
                    Ask us
                  </LinkButton>
                </div>
              </div>
            ) : grouped ? (
              TOPICS.map((t) => {
                const items = results.filter((f) => f.topic === t);
                if (!items.length) return null;
                return (
                  <section key={t} id={slug(t)} aria-labelledby={`${slug(t)}-h`} className="mt-10 scroll-mt-28 first:mt-6">
                    <h2 id={`${slug(t)}-h`} className="flex items-baseline gap-3 type-label font-semibold text-cobalt">
                      {t}
                      <span className="type-caption font-normal text-ink-subtle tabular-nums">{items.length}</span>
                    </h2>
                    <dl className="mt-2 divide-y divide-line border-y border-line">
                      {items.map((f) => (
                        <Answer key={f.q} f={f} />
                      ))}
                    </dl>
                  </section>
                );
              })
            ) : (
              <dl className="mt-6 divide-y divide-line border-y border-line">
                {results.map((f) => (
                  <Answer key={f.q} f={f} />
                ))}
              </dl>
            )}

            {/* Contact routes, ordered by how little effort each costs the
                reader: the fastest first. */}
            <div className="reveal mt-10 grid gap-6 rounded-2xl sm:mt-12 border border-line bg-paper p-7 sm:p-9 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
              <div>
                <h2 className="type-title-lg font-semibold text-ink">Still not answered?</h2>
                <p className="mt-2 max-w-[52ch] type-body text-ink-muted">
                  Call and someone picks up, or send a message and we will come back
                  to you. No switchboard and no ticket number.
                </p>
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[15px] font-semibold">
                  <a href="tel:+16148446925" className="inline-flex min-h-11 items-center gap-2 text-cobalt hover:underline">
                    <IconPhone size={16} /> +1 (614) 844-6925
                  </a>
                  <a href="mailto:hr@oceanbluecorp.com" className="inline-flex min-h-11 items-center gap-2 text-cobalt hover:underline">
                    <IconMail size={16} /> hr@oceanbluecorp.com
                  </a>
                </div>
              </div>
              <LinkButton href="/contact" variant="primary" size="lg">
                Send a message
              </LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
