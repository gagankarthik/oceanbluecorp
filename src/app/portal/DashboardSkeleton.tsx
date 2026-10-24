// Server-safe placeholders shaped like the dashboard: greeting, the figure strip, then the
// activity and conversion beside attention, risk and tasks; sources beside recent activity; insights.
import { Skeleton } from "@/components/portal/kit/skeletons";

function SectionSkeleton({ height = "h-64", className = "" }: { height?: string; className?: string }) {
  return (
    <div className={`grid content-start gap-3 ${className}`}>
      <Skeleton className="h-4 w-36" />
      <Skeleton className={`${height} w-full rounded-lg`} />
    </div>
  );
}

export function DashboardBodySkeleton({ label = "Loading the dashboard" }: { label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="grid min-w-0 gap-8">
      <div className="grid gap-2">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid gap-px overflow-hidden rounded-lg border border-mist-200 bg-mist-200 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="grid gap-3 bg-mist-0 p-4 sm:p-5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-8">
          <SectionSkeleton height="h-80" />
          <SectionSkeleton height="h-72" />
        </div>
        <div className="grid gap-8">
          <SectionSkeleton height="h-72" />
          <SectionSkeleton height="h-64" />
          <SectionSkeleton height="h-16" />
        </div>
      </div>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <SectionSkeleton height="h-72" />
        <SectionSkeleton height="h-72" />
      </div>
      <SectionSkeleton height="h-72" />
      <span className="sr-only">{label}</span>
    </div>
  );
}

/** Route fallback: the 44px header, then the body, edge to edge in the work surface. */
export function DashboardPageSkeleton() {
  return (
    <div className="-m-5 flex min-h-[calc(100svh-3.75rem-2px)] flex-col bg-mist-0 sm:-m-6 lg:-m-8">
      <div className="flex h-11 shrink-0 items-center gap-3 border-b border-mist-200 px-4">
        <Skeleton className="size-4 rounded" />
        <Skeleton className="h-3 w-20" />
        <span className="hidden items-center gap-4 border-l border-mist-200 pl-3 sm:flex">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-28" />
        </span>
        <span className="ml-auto flex gap-2">
          <Skeleton className="h-7 w-32 rounded-md" />
          <Skeleton className="size-7 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
        </span>
      </div>
      <div className="w-full bg-mist-50 px-4 py-6 sm:px-6 lg:px-8">
        <DashboardBodySkeleton />
      </div>
    </div>
  );
}
