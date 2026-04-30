export default function JobDetailLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-100 rounded-lg" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-gray-200 rounded-lg" />
            <div className="flex items-center gap-2">
              <div className="h-5 w-16 bg-gray-100 rounded-full" />
              <div className="h-4 w-24 bg-gray-100 rounded" />
              <div className="h-4 w-20 bg-gray-100 rounded" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-20 bg-gray-100 rounded-lg" />
          <div className="h-9 w-24 bg-blue-100 rounded-lg" />
        </div>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-1.5 shadow-sm">
            <div className="h-3 w-16 bg-gray-100 rounded" />
            <div className="h-5 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 px-4 gap-1 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={`h-9 w-24 rounded-t-lg ${i === 0 ? "bg-blue-100" : "bg-gray-100"}`} />
          ))}
        </div>
        <div className="p-5 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded" style={{ width: `${85 - i * 5}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
