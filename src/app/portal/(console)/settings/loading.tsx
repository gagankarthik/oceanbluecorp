import { HeaderSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Settings: one centred column of cards. */
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading settings" className="mx-auto grid w-full max-w-[40rem] content-start gap-4">
      <HeaderSkeleton actions={0} />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-60 rounded-xl" />
      <Skeleton className="h-64 rounded-xl" />
      <span className="sr-only">Loading settings</span>
    </div>
  );
}
