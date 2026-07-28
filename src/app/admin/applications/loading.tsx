/**
 * Loading state for the Applications workspace.
 *
 * Mirrors the real layout band for band — header, view tabs, toolbar, grid —
 * so nothing jumps when the data lands. A skeleton whose shape differs from the
 * screen it precedes is just a different kind of flash.
 */
export default function ApplicationsLoading() {
  return (
    <div className="-mx-5 -mt-5 flex min-h-[calc(100vh-4rem)] animate-pulse flex-col border-t border-[var(--adm-line)] bg-[var(--adm-surface)] lg:-mx-6 lg:-mt-6">
      {/* Header band */}
      <div className="flex items-center justify-between gap-4 border-b border-[var(--adm-line)] px-4 py-2.5 lg:px-5">
        <div className="flex items-baseline gap-3">
          <div className="h-5 w-32 rounded-[5px] bg-[var(--adm-line-soft)]" />
          <div className="h-3.5 w-24 rounded-[4px] bg-[var(--adm-line-soft)]" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-8 w-24 rounded-[6px] bg-[var(--adm-line-soft)]" />
          <div className="h-8 w-32 rounded-[6px] bg-[var(--adm-accent-soft)]" />
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center gap-1 border-b border-[var(--adm-line)] px-2 lg:px-3">
        {[64, 88, 104, 96, 84, 68, 72].map((w, i) => (
          <div key={i} className="flex h-9 items-center px-2.5">
            <div className="h-3.5 rounded-[4px] bg-[var(--adm-line-soft)]" style={{ width: w }} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1.5 border-b border-[var(--adm-line)] bg-[var(--adm-surface-sunken)] px-2 py-1.5 lg:px-3">
        <div className="h-8 w-[260px] rounded-[6px] bg-[var(--adm-surface)]" />
        <div className="h-8 w-20 rounded-[6px] bg-[var(--adm-surface)]" />
        <div className="h-8 w-24 rounded-[6px] bg-[var(--adm-surface)]" />
        <div className="h-8 w-20 rounded-[6px] bg-[var(--adm-surface)]" />
        <div className="ml-auto flex gap-1.5">
          <div className="h-8 w-20 rounded-[6px] bg-[var(--adm-surface)]" />
          <div className="h-8 w-12 rounded-[6px] bg-[var(--adm-surface)]" />
          <div className="h-8 w-12 rounded-[6px] bg-[var(--adm-surface)]" />
        </div>
      </div>

      {/* Grid header */}
      <div className="flex h-9 items-center gap-3 border-b border-[var(--adm-line)] bg-[var(--adm-head)] px-4">
        {[80, 70, 70, 50, 60, 56, 54, 60].map((w, i) => (
          <div key={i} className="h-3 rounded-[3px] bg-[var(--adm-line-soft)]" style={{ width: w }} />
        ))}
      </div>

      {/* Rows, at the 40px default density */}
      <div>
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex h-10 items-center gap-3 border-b border-[var(--adm-line-soft)] px-4">
            <div className="h-6 w-6 flex-none rounded-full bg-[var(--adm-line-soft)]" />
            <div className="h-3.5 rounded-[4px] bg-[var(--adm-line-soft)]" style={{ width: 130 - (i % 3) * 18 }} />
            <div className="hidden h-3 rounded-[4px] bg-[var(--adm-line-soft)] lg:block" style={{ width: 170 - (i % 4) * 20 }} />
            <div className="hidden h-3 rounded-[4px] bg-[var(--adm-line-soft)] md:block" style={{ width: 150 - (i % 3) * 22 }} />
            <div className="h-6 w-28 rounded-[6px] bg-[var(--adm-line-soft)]" />
            <div className="ml-auto h-3 w-20 rounded-[4px] bg-[var(--adm-line-soft)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
