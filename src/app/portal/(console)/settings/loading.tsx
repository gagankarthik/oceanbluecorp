import { HeaderSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Settings: the header, then its sections down the left-aligned column. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading settings" className="grid w-full max-w-4xl content-start gap-4">
      <HeaderSkeleton actions={0} />
      <Skeleton className="h-24 rounded-lg" />
      <Skeleton className="h-60 rounded-lg" />
      <Skeleton className="h-64 rounded-lg" />
      <span className="sr-only">Loading settings</span>
    </div>
  );
}
