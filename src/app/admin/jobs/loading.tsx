export default function JobsLoading() {
  return (
    <div className="space-y-5 pb-10 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-32 bg-[var(--adm-line-soft)] rounded-lg" />
          <div className="h-4 w-56 bg-[var(--adm-line-soft)] rounded-lg" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-9 bg-[var(--adm-line-soft)] rounded-lg" />
          <div className="h-9 w-28 bg-[var(--adm-accent-soft)] rounded-lg" />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[var(--adm-surface)] border border-[var(--adm-line)] rounded-[6px] shadow-sm p-4 space-y-2">
            <div className="flex justify-between items-center">
              <div className="h-3.5 w-20 bg-[var(--adm-line-soft)] rounded" />
              <div className="w-8 h-8 bg-[var(--adm-line-soft)] rounded-lg" />
            </div>
            <div className="h-7 w-12 bg-[var(--adm-line-soft)] rounded" />
            <div className="h-2.5 w-28 bg-[var(--adm-line-soft)] rounded" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm p-4 flex flex-wrap gap-3">
        <div className="h-9 flex-1 min-w-[160px] bg-[var(--adm-line-soft)] rounded-lg" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-[var(--adm-line-soft)] rounded-lg" />
        ))}
      </div>

      {/* Table */}
      <div className="bg-[var(--adm-surface)] rounded-[6px] border border-[var(--adm-line)] shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 px-5 py-3 border-b border-[var(--adm-line-soft)] bg-[var(--adm-surface-sunken)]/70">
          <div className="h-3 w-4 bg-[var(--adm-line-soft)] rounded" />
          <div className="h-3 flex-1 max-w-[180px] bg-[var(--adm-line-soft)] rounded" />
          <div className="h-3 w-20 bg-[var(--adm-line-soft)] rounded hidden sm:block" />
          <div className="h-3 w-16 bg-[var(--adm-line-soft)] rounded hidden md:block" />
          <div className="h-3 w-16 bg-[var(--adm-line-soft)] rounded" />
          <div className="h-3 w-10 bg-[var(--adm-line-soft)] rounded" />
        </div>
        <div className="divide-y divide-[var(--adm-line-soft)]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              <div className="h-4 w-4 bg-[var(--adm-line-soft)] rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-44 bg-[var(--adm-line-soft)] rounded" />
                <div className="h-2.5 w-24 bg-[var(--adm-line-soft)] rounded" />
              </div>
              <div className="h-3 w-20 bg-[var(--adm-line-soft)] rounded hidden sm:block" />
              <div className="h-3 w-16 bg-[var(--adm-line-soft)] rounded hidden md:block" />
              <div className="h-5 w-16 bg-[var(--adm-accent-soft)] rounded-full" />
              <div className="h-3 w-6 bg-[var(--adm-line-soft)] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
