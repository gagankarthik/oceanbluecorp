import { Skel, BrandBandSkeleton } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

/** Mirrors the workspace: brand band → canvas toolbar → row list / grid. */
export default function JobsLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy="true" aria-label="Loading job postings">
      <BrandBandSkeleton size="sm" stats={5} className="mb-3" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-9 w-full rounded-[10px] sm:w-[260px]" />
        <Skel className="h-9 w-[84px] rounded-[10px]" />
        <Skel className="ml-auto hidden h-9 w-[96px] rounded-[10px] xl:block" />
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        <div className="hidden h-11 items-center gap-8 border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4 xl:flex">
          <Skel className="h-3 w-14" />
          <Skel className="h-3 w-40" />
          <Skel className="h-3 w-24" />
          <Skel className="h-3 w-24" />
          <Skel className="h-3 w-20" />
          <Skel className="ml-auto h-3 w-16" />
        </div>
        <div className="flex-1 divide-y divide-[var(--adm-line-soft)]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 sm:px-5 xl:h-12 xl:items-center xl:gap-8 xl:py-0">
              <div className="min-w-0 flex-1 space-y-2 xl:flex xl:flex-none xl:items-center xl:gap-8 xl:space-y-0">
                <Skel className="h-3.5 w-48 max-w-full xl:order-2 xl:w-44" />
                <Skel className="h-3 w-32 xl:order-1 xl:h-5 xl:w-16 xl:rounded-[6px]" />
                <Skel className="h-3 w-56 max-w-full xl:order-3 xl:w-28" />
              </div>
              <Skel className="h-[22px] w-16 flex-none rounded-full xl:ml-auto" />
            </div>
          ))}
        </div>
        <div className="hidden items-center justify-between border-t border-[var(--adm-line)] px-4 py-2.5 xl:flex">
          <Skel className="h-3 w-28" />
          <Skel className="h-8 w-40 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
