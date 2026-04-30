export default function JobsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-lg" />
          <div className="h-4 w-52 bg-gray-100 rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-100 rounded-lg" />
          <div className="h-9 w-24 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-l-4 border-gray-200 rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
            <div className="space-y-1.5">
              <div className="h-6 w-10 bg-gray-200 rounded" />
              <div className="h-3 w-20 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-3 shadow-sm">
        <div className="h-9 w-full bg-gray-100 rounded-lg" />
        <div className="flex gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 w-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-3 w-24 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-28 bg-gray-100 rounded" />
            <div className="h-4 w-24 bg-gray-100 rounded" />
            <div className="h-6 w-16 bg-gray-100 rounded-full" />
            <div className="h-4 w-20 bg-gray-100 rounded" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
