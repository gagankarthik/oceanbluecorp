import { Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

/** Mirrors the jobs workspace: title → stat strip → canvas toolbar → row list / grid. */
export default function JobsLoading() {
  return (
    <div className="flex h-full min-h-0 flex-col" aria-busy="true" aria-label="Loading job postings">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <div className="space-y-2">
          <Skel className="h-6 w-44" />
          <Skel className="h-3.5 w-48" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-9 rounded-[10px] sm:w-[92px]" />
          <Skel className="h-9 w-[112px] rounded-[10px]" />
        </div>
      </div>

      <div className="mb-4 flex max-w-full self-start overflow-hidden rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        {["w-[72px]", "w-[104px]", "w-[88px]", "w-12"].map((w, i) => (
          <div
            key={i}
            className={cn(
              "flex h-9 items-center gap-2 px-3.5",
              i > 0 && "border-l border-[var(--adm-line-soft)]",
              i > 1 && "hidden sm:flex",
            )}
          >
            <Skel className={cn("h-3", w)} />
            <Skel className="h-3.5 w-4" />
          </div>
        ))}
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-9 w-full rounded-[10px] sm:w-[260px]" />
        <Skel className="h-9 w-[84px] rounded-[10px]" />
        <Skel className="ml-auto hidden h-9 w-[96px] rounded-[10px] xl:block" />
      </div>

      <div className="flex min-h-[420px] flex-1 flex-col overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
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
