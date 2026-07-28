import { Skel } from "@/components/admin/skeletons";

/**
 * Mirrors the job record layout: header band, five-cell summary strip, the two
 * analytics panels, and the 2/3 + 1/3 record body.
 */
export default function JobDetailLoading() {
  return (
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading…">

      {/* Record header band */}
      <div className="-mx-5 -mt-5 border-b border-[var(--adm-line)] bg-[var(--adm-surface)] px-5 py-5 lg:-mx-6 lg:-mt-6 lg:px-6">
        <Skel className="mb-3 h-3.5 w-24" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <Skel className="hidden h-10 w-10 flex-none rounded-[10px] sm:block" />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Skel className="h-6 w-56 max-w-[60vw]" />
                <Skel className="h-5 w-24 rounded-[4px]" />
                <Skel className="h-5 w-20 rounded-[4px]" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Skel className="h-3.5 w-28" />
                <Skel className="h-3.5 w-32" />
                <Skel className="h-3.5 w-20" />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Skel className="h-10 w-28 rounded-[8px]" />
            <Skel className="h-10 w-24 rounded-[8px]" />
            <Skel className="h-10 w-32 rounded-[8px]" />
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2.5 p-4 shadow-[inset_-1px_-1px_0_var(--adm-line-soft)]">
            <Skel className="h-3.5 w-24" />
            <Skel className="h-6 w-12" />
            <Skel className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* Analytics row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
            <div className="space-y-2 border-b border-[var(--adm-line)] px-5 py-3.5">
              <Skel className="h-4 w-40" />
              <Skel className="h-2.5 w-52 max-w-[70%]" />
            </div>
            <div className="space-y-3 px-5 py-4">
              {["w-[92%]", "w-[80%]", "w-[68%]", "w-[56%]", "w-[44%]"].map((w) => (
                <Skel key={w} className={`h-8 ${w}`} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Record body */}
      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] lg:col-span-2">
          <div className="flex gap-4 border-b border-[var(--adm-line)] px-5 py-3">
            <Skel className="h-4 w-28" />
            <Skel className="h-4 w-24" />
          </div>
          <div className="flex flex-wrap gap-1.5 border-b border-[var(--adm-line-soft)] px-5 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skel key={i} className="h-7 w-20 rounded-[6px]" />
            ))}
          </div>
          <div className="border-b border-[var(--adm-line-soft)] px-5 py-3">
            <Skel className="h-9 w-full rounded-lg" />
          </div>
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skel className="h-7 w-7 flex-none rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skel className="h-3.5 w-1/3" />
                  <Skel className="h-2.5 w-1/4" />
                </div>
                <Skel className="hidden h-3 w-24 lg:block" />
                <Skel className="h-7 w-24 rounded-[6px]" />
                <Skel className="hidden h-3 w-20 md:block" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {[8, 3].map((rows, i) => (
            <div key={i} className="overflow-hidden rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
              <div className="border-b border-[var(--adm-line)] px-5 py-3.5">
                <Skel className="h-4 w-32" />
              </div>
              <div className="divide-y divide-[var(--adm-line-soft)]">
                {Array.from({ length: rows }).map((_, r) => (
                  <div key={r} className="flex items-center justify-between gap-3 px-5 py-2.5">
                    <Skel className="h-3 w-20" />
                    <Skel className="h-3 w-24" />
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
