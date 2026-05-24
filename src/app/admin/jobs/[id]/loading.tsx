export default function JobDetailLoading() {
  return (
    <div className="space-y-5 pb-10 animate-pulse">
      {/* Back + header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-slate-100 rounded-lg flex-shrink-0" />
          <div className="space-y-2">
            <div className="h-6 w-52 bg-slate-200 rounded-lg" />
            <div className="flex flex-wrap items-center gap-2">
              <div className="h-5 w-16 bg-[var(--hz-cobalt-100)] rounded-full" />
              <div className="h-4 w-24 bg-slate-100 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <div className="h-9 w-20 bg-slate-100 rounded-lg" />
          <div className="h-9 w-28 bg-[var(--hz-cobalt-100)] rounded-lg" />
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-1.5">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-5 w-28 bg-slate-200 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs + content */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-4 pt-1 gap-1">
          {["Description", "Applications", "Activity"].map((tab, i) => (
            <div key={tab} className={`h-9 w-28 rounded-t-lg ${i === 0 ? "bg-[var(--hz-cobalt-100)]" : "bg-slate-50"}`} />
          ))}
        </div>
        <div className="p-5 space-y-4">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-3.5 bg-slate-100 rounded" style={{ width: `${90 - i * 6}%` }} />
          ))}
          <div className="h-4 w-20 bg-slate-200 rounded mt-6" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-3.5 bg-slate-100 rounded" style={{ width: `${75 - i * 8}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
