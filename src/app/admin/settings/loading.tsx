import { Skel } from "@/components/admin/skeletons";

const CARD = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors settings: header with role chip, section nav (rail from lg), then field cards. */
export default function SettingsLoading() {
  return (
    <div className="space-y-4 pb-10 lg:space-y-5" aria-busy="true" aria-label="Loading settings">
      <div className="mb-5">
        <Skel className="h-7 w-28" />
        <Skel className="mt-1.5 h-3.5 w-56" />
        <Skel className="mt-2 h-6 w-16 rounded-full" />
      </div>

      <div className="grid max-w-5xl grid-cols-1 gap-4 lg:grid-cols-[208px_minmax(0,1fr)] lg:gap-5">
        <div className={`${CARD} flex gap-1 overflow-hidden p-1.5 lg:flex-col`}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-none items-start gap-2.5 px-3 py-2 lg:py-2.5">
              <Skel className="h-4 w-4 flex-none" />
              <div className="space-y-1.5">
                <Skel className="h-3.5 w-20" />
                <Skel className="hidden h-3 w-32 lg:block" />
              </div>
            </div>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <div className={CARD}>
            <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
              <Skel className="h-4 w-28" />
            </div>
            <div className="flex items-center gap-4 p-4">
              <Skel className="h-16 w-16 flex-none rounded-full" />
              <div className="space-y-2">
                <Skel className="h-9 w-32 rounded-[9px]" />
                <Skel className="h-3 w-40" />
              </div>
            </div>
          </div>
          <div className={CARD}>
            <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
              <Skel className="h-4 w-36" />
            </div>
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skel className="h-3.5 w-24" />
                  <Skel className="h-9 w-full rounded-[10px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
