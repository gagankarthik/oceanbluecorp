import { Skel } from "@/components/admin/skeletons";

/** Mirrors lead sourcing: record header with back link, then the find-candidates card. */
export default function LeadSourcingLoading() {
  return (
    <div className="flex flex-col gap-4 pb-6 lg:gap-5" aria-busy="true" aria-label="Loading lead sourcing">
      <div>
        <Skel className="mb-2 h-3.5 w-24" />
        <Skel className="h-7 w-40" />
        <Skel className="mt-1.5 h-3.5 w-96 max-w-full" />
      </div>

      <div className="rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-[var(--adm-line-soft)] px-4 py-2.5">
          <div className="space-y-1.5">
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-72 max-w-full" />
          </div>
          <Skel className="h-8 w-48 rounded-[8px]" />
        </div>
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-2">
            <Skel className="h-3.5 w-10" />
            <Skel className="h-9 w-full rounded-[10px]" />
          </div>
          <Skel className="h-9 w-36 rounded-[9px]" />
        </div>
      </div>
    </div>
  );
}
