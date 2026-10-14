import { HeaderSkeleton, PanelSkeleton, TableSkeleton } from "@/components/portal/kit/skeletons";

// Header, bank health, then the file table: the page's own order.
export default function Loading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading the resume bank" className="mx-auto grid w-full min-w-0 max-w-[1600px] content-start gap-6">
      <HeaderSkeleton actions={2} />
      <PanelSkeleton height="h-24" />
      <TableSkeleton rows={8} />
      <span className="sr-only">Loading the resume bank</span>
    </div>
  );
}
