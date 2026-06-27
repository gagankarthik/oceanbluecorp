import { cn } from "@/lib/utils";

/** Single pulsing placeholder block. */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

/** Plain divide-y rows — drop inside an existing card/table container while data loads. */
export function AdminRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5">
          <div className="h-9 w-9 flex-shrink-0 animate-pulse rounded-full bg-slate-200/70" />
          <div className="flex-1 space-y-1.5">
            <Skel className="h-3.5 w-1/3" />
            <Skel className="h-2.5 w-1/4" />
          </div>
          <Skel className="hidden h-3 w-24 sm:block" />
          <Skel className="h-6 w-20 rounded-full" />
          <Skel className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Full-page list view: header + optional stat cards + filter bar + table. */
export function AdminListSkeleton({ stats = 0, rows = 8 }: { stats?: number; rows?: number }) {
  return (
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading…">
      {/* header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skel className="h-6 w-44" />
          <Skel className="h-3.5 w-60 max-w-[60vw]" />
        </div>
        <div className="flex gap-2">
          <Skel className="hidden h-9 w-24 sm:block" />
          <Skel className="h-9 w-32" />
        </div>
      </div>

      {/* stat cards */}
      {stats > 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: stats }).map((_, i) => (
            <div key={i} className="space-y-2 rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="flex items-center justify-between">
                <Skel className="h-3.5 w-20" />
                <Skel className="h-8 w-8 rounded-lg" />
              </div>
              <Skel className="h-6 w-12" />
              <Skel className="h-2.5 w-24" />
            </div>
          ))}
        </div>
      )}

      {/* filter bar */}
      <div className="flex flex-wrap gap-3">
        <Skel className="h-10 min-w-[160px] flex-1" />
        <Skel className="h-10 w-28" />
        <Skel className="h-10 w-28" />
      </div>

      {/* table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
          <div className="h-3.5 w-9" />
          <Skel className="h-3 w-32 max-w-[40%] flex-1" />
          <Skel className="hidden h-3 w-24 sm:block" />
          <Skel className="h-3 w-16" />
        </div>
        <AdminRowsSkeleton rows={rows} />
      </div>
    </div>
  );
}

/** Detail view: header + 2-column content/aside. */
export function AdminDetailSkeleton() {
  return (
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading…">
      <div className="flex items-center gap-3">
        <Skel className="h-9 w-9 flex-shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Skel className="h-6 w-52" />
          <Skel className="h-3 w-36" />
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {Array.from({ length: 2 }).map((_, s) => (
            <div key={s} className="space-y-3 rounded-2xl border border-slate-200/80 bg-white p-5">
              <Skel className="h-4 w-40" />
              {["w-full", "w-11/12", "w-full", "w-10/12", "w-9/12"].map((w, i) => (
                <Skel key={i} className={`h-3.5 ${w}`} />
              ))}
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-5">
            <div className="h-16 w-16 animate-pulse rounded-full bg-slate-200/70" />
            <Skel className="h-4 w-32" />
            <Skel className="h-3 w-24" />
          </div>
          <div className="space-y-2.5 rounded-2xl border border-slate-200/80 bg-white p-5">
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
        <Skel className="h-9 w-9 flex-shrink-0 rounded-lg" />
        <div className="space-y-2">
          <Skel className="h-6 w-52" />
          <Skel className="h-3 w-36" />
        </div>
      </div>
      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-5 rounded-2xl border border-slate-200/80 bg-white p-6">
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
          className="flex w-64 flex-shrink-0 flex-col gap-2 rounded-2xl border border-slate-200/80 bg-slate-50 p-3"
        >
          {/* Column header */}
          <div className="flex items-center gap-2 px-1 pb-1">
            <Skel className="h-5 w-5 rounded-full" />
            <Skel className="h-3.5 w-24" />
            <Skel className="ml-auto h-4 w-6 rounded-full" />
          </div>
          {/* Cards */}
          {Array.from({ length: cardsPerColumn }).map((_, i) => (
            <div
              key={i}
              className="space-y-2.5 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm"
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
                <Skel className="h-5 w-16 rounded-full" />
                <Skel className="h-5 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/** Dashboard skeleton — stat cards + chart placeholder + recent list. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-5 pb-10" aria-hidden="true" aria-label="Loading dashboard…">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
            <div className="flex items-start justify-between">
              <Skel className="h-10 w-10 rounded-xl" />
              <Skel className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skel className="h-7 w-16" />
              <Skel className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Main chart area */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skel className="h-4 w-40" />
            <Skel className="h-8 w-32 rounded-lg" />
          </div>
          <Skel className="h-48 w-full rounded-xl" />
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-4">
          <Skel className="h-4 w-32" />
          <div className="flex justify-center">
            <Skel className="h-40 w-40 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skel className="h-3 w-3 rounded-full" />
                <Skel className="h-3 flex-1" />
                <Skel className="h-3 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent activity list */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Skel className="h-7 w-7 rounded-lg" />
          <Skel className="h-4 w-36" />
        </div>
        <AdminRowsSkeleton rows={5} />
      </div>
    </div>
  );
}

/** Chart section skeleton — use inside a card while chart data loads. */
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
              className="flex-1 animate-pulse rounded-t-sm bg-slate-200/70"
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
        <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-5 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5 flex-1">
              <Skel className="h-4 w-3/4" />
              <Skel className="h-3 w-1/2" />
            </div>
            <Skel className="h-6 w-16 rounded-full flex-shrink-0 ml-2" />
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
