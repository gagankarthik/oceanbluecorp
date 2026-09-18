import { Skel } from "@/components/admin/skeletons";

const CARD = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors docs: header, contents card (rail from lg), then reference sections. */
export default function DocsLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading developer docs">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <Skel className="h-7 w-44" />
          <Skel className="mt-1.5 h-3.5 w-96 max-w-full" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-9 rounded-[9px] sm:w-28" />
          <Skel className="h-9 w-24 rounded-[9px]" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-5">
        <div className={`${CARD} overflow-hidden`}>
          <div className="flex min-h-11 items-center px-4 lg:border-b lg:border-[var(--adm-line-soft)]">
            <Skel className="h-3.5 w-20" />
          </div>
          <div className="hidden space-y-2.5 p-3 lg:block">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skel key={i} className={i % 3 === 0 ? "h-3.5 w-28" : "ml-3 h-3 w-32"} />
            ))}
          </div>
        </div>

        <div className="min-w-0 space-y-6 lg:space-y-8">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="space-y-3">
              <Skel className="h-5 w-48" />
              <Skel className="h-3.5 w-full" />
              <Skel className="h-3.5 w-11/12" />
              <Skel className="h-3.5 w-4/5" />
              <Skel className="h-32 w-full rounded-[12px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
