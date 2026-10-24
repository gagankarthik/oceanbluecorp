import { HeaderSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Feed: header, toolbar, then day groups of rows. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading notifications" className="grid w-full content-start gap-6">
      <HeaderSkeleton actions={1} />
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 min-w-0 flex-1 basis-56 rounded-lg" />
      </div>
      {[4, 3].map((rows, g) => (
        <div key={g} className="grid gap-3">
          <Skeleton className="h-3.5 w-24" />
          <div className="divide-y divide-mist-100 rounded-lg bg-mist-0 ring-1 ring-mist-200">
            {Array.from({ length: rows }, (_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                <Skeleton className="size-9 rounded-lg" />
                <div className="grid flex-1 gap-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <span className="sr-only">Loading notifications</span>
    </div>
  );
}
