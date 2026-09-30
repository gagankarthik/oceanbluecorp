"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { CONTAINER } from "@/components/site/sections";
import { LinkButton } from "@/components/site/button";
import { LineGrid } from "@/components/site/line-grid";
import {
  IconArrowRight, IconChevronDown, IconX, IconPin, IconSearch, IconCalendar, IconRefresh, IconMail, IconGlobe,
} from "@/components/site/icons";
import { IconFilter, IconMoney, IconCheckCircle } from "@/components/site/careers/careers-icons";
import { Select, type SelectOption } from "@/components/site/select";
import { workMode, EEO_STATEMENT, HR_EMAIL } from "@/lib/careers";
import type { PublicJob } from "@/lib/aws/dynamodb";
import { isPubliclyOpen } from "@/lib/job-status";
import { useAuth } from "@/lib/auth";

const ALL_DEPTS = "All Departments";
const ALL_TYPES = "All Types";
const ALL_LOCS = "All Locations";

const jobTypes = [ALL_TYPES, "full-time", "part-time", "contract", "contract-to-hire", "direct-hire", "managed-teams", "remote"];

const TYPE_LABEL: Record<string, string> = {
  "full-time": "Full-time",
  "part-time": "Part-time",
  contract: "Contract",
  "contract-to-hire": "Contract-to-hire",
  "direct-hire": "Direct hire",
  "managed-teams": "Managed teams",
  remote: "Remote",
};
const formatJobType = (type: string) => TYPE_LABEL[type] || type;

const PAGE_SIZE = 10;

type Sort = "newest" | "closing";

