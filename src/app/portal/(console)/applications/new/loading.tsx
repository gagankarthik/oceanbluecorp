import { HeaderSkeleton, Skeleton } from "@/components/portal/kit/skeletons";

/** Mirrors the first step of "New applicant": header, then the resume chooser panel. */
export default function NewApplicationLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading" className="mx-auto grid w-full min-w-0 max-w-5xl content-start gap-6">
      <HeaderSkeleton back actions={0} />
      <div className="rounded-lg bg-mist-0 ring-1 ring-mist-200">
        <div className="grid min-h-14 content-center gap-1.5 border-b border-mist-200 px-5 py-2.5">
          <Skeleton className="h-4 w-64 max-w-full" />
          <Skeleton className="h-3 w-80 max-w-full" />
        </div>
        <div className="grid gap-4 p-5">
          <Skeleton className="h-52 w-full rounded-lg" />
          <div className="flex justify-center gap-2">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}
