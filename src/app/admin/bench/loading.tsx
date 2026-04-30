export default function BenchLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-gray-200 rounded-lg" />
          <div className="h-4 w-56 bg-gray-100 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-gray-100 rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-36 bg-gray-100 rounded" />
              </div>
            </div>
            <div className="flex gap-1.5">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-5 w-16 bg-gray-100 rounded-full" />
              ))}
            </div>
            <div className="h-3 w-full bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
