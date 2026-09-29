/* Job detail skeleton. This route reads DynamoDB on the server before it can
   render, so without this the browser sat on the previous page with no
   feedback. Mirrors the detail layout: header, then body and a sticky rail. */
export default function JobDetailLoading() {
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="mx-auto w-full max-w-[1240px] animate-pulse px-4 pt-28 pb-10 sm:px-6 sm:pt-32 sm:pb-12 lg:pt-36">
          <div className="h-4 w-36 rounded bg-paper-deep" />
          <div className="mt-8 h-4 w-24 rounded bg-cobalt-tint" />
          <div className="mt-4 h-10 w-full max-w-xl rounded-lg bg-paper-deep sm:h-12" />
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="h-4 w-24 rounded bg-paper" />
            <div className="h-4 w-32 rounded bg-paper" />
            <div className="h-4 w-28 rounded bg-paper" />
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1240px] gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-14">
        <div className="animate-pulse space-y-10 lg:col-span-8">
          {Array.from({ length: 3 }).map((_, section) => (
            <div key={section} className="space-y-3">
              <div className="h-6 w-48 rounded bg-paper-deep" />
              <div className="h-4 w-full rounded bg-paper" />
              <div className="h-4 w-full rounded bg-paper" />
              <div className="h-4 w-4/5 rounded bg-paper" />
              <div className="h-4 w-2/3 rounded bg-paper" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-4">
          <div className="animate-pulse rounded-2xl border border-line bg-white p-6 lg:sticky lg:top-28">
            <div className="h-12 w-full rounded-full bg-paper-deep" />
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="h-11 rounded-full bg-paper" />
              <div className="h-11 rounded-full bg-paper" />
            </div>
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded bg-paper" />
              <div className="h-4 w-3/4 rounded bg-paper" />
            </div>
          </div>
        </div>
      </div>

      <span className="sr-only" role="status" aria-live="polite">
        Loading this position…
      </span>
    </>
  );
}