const timeAgo = (date: Date): string => {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const dueLabel = (dueDate?: string): { text: string; urgent: boolean } | null => {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return { text: "Closed", urgent: true };
  if (days === 0) return { text: "Closes today", urgent: true };
  if (days === 1) return { text: "Closes tomorrow", urgent: true };
  if (days <= 7) return { text: `${days} days left`, urgent: true };
  return { text: `Closes ${due.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`, urgent: false };
};

const isRemote = (job: PublicJob) => job.type === "remote" || (job.location || "").toLowerCase().includes("remote");

const scrollToResults = () => document.getElementById("openings")?.scrollIntoView({ behavior: "smooth", block: "start" });

type Facet = "dept" | "type" | "loc" | "remote";

/**
 * The job board. `initialJobs` is the public, open list rendered on the
 * server (see page.tsx), so the roles are in the HTML on first paint and
 * indexable. `null` means the server load failed; the board then fetches
 * from the API itself, with its loading and error states.
 */
export default function JobBoard({ initialJobs }: { initialJobs: PublicJob[] | null }) {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<PublicJob[]>(initialJobs ?? []);
  const [loading, setLoading] = useState(initialJobs === null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [dept, setDept] = useState(ALL_DEPTS);
  const [type, setType] = useState(ALL_TYPES);
  const [location, setLocation] = useState(ALL_LOCS);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Accept ?q= / ?department= / ?type= / ?remote=1 so /careers can deep-link
  // into a pre-filtered board. Read from window so the page needs no Suspense
  // boundary; type is matched against the known list, so junk is ignored.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q.slice(0, 80));
    const d = params.get("department");
    if (d) setDept(d);
    const t = params.get("type");
    if (t && jobTypes.includes(t)) setType(t);
    if (params.get("remote") === "1") setRemoteOnly(true);
  }, []);

  useEffect(() => {
    if (initialJobs !== null) return;
    (async () => {
      try {
        setLoading(true);
        // Anonymous callers already get live postings only; staff get everything, so filter here too.
        const res = await fetch("/api/jobs");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to fetch jobs");
        setJobs((data.jobs || []).filter((j: PublicJob) => isPubliclyOpen(j.status)));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch jobs");
      } finally {
        setLoading(false);
      }
    })();
  }, [initialJobs]);

  // The signed-in visitor's applications, for the "Applied" badge. Looked up by
  // id and by email, to catch applications submitted before they signed in.
  useEffect(() => {
    if (!isAuthenticated || (!user?.id && !user?.email)) return;
    (async () => {
      try {
        const urls: string[] = [];
        if (user?.id) urls.push(`/api/applications?userId=${user.id}`);
        if (user?.email) {
          urls.push(`/api/applications?userId=${encodeURIComponent(user.email)}`);
          urls.push(`/api/applications?email=${encodeURIComponent(user.email)}`);
        }
        const ids = new Set<string>();
        for (const res of await Promise.all(urls.map((u) => fetch(u)))) {
          if (!res.ok) continue;
          const data = await res.json();
          (data.applications || []).forEach((a: { jobId: string }) => a.jobId && ids.add(a.jobId));
        }
        setAppliedJobIds(ids);
      } catch (err) {
        console.error("Failed to fetch user applications:", err);
      }
    })();
  }, [isAuthenticated, user?.id, user?.email]);

  // Postings whose deadline has passed are not shown at all.
  const openJobs = useMemo(() => {
    const now = Date.now();
    return jobs.filter((j) => !j.submissionDueDate || new Date(j.submissionDueDate).getTime() >= now);
  }, [jobs]);

  // Departments as they actually appear on open roles, most roles first.
  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    openJobs.forEach((j) => j.department && counts.set(j.department, (counts.get(j.department) || 0) + 1));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([d]) => d);
  }, [openJobs]);

  // Every department on an open role, plus the one asked for in the URL if it
  // has no roles right now, so the control never lies.
  const deptList = useMemo(
    () => [...departments, ...(dept !== ALL_DEPTS && !departments.includes(dept) ? [dept] : [])],
    [departments, dept],
  );
  const typeList = useMemo(() => jobTypes.slice(1).filter((t) => openJobs.some((j) => j.type === t) || t === type), [openJobs, type]);
  const locations = useMemo(() => [ALL_LOCS, ...[...new Set(openJobs.map((j) => j.location))].filter(Boolean).sort()], [openJobs]);

  /** Every filter but `except`, so each facet's counts show what picking it would give. */
  const filterExcept = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (except: Facet | null) => openJobs.filter((j) =>
      (!q || [j.title, j.department, j.description, j.location].some((f) => (f || "").toLowerCase().includes(q)))
      && (except === "dept" || dept === ALL_DEPTS || j.department === dept)
      && (except === "type" || type === ALL_TYPES || j.type === type)
      && (except === "loc" || location === ALL_LOCS || j.location === location)
      && (except === "remote" || !remoteOnly || isRemote(j)));
  }, [openJobs, query, dept, type, location, remoteOnly]);

  const countBy = (list: PublicJob[], key: (j: PublicJob) => string) => {
    const counts: Record<string, number> = {};
    list.forEach((j) => (counts[key(j)] = (counts[key(j)] || 0) + 1));
    return counts;
  };
  const deptPool = useMemo(() => filterExcept("dept"), [filterExcept]);
  const typePool = useMemo(() => filterExcept("type"), [filterExcept]);
  const deptCounts = useMemo(() => countBy(deptPool, (j) => j.department), [deptPool]);
  const typeCounts = useMemo(() => countBy(typePool, (j) => j.type), [typePool]);

  const results = useMemo(() => [...filterExcept(null)].sort((a, b) => {
    if (sort === "closing") {
      const da = a.submissionDueDate ? new Date(a.submissionDueDate).getTime() : Infinity;
      const db = b.submissionDueDate ? new Date(b.submissionDueDate).getTime() : Infinity;
      return da - db;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }), [filterExcept, sort]);

  // Any change to what is being asked for starts the list again from the top.
  useEffect(() => setVisible(PAGE_SIZE), [query, dept, type, location, remoteOnly, sort]);

  const deptSelect: SelectOption[] = [ALL_DEPTS, ...deptList].map((d) => ({
    value: d,
    label: d === ALL_DEPTS ? "All departments" : d,
    hint: loading ? undefined : d === ALL_DEPTS ? deptPool.length : deptCounts[d] || 0,
  }));
  const locSelect: SelectOption[] = locations.map((l) => ({ value: l, label: l === ALL_LOCS ? "All locations" : l }));
  const typeSelect: SelectOption[] = [ALL_TYPES, ...typeList].map((t) => ({ value: t, label: t === ALL_TYPES ? "All types" : formatJobType(t) }));

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheetOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const resetFacets = () => {
    setDept(ALL_DEPTS);
    setType(ALL_TYPES);
    setLocation(ALL_LOCS);
    setRemoteOnly(false);
  };
  const clearAll = () => {
    setQuery("");
    resetFacets();
  };

  const chips = [
    dept !== ALL_DEPTS && { label: dept, clear: () => setDept(ALL_DEPTS) },
    type !== ALL_TYPES && { label: formatJobType(type), clear: () => setType(ALL_TYPES) },
    location !== ALL_LOCS && { label: location, clear: () => setLocation(ALL_LOCS) },
    remoteOnly && { label: "Remote only", clear: () => setRemoteOnly(false) },
    query.trim() && { label: `“${query.trim()}”`, clear: () => setQuery("") },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  const facetCount = [dept !== ALL_DEPTS, type !== ALL_TYPES, location !== ALL_LOCS, remoteOnly].filter(Boolean).length;

  return (
    <>
      {/* Hero: the search is the page's first action, so it lives here. */}
      <section className="relative isolate overflow-hidden border-b border-line bg-white">
        <LineGrid />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-[radial-gradient(55%_70%_at_50%_0%,var(--color-cobalt-tint),transparent)]" />
        <div className={cn(CONTAINER, "pt-28 pb-12 sm:pt-32 sm:pb-14 lg:pt-36 lg:pb-16")}>
          <div className="mx-auto max-w-[860px] text-center">
            <h1 className="rise type-headline-lg font-semibold text-ink" style={{ animationDelay: "80ms" }}>
              Find your next role at Ocean Blue
            </h1>
            <p className="rise mx-auto mt-4 max-w-[56ch] type-body-lg text-ink-muted" style={{ animationDelay: "160ms" }}>
              IT, engineering and delivery roles across our practices and client teams.
              Search by title or skill, then narrow by team, type and location.
            </p>
          </div>

          <form
            role="search"
            onSubmit={(e) => { e.preventDefault(); scrollToResults(); }}
            className="rise mx-auto mt-9 flex max-w-[860px] flex-col gap-2 rounded-[28px] border border-line bg-white p-2 shadow-overlay sm:flex-row sm:items-center sm:rounded-full"
            style={{ animationDelay: "240ms" }}
          >
            <div className="relative min-w-0 flex-1">
              <label htmlFor="job-search" className="sr-only">Search jobs by title, skill or keyword</label>
              <IconSearch size={20} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-ink-subtle" />
              <input
                id="job-search"
                type="search"
                autoComplete="off"
                placeholder="Job title, skill or keyword"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-14 w-full rounded-full bg-transparent pr-4 pl-13 type-body-lg text-ink placeholder:text-ink-subtle focus:outline-none"
              />
            </div>
            <span aria-hidden className="hidden h-8 w-px bg-line sm:block" />
            <Select
              id="hero-loc"
              label="Location"
              hideLabel
              value={location}
              onValueChange={setLocation}
              options={locSelect}
              className="sm:w-56 [&_button]:border-0 [&_button]:shadow-none"
            />
            <button
              type="submit"
              className="inline-flex h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-cobalt px-7 text-[16px] font-semibold text-white transition-colors hover:bg-cobalt-deep"
            >
              Search <IconArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>

      <section className="min-h-[60vh] scroll-mt-20 bg-paper" id="openings">
        <div className={cn(CONTAINER, "py-10 sm:py-12")}>
          <div className="grid gap-8 lg:grid-cols-[272px_minmax(0,1fr)] xl:gap-10">
            {/* Facets: desktop sidebar. Phones get the same controls in a sheet. */}
            <aside className="hidden lg:block lg:sticky lg:top-[96px] lg:self-start" aria-label="Filter positions">
              <div className="rounded-2xl border border-line bg-white">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <p className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <IconFilter size={16} /> Filters
                  </p>
                  {facetCount > 0 && (
                    <button type="button" onClick={resetFacets} className="type-caption font-semibold text-cobalt hover:underline underline-offset-4">
                      Reset
                    </button>
                  )}
                </div>

                <Facet title="Department">
                  <FacetOption label="All departments" count={deptPool.length} on={dept === ALL_DEPTS} onClick={() => setDept(ALL_DEPTS)} />
                  {deptList.map((d) => (
                    <FacetOption key={d} label={d} count={deptCounts[d] || 0} on={dept === d} onClick={() => setDept(dept === d ? ALL_DEPTS : d)} />
                  ))}
                </Facet>

                <Facet title="Job type">
                  <FacetOption label="All types" count={typePool.length} on={type === ALL_TYPES} onClick={() => setType(ALL_TYPES)} />
                  {typeList.map((t) => (
                    <FacetOption key={t} label={formatJobType(t)} count={typeCounts[t] || 0} on={type === t} onClick={() => setType(type === t ? ALL_TYPES : t)} />
                  ))}
                </Facet>

                <div className="flex items-center justify-between px-5 py-4">
                  <span className="inline-flex items-center gap-2 type-body-sm font-medium text-ink">
                    <IconGlobe size={16} className="text-ink-subtle" /> Remote only
                  </span>
                  <Switch on={remoteOnly} onChange={setRemoteOnly} label="Remote only" />
                </div>
              </div>

              <div className="mt-4 rounded-2xl bg-ink p-6 text-white">
                <span className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                  <IconMail size={18} />
                </span>
                <h2 className="mt-4 text-[17px] font-semibold">Don&rsquo;t see the right role?</h2>
                <p className="mt-1.5 type-body-sm text-white/80">Send your resume and we&rsquo;ll match you when one opens.</p>
                <a
                  href={`mailto:${HR_EMAIL}?subject=${encodeURIComponent("Resume: role I'm looking for")}`}
                  className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-white type-label font-semibold text-ink transition-colors hover:bg-cobalt-tint"
                >
                  Email your resume
                </a>
              </div>
            </aside>

            {/* Results */}
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <p className="type-body text-ink-muted" role="status" aria-live="polite">
                  {loading ? "Loading positions…" : (
                    <>
                      <span className="font-semibold tabular-nums text-ink">{results.length}</span>{" "}
                      {results.length === 1 ? "position" : "positions"}{chips.length ? " match your search" : ""}
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSheetOpen(true)}
                    className="relative inline-flex h-10 items-center gap-2 rounded-full border border-line-strong bg-white px-4 type-body-sm font-semibold text-ink lg:hidden"
                    aria-haspopup="dialog"
                  >
                    <IconFilter size={16} /> Filters
                    {facetCount > 0 && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-cobalt type-caption font-semibold text-white">{facetCount}</span>
                    )}
                  </button>
                  <div role="radiogroup" aria-label="Sort positions" className="inline-flex h-10 items-center rounded-full border border-line bg-white p-1">
                    {([["newest", "Newest"], ["closing", "Closing soon"]] as const).map(([v, label]) => (
                      <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={sort === v}
                        onClick={() => setSort(v)}
                        className={cn(
                          "h-8 rounded-full px-3.5 type-body-sm font-medium transition-colors",
                          sort === v ? "bg-ink text-white" : "text-ink-muted hover:text-ink",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {chips.length > 0 && !loading && (
                <ul className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
                  {chips.map((c) => (
                    <li key={c.label}>
                      <button
                        type="button"
                        onClick={c.clear}
                        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-cobalt-tint pr-2.5 pl-3 type-caption font-medium text-cobalt-deep hover:bg-cobalt/15"
                      >
                        {c.label}
                        <IconX size={12} />
                        <span className="sr-only">Remove filter</span>
                      </button>
                    </li>
                  ))}
                  <li>
                    <button type="button" onClick={clearAll} className="h-8 px-2 type-caption font-semibold text-ink underline-offset-4 hover:underline">
                      Clear all
                    </button>
                  </li>
                </ul>
              )}

              {loading ? (
                <ul className="space-y-3" aria-hidden>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <li key={i} className="animate-pulse rounded-2xl border border-line bg-white p-5 sm:p-6" style={{ animationDelay: `${i * 70}ms` }}>
                      <div className="h-5 w-2/3 max-w-sm rounded bg-paper-deep" />
                      <div className="mt-3 flex gap-3">
                        <div className="h-4 w-24 rounded bg-paper" />
                        <div className="h-4 w-20 rounded bg-paper" />
                        <div className="h-4 w-28 rounded bg-paper" />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : error ? (
                <div className="rounded-2xl border border-line bg-white p-10 text-center sm:p-12">
                  <p className="type-title-lg font-semibold text-ink">We couldn&rsquo;t load the positions.</p>
                  <p className="mx-auto mt-2 max-w-sm type-body text-ink-muted">{error}</p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-cobalt px-5 type-label font-semibold text-white hover:bg-cobalt-deep"
                  >
                    <IconRefresh size={16} />
                    Try again
                  </button>
                </div>
              ) : results.length > 0 ? (
                <>
                  <ul className="space-y-3">
                    {results.slice(0, visible).map((job, i) => (
                      <li key={job.id} className="rise" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                        <JobRow job={job} applied={appliedJobIds.has(job.id)} />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-8 flex flex-col items-center gap-3">
                    <div className="h-1 w-40 overflow-hidden rounded-full bg-line" aria-hidden>
                      <div className="h-full rounded-full bg-ink transition-[width] duration-500" style={{ width: `${(Math.min(visible, results.length) / results.length) * 100}%` }} />
                    </div>
                    <p className="type-body-sm text-ink-subtle">
                      Showing {Math.min(visible, results.length)} of {results.length}
                    </p>
                    {visible < results.length && (
                      <button
                        type="button"
                        onClick={() => setVisible((v) => v + PAGE_SIZE)}
                        className="inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-white px-6 text-[15px] font-semibold text-ink hover:border-cobalt"
                      >
                        Show more positions
                        <IconChevronDown size={16} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-line-strong bg-white p-10 text-center sm:p-14">
                  <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-paper text-ink-subtle">
                    <IconSearch size={24} />
                  </span>
                  <h2 className="mt-5 type-title-lg font-semibold text-ink">No positions match</h2>
                  <p className="mx-auto mt-2 max-w-sm type-body text-ink-muted">Try a broader search, or clear the filters to see every open role.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={clearAll}
                      className="inline-flex h-11 items-center rounded-full bg-cobalt px-5 type-label font-semibold text-white hover:bg-cobalt-deep"
                    >
                      Clear filters
                    </button>
                    <a
                      href={`mailto:${HR_EMAIL}?subject=${encodeURIComponent("Resume: role I'm looking for")}`}
                      className="inline-flex h-11 items-center rounded-full border border-line-strong px-5 type-label font-semibold text-ink hover:border-ink"
                    >
                      Email your resume
                    </a>
                  </div>
                </div>
              )}

              {/* Closing strip: why work here, and the fine print. */}
              <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-line bg-white p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
                <div>
                  <h2 className="text-[17px] font-semibold text-ink">Working at Ocean Blue</h2>
                  <p className="mt-1 type-body-sm text-ink-muted">How we work, what we offer, and the teams you could join.</p>
                </div>
                <LinkButton href="/careers" variant="outline" className="shrink-0">
                  Life at Ocean Blue <IconArrowRight size={14} />
                </LinkButton>
              </div>
              <p className="mt-4 type-caption text-ink-subtle">
                {EEO_STATEMENT} Need an accommodation during hiring? Tell your recruiter and we will arrange it.{" "}
                <Link href="/contact" className="font-semibold text-ink underline underline-offset-4 hover:text-cobalt">Contact us</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Phone filter sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-[10000] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-ink/40" onClick={() => setSheetOpen(false)} />
          <div className="rise absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-6 pb-8">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" aria-hidden />
            <div className="flex items-center justify-between">
              <h2 id="sheet-title" className="type-title-lg font-semibold text-ink">
                Filters
              </h2>
              <button type="button" onClick={() => setSheetOpen(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-paper" aria-label="Close">
                <IconX size={18} />
              </button>
            </div>
            <div className="mt-6 space-y-5">
              <Select id="s-dept" label="Department" value={dept} onValueChange={setDept} options={deptSelect} shape="field" />
              <Select id="s-loc" label="Location" value={location} onValueChange={setLocation} options={locSelect} shape="field" />
              <Select id="s-type" label="Job type" value={type} onValueChange={setType} options={typeSelect} shape="field" />
              <div className="flex items-center justify-between border-t border-line pt-5">
                <span className="type-body font-medium text-ink">Remote only</span>
                <Switch on={remoteOnly} onChange={setRemoteOnly} label="Remote only" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <button type="button" onClick={resetFacets} className="h-12 rounded-full border border-line-strong text-[15px] font-semibold text-ink">
                Reset
              </button>
              <button type="button" onClick={() => setSheetOpen(false)} className="h-12 rounded-full bg-cobalt text-[15px] font-semibold text-white">
                Show {results.length}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Facet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line px-3 py-4">
      <legend className="sr-only">{title}</legend>
      <p aria-hidden className="mb-2 px-2 type-caption font-semibold tracking-wide text-ink-subtle uppercase">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </fieldset>
  );
}

function FacetOption({ label, count, on, onClick }: { label: string; count: number; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      disabled={!on && count === 0}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left type-body-sm transition-colors disabled:opacity-40",
        on ? "bg-cobalt-tint font-semibold text-cobalt-deep" : "text-ink-muted hover:bg-paper hover:text-ink",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          on ? "border-cobalt bg-cobalt" : "border-line-strong bg-white",
        )}
      >
        {on && <span className="size-1.5 rounded-full bg-white" />}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className={cn("tabular-nums type-caption", on ? "text-cobalt-deep" : "text-ink-subtle")}>{count}</span>
    </button>
  );
}

function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn("relative h-6 w-10 shrink-0 rounded-full transition-colors", on ? "bg-cobalt" : "bg-line-strong")}
    >
      <span className={cn("absolute top-1 left-0 size-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-5" : "translate-x-1")} />
    </button>
  );
}

function JobRow({ job, applied }: { job: PublicJob; applied: boolean }) {
  const due = dueLabel(job.submissionDueDate);
  const mode = workMode(job);
  return (
    <Link
      href={`/careers/search/${job.id}`}
      className="group grid gap-4 rounded-2xl border border-line bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-line-strong hover:shadow-raised sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6 sm:p-6"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="type-title font-semibold break-words text-ink transition-colors group-hover:text-cobalt">{job.title}</h3>
          {mode && <span className="rounded-full bg-paper px-2.5 py-0.5 type-caption font-semibold text-ink-muted">{mode}</span>}
          {applied && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-container px-2 py-0.5 type-caption font-semibold text-success">
              <IconCheckCircle size={13} />
              Applied
            </span>
          )}
        </div>
        <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 type-body-sm text-ink-muted">
          <li>{job.department}</li>
          <li className="inline-flex items-center gap-1.5">
            <IconPin size={14} className="text-ink-subtle" />
            {job.location}
          </li>
          <li>{formatJobType(job.type)}</li>
          {job.salary && (
            <li className="inline-flex items-center gap-1.5">
              <IconMoney size={14} className="text-ink-subtle" />
              {job.salary.currency}
              {job.salary.min.toLocaleString()} – {job.salary.currency}
              {job.salary.max.toLocaleString()}
            </li>
          )}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line pt-4 sm:justify-end sm:border-t-0 sm:pt-0">
        <span className="flex flex-col gap-1 type-caption sm:items-end">
          <span className="text-ink-subtle">Posted {timeAgo(new Date(job.createdAt)).toLowerCase()}</span>
          {due && (
            <span className={cn("inline-flex items-center gap-1 font-medium", due.urgent ? "text-warning" : "text-ink-subtle")}>
              <IconCalendar size={13} />
              {due.text}
            </span>
          )}
        </span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line text-ink transition-colors group-hover:border-cobalt group-hover:bg-cobalt group-hover:text-white">
          <IconArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
