import { Skel } from "@/components/admin/skeletons";

/**
 * Bench loading state.
 *
 * Mirrors the real screen so nothing jumps when data lands: header band →
 * six-cell KPI strip → toolbar → record grid.
 */
export default function BenchLoading() {
  return (
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading talent bench…">
      {/* Header band — same negative margins and rule as PageHeader. */}
      <div className="-mx-5 -mt-5 mb-6 flex flex-col gap-4 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-5 sm:flex-row sm:items-center sm:justify-between lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Skel className="hidden h-10 w-10 rounded-[10px] sm:block" />
          <div className="space-y-2">
            <Skel className="h-5 w-40" />
            <Skel className="h-3.5 w-64 max-w-[60vw]" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skel className="h-10 w-28" />
          <Skel className="h-10 w-32" />
        </div>
      </div>

      {/* KPI strip — one panel, six hairline-divided cells. */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] sm:grid-cols-3 lg:grid-cols-6 [&>*]:shadow-[inset_-1px_-1px_0_var(--adm-line-soft)]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2.5 p-4">
            <div className="flex items-center gap-1.5">
              <Skel className="h-[18px] w-[18px] rounded-[4px]" />
              <Skel className="h-3 w-20" />
            </div>
            <Skel className="h-6 w-12" />
          </div>
        ))}
      </div>

      {/* Toolbar — one row: search, then the filter menus and view control. */}
      <div className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skel className="h-9 min-w-[200px] flex-1" />
          <Skel className="h-9 w-24" />
          <Skel className="h-9 w-24" />
          <Skel className="h-9 w-28" />
        </div>
      </div>

      {/* Record grid. */}
      <div className="overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
        <div className="flex items-center gap-4 border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)]/70 px-5 py-3">
          <Skel className="h-3 w-24" />
          <Skel className="hidden h-3 w-20 lg:block" />
          <Skel className="hidden h-3 w-16 md:block" />
          <Skel className="hidden h-3 w-16 xl:block" />
          <Skel className="ml-auto h-3 w-14" />
        </div>
        <div className="divide-y divide-[var(--adm-line-soft)]">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex h-[var(--adm-row-h)] items-center gap-4 px-5">
              <div className="h-7 w-7 flex-none animate-pulse rounded-full bg-[var(--adm-line-soft)]/70" />
              <div className="flex-1 space-y-1.5">
                <Skel className="h-3.5 w-40 max-w-[45%]" />
                <Skel className="h-2.5 w-20" />
              </div>
              <Skel className="hidden h-3 w-32 lg:block" />
              <Skel className="hidden h-5 w-24 rounded-[4px] md:block" />
              <Skel className="hidden h-3 w-10 xl:block" />
              <Skel className="h-5 w-20 rounded-[6px]" />
              <Skel className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
