import { AdminRowsSkeleton, Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

const CARD = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors API keys: header, stat strip, issued-keys table, then the feed reference card. */
export default function ApiKeysLoading() {
  return (
    <div className="space-y-4 pb-10 lg:space-y-5" aria-busy="true" aria-label="Loading API keys">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Skel className="h-7 w-28" />
          <Skel className="mt-1.5 h-3.5 w-80 max-w-full" />
        </div>
        <Skel className="h-9 w-32 rounded-[9px]" />
      </div>

      <div className="inline-flex max-w-full overflow-hidden rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={cn("flex h-9 items-center gap-2 px-3.5", i > 0 && "border-l border-[var(--adm-line-soft)]", i > 1 && "hidden sm:flex")}
          >
            <Skel className="h-3 w-16" />
            <Skel className="h-3.5 w-6" />
          </div>
        ))}
      </div>

      <div className={`${CARD} overflow-hidden`}>
        <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
          <Skel className="h-4 w-28" />
        </div>
        <AdminRowsSkeleton rows={4} />
      </div>

      <div className={CARD}>
        <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
          <Skel className="h-4 w-24" />
        </div>
        <div className="space-y-3 p-4">
          <Skel className="h-3.5 w-3/4" />
          <Skel className="h-24 w-full rounded-[12px]" />
          <Skel className="h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}
