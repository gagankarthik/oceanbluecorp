import { Skel } from "@/components/admin/skeletons";

const CARD = "overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors content: header with preview/save, page nav cards (rail from lg), then the field editor. */
export default function ContentLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading content">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Skel className="h-7 w-28" />
          <Skel className="mt-1.5 h-3.5 w-80 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-24 rounded-[9px]" />
          <Skel className="h-9 w-32 rounded-[9px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
        <div className="space-y-4">
          {[4, 3].map((n, k) => (
            <div key={k} className={CARD}>
              <div className="border-b border-[var(--adm-line-soft)] px-4 py-3"><Skel className="h-3.5 w-16" /></div>
              <div className="flex gap-1 p-1.5 lg:flex-col">
                {Array.from({ length: n }).map((_, i) => (
                  <Skel key={i} className="h-8 w-28 flex-none rounded-[8px] lg:w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className={CARD}>
          <div className="border-b border-[var(--adm-line-soft)] px-4 py-3">
            <Skel className="h-4 w-32" />
            <Skel className="mt-2 h-3 w-24" />
          </div>
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2.5 px-4 py-3">
                <Skel className="h-3.5 w-40" />
                <Skel className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
