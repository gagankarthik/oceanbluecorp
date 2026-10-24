import { HeaderSkeleton, Skeleton, TableSkeleton } from "../kit/skeletons";

// Server-safe: the article list's loading.tsx and its in-page wait share this shape.

/** Compact stat strip, status tabs, table. `header={false}` under a real PageHeader. */
export function ArticleListSkeleton({ label = "Loading", header = true }: { label?: string; header?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid w-full min-w-0 content-start gap-6">
      {header && <HeaderSkeleton actions={3} />}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 rounded-lg bg-mist-0 px-4 py-3 ring-1 ring-mist-200">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <span className="grid flex-1 gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </span>
          </div>
        ))}
      </div>
      <div className="grid gap-4">
        <div className="flex gap-4 overflow-hidden border-b border-mist-200 pb-2.5">
          {["w-12", "w-16", "w-20", "w-20", "w-12", "w-20"].map((w, i) => (
            <Skeleton key={i} className={`h-5 shrink-0 ${w}`} />
          ))}
        </div>
        <TableSkeleton rows={8} />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Content page: announcement form beside its preview, then the maintenance panel. */
export function ContentSkeleton({ label = "Loading site content", header = true }: { label?: string; header?: boolean }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid w-full min-w-0 content-start gap-6">
      {header && <HeaderSkeleton actions={1} />}
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="grid gap-5 rounded-lg bg-mist-0 p-5 ring-1 ring-mist-200">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-16 w-full rounded-lg" />
          <div className="grid gap-5 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-40 rounded-lg" />
        </div>
        <div className="grid gap-4 rounded-lg bg-mist-0 p-5 ring-1 ring-mist-200">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </div>
      </div>
      <div className="flex min-h-16 items-center gap-3 rounded-lg bg-mist-0 px-5 ring-1 ring-mist-200">
        <Skeleton className="h-6 w-28 rounded-full" />
        <Skeleton className="h-3.5 w-64 max-w-[50vw]" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}
