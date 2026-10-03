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
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <Skel className="h-9 w-9 flex-shrink-0 rounded-full" />
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
export function AdminListSkeleton({ stats = 0, rows = 8, tabs = 0, label = "Loading list" }: { stats?: number; rows?: number; tabs?: number; label?: string }) {
  return (
    <div className="pb-10" {...busy(label)}>
      <BrandBandSkeleton size="sm" stats={Math.max(stats, 1)} className="mb-3" />

      {/* segmented tabs (e.g. bench pools) */}
      {tabs > 0 && (
        <div className="mb-4 inline-flex items-center gap-0.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skel key={i} className="h-7 w-28 rounded-[6px]" />
          ))}
        </div>
      )}

      {/* canvas toolbar: search left, filter pills + Display right */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-9 w-full sm:w-[260px]" />
        <div className="ml-auto flex items-center gap-2">
          <Skel className="hidden h-9 w-24 sm:block" />
          <Skel className="hidden h-9 w-24 md:block" />
          <Skel className="h-9 w-20" />
        </div>
      </div>

      {/* table panel */}
      <div className="overflow-hidden rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
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
            <div key={s} className="space-y-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <Skel className="h-4 w-40" />
              {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
                <Skel key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            <Skel className="h-16 w-16 rounded-full" />
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-2.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
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
        <div key={s} className="space-y-5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 sm:p-5">
          <Skel className="h-4 w-40" />
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skel className="h-3 w-24" />
                <Skel className="h-9 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-2">
        <Skel className="h-9 w-24" />
        <Skel className="h-9 w-32" />
      </div>
    </div>
  );
}

/**
 * Mirrors /admin exactly, six bands in the order the page renders them.
 *
 * The version this replaced described a layout the dashboard had not had for
 * some time: a 4-up stat-card row that no longer exists, and nothing at all for
 * three of the six sections. A skeleton that does not match is worse than none,
 * because it promises a shape and then the content arrives somewhere else, the
 * page appears to jump, which is the exact thing a skeleton exists to prevent.
 *
 * If you move a band on the dashboard, move it here. The two are a pair.
 */
/** Placeholder for a BrandBand: same footprint, a quiet tint instead of the full cobalt. */
export function BrandBandSkeleton({ stats, size = "md", className }: { stats: number; size?: "sm" | "md"; className?: string }) {
  const sm = size === "sm";
  const bar = "rounded-[6px] bg-[var(--adm-accent)] opacity-15";
  return (
    <div className={cn("flex-none overflow-hidden rounded-[8px] bg-[var(--adm-accent-soft)]", className)}>
      <div className={cn("flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5", sm ? "py-3.5" : "pb-4 pt-5")}>
        <div className="space-y-2">
          <div className={cn(bar, "h-6 w-44")} />
          <div className={cn(bar, "h-3.5 w-56")} />
        </div>
        <div className="flex gap-2">
          <div className={cn(bar, "h-9 w-24")} />
          <div className={cn(bar, "h-9 w-32")} />
        </div>
      </div>
      <div className="flex gap-px border-t border-[var(--adm-surface)]">
        {Array.from({ length: stats }).map((_, i) => (
          <div key={i} className={cn("min-w-0 flex-1 space-y-2 px-5", sm ? "py-2.5" : "py-4", i > 1 && "hidden sm:block", i > 3 && "sm:hidden lg:block")}>
            <div className={cn(bar, "h-3 w-20 max-w-full")} />
            <div className={cn(bar, sm ? "h-5 w-10" : "h-7 w-14")} />
            {!sm && <div className={cn(bar, "h-3 w-24 max-w-full")} />}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  const card = "rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface)]";
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-6 lg:space-y-5" {...busy("Loading dashboard")}>
      <BrandBandSkeleton stats={6} />

      <div className="grid gap-4 xl:grid-cols-3">
        <Skel className="h-[260px] rounded-[8px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
          <Skel className="h-[260px] rounded-[8px]" />
          <Skel className="h-[260px] rounded-[8px]" />
        </div>
      </div>

      {[0, 1].map((k) => (
        <div key={k} className="space-y-3">
          <div>
            <Skel className="h-4 w-44" />
            <Skel className="mt-1.5 h-3 w-72" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skel className="h-[320px] rounded-[8px]" />
            <Skel className="h-[320px] rounded-[8px]" />
          </div>
        </div>
      ))}

      <div className="grid gap-4 lg:grid-cols-5">
        <Skel className="h-[380px] rounded-[8px] lg:col-span-2" />
        <Skel className="h-[380px] rounded-[8px] lg:col-span-3" />
      </div>
    </div>
  );
}
