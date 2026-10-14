import { HeaderSkeleton, PanelSkeleton } from "@/components/portal/kit/skeletons";

/** Mirrors lead sourcing: header with back link, then the find-candidates panel. */
export default function LeadSourcingLoading() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading lead sourcing" className="mx-auto grid w-full min-w-0 max-w-5xl content-start gap-6">
      <HeaderSkeleton back actions={0} />
      <PanelSkeleton height="h-10" />
      <span className="sr-only">Loading lead sourcing</span>
    </div>
  );
}
