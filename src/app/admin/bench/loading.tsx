import { AdminRowsSkeleton, Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

/** Mirrors the bench workspace: title → pool tabs → stat strip → toolbar → table. */
export default function BenchLoading() {
  return (
    <div className="flex flex-col pb-6" aria-busy="true" aria-label="Loading talent bench">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Skel className="h-6 w-36" />
        <div className="flex gap-2">
          <Skel className="hidden h-9 w-24 rounded-[9px] sm:block" />
          <Skel className="h-9 w-28 rounded-[9px]" />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex max-w-full items-center gap-0.5 overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5">
          {["w-28", "w-32", "w-24"].map((w) => (
            <Skel key={w} className={cn("h-7 rounded-[6px]", w)} />
          ))}
        </div>
        <Skel className="h-9 w-32 rounded-[9px]" />
      </div>

      <div className="mb-4 inline-flex max-w-full self-start overflow-hidden rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn("flex h-9 items-center gap-2 px-3.5", i > 0 && "hidden border-l border-[var(--adm-line-soft)] sm:flex")}>
            <Skel className="h-3 w-20" />
            <Skel className="h-3.5 w-5" />
          </div>
        ))}
      </div>

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

      <div className="overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
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
