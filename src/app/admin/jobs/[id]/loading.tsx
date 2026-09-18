import { Skel } from "@/components/admin/skeletons";

/** Mirrors the job record: RecordHeader, tabbed main card, and the right rail (stacked below xl). */
export default function JobDetailLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading job">
      {/* Record header */}
      <div className="mb-5">
        <Skel className="mb-3 h-3.5 w-14" />
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <Skel className="h-7 w-64 max-w-[60vw]" />
              <Skel className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Skel className="h-3.5 w-24" />
              <Skel className="h-3.5 w-28" />
              <Skel className="h-3.5 w-32" />
              <Skel className="h-3.5 w-20" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skel className="h-9 w-10 rounded-[10px] sm:w-28" />
            <Skel className="h-9 w-10 rounded-[10px] sm:w-24" />
            <Skel className="h-9 w-20 rounded-[10px]" />
            <Skel className="h-9 w-36 rounded-[10px]" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-5">
        {/* Main card: tabs, toolbar, rows */}
        <div className="overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
          <div className="flex h-11 items-center gap-6 border-b border-[var(--adm-line)] px-4">
            <Skel className="h-4 w-24" />
            <Skel className="h-4 w-24" />
            <Skel className="hidden h-4 w-28 sm:block" />
            <Skel className="hidden h-4 w-20 sm:block" />
          </div>
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3">
            <Skel className="h-9 w-full rounded-[10px] sm:w-60" />
            <Skel className="h-9 w-32 rounded-[10px]" />
            <Skel className="ml-auto h-3.5 w-12" />
          </div>
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skel className="h-8 w-8 flex-none rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skel className="h-3.5 w-1/3" />
                  <Skel className="h-3 w-1/4" />
                </div>
                <Skel className="hidden h-3.5 w-24 lg:block" />
                <Skel className="h-7 w-28 rounded-[8px]" />
                <Skel className="hidden h-3.5 w-20 md:block" />
              </div>
            ))}
          </div>
        </div>

        {/* Rail */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-1">
          {[8, 3].map((rows, i) => (
            <div key={i} className="overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
              <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
                <Skel className="h-4 w-28" />
              </div>
              <div className="divide-y divide-[var(--adm-line-soft)] py-1">
                {Array.from({ length: rows }).map((_, r) => (
                  <div key={r} className="flex items-center justify-between gap-3 px-4 py-3">
                    <Skel className="h-3.5 w-20" />
                    <Skel className="h-3.5 w-24" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
