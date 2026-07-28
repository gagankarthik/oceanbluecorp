export default function AdminLoading() {
  return (
    <div className="space-y-5 pb-10">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-[var(--adm-line-soft)] rounded-lg animate-pulse" />
          <div className="h-4 w-72 bg-[var(--adm-line-soft)] rounded-lg animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-[var(--adm-line-soft)] rounded-lg animate-pulse" />
          <div className="h-9 w-24 bg-[var(--adm-line-soft)] rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-[var(--adm-accent-soft)] rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Hero band skeleton */}
      <div className="rounded-[6px] overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="space-y-3 flex-shrink-0">
            <div className="h-5 w-32 bg-[var(--adm-surface)]/10 rounded-full animate-pulse" />
            <div className="h-7 w-52 bg-[var(--adm-surface)]/15 rounded-lg animate-pulse" />
            <div className="h-4 w-64 bg-[var(--adm-surface)]/10 rounded-lg animate-pulse" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 flex-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-[4px] p-3.5 space-y-2" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}>
                <div className="h-3 w-20 bg-[var(--adm-surface)]/20 rounded animate-pulse" />
                <div className="h-8 w-14 bg-[var(--adm-surface)]/25 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-[var(--adm-line-soft)] rounded animate-pulse" />
              <div className="h-3 w-24 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-7 w-9 bg-[var(--adm-line-soft)] rounded-md animate-pulse" />
              ))}
            </div>
          </div>
          <div className="h-[200px] sm:h-[240px] bg-gradient-to-b from-[var(--adm-accent-soft)] to-slate-50 rounded-[4px] animate-pulse" />
          <div className="flex gap-4 pt-1 border-t border-[var(--adm-line-soft)]">
            <div className="h-3 w-16 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            <div className="h-3 w-12 bg-[var(--adm-line-soft)] rounded animate-pulse" />
          </div>
        </div>
        <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-5 flex flex-col gap-5">
          <div className="space-y-1.5">
            <div className="h-4 w-40 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            <div className="h-3 w-28 bg-[var(--adm-line-soft)] rounded animate-pulse" />
          </div>
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-full border-[22px] border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)] animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[var(--adm-line-soft)] animate-pulse" />
                <div className="h-3 flex-1 bg-[var(--adm-line-soft)] rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-5 space-y-4">
            <div className="space-y-1.5">
              <div className="h-4 w-32 bg-[var(--adm-line-soft)] rounded animate-pulse" />
              <div className="h-3 w-44 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} className="space-y-1">
                  <div className="flex justify-between">
                    <div className="h-3 w-20 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                    <div className="h-3 w-8 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                  </div>
                  <div className="h-2 bg-[var(--adm-line-soft)] rounded-full overflow-hidden animate-pulse">
                    <div className="h-full bg-[var(--adm-accent-soft)] rounded-full" style={{ width: `${80 - j * 12}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--adm-line-soft)] flex justify-between">
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-[var(--adm-line-soft)] rounded animate-pulse" />
              <div className="h-3 w-24 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            </div>
            <div className="h-4 w-14 bg-[var(--adm-line-soft)] rounded animate-pulse" />
          </div>
          <div className="divide-y divide-[var(--adm-line-soft)]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-[var(--adm-line-soft)] flex-shrink-0 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                  <div className="h-2.5 w-20 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                </div>
                <div className="h-5 w-16 bg-[var(--adm-line-soft)] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-5 space-y-3">
            <div className="h-4 w-32 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-3 pt-2 border-t border-[var(--adm-line-soft)] first:border-0 first:pt-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--adm-line-soft)] flex-shrink-0 animate-pulse" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-40 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                  <div className="h-2.5 w-52 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
          <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-5 space-y-3 flex-1">
            <div className="h-4 w-36 bg-[var(--adm-line-soft)] rounded animate-pulse" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <div className="h-3 w-24 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                  <div className="h-3 w-10 bg-[var(--adm-line-soft)] rounded animate-pulse" />
                </div>
                <div className="h-1.5 bg-[var(--adm-line-soft)] rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
