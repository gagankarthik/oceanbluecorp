import { Skel } from "@/components/admin/skeletons";

const card = "overflow-hidden rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]";

/** Mirrors the enquiry record: RecordHeader, message card, and the rail (stacked below lg). */
export default function ContactLoading() {
  return (
    <div className="pb-10" aria-busy="true" aria-label="Loading enquiry">
      <div className="mb-5">
        <Skel className="mb-3 h-3.5 w-20" />
        <div className="flex flex-wrap items-center gap-2.5">
          <Skel className="h-7 w-56 max-w-[60vw]" />
          <Skel className="h-6 w-20 rounded-full" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <Skel className="h-3.5 w-44" />
          <Skel className="h-3.5 w-28" />
          <Skel className="h-3.5 w-32" />
          <Skel className="h-3.5 w-36" />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className={card}>
          <div className="flex min-h-12 flex-col justify-center gap-1.5 border-b border-[var(--adm-line-soft)] px-4 py-2.5">
            <Skel className="h-4 w-24" />
            <Skel className="h-3 w-36" />
          </div>
          <div className="max-w-[70ch] space-y-2.5 p-4 sm:p-5">
            {["w-full", "w-11/12", "w-full", "w-10/12", "w-full", "w-8/12"].map((w, i) => (
              <Skel key={i} className={`h-3.5 ${w}`} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 lg:grid-cols-1">
          <div className={card}>
            <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
              <Skel className="h-4 w-20" />
            </div>
            <div className="space-y-2 p-4">
              <Skel className="h-9 w-full rounded-[9px]" />
              <Skel className="h-9 w-full rounded-[9px]" />
              <div className="flex items-center justify-between pt-2">
                <Skel className="h-3.5 w-12" />
                <Skel className="h-9 w-28 rounded-[9px]" />
              </div>
            </div>
          </div>
          <div className={card}>
            <div className="flex min-h-12 items-center border-b border-[var(--adm-line-soft)] px-4">
              <Skel className="h-4 w-28" />
            </div>
            <div className="divide-y divide-[var(--adm-line-soft)]">
              {Array.from({ length: 6 }).map((_, r) => (
                <div key={r} className="flex items-center justify-between gap-3 px-4 py-3">
                  <Skel className="h-3.5 w-20" />
                  <Skel className="h-3.5 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
