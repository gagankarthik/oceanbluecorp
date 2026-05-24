import { cn } from "@/lib/utils";

/** Single pulsing placeholder block. */
export function Skel({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-slate-200/70", className)} />;
}

/** Plain divide-y rows — drop inside an existing card/table container while data loads. */
export function AdminRowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
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
    <div className="space-y-5 pb-10">
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
    <div className="space-y-5 pb-10">
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
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
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
