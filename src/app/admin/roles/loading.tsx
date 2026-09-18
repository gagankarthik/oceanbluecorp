import { AdminRowsSkeleton, Skel } from "@/components/admin/skeletons";

const CARD = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors roles: header, per-role count cards, then the route matrix card. */
export default function RolesLoading() {
  return (
    <div className="space-y-4 pb-10 lg:space-y-5" aria-busy="true" aria-label="Loading roles">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skel className="h-7 w-52" />
          <Skel className="mt-1.5 h-3.5 w-72 max-w-full" />
        </div>
        <Skel className="h-9 w-24 rounded-[9px]" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`${CARD} space-y-3 p-4`}>
            <Skel className="h-3.5 w-20" />
            <Skel className="h-6 w-16" />
            <Skel className="h-3 w-40" />
          </div>
        ))}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
          <Skel className="h-4 w-28" />
        </div>
        <AdminRowsSkeleton rows={8} />
      </div>
    </div>
  );
}
