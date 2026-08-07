import { cn } from "@/lib/utils";

/** Single pulsing placeholder block. */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-[6px] bg-[var(--adm-line-soft)]/70", className)} />;
}

/** Plain divide-y rows — drop inside an existing card/table container while data loads. */
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
          <Skel className="h-6 w-20 rounded-[4px]" />
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
          <Skel className="h-9 w-32" />
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
        <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="flex items-baseline gap-1.5">
              <Skel className="h-2.5 w-16" />
              <Skel className="h-4 w-7" />
            </div>
          ))}
        </div>
      )}

      {/* canvas toolbar: search left, filter pills + Display right */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skel className="h-8 w-full sm:w-[260px]" />
        <div className="ml-auto flex items-center gap-2">
          <Skel className="hidden h-8 w-24 sm:block" />
          <Skel className="hidden h-8 w-24 md:block" />
          <Skel className="h-8 w-20" />
        </div>
      </div>

      {/* table panel */}
      <div className="overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
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
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading…">
      <div className="flex items-center gap-3">
        <Skel className="h-9 w-9 flex-shrink-0 rounded-[6px]" />
        <div className="space-y-2">
          <Skel className="h-6 w-52" />
          <Skel className="h-3 w-36" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="space-y-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5">
              <Skel className="h-4 w-40" />
              {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
                <Skel key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5">
            <div className="h-16 w-16 animate-pulse rounded-full bg-[var(--adm-line-soft)]/70" />
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-2.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5">
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12" aria-hidden="true" aria-label="Loading…">
      <div className="flex items-center gap-3">
        <Skel className="h-9 w-9 flex-shrink-0 rounded-[6px]" />
        <div className="space-y-2">
          <Skel className="h-6 w-52" />
          <Skel className="h-3 w-36" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-6">
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

/** Kanban board skeleton — a row of stage columns, each with stacked cards. */
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
          className="flex w-64 flex-shrink-0 flex-col gap-2 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] p-3"
        >
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 pb-1">
            <Skel className="h-5 w-5 rounded-full" />
            <Skel className="h-3.5 w-24" />
            <Skel className="ml-auto h-4 w-6 rounded-[4px]" />
          </div>
          {/* Cards */}
          {Array.from({ length: cardsPerColumn }).map((_, i) => (
            <div
              key={i}
              className="space-y-2.5 rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-3"
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
                <Skel className="h-5 w-16 rounded-[4px]" />
                <Skel className="h-5 w-12 rounded-[4px]" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton — stat cards + chart placeholder + recent list. */
/**
 * Mirrors /admin exactly — six bands in the order the page renders them.
 *
 * The version this replaced described a layout the dashboard had not had for
 * some time: a 4-up stat-card row that no longer exists, and nothing at all for
 * three of the six sections. A skeleton that does not match is worse than none,
 * because it promises a shape and then the content arrives somewhere else — the
 * page appears to jump, which is the exact thing a skeleton exists to prevent.
 *
 * If you move a band on the dashboard, move it here. The two are a pair.
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 pb-12" aria-hidden="true">
      {/* 1. Greeting + scope filter. Plain content on the canvas, NOT a card —
             the old skeleton drew a bordered card here and the real page has
             none, so the whole page shifted up when it loaded. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skel className="h-12 w-12 flex-none rounded-[12px]" />
          <Skel className="h-6 w-56" />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Skel className="h-9 w-32 rounded-[8px]" />
          <Skel className="h-9 w-40 rounded-[8px]" />
        </div>
      </div>

      {/* 2. Header block + the six-across stat row */}
      <div className="overflow-hidden rounded-[12px] border border-[var(--adm-line)] bg-[var(--adm-surface)]">
        <div className="p-6">
          <div className="grid grid-cols-2 gap-y-5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={i > 0 ? "lg:border-l lg:border-[var(--adm-line)] lg:px-5" : "lg:px-5"}>
                <Skel className="h-3 w-20" />
                <Skel className="mt-2 h-7 w-14" />
                <Skel className="mt-2 h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. State card + volume charts (charts take two thirds) */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Skel className="h-[410px] rounded-[12px]" />
        <div className="grid gap-4 lg:col-span-2">
          <Skel className="h-[197px] rounded-[12px]" />
          <Skel className="h-[197px] rounded-[12px]" />
        </div>
      </div>

      {/* 4 and 5 are `space-y-3` wrappers, each a small section LABEL above its
          grid — not bare grids. Leaving the label out shifted everything below
          by ~24px twice over, which is precisely the jump a skeleton is for. */}
      <div className="space-y-3">
        <Skel className="h-3 w-44" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skel className="h-[524px] rounded-[12px]" />
          <Skel className="h-[524px] rounded-[12px]" />
        </div>
      </div>

      <div className="space-y-3">
        <Skel className="h-3 w-40" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skel className="h-[372px] rounded-[12px]" />
          <Skel className="h-[372px] rounded-[12px]" />
        </div>
      </div>

      {/* 6. Recent activity + throughput, split three/two */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Skel className="h-[477px] rounded-[12px] lg:col-span-3" />
        <Skel className="h-[477px] rounded-[12px] lg:col-span-2" />
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

/** Card grid skeleton — matches a 3-up or 4-up responsive card layout. */
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
        <div key={i} className="rounded-[6px] border border-[var(--adm-line)] bg-[var(--adm-surface)] p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <Skel className="h-4 w-3/4" />
              <Skel className="h-3 w-1/2" />
            </div>
            <Skel className="h-6 w-16 rounded-[4px] flex-shrink-0 ml-2" />
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
