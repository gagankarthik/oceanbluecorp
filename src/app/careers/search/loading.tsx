/* Route-transition skeleton for the job search page. Mirrors the real layout
   (hero band → filter bar → result rows) so the page does not visibly reflow
   once the data lands. Server component: no JS shipped. */
export default function JobSearchLoading() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero band */}
      <div className="w-full bg-[var(--hz-ink)]">
        <div className="mx-auto max-w-7xl px-6 pt-28 pb-14 sm:px-8 sm:pt-32 sm:pb-16">
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-28 rounded bg-white/15" />
            <div className="h-9 w-full max-w-md rounded-lg bg-white/20 sm:h-12" />
            <div className="h-4 w-full max-w-sm rounded bg-white/10" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 sm:py-14">
        {/* Filter bar */}
        <div className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="h-10 flex-1 rounded-lg bg-slate-100" />
            <div className="h-10 w-full rounded-lg bg-slate-100 sm:w-44" />
            <div className="h-10 w-full rounded-lg bg-slate-100 sm:w-36" />
          </div>
        </div>

        {/* Result rows */}
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-5 w-3/4 max-w-xs rounded bg-slate-200" />
                  <div className="flex flex-wrap gap-2">
                    <div className="h-3.5 w-24 rounded bg-slate-100" />
                    <div className="h-3.5 w-20 rounded bg-slate-100" />
                    <div className="h-3.5 w-28 rounded bg-slate-100" />
                  </div>
                  <div className="h-3.5 w-full max-w-lg rounded bg-slate-100" />
                </div>
                <div className="h-9 w-full rounded-full bg-[var(--hz-cobalt-100)] sm:w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading open positions…
      </span>
    </div>
  );
}
