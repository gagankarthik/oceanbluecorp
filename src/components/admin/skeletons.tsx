import { cn } from "@/lib/utils";

/** One placeholder block. Colour, radius and pulse come from the --skeleton-* tokens. */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("skel", className)} />;
}

/* A skeleton says what is loading: role="status" with a specific label, read
   once, over blocks that carry no text of their own. */
const busy = (label: string) => ({ role: "status" as const, "aria-busy": true, "aria-label": label });

/** Plain divide-y rows, drop inside an existing card/table container while data loads. */
export function AdminRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--adm-line-soft)]" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skel className="h-10 w-10 flex-shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skel className="h-3.5 w-1/3" />
            <Skel className="h-2.5 w-1/4" />
          </div>
          <Skel className="hidden h-3 w-24 sm:block" />
          <Skel className="h-6 w-20 rounded-[6px]" />
          <Skel className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/**
 * Full-page list view, mirroring the current workspace layout so nothing jumps
 * when data lands: title row → inline stat strip → slim canvas toolbar
 * (search left, filter pills + Display right) → table panel with footer.
 */
/** List page: ListHeader, then the panel. `stats` and `tabs` are accepted from older call sites and ignored. */
export function AdminListSkeleton({ rows = 8, label = "Loading list" }: { stats?: number; rows?: number; tabs?: number; label?: string }) {
  return (
    <div className="pb-10" {...busy(label)}>
      {/* ListHeader: title and meta line, actions right */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="space-y-2">
          <Skel className="h-6 w-40" />
          <Skel className="h-3 w-56" />
        </div>
        <Skel className="h-10 w-24" />
      </div>

      {/* table panel */}
      <div className="overflow-hidden rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
        {/* ListToolbar: tabs and search left, filters and Display right */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--adm-line)] px-3 py-3 lg:px-4">
          <Skel className="h-10 w-64 max-w-full" />
          <Skel className="h-10 w-full sm:w-[260px]" />
          <div className="ml-auto flex items-center gap-2">
            <Skel className="hidden h-10 w-24 sm:block" />
            <Skel className="h-10 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-4 border-b border-[var(--adm-line-soft)] px-6 py-4">
          <Skel className="h-3 w-32 max-w-[40%] flex-1" />
          <Skel className="hidden h-3 w-24 sm:block" />
          <Skel className="hidden h-3 w-20 md:block" />
          <Skel className="h-3 w-16" />
        </div>
        <AdminRowsSkeleton rows={rows} />
        <div className="flex items-center justify-between border-t border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-5 py-3">
          <Skel className="h-3 w-28" />
          <Skel className="h-3 w-24" />
        </div>
      </div>
    </div>
  );
}

/** Detail view: header + 2-column content/aside. */
export function AdminDetailSkeleton({ label = "Loading record" }: { label?: string }) {
  return (
    <div className="space-y-4 pb-10 lg:space-y-5" {...busy(label)}>
      <div className="space-y-2">
        <Skel className="h-6 w-52" />
        <Skel className="h-3 w-36" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_288px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="space-y-3 rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <Skel className="h-4 w-40" />
              {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
                <Skel key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            <Skel className="h-16 w-16 rounded-full" />
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-3 rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-3.5 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Form view: header + sectioned field grid. */
export function AdminFormSkeleton({ label = "Loading form" }: { label?: string }) {
  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12 lg:space-y-5" {...busy(label)}>
      <div className="space-y-2">
        <Skel className="h-6 w-52" />
        <Skel className="h-3 w-36" />
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-5 rounded-[var(--adm-radius-card)] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 sm:p-5">
          <Skel className="h-4 w-40" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skel className="h-3 w-24" />
                <Skel className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skel className="h-10 w-24" />
        <Skel className="h-10 w-32" />
      </div>
    </div>
  );
}

