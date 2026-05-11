export default function JobsLoading() {
  return (
    <div className="space-y-5 pb-10 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-slate-200 rounded-lg" />
          <div className="h-4 w-56 bg-slate-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-20 bg-slate-100 rounded" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-7 w-12 bg-slate-200 rounded" />
            <div className="h-2.5 w-28 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="h-9 flex-1 min-w-[160px] bg-slate-100 rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-slate-100 rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/70">
          <div className="h-3 w-4 bg-slate-200 rounded" />
          <div className="h-3 flex-1 max-w-[180px] bg-slate-200 rounded" />
          <div className="h-3 w-20 bg-slate-100 rounded hidden sm:block" />
          <div className="h-3 w-16 bg-slate-100 rounded hidden md:block" />
          <div className="h-3 w-16 bg-slate-100 rounded" />
          <div className="h-3 w-10 bg-slate-100 rounded" />
        </div>
        <div className="divide-y divide-slate-50">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-4 bg-slate-100 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-44 bg-slate-200 rounded" />
                <div className="h-2.5 w-24 bg-slate-100 rounded" />
              </div>
              <div className="h-3 w-20 bg-slate-100 rounded hidden sm:block" />
              <div className="h-3 w-16 bg-slate-100 rounded hidden md:block" />
              <div className="h-5 w-16 bg-blue-100 rounded-full" />
              <div className="h-3 w-6 bg-slate-100 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
