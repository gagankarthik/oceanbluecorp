"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, X } from "lucide-react";
import { Reveal } from "@/components/landing/motion/Primitives";
import { Cta } from "@/components/landing/ui";
import PageHero from "@/components/landing/PageHero";
import { IMG } from "@/components/landing/media";
import { FAQS, TOPICS, type Topic } from "./questions";

/* The page is a filtered list, not an accordion.
 *
 * An accordion hides every answer behind a click and makes the page
 * unsearchable by eye, which is the opposite of what someone scanning for one
 * fact needs. Everything is open; search and the topic filter narrow it.
 *
 * The search is real, over both question and answer text. It exists because
 * there are enough entries here to justify one, and it is the only search box
 * on the marketing site for exactly that reason. */

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

  const countFor = (t: Topic | "All") =>
    t === "All" ? FAQS.length : FAQS.filter((f) => f.topic === t).length;

  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      <PageHero
        eyebrow="FAQ"
        title="Answers, before you have to ask."
        subtitle="How we engage, how fast we move, what we hold on security and what we do not. If your question is not here, a person will answer it."
        image={IMG.contactHero}
      />

      <section className="w-full px-6 py-14 sm:px-10 sm:py-16 lg:px-16 lg:py-20 2xl:px-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Filters. Sticky on desktop so the topic list stays reachable
              while the answers scroll past it. */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-28">
              <label htmlFor="faq-search" className="hz-eyebrow block text-[var(--hz-text-subtle)]">
                Search
              </label>
              <div className="relative mt-4">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--hz-text-subtle)]"
                  strokeWidth={2}
                />
                <input
                  id="faq-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="shortlist, security, benefits…"
                  className="w-full rounded-lg border border-[var(--hz-line)] bg-white py-2.5 pl-10 pr-9 text-fine text-[var(--hz-text)] transition-all placeholder:text-[var(--hz-text-subtle)] focus:border-[var(--hz-cobalt)] focus:outline-none focus:ring-4 focus:ring-[var(--hz-cobalt-100)]"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label="Clear search"
                    className="hz-focus absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-[var(--hz-text-subtle)] hover:text-[var(--hz-text)]"
                  >
                    <X className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                )}
              </div>

              <p className="hz-eyebrow mt-8 block text-[var(--hz-text-subtle)]">Topics</p>
              <ul className="mt-4 space-y-1">
                {(["All", ...TOPICS] as const).map((t) => {
                  const active = topic === t;
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => setTopic(t)}
                        aria-pressed={active}
                        className={`hz-focus flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-fine font-medium transition-colors ${
                          active
                            ? "bg-[var(--hz-cobalt-100)] text-[var(--hz-cobalt)]"
                            : "text-[var(--hz-text-mute)] hover:bg-[var(--hz-surface-2)] hover:text-[var(--hz-text)]"
                        }`}
                      >
                        {t}
                        <span className="tabular-nums text-caption text-[var(--hz-text-subtle)]">
                          {countFor(t)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Answers */}
          <div className="lg:col-span-8 lg:col-start-5">
            <p className="text-fine text-[var(--hz-text-subtle)]" aria-live="polite">
              {results.length} {results.length === 1 ? "question" : "questions"}
              {topic !== "All" && ` in ${topic}`}
              {query && ` matching “${query}”`}
            </p>

            {results.length > 0 ? (
              <dl className="mt-6 divide-y divide-[var(--hz-line)] border-t border-[var(--hz-line)]">
                {results.map((f) => (
                  <div key={f.q} className="py-7">
                    <dt className="hz-display text-subhead text-[var(--hz-text)]">{f.q}</dt>
                    <dd className="mt-3 max-w-[68ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
                      {f.a}
                      {f.href && (
                        <Link
                          href={f.href}
                          className="hz-focus group ml-2 inline-flex items-center gap-1 font-semibold text-[var(--hz-cobalt)] whitespace-nowrap"
                        >
                          More
                          <ArrowRight
                            className="h-3.5 w-3.5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5"
                            strokeWidth={2}
                          />
                        </Link>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : (
              /* No-results, with a way out rather than a dead end. */
              <div className="mt-6 rounded-xl border border-[var(--hz-line)] bg-[var(--hz-surface-2)] p-8 text-center">
                <p className="hz-display text-subhead text-[var(--hz-text)]">
                  Nothing matches that.
                </p>
                <p className="mx-auto mt-3 max-w-[42ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
                  Try a broader term, or clear the filters and browse the full list.
                  If it is not here, ask us directly.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => { setQuery(""); setTopic("All"); }}
                    className="hz-focus rounded-full bg-[var(--hz-cobalt)] px-5 py-2.5 text-fine font-semibold text-white transition-colors hover:bg-[var(--hz-cobalt-600)]"
                  >
                    Clear filters
                  </button>
                  <Link
                    href="/contact"
                    className="hz-focus rounded-full border border-[var(--hz-line-2)] px-5 py-2.5 text-fine font-semibold text-[var(--hz-text)] transition-colors hover:border-[var(--hz-text)]"
                  >
                    Ask us
                  </Link>
                </div>
              </div>
            )}

            {/* Contact routes, ordered by how little effort each costs the
                reader: the fastest first. */}
            <Reveal className="mt-14 border-t border-[var(--hz-line)] pt-10">
              <h2 className="hz-display text-title text-[var(--hz-text)]">
                Still not answered?
              </h2>
              <p className="mt-3 max-w-[52ch] text-small leading-relaxed text-[var(--hz-text-mute)]">
                Call and someone picks up, or send a message and we will come back
                to you. No switchboard and no ticket number.
              </p>
              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3">
                <a
                  href="tel:+16148446925"
                  className="hz-focus text-small font-semibold text-[var(--hz-cobalt)] transition-opacity hover:opacity-75"
                >
                  +1 (614) 844-6925
                </a>
                <a
                  href="mailto:hr@oceanbluecorp.com"
                  className="hz-focus text-small font-semibold text-[var(--hz-cobalt)] transition-opacity hover:opacity-75"
                >
                  hr@oceanbluecorp.com
                </a>
                <Cta href="/contact" variant="ghostLight">Send a message</Cta>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
