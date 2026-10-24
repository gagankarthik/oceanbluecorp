import { HeaderSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Help: header, get-help cards, one directory panel of rows. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading help" className="grid w-full content-start gap-6">
      <HeaderSkeleton actions={1} />
      <div className="grid gap-3">
        <Skeleton className="h-5 w-24" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-[4.5rem] rounded-lg" />
          ))}
        </div>
      </div>
      <div className="grid gap-3">
        <Skeleton className="h-5 w-36" />
        <div className="overflow-hidden rounded-lg bg-mist-0 ring-1 ring-mist-200">
          <div className="flex items-center justify-between gap-4 border-b border-mist-200 px-4 py-3">
            <Skeleton className="h-6 w-full max-w-md" />
            <Skeleton className="hidden h-9 w-64 rounded-lg sm:block" />
          </div>
          <div className="divide-y divide-mist-100">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-9 rounded-full" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
                <Skeleton className="hidden h-3.5 w-48 md:block" />
                <Skeleton className="hidden h-3.5 w-32 md:block" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Loading help</span>
    </div>
  );
}
