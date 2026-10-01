import { Skel, BrandBandSkeleton } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

/** Mirrors the workspace: brand band → canvas toolbar → stage band + table panel. */
export default function ApplicationsLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy="true" aria-label="Loading applications">
      <BrandBandSkeleton size="sm" stats={7} className="mb-3" />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-9 w-full rounded-[10px] sm:w-[320px]" />
        <div className="ml-auto flex gap-2">
          <Skel className="h-9 w-[92px] rounded-[10px]" />
          <Skel className="h-9 w-[96px] rounded-[10px]" />
        </div>
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        <div className="flex h-11 items-center gap-6 border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-4">
          <Skel className="h-4 w-4 rounded-[4px]" />
          <Skel className="h-3 w-24" />
          <Skel className="hidden h-3 w-20 lg:block" />
          <Skel className="hidden h-3 w-20 md:block" />
          <Skel className="h-3 w-16" />
          <Skel className="ml-auto hidden h-3 w-16 sm:block" />
        </div>
        <div className="flex-1 divide-y divide-[var(--adm-line-soft)]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-12 items-center gap-6 px-4">
              <Skel className="h-4 w-4 flex-none rounded-[4px]" />
              <div className="flex w-[200px] min-w-0 items-center gap-3">
                <Skel className="h-8 w-8 flex-none rounded-full" />
                <Skel className="h-3.5 w-28" />
              </div>
              <Skel className="hidden h-3 w-36 lg:block" />
              <Skel className="hidden h-3 w-32 md:block" />
              <Skel className="h-3.5 w-20" />
              <Skel className="ml-auto hidden h-3 w-16 sm:block" />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[var(--adm-line)] px-4 py-2.5">
          <Skel className="h-3 w-28" />
          <Skel className="h-8 w-40 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}
