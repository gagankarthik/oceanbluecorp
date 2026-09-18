import { cn } from "@/lib/utils";

/** Single pulsing placeholder block. */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[6px] bg-[var(--adm-line-soft)]/70", className)} />;
}

/** Plain divide-y rows, drop inside an existing card/table container while data loads. */
export function AdminRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-[var(--adm-line-soft)]" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-[var(--adm-line-soft)]/70" />
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
export function AdminListSkeleton({ stats = 0, rows = 8, tabs = 0 }: { stats?: number; rows?: number; tabs?: number }) {
  return (
    <div className="pb-10" aria-hidden="true" aria-label="Loading…">
      {/* title + actions */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <Skel className="h-6 w-44" />
        <div className="flex gap-2">
          <Skel className="hidden h-9 w-24 sm:block" />
          <Skel className="h-9 w-28" />
        </div>
      </div>

      {/* segmented tabs (e.g. bench pools) */}
      {tabs > 0 && (
        <div className="mb-4 inline-flex items-center gap-0.5 rounded-[8px] border border-[var(--adm-line)] bg-[var(--adm-surface-2)] p-0.5">
          {Array.from({ length: tabs }).map((_, i) => (
            <Skel key={i} className="h-7 w-28 rounded-[6px]" />
          ))}
        </div>
      )}

      {/* stat strip */}
      {stats > 0 && (
        <div className="mb-4 inline-flex overflow-hidden rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className={cn("flex h-9 items-center gap-2 px-3.5", i > 0 && "border-l border-[var(--adm-line-soft)]")}>
              <Skel className="h-3 w-16" />
              <Skel className="h-3.5 w-6" />
            </div>
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
      <div className="overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
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
export function AdminDetailSkeleton() {
  return (
    <div className="space-y-4 pb-10 lg:space-y-5" aria-hidden="true" aria-label="Loading…">
      <div className="space-y-2">
        <Skel className="h-6 w-52" />
        <Skel className="h-3 w-36" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_288px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="space-y-3 rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
              <Skel className="h-4 w-40" />
              {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
                <Skel key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--adm-line-soft)]/70" />
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-2.5 rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skel key={i} className="h-3.5 w-full" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Form view: header + sectioned field grid. */
export function AdminFormSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4 pb-12 lg:space-y-5" aria-hidden="true" aria-label="Loading…">
      <div className="space-y-2">
        <Skel className="h-6 w-52" />
        <Skel className="h-3 w-36" />
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-5 rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 sm:p-5">
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

/** Kanban board skeleton, a row of stage columns, each with stacked cards. */
export function KanbanSkeleton({
  columns = 5,
  cardsPerColumn = 3,
}: {
  columns?: number;
  cardsPerColumn?: number;
}) {
  return (
    <div
      className="flex gap-3 overflow-x-auto pb-4"
      aria-hidden="true"
      aria-label="Loading…"
    >
      {Array.from({ length: columns }).map((_, c) => (
        <div
          key={c}
          className="flex w-64 flex-shrink-0 flex-col gap-2 rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3"
        >
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 pb-1">
            <Skel className="h-5 w-5 rounded-full" />
            <Skel className="h-3.5 w-24" />
            <Skel className="ml-auto h-4 w-6 rounded-[6px]" />
          </div>
          {/* Cards */}
          {Array.from({ length: cardsPerColumn }).map((_, i) => (
            <div
              key={i}
              className="space-y-2.5 rounded-[10px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3"
            >
              <div className="flex items-start gap-2">
                <Skel className="h-8 w-8 flex-shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skel className="h-3 w-3/4" />
                  <Skel className="h-2.5 w-1/2" />
                </div>
              </div>
              <Skel className="h-2.5 w-full" />
              <div className="flex items-center gap-1.5">
                <Skel className="h-5 w-16 rounded-[6px]" />
                <Skel className="h-5 w-12 rounded-[6px]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton, stat cards + chart placeholder + recent list. */
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
export function DashboardSkeleton() {
  const card = "rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)]";
  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-4 pb-6 lg:space-y-5" aria-hidden="true">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <Skel className="h-6 w-56" />
          <Skel className="mt-2 h-3.5 w-64" />
        </div>
        <div className="flex gap-2">
          <Skel className="h-9 w-52 rounded-[9px]" />
          <Skel className="h-9 w-24 rounded-[9px]" />
        </div>
      </div>

      <div className={cn(card, "@container overflow-hidden")}>
        <div className="grid grid-cols-2 gap-px bg-[var(--adm-line-soft)] @2xl:grid-cols-3 @4xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--adm-surface)] px-5 py-5">
              <Skel className="h-3.5 w-20" />
              <Skel className="mt-3 h-8 w-14" />
              <Skel className="mt-2.5 h-3 w-24" />
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Skel className="h-[260px] rounded-[14px]" />
        <div className="grid gap-4 md:grid-cols-2 xl:col-span-2">
          <Skel className="h-[260px] rounded-[14px]" />
          <Skel className="h-[260px] rounded-[14px]" />
        </div>
      </div>

      {[0, 1].map((k) => (
        <div key={k} className="space-y-3">
          <div>
            <Skel className="h-4 w-44" />
            <Skel className="mt-1.5 h-3 w-72" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Skel className="h-[320px] rounded-[14px]" />
            <Skel className="h-[320px] rounded-[14px]" />
          </div>
        </div>
      ))}

      <div className="grid gap-4 lg:grid-cols-5">
        <Skel className="h-[380px] rounded-[14px] lg:col-span-2" />
        <Skel className="h-[380px] rounded-[14px] lg:col-span-3" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = 180 }: { height?: number }) {
  return (
    <div
      className="flex flex-col gap-3"
      aria-hidden="true"
      aria-label="Loading chart…"
    >
      <div className="flex items-end gap-1.5 px-2" style={{ height }}>
        {Array.from({ length: 12 }).map((_, i) => {
          const pct = 30 + Math.sin(i * 0.8) * 30 + (i % 3) * 10;
          return (
            <div
              key={i}
              className="flex-1 animate-pulse rounded-t-sm bg-[var(--adm-line-soft)]/70"
              style={{ height: `${pct}%` }}
            />
          );
        })}
      </div>
      <div className="flex justify-between px-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skel key={i} className="h-2.5 w-8" />
        ))}
      </div>
    </div>
  );
}

/** Card grid skeleton, matches a 3-up or 4-up responsive card layout. */
export function CardGridSkeleton({
  cards = 6,
  columns = "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
}: {
  cards?: number;
  columns?: string;
}) {
  return (
    <div className={`grid gap-4 ${columns}`} aria-hidden="true" aria-label="Loading…">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <Skel className="h-4 w-3/4" />
              <Skel className="h-3 w-1/2" />
            </div>
            <Skel className="h-6 w-16 rounded-[6px] flex-shrink-0 ml-2" />
          </div>
          <Skel className="h-3 w-full" />
          <Skel className="h-3 w-4/5" />
          <div className="flex items-center gap-2 pt-1">
            <Skel className="h-6 w-6 rounded-full" />
            <Skel className="h-3 w-20" />
            <Skel className="ml-auto h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
