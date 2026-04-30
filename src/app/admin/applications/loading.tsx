export default function ApplicationsLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-36 bg-gray-200 rounded-lg" />
          <div className="h-4 w-52 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-32 bg-blue-100 rounded-lg" />
      </div>

      {/* Pipeline strip */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-1 h-14 bg-gray-100 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Filter row */}
      <div className="flex gap-3">
        <div className="flex-1 h-9 bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="h-10 bg-gray-50 border-b border-gray-200" />
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-100 last:border-0">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-32 bg-gray-200 rounded" />
              <div className="h-3 w-40 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-32 bg-gray-100 rounded hidden sm:block" />
            <div className="h-6 w-20 bg-gray-100 rounded-full" />
            <div className="h-4 w-20 bg-gray-100 rounded hidden md:block" />
            <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
