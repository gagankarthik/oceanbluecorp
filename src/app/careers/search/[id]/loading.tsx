/* Job detail skeleton. This route does a DynamoDB read on the server before it
   can render anything, so without this the browser sat on the previous page
   with no feedback. Mirrors the detail layout: hero band, then body + a sticky
   apply card on desktop. */
export default function JobDetailLoading() {
  return (
    <div className="horizon w-full bg-[var(--hz-canvas)]">
      {/* Hero band */}
      <div className="w-full bg-[var(--hz-ink)]">
        <div className="mx-auto max-w-7xl px-6 pt-28 pb-14 sm:px-8 sm:pt-32 sm:pb-16">
          <div className="animate-pulse space-y-4">
            <div className="h-3 w-24 rounded bg-white/15" />
            <div className="h-9 w-full max-w-lg rounded-lg bg-white/20 sm:h-12" />
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="h-7 w-28 rounded-full bg-white/10" />
              <div className="h-7 w-24 rounded-full bg-white/10" />
              <div className="h-7 w-32 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 sm:px-8 sm:py-16 lg:grid-cols-12 lg:gap-14">
        {/* Body */}
        <div className="animate-pulse space-y-10 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section} className="space-y-3">
              <div className="h-5 w-40 rounded bg-slate-200" />
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-4/5 rounded bg-slate-100" />
              <div className="h-3.5 w-2/3 rounded bg-slate-100" />
            </div>
          ))}
        </div>

        {/* Apply card */}
        <div className="lg:col-span-4">
          <div className="animate-pulse rounded-2xl border border-[var(--hz-paper-line)]/80 bg-white p-6 lg:sticky lg:top-28">
            <div className="h-4 w-32 rounded bg-slate-200" />
            <div className="mt-5 space-y-3">
              <div className="h-3.5 w-full rounded bg-slate-100" />
              <div className="h-3.5 w-3/4 rounded bg-slate-100" />
            </div>
            <div className="mt-7 h-11 w-full rounded-full bg-[var(--hz-cobalt-100)]" />
            <div className="mt-3 h-11 w-full rounded-full bg-slate-100" />
          </div>
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading this position…
      </span>
    </div>
  );
}
