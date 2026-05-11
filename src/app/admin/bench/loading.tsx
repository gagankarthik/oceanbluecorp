export default function BenchLoading() {
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
          <div className="h-9 w-32 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px] h-9 bg-slate-100 rounded-lg" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-24 bg-slate-100 rounded-lg" />
        ))}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-28 bg-slate-200 rounded" />
                <div className="h-2.5 w-36 bg-slate-100 rounded" />
              </div>
              <div className="h-5 w-14 bg-blue-100 rounded-full" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-5 w-16 bg-slate-100 rounded-full" />
              ))}
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <div className="h-2.5 w-20 bg-slate-100 rounded" />
                <div className="h-2.5 w-8 bg-slate-100 rounded" />
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full" />
            </div>
            <div className="flex gap-2 pt-1 border-t border-slate-50">
              <div className="h-7 flex-1 bg-slate-100 rounded-lg" />
              <div className="h-7 flex-1 bg-blue-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
