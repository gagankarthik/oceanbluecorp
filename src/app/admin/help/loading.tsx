import { Skel } from "@/components/admin/skeletons";

const CARD = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors help: header, directory ledger on the left, help rail on the right. */
export default function HelpLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading help">
      <div className="mb-5">
        <Skel className="h-7 w-24" />
        <Skel className="mt-1.5 h-3.5 w-80 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Skel className="h-9 w-full rounded-[10px] sm:w-[280px]" />
            <Skel className="h-9 w-80 max-w-full rounded-[9px]" />
          </div>
          <div className={`${CARD} overflow-hidden`}>
            {Array.from({ length: 3 }).map((_, g) => (
              <div key={g}>
                <div className="border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] px-4 py-2.5">
                  <Skel className="h-3.5 w-56" />
                </div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-1 gap-2 border-b border-[var(--adm-line-soft)] px-4 py-3 md:grid-cols-3 md:items-center">
                    <div className="flex items-center gap-3">
                      <Skel className="h-8 w-8 flex-none rounded-full" />
                      <div className="space-y-1.5">
                        <Skel className="h-3.5 w-32" />
                        <Skel className="h-3 w-24" />
                      </div>
                    </div>
                    <Skel className="h-3.5 w-48 max-w-full" />
                    <Skel className="h-3.5 w-32" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1">
          {[3, 3].map((rows, c) => (
            <div key={c} className={`${CARD} overflow-hidden`}>
              <div className="border-b border-[var(--adm-line-soft)] px-4 py-3.5">
                <Skel className="h-4 w-32" />
              </div>
              {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-3 last:border-0">
                  <Skel className="h-3.5 w-40" />
                  <Skel className="h-5 w-12 rounded-[5px]" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
