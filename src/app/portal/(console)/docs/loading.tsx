import { HeaderSkeleton, PanelSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Docs: header, search and contents rail, reading column. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading the docs" className="mx-auto grid w-full max-w-[1600px] content-start gap-6">
      <HeaderSkeleton actions={1} />
      <div className="grid items-start gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
        <div className="grid gap-3">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="grid gap-2 rounded-xl bg-mist-0 p-3 ring-1 ring-mist-200">
            <Skeleton className="h-6 w-full rounded-lg lg:hidden" />
            {Array.from({ length: 8 }, (_, i) => (
              <Skeleton key={i} className="hidden h-6 w-full rounded-lg lg:block" />
            ))}
          </div>
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full max-w-xl" />
          <PanelSkeleton height="h-40" />
          <PanelSkeleton height="h-56" />
        </div>
      </div>
      <span className="sr-only">Loading the docs</span>
    </div>
  );
}
