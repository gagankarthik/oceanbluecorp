import { AdminRowsSkeleton, BrandBandSkeleton, Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

/** Mirrors the bench workspace: brand band → toolbar → table. */
export default function BenchLoading() {
  return (
    <div className="flex flex-col pb-6" aria-busy="true" aria-label="Loading talent bench">
      <BrandBandSkeleton size="sm" stats={7} className="mb-3" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-9 w-full rounded-[10px] sm:w-[260px]" />
        <Skel className="hidden h-9 w-20 rounded-[10px] sm:block" />
        <Skel className="hidden h-9 w-20 rounded-[10px] md:block" />
        <Skel className="hidden h-9 w-24 rounded-[10px] lg:block" />
        <div className="ml-auto flex gap-2">
          <Skel className="h-9 w-20 rounded-[10px]" />
          <Skel className="h-9 w-24 rounded-[10px]" />
        </div>
      </div>

      <div className="overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        <div className="flex items-center gap-4 border-b border-[var(--adm-line-soft)] px-4 py-3">
          <Skel className="h-3 w-32 max-w-[40%] flex-1" />
          <Skel className="hidden h-3 w-24 sm:block" />
          <Skel className="hidden h-3 w-20 md:block" />
          <Skel className="h-3 w-16" />
        </div>
        <AdminRowsSkeleton rows={10} />
      </div>
    </div>
  );
}
