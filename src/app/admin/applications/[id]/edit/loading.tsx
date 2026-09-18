import { Skel } from "@/components/admin/skeletons";
import { cn } from "@/lib/utils";

function CardSkel({ fields, cols }: { fields: number; cols: string }) {
  return (
    <div className="rounded-[14px] border border-[var(--adm-line)] bg-[var(--adm-surface)] shadow-[var(--adm-shadow-sm)]">
      <div className="border-b border-[var(--adm-line-soft)] px-4 py-4">
        <Skel className="h-4 w-36" />
      </div>
      <div className={cn("grid gap-4 p-4", cols)}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skel className="h-3.5 w-24" />
            <Skel className="h-9 w-full rounded-[10px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Same shape as the page's own EditSkeleton; overrides the applications list skeleton. */
export default function EditApplicationLoading() {
  return (
    <div className="space-y-4 lg:space-y-5" aria-busy="true" aria-label="Loading applicant">
      <div className="space-y-2">
        <Skel className="h-3.5 w-12" />
        <Skel className="h-6 w-56" />
        <Skel className="h-3.5 w-44" />
      </div>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CardSkel fields={4} cols="grid-cols-1 sm:grid-cols-2" />
          <CardSkel fields={2} cols="grid-cols-1 sm:grid-cols-2" />
          <CardSkel fields={2} cols="grid-cols-1" />
        </div>
        <div className="space-y-4">
          <CardSkel fields={4} cols="grid-cols-1" />
          <CardSkel fields={1} cols="grid-cols-1" />
        </div>
      </div>
    </div>
  );
}
