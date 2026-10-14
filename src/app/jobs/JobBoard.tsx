"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Job } from "@/lib/jobs";
import { jobFacts } from "@/lib/job-facts";

const ALL = "All";
const PAGE = 10;
const HEADER = 72;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// From the date part only, so server and browser print the same day
const shortDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};
const daysUntil = (iso: string, now: Date) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  const end = new Date(y, m - 1, d);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((end.getTime() - today.getTime()) / 86_400_000);
};

function unique(values: string[]) {
  return [ALL, ...Array.from(new Set(values.filter(Boolean))).sort()];
}

export default function JobBoard({ jobs }: { jobs: Job[] }) {
  const [query, setQuery] = useState("");
  const [practice, setPractice] = useState(ALL);
  const [workplace, setWorkplace] = useState(ALL);
  const [type, setType] = useState(ALL);
  const [sort, setSort] = useState<"newest" | "closing">("newest");
  const [shown, setShown] = useState(PAGE);
  // Boxed at rest; goes edge to edge only once it is pinned under the header
  const barRef = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const check = () => setStuck(!!barRef.current && barRef.current.getBoundingClientRect().top <= HEADER + 1 && window.scrollY > 0);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, []);
  // A new search, filter or sort starts again from the first page
  useEffect(() => setShown(PAGE), [query, practice, workplace, type, sort]);
  // Set after mount: "closes in N days" depends on the visitor's clock
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  // Set when the search arrived in the link (?q=), so the board can say it is filtered
  const [linked, setLinked] = useState("");

  // ?q= seeds the search (the careers practice tiles link here). Read after
  // mount so the page stays static and ISR'd.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) {
      setQuery(q);
      setLinked(q);
    }
  }, []);

  const practices = unique(jobs.map((j) => j.practice));
  const workplaces = unique(jobs.map((j) => j.workplace));
  const types = unique(jobs.map((j) => j.type));

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = jobs.filter(
      (j) =>
        (practice === ALL || j.practice === practice) &&
        (workplace === ALL || j.workplace === workplace) &&
        (type === ALL || j.type === type) &&
        (!q || `${j.ref ?? ""} ${j.title} ${j.location} ${j.summary} ${j.practice} ${j.workplace}`.toLowerCase().includes(q)),
    );
    // Closing soon: nearest deadline first, postings without one last
    return sort === "closing"
      ? [...list].sort((a, b) => (a.closes ?? "9999").localeCompare(b.closes ?? "9999"))
      : [...list].sort((a, b) => b.posted.localeCompare(a.posted));
  }, [jobs, query, practice, workplace, type, sort]);

  const select =
    "mt-2 w-full min-h-12 appearance-none bg-mist-0 px-4 text-navy-900 max-md:text-base focus:outline-2 focus:outline-offset-2 focus:outline-ocean-600";

  const remoteOnly = workplace === "Remote";
  const hasRemote = workplaces.includes("Remote");
  // Phones: the filters fold behind a button so the pinned bar stays one row
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = [practice, workplace, type].filter((v) => v !== ALL).length;

  const clear = () => {
    setLinked("");
    setQuery("");
    setPractice(ALL);
    setWorkplace(ALL);
    setType(ALL);
  };

  return (
    <div>
      {/* Pinned under the 72px header so the filters stay in reach; full-bleed only while pinned */}
      <div
        ref={barRef}
        className={`sticky top-[72px] z-30 bg-mist-100 transition-[margin,padding] duration-200 motion-reduce:transition-none ${
          stuck ? "-mx-4 border-b border-mist-200 px-4 md:-mx-7 md:px-7 xl:-mx-10 xl:px-10" : "px-5 md:px-6"
        }`}
      >
      <form role="search" onSubmit={(e) => e.preventDefault()} className="grid gap-4 py-3 md:grid-cols-[2fr_1fr_1fr_1fr_auto] md:items-end md:py-6">
        <div className="flex items-end gap-2">
          <label className="min-w-0 flex-1 text-small font-medium">
            <span className="max-md:sr-only">Search roles</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Job title, skill, city or job ID"
              className={`${select} placeholder:text-mist-500 max-md:mt-0`}
            />
          </label>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
            aria-controls="job-filters"
            className={`inline-flex min-h-12 shrink-0 items-center gap-2 px-4 font-medium focus:outline-2 focus:outline-offset-2 focus:outline-ocean-600 md:hidden ${
              filtersOpen ? "bg-navy-900 text-white" : "bg-mist-0 text-navy-900"
            }`}
          >
            Filters
            {activeFilters > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-ocean-600 text-caption tabular-nums text-white">{activeFilters}</span>
            )}
          </button>
        </div>
        <div id="job-filters" className={`${filtersOpen ? "grid" : "hidden"} grid-cols-2 gap-x-2 gap-y-3 pb-2 max-md:[&_select]:mt-1 max-md:[&_select]:min-h-11 md:contents`}>
        <label className="text-caption font-medium md:text-small">
          Practice
          <select value={practice} onChange={(e) => setPractice(e.target.value)} className={select}>
            {practices.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-caption font-medium md:text-small">
          Workplace
          <select value={workplace} onChange={(e) => setWorkplace(e.target.value)} className={select}>
            {workplaces.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        <label className="text-caption font-medium md:text-small">
          Job type
          <select value={type} onChange={(e) => setType(e.target.value)} className={select}>
            {types.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </label>
        {hasRemote && (
          <label className="flex min-h-11 w-fit self-end md:min-h-12 cursor-pointer items-center gap-3 whitespace-nowrap text-caption font-medium md:text-small">
            <input
              type="checkbox"
              checked={remoteOnly}
              onChange={(e) => setWorkplace(e.target.checked ? "Remote" : ALL)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className="relative h-6 w-11 shrink-0 rounded-full bg-mist-300 transition-colors peer-checked:bg-ocean-600 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ocean-600 after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5"
            />
            Remote only
          </label>
        )}
        </div>
      </form>
      </div>

      {linked && query === linked && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-tide-100 px-5 py-4">
          <p>
            Showing roles matching <span className="font-semibold">&ldquo;{linked}&rdquo;</span>.
          </p>
          <button type="button" onClick={clear} className="font-medium text-ocean-700 underline underline-offset-4">
            Show all openings
          </button>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
      <p aria-live="polite" className="text-mist-600">
        {results.length === 1 ? "1 opening" : `${results.length} openings`}
        {results.length !== jobs.length && (
          <>
            {" "}
            <button type="button" onClick={clear} className="ml-2 font-medium text-ocean-700 underline underline-offset-4">
              Clear filters
            </button>
          </>
        )}
      </p>
        <label className="flex items-center gap-3 text-small font-medium">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as "newest" | "closing")}
            className="min-h-11 appearance-none bg-mist-100 px-4 pr-9 text-navy-900 focus:outline-2 focus:outline-offset-2 focus:outline-ocean-600"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='%230b2e46' stroke-width='1.8'%3E%3Cpath d='m4 6 4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", backgroundSize: "1rem" }}
          >
            <option value="newest">Newest first</option>
            <option value="closing">Closing soon</option>
          </select>
        </label>
      </div>

      {results.length === 0 ? (
        <div className="mt-6 bg-mist-100 p-8">
          <p className="text-title font-medium">
            {jobs.length ? "No openings match those filters." : "No open roles right now."}
          </p>
          <p className="mt-2 text-mist-600">Try a broader search, or send us your resume and we will contact you when a role fits.</p>
        </div>
      ) : (
        <>
        <ul className="mt-6 grid gap-2">
          {results.slice(0, shown).map((j) => (
            <li key={j.slug}>
              <Link
                href={`/jobs/${j.slug}`}
                className="group grid gap-4 bg-mist-0 p-6 [overflow-wrap:anywhere] transition-colors hover:bg-tide-100 md:grid-cols-[1fr_auto] md:items-center md:p-7"
              >
                <span className="min-w-0">
                  {j.ref && <span className="mb-1 block text-small font-medium tabular-nums text-mist-600">Job ID {j.ref}</span>}
                  <span className="display block text-head-sm group-hover:text-ocean-700">{j.title}</span>
                  <span className="mt-2 block max-w-measure">{j.summary}</span>
                  <span className="mt-3 flex flex-wrap gap-2 text-small">
                    {jobFacts(j).map((t) => (
                      <span key={t} className="bg-mist-100 px-2.5 py-1 text-navy-900">
                        {t}
                      </span>
                    ))}
                    {j.closes && <ClosingChip closes={j.closes} now={now} />}
                  </span>
                </span>
                <span className="shrink-0">
                  <span className="sr-only">View and apply for {j.title}</span>
                  <span
                    aria-hidden
                    className="grid size-12 place-items-center rounded-full bg-mist-0 text-ocean-700 ring-1 ring-inset ring-ocean-200 transition-[background-color,color,transform] duration-300 group-hover:translate-x-1 group-hover:bg-ocean-600 group-hover:text-white"
                  >
                    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 10h12M11 5l5 5-5 5" />
                    </svg>
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {results.length > shown && (
          <div className="mt-8 flex flex-col items-center gap-3">
            <p className="text-small text-mist-600">
              Showing {shown} of {results.length}
            </p>
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="inline-flex min-h-12 items-center bg-navy-900 px-7 font-medium text-white btn-fill btn-fill-navy active:scale-[0.98]"
            >
              Load {Math.min(PAGE, results.length - shown)} more
            </button>
          </div>
        )}
        </>
      )}
    </div>
  );
}

/** The deadline, flagged once it is a week or less away */
function ClosingChip({ closes, now }: { closes: string; now: Date | null }) {
  const days = now ? daysUntil(closes, now) : null;
  const soon = days !== null && days >= 0 && days <= 7;
  const label = !soon ? `Closes ${shortDate(closes)}` : days === 0 ? "Closes today" : days === 1 ? "Closes tomorrow" : `Closes in ${days} days`;
  return <span className={`px-2.5 py-1 font-medium ${soon ? "bg-buoy-300 text-navy-950" : "bg-tide-100 text-navy-900"}`}>{label}</span>;
}
