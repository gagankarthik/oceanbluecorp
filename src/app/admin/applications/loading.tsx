export default function ApplicationsLoading() {
  return (
    <div className="space-y-5 pb-10 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-slate-200 rounded-lg" />
          <div className="h-4 w-52 bg-slate-100 rounded-lg" />
        </div>
        <div className="h-9 w-36 bg-[var(--hz-cobalt-100)] rounded-lg" />
      </div>

      {/* Pipeline strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl p-3 space-y-1.5 bg-slate-50">
              <div className="h-2.5 w-14 bg-slate-200 rounded mx-auto" />
              <div className="h-6 w-8 bg-slate-300 rounded mx-auto" />
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px] h-9 bg-slate-100 rounded-lg" />
        <div className="h-9 w-28 bg-slate-100 rounded-lg" />
        <div className="h-9 w-28 bg-slate-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="flex-1 h-3 max-w-[140px] bg-slate-200 rounded" />
          <div className="h-3 w-28 bg-slate-100 rounded hidden sm:block" />
          <div className="h-5 w-20 bg-slate-100 rounded-full" />
          <div className="h-3 w-20 bg-slate-100 rounded hidden md:block" />
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5">
              <div className="w-9 h-9 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-36 bg-slate-200 rounded" />
                <div className="h-2.5 w-44 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-32 bg-slate-100 rounded hidden sm:block" />
              <div className="h-5 w-20 bg-[var(--hz-cobalt-100)] rounded-full" />
              <div className="h-3 w-20 bg-slate-100 rounded hidden md:block" />
              <div className="w-7 h-7 bg-slate-100 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
