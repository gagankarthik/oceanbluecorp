export default function AdminLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-gray-200 rounded-lg" />
          <div className="h-4 w-64 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-gray-100 rounded-lg" />
          <div className="h-9 w-24 bg-gray-100 rounded-lg" />
          <div className="h-9 w-28 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="w-8 h-8 bg-gray-100 rounded-lg" />
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded" />
            <div className="h-3 w-32 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
          <div className="h-[260px] bg-gray-50 rounded-lg" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-4 w-16 bg-gray-100 rounded" />
                <div className="flex-1 h-7 bg-gray-100 rounded-lg" style={{ width: `${90 - i * 15}%` }} />
                <div className="h-6 w-10 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pipeline strip */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 h-16 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
