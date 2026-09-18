import { Skel } from "@/components/admin/skeletons";

/** Mirrors the first step of "New applicant": header, then the two-way choice card. */
export default function NewApplicationLoading() {
  return (
    <div className="space-y-4 lg:space-y-5" aria-busy="true" aria-label="Loading">
      <div className="space-y-2">
        <Skel className="h-3.5 w-12" />
        <Skel className="h-6 w-40" />
        <Skel className="h-3.5 w-72 max-w-full" />
      </div>
      <div className="rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
        <div className="space-y-1.5 border-b border-[var(--adm-line-soft)] px-4 py-3">
          <Skel className="h-4 w-64 max-w-full" />
          <Skel className="h-3 w-80 max-w-full" />
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="space-y-2.5 rounded-[12px] border border-[var(--adm-line)] p-4">
              <Skel className="h-4 w-40" />
              <Skel className="h-3 w-full" />
              <Skel className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
